import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { getAllCategoriesService } from "./category.services";


export const getAllCategoriesController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const categories = await getAllCategoriesService();
    res.status(200).json({ success: true, data: categories });
});