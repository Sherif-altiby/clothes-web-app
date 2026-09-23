import { generateJWTToken } from "../../shared/utils/generateJWTToken";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { loginSchema, registerSchema, updateProfileSchema } from "./auth.validation";
import { comparePassword, hashPassword } from "../../shared/utils/hashPassword";


export const loginUser = async (email?: string, password?: string) => {
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) { throw new ApiError(400, parsed.error.issues.map(e => e.message).join(", ")); }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, });

    if (!user) { throw new ApiError(401, "Invalid email or password"); }

    const isPasswordValid = await comparePassword(parsed.data.password, user.password);

    if (!isPasswordValid) { throw new ApiError(401, "Invalid email or password"); }

    const token = generateJWTToken({ userId: user.id, role: user.role });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};

export const registerUser = async (data: any) => {
    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues.map(e => e.message).join(", "));
    }

    const { email, password, name, phone, address } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        throw new ApiError(400, "User already exists with this email");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            role: "USER",
        },
    });

    const token = generateJWTToken({ userId: user.id, role: user.role });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};


export const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) { throw new ApiError(404, "User not found"); }

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
};

export const updateProfile = async (userId: string, data: unknown) => {
    const parsed = updateProfileSchema.safeParse(data);

    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues.map(e => e.message).join(", "));
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });

    if (!existing) { throw new ApiError(404, "User not found"); }

    const user = await prisma.user.update({
        where: { id: userId },
        data: parsed.data,
    });

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
};