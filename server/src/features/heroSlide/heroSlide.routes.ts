// heroSlide.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { authAdminMiddleware } from "../../shared/middlewares/auth.admin.middleware";
import {
    getActiveHeroSlidesController,
    getAllHeroSlidesController,
    getHeroSlideByIdController,
    createHeroSlideController,
    updateHeroSlideController,
    deleteHeroSlideController,
    reorderHeroSlidesController,
} from "./heroSlide.controller";

const router = Router();


router.get("/user/hero-slides", getActiveHeroSlidesController);


const admin = Router();
admin.use(authMiddleware, authAdminMiddleware);

admin.get("/", getAllHeroSlidesController);
admin.patch("/reorder", reorderHeroSlidesController); // before "/:id"
admin.get("/:id", getHeroSlideByIdController);
admin.post("/", createHeroSlideController);
admin.patch("/:id", updateHeroSlideController);
admin.delete("/:id", deleteHeroSlideController);

router.use("/admin/hero-slides", admin);

export default router;