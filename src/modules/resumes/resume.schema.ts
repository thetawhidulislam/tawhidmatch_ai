import { z } from "zod";

export const resumeIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid resume id"),
  }),
});