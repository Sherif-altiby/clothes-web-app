import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyJWTToken } from "../utils/verifyJWTToken";

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const token = req.cookies.jwtToken;

    if (!token) {
        return next(
            new ApiError(401, "Unauthorized")
        );
    }

    // Verify token
    const decoded = verifyJWTToken(token);

    // Attach user to request
    req.user = decoded;

    next();
};