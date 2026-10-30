"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
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
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const dodgeRef = useRef<HTMLDivElement>(null);

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

  const dodgeNo = useCallback(() => {
    if (!settings.noIsDodger) return;
    const box = dodgeRef.current?.getBoundingClientRect();
    if (!box) return;
    // jump somewhere within the hero, away from where it is now
    const rangeX = Math.min(220, window.innerWidth * 0.28);
    const x = (Math.random() * 2 - 1) * rangeX;
    const y = (Math.random() * 2 - 1) * 140;
    setNoPos({ x, y });
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
              <motion.div key="asking" className="flex items-center justify-center gap-5">
                <ShimmerButton
                  onClick={celebrate}
                  background="linear-gradient(135deg, #E25A74 0%, #D64560 45%, #B03052 100%)"
                  shimmerColor="#FFE3EA"
                  shimmerDuration="2.6s"
                  className="tap-spring min-h-14 px-12 text-lg font-bold shadow-[0_0_40px_rgb(214_69_96/0.55)] transition-shadow hover:shadow-[0_0_60px_rgb(214_69_96/0.8)]"
                >
                  <span className="relative z-10 flex items-center gap-2">Yes <span className="icon-[lucide--heart] size-5" /></span>
                </ShimmerButton>
                <motion.button
                  onHoverStart={dodgeNo}
                  onFocus={dodgeNo}
                  onTouchStart={dodgeNo}
                  onClick={() => {
                    if (settings.noIsDodger) dodgeNo();
                  }}
                  animate={{ x: noPos.x, y: noPos.y, scale: Math.max(0.55, 1 - noAttempts * 0.08) }}
                  transition={SPRING_DODGE}
                  className="btn-wipe tap-spring min-h-14 rounded-full border border-white/40 bg-white/5 px-10 text-lg font-semibold text-white/85 backdrop-blur-sm"
                  style={{ pointerEvents: noAttempts >= NO_LABELS.length - 1 ? "none" : "auto" }}
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
