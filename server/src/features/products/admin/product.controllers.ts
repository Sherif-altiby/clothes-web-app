import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { createProductService, deleteProductService, updateProductService } from "./product.services";
import { ApiError } from "../../../shared/utils/ApiError";
import { Product } from "@prisma/client";

export const createProductController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, baseSalary, profit, discount, images, counts, categoryId } = req.body as Omit<Product, "id" | "createdAt" | "updatedAt">;

    const product = await createProductService({ title, description, baseSalary, profit, discount, images, counts, categoryId });

    res.status(201).json({ success: true, data: product });
});

export const updateProductController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    if (!id) {
        throw new ApiError(400, "Product ID is required");
    }

    const { id: _, createdAt: __, updatedAt: ___, ...updateData } = req.body;

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
