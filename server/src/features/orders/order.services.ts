// order.services.ts
import { DiscountType, Order, OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { Lang } from "../../shared/middlewares/lang.middleware";
import { localizeOrder } from "../../shared/utils/localize";
import { getShippingCost, round2 } from "../../shared/utils/price";
import { MIN_CARD_AMOUNT_CENTS } from "../../config/stripe";
import {
    createCheckoutSession,
    expireCheckoutSession,
    refundPayment,
    retrieveCheckoutSession,
    toCents,
} from "../../shared/services/stripe.service";
import { resolveProductPrices } from "../offers/offer-pricing";

const orderInclude = {
    items: { include: { product: true } },
    user: { select: { id: true, name: true, email: true, phone: true, address: true } },
} satisfies Prisma.OrderInclude;

// Allowed status changes
const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERING]: [OrderStatus.SUCCESSED, OrderStatus.CANCELLED],
    [OrderStatus.SUCCESSED]: [],
    [OrderStatus.CANCELLED]: [],
};

const isUnpaidCardOrder = (o: Pick<Order, "paymentMethod" | "paymentStatus">) =>
    o.paymentMethod === PaymentMethod.CARD && o.paymentStatus === PaymentStatus.UNPAID;

const isPaidCardOrder = (o: Pick<Order, "paymentMethod" | "paymentStatus">) =>
    o.paymentMethod === PaymentMethod.CARD && o.paymentStatus === PaymentStatus.PAID;

const findOrderOrThrow = (orderId: string) =>
    prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

// Validates the coupon, reserves one use, and returns the discounted total
const redeemCoupon = async (
    tx: Prisma.TransactionClient,
    code: string,
    userId: string,
    subtotal: number
) => {
    const coupon = await tx.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

    if (!coupon || !coupon.isActive) {
        throw new ApiError(400, "Invalid coupon code");
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new ApiError(400, "Coupon has expired");
    }

    if (coupon.minOrderValue !== null && subtotal < coupon.minOrderValue) {
        throw new ApiError(400, `Minimum order value for this coupon is ${coupon.minOrderValue}`);
    }

    if (coupon.userLimit !== null) {
        const used = await tx.couponUsage.count({ where: { couponId: coupon.id, userId } });

        if (used >= coupon.userLimit) {
            throw new ApiError(400, "You have already used this coupon");
        }
    }

    // Reserve one use atomically so maxUses can't be exceeded by concurrent orders
    const reserved = await tx.coupon.updateMany({
        where: {
            id: coupon.id,
            ...(coupon.maxUses !== null && { usedCount: { lt: coupon.maxUses } }),
        },
        data: { usedCount: { increment: 1 } },
    });

    if (reserved.count === 0) {
        throw new ApiError(400, "Coupon usage limit reached");
    }

    const discount =
        coupon.discountType === DiscountType.PERCENTAGE
            ? (subtotal * coupon.discountValue) / 100
            : coupon.discountValue;

    return { couponId: coupon.id, total: round2(Math.max(subtotal - discount, 0)) };
};

/**
 * Cancels an order, returns stock and releases the coupon.
 *
 * `guard` describes the state the order must still be in (e.g. { status: PENDING }).
 * The status flip is a compare-and-set, so if two requests cancel the same order at once
 * (user + admin + Stripe "expired" webhook) exactly ONE wins and restores stock.
 * Returns null when the guard no longer matches (someone else already changed the order).
 */
export const cancelOrderInTx = async (
    tx: Prisma.TransactionClient,
    orderId: string,
    guard: Prisma.OrderWhereInput
) => {
    const claimed = await tx.order.updateMany({
        where: { id: orderId, ...guard },
        data: { status: OrderStatus.CANCELLED },
    });

    if (claimed.count === 0) return null;

    const items = await tx.orderItem.findMany({ where: { orderId } });

    for (const item of items) {
        await tx.product.update({
            where: { id: item.productId },
            data: { counts: { increment: item.quantity } },
        });
    }

    const usage = await tx.couponUsage.findFirst({ where: { orderId } });

    if (usage) {
        await tx.couponUsage.delete({ where: { id: usage.id } });
        await tx.coupon.update({
            where: { id: usage.couponId },
            data: { usedCount: { decrement: 1 } },
        });
    }

    return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
};

// Refunds a paid card order. Safe to call twice: Stripe dedupes on the idempotency key.
const refundOrder = async (orderId: string, paymentIntentId: string | null) => {
    if (!paymentIntentId) {
        console.error(`[REFUND_FAILED] order ${orderId} has no payment intent`);
        return;
    }

    try {
        await refundPayment(paymentIntentId, `refund-order-${orderId}`);

        await prisma.order.updateMany({
            where: { id: orderId, paymentStatus: PaymentStatus.PAID },
            data: { paymentStatus: PaymentStatus.REFUNDED, refundedAt: new Date() },
        });
    } catch (err) {
        // The order is already cancelled. Keep it flagged (CANCELLED + PAID) for manual follow-up.
        console.error(`[REFUND_FAILED] order ${orderId}`, err);
    }
};

