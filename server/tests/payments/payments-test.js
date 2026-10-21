// k6/payments.test.js
//
// Tests the Stripe payment flow WITHOUT a browser:
//   - real card orders are created through your API (a real Stripe test session is made)
//   - "payment" is simulated by sending a correctly SIGNED checkout.session.completed
//     webhook directly to your server (k6 signs it with STRIPE_WEBHOOK_SECRET)
//
// Run (PowerShell):
//   k6 run `
//     -e BASE_URL=http://localhost:4000 `
//     -e STRIPE_WEBHOOK_SECRET=whsec_xxx `
//     -e PRODUCT_ID=<id of a product with plenty of stock> `
//     -e USERS="user1@test.com:Password1,user2@test.com:Password1" `
//     k6/payments.test.js

import http from "k6/http";
import crypto from "k6/crypto";
import { check, fail, sleep } from "k6";
import { Trend } from "k6/metrics";

/* ------------------------------- Config -------------------------------- */

const BASE_URL = (__ENV.BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const WEBHOOK_SECRET = __ENV.STRIPE_WEBHOOK_SECRET; // must equal the server's STRIPE_WEBHOOK_SECRET
const PRODUCT_ID = __ENV.PRODUCT_ID;
const CURRENCY = (__ENV.CURRENCY || "usd").toLowerCase(); // must equal the server's STRIPE_CURRENCY

// ASSUMPTIONS about your API: adjust with -e if yours differ
const LOGIN_PATH = __ENV.LOGIN_PATH || "/api/auth/login";
const CART_PATH = __ENV.CART_PATH || "/api/user/cart"; // POST adds an item
const CART_EXTRA = JSON.parse(__ENV.CART_EXTRA || "{}"); // e.g. {"size":"M"} merged into the add-to-cart body

// "email:password,email2:password2"
const USERS = (__ENV.USERS || "")
    .split(",")
    .filter(Boolean)
    .map((pair) => {
        const i = pair.indexOf(":");
        return { email: pair.slice(0, i), password: pair.slice(i + 1) };
    });

const JSON_HEADERS = { "Content-Type": "application/json" };

// 4xx are EXPECTED in race tests (409 / 400), so only 5xx and network errors count as failures
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));

const orderCreateMs = new Trend("order_create_ms", true);
const webhookMs = new Trend("webhook_ms", true);

export const options = {
    scenarios: {
        // 1. Signature checks (instant)
        webhook_security: {
            executor: "shared-iterations", vus: 1, iterations: 1,
            exec: "webhookSecurity", startTime: "0s", maxDuration: "30s",
        },
        // 2. Full order -> simulated payment -> PAID, several users in parallel
        checkout_flow: {
            executor: "per-vu-iterations",
            vus: Math.max(1, Math.min(USERS.length, Number(__ENV.FLOW_VUS || 2))),
            iterations: Number(__ENV.FLOW_ITERATIONS || 3),
            exec: "checkoutFlow", startTime: "3s", maxDuration: "60s",
        },
        // 3. One user double-clicks "pay": only ONE order may be created
        double_checkout_race: {
            executor: "shared-iterations", vus: 1, iterations: 1,
            exec: "doubleCheckoutRace", startTime: "65s", maxDuration: "60s",
        },
        // 4. Stripe delivers the same webhook many times at once + amount tampering
        duplicate_webhook_race: {
            executor: "shared-iterations", vus: 1, iterations: 1,
            exec: "duplicateWebhookRace", startTime: "130s", maxDuration: "60s",
        },
    },
    thresholds: {
        checks: ["rate==1"], // every correctness check must pass
        http_req_failed: ["rate==0"], // no 5xx / network errors anywhere
        order_create_ms: ["p(95)<3000"],
        webhook_ms: ["p(95)<1000"],
    },
};

export function setup() {
    if (!WEBHOOK_SECRET) fail("Missing -e STRIPE_WEBHOOK_SECRET=whsec_...");
    if (!PRODUCT_ID) fail("Missing -e PRODUCT_ID=<product id with stock>");
    if (USERS.length === 0) fail('Missing -e USERS="email:password,..."');
}

/* ------------------------------- Helpers -------------------------------- */

