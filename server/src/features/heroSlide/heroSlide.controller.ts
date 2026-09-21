// heroSlide.controller.ts
import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiError } from "../../shared/utils/ApiError";
import {
    createHeroSlideService,
    deleteHeroSlideService,
    getActiveHeroSlidesService,
    getAllHeroSlidesService,
    getHeroSlideByIdService,
    reorderHeroSlidesService,
    updateHeroSlideService,
} from "./heroSlide.services";

const REQUIRED_FIELDS = ["titleAr", "titleEn", "subtitleAr", "subtitleEn", "ctaAr", "ctaEn", "image", "href"] as const;

/* --------------------------------- Public ---------------------------------- */

export const getActiveHeroSlidesController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const slides = await getActiveHeroSlidesService(req.lang);

    res.status(200).json({ success: true, data: slides });
});

/* --------------------------------- Admin ------------------------------------ */

export const getAllHeroSlidesController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const slides = await getAllHeroSlidesService();

    res.status(200).json({ success: true, data: slides });
});

export const getHeroSlideByIdController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;

    const slide = await getHeroSlideByIdService(id);

    res.status(200).json({ success: true, data: slide });
});

export const createHeroSlideController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const body = req.body || {};

    for (const field of REQUIRED_FIELDS) {
        if (!body[field] || typeof body[field] !== "string") {
            throw new ApiError(400, `${field} is required`);
        }
    }

    const slide = await createHeroSlideService({
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        subtitleAr: body.subtitleAr,
        subtitleEn: body.subtitleEn,
        ctaAr: body.ctaAr,
        ctaEn: body.ctaEn,
        image: body.image,
        href: body.href,
        order: body.order !== undefined ? Number(body.order) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });

    res.status(201).json({ success: true, data: slide });
});

export const updateHeroSlideController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const body = req.body || {};

    // Only pass along known, defined fields
    const allowed = [...REQUIRED_FIELDS, "order", "isActive"] as const;
    const data = Object.fromEntries(
        allowed
            .filter((key) => body[key] !== undefined)
            .map((key) => [key, key === "order" ? Number(body[key]) : key === "isActive" ? Boolean(body[key]) : body[key]])
    );

    if (Object.keys(data).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const slide = await updateHeroSlideService(id, data);

    res.status(200).json({ success: true, data: slide });
});

export const deleteHeroSlideController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;

    await deleteHeroSlideService(id);

    res.status(200).json({ success: true, message: "Hero slide deleted successfully" });
});

export const reorderHeroSlidesController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, "items must be a non-empty array of { id, order }");
    }

    for (const item of items) {
        if (typeof item.id !== "string" || typeof item.order !== "number") {
            throw new ApiError(400, "Each item must have a string id and numeric order");
        }
    }

    const slides = await reorderHeroSlidesService(items);

    res.status(200).json({ success: true, data: slides });
});