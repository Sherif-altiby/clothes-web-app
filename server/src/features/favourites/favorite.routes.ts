// favorite.routes.ts
import { Router } from "express";
 import {
    addFavoriteController,
    getFavoritesController,
    isFavoriteController,
    removeFavoriteController,
    toggleFavoriteController,
} from "./favorite.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);  

router.get("/", getFavoritesController);
router.post("/", addFavoriteController);
router.post("/toggle", toggleFavoriteController);
router.get("/:productId", isFavoriteController);
router.delete("/:productId", removeFavoriteController);

export default router;