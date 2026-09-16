import { Prisma } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { ApiError } from "@/utils/ApiError";
import {
  ListUsersQuery,
  UpdateUserRoleInput,
} from "./admin.schema";

const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const userRoleSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

export const adminService = {
  async listUsers(query: ListUsersQuery) {
    const where: Prisma.UserWhereInput = {};

    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: userListSelect,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async updateUserRole(userId: string, role: UpdateUserRoleInput["role"]) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: userRoleSelect,
    });
  },

  async getDashboardStats() {
    const [totalUsers, totalJobs, openJobs, totalApplications, completedInterviews, totalResumes] =
      await Promise.all([
        prisma.user.count(),
        prisma.job.count(),
        prisma.job.count({ where: { status: "OPEN" } }),
        prisma.application.count(),
        prisma.interview.count({ where: { status: "COMPLETED" } }),
        prisma.resume.count(),
      ]);

    return {
      totalUsers,
      totalJobs,
      openJobs,
      totalApplications,
      completedInterviews,
      totalResumes,
    };
  },
};
