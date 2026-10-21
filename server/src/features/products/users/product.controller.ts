
import { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { getProductById, getProducts } from "./products.services";
import { ApiError } from "../../../shared/utils/ApiError";

export const getProductsController = asyncHandler(
    async (req: Request, res: Response) => {
        const rawPage = req.query.page;
        const rawLimit = req.query.limit;

        const page = rawPage === undefined ? 1 : Number(rawPage);

        const limit = rawLimit === undefined ? 10 : Number(rawLimit);

        if (!Number.isInteger(page) || page < 1) { throw new ApiError(400, "Page must be a positive integer"); }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) { throw new ApiError(400, "Limit must be an integer between 1 and 100"); }

        const searchTitle = typeof req.query.searchTitle === "string" ? req.query.searchTitle : undefined;

        const orderPrice = req.query.orderPrice === "asc" || req.query.orderPrice === "desc" ? req.query.orderPrice : undefined;

        const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;

        const result = await getProducts({ lang: req.lang, page, limit, searchTitle, orderPrice, categoryId, });

        res.status(200).json({ success: true, data: result, });
    }
);

export const getProductByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const productId = req.params.productId as string;

        const product = await getProductById(productId, req.lang);

        res.status(200).json({ success: true, data: product, });
    }
);
