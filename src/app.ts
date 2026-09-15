import cors from "cors";
import express, { Request, Response } from "express";
import { env } from "@/config/env";
import { errorHandler, notFoundHandler } from "@/middleware/error.middleware";
import authRoutes from "@/modules/auth/auth.route";
import { adminJobRoutes, publicJobRoutes } from "@/modules/jobs/job.route";
import usersRoutes from "@/modules/users/users.route";

const app = express();

// --- Global middleware ---
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get("/health", (_req: Request, res: Response) => {
  res.json({ success: true, message: "TawhidMatch AI API is running" });
});

// --- Feature routes ---
// As new modules are added (resumes, jobs, applications, interviews, ai),
// mount them here the same way — keep this file as the single routing map.
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin/jobs", adminJobRoutes);
app.use("/api/jobs", publicJobRoutes);

// --- 404 + centralized error handler (must stay last, in this order) ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
