// order.controller.ts
import { NextFunction, Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiError } from "../../shared/utils/ApiError";
import {
    cancelMyOrderService,
    createOrderService,
    deleteOrderService,
    getAllOrdersService,
    getMyOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
} from "./order.services";

const parseStatus = (value: unknown): OrderStatus => {
    if (typeof value !== "string" || !(Object.values(OrderStatus) as string[]).includes(value)) {
        throw new ApiError(400, `Status must be one of: ${Object.values(OrderStatus).join(", ")}`);
    }
    return value as OrderStatus;
};

const parsePage = (req: Request) => ({
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
});

/* --------------------------------- User ----------------------------------- */

export const createOrderController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { couponCode } = req.body || {};

    if (couponCode !== undefined && typeof couponCode !== "string") {
        throw new ApiError(400, "couponCode must be a string");
    }

    const order = await createOrderService(req.user.userId, req.lang, couponCode || undefined);

    res.status(201).json({ success: true, data: order });
});

export const getMyOrdersController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit } = parsePage(req);
    const status = req.query.status ? parseStatus(req.query.status) : undefined;

    const result = await getMyOrdersService(req.user.userId, req.lang, page, limit, status);

    res.status(200).json({ success: true, data: result });
});

export const getMyOrderByIdController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId as string;

    const order = await getOrderByIdService(orderId, req.lang, req.user.userId);

    res.status(200).json({ success: true, data: order });
});

export const cancelMyOrderController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId as string;

    const order = await cancelMyOrderService(req.user.userId, req.lang, orderId);

    res.status(200).json({ success: true, data: order });
});

/* --------------------------------- Admin ---------------------------------- */

export const getAllOrdersController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit } = parsePage(req);
    const status = req.query.status ? parseStatus(req.query.status) : undefined;
    const userId = req.query.userId as string | undefined;

    const result = await getAllOrdersService({ lang: req.lang, page, limit, status, userId });

    res.status(200).json({ success: true, data: result });
});

export const getOrderByIdController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId as string;

    const order = await getOrderByIdService(orderId, req.lang);

    res.status(200).json({ success: true, data: order });
});

export const updateOrderStatusController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId as string;
    const status = parseStatus((req.body || {}).status);

    const order = await updateOrderStatusService(orderId, req.lang, status);

    res.status(200).json({ success: true, data: order });
});

export const deleteOrderController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId as string;

    await deleteOrderService(orderId);

    res.status(200).json({ success: true, message: "Order deleted successfully" });
});