import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1),
  tagline: z.string().optional().nullable(),
  description: z.string().min(1),
  heightM: z.number().nullable().optional(),
  weightKg: z.number().nullable().optional(),
  payloadKg: z.number().nullable().optional(),
  successRate: z.number().min(0).max(100).nullable().optional(),
  launches: z.number().int().min(0).optional(),
  features: z.array(z.string()).optional(),
  image: z.string().url().or(z.string().startsWith("/")).nullable().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "rocket",
  autoSlugFrom: "name",
  createSchema,
  updateSchema,
  publicFilterPublished: true,
});
