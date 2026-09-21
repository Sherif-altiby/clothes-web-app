// order.admin.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authAdminMiddleware } from "../../shared/middlewares/auth.admin.middleware";
import {
    deleteOrderController,
    getAllOrdersController,
    getOrderByIdController,
    updateOrderStatusController,
} from "./order.controller";

const router = Router();

router.use(authMiddleware, authAdminMiddleware);

router.get("/", getAllOrdersController);
router.get("/:orderId", getOrderByIdController);
router.patch("/:orderId/status", updateOrderStatusController);
router.delete("/:orderId", deleteOrderController);

export default router;