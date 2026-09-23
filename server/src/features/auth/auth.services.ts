import crypto from "crypto";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { comparePassword, hashPassword } from "../../shared/utils/hashPassword";
import {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    REFRESH_TOKEN_MAX_AGE_MS,
} from "./tokens";
import { loginSchema, registerSchema, updateProfileSchema } from "./auth.validation";

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Creates an access token + a new refresh token and stores the refresh token's hash.
 * `familyId` links every token that came from the same login, which is what
 * makes reuse detection possible.
 */
const issueTokens = async (
    user: { id: string; role: string },
    familyId: string = crypto.randomUUID()
): Promise<AuthTokens> => {
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(refreshToken),
            familyId,
            userId: user.id,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
        },
    });

    return { accessToken, refreshToken };
};

export const loginUser = async (email?: string, password?: string) => {
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) { throw new ApiError(400, parsed.error.issues.map(e => e.message).join(", ")); }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, });

    if (!user) { throw new ApiError(401, "Invalid email or password"); }

    const isPasswordValid = await comparePassword(parsed.data.password, user.password);

    if (!isPasswordValid) { throw new ApiError(401, "Invalid email or password"); }

    const tokens = await issueTokens(user); // new login = new token family

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
};

export const registerUser = async (data: unknown) => {
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

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
};

/**
 * Rotation: every refresh call revokes the token that was used and issues a new one.
 * Reuse detection: if an already-revoked token shows up again, someone probably stole it,
 * so the whole family is revoked and the user has to log in again.
 */
export const refreshSession = async (rawToken?: string): Promise<AuthTokens> => {
    if (!rawToken) { throw new ApiError(401, "Refresh token missing"); }

    const stored = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashToken(rawToken) },
        include: { user: true },
    });

    if (!stored) { throw new ApiError(401, "Invalid refresh token"); }

    if (stored.revokedAt) {
        await prisma.refreshToken.updateMany({
            where: { familyId: stored.familyId, revokedAt: null },
            data: { revokedAt: new Date() },
        });

        throw new ApiError(401, "Session is no longer valid. Please log in again");
    }

    if (stored.expiresAt < new Date()) { throw new ApiError(401, "Refresh token expired"); }

    // Revoke atomically: if two requests race with the same token, only one gets count === 1
    const { count } = await prisma.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
    });

    if (count === 0) { throw new ApiError(401, "Invalid refresh token"); }

    // The user comes fresh from the database, so role changes apply on the next refresh
    return issueTokens(stored.user, stored.familyId);
};

/** Logs out this device only. */
export const logoutUser = async (rawToken?: string): Promise<void> => {
    if (!rawToken) return;

    await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(rawToken), revokedAt: null },
        data: { revokedAt: new Date() },
    });
};

/** Logs out every device. Call this after a password change or a suspected compromise too. */
export const logoutAllDevices = async (userId: string): Promise<void> => {
    await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
};

/** Run this on a schedule (daily is enough) so the table doesn't grow forever. */
export const cleanupExpiredRefreshTokens = async (): Promise<number> => {
    const { count } = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });

    return count;
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