import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI?.trim() ?? "",
  jwtSecret:
    process.env.JWT_SECRET?.trim() ??
    (isProduction ? "" : "development-only-secret-change-before-production"),
  clientUrl: process.env.CLIENT_URL?.trim() ?? "http://localhost:5173",
  isProduction,
};

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is required in production");
}
