import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import {
    createProductService,
    deleteProductService,
    getAdminProductsService,
    updateProductService,
} from "./product.services";
import { ApiError } from "../../../shared/utils/ApiError";
import { Product } from "@prisma/client";
import { updateProductSchema } from "./product.validation";

export const getAdminProductsController = asyncHandler(async (req: Request, res: Response) => {
    const page = Number.parseInt(String(req.query.page ?? "1"), 10);
    const limit = Number.parseInt(String(req.query.limit ?? "10"), 10);
    const searchTitle = typeof req.query.searchTitle === "string"
        ? req.query.searchTitle.trim()
        : undefined;
    const categoryId = req.query.categoryId;

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new ApiError(400, "Page must be positive and limit must be between 1 and 100");
    }
    if (searchTitle && searchTitle.length > 100) {
        throw new ApiError(400, "Search title must be 100 characters or less");
    }
    if (categoryId !== undefined && (typeof categoryId !== "string" || categoryId.length > 100)) {
        throw new ApiError(400, "Category ID must be a string of 100 characters or less");
    }

    const result = await getAdminProductsService({
        page,
        limit,
        searchTitle,
        categoryId: typeof categoryId === "string" ? categoryId : undefined,
    });

    res.status(200).json({ success: true, data: result });
});

export const createProductController = asyncHandler(async (req: Request, res: Response) => {
    const {
        titleAr, titleEn,
        descriptionAr, descriptionEn,
        baseSalary, profit, discount, images, counts, categoryId,
    } = req.body as Omit<Product, "id" | "createdAt" | "updatedAt">;

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

    const parsed = updateProductSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    const updatedProduct = await updateProductService(id, parsed.data);

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