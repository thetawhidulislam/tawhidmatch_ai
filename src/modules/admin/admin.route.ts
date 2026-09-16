import { Router } from "express";
import { requireAdmin, requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { adminController } from "./admin.controller";
import {
  listUsersQuerySchema,
  updateUserRoleSchema,
  userIdParamSchema,
} from "./admin.schema";

const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.get(
  "/users",
  validate(listUsersQuerySchema),
  adminController.listUsers,
);
adminRoutes.patch(
  "/users/:id/role",
  validate(userIdParamSchema),
  validate(updateUserRoleSchema),
  adminController.updateRole,
);
adminRoutes.get("/dashboard/stats", adminController.getStats);

export default adminRoutes;
