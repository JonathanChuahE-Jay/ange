import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { ApiError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { paged, parsePage, route } from "@/lib/handlers";
import { enqueuePhotoVideo, isPhotoVideoFailed, isPhotoVideoPending } from "@/lib/photoVideo";

const bodySchema = z.object({
  id: z.number().int(),
  caption: z.string().max(300),
});

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** List photo metadata (no blobs). */
export async function GET(req: Request) {
  return route(async () => {
    await requireAuth();
    ensureSeed();
    const p = parsePage(new URL(req.url));
    const rows = db
      .select({
        id: t.photos.id,
        caption: t.photos.caption,
        mime: t.photos.mime,
        hasVideo: sql<number>`${t.photos.video} IS NOT NULL`,
        videoSource: t.photos.videoSource,
        position: t.photos.position,
        createdAt: t.photos.createdAt,
      })
      .from(t.photos)
      .orderBy(asc(t.photos.position), asc(t.photos.id))
      .limit(p.pageSize)
      .offset((p.page - 1) * p.pageSize)
      .all();
    const total = db.select({ v: sql<number>`COUNT(*)` }).from(t.photos).all()[0];
    const items = rows.map((r) => ({
      ...r,
      hasVideo: Boolean(r.hasVideo),
      videoSource: r.videoSource ?? null,
      videoPending: !r.hasVideo && isPhotoVideoPending(r.id),
      videoFailed: !r.hasVideo && isPhotoVideoFailed(r.id),
    }));
    return Response.json(paged(items, Number(total?.v ?? 0), p));
  });
}

/** Upload a photo (multipart form: file + caption). */
export async function POST(req: Request) {
  return route(async () => {
    await requireAuth();
    ensureSeed();

    const form = await req.formData();
    const file = form.get("file");
    const caption = String(form.get("caption") ?? "").slice(0, 300);

    if (!(file instanceof File)) throw new ApiError("content.photos.invalid", "Pick a file first.");
    if (!ALLOWED.has(file.type)) throw new ApiError("upload.photo.unsupported_type");
    if (file.size > MAX_BYTES) throw new ApiError("upload.photo.too_large");

    const buffer = Buffer.from(await file.arrayBuffer());
    const next =
      db.select({ v: sql<number>`COALESCE(MAX(${t.photos.position}), -1) + 1` }).from(t.photos).all()[0];
    const inserted = db
      .insert(t.photos)
      .values({
        caption,
        mime: file.type,
        data: buffer,
        position: Number(next?.v ?? 0),
        createdAt: new Date().toISOString(),
      })
      .returning({ id: t.photos.id, caption: t.photos.caption })
      .all();
    // render the motion clip in the background; the upload returns right away
    enqueuePhotoVideo(inserted[0].id);
    return Response.json(inserted[0], { status: 201 });
  });
}

/** Update caption only (photo bytes are immutable — delete + re-upload). */
export async function PUT(req: Request) {
  return route(async () => {
    await requireAuth();
    const body = bodySchema.parse(await req.json());
    const exists = db.select().from(t.photos).where(eq(t.photos.id, body.id)).limit(1).all()[0];
    if (!exists) throw new ApiError("content.photos.not_found");
    db.update(t.photos).set({ caption: body.caption }).where(eq(t.photos.id, body.id)).run();
    return Response.json({ id: body.id, caption: body.caption });
  });
}
