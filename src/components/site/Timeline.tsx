"use client";

import { motion, useMotionTemplate, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TimelineEvent as TEvent } from "@/lib/types";
import { DotPattern } from "@/components/kit/dot-pattern";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

/** every chapter card uses the same heart icon */
const ICON = "icon-[lucide--heart]";

/** Card palettes cycle so each chapter in the stack reads as its own page. */
const THEMES = [
  { card: "from-[#FFF4F6] to-[#FBE3E9]", accent: "from-rose to-rosedeep", ink: "text-rosedeep" },
  { card: "from-[#FFF9EF] to-[#F6E7C9]", accent: "from-gold to-[#A87B2C]", ink: "text-[#9A6F25]" },
  { card: "from-[#FBF2FA] to-[#EFDDF0]", accent: "from-[#B34A8A] to-[#7E2F63]", ink: "text-[#7E2F63]" },
  { card: "from-[#FFF5F1] to-[#F9E0D6]", accent: "from-[#E07A5F] to-[#B8553E]", ink: "text-[#A24B37]" },
];

const STICK_TOP = 96; // px from the viewport top where cards pin
const PEEK = 14; // each pinned card sits this much lower than the previous one
const SCALE_STEP = 0.035; // how much a card shrinks per card stacked on top of it
/** extra scroll after a chapter's text ends, so the last lines can be read before the next card covers it */
const READ_PAUSE = "min(28vh, 240px)";

/** per-card motion values the stack drives from the page scroll */
type CardMotion = {
  read: MotionValue<number>; // how far the text has scrolled (px)
  max: MotionValue<number>; // how far the text CAN scroll (px)
  scale: MotionValue<number>;
  dim: MotionValue<number>;
};

/**
 * Timeline — a sticky card stack. Each chapter pins near the top while the
 * next one slides up over it; buried cards shrink and dim a little, so the
 * story piles up like pages of a scrapbook.
 *
 * Long chapters: after a card pins, the page keeps scrolling but the card
 * stays put and its TEXT scrolls instead, 1:1 with the page. A spacer as tall
 * as the hidden text sits between this card and the next one, so the next
 * chapter cannot slide over until the text is completely read. This is pure
 * scroll position, so it works with any input (wheel anywhere, scrollbar,
 * keyboard, touch).
 */
