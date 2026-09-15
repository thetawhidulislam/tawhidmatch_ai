import { Router } from "express";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { usersController } from "./users.controller";
import { updateProfileSchema } from "./users.schema";

const router = Router();

router.get("/me", requireAuth, usersController.getMe);
router.patch("/me", requireAuth, validate(updateProfileSchema), usersController.updateMe);

export default router;
