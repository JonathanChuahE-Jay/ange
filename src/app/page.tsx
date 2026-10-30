import { getSiteContent } from "@/lib/content";
import { SitePage } from "@/components/site/SitePage";

export const dynamic = "force-dynamic";

export default function Page() {
  return <SitePage initial={getSiteContent()} />;
}
