import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  category: z.string().min(1),
  excerpt: z.string().min(1),
  body: z.string().min(1),
  coverImage: z.string().nullable().optional(),
  publishedAt: z.coerce.date().optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "newsArticle",
  autoSlugFrom: "title",
  createSchema,
  updateSchema,
  publicFilterPublished: true,
  orderBy: [{ publishedAt: "desc" }],
});
