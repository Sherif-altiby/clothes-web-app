import { z, type ZodError } from "zod";

export const createCategorySchema = z
    .object({
        titleAr: z
            .string({ error: "Arabic title (titleAr) is required and must be a string" })
            .trim()
            .min(1, "Arabic title (titleAr) cannot be empty"),
        titleEn: z
            .string({ error: "English title (titleEn) is required and must be a string" })
            .trim()
            .min(1, "English title (titleEn) cannot be empty"),
        image: z
            .string({ error: "Image URL (image) is required and must be a string" })
            .trim()
            .url("Image must be a valid URL"),
    })
    .strict();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z
    .object({
        titleAr: z
            .string({ error: "Arabic title (titleAr) must be a string" })
            .trim()
            .min(1, "Arabic title (titleAr) cannot be empty")
            .optional(),
        titleEn: z
            .string({ error: "English title (titleEn) must be a string" })
            .trim()
            .min(1, "English title (titleEn) cannot be empty")
            .optional(),
        image: z
            .string({ error: "Image URL (image) must be a string" })
            .trim()
            .url("Image must be a valid URL")
            .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one category field is required",
    });

export const formatCategoryValidationError = (error: ZodError, allowedFields: string[]) =>
    error.issues
        .map((issue) => {
            if (issue.code === "unrecognized_keys") {
                const keys = issue.keys.map((key) => `"${key}"`).join(", ");
                return `Unsupported field${issue.keys.length === 1 ? "" : "s"}: ${keys}. Allowed fields: ${allowedFields.join(", ")}.`;
            }

            const field = issue.path.join(".");
            return field ? `${field}: ${issue.message}` : issue.message;
        })
        .join("; ");
