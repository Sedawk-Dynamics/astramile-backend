import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/HttpError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "ValidationError", issues: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  const isProd = process.env.NODE_ENV === "production";
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  res.status(500).json({
    error: "InternalServerError",
    message: isProd ? "Something went wrong" : (err as Error)?.message,
  });
};

export const notFoundHandler = (_req: unknown, res: any) => {
  res.status(404).json({ error: "NotFound" });
};
