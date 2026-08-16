import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

type TokenPayload = { sub: string };

export const signToken = (userId: string) =>
  jwt.sign({}, env.jwtSecret, { subject: userId, expiresIn: "7d" });

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError("Please sign in to continue", 401));
    return;
  }

  try {
    const payload = jwt.verify(
      authorization.slice(7),
      env.jwtSecret,
    ) as TokenPayload;
    request.userId = payload.sub;
    next();
  } catch {
    next(new AppError("Your session has expired. Please sign in again", 401));
  }
};
