import { Router } from "express";
import {
    deleteImageController,
    uploadMultipleController,
    uploadSingleController,
} from "./upload.controllers";
import { uploadMultiple, uploadSingle } from "./upload.middleware";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { requireAdminMiddleware } from "../../shared/middlewares/requireAdmin.middleware";

const router = Router();

router.use(authMiddleware, requireAdminMiddleware);
router.post("/single", uploadSingle("image"), uploadSingleController);
router.post("/multiple", uploadMultiple("images", 10), uploadMultipleController);
router.delete("/", deleteImageController);

export default router;