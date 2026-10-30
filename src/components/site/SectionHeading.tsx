"use client";

import { motion } from "motion/react";

/** Editorial section heading: icon badge, tracked overline, big display title,
 *  hand-drawn squiggle underline, optional handwritten note. */
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
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center text-center"
    >
      <span
        aria-hidden
        className={`flex size-12 items-center justify-center rounded-full border shadow-sm ${
          dark
            ? "border-white/20 bg-white/10 text-goldsoft"
            : "border-line bg-white text-rose"
        }`}
      >
        <span className={`${icon} size-5.5`} />
      </span>
      <p
        className={`mt-4 text-[12px] font-bold tracking-[0.35em] uppercase ${
          dark ? "text-goldsoft/90" : "text-rose"
        }`}
      >
        {kicker}
      </p>
      <h2
        className={`wrap mt-2 font-display text-[clamp(2.3rem,6vw,3.9rem)] leading-[1.06] ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      <svg
        width="140"
        height="14"
        viewBox="0 0 140 14"
        fill="none"
        aria-hidden
        className={`mt-3 ${dark ? "text-goldsoft" : "text-gold"}`}
      >
        <path
          d="M2 9 C 30 3, 60 13, 90 7 S 130 5, 138 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {note && (
        <p
          className={`mt-3 font-hand text-2xl ${dark ? "text-white/65" : "text-inksoft"}`}
        >
          {note}
        </p>
      )}
    </motion.div>
  );
}
