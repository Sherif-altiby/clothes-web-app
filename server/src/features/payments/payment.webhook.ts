// payment.webhook.ts
// Handlers for verified Stripe events. Every handler is idempotent: Stripe retries
// deliveries and may send the same event twice, even concurrently.
import Stripe from "stripe";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "../../prisma";
import { STRIPE_CURRENCY } from "../../config/stripe";
import { refundPayment, toCents } from "../../shared/services/stripe.service";
import { cancelOrderInTx } from "../orders/order.services";

const getOrderId = (session: Stripe.Checkout.Session): string | null =>
    session.metadata?.orderId ?? session.client_reference_id ?? null;

const getPaymentIntentId = (pi: string | { id: string } | null): string | null =>
    typeof pi === "string" ? pi : pi?.id ?? null;

/* -------------------------- checkout.session.completed -------------------------- */

const handleSessionPaid = async (session: Stripe.Checkout.Session) => {
    const orderId = getOrderId(session);
    const order = orderId ? await prisma.order.findUnique({ where: { id: orderId } }) : null;

    if (!order) {
        // Return normally: retrying will never make a missing order appear
        console.error(`[STRIPE] paid session ${session.id} has no matching order`);
        return;
    }

    if (order.paymentStatus !== PaymentStatus.UNPAID) return; // duplicate delivery

    // Never trust that "paid" means "paid the right amount"
    if (session.amount_total !== toCents(order.total) || session.currency !== STRIPE_CURRENCY) {
        console.error(
            `[STRIPE] amount mismatch on order ${order.id}: ` +
                `got ${session.amount_total} ${session.currency}, expected ${toCents(order.total)} ${STRIPE_CURRENCY}`
        );
        return;
    }

    const paymentIntentId = getPaymentIntentId(session.payment_intent);

    // Compare-and-set: only the first delivery can flip UNPAID -> PAID
    const claimed = await prisma.order.updateMany({
        where: { id: order.id, status: OrderStatus.PENDING, paymentStatus: PaymentStatus.UNPAID },
        data: {
            paymentStatus: PaymentStatus.PAID,
            paidAt: new Date(),
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
        },
    });

    if (claimed.count === 1) return;

    // Claim failed. If the order was cancelled before the money arrived, give it back.
    const current = await prisma.order.findUnique({ where: { id: order.id } });

    if (
        current?.status === OrderStatus.CANCELLED &&
        current.paymentStatus === PaymentStatus.UNPAID &&
        paymentIntentId
    ) {
        // Refund first, then record it. If the refund throws, Stripe retries this event,
        // and the idempotency key makes the repeated refund call harmless.
        await refundPayment(paymentIntentId, `refund-order-${current.id}`);

        await prisma.order.updateMany({
            where: { id: current.id, paymentStatus: PaymentStatus.UNPAID },
            data: {
                paymentStatus: PaymentStatus.REFUNDED,
                refundedAt: new Date(),
                stripePaymentIntentId: paymentIntentId,
            },
        });
    }
};

/* --------------------------- checkout.session.expired --------------------------- */

// Customer never paid within the window: release the reserved stock and coupon
const handleSessionExpired = async (session: Stripe.Checkout.Session) => {
    const orderId = getOrderId(session);
    if (!orderId) return;

    // Returns null (no-op) if the order was already paid or cancelled
    await prisma.$transaction((tx) =>
        cancelOrderInTx(tx, orderId, {
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.UNPAID,
            paymentMethod: PaymentMethod.CARD,
        })
    );
};

/* ------------------------------- charge.refunded -------------------------------- */

// Keeps us in sync when a refund is issued from the Stripe Dashboard
const handleChargeRefunded = async (charge: Stripe.Charge) => {
    if (!charge.refunded) return; // partial refund: leave the order as PAID

    const paymentIntentId = getPaymentIntentId(charge.payment_intent);
    if (!paymentIntentId) return;

    await prisma.order.updateMany({
        where: { stripePaymentIntentId: paymentIntentId, paymentStatus: PaymentStatus.PAID },
        data: { paymentStatus: PaymentStatus.REFUNDED, refundedAt: new Date() },
    });
};

/* --------------------------------- Dispatcher ----------------------------------- */

export const handleStripeEvent = async (event: Stripe.Event): Promise<void> => {
    switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
            const session = event.data.object;
            if (session.payment_status === "paid") await handleSessionPaid(session);
            break;
        }
        case "checkout.session.expired":
            await handleSessionExpired(event.data.object);
            break;
        case "charge.refunded":
            await handleChargeRefunded(event.data.object);
            break;
        default:
            break; // ignore everything else
    }
};