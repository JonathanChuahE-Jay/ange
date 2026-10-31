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
   * The No button is a scared little thing: it never sits under the cursor.
   * Every frame we measure how close the pointer is and push the button away,
   * so it flees continuously instead of teleporting once — which is what let it
   * land on top of the Yes button and set off a hover loop.
   */
  const flee = useCallback(() => {
    const container = dodgeRef.current;
    const b = noHomeRef.current;
    const mover = noMoverRef.current;
    const y = yesBtnRef.current;
    if (!container || !b || !mover || !y) {
      rafRef.current = requestAnimationFrame(flee);
      return;
    }
    const section = container.closest("section") ?? container;
    const sRect = section.getBoundingClientRect();
    // reading the transformed button's rect lags one frame behind the offset, so an
    // instant jump would get applied twice → measure home, add the motion values
    const home = b.getBoundingClientRect();
    const btn = noBtnRef.current;
    // real button size (offset* ignores transforms → no lag); the slot is fixed-width
    const w = btn ? btn.offsetWidth : home.width;
    const h = btn ? btn.offsetHeight : home.height;
    const homeCx = home.x + home.width / 2;
    const homeCy = home.y + home.height / 2;
    const off = OFFSETS.get(mover) ?? { x: 0, y: 0 };
    const tx = off.x;
    const ty = off.y;
    const cx = homeCx + tx;
    const cy = homeCy + ty;
    const yR = y.getBoundingClientRect();
    const mobile = window.innerWidth < 640;

    const px = pointer.current.x;
    const py = pointer.current.y;
    if (px < -9000) {
      rafRef.current = requestAnimationFrame(flee);
      return;
    }
    // look ahead along the cursor's motion so a fast flick can't catch it
    const v = velocity.current;
    if (performance.now() - v.t > 60) {
      // cursor stopped → its momentum fades
      v.x *= 0.8;
      v.y *= 0.8;
    }
    const ax = px + v.x * 150;
    const ay = py + v.y * 150;

    // distance from a point to a button-sized box centred at (bx, by)
    const gap = (qx: number, qy: number, bx: number, by: number) =>
      Math.hypot(Math.max(0, Math.abs(qx - bx) - w / 2), Math.max(0, Math.abs(qy - by) - h / 2));
    const threat = (bx: number, by: number) => Math.min(gap(px, py, bx, by), gap(ax, ay, bx, by));

    // where the button may go
    const m = 14;
    let minX: number, maxX: number, minY: number, maxY: number;
    if (mobile) {
      // stacked under Yes: anywhere below it, on screen, above the bottom nav
      minX = m + w / 2;
      maxX = window.innerWidth - m - w / 2;
      minY = Math.max(homeCy, yR.bottom + 10 + h / 2);
      maxY = Math.max(minY, Math.min(homeCy + 150, window.innerHeight - 100 - h / 2));
    } else {
      // desktop: anywhere in the hero (below the music bar, above the dock) —
      // hitsYes() below keeps it off the Yes button
      minX = Math.max(sRect.left, 0) + m + w / 2;
      maxX = Math.min(sRect.right, window.innerWidth) - m - w / 2;
      minY = Math.max(sRect.top + 100, 100) + h / 2;
      maxY = Math.min(sRect.bottom, window.innerHeight) - 100 - h / 2;
      if (maxY < minY) minY = maxY = homeCy;
    }
    const clampX = (x: number) => Math.max(minX, Math.min(maxX, x));
    const clampY = (yy: number) => Math.max(minY, Math.min(maxY, yy));
    const hitsYes = (bx: number, by: number) =>
      bx + w / 2 > yR.left - 12 && bx - w / 2 < yR.right + 12 && by + h / 2 > yR.top - 12 && by - h / 2 < yR.bottom + 12;

    const SAFE = mobile ? 70 : 130; // keep at least this much air between cursor and button
    const d = threat(cx, cy);

    // one attempt per approach: counts when the cursor gets close, resets once it backs off
    if (d < SAFE * 0.55 && !nearRef.current) {
      nearRef.current = true;
      setNoAttempts((n) => {
        const next = Math.min(n + 1, NO_LABELS.length - 1);
        attemptRef.current = next;
        return next;
      });
    } else if (d > SAFE * 1.2) {
      nearRef.current = false;
    }

    let goX = cx;
    let goY = cy;
    if (d < SAFE) {
      // push straight away from the cursor, far enough to be safe again
      let vx = cx - px;
      let vy = cy - py;
      const len = Math.hypot(vx, vy) || 1;
      vx /= len;
      vy /= len;
      const push = SAFE - d + 110;
      goX = clampX(cx + vx * push);
      goY = clampY(cy + vy * push);
      // cornered / blocked → jump to the safest spot it's allowed to be
      if (threat(goX, goY) < SAFE || hitsYes(goX, goY)) {
        let best = -1;
        for (let i = 0; i <= 8; i++) {
          for (let j = 0; j <= 6; j++) {
            const qx = minX + ((maxX - minX) * i) / 8;
            const qy = minY + ((maxY - minY) * j) / 6;
            if (hitsYes(qx, qy)) continue;
            // prefer far from the cursor, mildly prefer short hops
            const score = threat(qx, qy) - Math.hypot(qx - cx, qy - cy) * 0.08;
            if (score > best) {
              best = score;
              goX = qx;
              goY = qy;
            }
          }
        }
      }
    } else if (d > SAFE * 2.2 && threat(homeCx, homeCy) > SAFE * 2) {
      // cursor is well away (and not near home) → wander back home
      goX = homeCx;
      goY = homeCy;
    }

    // speed: snap when the cursor is very close, otherwise a quick ease
    const k = d < SAFE * 0.75 ? 1 : d < SAFE ? 0.7 : 0.12;
    const nx = tx + (goX - cx) * k;
    const ny = ty + (goY - cy) * k;
    OFFSETS.set(mover, { x: nx, y: ny });
    mover.style.transform = `translate3d(${nx.toFixed(1)}px, ${ny.toFixed(1)}px, 0)`;

    rafRef.current = requestAnimationFrame(flee);
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
