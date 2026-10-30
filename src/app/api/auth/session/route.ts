import { z } from "zod";
import { checkPassword, createSession, destroySession, isAuthenticated } from "@/lib/auth";
import { route } from "@/lib/handlers";

const bodySchema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  return route(async () => {
    const { password } = bodySchema.parse(await req.json());
    checkPassword(password);
    await createSession();
    return Response.json({ ok: true });
  });
}

export async function DELETE() {
  return route(async () => {
    await destroySession();
    return Response.json({ ok: true });
  });
}

export async function GET() {
  return route(async () => Response.json({ authenticated: await isAuthenticated() }));
}
