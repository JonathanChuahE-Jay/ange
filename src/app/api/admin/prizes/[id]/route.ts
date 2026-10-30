import { z } from "zod";
import * as t from "@/lib/schema";
import { deleteHandler, updateHandler } from "@/lib/resources";

const updateSchema = z.object({
  label: z.string().trim().min(1).max(80),
  emoji: z.string().trim().min(1).max(8),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  weight: z.number().int().min(1).max(100),
});

const cfg = {
  table: t.prizes,
  createSchema: updateSchema,
  updateSchema,
  invalidCode: "content.prizes.invalid" as const,
  notFoundCode: "content.prizes.not_found" as const,
};

export const PUT = updateHandler(cfg);
export const DELETE = deleteHandler(cfg);
