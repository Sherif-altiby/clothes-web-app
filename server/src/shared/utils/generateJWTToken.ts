import jwt, { SignOptions } from "jsonwebtoken";
import { ApiError } from "./ApiError";

interface JWTPayload {
    userId: string;
    role: string;
}

export const generateJWTToken = (payload: JWTPayload, expiresIn: SignOptions["expiresIn"] = "7d"): string => {
    if (!process.env.JWT_SECRET) {
        throw new ApiError(500, "JWT_SECRET is not defined");
    }
    const secret = process.env.JWT_SECRET;

    return jwt.sign(payload, secret, { expiresIn });
};
