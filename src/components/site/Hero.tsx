"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Settings } from "@/lib/types";
import { SPRING_DODGE } from "@/lib/motion";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LazyScene } from "@/components/three/LazyScene";
import BlurText from "@/components/kit/BlurText";
import { TextGenerateEffect } from "@/components/kit/text-generate-effect";
import { ShimmerButton } from "@/components/kit/shimmer-button";
import { BorderBeam } from "@/components/kit/border-beam";
import { Spotlight } from "@/components/kit/spotlight-new";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/** current flee offset per No-button mover element */
const OFFSETS = new WeakMap<HTMLElement, { x: number; y: number }>();

const NO_LABELS = [
  "No",
  "Are you sure?",
  "Really sure?",
  "Think again",
  "Last chance!",
  "You're breaking my heart",
  "Okay… the button is shy now",
];

type HeroProps = {
  settings: Settings;
  answeredYesAt: string | null;
};

export function Hero({ settings, answeredYesAt }: HeroProps) {
  const [saidYes, setSaidYes] = useState(false);
  const [yesAt, setYesAt] = useState<string | null>(answeredYesAt);
  const [noAttempts, setNoAttempts] = useState(0);
  const dodgeRef = useRef<HTMLDivElement>(null);
  const noBtnRef = useRef<HTMLButtonElement>(null);
  // static wrapper = the No button's untransformed home slot (its rect never lags a frame)
  const noHomeRef = useRef<HTMLSpanElement>(null);
  // the element the flee loop translates (offset lives ON the element → no stale state)
  const noMoverRef = useRef<HTMLSpanElement>(null);
  const yesBtnRef = useRef<HTMLButtonElement>(null);
  const pointer = useRef({ x: -9999, y: -9999 });
  const velocity = useRef({ x: 0, y: 0, t: 0 }); // px per ms, smoothed
  const rafRef = useRef(0);
  const attemptRef = useRef(0);
  const nearRef = useRef(false);

  const answer = useMutation({
    mutationFn: (a: "yes" | "no") => api.send("/api/answer", "POST", { answer: a }),
  });

  const celebrate = useCallback(() => {
    setSaidYes(true);
    setYesAt(new Date().toISOString());
    answer.mutate("yes");
    // heart-shaped confetti bursts
    void import("canvas-confetti").then(({ default: confetti }) => {
      const heart = confetti.shapeFromPath({
        path: "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z",
      });
      const burst = (x: number) =>
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { x, y: 0.62 },
          shapes: [heart],
          scalar: 1.6,
          colors: ["#D64560", "#E8879C", "#F6DCE2", "#C9973F"],
        });
      burst(0.5);
      window.setTimeout(() => burst(0.32), 220);
      window.setTimeout(() => burst(0.68), 420);
    });
  }, [answer]);

  /**
   * The No button sits still until the cursor ALMOST touches it, then hops a
   * short way to the nearest free spot — close by, never on top of the Yes
   * button, the question text, the music bar or the nav, and never off screen.
   */
  const target = useRef<{ x: number; y: number } | null>(null);

  const flee = useCallback(() => {
    rafRef.current = requestAnimationFrame(flee);
    const home = noHomeRef.current;
    const mover = noMoverRef.current;
    const btn = noBtnRef.current;
    if (!home || !mover || !btn) return;

    const off = OFFSETS.get(mover) ?? { x: 0, y: 0 };
    const hR = home.getBoundingClientRect();
    const w = btn.offsetWidth;
    const h = btn.offsetHeight;
    const homeCx = hR.x + hR.width / 2;
    const homeCy = hR.y + hR.height / 2;
    const cx = homeCx + off.x;
    const cy = homeCy + off.y;

    // glide toward the current hop target (fast, but visibly a hop — not a teleport)
    const t = target.current;
    if (t) {
      const nx = off.x + (t.x - off.x) * 0.35;
      const ny = off.y + (t.y - off.y) * 0.35;
      const done = Math.hypot(t.x - nx, t.y - ny) < 0.5;
      const fx = done ? t.x : nx;
      const fy = done ? t.y : ny;
      OFFSETS.set(mover, { x: fx, y: fy });
      mover.style.transform = `translate3d(${fx.toFixed(1)}px, ${fy.toFixed(1)}px, 0)`;
      if (done) target.current = null;
    }

    const px = pointer.current.x;
    const py = pointer.current.y;
    if (px < -9000) return;
    const v = velocity.current;
    if (performance.now() - v.t > 60) {
      v.x *= 0.8;
      v.y *= 0.8;
    }

    // distance from a point to the button's box if it were centred at (bx, by)
    const gap = (qx: number, qy: number, bx: number, by: number, ww = w) =>
      Math.hypot(Math.max(0, Math.abs(qx - bx) - ww / 2), Math.max(0, Math.abs(qy - by) - h / 2));
    // the label gets longer on every dodge ("You're breaking my heart") → plan the
    // landing spot for a wider button so the growth can't reach the cursor/text
    const wNext = w + 70;
    const mobile = window.innerWidth < 640;
    const TRIGGER = mobile ? 40 : 26; // "almost touching"
    const CLEAR = mobile ? 70 : 60; // how far from the cursor it lands
    // where it's heading (or where it is) is what the cursor must not reach
    const curX = t ? homeCx + t.x : cx;
    const curY = t ? homeCy + t.y : cy;
    const lookX = px + v.x * 50;
    const lookY = py + v.y * 50;
    const threat = (bx: number, by: number, ww = w) =>
      Math.min(gap(px, py, bx, by, ww), gap(lookX, lookY, bx, by, ww));
    if (threat(curX, curY) >= TRIGGER) return;

    // ---- the cursor is about to touch it → pick the closest free spot ----
    const PAD = 14;
    const boxes: DOMRect[] = [];
    const section = home.closest("section");
    section
      ?.querySelectorAll<HTMLElement>("h1, h2, p, a, button, [data-dodge-avoid]")
      .forEach((el) => {
        if (el === btn || home.contains(el)) return;
        const r = el.getBoundingClientRect();
        if (r.width && r.height) boxes.push(r);
      });
    document.querySelectorAll<HTMLElement>("nav, [data-dodge-avoid]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) boxes.push(r);
    });
    const blocked = (bx: number, by: number, ww = wNext, pad = PAD) =>
      boxes.some(
        (r) =>
          bx + ww / 2 + pad > r.left &&
          bx - ww / 2 - pad < r.right &&
          by + h / 2 + pad > r.top &&
          by - h / 2 - pad < r.bottom,
      );
    const M = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const onScreen = (bx: number, by: number) =>
      bx - wNext / 2 >= M && bx + wNext / 2 <= vw - M && by - h / 2 >= M && by + h / 2 <= vh - M;

    // search rings around where it is now, nearest first; stay near home
    const RANGE_X = mobile ? vw : 320;
    const RANGE_Y = mobile ? 220 : 200;
    // pass 1: a spot it can glide to without crossing the cursor or any text;
    // pass 2 (cornered): any free spot — it blinks there instantly instead
    const pick = (needCleanPath: boolean) => {
      let best: { x: number; y: number; score: number } | null = null;
      for (let gx = -RANGE_X; gx <= RANGE_X; gx += 16) {
        for (let gy = -RANGE_Y; gy <= RANGE_Y; gy += 12) {
          const bx = homeCx + gx;
          const by = homeCy + gy;
          if (!onScreen(bx, by) || blocked(bx, by)) continue;
          const clear = threat(bx, by, wNext);
          if (clear < CLEAR) continue;
          if (needCleanPath) {
            let ok = true;
            for (let k = 1; k < 8 && ok; k++) {
              const f = k / 8;
              const qx = curX + (bx - curX) * f;
              const qy = curY + (by - curY) * f;
              if (threat(qx, qy) < 8 || blocked(qx, qy, w, 2)) ok = false;
            }
            if (!ok) continue;
          }
          // short hops win; mild pull back toward home so it never wanders off
          const score =
            Math.hypot(bx - curX, by - curY) + Math.hypot(gx, gy) * 0.35 - Math.min(clear, 160) * 0.2;
          if (!best || score < best.score) best = { x: gx, y: gy, score };
        }
      }
      return best;
    };
    let best = pick(true);
    let instant = false;
    if (!best) {
      best = pick(false);
      instant = true;
    }
    if (!best) return; // nowhere free (tiny screen) — stay put rather than cover something
    if (instant) {
      OFFSETS.set(mover, { x: best.x, y: best.y });
      mover.style.transform = `translate3d(${best.x}px, ${best.y}px, 0)`;
      target.current = null;
    } else {
      target.current = { x: best.x, y: best.y };
    }

    // one attempt per approach (label advances), resets once the cursor backs off
    if (!nearRef.current) {
      nearRef.current = true;
      setNoAttempts((n) => {
        const next = Math.min(n + 1, NO_LABELS.length - 1);
        attemptRef.current = next;
        return next;
      });
      window.setTimeout(() => {
        nearRef.current = false;
      }, 350);
    }
  }, []);

  // pointer tracking + the flee loop
  useEffect(() => {
    if (!settings.noIsDodger) return;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const v = velocity.current;
      const dt = now - v.t;
      if (e.type === "pointermove" && pointer.current.x > -9000 && dt > 0 && dt < 100) {
        v.x = v.x * 0.5 + ((e.clientX - pointer.current.x) / dt) * 0.5;
        v.y = v.y * 0.5 + ((e.clientY - pointer.current.y) / dt) * 0.5;
      } else {
        v.x = 0;
        v.y = 0;
      }
      v.t = now;
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    // touch screens fire no pointermove on a tap — the tap itself is the approach
    window.addEventListener("pointerdown", onMove, { passive: true });
    rafRef.current = requestAnimationFrame(flee);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [settings.noIsDodger, flee]);

  // once the button has run out of labels, it stops being clickable at all
  const exhausted = noAttempts >= NO_LABELS.length - 1;

  const dodgeNo = useCallback(() => {
    // clicking or focusing it also counts as an attempt
    if (!settings.noIsDodger) return;
    setNoAttempts((n) => Math.min(n + 1, NO_LABELS.length - 1));
  }, [settings.noIsDodger]);

  const answered = saidYes || yesAt !== null;

  return (
    <section
      id="question"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5"
    >
      {/* dusk gradient sky + three.js scene */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 110%, #B34A5E 0%, #6E2748 38%, #3A1533 68%, #1C0F22 100%)",
        }}
      />
      <LazyScene className="absolute inset-0 opacity-90" rootMargin="0px">
        {(active) => <HeroScene active={active} />}
      </LazyScene>
      {/* Aceternity spotlight beams, tinted rose */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(345, 100%, 88%, .12) 0, hsla(345, 90%, 60%, .04) 50%, hsla(345, 90%, 50%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(345, 100%, 88%, .08) 0, hsla(345, 90%, 60%, .03) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(40, 100%, 85%, .06) 0, hsla(40, 90%, 55%, .02) 80%, transparent 100%)"
        />
      </div>
      {/* soft vignette so the copy always reads */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,rgb(28_15_34/0.45),transparent_70%)]" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="font-hand text-2xl text-rose-soft md:text-3xl"
        >
          {settings.askerName} has a question for {settings.partnerName}…
        </motion.p>

        <BlurText
          as="h1"
          text={settings.question}
          trigger="load"
          animateBy="words"
          direction="top"
          delay={140}
          className="wrap mt-4 justify-center font-display text-4xl leading-tight text-white drop-shadow-[0_4px_24px_rgb(214_69_96/0.45)] md:text-6xl"
        />

        {settings.questionSubtext && (
          <TextGenerateEffect
            words={settings.questionSubtext}
            duration={0.6}
            className="wrap mt-5 max-w-md text-[15px] leading-relaxed text-white/75 md:text-base"
          />
        )}

        <div ref={dodgeRef} className="relative mt-10 flex min-h-30 items-center justify-center gap-5">
          <AnimatePresence mode="wait">
            {answered ? (
              <motion.div
                key="answered"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 1.08, 0.96, 1.02, 1], opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
                className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 px-8 py-6 backdrop-blur-md"
              >
                <BorderBeam size={120} duration={7} colorFrom="#F6DCE2" colorTo="#C9973F" />
                <p className="wrap font-display text-xl text-white md:text-2xl" data-multiline>
                  {settings.yesResponse}
                </p>
                <p className="mt-3 text-sm text-white/60">
                  {yesAt ? `Answered yes on ${new Date(yesAt).toLocaleDateString()}` : ""}
                </p>
              </motion.div>
            ) : (
              <motion.div key="asking" className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                <span ref={yesBtnRef} className="inline-flex">
                <ShimmerButton
                  onClick={celebrate}
                  background="linear-gradient(135deg, #E25A74 0%, #D64560 45%, #B03052 100%)"
                  shimmerColor="#FFE3EA"
                  shimmerDuration="2.6s"
                  className="tap-spring min-h-14 px-12 text-lg font-bold shadow-[0_0_40px_rgb(214_69_96/0.55)] transition-shadow hover:shadow-[0_0_60px_rgb(214_69_96/0.8)]"
                >
                  <span className="relative z-10 flex items-center gap-2">Yes <span className="icon-[lucide--heart] size-5" /></span>
                </ShimmerButton>
                </span>
                {/* The No button: pointer-events none → the cursor can never "hover" it,
                    it just flees. Clicking it is impossible too (it runs away). */}
                {/* fixed-width slot: a longer label grows evenly around the centre, so the
                    row (and the Yes button) never shift when the text changes */}
                <span ref={noHomeRef} className="inline-flex w-[10rem] justify-center sm:w-[13rem]">
                <span ref={noMoverRef} className="inline-flex shrink-0 justify-center will-change-transform">
                <motion.button
                  ref={noBtnRef}
                  type="button"
                  tabIndex={-1}
                  aria-hidden={exhausted ? undefined : true}
                  onClick={() => {
                    if (!settings.noIsDodger) return;
                    dodgeNo();
                  }}
                  style={{ pointerEvents: settings.noIsDodger ? "none" : "auto" }}
                  animate={{ scale: Math.max(0.55, 1 - noAttempts * 0.08) }}
                  transition={SPRING_DODGE}
                  className="btn-wipe tap-spring flex h-14 min-w-[10rem] shrink-0 items-center sm:min-w-[13rem] justify-center rounded-full border border-white/40 bg-white/5 px-10 text-lg font-semibold text-white/85 backdrop-blur-sm"
                >
                  {NO_LABELS[noAttempts]}
                </motion.button>
                </span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {answered && (
            <motion.a
              href="#timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-10 flex flex-col items-center gap-1 text-white/70 transition-colors hover:text-white"
            >
              <span className="text-sm tracking-wide">scroll for your surprises</span>
              <motion.span
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                className="icon-[lucide--chevron-down] size-5"
              />
            </motion.a>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
