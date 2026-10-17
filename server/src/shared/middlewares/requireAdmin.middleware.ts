import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export const requireAdminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user.role !== "ADMIN") {
        return next(new ApiError(403, "Forbidden: This action is only allowed for admins."));
    }

    return next();
};
