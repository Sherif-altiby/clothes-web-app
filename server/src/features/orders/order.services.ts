// order.services.ts
import { DiscountType, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { Lang } from "../../shared/middlewares/lang.middleware";
import { localizeOrder } from "../../shared/utils/localize";
import { getUnitPrice, round2 } from "../../shared/utils/price";

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

// Marks the order cancelled, returns stock, and releases the coupon
const cancelOrderInTx = async (tx: Prisma.TransactionClient, orderId: string) => {
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

    return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: orderInclude,
    });
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

// Checkout: turns the user's cart into an order
export const createOrderService = async (userId: string, lang: Lang, couponCode?: string) => {
    const order = await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            throw new ApiError(400, "Cart is empty");
        }

        // Take stock atomically; fails if another order took it first
        for (const item of cart.items) {
            const updated = await tx.product.updateMany({
                where: { id: item.productId, counts: { gte: item.quantity } },
                data: { counts: { decrement: item.quantity } },
            });

            if (updated.count === 0) {
                throw new ApiError(400, `Not enough stock for "${item.product.titleEn}"`);
            }
        }

        // Prices come from the products, never from the client or the cart
        const items = cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: getUnitPrice(i.product),
        }));

        const subtotal = round2(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));

        let total = subtotal;
        let couponId: string | null = null;

        if (couponCode) {
            const redeemed = await redeemCoupon(tx, couponCode, userId, subtotal);
            total = redeemed.total;
            couponId = redeemed.couponId;
        }

        const created = await tx.order.create({
            data: { userId, total, items: { create: items } },
            include: orderInclude,
        });

        if (couponId) {
            await tx.couponUsage.create({
                data: { couponId, userId, orderId: created.id },
            });
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return created;
    });

    return localizeOrder(order, lang);
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

    const cancelled = await prisma.$transaction((tx) => cancelOrderInTx(tx, orderId));

    return localizeOrder(cancelled, lang);
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

    const updated = await prisma.$transaction((tx) =>
        status === OrderStatus.CANCELLED
            ? cancelOrderInTx(tx, orderId) // returns stock + releases coupon
            : tx.order.update({ where: { id: orderId }, data: { status }, include: orderInclude })
    );

    return localizeOrder(updated, lang);
};

export const deleteOrderService = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.status !== OrderStatus.CANCELLED) {
        throw new ApiError(400, "Only cancelled orders can be deleted. Cancel the order first");
    }

    await prisma.order.delete({ where: { id: orderId } });
};