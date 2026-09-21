// favorite.controller.ts
import { NextFunction, Request, Response } from "express";

import {
    addFavoriteService,
    getFavoritesService,
    isFavoriteService,
    removeFavoriteService,
    toggleFavoriteService,
} from "./favorite.services";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiError } from "../../shared/utils/ApiError";

export const getFavoritesController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const result = await getFavoritesService(req.user.userId, req.lang, page, limit);

    res.status(200).json({ success: true, data: result });
});

export const isFavoriteController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const productId = req.params.productId as string;

    const result = await isFavoriteService(req.user.userId, productId);

    res.status(200).json({ success: true, data: result });
});

export const addFavoriteController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { productId } = req.body || {};

    if (!productId) {
        throw new ApiError(400, "productId is required");
    }

    const favorite = await addFavoriteService(req.user.userId, productId);

    res.status(201).json({ success: true, data: favorite });
});

export const removeFavoriteController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const productId = req.params.productId as string;

    await removeFavoriteService(req.user.userId, productId);

    res.status(200).json({ success: true, message: "Removed from favorites" });
});

export const toggleFavoriteController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { productId } = req.body || {};

    if (!productId) {
        throw new ApiError(400, "productId is required");
    }

    const result = await toggleFavoriteService(req.user.userId, productId);

    res.status(200).json({ success: true, data: result });
});