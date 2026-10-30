import { z } from "zod";
import * as t from "@/lib/schema";
import { deleteHandler, updateHandler } from "@/lib/resources";

const updateSchema = z.object({
  emoji: z.string().trim().max(8).default(""),
  text: z.string().trim().min(1).max(120),
});

const cfg = {
  table: t.loves,
  createSchema: updateSchema,
  updateSchema,
  invalidCode: "content.loves.invalid" as const,
  notFoundCode: "content.loves.not_found" as const,
};

export const PUT = updateHandler(cfg);
export const DELETE = deleteHandler(cfg);
