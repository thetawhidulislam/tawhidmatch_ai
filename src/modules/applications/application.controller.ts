import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "@/utils/ApiResponse";
import { applicationService } from "./application.service";
import {
  CreateApplicationInput,
  ListApplicationsQuery,
  UpdateApplicationStatusInput,
} from "./application.schema";

export const applicationController = {
  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.applyToJob(
        req.user!.userId,
        req.body as CreateApplicationInput,
      );
      return sendSuccess(res, application, "Application submitted successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const applications = await applicationService.listMyApplications(req.user!.userId);
      return sendSuccess(res, applications, "Applications fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.getMyApplicationById(
        req.user!.userId,
        req.params.id,
      );
      return sendSuccess(res, application, "Application fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.listAllApplications(
        req.query as unknown as ListApplicationsQuery,
      );
      return sendSuccess(res, result, "Applications fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.updateApplicationStatus(
        req.params.id,
        (req.body as UpdateApplicationStatusInput).status,
      );
      return sendSuccess(res, application, "Application status updated successfully");
    } catch (err) {
      next(err);
    }
  },
};