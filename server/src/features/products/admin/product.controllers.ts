import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { createProductService, deleteProductService, updateProductService } from "./product.services";
import { ApiError } from "../../../shared/utils/ApiError";
import { Product } from "@prisma/client";

export const createProductController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
        titleAr, titleEn,
        descriptionAr, descriptionEn,
        baseSalary, profit, discount, images, counts, categoryId,
    } = req.body as Omit<Product, "id" | "createdAt" | "updatedAt">;

    if (!titleAr || !titleEn) {
        throw new ApiError(400, "titleAr and titleEn are required");
    }

    if (!descriptionAr || !descriptionEn) {
        throw new ApiError(400, "descriptionAr and descriptionEn are required");
    }

    const product = await createProductService({
        titleAr, titleEn,
        descriptionAr, descriptionEn,
        baseSalary, profit, discount, images, counts, categoryId,
    });

    res.status(201).json({ success: true, data: product });
});

export const updateProductController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    if (!id) {
        throw new ApiError(400, "Product ID is required");
    }

    // Only allow known fields (prevents clients from writing arbitrary columns)
    const {
        titleAr, titleEn,
        descriptionAr, descriptionEn,
        baseSalary, profit, discount, images, counts, categoryId,
    } = req.body || {};

    const updateData = Object.fromEntries(
        Object.entries({
            titleAr, titleEn,
            descriptionAr, descriptionEn,
            baseSalary, profit, discount, images, counts, categoryId,
        }).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const updatedProduct = await updateProductService(id, updateData);

    res.status(200).json({ success: true, data: updatedProduct });
});

export const deleteProductController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    if (!id) {
        throw new ApiError(400, "Product ID is required");
    }

    await deleteProductService(id);

    res.status(200).json({ success: true, data: null });
});