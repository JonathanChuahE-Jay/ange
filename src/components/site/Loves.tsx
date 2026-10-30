"use client";

import { motion } from "motion/react";
import type { Love } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const STYLES = ["bg-rosemist", "bg-goldsoft", "bg-rosesoft", "bg-white border border-line"];
const ROTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

/** Things you love — a sheet of rotated stickers. Hover: cards/shadow-rise straighten. */
export function Loves({ loves }: { loves: Love[] }) {
  if (loves.length === 0) return null;
  return (
    <section id="loves" className="relative mx-auto w-full max-w-4xl scroll-mt-20 overflow-x-clip px-5 py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob size-72 bg-rosemist/70 left-[-4rem] bottom-0" style={{ animationDuration: "13s" }} />
      </div>

      <SectionHeading
        kicker="the little things"
        title="Things you love"
        icon="i-lucide-sparkles"
        note="collect them all"
      />

      <div className="relative mt-14 flex flex-wrap justify-center gap-4 md:gap-5">
        {loves.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 22,
              delay: Math.min(i * 0.05, 0.4),
            }}
            className={`shadow-rise flex min-h-14 items-center gap-3 rounded-full px-6 py-3.5 transition-transform duration-300 hover:rotate-0 ${STYLES[i % STYLES.length]} ${ROTS[i % ROTS.length]}`}
          >
            <span className="text-3xl" aria-hidden>
              {l.emoji}
            </span>
            <span className="wrap text-lg font-bold text-ink" data-multiline>
              {l.text}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
