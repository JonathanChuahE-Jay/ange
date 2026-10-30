"use client";
/**
 * Timeline (Aceternity UI) — adapted: no baked-in header, sticky date column,
 * a scroll-driven rose→gold beam, and nodes that light up as the beam reaches
 * them. Colours come from the site palette.
 */
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TimelineEntry {
  key: React.Key;
  title: React.ReactNode;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [nodeTops, setNodeTops] = useState<number[]>([]);
  const [beam, setBeam] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setHeight(el.getBoundingClientRect().height);
      setNodeTops(
        // row top + its padding + half the node — stable even while stuck
        Array.from(el.querySelectorAll<HTMLElement>("[data-row]")).map(
          (row) => row.offsetTop + parseFloat(getComputedStyle(row).paddingTop) + 20,
        ),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data.length]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 30%", "end 60%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.06], [0, 1]);
  useMotionValueEvent(heightTransform, "change", (v) => setBeam(v));

  return (
    <div className="w-full" ref={containerRef}>
      <div ref={ref} className="relative mx-auto max-w-5xl pb-10">
        {data.map((item, index) => {
          const lit = beam >= (nodeTops[index] ?? Infinity);
          return (
            <div key={item.key} data-row className="flex justify-start pt-10 md:gap-10 md:pt-28 first:md:pt-12">
              <div className="sticky top-32 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
                <div
                  className="absolute left-3 flex size-10 items-center justify-center rounded-full border border-line bg-bg shadow-sm"
                >
                  <span
                    className={cn(
                      "icon-[lucide--heart] size-4 transition-all duration-500",
                      lit ? "scale-125 text-rose drop-shadow-[0_0_6px_rgb(214_69_96/0.7)]" : "text-line",
                    )}
                  />
                </div>
                <div className="hidden md:block md:pl-20">{item.title}</div>
              </div>

              <div className="relative w-full pr-2 pl-20 md:pl-4">
                <div className="mb-4 md:hidden">{item.title}</div>
                {item.content}
              </div>
            </div>
          );
        })}
        <div
          style={{ height: height + "px" }}
          className="absolute top-0 left-8 w-[3px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-line to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[3px] -ml-px rounded-full bg-gradient-to-t from-rose from-[0%] via-gold via-[12%] to-transparent shadow-[0_0_10px_rgb(214_69_96/0.6)]"
          />
        </div>
        {/* comet: a glowing heart riding the tip of the beam */}
        <motion.div
          aria-hidden
          style={{ y: heightTransform, opacity: opacityTransform }}
          className="pointer-events-none absolute top-0 left-8 z-30 -mt-3 -ml-[11px] flex size-6 items-center justify-center"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-rose/40" />
          <span className="icon-[lucide--heart] relative size-4 text-rose drop-shadow-[0_0_8px_rgb(214_69_96/0.9)]" />
        </motion.div>
      </div>
    </div>
  );
};
