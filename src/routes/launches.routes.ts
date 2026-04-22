import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const launchStatus = z.enum(["UPCOMING", "LIVE", "SUCCESS", "FAILURE", "SCRUBBED"]);

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  scheduledAt: z.coerce.date(),
  launchSite: z.string().nullable().optional(),
  status: launchStatus.optional(),
  streamUrl: z.string().url().nullable().optional(),
  image: z.string().nullable().optional(),
  rocketId: z.string().nullable().optional(),
  missionId: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "launch",
  autoSlugFrom: "name",
  createSchema,
  updateSchema,
  publicFilterPublished: true,
  orderBy: [{ scheduledAt: "desc" }],
  include: { rocket: true, mission: true },
});
