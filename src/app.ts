import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";

import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";
import rocketsRoutes from "./routes/rockets.routes";
import missionsRoutes from "./routes/missions.routes";
import crewRoutes from "./routes/crew.routes";
import launchesRoutes from "./routes/launches.routes";
import newsRoutes from "./routes/news.routes";
import galleryRoutes from "./routes/gallery.routes";
import technologyRoutes from "./routes/technology.routes";
import statsRoutes from "./routes/stats.routes";
import aboutRoutes from "./routes/about.routes";
import contactRoutes from "./routes/contact.routes";
import dashboardRoutes from "./routes/dashboard.routes";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (env.CORS_ORIGIN.includes("*") || env.CORS_ORIGIN.includes(origin)) {
          return cb(null, true);
        }
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== "test") app.use(morgan("dev"));

  // Serve uploaded files statically
  app.use(
    "/uploads",
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
      maxAge: "7d",
      fallthrough: true,
    }),
  );

  app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

  app.use("/api/auth", authRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/rockets", rocketsRoutes);
  app.use("/api/missions", missionsRoutes);
  app.use("/api/crew", crewRoutes);
  app.use("/api/launches", launchesRoutes);
  app.use("/api/news", newsRoutes);
  app.use("/api/gallery", galleryRoutes);
  app.use("/api/technology", technologyRoutes);
  app.use("/api/stats", statsRoutes);
  app.use("/api/about", aboutRoutes);
  app.use("/api/contact", contactRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
