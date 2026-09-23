import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ApiError } from "../../shared/utils/ApiError";
   

export interface AccessTokenPayload {
    userId: string;
    role: string;
}

export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const getAccessSecret = () => {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) throw new Error("JWT_ACCESS_SECRET is not set");

    return secret;
};

/** Short-lived, stateless. Only carries what the API needs to identify the caller. */
export const generateAccessToken = (payload: AccessTokenPayload): string =>
    jwt.sign({ userId: payload.userId, role: payload.role }, getAccessSecret(), {
        algorithm: "HS256",
        expiresIn: ACCESS_TOKEN_MAX_AGE_MS / 1000, // seconds
    });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
    const secret = getAccessSecret();

    try {
        // Pinning the algorithm blocks "alg" confusion attacks
        const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as jwt.JwtPayload &
            AccessTokenPayload;

        return { userId: decoded.userId, role: decoded.role };
    } catch (error) {
        throw new ApiError(
            401,
            error instanceof jwt.TokenExpiredError ? "Access token expired" : "Invalid access token"
        );
    }
};

/** Opaque random token (not a JWT). It's validated by looking up its hash in the database. */
export const generateRefreshToken = (): string => crypto.randomBytes(48).toString("hex");

/** Refresh tokens are stored hashed, so a database leak doesn't hand out working sessions. */
export const hashToken = (token: string): string =>
    crypto.createHash("sha256").update(token).digest("hex");