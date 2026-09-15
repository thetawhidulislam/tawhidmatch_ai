import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "@/utils/ApiResponse";
import { jobService } from "./job.service";
import { ListJobsQuery } from "./job.schema";

export const jobController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await jobService.createJob(req.body);
      return sendSuccess(res, job, "Job created successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await jobService.updateJob(req.params.id, req.body);
      return sendSuccess(res, job, "Job updated successfully");
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await jobService.deleteJob(req.params.id);
      return sendSuccess(res, null, "Job deleted successfully");
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobService.listJobs(req.query as unknown as ListJobsQuery);
      return sendSuccess(res, result, "Jobs fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await jobService.getJobById(req.params.id);
      return sendSuccess(res, job, "Job fetched successfully");
    } catch (err) {
      next(err);
    }
  },
};