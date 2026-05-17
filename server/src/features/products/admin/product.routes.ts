import { Router } from "express";
import { createProductController, deleteProductController, updateProductController } from "./product.controllers";
import { validate } from "../../../shared/middlewares/validate.middleware";
import { createProductSchema } from "./product.validation";

const router = Router();

router.post("/", validate(createProductSchema), createProductController);
router.patch("/:id", updateProductController);
router.delete("/:id", deleteProductController);

export default router;