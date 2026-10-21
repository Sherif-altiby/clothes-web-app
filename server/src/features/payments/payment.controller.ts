// payment.controller.ts
import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiError } from "../../shared/utils/ApiError";
import { constructWebhookEvent } from "../../shared/services/stripe.service";
import { handleStripeEvent } from "./payment.webhook";

export const stripeWebhookController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers["stripe-signature"];

    if (typeof signature !== "string") {
        throw new ApiError(400, "Missing Stripe signature");
    }

    let event: Stripe.Event;

    try {
        // req.body is a raw Buffer here (see payment.routes.ts)
        event = constructWebhookEvent(req.body, signature);
    } catch {
        throw new ApiError(400, "Invalid webhook signature");
    }

    // If this throws, the error middleware returns 5xx and Stripe retries later
    await handleStripeEvent(event);

    res.status(200).json({ received: true });
});