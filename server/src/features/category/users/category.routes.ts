import { Router } from "express";
import { getAllCategoriesController } from "./category.controller";

const router = Router();

router.get("/", getAllCategoriesController);

export default router;