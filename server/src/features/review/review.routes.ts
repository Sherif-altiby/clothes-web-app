// review.routes.ts
import { NextFunction, Request, Response, Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { ApiError } from "../../shared/utils/ApiError";
import {
    createReviewController,
    deleteReviewController,
    getAllReviewsController,
    getMyReviewsController,
    getReviewsController,
    updateReviewController,
} from "./review.controller";

const router = Router();

// Product reviews remain public; listing every review is restricted to admins.
router.get("/", (req: Request, res: Response, next: NextFunction) => {
    if (req.query.productId) return next("route");

    authMiddleware(req, res, (error?: unknown) => {
        if (error) return next(error);
        if (req.user.role !== "ADMIN") {
            return next(new ApiError(403, "Only administrators can view all reviews"));
        }
        return getAllReviewsController(req, res, next);
    });
});

router.get("/", getReviewsController);

// Everything below needs a logged-in user
router.use(authMiddleware);

router.get("/me", getMyReviewsController);
router.post("/", createReviewController);
router.patch("/:reviewId", updateReviewController);
router.delete("/:reviewId", deleteReviewController);

export default router;