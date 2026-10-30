"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { PhotoMeta, QuizQuestion } from "@/lib/types";
import { DotPattern } from "@/components/kit/dot-pattern";
import { MagicCard } from "@/components/kit/magic-card";
import { MemoryMatch } from "@/components/games/MemoryMatch";
import { CatchHearts } from "@/components/games/CatchHearts";
import { LoveQuiz } from "@/components/games/LoveQuiz";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

const TABS = [
  { id: "memory", label: "Memory Match", short: "Memory", icon: "icon-[lucide--layout-grid]", blurb: "find every pair of us" },
  { id: "catch", label: "Catch the Hearts", short: "Catch", icon: "icon-[lucide--heart-handshake]", blurb: "don't let my heart fall" },
  { id: "quiz", label: "Know Us?", short: "Quiz", icon: "icon-[lucide--circle-help]", blurb: "how well do you know us" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Games — three minigames behind an animated tab switcher. */
export function Games({ photos, quiz }: { photos: PhotoMeta[]; quiz: QuizQuestion[] }) {
  const [tab, setTab] = useState<TabId>("memory");
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <section id="games" className="relative w-full scroll-mt-20 overflow-x-clip px-5 py-24">
      <DotPattern width={20} height={20} className="text-rose/15 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob top-24 right-[-5rem] size-80 bg-rosemist" style={{ animationDuration: "15s" }} />
        <div className="blob bottom-10 left-[-6rem] size-96 bg-goldsoft/70" style={{ animationDuration: "19s" }} />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <SectionHeading kicker="play with me" title="Little games" icon="icon-[lucide--gamepad-2]" note={current.blurb} />

        {/* tab switcher with a sliding pill */}
        <div role="tablist" aria-label="Games" className="mx-auto mt-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-white/80 p-1.5 shadow-sm backdrop-blur no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm sm:gap-2 sm:px-4 font-bold transition-colors duration-200",
                tab === t.id ? "text-white" : "text-inksoft hover:text-rose",
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="games-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-rose to-rosedeep shadow-[0_6px_16px_-6px_rgb(214_69_96/0.7)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className={cn(t.icon, "relative size-4")} />
              <span className="relative hidden sm:inline">{t.label}</span>
              <span className="relative sm:hidden">{t.short}</span>
            </button>
          ))}
        </div>

        <MagicCard
          className="mt-8 rounded-[2rem] shadow-[0_30px_60px_-35px_rgb(176_48_82/0.55)]"
          gradientColor="#FBE9EE"
          gradientFrom="#D64560"
          gradientTo="#C9973F"
          gradientSize={320}
        >
          <div className="p-5 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                role="tabpanel"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "memory" && <MemoryMatch photos={photos} />}
                {tab === "catch" && <CatchHearts />}
                {tab === "quiz" && <LoveQuiz questions={quiz} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </MagicCard>
      </div>
    </section>
  );
}
