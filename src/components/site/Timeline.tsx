"use client";

import { motion } from "motion/react";
import type { TimelineEvent as TEvent } from "@/lib/types";
import { Timeline as AceternityTimeline } from "@/components/kit/timeline";
import { MagicCard } from "@/components/kit/magic-card";
import { DotPattern } from "@/components/kit/dot-pattern";
import { SectionHeading } from "./SectionHeading";

/** Timeline — Aceternity sticky timeline (scroll beam + lit nodes) with
 *  Magic UI spotlight cards. */
export function Timeline({ events }: { events: TEvent[] }) {
  if (events.length === 0) return null;

  const data = events.map((e, i) => ({
    key: e.id,
    title: (
      <div className="flex flex-col items-start gap-1">
        <span className="font-display text-5xl leading-none font-bold text-rose/15 md:text-7xl">
          {String(i + 1).padStart(2, "0")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-goldsoft px-3 py-1 text-[12px] font-bold tracking-wider text-gold uppercase">
          <span className="icon-[lucide--calendar-heart] size-3.5" />
          {e.date}
        </span>
      </div>
    ),
    content: (
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <MagicCard
          className="rounded-3xl shadow-[0_18px_40px_-24px_rgb(176_48_82/0.45)]"
          gradientColor="#FBE9EE"
          gradientOpacity={0.9}
          gradientFrom="#D64560"
          gradientTo="#C9973F"
          gradientSize={260}
        >
          <div className="p-6 md:p-8">
            <h3 className="wrap font-display text-2xl text-ink md:text-[1.9rem]">{e.title}</h3>
            {e.description && (
              <p className="wrap mt-3 text-[15px] leading-relaxed text-inksoft md:text-base" data-multiline>
                {e.description}
              </p>
            )}
          </div>
        </MagicCard>
      </motion.div>
    ),
  }));

  return (
    <section id="timeline" className="relative w-full scroll-mt-20 overflow-x-clip px-5 py-24">
      <DotPattern
        width={22}
        height={22}
        className="text-rose/20 [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob top-16 left-[-5rem] size-80 bg-rosemist" style={{ animationDuration: "14s" }} />
        <div className="blob right-[-6rem] bottom-4 size-96 bg-goldsoft/70" style={{ animationDuration: "18s" }} />
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
      </div>
    </section>
  );
}
