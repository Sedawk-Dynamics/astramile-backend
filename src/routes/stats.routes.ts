import { z } from "zod";
import { crudRouter } from "../lib/crudFactory";

const createSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  order: z.number().int().optional(),
});

const updateSchema = createSchema.partial();

export default crudRouter({
  model: "siteStat",
  createSchema,
  updateSchema,
});
