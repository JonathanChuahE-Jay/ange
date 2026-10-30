import { z } from "zod";
import * as t from "@/lib/schema";
import { createHandler, listHandler } from "@/lib/resources";

const createSchema = z.object({
  date: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  emoji: z.string().trim().min(1).max(8),
});

export const GET = listHandler({
  table: t.timelineEvents,
  createSchema,
  updateSchema: createSchema.partial(),
  invalidCode: "content.timeline.invalid",
  notFoundCode: "content.timeline.not_found",
});

export const POST = createHandler({
  table: t.timelineEvents,
  createSchema,
  updateSchema: createSchema.partial(),
  invalidCode: "content.timeline.invalid",
  notFoundCode: "content.timeline.not_found",
});
