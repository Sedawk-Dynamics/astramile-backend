import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const missionStatus = z.enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]);

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  destination: z.string().nullable().optional(),
  status: missionStatus.optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  image: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "mission",
  autoSlugFrom: "name",
  createSchema,
  updateSchema,
  publicFilterPublished: true,
  include: { launches: true },
});
