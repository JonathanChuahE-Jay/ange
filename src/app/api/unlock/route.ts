import { z } from "zod";
import { route } from "@/lib/handlers";
import { clearAttempts, rateLimit, tryUnlock } from "@/lib/gate";

const bodySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD") });

/** Forwarded headers are client-controlled unless a trusted proxy sets them,
 *  so only honour them when TRUST_PROXY=1 (e.g. behind Vercel/nginx). */
function clientKey(req: Request) {
  if (process.env.TRUST_PROXY !== "1") return "direct";
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "direct";
}

export async function POST(req: Request) {
  return route(async () => {
    const key = clientKey(req);
    rateLimit(key);
    const { date } = bodySchema.parse(await req.json());
    await tryUnlock(date);
    clearAttempts(key);
    return Response.json({ ok: true });
  });
}
