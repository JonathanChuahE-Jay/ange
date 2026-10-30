import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { eq, isNull } from "drizzle-orm";
import { imageSize } from "image-size";
import ffmpegStatic from "ffmpeg-static";
import { db } from "./db";
import * as t from "./schema";

/**
 * Turns a photo into a ~6s cinematic motion clip (mp4/h264) with ffmpeg:
 * eased Ken Burns zoom/pan (direction varies per photo), a slowly drifting
 * warm light leak, vignette and film grain. Effects ramp in over the first
 * second so frame 0 == the still photo → the UI can swap still→video with no
 * visible jump. Clips are stored on the photo row (photos.video).
 *
 * Rendering runs in a single-worker in-process queue so uploads return
 * immediately and the server never encodes more than one clip at a time.
 */

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";
const FPS = 30;
const SECONDS = 6;
const LONG_SIDE = 1080;

/** focus points (fraction of the frame) the camera eases toward */
const MOVES: [number, number, number][] = [
  // [x, y, zoom amount]
  [0.5, 0.5, 0.16],
  [0.62, 0.45, 0.15],
  [0.38, 0.55, 0.15],
  [0.5, 0.32, 0.17],
  [0.58, 0.64, 0.14],
];

function outputSize(w: number, h: number) {
  const scale = LONG_SIDE / Math.max(w, h);
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { W: even(w), H: even(h) };
}

export async function renderPhotoVideo(photoId: number): Promise<void> {
  const row = db
    .select({ data: t.photos.data, mime: t.photos.mime })
    .from(t.photos)
    .where(eq(t.photos.id, photoId))
    .limit(1)
    .all()[0];
  if (!row) return;

  const dims = imageSize(new Uint8Array(row.data));
  if (!dims.width || !dims.height) throw new Error(`photo ${photoId}: unreadable image`);
  const { W, H } = outputSize(dims.width, dims.height);
  const D = FPS * SECONDS;
  const [fx, fy, zoom] = MOVES[photoId % MOVES.length];
  const ease = `(1-cos(PI*on/${D}))/2`;

  const dir = await mkdtemp(path.join(tmpdir(), "ange-clip-"));
  const ext = row.mime === "image/png" ? "png" : row.mime === "image/webp" ? "webp" : row.mime === "image/gif" ? "gif" : "jpg";
  const input = path.join(dir, `in.${ext}`);
  const output = path.join(dir, "out.mp4");
  try {
    await writeFile(input, row.data);
    const filter = [
      // 2× supersample before zoompan → smooth sub-pixel motion (no jitter)
      `[0:v]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},` +
        `zoompan=z='1+${zoom}*${ease}':x='(iw-iw/zoom)*${fx}':y='(ih-ih/zoom)*${fy}':d=${D}:s=${W}x${H}:fps=${FPS},format=gbrp[base]`,
      // the leak fades in from black — screen-blending black is a no-op, so frame 0 == the still
      `[1:v]fade=t=in:st=0:d=1.2,format=gbrp[leak]`,
      // note: vignette's time variable is lowercase t; commas inside expressions must be escaped
      `[base][leak]blend=all_mode=screen:all_opacity=0.2,` +
        `vignette=angle='PI/5*min(t\\,1)':eval=frame,noise=alls=5:allf=t,format=yuv420p[v]`,
    ].join(";");
    const leak =
      `gradients=s=${W}x${H}:rate=${FPS}:duration=${SECONDS}:type=radial:nb_colors=3:` +
      `c0=0xffb27a:c1=0xd64560:c2=0x000000:x0=0:y0=0:x1=${W + 300}:y1=${H + 300}:speed=0.012:seed=${photoId}`;

    await run(
      FFMPEG,
      [
        "-y", "-hide_banner", "-loglevel", "error",
        "-i", input,
        "-f", "lavfi", "-i", leak,
        "-filter_complex", filter,
        "-map", "[v]",
        "-frames:v", String(D),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
        output,
      ],
      { timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
    );

    const video = await readFile(output);
    // the photo may have been deleted while rendering — update is then a no-op
    db.update(t.photos).set({ video, videoMime: "video/mp4" }).where(eq(t.photos.id, photoId)).run();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// ------------------------------------------------------------------ queue
type QueueState = { pending: number[]; queued: Set<number>; failed: Set<number>; running: boolean };

// survives Next dev hot-reloads
const g = globalThis as unknown as { __angeClipQueue?: QueueState };
const Q: QueueState = (g.__angeClipQueue ??= { pending: [], queued: new Set(), failed: new Set(), running: false });

async function drain() {
  if (Q.running) return;
  Q.running = true;
  try {
    while (Q.pending.length > 0) {
      const id = Q.pending.shift()!;
      try {
        const started = Date.now();
        await renderPhotoVideo(id);
        console.log(`[ange] motion clip for photo ${id} ready in ${Date.now() - started}ms`);
      } catch (err) {
        Q.failed.add(id); // don't retry endlessly; re-upload or restart to try again
        console.error(`[ange] motion clip for photo ${id} failed:`, err instanceof Error ? err.message : err);
      } finally {
        Q.queued.delete(id);
      }
    }
  } finally {
    Q.running = false;
  }
}

export function enqueuePhotoVideo(photoId: number) {
  if (Q.queued.has(photoId) || Q.failed.has(photoId)) return;
  Q.queued.add(photoId);
  Q.pending.push(photoId);
  void drain();
}

/** Queue every photo that doesn't have a clip yet (cheap: no blobs loaded). */
export function ensurePhotoVideos() {
  try {
    const missing = db.select({ id: t.photos.id }).from(t.photos).where(isNull(t.photos.video)).all();
    for (const { id } of missing) enqueuePhotoVideo(id);
  } catch {
    // DB not ready (e.g. during build) — try again on the next request
  }
}

export function isPhotoVideoFailed(photoId: number) {
  return Q.failed.has(photoId);
}

export function isPhotoVideoPending(photoId: number) {
  return Q.queued.has(photoId);
}
