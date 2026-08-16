import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import type { DataStore } from "./data/store.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { createApplicationsRouter } from "./routes/applications.js";
import { createAuthRouter } from "./routes/auth.js";
import { createDashboardRouter } from "./routes/dashboard.js";

export function createApp(store: DataStore) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.isProduction ? env.clientUrl : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  if (process.env.NODE_ENV !== "test") {
    app.use(
      "/api/auth",
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: "draft-7",
        legacyHeaders: false,
      }),
    );
  }

  app.get("/api/health", (_request, response) => {
    response.json({
      success: true,
      message: "Trackly API is healthy",
      data: { database: env.mongoUri ? "mongodb" : "memory" },
    });
  });
  app.use("/api/auth", createAuthRouter(store));
  app.use("/api/applications", createApplicationsRouter(store));
  app.use("/api/dashboard", createDashboardRouter(store));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
