import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiError } from "../../shared/utils/ApiError";
import { uploadToCloudinary } from "./cloudinary.service";


export const uploadSingleController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        throw new ApiError(400, "No image provided");
    }

    const image = await uploadToCloudinary(req.file, { folder: "uploads" });

    res.status(201).json({ success: true, data: image });
});

export const uploadMultipleController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files;

    if (!Array.isArray(files) || files.length === 0) {
        throw new ApiError(400, "No images provided");
    }

    const images = await uploadToCloudinary(files, { folder: "uploads" });

    res.status(201).json({ success: true, data: images });
});