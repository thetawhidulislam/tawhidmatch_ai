import { Router } from "express";
import { requireAdmin, requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { applicationController } from "./application.controller";
import {
  applicationIdParamSchema,
  createApplicationSchema,
  listApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from "./application.schema";

export const userApplicationRoutes = Router();
export const adminApplicationRoutes = Router();

userApplicationRoutes.post(
  "/",
  requireAuth,
  validate(createApplicationSchema),
  applicationController.apply,
);
userApplicationRoutes.get("/", requireAuth, applicationController.listMine);
userApplicationRoutes.get(
  "/:id",
  requireAuth,
  validate(applicationIdParamSchema),
  applicationController.getMine,
);

adminApplicationRoutes.get(
  "/",
  requireAuth,
  requireAdmin,
  validate(listApplicationsQuerySchema),
  applicationController.listAll,
);
adminApplicationRoutes.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(applicationIdParamSchema),
  validate(updateApplicationStatusSchema),
  applicationController.updateStatus,
);