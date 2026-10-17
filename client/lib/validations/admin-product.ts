import { z } from "zod";

export const MAX_PRODUCT_IMAGES = 10;

export const productFormSchema = z.object({
  titleEn: z.string().trim().min(1).max(100),
  titleAr: z.string().trim().min(1).max(100),
  descriptionEn: z.string().trim().min(1).max(5000),
  descriptionAr: z.string().trim().min(1).max(5000),
  baseSalary: z.number().finite().positive(),
  profit: z.number().finite().min(0),
  discount: z.number().finite().min(0).max(100),
  counts: z.number().int().min(0),
  categoryId: z.string().min(1),
  imageCount: z.number().int().min(1).max(MAX_PRODUCT_IMAGES),
});
