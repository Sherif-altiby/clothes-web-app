import { Router } from "express";
import { getMeController, loginController, registerController, updateProfileController } from "./auth.controllers";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";


const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);

router.get("/me", authMiddleware, getMeController);
router.patch("/me", authMiddleware, updateProfileController);

export default router;