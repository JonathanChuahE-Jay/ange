import { z } from "zod";
import * as t from "@/lib/schema";
import { deleteHandler, updateHandler } from "@/lib/resources";

const updateSchema = z.object({
  date: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  emoji: z.string().trim().min(1).max(8),
});

const cfg = {
  table: t.timelineEvents,
  createSchema: updateSchema,
  updateSchema,
  invalidCode: "content.timeline.invalid" as const,
  notFoundCode: "content.timeline.not_found" as const,
};

export const PUT = updateHandler(cfg);
export const DELETE = deleteHandler(cfg);
