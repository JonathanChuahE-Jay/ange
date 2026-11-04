import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import { route } from "@/lib/handlers";
import { HEADING_SECTIONS, parseHeadings, type HeadingKey } from "@/lib/headings";

const keys = HEADING_SECTIONS.map((s) => s.key) as [HeadingKey, ...HeadingKey[]];
const bodySchema = z.object({
  section: z.enum(keys),
  kicker: z.string().trim().max(80),
  title: z.string().trim().min(1).max(120),
  note: z.string().trim().max(160),
});

/** Update one section's heading (merges into settings.headings). */
export async function PUT(req: Request) {
  return route(async () => {
    await requireAuth();
    ensureSeed();
    const { section, kicker, title, note } = bodySchema.parse(await req.json());
    const row = db.select({ headings: t.settings.headings }).from(t.settings).limit(1).all()[0];
    const headings = parseHeadings(row?.headings);
    headings[section] = { kicker, title, note };
    db.update(t.settings)
      .set({ headings: JSON.stringify(headings), updatedAt: new Date().toISOString() })
      .where(eq(t.settings.id, 1))
      .run();
    return Response.json({ ok: true });
  });
}
