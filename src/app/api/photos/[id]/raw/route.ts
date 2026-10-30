import { eq } from "drizzle-orm";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { route } from "@/lib/handlers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    ensureSeed();
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return new Response("Not found", { status: 404 });

    const row = db.select().from(t.photos).where(eq(t.photos.id, numId)).limit(1).all()[0];
    if (!row) return new Response("Not found", { status: 404 });

    const bytes = new Uint8Array(row.data);
    return new Response(bytes, {
      headers: {
        "Content-Type": row.mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  });
}