let authHeaders = null; // module scope = one copy per VU

const userForVu = () => USERS[(__VU - 1) % USERS.length];

const url = (path) => `${BASE_URL}${path}`;

function login() {
    if (authHeaders) return authHeaders;

    const { email, password } = userForVu();
    const res = http.post(url(LOGIN_PATH), JSON.stringify({ email, password }), { headers: JSON_HEADERS });

    if (res.status !== 200) fail(`Login failed (${res.status}) for ${email}: ${res.body}`);

    // Works with cookie auth (k6 keeps the cookie jar per VU) and with bearer tokens in the body
    let body = {};
    try { body = res.json(); } catch (e) { /* not JSON */ }
    const token =
        (body.data && (body.data.accessToken || body.data.token)) || body.accessToken || body.token;

    authHeaders = token ? { ...JSON_HEADERS, Authorization: `Bearer ${token}` } : JSON_HEADERS;
    return authHeaders;
}

function addToCart() {
    const body = { productId: PRODUCT_ID, quantity: 1, ...CART_EXTRA };
    const res = http.post(url(CART_PATH), JSON.stringify(body), { headers: login() });
    check(res, { "cart: item added": (r) => r.status === 200 || r.status === 201 });
}

function createCardOrderRequest() {
    return {
        method: "POST",
        url: url("/api/user/orders"),
        body: JSON.stringify({ paymentMethod: "CARD" }),
        params: { headers: login() },
    };
}

function createCardOrder() {
    const r = createCardOrderRequest();
    const res = http.post(r.url, r.body, r.params);
    orderCreateMs.add(res.timings.duration);
    return res;
}

const getOrder = (orderId) =>
    http.get(url(`/api/user/orders/${orderId}`), { headers: login() }).json("data");

const cancelOrderRequest = (orderId) => ({
    method: "PATCH",
    url: url(`/api/user/orders/${orderId}/cancel`),
    body: null,
    params: { headers: login() },
});

// ---- Stripe webhook simulation ----

function paidEvent(order, overrides = {}) {
    return {
        id: overrides.eventId || `evt_k6_${order.id}`,
        object: "event",
        api_version: "2024-06-20",
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
        type: "checkout.session.completed",
        data: {
            object: {
                id: `cs_test_k6_${order.id}`,
                object: "checkout.session",
                status: "complete",
                payment_status: "paid",
                amount_total: overrides.amountCents !== undefined ? overrides.amountCents : Math.round(order.total * 100),
                currency: CURRENCY,
                payment_intent: `pi_k6_${order.id}`,
                client_reference_id: order.id,
                metadata: { orderId: order.id },
            },
        },
    };
}

// Builds a request Stripe-style: signature = HMAC_SHA256(secret, `${timestamp}.${rawBody}`)
function signedWebhookRequest(event, { secret = WEBHOOK_SECRET, timestamp } = {}) {
    const payload = JSON.stringify(event);
    const t = timestamp || Math.floor(Date.now() / 1000);
    const signature = crypto.hmac("sha256", secret, `${t}.${payload}`, "hex");

    return {
        method: "POST",
        url: url("/api/payments/webhook"),
        body: payload,
        params: { headers: { "Content-Type": "application/json", "Stripe-Signature": `t=${t},v1=${signature}` } },
    };
}

function sendWebhook(event, options) {
    const r = signedWebhookRequest(event, options);
    const res = http.post(r.url, r.body, r.params);
    webhookMs.add(res.timings.duration);
    return res;
}

/* ------------------------------ Scenarios ------------------------------- */

// 1. Nobody can fake a payment
export function webhookSecurity() {
    const dummy = { id: "order_dummy", total: 10 };
    const body = JSON.stringify(paidEvent(dummy));

    const noSig = http.post(url("/api/payments/webhook"), body, { headers: JSON_HEADERS });
    check(noSig, { "webhook: missing signature -> 400": (r) => r.status === 400 });

    const wrongSecret = sendWebhook(paidEvent(dummy), { secret: "whsec_wrong_secret" });
    check(wrongSecret, { "webhook: wrong secret -> 400": (r) => r.status === 400 });

    const oldTimestamp = sendWebhook(paidEvent(dummy), { timestamp: Math.floor(Date.now() / 1000) - 3600 });
    check(oldTimestamp, { "webhook: replayed (old) timestamp -> 400": (r) => r.status === 400 });

    const valid = sendWebhook(paidEvent(dummy));
    check(valid, { "webhook: valid signature, unknown order -> 200 (no retry loop)": (r) => r.status === 200 });
}

