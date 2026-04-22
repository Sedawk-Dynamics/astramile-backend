import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().nullable().optional(),
  metric: z.string().nullable().optional(),
  metricLabel: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "technology",
  autoSlugFrom: "title",
  createSchema,
  updateSchema,
  publicFilterPublished: true,
});
