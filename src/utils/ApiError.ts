export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, code = "ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = "BAD_REQUEST") {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
    return new ApiError(401, message, code);
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = "CONFLICT") {
    return new ApiError(409, message, code);
  }

  static serviceUnavailable(message = "Service unavailable", code = "SERVICE_UNAVAILABLE") {
    return new ApiError(503, message, code);
  }

  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new ApiError(500, message, code);
  }
}
