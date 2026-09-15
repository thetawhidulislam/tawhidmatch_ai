import { Prisma } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { ApiError } from "@/utils/ApiError";
import { CreateJobInput, ListJobsQuery, UpdateJobInput } from "./job.schema";

function extractSkillNames(skills: Prisma.JsonValue): Set<string> {
  if (!Array.isArray(skills)) return new Set<string>();

  const skillNames = skills.flatMap((skill): string[] => {
    if (typeof skill !== "object" || skill === null || Array.isArray(skill)) {
      return [];
    }

    const name = (skill as { name?: unknown }).name;
    return typeof name === "string" ? [name.trim().toLowerCase()] : [];
  });

  return new Set(skillNames);
}

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

  async calculateJobMatch(userId: string, jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound("Job not found");

    const resume = await prisma.resume.findFirst({
      where: { userId, isActive: true },
      include: { aianalysis: true },
    });
    if (!resume || !resume.aianalysis) {
      throw ApiError.badRequest(
        "You need an analyzed resume before checking job matches",
        "NO_ACTIVE_RESUME",
      );
    }

    const resumeSkillNames = extractSkillNames(resume.aianalysis.skills);
    const matched: string[] = [];
    const missing: string[] = [];

    for (const skill of job.skills) {
      if (resumeSkillNames.has(skill.trim().toLowerCase())) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }

    const matchScore =
      job.skills.length === 0 ? 0 : Math.round((matched.length / job.skills.length) * 100);

    return {
      jobId,
      jobTitle: job.title,
      matchScore,
      matched,
      missing,
      resumeId: resume.id,
    };
  },
};