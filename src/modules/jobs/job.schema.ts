import { z } from "zod";

const jobFieldsSchema = z.object({
  title: z.string().min(3),
  company: z.string().min(2),
  description: z.string().min(20),
  location: z.string(),
  jobType: z.enum(["REMOTE", "ONSITE", "HYBRID"]),
  experienceLevel: z.string(),
  skills: z.array(z.string()).min(1),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
});

function validateSalaryRange(
  data: { salaryMin?: number; salaryMax?: number },
  context: z.RefinementCtx
) {
  if (
    data.salaryMin !== undefined &&
    data.salaryMax !== undefined &&
    data.salaryMax < data.salaryMin
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["salaryMax"],
      message: "salaryMax must be greater than or equal to salaryMin",
    });
  }
}

export const createJobSchema = z.object({
  body: jobFieldsSchema.superRefine(validateSalaryRange),
});

export const updateJobSchema = z.object({
  body: jobFieldsSchema
    .partial()
    .extend({ status: z.enum(["OPEN", "CLOSED"]).optional() })
    .superRefine(validateSalaryRange),
});

export const jobIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listJobsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    search: z.string().optional(),
    location: z.string().optional(),
    jobType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
    minSalary: z.coerce.number().int().optional(),
    maxSalary: z.coerce.number().int().optional(),
    sortBy: z.enum(["newest", "salary_high", "salary_low"]).default("newest"),
  }),
});

export type CreateJobInput = z.infer<typeof createJobSchema>["body"];
export type UpdateJobInput = z.infer<typeof updateJobSchema>["body"];
export type JobIdParam = z.infer<typeof jobIdParamSchema>["params"];
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>["query"];