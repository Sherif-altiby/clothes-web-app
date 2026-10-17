import { Router } from "express";
import { createCategoryController, updateCategoryController, deleteCategoryController } from "./category.controller";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { requireAdminMiddleware } from "../../../shared/middlewares/requireAdmin.middleware";

const router = Router();

router.use(authMiddleware, requireAdminMiddleware);
router.post("/", createCategoryController);
router.patch("/:id", updateCategoryController);
router.delete("/:id", deleteCategoryController);

export default router;