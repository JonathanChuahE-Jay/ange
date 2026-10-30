import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as t from "@/lib/schema";
import { ApiError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { route } from "@/lib/handlers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    await requireAuth();
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) throw new ApiError("content.photos.not_found");
    db.delete(t.photos).where(eq(t.photos.id, numId)).run();
    return Response.json({ ok: true });
  });
}
