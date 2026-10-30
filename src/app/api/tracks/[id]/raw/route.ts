import { eq } from "drizzle-orm";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { route } from "@/lib/handlers";

/** Stream an uploaded track; supports Range so <audio> can seek. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    ensureSeed();
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return new Response("Not found", { status: 404 });

    const row = db.select().from(t.tracks).where(eq(t.tracks.id, numId)).limit(1).all()[0];
    if (!row) return new Response("Not found", { status: 404 });

    const total = row.data.length;
    const range = req.headers.get("range");

    if (range) {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      const start = m && m[1] ? Number(m[1]) : 0;
      const end = m && m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
      if (start >= total || start > end) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      const chunk = new Uint8Array(row.data.subarray(start, end + 1));
      return new Response(chunk, {
        status: 206,
        headers: {
          "Content-Type": row.mime,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new Response(new Uint8Array(row.data), {
      headers: {
        "Content-Type": row.mime,
        "Content-Length": String(total),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  });
}
