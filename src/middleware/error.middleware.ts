import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
}

// Must be registered LAST, after all routes.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // Unknown/unexpected errors — never leak internal details to the client.
  console.error("[UNHANDLED ERROR]", err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    code: "INTERNAL_ERROR",
  });
}
