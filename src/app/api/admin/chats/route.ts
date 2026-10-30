import { z } from "zod";
import * as t from "@/lib/schema";
import { createHandler, listHandler } from "@/lib/resources";

const createSchema = z.object({
  side: z.enum(["me", "partner"]),
  text: z.string().trim().min(1).max(500),
  timeLabel: z.string().trim().max(20),
  delayMs: z.number().int().min(0).max(60_000),
});

const cfg = {
  table: t.chatQuotes,
  createSchema,
  updateSchema: createSchema.partial(),
  invalidCode: "content.chats.invalid" as const,
  notFoundCode: "content.chats.not_found" as const,
};

export const GET = listHandler(cfg);
export const POST = createHandler(cfg);
