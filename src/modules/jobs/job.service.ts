import { Prisma } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { ApiError } from "@/utils/ApiError";
import { CreateJobInput, ListJobsQuery, UpdateJobInput } from "./job.schema";

export const jobService = {
  async createJob(data: CreateJobInput) {
    return prisma.job.create({ data });
  },

  async updateJob(jobId: string, data: UpdateJobInput) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound("Job not found");

    return prisma.job.update({ where: { id: jobId }, data });
  },

  async deleteJob(jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound("Job not found");

    return prisma.job.delete({ where: { id: jobId } });
  },

  async listJobs(query: ListJobsQuery) {
    const where: Prisma.JobWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { company: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.location) where.location = query.location;
    if (query.jobType) where.jobType = query.jobType;
    if (query.minSalary !== undefined) where.salaryMin = { gte: query.minSalary };
    if (query.maxSalary !== undefined) where.salaryMax = { lte: query.maxSalary };

    const orderBy: Prisma.JobOrderByWithRelationInput =
      query.sortBy === "salary_high"
        ? { salaryMax: "desc" }
        : query.sortBy === "salary_low"
          ? { salaryMin: "asc" }
          : { createdAt: "desc" };

    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getJobById(jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound("Job not found");
    return job;
  },
};