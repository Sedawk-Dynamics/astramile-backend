import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  nationality: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "crewMember",
  autoSlugFrom: "name",
  createSchema,
  updateSchema,
  publicFilterPublished: true,
});
