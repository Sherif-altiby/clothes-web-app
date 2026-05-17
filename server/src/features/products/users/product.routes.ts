import { Router } from "express";
import { getProductsController, getProductByIdController } from "./product.controller";

import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { authAdminMiddleware } from "../../../shared/middlewares/auth.admin.middleware";

const router = Router();

router.get("/", authMiddleware, getProductsController);
router.get("/:productId", getProductByIdController);

export default router;
