import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import { route } from "@/lib/handlers";

/** Re-arm the big question: clears every recorded answer (admin only). */
export async function DELETE() {
  return route(async () => {
    await requireAuth();
    ensureSeed();
    const removed = db.delete(t.answers).run().changes;
    return Response.json({ ok: true, removed });
  });
}
