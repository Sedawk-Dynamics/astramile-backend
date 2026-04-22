import { Request, Response, Router } from "express";
import { z, ZodSchema } from "zod";
import { prisma } from "./prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { slugify } from "../utils/slug";

type PrismaDelegate = {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  findFirst: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
};

export interface CrudOptions<TCreate, TUpdate> {
  /** Prisma model name on prisma client, e.g. "rocket" */
  model: keyof typeof prisma;
  /** Optional: pluck slug from name automatically when not provided */
  autoSlugFrom?: string;
  createSchema: ZodSchema<TCreate>;
  updateSchema: ZodSchema<TUpdate>;
  /** default ordering */
  orderBy?: Record<string, "asc" | "desc">[] | Record<string, "asc" | "desc">;
  /** Whether the public (no-auth) listing should filter isPublished */
  publicFilterPublished?: boolean;
  /** Extra where for public listing */
  publicWhere?: Record<string, unknown>;
  /** Include relations on fetches */
  include?: Record<string, unknown>;
}

export function crudRouter<TCreate extends Record<string, unknown>, TUpdate extends Record<string, unknown>>(
  opts: CrudOptions<TCreate, TUpdate>,
): Router {
  const router = Router();
  const delegate = (prisma as unknown as Record<string, PrismaDelegate>)[opts.model as string];
  if (!delegate) throw new Error(`Unknown Prisma model: ${String(opts.model)}`);

  const orderBy = opts.orderBy ?? [{ order: "asc" }, { createdAt: "desc" }];

  // Public list (isPublished=true) — no auth required
  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const showAll = req.query.all === "true" || req.headers.authorization;
      const where: Record<string, unknown> = {
        ...(opts.publicFilterPublished && !showAll ? { isPublished: true } : {}),
        ...(opts.publicWhere ?? {}),
      };
      const rows = await delegate.findMany({
        where,
        orderBy,
        include: opts.include,
      });
      res.json(rows);
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const row = await delegate.findUnique({
        where: { id: req.params.id },
        include: opts.include,
      });
      if (!row) throw new HttpError(404, "Not found");
      res.json(row);
    }),
  );

  router.post(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = opts.createSchema.parse(req.body) as Record<string, unknown>;
      if (opts.autoSlugFrom && !data.slug && typeof data[opts.autoSlugFrom] === "string") {
        data.slug = slugify(data[opts.autoSlugFrom] as string);
      }
      const row = await delegate.create({ data, include: opts.include });
      res.status(201).json(row);
    }),
  );

  router.patch(
    "/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = opts.updateSchema.parse(req.body) as Record<string, unknown>;
      const row = await delegate.update({
        where: { id: req.params.id },
        data,
        include: opts.include,
      });
      res.json(row);
    }),
  );

  router.delete(
    "/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).end();
    }),
  );

  return router;
}

/** Helper for optional fields on update schemas */
export const optional = <T extends ZodSchema>(s: T) => s.optional();
export { z };
