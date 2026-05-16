import { generateJWTToken } from "../../shared/utils/generateJWTToken";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { loginSchema, registerSchema } from "./auth.validation";
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


