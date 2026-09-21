// review.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
    createReviewController,
    deleteReviewController,
    getMyReviewsController,
    getReviewsController,
    updateReviewController,
} from "./review.controller";

const router = Router();

// Public: anyone can read a product's reviews
router.get("/", getReviewsController);

// Everything below needs a logged-in user
router.use(authMiddleware);

router.get("/me", getMyReviewsController);
router.post("/", createReviewController);
router.patch("/:reviewId", updateReviewController);
router.delete("/:reviewId", deleteReviewController);

export default router;