export function Timeline({ events }: { events: TEvent[] }) {
  const total = events.length;
  const wrappers = useRef<(HTMLDivElement | null)[]>([]); // sticky boxes (never transformed)
  const spacers = useRef<(HTMLDivElement | null)[]>([]); // reading room after each card
  const motions = useRef<(CardMotion | null)[]>([]);
  // how much reading room each card needs (= its hidden text height)
  const [dwell, setDwell] = useState<number[]>([]);

  const onMeasure = useCallback((i: number, max: number) => {
    setDwell((prev) => {
      if (Math.abs((prev[i] ?? 0) - max) < 1) return prev;
      const next = prev.slice();
      next[i] = max;
      return next;
    });
  }, []);

  /* ---- drive every card from the page scroll ---- */
  const update = useCallback(() => {
    const n = wrappers.current.length;
    const tops: number[] = [];
    const heights: number[] = [];
    for (let i = 0; i < n; i++) {
      const r = wrappers.current[i]?.getBoundingClientRect();
      tops[i] = r?.top ?? 0;
      heights[i] = r?.height ?? 0;
    }

    // how far card j has slid over card j-1 (0 = touching its bottom edge, 1 = pinned)
    const cover: number[] = [];
    for (let j = 1; j < n; j++) {
      const prevBottom = STICK_TOP + (j - 1) * PEEK + heights[j - 1];
      const pin = STICK_TOP + j * PEEK;
      const travel = Math.max(1, prevBottom - pin);
      cover[j] = Math.min(1, Math.max(0, (prevBottom - tops[j]) / travel));
    }

    for (let i = 0; i < n; i++) {
      const m = motions.current[i];
      if (!m) continue;
      // text: the spacer right after the card measures how far the page has
      // scrolled since the card pinned
      const spacer = spacers.current[i];
      const max = m.max.get();
      if (spacer && max > 0) {
        const scrolled = STICK_TOP + i * PEEK + heights[i] - spacer.getBoundingClientRect().top;
        m.read.set(Math.min(max, Math.max(0, scrolled)));
      } else {
        m.read.set(0);
      }
      // stacking: shrink per card piled on top, dim as the next one covers it
      let buried = 0;
      for (let j = i + 1; j < n; j++) buried += cover[j] ?? 0;
      m.scale.set(1 - buried * SCALE_STEP);
      m.dim.set((cover[i + 1] ?? 0) * 0.08);
    }
  }, []);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          update();
        });
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [update]);

  // spacer heights changed → positions changed
  useLayoutEffect(() => {
    update();
  }, [dwell, update]);

  if (total === 0) return null;

  // every card must fit on screen while pinned (the deepest one sits lowest),
  // otherwise on short screens it runs into the next section
  const lowestTop = STICK_TOP + (total - 1) * PEEK;
  // svh, not dvh: on phones dvh changes while the address bar slides in/out, which
  // resized the cards (and their reading room) mid-scroll and made the page jump
  const cardHeight = `clamp(340px, calc(100svh - ${lowestTop + 28}px), 720px)`;

  return (
    <section
      id="timeline"
      className="relative w-full scroll-mt-20 bg-gradient-to-b from-bg via-rosemist/60 to-bg px-5 pt-24 pb-28"
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

        {/* all sticky cards share ONE container, so each stays pinned until the
            whole stack has been scrolled through */}
        <div className="relative mx-auto mt-14 max-w-3xl">
          {events.map((e, i) => (
            <div key={e.id} className="contents">
              <div
                ref={(el) => {
                  wrappers.current[i] = el;
                }}
                className="sticky"
                style={{
                  top: STICK_TOP + i * PEEK,
                  height: cardHeight,
                  // sticky stops at the container's end measured on the MARGIN box.
                  // Without this the deepest card (lowest top) hits the end first and
                  // slides up over the others while they are still pinned. Equal
                  // margin-box bottoms make the whole stack leave together, still stacked.
                  marginBottom: (total - 1 - i) * PEEK,
                }}
              >
                <StackCard
                  event={e}
                  index={i}
                  onMeasure={onMeasure}
                  register={(m) => {
                    motions.current[i] = m;
                  }}
                />
              </div>
              {/* reading room: the page scrolls through this while the card above
                  stays pinned and its text scrolls — the next card waits below */}
              <div
                aria-hidden
                ref={(el) => {
                  spacers.current[i] = el;
                }}
                style={{
                  // hidden text + a pause to finish the last lines before the next card moves in
                  height: `calc(${dwell[i] ?? 0}px + ${READ_PAUSE})`,
                  // cancels the card's sticky margin so the flow layout is unchanged
                  marginTop: -(total - 1 - i) * PEEK,
                }}
              />
            </div>
          ))}
          {/* sticky cards are confined to the container's CONTENT box, so the
              hold room below the final card must be a real flow element */}
          <div aria-hidden className="h-[12vh]" />
        </div>
      </div>
    </section>
  );
}

