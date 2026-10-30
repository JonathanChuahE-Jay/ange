import { eq } from "drizzle-orm";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { ApiError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { route } from "@/lib/handlers";
import { retryPhotoVideo } from "@/lib/photoVideo";

const MAX_BYTES = 32 * 1024 * 1024;

/** Attach YOUR real video to a photo (replaces the auto-generated motion clip). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    await requireAuth();
    ensureSeed();
    const numId = Number((await params).id);
    if (!Number.isInteger(numId)) throw new ApiError("content.photos.not_found");
    const exists = db.select({ id: t.photos.id }).from(t.photos).where(eq(t.photos.id, numId)).limit(1).all()[0];
    if (!exists) throw new ApiError("content.photos.not_found");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("content.photos.invalid", "Pick a video file first.");
    if (!file.type.startsWith("video/")) throw new ApiError("upload.video.unsupported_type");
    if (file.size > MAX_BYTES) throw new ApiError("upload.video.too_large");

    const buffer = Buffer.from(await file.arrayBuffer());
    db.update(t.photos)
      .set({ video: buffer, videoMime: file.type, videoSource: "user" })
      .where(eq(t.photos.id, numId))
      .run();
    return Response.json({ ok: true, source: "user", bytes: buffer.length });
  });
}

/** Remove your video — the auto-generated motion clip is re-rendered instead. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    await requireAuth();
    ensureSeed();
    const numId = Number((await params).id);
    if (!Number.isInteger(numId)) throw new ApiError("content.photos.not_found");
    db.update(t.photos)
      .set({ video: null, videoMime: null, videoSource: null })
      .where(eq(t.photos.id, numId))
      .run();
    retryPhotoVideo(numId);
    return Response.json({ ok: true });
  });
}
