import { Router } from "express";
import { requireAdmin, requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { jobController } from "./job.controller";
import {
  createJobSchema,
  jobIdParamSchema,
  listJobsQuerySchema,
  updateJobSchema,
} from "./job.schema";

export const adminJobRoutes = Router();
export const publicJobRoutes = Router();

adminJobRoutes.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(createJobSchema),
  jobController.create,
);
adminJobRoutes.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(updateJobSchema),
  jobController.update,
);
adminJobRoutes.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(jobIdParamSchema),
  jobController.remove,
);

publicJobRoutes.get("/", validate(listJobsQuerySchema), jobController.list);
publicJobRoutes.get("/:id", validate(jobIdParamSchema), jobController.getOne);
