import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import { route } from "@/lib/handlers";

const bodySchema = z.object({
  ids: z.array(z.number().int()).min(1).max(200), // in the new display order
});

/** Persist a new chat order (drag & drop in the admin list). */
export async function PUT(req: Request) {
  return route(async () => {
    await requireAuth();
    ensureSeed();
    const { ids } = bodySchema.parse(await req.json());
    db.transaction((tx) => {
      ids.forEach((id, index) => {
        tx.update(t.chatQuotes).set({ position: index }).where(eq(t.chatQuotes.id, id)).run();
      });
    });
    return Response.json({ ok: true });
  });
}
