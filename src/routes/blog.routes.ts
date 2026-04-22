import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  category: z.string().nullable().optional(),
  excerpt: z.string().min(1),
  body: z.string().min(1),
  coverImage: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.coerce.date().optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "blogPost",
  autoSlugFrom: "title",
  createSchema,
  updateSchema,
  publicFilterPublished: true,
  orderBy: [{ publishedAt: "desc" }],
});
