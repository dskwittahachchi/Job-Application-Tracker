import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import type { DataStore } from "../data/store.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { AppError } from "../middleware/errors.js";

const authSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = authSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password needs an uppercase letter")
    .regex(/[0-9]/, "Password needs a number"),
});

export function createAuthRouter(store: DataStore) {
  const router = Router();

  router.post("/register", async (request, response) => {
    const input = registerSchema.parse(request.body);
    const existingUser = await store.findUserByEmail(input.email);
    if (existingUser) {
      throw new AppError("An account with that email already exists", 409);
    }
    const user = await store.createUser({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
    });
    response.status(201).json({
      success: true,
      message: "Welcome to Trackly",
      data: { user, token: signToken(user.id) },
    });
  });

  router.post("/login", async (request, response) => {
    const input = authSchema.parse(request.body);
    const user = await store.findUserByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError("Email or password is incorrect", 401);
    }
    const { passwordHash: _passwordHash, ...safeUser } = user;
    response.json({
      success: true,
      message: "Welcome back",
      data: { user: safeUser, token: signToken(user.id) },
    });
  });

  router.get("/me", requireAuth, async (request, response) => {
    const user = await store.getUser(request.userId!);
    if (!user) throw new AppError("User account was not found", 404);
    response.json({ success: true, message: "Profile loaded", data: user });
  });

  return router;
}
