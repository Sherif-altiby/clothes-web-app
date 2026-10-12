import { Router } from "express";
import { getProductsController, getProductByIdController } from "./product.controller";

import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

const router = Router();

router.get("/", getProductsController);
router.get("/:productId", authMiddleware, getProductByIdController);

export default router;
