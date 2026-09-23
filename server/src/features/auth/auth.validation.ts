import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
    password: z.string()
        .trim()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[\W_]/, "Password must contain at least one special character"),
});

export type LoginInput = z.infer<typeof loginSchema>;


export const registerSchema = z.object({
    name: z.string().trim().min(8, "Name must be at least 8 characters").max(50, "Name must be at most 50 characters"),
    email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
    phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
    address: z.string().trim().min(20, "Address must be at least 20 characters").max(150, "Address must be at most 150 characters"),
    password: z.string()
        .trim()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[\W_]/, "Password must contain at least one special character"),
});


export const updateProfileSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        phone: z.string().min(6, "Invalid phone number").optional(),
        address: z.string().min(3, "Address is too short").optional(),
    })
    .strict() // rejects role, email, password, etc.
    .refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" });

export type RegisterInput = z.infer<typeof registerSchema>;