"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { TimelineEvent as TEvent } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const TILTS = ["md:rotate-1", "md:-rotate-1"];

/** Timeline — scrapbook journey. The gradient spine fills with scroll and
 *  nodes light up as the line passes them. */
export function Timeline({ events }: { events: TEvent[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);
  const [nodeTops, setNodeTops] = useState<number[]>([]);

  useEffect(() => {
    const measure = () => {
      const list = listRef.current;
      if (!list) return;
      const tops = Array.from(list.children).map(
        (li) => (li as HTMLElement).offsetTop + 28, // node vertical center
      );
      setNodeTops(tops);
      onScroll();
    };
    const onScroll = () => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const vh = window.innerHeight;
      // start when the list top reaches 78% of the viewport,
      // finish when its bottom reaches 30%
      const startY = vh * 0.78;
      const endY = vh * 0.3;
      const span = rect.height - (startY - endY);
      const p = span > 0 ? (startY - rect.top) / span : 1;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [events.length]);

  if (events.length === 0) return null;

  const filledPx = progress * ((nodeTops.at(-1) ?? 0) || 1);

  return (
    <section id="timeline" className="relative mx-auto w-full max-w-5xl scroll-mt-20 overflow-x-clip px-5 py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob size-80 bg-rosemist left-[-5rem] top-16" style={{ animationDuration: "14s" }} />
        <div className="blob size-96 bg-goldsoft/70 right-[-6rem] bottom-4" style={{ animationDuration: "18s" }} />
      </div>

      <SectionHeading
        kicker="chapter by chapter"
        title="Your timeline"
        icon="i-lucide-book-heart"
        note="every chapter has you in it"
      />

      <div className="relative mt-16">
        {/* spine: track + scroll-driven fill */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 left-[21px] w-[3px] rounded-full bg-line md:left-1/2 md:-translate-x-1/2"
        >
          <div
            className="w-full rounded-full bg-gradient-to-b from-rose via-gold to-rose shadow-[0_0_12px_rgb(214_69_96/0.45)] transition-[height] duration-150 ease-out"
            style={{ height: `${progress * 100}%` }}
          />
        </div>

        <ol ref={listRef} className="flex flex-col gap-12">
          {events.map((e, i) => {
            const left = i % 2 === 0;
            const active = filledPx >= (nodeTops[i] ?? Infinity);
            return (
              <motion.li
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3) }}
                className={`relative flex ${left ? "md:justify-start" : "md:justify-end"}`}
              >
                {/* node — lights up when the spine reaches it */}
                <span
                  aria-hidden
                  className={`absolute top-7 left-[21px] z-10 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-white shadow-md transition-colors duration-300 md:left-1/2 ${
                    active ? "border-rose scale-110" : "border-line"
                  }`}
                >
                  <span
                    className={`i-lucide-heart size-4 transition-all duration-300 ${
                      active ? "fill-rose text-rose drop-shadow" : "fill-line text-line"
                    }`}
                  />
                </span>

                <div
                  className={`shadow-rise group relative ml-14 w-full rounded-3xl border border-line bg-white/90 p-6 backdrop-blur-sm transition-transform duration-300 md:ml-0 md:w-[calc(50%-3rem)] md:hover:rotate-0 ${TILTS[i % 2]}`}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-7 right-4 font-display text-7xl font-bold text-rose/10 select-none"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-goldsoft px-3 py-1 text-[12px] font-bold tracking-wider text-gold uppercase">
                    <span className="i-lucide-calendar-heart size-3.5" />
                    {e.date}
                  </span>
                  <h3 className="wrap mt-3 font-display text-2xl text-ink md:text-[1.75rem]">
                    {e.title}
                  </h3>
                  {e.description && (
                    <p className="wrap mt-2 text-[15px] leading-relaxed text-inksoft" data-multiline>
                      {e.description}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
