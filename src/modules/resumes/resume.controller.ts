import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError";
import { sendSuccess } from "@/utils/ApiResponse";
import { resumeService } from "./resume.service";

export const resumeController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest("No file uploaded", "NO_FILE");
      }
      const resume = await resumeService.uploadResume(req.user!.userId, req.file);
      return sendSuccess(res, resume, "Resume uploaded and processed", 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const resumes = await resumeService.listResumes(req.user!.userId);
      return sendSuccess(res, resumes, "Resumes fetched");
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const resume = await resumeService.getResumeById(req.user!.userId, req.params.id);
      return sendSuccess(res, resume, "Resume fetched");
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.deleteResume(req.user!.userId, req.params.id);
      return sendSuccess(res, result, "Resume deleted");
    } catch (err) {
      next(err);
    }
  },
};