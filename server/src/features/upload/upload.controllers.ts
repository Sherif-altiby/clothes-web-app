import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiError } from "../../shared/utils/ApiError";
import { deleteFromCloudinary, uploadToCloudinary } from "./cloudinary.service";
import z from "zod";


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

const deleteImageSchema = z.object({
    // Only allow ids inside the "uploads" folder so nobody can delete other assets
    publicId: z
        .string({ error: "publicId is required" })
        .regex(/^uploads\/[\w\-\/]+$/, "Invalid publicId"),
});

export const deleteImageController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const parsed = deleteImageSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues.map((e) => e.message).join(", "));
    }

    const { publicId } = parsed.data;

    let result: Record<string, string>;
    try {
        result = await deleteFromCloudinary(publicId);
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw new ApiError(502, "Image deletion failed");
    }

    if (result[publicId] === "not_found") {
        throw new ApiError(404, "Image not found");
    }

    res.status(200).json({ success: true, message: "Image deleted successfully", data: { publicId } });
});