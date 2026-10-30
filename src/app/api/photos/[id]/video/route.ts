import { eq } from "drizzle-orm";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { route } from "@/lib/handlers";
import { requireUnlocked } from "@/lib/gate";

/** Stream a photo's generated motion clip (Range-aware so <video> can seek). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    await requireUnlocked();
    ensureSeed();
    const numId = Number((await params).id);
    if (!Number.isInteger(numId)) return new Response("Not found", { status: 404 });

    const row = db
      .select({ video: t.photos.video, mime: t.photos.videoMime })
      .from(t.photos)
      .where(eq(t.photos.id, numId))
      .limit(1)
      .all()[0];
    if (!row?.video) return new Response("Not ready", { status: 404 });

    const data = row.video;
    const total = data.length;
    const mime = row.mime || "video/mp4";
    const common = { "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=86400", "Content-Type": mime };
    const range = req.headers.get("range");
    if (range) {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      const start = m && m[1] ? Number(m[1]) : 0;
      const end = m && m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
      if (start >= total || start > end) {
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
      }
      return new Response(new Uint8Array(data.subarray(start, end + 1)), {
        status: 206,
        headers: { ...common, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${total}` },
      });
    }
    return new Response(new Uint8Array(data), { headers: { ...common, "Content-Length": String(total) } });
  });
}
