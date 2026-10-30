"use client";

import { motion } from "motion/react";
import BlurText from "@/components/kit/BlurText";
import ShinyText from "@/components/kit/ShinyText";
import { cn } from "@/lib/utils";

/** Editorial section heading: glowing icon badge, shiny tracked overline
 *  (React Bits ShinyText), blur-in display title (React Bits BlurText),
 *  hand-drawn squiggle that draws itself, optional handwritten note. */
export function SectionHeading({
  kicker,
  title,
  icon,
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
      <motion.span
        aria-hidden
        initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
        whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", stiffness: 380, damping: 18 }}
        className={cn(
          "relative flex size-13 items-center justify-center rounded-2xl border",
          dark
            ? "border-white/20 bg-white/10 text-goldsoft shadow-[0_0_30px_rgb(214_69_96/0.35)]"
            : "border-line bg-white text-rose shadow-[0_10px_30px_-10px_rgb(214_69_96/0.45)]",
        )}
      >
        <span className={cn(icon, "size-6")} />
      </motion.span>

      <p className="mt-5 text-[12px] font-bold tracking-[0.35em] uppercase">
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
