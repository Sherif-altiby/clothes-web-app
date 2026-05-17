import { Router } from "express";
import { createCategoryController, updateCategoryController, deleteCategoryController } from "./category.controller";

const router = Router();

router.post("/", createCategoryController);
router.patch("/:id", updateCategoryController);
router.delete("/:id", deleteCategoryController);

export default router;