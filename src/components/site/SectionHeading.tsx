"use client";

import { motion } from "motion/react";
import BlurText from "@/components/kit/BlurText";
import ShinyText from "@/components/kit/ShinyText";
import { cn } from "@/lib/utils";

/** Editorial section heading: shiny tracked overline
 *  (React Bits ShinyText), blur-in display title (React Bits BlurText),
 *  hand-drawn squiggle that draws itself, optional handwritten note. */
export function SectionHeading({
  kicker,
  title,
  dark = false,
  note,
}: {
  kicker: string;
  title: string;
  icon: string;
  dark?: boolean;
  note?: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <p className="text-[12px] font-bold tracking-[0.35em] uppercase">
        <ShinyText
          text={kicker}
          color={dark ? "rgb(243 227 195 / 0.85)" : "#D64560"}
          shineColor={dark ? "#ffffff" : "#F3C98B"}
          speed={3.2}
        />
      </p>

      <BlurText
        as="h2"
        text={title}
        animateBy="words"
        direction="bottom"
        delay={90}
        className={cn(
          "wrap mt-2 justify-center font-display text-[clamp(2.3rem,6vw,3.9rem)] leading-[1.06]",
          dark ? "text-white" : "text-ink",
        )}
      />

      <svg
        width="140"
        height="14"
        viewBox="0 0 140 14"
        fill="none"
        aria-hidden
        className={cn("mt-3", dark ? "text-goldsoft" : "text-gold")}
      >
        <motion.path
          d="M2 9 C 30 3, 60 13, 90 7 S 130 5, 138 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.35, ease: "easeInOut" }}
        />
      </svg>
      {note && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className={cn("mt-3 font-hand text-2xl", dark ? "text-white/65" : "text-inksoft")}
        >
          {note}
        </motion.p>
      )}
    </div>
  );
}
