import { getSiteContent } from "@/lib/content";
import { route } from "@/lib/handlers";

export const dynamic = "force-dynamic";

export async function GET() {
  return route(async () => Response.json(getSiteContent()));
}
