// order.routes.ts (user)
import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
    cancelMyOrderController,
    createOrderController,
    getMyOrderByIdController,
    getMyOrdersController,
} from "./order.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createOrderController);
router.get("/", getMyOrdersController);
router.get("/:orderId", getMyOrderByIdController);
router.patch("/:orderId/cancel", cancelMyOrderController);

export default router;