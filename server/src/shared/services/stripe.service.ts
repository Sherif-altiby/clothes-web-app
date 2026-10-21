// shared/services/stripe.service.ts
// Thin wrapper around the Stripe SDK. Knows nothing about Prisma or the order DB shape.
import Stripe from "stripe";
import { ApiError } from "../utils/ApiError";
import { CLIENT_URL, STRIPE_CURRENCY, STRIPE_WEBHOOK_SECRET, stripe } from "../../config/stripe";

// Stripe wants the smallest currency unit. Assumes a 2-decimal currency (USD, EUR, EGP...).
export const toCents = (amount: number): number => Math.round(amount * 100);

// Stripe requires an expiry of at least 30 minutes; we add a small buffer
const CHECKOUT_SESSION_TTL_SECONDS = 31 * 60;

export interface CheckoutLineItem {
    name: string;
    unitAmount: number; // in cents
    quantity: number;
}

export interface CreateCheckoutParams {
    orderId: string;
    userId: string;
    locale: "en" | "ar";
    customerEmail?: string;
    lineItems: CheckoutLineItem[];
    payableCents: number; // what the customer must actually pay (after any coupon)
}

export const createCheckoutSession = async (params: CreateCheckoutParams) => {
    const { orderId, userId, locale, customerEmail, lineItems, payableCents } = params;

    const itemsCents = lineItems.reduce((sum, i) => sum + i.unitAmount * i.quantity, 0);
    const discountCents = itemsCents - payableCents;

    if (discountCents < 0) {
        throw new ApiError(500, "Order total is higher than the sum of its items");
    }

    // Our discount is already applied in the order total. Mirror it as a one-time Stripe
    // coupon so the hosted page shows the same amount as the order.
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;

    if (discountCents > 0) {
        const coupon = await stripe.coupons.create(
            {
                amount_off: discountCents,
                currency: STRIPE_CURRENCY,
                duration: "once",
                max_redemptions: 1,
                name: "Discount",
            },
            { idempotencyKey: `coupon-${orderId}` }
        );
        discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(
        {
            mode: "payment",
            line_items: lineItems.map((item) => ({
                quantity: item.quantity,
                price_data: {
                    currency: STRIPE_CURRENCY,
                    unit_amount: item.unitAmount,
                    product_data: { name: item.name },
                },
            })),
            discounts,
            customer_email: customerEmail,
            client_reference_id: orderId,
            metadata: { orderId, userId },
            payment_intent_data: { metadata: { orderId } },
            expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_SECONDS,
            success_url: `${CLIENT_URL}/${locale}/orders/${orderId}?payment=success`,
            cancel_url: `${CLIENT_URL}/${locale}/orders/${orderId}?payment=cancelled`,
        },
        // Same order => same session, even if the request is retried
        { idempotencyKey: `checkout-${orderId}` }
    );

    if (!session.url) {
        throw new ApiError(502, "Payment provider did not return a checkout URL");
    }

    return { sessionId: session.id, url: session.url };
};

export const retrieveCheckoutSession = (sessionId: string) =>
    stripe.checkout.sessions.retrieve(sessionId);

// Closes a session so it can no longer be paid. Throws 409 if the customer already paid.
export const expireCheckoutSession = async (sessionId: string): Promise<void> => {
    try {
        await stripe.checkout.sessions.expire(sessionId);
    } catch (err) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.status === "expired") return; // already closed, nothing to do

        if (session.status === "complete") {
            throw new ApiError(409, "This order has just been paid. Please refresh and try again");
        }

        throw err; // genuine failure (network, auth...)
    }
};

export const refundPayment = (paymentIntentId: string, idempotencyKey: string) =>
    stripe.refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey });

// Throws if the signature is missing or invalid. `rawBody` MUST be the untouched request body.
export const constructWebhookEvent = (rawBody: Buffer, signature: string): Stripe.Event =>
    stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);