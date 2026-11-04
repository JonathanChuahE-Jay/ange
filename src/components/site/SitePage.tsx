"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SiteContent } from "@/lib/types";
import { SkeletonSection } from "@/components/ui/Skeleton";
import { Hero } from "./Hero";
import { Timeline } from "./Timeline";
import { Photos } from "./Photos";
import { Chats } from "./Chats";
import { Letter } from "./Letter";
import { Loves } from "./Loves";
import { Games } from "./Games";
import { Countdown } from "./Countdown";
import { Footer } from "./Footer";
import { DotNav } from "./DotNav";
import { HeadingsProvider } from "./SectionHeading";
import { TopMusicBar } from "./TopMusicBar";
import { CustomCursor } from "./CustomCursor";
import { SmoothScroll } from "./SmoothScroll";
import { ScrollProgress } from "@/components/kit/scroll-progress";

export function SitePage({ initial }: { initial: SiteContent }) {
  const { data, isPending } = useQuery({
    queryKey: ["site"],
    queryFn: () => api.get<SiteContent>("/api/site"),
    initialData: initial,
  });

  if (isPending && !data) return <SkeletonSection />;
  const c = data ?? initial;

  return (
    <HeadingsProvider value={c.settings.headings}>
    <main className="relative">
      <ScrollProgress className="z-[60] h-[3px] from-rose via-gold to-rosesoft shadow-[0_0_10px_rgb(214_69_96/0.6)]" />
      <TopMusicBar tracks={c.tracks} />
      <Hero settings={c.settings} answeredYesAt={c.answeredYesAt} />
      <Timeline events={c.timeline} />
      <Photos photos={c.photos} />
      <Chats
        chats={c.chats}
        partnerName={c.settings.partnerName}
      />
      <Letter settings={c.settings} />
      <Loves loves={c.loves} />
      <Games photos={c.photos} quiz={c.quiz} />
      <Countdown settings={c.settings} />
      <Footer askerName={c.settings.askerName} partnerName={c.settings.partnerName} />
      <DotNav />
      <CustomCursor />
      <SmoothScroll />
    </main>
    </HeadingsProvider>
  );
}
