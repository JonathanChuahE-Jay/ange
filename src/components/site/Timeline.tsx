"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import type { TimelineEvent as TEvent } from "@/lib/types";
import { DotPattern } from "@/components/kit/dot-pattern";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

const ICONS = [
  "icon-[lucide--sparkles]",
  "icon-[lucide--heart-handshake]",
  "icon-[lucide--map]",
  "icon-[lucide--infinity]",
  "icon-[lucide--camera]",
  "icon-[lucide--music]",
  "icon-[lucide--sun]",
  "icon-[lucide--moon-star]",
];

/** Card palettes cycle so each chapter in the stack reads as its own page. */
const THEMES = [
  { card: "from-[#FFF4F6] to-[#FBE3E9]", accent: "from-rose to-rosedeep", ink: "text-rosedeep" },
  { card: "from-[#FFF9EF] to-[#F6E7C9]", accent: "from-gold to-[#A87B2C]", ink: "text-[#9A6F25]" },
  { card: "from-[#FBF2FA] to-[#EFDDF0]", accent: "from-[#B34A8A] to-[#7E2F63]", ink: "text-[#7E2F63]" },
  { card: "from-[#FFF5F1] to-[#F9E0D6]", accent: "from-[#E07A5F] to-[#B8553E]", ink: "text-[#A24B37]" },
];

const STICK_TOP = 96; // px from the viewport top where cards pin
const PEEK = 14; // each pinned card sits this much lower than the previous one

/**
 * Timeline — a sticky card stack. Each chapter pins near the top while the
 * next one slides up over it; buried cards shrink and dim a little, so the
 * story piles up like pages of a scrapbook.
 */
export function Timeline({ events }: { events: TEvent[] }) {
  const stackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ["start start", "end end"] });

  if (events.length === 0) return null;
  const total = events.length;

  return (
    <section
      id="timeline"
      className="relative w-full scroll-mt-20 bg-gradient-to-b from-bg via-rosemist/60 to-bg px-5 pt-24 pb-16"
    >
      <DotPattern
        width={22}
        height={22}
        className="text-rose/20 [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob top-16 left-[-5rem] size-80 bg-rosesoft" style={{ animationDuration: "14s" }} />
        <div className="blob top-1/2 right-[-6rem] size-96 bg-goldsoft/80" style={{ animationDuration: "18s" }} />
      </div>

      <div className="relative">
        <SectionHeading section="timeline" icon="icon-[lucide--book-heart]" />

        {/* pb = hold room below the last card: sticky can only pin while there is
            container beneath it, so the final chapter holds the stack before leaving */}
<div ref={stackRef} className="relative mx-auto mt-14 max-w-3xl">
          {events.map((e, i) => (
            <StackCard
              key={e.id}
              event={e}
              index={i}
              total={total}
              progress={scrollYProgress}
            />
          ))}
          {/* sticky cards are confined to the container's CONTENT box (padding
              doesn't count), so the hold room below the final card must be a
              real flow element — otherwise the last chapter never pins */}
          <div aria-hidden className="h-[30vh]" />
        </div>
      </div>
    </section>
  );
}

function StackCard({
  event: e,
  index: i,
  total,
  progress,
}: {
  event: TEvent;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const theme = THEMES[i % THEMES.length];
  const icon = ICONS[i % ICONS.length];

  // once later cards slide over this one, gently push it back
  const isLast = i === total - 1;
  // only start receding once the NEXT chapter is sliding over this one
  const coveredFrom = Math.min(1, (i + 0.55) / total);
  const coveredBy = Math.min(1, (i + 1) / total);
  const targetScale = 1 - (total - 1 - i) * 0.035;
  const scale = useTransform(progress, [coveredFrom, 1], [1, isLast ? 1 : targetScale]);
  const dim = useTransform(progress, [coveredFrom, coveredBy], [0, isLast ? 0 : 0.08]);

  return (
    // each wrapper is one viewport-ish tall so scrolling drives the stack
    <div
      // every wrapper is the same height — the last card must have container
      // below it, otherwise sticky has zero room and it never holds the stack
      className="sticky h-[58vh] min-h-[440px]"
      style={{ top: STICK_TOP + i * PEEK }}
    >
      <motion.article
        style={{ scale, transformOrigin: "top center" }}
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br shadow-[0_30px_70px_-35px_rgb(67_38_58/0.55)]",
          theme.card,
        )}
      >
        {/* large faint icon as texture */}
        <span
          aria-hidden
          className={cn(icon, "pointer-events-none absolute -top-8 -right-8 size-56 rotate-12 opacity-[0.07]", theme.ink)}
        />

        <div className="relative flex min-h-[340px] flex-col p-7 md:min-h-[380px] md:p-12">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_12px_24px_-10px_rgb(67_38_58/0.6)]",
                theme.accent,
              )}
            >
              <span className={cn(icon, "size-6")} />
            </span>
            <span className={cn("text-[12px] font-bold tracking-[0.3em] uppercase", theme.ink)}>
              {e.date}
            </span>
          </div>

          <h3 className="wrap mt-8 font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.08] text-ink">
            {e.title}
          </h3>

          {e.description && (
            <p className="wrap mt-5 max-w-xl font-hand text-[1.6rem] leading-snug text-inksoft md:text-[1.85rem]" data-multiline>
              {e.description}
            </p>
          )}

          <span aria-hidden className={cn("icon-[lucide--heart] mt-auto size-6 pt-8 opacity-60", theme.ink)} />
        </div>

        {/* dims as it gets buried under the next chapter */}
        <motion.div aria-hidden style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-ink" />
      </motion.article>
    </div>
  );
}
