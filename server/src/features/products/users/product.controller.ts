import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { getProductById, getProducts } from "./products.services";

export const getProductsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const searchTitle = req.query.searchTitle as string | undefined;
    const orderPrice = req.query.orderPrice as "asc" | "desc" | undefined;

    const result = await getProducts(page, limit, searchTitle, orderPrice);

    res.status(200).json({
        success: true,
        data: result
    });
});


export const getProductByIdController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const productId = req.params.productId as string;

    const product = await getProductById(productId);

    res.status(200).json({
        success: true,
        data: product
    });
});