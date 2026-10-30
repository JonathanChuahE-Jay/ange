"use client";

import { motion } from "motion/react";
import type { TimelineEvent as TEvent } from "@/lib/types";
import { Timeline as AceternityTimeline } from "@/components/kit/timeline";
import { MagicCard } from "@/components/kit/magic-card";
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

/** Two card moods alternate so the scroll has rhythm. */
const MOODS = [
  {
    card: "bg-gradient-to-br from-white via-white to-rosemist",
    badge: "from-rose to-rosedeep",
    bar: "from-rose via-[#E8879C] to-gold",
    glow: "#FBE9EE",
  },
  {
    card: "bg-gradient-to-br from-white via-white to-goldsoft/60",
    badge: "from-gold to-[#A87B2C]",
    bar: "from-gold via-[#E8C27A] to-rose",
    glow: "#FBF1DE",
  },
];

/** Timeline — Aceternity sticky timeline (scroll beam, comet heart, lit
 *  nodes) with layered Magic UI spotlight cards. */
export function Timeline({ events }: { events: TEvent[] }) {
  if (events.length === 0) return null;
  const total = events.length;

  const data = events.map((e, i) => {
    const mood = MOODS[i % MOODS.length];
    return {
      key: e.id,
      title: (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start"
        >
          <span className="text-[11px] font-bold tracking-[0.35em] text-rose/80 uppercase">
            chapter {String(i + 1).padStart(2, "0")}
          </span>
          <span className="wrap mt-1 bg-gradient-to-r from-rosedeep via-rose to-gold bg-clip-text font-display text-3xl leading-tight text-transparent italic md:text-[2.6rem]">
            {e.date}
          </span>
        </motion.div>
      ),
      content: (
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 14, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 900 }}
          className="group relative"
        >
          {/* offset paper layer behind the card */}
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-gradient-to-br opacity-25 transition-transform duration-500 group-hover:translate-x-3 group-hover:translate-y-3",
              mood.bar,
            )}
          />
          <MagicCard
            className={cn("rounded-3xl shadow-[0_24px_50px_-28px_rgb(176_48_82/0.55)]", mood.card)}
            gradientColor={mood.glow}
            gradientOpacity={0.9}
            gradientFrom="#D64560"
            gradientTo="#C9973F"
            gradientSize={280}
          >
            <div className={cn("h-1.5 w-full bg-gradient-to-r", mood.bar)} />
            <div className="relative overflow-hidden p-6 md:p-8">
              {/* watermark */}
              <span
                aria-hidden
                className={cn(
                  ICONS[i % ICONS.length],
                  "pointer-events-none absolute -right-6 -bottom-6 size-36 rotate-12 text-rose/[0.07] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-0",
                )}
              />
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_10px_20px_-8px_rgb(176_48_82/0.6)] transition-transform duration-500 group-hover:-rotate-6",
                    mood.badge,
                  )}
                >
                  <span className={cn(ICONS[i % ICONS.length], "size-5")} />
                </span>
                <h3 className="wrap font-display text-2xl leading-tight text-ink md:text-[2rem]">{e.title}</h3>
              </div>
              {e.description && (
                <p className="wrap mt-4 font-hand text-[1.45rem] leading-snug text-inksoft md:text-[1.6rem]" data-multiline>
                  {e.description}
                </p>
              )}
              <div className="mt-6 flex items-center gap-3">
                <span className="text-[11px] font-bold tracking-[0.25em] text-inksoft/60 uppercase tabular-nums">
                  {i + 1} of {total}
                </span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                  <motion.span
                    initial={{ width: 0 }}
                    whileInView={{ width: `${((i + 1) / total) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("block h-full rounded-full bg-gradient-to-r", mood.bar)}
                  />
                </span>
              </div>
            </div>
          </MagicCard>
        </motion.div>
      ),
    };
  });

  return (
    <section
      id="timeline"
      className="relative w-full scroll-mt-20 overflow-x-clip bg-gradient-to-b from-bg via-rosemist/70 to-bg px-5 py-24"
    >
      <DotPattern
        width={22}
        height={22}
        className="text-rose/25 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob top-16 left-[-5rem] size-80 bg-rosesoft" style={{ animationDuration: "14s" }} />
        <div className="blob top-1/2 right-[-6rem] size-96 bg-goldsoft/80" style={{ animationDuration: "18s" }} />
        <div className="blob bottom-10 left-1/3 size-72 bg-rosesoft/70" style={{ animationDuration: "20s" }} />
      </div>

      <div className="relative">
        <SectionHeading
          kicker="chapter by chapter"
          title="Your timeline"
          icon="icon-[lucide--book-heart]"
          note="every chapter has you in it"
        />
        <div className="mt-8">
          <AceternityTimeline data={data} />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-4 flex max-w-5xl items-center justify-center gap-3 font-hand text-3xl text-rose"
        >
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-rose/50" />
          to be continued…
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-rose/50" />
        </motion.p>
      </div>
    </section>
  );
}
