// config/stripe.ts
import Stripe from "stripe";

// Fail fast at boot instead of failing on the first customer's payment
const requireEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

export const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    maxNetworkRetries: 2, // safe: every mutating call below carries an idempotency key
    timeout: 20_000,
});

export const STRIPE_WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");

// No trailing slash so we can safely append paths
export const CLIENT_URL = requireEnv("CLIENT_URL").replace(/\/+$/, "");

// Must match the currency your prices are stored in. Lowercase ISO code.
export const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase();

// Stripe rejects card payments below its minimum charge (about $0.50 equivalent)
export const MIN_CARD_AMOUNT_CENTS = 50;