// Shared by the user and admin cancel flows
const cancelOrder = async (order: Order, lang: Lang) => {
    // 1. Unpaid card order: close the Stripe session first so it can never be paid afterwards
    if (isUnpaidCardOrder(order) && order.stripeSessionId) {
        await expireCheckoutSession(order.stripeSessionId);
    }

    // 2. Cancel in the DB. Guarding on the state we read means a concurrent webhook
    //    (payment just landed) or another admin action makes this fail instead of corrupting data.
    const cancelled = await prisma.$transaction((tx) =>
        cancelOrderInTx(tx, order.id, { status: order.status, paymentStatus: order.paymentStatus })
    );

    if (!cancelled) {
        const current = await findOrderOrThrow(order.id);

        // Someone else (e.g. the Stripe "expired" webhook) already cancelled it: that's fine
        if (current.status === OrderStatus.CANCELLED) return localizeOrder(current, lang);

        throw new ApiError(409, "Order was updated by another request. Please try again");
    }

    // 3. Paid by card: give the money back
    if (isPaidCardOrder(order)) {
        await refundOrder(order.id, order.stripePaymentIntentId);
        return localizeOrder(await findOrderOrThrow(order.id), lang);
    }

    return localizeOrder(cancelled, lang);
};

const listOrders = async (
    where: Prisma.OrderWhereInput,
    lang: Lang,
    page: number,
    limit: number
) => {
    const [orders, totalItems] = await Promise.all([
        prisma.order.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: orderInclude,
        }),
        prisma.order.count({ where }),
    ]);

    return {
        pagination: {
            totalItems,
            currentPage: page,
            limit,
            totalPages: Math.ceil(totalItems / limit),
        },
        orders: orders.map((o) => localizeOrder(o, lang)),
    };
};

/* -------------------------------------------------------------------------- */
/*                                    User                                    */
/* -------------------------------------------------------------------------- */

// Checkout: turns the user's cart into an order. For CARD it also opens a Stripe Checkout Session.
export const createOrderService = async (
    userId: string,
    lang: Lang,
    paymentMethod: PaymentMethod = PaymentMethod.COD,
    couponCode?: string
) => {
    const order = await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            throw new ApiError(400, "Cart is empty");
        }

        // Claim the cart items first. If a double-click / retry runs this at the same time,
        // the second transaction waits on the row locks, finds 0 rows left, and aborts.
        const claimed = await tx.cartItem.deleteMany({
            where: { id: { in: cart.items.map((i) => i.id) } },
        });

        if (claimed.count !== cart.items.length) {
            throw new ApiError(409, "Your cart changed while checking out. Please try again");
        }

        // Take stock atomically; fails if another order took it first.
        // Sorted so concurrent orders always lock products in the same order (no deadlocks).
        const byProduct = [...cart.items].sort((a, b) => a.productId.localeCompare(b.productId));

        for (const item of byProduct) {
            const updated = await tx.product.updateMany({
                where: {
                    id: item.productId,
                    counts: { gte: item.quantity },
                    categoryId: item.product.categoryId,
                    baseSalary: item.product.baseSalary,
                    profit: item.product.profit,
                    discount: item.product.discount,
                },
                data: { counts: { decrement: item.quantity } },
            });

            if (updated.count === 0) {
                throw new ApiError(409, `Price or available stock changed for "${item.product.titleEn}". Review your cart`);
            }
        }

        const prices = await resolveProductPrices(tx, cart.items.map((item) => item.product));
        const items = cart.items.map((item) => {
            const price = prices.get(item.productId);
            if (!price) throw new ApiError(500, "Could not calculate order item price");
            if (price.unitPrice !== item.unitPrice) {
                throw new ApiError(409, "Cart prices changed. Review your cart before checking out");
            }
            return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: price.unitPrice,
                originalUnitPrice: price.originalUnitPrice,
                discountPercentage: price.discountPercentage,
                offerId: price.offerId,
                offerTitleAr: price.offerTitleAr,
                offerTitleEn: price.offerTitleEn,
            };
        });

        const subtotal = round2(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));

        const shippingCost = getShippingCost(subtotal);
        let total = round2(subtotal + shippingCost);
        let couponId: string | null = null;

        if (couponCode) {
            const redeemed = await redeemCoupon(tx, couponCode, userId, subtotal);
            total = round2(redeemed.total + shippingCost);
            couponId = redeemed.couponId;
        }

        if (paymentMethod === PaymentMethod.CARD && toCents(total) < MIN_CARD_AMOUNT_CENTS) {
            throw new ApiError(400, "Order total is too low for card payment. Please choose cash on delivery");
        }

        const created = await tx.order.create({
            data: { userId, total, shippingCost, paymentMethod, items: { create: items } },
            include: orderInclude,
        });

        if (couponId) {
            await tx.couponUsage.create({
                data: { couponId, userId, orderId: created.id },
            });
        }

        return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
            throw new ApiError(409, "Inventory or offers changed during checkout. Review your cart and try again");
        }
        throw error;
    });

    if (paymentMethod !== PaymentMethod.CARD) {
        return { order: localizeOrder(order, lang), checkoutUrl: null };
    }

    // Card: talk to Stripe AFTER the DB commit. Never hold a DB transaction open on a network call.
    let sessionId: string | undefined;

    try {
        const session = await createCheckoutSession({
            orderId: order.id,
            userId,
            locale: lang,
            customerEmail: order.user.email ?? undefined,
            payableCents: toCents(order.total),
            lineItems: order.items.map((i) => ({
                name: i.product.titleEn,
                unitAmount: toCents(i.unitPrice),
                quantity: i.quantity,
            })).concat(
                order.shippingCost > 0
                    ? [{ name: "Shipping", unitAmount: toCents(order.shippingCost), quantity: 1 }]
                    : []
            ),
        });

        sessionId = session.sessionId;

        await prisma.order.update({
            where: { id: order.id },
            data: { stripeSessionId: session.sessionId },
        });

        return {
            order: localizeOrder({ ...order, stripeSessionId: session.sessionId }, lang),
            checkoutUrl: session.url,
        };
    } catch (err) {
        // Could not start the payment: release stock + coupon so nothing stays reserved
        console.error(`[CHECKOUT_FAILED] order ${order.id}`, err);

        if (sessionId) {
            await expireCheckoutSession(sessionId).catch(() => undefined);
        }

        await prisma.$transaction((tx) =>
            cancelOrderInTx(tx, order.id, { status: OrderStatus.PENDING, paymentStatus: PaymentStatus.UNPAID })
        );

        throw err instanceof ApiError ? err : new ApiError(502, "Could not start the payment. Please try again");
    }
};

