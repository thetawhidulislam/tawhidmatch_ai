import bcrypt from "bcrypt";
import { prisma } from "@/database/prisma";
import { ApiError } from "@/utils/ApiError";
import { signToken } from "@/utils/jwt";
import { LoginInput, RegisterInput } from "./auth.schema";

const SALT_ROUNDS = 10;

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw ApiError.conflict("An account with this email already exists", "EMAIL_TAKEN");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = signToken({ userId: user.id, role: user.role });

    return { user, token };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);

    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = signToken({ userId: user.id, role: user.role });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    };
  },

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

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  },
};
