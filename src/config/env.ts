import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "4000", 10),
  CORS_ORIGIN: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL ?? "admin@astramile.local",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME ?? "AstraMile Admin",
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "uploads",
  MAX_UPLOAD_MB: parseInt(process.env.MAX_UPLOAD_MB ?? "10", 10),
};
