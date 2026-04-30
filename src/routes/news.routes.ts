import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  category: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  articleImage: z.string().nullable().optional(),
  newsLink: z.string().url().nullable().optional().or(z.literal("")),
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
