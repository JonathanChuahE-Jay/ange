import { z } from "zod";
import * as t from "@/lib/schema";
import { deleteHandler, updateHandler } from "@/lib/resources";

const updateSchema = z.object({
  side: z.enum(["me", "partner"]),
  text: z.string().trim().min(1).max(500),
  timeLabel: z.string().trim().max(20),
  delayMs: z.number().int().min(0).max(60_000),
});

const cfg = {
  table: t.chatQuotes,
  createSchema: updateSchema,
  updateSchema,
  invalidCode: "content.chats.invalid" as const,
  notFoundCode: "content.chats.not_found" as const,
};

export const PUT = updateHandler(cfg);
export const DELETE = deleteHandler(cfg);
