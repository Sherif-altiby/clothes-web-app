import { z } from "zod";

export const createProductSchema = z.object({
    titleAr: z.string().trim().min(1).max(100),
    titleEn: z.string().trim().min(1).max(100),
    descriptionAr: z.string().trim().min(1).max(5000),
    descriptionEn: z.string().trim().min(1).max(5000),
    baseSalary: z.number().finite().positive(),
    profit: z.number().finite().min(0),
    discount: z.number().finite().min(0).max(100).default(0),
    images: z.array(z.string().url()).min(1).max(10),
    counts: z.number().int().positive().default(1),
    categoryId: z.string().min(1),
}).strict();

export const updateProductSchema = z
    .object({
        titleAr: z.string().trim().min(1).max(100).optional(),
        titleEn: z.string().trim().min(1).max(100).optional(),
        descriptionAr: z.string().trim().min(1).max(5000).optional(),
        descriptionEn: z.string().trim().min(1).max(5000).optional(),
        baseSalary: z.number().finite().positive().optional(),
        profit: z.number().finite().min(0).optional(),
        discount: z.number().finite().min(0).max(100).nullable().optional(),
        images: z.array(z.string().url()).min(1).max(10).optional(),
        counts: z.number().int().min(0).optional(),
        categoryId: z.string().min(1).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one product field must be provided",
    });