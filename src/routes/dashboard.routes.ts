import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/summary",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const [
      rockets,
      missions,
      team,
      launches,
      news,
      blog,
      gallery,
      technology,
      contactSubmissions,
      unreadContacts,
      upcomingLaunches,
    ] = await Promise.all([
      prisma.rocket.count(),
      prisma.mission.count(),
      prisma.crewMember.count(),
      prisma.launch.count(),
      prisma.newsArticle.count(),
      prisma.blogPost.count(),
      prisma.galleryItem.count(),
      prisma.technology.count(),
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { isRead: false } }),
      prisma.launch.findMany({
        where: { scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        include: { rocket: true, mission: true },
      }),
    ]);

    res.json({
      counts: {
        rockets,
        missions,
        team,
        launches,
        news,
        blog,
        gallery,
        technology,
        contactSubmissions,
        unreadContacts,
      },
      upcomingLaunches,
    });
  }),
);

export default router;
