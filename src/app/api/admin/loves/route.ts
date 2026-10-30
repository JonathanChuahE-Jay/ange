import { z } from "zod";
import * as t from "@/lib/schema";
import { createHandler, listHandler } from "@/lib/resources";

const createSchema = z.object({
  emoji: z.string().trim().max(8).default(""),
  text: z.string().trim().min(1).max(120),
});

const cfg = {
  table: t.loves,
  createSchema,
  updateSchema: createSchema.partial(),
  invalidCode: "content.loves.invalid" as const,
  notFoundCode: "content.loves.not_found" as const,
};

export const GET = listHandler(cfg);
export const POST = createHandler(cfg);
