// review.controller.ts
import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiError } from "../../shared/utils/ApiError";
import {
    createReviewService,
    deleteReviewService,
    getMyReviewsService,
    getReviewsService,
    updateReviewService,
} from "./review.services";

const parseRating = (value: unknown): number => {
    const rating = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be an integer between 1 and 5");
    }

    return rating;
};

// undefined/empty -> null, otherwise a trimmed string
const parseComment = (value: unknown): string | null => {
    if (value === undefined || value === null) return null;

    if (typeof value !== "string") {
        throw new ApiError(400, "Comment must be a string");
    }

    const comment = value.trim();

    if (comment.length > 1000) {
        throw new ApiError(400, "Comment must be 1000 characters or less");
    }

    return comment || null;
};

const parsePage = (req: Request) => ({
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
});

export const getReviewsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const productId = req.query.productId as string | undefined;

    if (!productId) {
        throw new ApiError(400, "productId is required");
    }

    const { page, limit } = parsePage(req);

    const result = await getReviewsService(productId, page, limit);

    res.status(200).json({ success: true, data: result });
});

export const getMyReviewsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit } = parsePage(req);

    const result = await getMyReviewsService(req.user.userId, req.lang, page, limit);

    res.status(200).json({ success: true, data: result });
});

export const createReviewController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { productId, rating, comment } = req.body || {};

    if (!productId || typeof productId !== "string") {
        throw new ApiError(400, "productId is required");
    }

    const review = await createReviewService(
        req.user.userId,
        productId,
        parseRating(rating),
        parseComment(comment)
    );

    res.status(201).json({ success: true, data: review });
});

export const updateReviewController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const reviewId = req.params.reviewId as string;
    const { rating, comment } = req.body || {};

    if (rating === undefined && comment === undefined) {
        throw new ApiError(400, "Provide rating or comment to update");
    }

    const data: { rating?: number; comment?: string | null } = {};

    if (rating !== undefined) data.rating = parseRating(rating);
    if (comment !== undefined) data.comment = parseComment(comment);

    const review = await updateReviewService(req.user.userId, reviewId, data);

    res.status(200).json({ success: true, data: review });
});

export const deleteReviewController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const reviewId = req.params.reviewId as string;

    await deleteReviewService(req.user.userId, req.user.role, reviewId);

    res.status(200).json({ success: true, message: "Review deleted successfully" });
});