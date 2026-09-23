import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { AccessTokenPayload, verifyAccessToken } from "../../features/auth/tokens";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    // Cookie for the browser app, Bearer header for tools like Postman or mobile clients
    const token =
        req.cookies?.accessToken ?? (header?.startsWith("Bearer ") ? header.slice(7) : undefined);

    if (!token) {
        return next(new ApiError(401, "Unauthorized"));
    }

    // Throws ApiError(401) if the token is invalid or expired
    req.user = verifyAccessToken(token) as AccessTokenPayload;

    next();
};