function StackCard({
  event: e,
  index: i,
  onMeasure,
  register,
}: {
  event: TEvent;
  index: number;
  onMeasure: (i: number, max: number) => void;
  register: (m: CardMotion | null) => void;
}) {
  const theme = THEMES[i % THEMES.length];
  const icon = ICON;

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const read = useMotionValue(0);
  const max = useMotionValue(0);
  const scale = useMotionValue(1);
  const dim = useMotionValue(0);

  useEffect(() => {
    register({ read, max, scale, dim });
    return () => register(null);
  }, [register, read, max, scale, dim]);

  /* ---- measure how much text is hidden ---- */
  useEffect(() => {
    const vp = viewportRef.current;
    const content = contentRef.current;
    if (!vp || !content) return;
    const measure = () => {
      const hidden = Math.max(0, Math.ceil(content.offsetHeight - vp.clientHeight));
      max.set(hidden);
      onMeasure(i, hidden);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    ro.observe(content);
    return () => ro.disconnect();
  }, [i, max, onMeasure, e.description, e.title]);

  // text fades at the edges of the reading window (a mask, so the card's own
  // gradient shows through — no colour seams)
  const textY = useTransform(read, (v) => -v);
  const fadeBottom = useTransform([read, max], ([o, m]: number[]) => (m <= 0 ? 0 : Math.max(0, Math.min(56, m - o))));
  const fadeTop = useTransform(read, (v) => Math.max(0, Math.min(56, v)));
  const mask = useMotionTemplate`linear-gradient(to bottom, transparent 0px, #000 ${fadeTop}px, #000 calc(100% - ${fadeBottom}px), transparent 100%)`;
  // "more" hint while unread text remains
  const hintOpacity = useTransform([read, max], ([o, m]: number[]) => (m <= 0 ? 0 : Math.max(0, Math.min(1, (m - o) / 80))));

  return (
    <motion.article
      style={{ scale, transformOrigin: "top center" }}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br shadow-[0_30px_70px_-35px_rgb(67_38_58/0.55)]",
        theme.card,
      )}
    >
      {/* large faint icon as texture */}
      <span
        aria-hidden
        className={cn(icon, "pointer-events-none absolute -top-8 -right-8 size-56 rotate-12 opacity-[0.07]", theme.ink)}
      />

      {/* short screens (laptops with small windows): tighter chrome so the
          reading window keeps as many lines as possible */}
      <div className="relative flex min-h-0 flex-1 flex-col px-7 pt-7 pb-9 md:px-12 md:pt-12 md:pb-10 [@media(max-height:760px)]:px-6 [@media(max-height:760px)]:pt-6 [@media(max-height:760px)]:pb-8 [@media(max-height:760px)]:md:px-10">
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl [@media(max-height:760px)]:size-9 [@media(max-height:760px)]:rounded-xl bg-gradient-to-br text-white shadow-[0_12px_24px_-10px_rgb(67_38_58/0.6)]",
              theme.accent,
            )}
          >
            <span className={cn(icon, "size-6")} />
          </span>
          <span className={cn("text-[12px] font-bold tracking-[0.3em] uppercase", theme.ink)}>{e.date}</span>
        </div>

        <h3 className="wrap mt-6 shrink-0 font-display text-[clamp(1.8rem,5vw,3.4rem)] leading-[1.08] text-ink md:mt-8 [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:text-[clamp(1.6rem,4vw,2.4rem)]">
          {e.title}
        </h3>

        {/* the chapter's text lives in its own reading window, scrolled by the page */}
        <motion.div
          ref={viewportRef}
          className="relative mt-4 min-h-[72px] flex-1 overflow-hidden md:mt-5 [@media(max-height:760px)]:mt-2"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <motion.div ref={contentRef} style={{ y: textY }} className="will-change-transform">
            {e.description && (
              <p
                className="wrap max-w-xl font-sans text-[16px] leading-relaxed text-inksoft md:text-[17px]"
                data-multiline
              >
                {e.description}
              </p>
            )}
          </motion.div>
        </motion.div>

      </div>

      {/* footer: small heart + "more" hint on ONE thin row, overlaid on the card's
          bottom padding so it takes no space from the text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-7 bottom-2.5 flex items-center justify-between md:inset-x-12 md:bottom-3.5 [@media(max-height:760px)]:inset-x-6 [@media(max-height:760px)]:bottom-2"
      >
        <span className={cn("icon-[lucide--heart] size-4 opacity-50", theme.ink)} />
        <motion.span style={{ opacity: hintOpacity }} className={cn("flex items-center gap-1", theme.ink)}>
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase opacity-70">more</span>
          <span className="icon-[lucide--chevron-down] size-3.5 animate-bounce" />
        </motion.span>
      </div>

      {/* dims as it gets buried under the next chapter */}
      <motion.div aria-hidden style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-ink" />
    </motion.article>
  );
}
