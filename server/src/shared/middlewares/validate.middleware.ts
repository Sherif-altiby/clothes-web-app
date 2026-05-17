import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate =
    (schema: ZodSchema) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                req.body = schema.parse(req.body);

                next();
            } catch (error) {
                if (error instanceof ZodError) {
                    const errors = error.issues.map((issue) => ({
                        field: `${issue.path.join(".")}: ${issue.message}`,
                    }));

                    return next(
                        new ApiError(
                            400,
                            errors.map((e) => e.field).join(", ")
                        )
                    );
                }

                next(error);
            }
        };