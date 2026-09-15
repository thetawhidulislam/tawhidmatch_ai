import { z } from "zod";

export const startInterviewSchema = z.object({
  body: z.object({
    jobId: z.string().uuid(),
  }),
});

export const submitAnswerSchema = z.object({
  body: z.object({
    questionId: z.string().uuid(),
    answerText: z.string().min(5),
  }),
});

export const interviewIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export type StartInterviewInput = z.infer<typeof startInterviewSchema>["body"];
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>["body"];