import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "@/utils/ApiResponse";
import { interviewService } from "./interview.service";
import { SubmitAnswerInput } from "./interview.schema";

export const interviewController = {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await interviewService.startInterview(
        req.user!.userId,
        req.body.jobId,
      );
      return sendSuccess(res, interview, "Interview started successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async answer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.submitAnswer(
        req.user!.userId,
        req.params.id,
        req.body as SubmitAnswerInput,
      );
      return sendSuccess(res, result, "Answer submitted successfully");
    } catch (err) {
      next(err);
    }
  },

  async getResult(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.getInterviewResult(
        req.user!.userId,
        req.params.id,
      );
      return sendSuccess(res, result, "Interview result fetched successfully");
    } catch (err) {
      next(err);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const interviews = await interviewService.listMyInterviews(req.user!.userId);
      return sendSuccess(res, interviews, "Interviews fetched successfully");
    } catch (err) {
      next(err);
    }
  },
};