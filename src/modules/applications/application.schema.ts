import { z } from "zod";

const applicationStatusSchema = z.enum([
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW",
  "REJECTED",
  "HIRED",
]);

export const createApplicationSchema = z.object({
  body: z.object({
    jobId: z.string().uuid(),
    resumeId: z.string().uuid(),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: applicationStatusSchema,
  }),
});

export const applicationIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listApplicationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    status: applicationStatusSchema.optional(),
    jobId: z.string().uuid().optional(),
  }),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>["body"];
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>["body"];
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>["query"];