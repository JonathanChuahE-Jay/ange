import { z } from "zod";
import * as t from "@/lib/schema";
import { createHandler, listHandler } from "@/lib/resources";

const createSchema = z.object({
  label: z.string().trim().min(1).max(80),
  emoji: z.string().trim().max(8).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  weight: z.number().int().min(1).max(100),
});

const cfg = {
  table: t.prizes,
  createSchema,
  updateSchema: createSchema.partial(),
  invalidCode: "content.prizes.invalid" as const,
  notFoundCode: "content.prizes.not_found" as const,
};

export const GET = listHandler(cfg);
export const POST = createHandler(cfg);
