import { Router } from "express";
import {
    createProductController,
    deleteProductController,
    getAdminProductsController,
    updateProductController,
} from "./product.controllers";
import { validate } from "../../../shared/middlewares/validate.middleware";
import { createProductSchema } from "./product.validation";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { requireAdminMiddleware } from "../../../shared/middlewares/requireAdmin.middleware";

const router = Router();

router.use(authMiddleware, requireAdminMiddleware);
router.get("/", getAdminProductsController);
router.post("/", validate(createProductSchema), createProductController);
router.patch("/:id", updateProductController);
router.delete("/:id", deleteProductController);

export default router;