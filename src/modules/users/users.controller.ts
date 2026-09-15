import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "@/utils/ApiResponse";
import { usersService } from "./users.service";

export const usersController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getMe(req.user!.userId);
      return sendSuccess(res, user, "Current user fetched");
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateMe(req.user!.userId, req.body);
      return sendSuccess(res, user, "Profile updated successfully");
    } catch (err) {
      next(err);
    }
  },
};
