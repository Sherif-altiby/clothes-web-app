import { z } from "zod";

export const createProductSchema = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title is too long"),

    description: z
        .string()
        .min(10, "Description must be at least 10 characters"),

    baseSalary: z
        .number()
        .positive("Base salary must be greater than 0"),

    profit: z
        .number()
        .min(0, "Profit cannot be negative"),

    discount: z
        .number()
        .min(0, "Discount cannot be negative")
        .max(100, "Discount cannot exceed 100")
        .optional(),

    images: z
        .array(
            z.string().url("Each image must be a valid URL")
        )
        .min(1, "At least one image is required"),

    counts: z
        .number()
        .int("Counts must be an integer")
        .positive("Counts must be greater than 0")
        .optional(),

    categoryId: z
        .string()
        .min(1, "Category ID is required"),
});