import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyJWTToken } from "../utils/verifyJWTToken";

export const authAdminMiddleware = (
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

    if (decoded.role !== "ADMIN") {
        return next(new ApiError(403, "Forbidden: This action is only allowed for admins."));
    }

    // Attach user to request
    req.user = decoded;

    next();
};