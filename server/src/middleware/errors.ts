import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public errors: unknown[] = [],
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(`Route ${request.method} ${request.path} was not found`, 404));
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      message: "Please review the highlighted fields",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const maybeMongoError = error as { code?: number };
  if (maybeMongoError?.code === 11000) {
    response.status(409).json({
      success: false,
      message: "An account with that email already exists",
      errors: [],
    });
    return;
  }

  const appError =
    error instanceof AppError
      ? error
      : new AppError(
          env.isProduction ? "Something went wrong" : String(error),
          500,
        );

  if (!env.isProduction && !(error instanceof AppError)) {
    console.error(error);
  }

  response.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    errors: appError.errors,
  });
};
