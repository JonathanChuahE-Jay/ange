import { z } from "zod";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { route } from "@/lib/handlers";

const bodySchema = z.object({ answer: z.enum(["yes", "no"]) });

export async function POST(req: Request) {
  return route(async () => {
    ensureSeed();
    const { answer } = bodySchema.parse(await req.json());
    db.insert(t.answers)
      .values({ answer, createdAt: new Date().toISOString() })
      .run();
    return Response.json({ ok: true, answer });
  });
}
