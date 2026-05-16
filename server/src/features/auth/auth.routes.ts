import { Router } from "express";
import { loginController, registerController } from "./auth.controllers";


const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);

export default router;