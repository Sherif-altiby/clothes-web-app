import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { requireAdminMiddleware } from "../../shared/middlewares/requireAdmin.middleware";
import {
    createOfferController,
    getActiveOfferController,
    getActiveOffersController,
    getAdminOffersController,
    updateOfferController,
    updateOfferStatusController,
} from "./offer.controllers";

export const offerUserRoutes = Router();
offerUserRoutes.get("/", getActiveOffersController);
offerUserRoutes.get("/:id", getActiveOfferController);

export const offerAdminRoutes = Router();
offerAdminRoutes.use(authMiddleware, requireAdminMiddleware);
offerAdminRoutes.get("/", getAdminOffersController);
offerAdminRoutes.post("/", createOfferController);
offerAdminRoutes.patch("/:id/status", updateOfferStatusController);
offerAdminRoutes.patch("/:id", updateOfferController);
