import { OfferStatus } from "@prisma/client";
import { z } from "zod";

const offerFields = {
    titleAr: z.string().trim().min(1).max(100),
    titleEn: z.string().trim().min(1).max(100),
    descriptionAr: z.string().trim().min(1).max(5000),
    descriptionEn: z.string().trim().min(1).max(5000),
    image: z.string().url().max(2048),
    discount: z.number().finite().gt(0).max(100),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    productIds: z.array(z.string().min(1)).max(500).default([]),
    categoryIds: z.array(z.string().min(1)).max(200).default([]),
};

export const createOfferSchema = z
    .object(offerFields)
    .extend({ status: z.literal(OfferStatus.PAUSED).optional() })
    .strict()
    .refine((data) => data.endsAt > data.startsAt, {
        message: "Offer end date must be after its start date",
        path: ["endsAt"],
    })
    .refine((data) => data.productIds.length + data.categoryIds.length > 0, {
        message: "Select at least one product or category",
    });

export const updateOfferSchema = z
    .object({
        titleAr: offerFields.titleAr.optional(),
        titleEn: offerFields.titleEn.optional(),
        descriptionAr: offerFields.descriptionAr.optional(),
        descriptionEn: offerFields.descriptionEn.optional(),
        image: offerFields.image.optional(),
        discount: offerFields.discount.optional(),
        startsAt: offerFields.startsAt.optional(),
        endsAt: offerFields.endsAt.optional(),
        productIds: offerFields.productIds.optional(),
        categoryIds: offerFields.categoryIds.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one offer field must be provided",
    });

export const updateOfferStatusSchema = z
    .object({ status: z.nativeEnum(OfferStatus) })
    .strict();
