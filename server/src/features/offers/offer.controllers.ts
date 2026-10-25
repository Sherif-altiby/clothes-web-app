import { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiError } from "../../shared/utils/ApiError";
import {
    createOffer,
    getActiveOfferById,
    getActiveOffers,
    getAdminOffers,
    updateOffer,
    updateOfferStatus,
} from "./offer.services";
import {
    createOfferSchema,
    updateOfferSchema,
    updateOfferStatusSchema,
} from "./offer.validation";

export const getActiveOffersController = asyncHandler(async (req: Request, res: Response) => {
    const offers = await getActiveOffers(req.lang);
    res.status(200).json({ success: true, data: offers });
});

export const getActiveOfferController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const offer = await getActiveOfferById(id, req.lang);
    res.status(200).json({ success: true, data: offer });
});

export const getAdminOffersController = asyncHandler(async (_req: Request, res: Response) => {
    const offers = await getAdminOffers();
    res.status(200).json({ success: true, data: offers });
});

export const createOfferController = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createOfferSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
    }
    const offer = await createOffer(parsed.data);
    res.status(201).json({ success: true, data: offer });
});

export const updateOfferController = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateOfferSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
    }
    const offer = await updateOffer(req.params.id as string, parsed.data);
    res.status(200).json({ success: true, data: offer });
});

export const updateOfferStatusController = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateOfferStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
    }
    const offer = await updateOfferStatus(req.params.id as string, parsed.data.status);
    res.status(200).json({ success: true, data: offer });
});
