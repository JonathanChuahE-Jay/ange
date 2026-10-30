"use client";

import type { Love } from "@/lib/types";
import { Marquee } from "@/components/kit/marquee";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

const STYLES = [
  "bg-rosemist border-rosesoft",
  "bg-goldsoft border-gold/25",
  "bg-rosesoft border-rose/15",
  "bg-white border-line",
];
const ROTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

function Sticker({ love, i }: { love: Love; i: number }) {
  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-full border px-6 py-3.5 shadow-[0_10px_24px_-14px_rgb(176_48_82/0.45)] transition-transform duration-300 hover:scale-105 hover:rotate-0",
        STYLES[i % STYLES.length],
        ROTS[i % ROTS.length],
      )}
    >
      <span className="text-3xl" aria-hidden>
        {love.emoji}
      </span>
      <span className="text-lg font-bold text-ink">{love.text}</span>
    </div>
  );
}

/** Things you love — two Magic UI marquee rows of stickers drifting in
 *  opposite directions; hover pauses a row. */
export function Loves({ loves }: { loves: Love[] }) {
  if (loves.length === 0) return null;
  const half = Math.ceil(loves.length / 2);
  const rowA = loves.length >= 6 ? loves.slice(0, half) : loves;
  const rowB = loves.length >= 6 ? loves.slice(half) : [...loves].reverse();

  return (
    <section id="loves" className="relative w-full scroll-mt-20 overflow-x-clip py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob bottom-0 left-[-4rem] size-72 bg-rosemist/70" style={{ animationDuration: "13s" }} />
      </div>

      <div className="px-5">
        <SectionHeading
          kicker="the little things"
          title="Things you love"
          icon="icon-[lucide--sparkles]"
          note="collect them all"
        />
      </div>

      <div className="relative mt-14 flex flex-col gap-3">
        <Marquee pauseOnHover className="py-3 [--duration:45s] [--gap:1.25rem]">
          {rowA.map((l, i) => (
            <Sticker key={l.id} love={l} i={i} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="py-3 [--duration:50s] [--gap:1.25rem]">
          {rowB.map((l, i) => (
            <Sticker key={l.id} love={l} i={i + 1} />
          ))}
        </Marquee>
        {/* edge fades */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-bg" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-bg" />
      </div>
    </section>
  );
}
