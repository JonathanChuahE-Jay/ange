import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { ApiError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { paged, parsePage, route } from "@/lib/handlers";

const MAX_BYTES = 16 * 1024 * 1024;

const metaSchema = z.object({
  title: z.string().trim().min(1).max(120),
  artist: z.string().trim().max(120),
  note: z.string().trim().max(300),
});

/** List track metadata (no blobs). */
export async function GET(req: Request) {
  return route(async () => {
    await requireAuth();
    ensureSeed();
    const p = parsePage(new URL(req.url));
    const rows = db
      .select({
        id: t.tracks.id,
        title: t.tracks.title,
        artist: t.tracks.artist,
        note: t.tracks.note,
        mime: t.tracks.mime,
        position: t.tracks.position,
        createdAt: t.tracks.createdAt,
      })
      .from(t.tracks)
      .orderBy(asc(t.tracks.position), asc(t.tracks.id))
      .limit(p.pageSize)
      .offset((p.page - 1) * p.pageSize)
      .all();
    const total = db.select({ v: sql<number>`COUNT(*)` }).from(t.tracks).all()[0];
    return Response.json(paged(rows, Number(total?.v ?? 0), p));
  });
}

/** Upload an audio file (multipart form: file + optional title/artist/note). */
export async function POST(req: Request) {
  return route(async () => {
    await requireAuth();
    ensureSeed();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("content.tracks.invalid", "Pick an audio file first.");
    if (!file.type.startsWith("audio/")) throw new ApiError("upload.track.unsupported_type");
    if (file.size > MAX_BYTES) throw new ApiError("upload.track.too_large");

    const meta = metaSchema.parse({
      title: String(form.get("title") || file.name.replace(/\.[^.]+$/, "")).slice(0, 120) || file.name,
      artist: String(form.get("artist") ?? ""),
      note: String(form.get("note") ?? ""),
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const next =
      db.select({ v: sql<number>`COALESCE(MAX(${t.tracks.position}), -1) + 1` }).from(t.tracks).all()[0];
    const inserted = db
      .insert(t.tracks)
      .values({
        title: meta.title,
        artist: meta.artist,
        note: meta.note,
        mime: file.type,
        data: buffer,
        position: Number(next?.v ?? 0),
        createdAt: new Date().toISOString(),
      })
      .returning({ id: t.tracks.id, title: t.tracks.title, artist: t.tracks.artist })
      .all();
    return Response.json(inserted[0], { status: 201 });
  });
}

/** Update title/artist/note only (audio bytes are immutable). */
export async function PUT(req: Request) {
  return route(async () => {
    await requireAuth();
    const body = metaSchema.and(z.object({ id: z.number().int() })).parse(await req.json());
    const exists = db.select().from(t.tracks).where(eq(t.tracks.id, body.id)).limit(1).all()[0];
    if (!exists) throw new ApiError("content.tracks.not_found");
    db.update(t.tracks)
      .set({ title: body.title, artist: body.artist, note: body.note })
      .where(eq(t.tracks.id, body.id))
      .run();
    return Response.json({ id: body.id, title: body.title, artist: body.artist, note: body.note });
  });
}
