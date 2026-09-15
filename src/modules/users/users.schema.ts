import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().max(1000).optional(),
    github: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal("")),
    portfolio: z.string().url().optional().or(z.literal("")),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
