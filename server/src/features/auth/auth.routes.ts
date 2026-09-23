import { Router } from "express";
import {
    getMeController,
    loginController,
    logoutAllController,
    logoutController,
    refreshController,
    registerController,
    updateProfileController,
} from "./auth.controllers";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";


const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/refresh", refreshController); // reads the refreshToken cookie, no access token needed
router.post("/logout", logoutController); // works even if the access token already expired

router.post("/logout-all", authMiddleware, logoutAllController);

router.get("/me", authMiddleware, getMeController);
router.patch("/me", authMiddleware, updateProfileController);

export default router;