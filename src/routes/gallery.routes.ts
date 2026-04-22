import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const createSchema = z.object({
  title: z.string().min(1),
  caption: z.string().nullable().optional(),
  image: z.string().min(1),
  category: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "galleryItem",
  createSchema,
  updateSchema,
  publicFilterPublished: true,
});
