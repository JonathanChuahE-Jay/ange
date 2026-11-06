"use client";

import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import type { Settings } from "@/lib/types";
import { celebrate } from "@/components/games/celebrate";
import { SectionHeading } from "./SectionHeading";

type Phase = "sealed" | "opening" | "open";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_SLIDE = [0.65, 0, 0.35, 1] as const;

/**
 * A love letter. The real letter (actual text) lives inside a CSS-3D envelope
 * from the start: tap → the wax seal breaks, the flap swings open, the letter
 * rises out, and the envelope slides down off it — revealing the page as one
 * continuous animation, never swapping elements.
 *
 * Geometry (all relative to the stage top):
 *   P   = headroom above the envelope (the letter rises into it)
 *   ENV = envelope height
 *   the letter is clipped at the envelope's bottom edge until it's fully out.
 */
export function Letter({ settings }: { settings: Settings }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("sealed");
  const [flapBehind, setFlapBehind] = useState(false);

  // layout motion values (kept in MVs so derived transforms stay current)
  const env = useMotionValue(300); // envelope height
  const head = useMotionValue(135); // headroom above envelope
  const letterH = useMotionValue(800);

  // animation motion values
  const letterY = useMotionValue(0);
  const envY = useMotionValue(0);
  const envOpacity = useMotionValue(1);
  const flapRot = useMotionValue(0);
  const flapOpacity = useMotionValue(1);
  const sealOpacity = useMotionValue(1);
  const sealScale = useMotionValue(1);

  // measure stage width → envelope size; measure letter height
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const letter = letterRef.current;
    if (!stage || !letter) return;
    const measure = () => {
      const e = Math.round(stage.clientWidth * 0.62);
      env.set(e);
      head.set(Math.round(e * 0.45));
      letterH.set(letter.offsetHeight);
      if (phase === "sealed") letterY.set(head.get() + e * 0.1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(letter);
    return () => ro.disconnect();
  }, [phase, env, head, letterH, letterY]);

  useMotionValueEvent(flapRot, "change", (v) => {
    if (v > 90 && !flapBehind) setFlapBehind(true);
  });

  // hide whatever part of the letter is still below the envelope's bottom edge
  const clip = useTransform([letterY, envY, letterH, env, head], ([ly, ey, h, e, p]: number[]) => {
    // +16px: the tilted letter's clip edge rotates with it, so over-clip slightly;
    // the final envelope position leaves 24px of slack, so this reaches 0 when out
    const hidden = Math.max(0, ly + h - (p + ey + e) + 16);
    return `inset(-80px -80px ${hidden}px -80px)`;
  });
  // stage grows with the envelope as it slides down, capped at the letter height
  const stageH = useTransform([envY, letterH, env, head], ([ey, h, e, p]: number[]) =>
    Math.max(p + e, Math.min(p + ey + e, h)),
  );
  const envTop = useTransform([envY, head], ([ey, p]: number[]) => p + ey);
  // slight tilt while tucked in, straightens as it comes out
  const letterRot = useTransform([letterY, head], ([ly, p]: number[]) => (p > 0 ? (ly / p) * -1.5 : 0));

  const open = async () => {
    if (phase !== "sealed") return;
    setPhase("opening");
    const e = env.get();
    const p = head.get();
    const h = letterH.get();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      letterY.set(0);
      setPhase("open");
      return;
    }

    // 1. seal breaks
    void animate(sealScale, 1.35, { duration: 0.25 });
    await animate(sealOpacity, 0, { duration: 0.25 });
    // 2. flap swings open (passes behind the letter at 90°)
    await animate(flapRot, 180, { duration: 0.6, ease: [0.4, 0, 0.2, 1] });
    // 3. letter rises out while the envelope dips
    await Promise.all([
      animate(letterY, 0, { duration: 0.75, ease: EASE_OUT }),
      animate(envY, e * 0.3, { duration: 0.75, ease: EASE_OUT }),
      // the open flap fades as the letter clears it — otherwise its corners
      // (it's wider than the letter) would slide down beside the page as wedges
      animate(flapOpacity, 0, { duration: 0.3, delay: 0.05 }),
    ]);
    celebrate({ x: 0.5, y: 0.45 });
    // 4. the envelope slides down off the letter, revealing the rest of the page
    const finalEnvY = Math.max(e * 0.3 + 40, h - p - e + 24);
    await Promise.all([
      animate(envY, finalEnvY, { duration: Math.min(2.2, 0.9 + h / 900), ease: EASE_SLIDE }),
      animate(envOpacity, 0, { duration: 0.5, delay: Math.min(1.7, 0.4 + h / 900) }),
    ]);
    setPhase("open");
  };

  const isOpen = phase === "open";

  return (
    <section id="letter" className="relative scroll-mt-20 overflow-x-clip py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob top-10 right-[-4rem] size-80 bg-goldsoft/70" style={{ animationDuration: "15s" }} />
        <div className="blob bottom-10 left-[-5rem] size-72 bg-rosemist" style={{ animationDuration: "17s" }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-5">
        <SectionHeading section="letter" icon="icon-[lucide--mail]" />

        <motion.div
          ref={stageRef}
          style={{ height: isOpen ? "auto" : stageH }}
          className="relative mt-10 w-full max-w-xl"
        >
          {/* "tap to open" lives in the headroom the letter later rises into */}
          <AnimatePresence>
            {phase === "sealed" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-x-0 top-[12%] z-0 flex flex-col items-center gap-1 text-center font-hand text-2xl text-inksoft"
              >
                a letter for you
                <motion.span
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="icon-[lucide--chevron-down] size-5 text-rose"
                />
              </motion.p>
            )}
          </AnimatePresence>

          {!isOpen && (
            <>
              {/* envelope back (inside lining) — behind the letter */}
              <motion.div
                aria-hidden
                style={{ top: envTop, height: env, opacity: envOpacity }}
                className="absolute inset-x-0 z-10 rounded-2xl bg-gradient-to-b from-[#9E2A4A] to-[#7A1F3A] shadow-[0_30px_60px_-25px_rgb(67_38_58/0.6)]"
              >
                <div className="absolute inset-3 rounded-xl bg-[repeating-linear-gradient(45deg,rgb(255_255_255/0.06)_0_8px,transparent_8px_16px)]" />
              </motion.div>

              {/* top flap (3D) — in front while closed, behind the letter once past 90° */}
              <motion.div
                aria-hidden
                style={{ top: envTop, height: env, opacity: flapOpacity, perspective: 1200 }}
                className={`pointer-events-none absolute inset-x-0 ${flapBehind ? "z-[15]" : "z-40"}`}
              >
                <motion.div
                  style={{ rotateX: flapRot, transformOrigin: "top center", transformStyle: "preserve-3d" }}
                  className="absolute inset-x-0 top-0 h-[56%]"
                >
                  {/* outside */}
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-[#EE9AAE] to-[#D9667F] [backface-visibility:hidden]"
                    style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                  />
                  {/* inside lining (seen once open). This back face is counter-rotated with
                      rotateX(180deg), so it's drawn apex-up: once the flap swings open it reads
                      as a triangle pointing UP from the envelope's top edge. */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#F6DCE2] to-[#E9B7C3] [backface-visibility:hidden] [transform:rotateX(180deg)]"
                    style={{ clipPath: "polygon(0 100%, 100% 100%, 50% 0)" }}
                  />
                </motion.div>
              </motion.div>
            </>
          )}

          {/* THE LETTER — real content, present the whole time */}
          <motion.article
            ref={letterRef}
            style={
              isOpen
                ? undefined
                : { y: letterY, clipPath: clip, rotate: letterRot }
            }
            className={isOpen ? "relative z-20 mx-[5%]" : "absolute inset-x-[5%] top-0 z-20"}
          >
            <div
              className="rounded-lg p-[8px] shadow-2xl"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #D64560 0 14px, #FFF8F3 14px 28px, #5B7DB1 28px 42px, #FFF8F3 42px 56px)",
              }}
            >
              <div className="relative rounded-[3px] bg-[#FFFBF0] p-7 md:p-11">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[11px] font-bold tracking-[0.35em] text-gold uppercase">Par Avion</p>
                  <div className="flex rotate-3 flex-col items-center rounded-sm border-2 border-dashed border-gold/50 bg-white px-2.5 py-1.5">
                    <span className="icon-[lucide--heart] size-4.5 text-rose" aria-hidden />
                    <span className="text-[9px] font-bold tracking-[0.2em] text-gold">LOVE POST</span>
                  </div>
                </div>

                <h3 className="wrap mt-5 font-display text-3xl leading-tight text-ink [text-wrap:balance]">{settings.letterTitle}</h3>
                <p
                  className="wrap mt-4 font-hand text-[1.55rem] leading-[1.7] text-ink/90 first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.9] first-letter:text-rose"
                  data-multiline
                >
                  {settings.letterBody}
                </p>

                <div className="mt-8 flex items-end justify-between gap-4">
                  <svg width="120" height="18" viewBox="0 0 120 18" fill="none" aria-hidden className="text-gold">
                    <path d="M2 12 C 25 4, 45 16, 66 9 S 100 8, 118 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M104 5 l6 5 -7 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <p className="font-hand text-3xl text-rose">{settings.letterSignoff}</p>
                </div>
              </div>
            </div>
          </motion.article>

          {!isOpen && (
            <>
              {/* front pocket — in front of the letter */}
              <motion.div
                aria-hidden
                style={{ top: envTop, height: env, opacity: envOpacity }}
                className="pointer-events-none absolute inset-x-0 z-30 overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-[#E27A92]" style={{ clipPath: "polygon(0 0, 52% 56%, 0 100%)" }} />
                <div className="absolute inset-0 bg-[#DC6F88]" style={{ clipPath: "polygon(100% 0, 48% 56%, 100% 100%)" }} />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#C9516D] to-[#E58BA0]"
                  style={{ clipPath: "polygon(0 100%, 50% 44%, 100% 100%)" }}
                />
                <div className="absolute inset-x-6 bottom-5 flex flex-col gap-1.5 opacity-60">
                  <span className="h-0.5 w-28 rounded bg-white/50" />
                  <span className="h-0.5 w-20 rounded bg-white/40" />
                </div>
              </motion.div>

              {/* wax seal + the tap target */}
              <motion.button
                onClick={open}
                disabled={phase !== "sealed"}
                aria-label="Open the letter"
                style={{ top: envTop, height: env }}
                className="group absolute inset-x-0 z-50 flex items-start justify-center rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-rose/40"
              >
                <motion.span
                  style={{ opacity: sealOpacity, scale: sealScale }}
                  className="mt-[calc(33%-2.25rem)] flex size-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-[#B03052] to-[#7A1F3A] shadow-[0_8px_20px_-6px_rgb(67_38_58/0.7),inset_0_2px_4px_rgb(255_255_255/0.25)] ring-4 ring-[#B03052]/30 transition-transform duration-300 group-hover:scale-110"
                >
                  <span className="icon-[lucide--heart] size-8 text-rosemist" />
                </motion.span>
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
