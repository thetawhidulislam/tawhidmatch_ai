import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "@/utils/ApiResponse";
import { authService } from "./auth.service";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, result, "Account created successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, result, "Logged in successfully");
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response) {
    // Stateless JWT: logout is handled client-side by discarding the token.
    // If you later add refresh tokens / sessions, invalidate them here.
    return sendSuccess(res, null, "Logged out successfully");
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      return sendSuccess(res, user, "Current user fetched");
    } catch (err) {
      next(err);
    }
  },
};
