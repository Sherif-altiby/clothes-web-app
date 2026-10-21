// payment.routes.ts
import express, { Router } from "express";
import { stripeWebhookController } from "./payment.controller";

const router = Router();

// Stripe signs the EXACT raw bytes, so this route needs express.raw (not express.json).
// No auth middleware: authenticity comes from the signature check.
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhookController);

export default router;