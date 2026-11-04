import { getGateHeading, getSiteContent } from "@/lib/content";
import { isUnlocked } from "@/lib/gate";
import { isAuthenticated } from "@/lib/auth";
import { SitePage } from "@/components/site/SitePage";
import { DateGate } from "@/components/site/DateGate";

export const dynamic = "force-dynamic";

export default async function Page() {
  // Nothing from the site (names, text, photos) is sent until the gate opens.
  if (!(await isUnlocked())) return <DateGate heading={getGateHeading()} />;
  return <SitePage initial={getSiteContent({ raw: await isAuthenticated() })} />;
}
