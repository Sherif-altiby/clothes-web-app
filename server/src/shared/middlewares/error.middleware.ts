import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export const globalErrorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",

        // show stack only in development
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
        }),
    });
};