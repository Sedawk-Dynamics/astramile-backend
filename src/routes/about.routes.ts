import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const upsertSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  mission: z.string().nullable().optional(),
  vision: z.string().nullable().optional(),
  heroImage: z.string().nullable().optional(),
  stats: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
});

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const row = await prisma.aboutContent.findUnique({ where: { key: "default" } });
    res.json(
      row ?? {
        key: "default",
        headline: "",
        body: "",
        mission: null,
        vision: null,
        heroImage: null,
        stats: [],
        updatedAt: null,
      },
    );
  }),
);

router.put(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const data = upsertSchema.parse(req.body);
    const row = await prisma.aboutContent.upsert({
      where: { key: "default" },
      create: { key: "default", ...data, stats: data.stats ?? [] },
      update: { ...data, stats: data.stats ?? [] },
    });
    res.json(row);
  }),
);

export default router;
