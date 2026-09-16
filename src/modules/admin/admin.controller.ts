import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "@/utils/ApiResponse";
import { ListUsersQuery, UpdateUserRoleInput } from "./admin.schema";
import { adminService } from "./admin.service";

export const adminController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listUsers(
        req.query as unknown as ListUsersQuery,
      );
      return sendSuccess(res, result, "Users fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.updateUserRole(
        req.params.id,
        (req.body as UpdateUserRoleInput).role,
      );
      return sendSuccess(res, result, "User role updated successfully");
    } catch (err) {
      next(err);
    }
  },

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getDashboardStats();
      return sendSuccess(res, result, "Dashboard stats fetched successfully");
    } catch (err) {
      next(err);
    }
  },
};
