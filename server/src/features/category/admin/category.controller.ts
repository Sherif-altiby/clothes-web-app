import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { createCategoryService, updateCategoryService, deleteCategoryService } from "./category.services";
import { ApiError } from "../../../shared/utils/ApiError";
import {
    createCategorySchema,
    formatCategoryValidationError,
    updateCategorySchema,
} from "./category.validation";

export const createCategoryController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createCategorySchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ApiError(
            400,
            formatCategoryValidationError(parsed.error, ["titleAr", "titleEn", "image"])
        );
    }

    const category = await createCategoryService(parsed.data);

    res.status(201).json({ success: true, data: category });
});

export const updateCategoryController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    if (!id) {
        throw new ApiError(400, "Category ID is required");
    }

    const parsed = updateCategorySchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ApiError(
            400,
            formatCategoryValidationError(parsed.error, ["titleAr", "titleEn"])
        );
    }

    const { titleAr, titleEn } = parsed.data;
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