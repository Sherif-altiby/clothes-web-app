import { Router } from "express";
import { uploadMultipleController, uploadSingleController } from "./upload.controllers";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { uploadMultiple, uploadSingle } from "./upload.middleware";

const router = Router();

// Form-data field names must match: "image" for one, "images" for many
router.post("/single", authMiddleware, uploadSingle("image"), uploadSingleController);
router.post("/multiple", authMiddleware, uploadMultiple("images", 10), uploadMultipleController);

export default router;

