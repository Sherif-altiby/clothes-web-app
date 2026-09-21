import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { createCategoryService, updateCategoryService, deleteCategoryService } from "./category.services";
import { ApiError } from "../../../shared/utils/ApiError";

export const createCategoryController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { titleAr, titleEn } = req.body || {};

    if (!titleAr || !titleEn) {
        throw new ApiError(400, "Category titleAr and titleEn are required");
    }

    const category = await createCategoryService(titleAr, titleEn);

    res.status(201).json({ success: true, data: category });
});

export const updateCategoryController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const { titleAr, titleEn } = req.body || {};

    if (!id) {
        throw new ApiError(400, "Category ID is required");
    }

    if (!titleAr && !titleEn) {
        throw new ApiError(400, "At least one of titleAr or titleEn is required");
    }

    const updatedCategory = await updateCategoryService(id, titleAr, titleEn);

    res.status(200).json({ success: true, data: updatedCategory });
});

export const deleteCategoryController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    if (!id) {
        throw new ApiError(400, "Category ID is required");
    }

    await deleteCategoryService(id);

    res.status(200).json({ success: true, message: "Category deleted successfully" });
});