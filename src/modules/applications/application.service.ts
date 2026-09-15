import { Prisma } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { ApiError } from "@/utils/ApiError";
import {
  CreateApplicationInput,
  ListApplicationsQuery,
  UpdateApplicationStatusInput,
} from "./application.schema";

export const applicationService = {
  async applyToJob(userId: string, data: CreateApplicationInput) {
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      select: { id: true, status: true },
    });
    if (!job) throw ApiError.notFound("Job not found");
    if (job.status !== "OPEN") {
      throw ApiError.badRequest("This job is no longer accepting applications");
    }

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId },
      select: { id: true, userId: true },
    });
    if (!resume) throw ApiError.notFound("Resume not found");
    if (resume.userId !== userId) {
      throw ApiError.forbidden("You don't have access to this resume");
    }

    try {
      return await prisma.application.create({
        data: { userId, ...data },
        include: {
          job: { select: { id: true, title: true, company: true } },
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw ApiError.conflict("You have already applied to this job");
      }
      throw err;
    }
  },

  async listMyApplications(userId: string) {
    return prisma.application.findMany({
      where: { userId },
      include: {
        job: { select: { id: true, title: true, company: true, location: true } },
      },
      orderBy: { appliedAt: "desc" },
    });
  },

  async getMyApplicationById(userId: string, applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        resume: true,
      },
    });

    if (!application) throw ApiError.notFound("Application not found");
    if (application.userId !== userId) {
      throw ApiError.forbidden("You don't have access to this application");
    }

    return application;
  },

  async listAllApplications(query: ListApplicationsQuery) {
    const where: Prisma.ApplicationWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.jobId) where.jobId = query.jobId;

    const [applications, total] = await prisma.$transaction([
      prisma.application.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          job: { select: { id: true, title: true, company: true } },
        },
        orderBy: { appliedAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async updateApplicationStatus(
    applicationId: string,
    status: UpdateApplicationStatusInput["status"],
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw ApiError.notFound("Application not found");

    return prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
  },
};