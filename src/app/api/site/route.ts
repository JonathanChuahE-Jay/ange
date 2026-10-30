import { getSiteContent } from "@/lib/content";
import { route } from "@/lib/handlers";
import { isAuthenticated } from "@/lib/auth";
import { requireUnlocked } from "@/lib/gate";

export const dynamic = "force-dynamic";

export async function GET() {
  return route(async () => {
    await requireUnlocked();
    // admin sees raw content (for editing); guests get the emoji-free version
    return Response.json(getSiteContent({ raw: await isAuthenticated() }));
  });
}
