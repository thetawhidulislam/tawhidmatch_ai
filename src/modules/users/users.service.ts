import { prisma } from "@/database/prisma";
import { ApiError } from "@/utils/ApiError";
import { UpdateProfileInput } from "./users.schema";

export const usersService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  async updateMe(userId: string, input: UpdateProfileInput) {
    const { name, ...profileFields } = input;

    await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({ where: { id: userId }, data: { name } });
      }
      await tx.profile.upsert({
        where: { userId },
        create: { userId, ...profileFields },
        update: profileFields,
      });
    });

    return this.getMe(userId);
  },
};
