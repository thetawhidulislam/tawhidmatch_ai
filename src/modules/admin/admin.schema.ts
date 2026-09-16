import { z } from "zod";

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    role: z.enum(["USER", "ADMIN"]).optional(),
    search: z.string().optional(),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(["USER", "ADMIN"]),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>["query"];
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>["body"];
export type UserIdParam = z.infer<typeof userIdParamSchema>["params"];