// Lets the customer resume payment if they closed the Stripe tab
export const getPaymentLinkService = async (userId: string, orderId: string) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.paymentMethod !== PaymentMethod.CARD) {
        throw new ApiError(400, "This order is not a card order");
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
        throw new ApiError(400, "Order is already paid");
    }

    if (order.status !== OrderStatus.PENDING || !order.stripeSessionId) {
        throw new ApiError(400, "Order is not awaiting payment");
    }

    const session = await retrieveCheckoutSession(order.stripeSessionId);

    if (session.status !== "open" || !session.url) {
        throw new ApiError(409, "The payment session has expired");
    }

    return session.url;
};

export const getMyOrdersService = async (
    userId: string,
    lang: Lang,
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus
) => listOrders({ userId, ...(status && { status }) }, lang, page, limit);

// Pass userId to restrict to the owner; omit it for admin access
export const getOrderByIdService = async (orderId: string, lang: Lang, userId?: string) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, ...(userId && { userId }) },
        include: orderInclude,
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    return localizeOrder(order, lang);
};

export const cancelMyOrderService = async (userId: string, lang: Lang, orderId: string) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.status !== OrderStatus.PENDING) {
        throw new ApiError(400, "Only pending orders can be cancelled");
    }

    return cancelOrder(order, lang);
};

/* -------------------------------------------------------------------------- */
/*                                   Admin                                    */
/* -------------------------------------------------------------------------- */

export const getAllOrdersService = async (options: {
    lang: Lang;
    page?: number;
    limit?: number;
    status?: OrderStatus;
    userId?: string;
}) => {
    const { lang, page = 1, limit = 10, status, userId } = options;

    return listOrders(
        { ...(status && { status }), ...(userId && { userId }) },
        lang,
        page,
        limit
    );
};

export const updateOrderStatusService = async (orderId: string, lang: Lang, status: OrderStatus) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!STATUS_FLOW[order.status].includes(status)) {
        throw new ApiError(400, `Cannot change status from ${order.status} to ${status}`);
    }

    if (status === OrderStatus.CANCELLED) {
        return cancelOrder(order, lang); // returns stock, releases coupon, refunds if paid
    }

    // Never ship a card order that hasn't been paid
    if (
        status === OrderStatus.DELIVERING &&
        order.paymentMethod === PaymentMethod.CARD &&
        order.paymentStatus !== PaymentStatus.PAID
    ) {
        throw new ApiError(400, "Card orders must be paid before they can be delivered");
    }

    // Compare-and-set: only update if nobody changed the status since we read it
    const updated = await prisma.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status },
    });

    if (updated.count === 0) {
        throw new ApiError(409, "Order was updated by another request. Please try again");
    }

    return localizeOrder(await findOrderOrThrow(orderId), lang);
};

export const deleteOrderService = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.status !== OrderStatus.CANCELLED) {
        throw new ApiError(400, "Only cancelled orders can be deleted. Cancel the order first");
    }

    // Don't erase the record of money that was never returned
    if (order.paymentStatus === PaymentStatus.PAID) {
        throw new ApiError(400, "This order is paid and not refunded. Refund it before deleting");
    }

    await prisma.order.delete({ where: { id: orderId } });
};