// 2. Order -> simulated payment -> PAID
export function checkoutFlow() {
    addToCart();

    const created = createCardOrder();
    const ok = check(created, {
        "order: created (201)": (r) => r.status === 201,
        "order: has Stripe checkoutUrl": (r) => /^https:\/\/checkout\.stripe\.com\//.test(r.json("data.checkoutUrl") || ""),
        "order: starts PENDING + UNPAID": (r) =>
            r.json("data.status") === "PENDING" && r.json("data.paymentStatus") === "UNPAID",
    });
    if (!ok) return;

    const order = created.json("data");

    const hook = sendWebhook(paidEvent(order));
    check(hook, { "webhook: payment accepted (200)": (r) => r.status === 200 });

    const after = getOrder(order.id);
    check(after, {
        "order: now PAID": (o) => o.paymentStatus === "PAID",
        "order: paidAt is set": (o) => !!o.paidAt,
        "order: still PENDING (awaiting shipment)": (o) => o.status === "PENDING",
    });

    sleep(1); // stay well under Stripe's test-mode API rate limit
}

// 3. Double-click / parallel checkout must create exactly ONE order
export function doubleCheckoutRace() {
    addToCart();

    const PARALLEL = 5;
    const responses = http.batch(Array.from({ length: PARALLEL }, () => createCardOrderRequest()));

    const created = responses.filter((r) => r.status === 201);
    const rejected = responses.filter((r) => r.status >= 400 && r.status < 500);

    check(null, {
        "race: exactly ONE order created": () => created.length === 1,
        "race: all the others rejected with 4xx": () => rejected.length === PARALLEL - 1,
    });

    if (created.length === 0) return;
    const orderId = created[0].json("data.id");

    // Parallel cancels: at least one wins, nobody gets a 5xx, final state is CANCELLED
    const cancels = http.batch([cancelOrderRequest(orderId), cancelOrderRequest(orderId), cancelOrderRequest(orderId)]);
    check(null, {
        "race: at least one cancel succeeded (200)": () => cancels.some((r) => r.status === 200),
        "race: no cancel crashed (no 5xx)": () => cancels.every((r) => r.status < 500),
    });
    check(getOrder(orderId), { "race: order ends CANCELLED": (o) => o.status === "CANCELLED" });
}

// 4. Same webhook delivered many times at once + wrong amount
export function duplicateWebhookRace() {
    // --- duplicates ---
    addToCart();
    const created = createCardOrder();
    if (!check(created, { "dup: order created": (r) => r.status === 201 })) return;
    const order = created.json("data");

    const DELIVERIES = 6;
    const event = paidEvent(order);
    const responses = http.batch(Array.from({ length: DELIVERIES }, () => signedWebhookRequest(event)));

    check(null, { "dup: every delivery answered 200": () => responses.every((r) => r.status === 200) });
    check(getOrder(order.id), {
        "dup: order is PAID exactly once": (o) => o.paymentStatus === "PAID",
    });

    // --- tampered amount: attacker "pays" 1 cent for a full-price order ---
    addToCart();
    const victim = createCardOrder();
    if (!check(victim, { "tamper: order created": (r) => r.status === 201 })) return;
    const victimOrder = victim.json("data");

    const tampered = sendWebhook(paidEvent(victimOrder, { amountCents: 1 }));
    check(tampered, { "tamper: webhook answered 200": (r) => r.status === 200 });
    check(getOrder(victimOrder.id), {
        "tamper: order stays UNPAID when amount does not match": (o) => o.paymentStatus === "UNPAID",
    });

    // clean up the unpaid order (releases stock, expires the Stripe session)
    const cancelled = http.patch(url(`/api/user/orders/${victimOrder.id}/cancel`), null, { headers: login() });
    check(cancelled, { "tamper: cleanup cancel succeeded": (r) => r.status === 200 });
}