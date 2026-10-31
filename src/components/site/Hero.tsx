"use client";

import { AnimatePresence, motion, useMotionValue } from "motion/react";
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
  const noX = useMotionValue(0);
  const noY = useMotionValue(0);
  const dodgeRef = useRef<HTMLDivElement>(null);
  const noBtnRef = useRef<HTMLButtonElement>(null);
  const yesBtnRef = useRef<HTMLButtonElement>(null);
  const pointer = useRef({ x: -9999, y: -9999 });
  const noBox = useRef({ x: 0, y: 0, w: 0, h: 0 }); // current on-screen box of the No button
  const yesBox = useRef({ x: 0, y: 0, w: 0, h: 0 });
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
    const b = noBtnRef.current;
    const y = yesBtnRef.current;
    if (!container || !b || !y) {
      rafRef.current = requestAnimationFrame(flee);
      return;
    }
    const cRect = container.getBoundingClientRect();
    const base = b.getBoundingClientRect();
    const w = base.width;
    const h = base.height;
    const cx = base.x + w / 2;
    const cy = base.y + h / 2;

    const px = pointer.current.x;
    const py = pointer.current.y;
    const pointerKnown = px > -9000;
    const dist = Math.hypot(px - cx, py - cy);
    // "danger" = the cursor is close enough that the button should run
    const danger = w * 0.6 + h * 0.6 + 24;
    const near = pointerKnown && dist < danger;
    // an attempt counts only when the cursor is actually ON the button
    const onIt =
      pointerKnown && Math.abs(px - cx) < w / 2 + 6 && Math.abs(py - cy) < h / 2 + 6;

    // one attempt per approach (not per frame) so the label doesn't machine-gun
    if (onIt && !nearRef.current) {
      nearRef.current = true;
      setNoAttempts((n) => {
        const next = Math.min(n + 1, NO_LABELS.length - 1);
        attemptRef.current = next;
        return next;
      });
    } else if (!near) {
      nearRef.current = false;
    }

    let dx = 0;
    let dy = 0;
    // phones: the buttons are stacked (Yes on top) → flee down / sideways, stay on screen
    if (window.innerWidth < 640) {
      const tx = noX.get();
      const ty = noY.get();
      const homeCx = cx - tx;
      const homeCy = cy - ty;
      if (near) {
        const vx = cx - px;
        const vy = cy - py;
        const len = Math.hypot(vx, vy) || 1;
        // run to whichever side has more room when the finger is dead-centre
        const side = Math.abs(vx) < 8 ? (homeCx + tx < window.innerWidth / 2 ? 1 : -1) : Math.sign(vx);
        dx = tx + side * Math.max(Math.abs(vx / len), 0.6) * 140;
        dy = Math.max(0, ty + (vy / len) * 90 + 50);
      } else {
        dx = tx;
        dy = ty;
      }
      const m = 12;
      const minDx = m + w / 2 - homeCx;
      const maxDx = window.innerWidth - m - w / 2 - homeCx;
      // stay clear of the bottom nav bar (~90px)
      const maxDy = Math.max(0, Math.min(150, window.innerHeight - 100 - homeCy - h / 2));
      dx = Math.max(minDx, Math.min(maxDx, dx));
      dy = Math.max(0, Math.min(maxDy, dy));
      // pinned in a corner by the finger → hop to the other side
      if (near && Math.abs(dx - tx) < 2 && Math.abs(dy - ty) < 2) dx = dx > 0 ? minDx : maxDx;
      // never on top of Yes: push it below
      const yR = y.getBoundingClientRect();
      const tTop = homeCy + dy - h / 2;
      if (tTop < yR.bottom + 10) dy += yR.bottom + 10 - tTop;
      noX.set(tx + (dx - tx) * 0.25);
      noY.set(ty + (dy - ty) * 0.25);
      rafRef.current = requestAnimationFrame(flee);
      return;
    }
    if (near) {
      // push away from the pointer
      const vx = cx - px;
      const vy = cy - py;
      const len = Math.hypot(vx, vy) || 1;
      dx = (vx / len) * 230;
      dy = (vy / len) * 230;
      // it lives to the right of the Yes button → it may never flee to the left
      if (dx < 0) dx = 0;
      dy = Math.abs(dy) * 0.6 * (vy >= 0 ? 1 : -1) + (vy >= 0 ? 40 : -40);
    }

    // stay inside the hero
    const limitX = Math.max(0, Math.min(300, cRect.width / 2 - w / 2));
    const limitY = Math.max(0, Math.min(160, cRect.height / 2 - h / 2));
    dx = Math.max(0, Math.min(limitX, dx)); // right only
    dy = Math.max(-limitY, Math.min(limitY, dy));

    // the button may never end up on top of the Yes button: after computing the
    // target position, push it clear of the Yes button in one step
    const yRect = y.getBoundingClientRect();
    const targetCx = cx + dx;
    const targetCy = cy + dy;
    const overlapX =
      Math.min(targetCx + w / 2, yRect.right) - Math.max(targetCx - w / 2, yRect.left);
    const overlapY =
      Math.min(targetCy + h / 2, yRect.bottom) - Math.max(targetCy - h / 2, yRect.top);
    if (overlapX > 0 && overlapY > 0) {
      // always resolve to the RIGHT of the Yes button (it can never cross it)
      dx += overlapX + 18;
      dy += targetCy < yRect.y + yRect.height / 2 ? -18 : 18;
    }

    // ease toward the target so it looks like running away, not teleporting —
    // but never step THROUGH the Yes button: if the straight line would cross it,
    // jump around instead
    const curCx = cx;
    const curCy = cy;
    const stepX = dx - noX.get();
    const stepY = dy - noY.get();
    const toCx = curCx + stepX;
    const toCy = curCy + stepY;
    const crosses =
      Math.min(curCx, toCx) < yRect.right &&
      Math.max(curCx, toCx) > yRect.left &&
      Math.min(curCy, toCy) < yRect.bottom &&
      Math.max(curCy, toCy) > yRect.top;
    if (crosses) {
      // step to the right of the Yes button instead of sliding across it
      const need = yRect.right + w / 2 + 14 - toCx;
      noX.set(noX.get() + Math.max(need, 12));
      noY.set(noY.get() + stepY * 0.25);
    } else {
      noX.set(noX.get() + stepX * 0.18);
      noY.set(noY.get() + stepY * 0.18);
    }

    rafRef.current = requestAnimationFrame(flee);
  }, []);

  // pointer tracking + the flee loop
  useEffect(() => {
    if (!settings.noIsDodger) return;
    const onMove = (e: PointerEvent) => {
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
                <motion.button
                  ref={noBtnRef}
                  type="button"
                  tabIndex={-1}
                  aria-hidden={exhausted ? undefined : true}
                  onClick={() => {
                    if (!settings.noIsDodger) return;
                    dodgeNo();
                  }}
                  style={{ x: noX, y: noY, pointerEvents: settings.noIsDodger ? "none" : "auto" }}
                  animate={{ scale: Math.max(0.55, 1 - noAttempts * 0.08) }}
                  transition={SPRING_DODGE}
                  className="btn-wipe tap-spring flex h-14 min-w-[10rem] items-center sm:min-w-[13rem] justify-center rounded-full border border-white/40 bg-white/5 px-10 text-lg font-semibold text-white/85 backdrop-blur-sm"
                >
                  {NO_LABELS[noAttempts]}
                </motion.button>
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
