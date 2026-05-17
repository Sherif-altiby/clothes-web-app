import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError";

interface JWTPayload {
    userId: string;
    role: string;
}

export const verifyJWTToken = (
    token: string
): JWTPayload => {

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new ApiError(500, "JWT_SECRET is missing");
    }

    try {
        return jwt.verify(token, secret) as JWTPayload;
    } catch {
        throw new ApiError(401, "Invalid or expired token");
    }
};