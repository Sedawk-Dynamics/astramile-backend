import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
});

// Public: submit a contact form
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);
    const row = await prisma.contactSubmission.create({ data });
    res.status(201).json({ ok: true, id: row.id });
  }),
);

// Admin: list all
router.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const rows = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(rows);
  }),
);

// Admin: mark read/unread
router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { isRead } = z.object({ isRead: z.boolean() }).parse(req.body);
    const row = await prisma.contactSubmission.update({
      where: { id: req.params.id },
      data: { isRead },
    });
    res.json(row);
  }),
);

// Admin: delete
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.contactSubmission.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

router.get(
  "/unread-count",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const count = await prisma.contactSubmission.count({ where: { isRead: false } });
    res.json({ count });
  }),
);

export default router;
