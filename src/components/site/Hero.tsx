"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type { Settings } from "@/lib/types";
import { SPRING_DODGE } from "@/lib/motion";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const NO_LABELS = [
  "No",
  "Are you sure?",
  "Really sure?",
  "Think again 🤔",
  "Last chance!",
  "You're breaking my heart 💔",
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
      const heart = confetti.shapeFromText({ text: "💖", scalar: 2.4 });
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
      <div aria-hidden className="absolute inset-0 opacity-90">
        <HeroScene />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="font-hand text-2xl text-rose-soft md:text-3xl"
        >
          {settings.askerName} has a question for {settings.partnerName}…
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="mt-4 wrap font-display text-4xl leading-tight text-white drop-shadow-lg md:text-6xl"
        >
          {settings.question}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-4 max-w-md text-[15px] text-white/70 md:text-base"
        >
          {settings.questionSubtext}
        </motion.p>

        <div ref={dodgeRef} className="relative mt-10 flex min-h-30 items-center justify-center gap-5">
          <AnimatePresence mode="wait">
            {answered ? (
              <motion.div
                key="answered"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 1.08, 0.96, 1.02, 1], opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
                className="rounded-3xl border border-white/25 bg-white/12 px-8 py-6 backdrop-blur-md"
              >
                <p className="wrap font-display text-xl text-white md:text-2xl" data-multiline>
                  {settings.yesResponse}
                </p>
                <p className="mt-3 text-sm text-white/60">
                  {yesAt ? `Answered yes on ${new Date(yesAt).toLocaleDateString()} 💖` : ""}
                </p>
              </motion.div>
            ) : (
              <motion.div key="asking" className="flex items-center justify-center gap-5">
                <button
                  onClick={celebrate}
                  className="tap-spring btn-circle-drop min-h-14 rounded-full bg-white px-12 text-lg font-bold text-rose shadow-xl hover:bg-rose-soft"
                >
                  Yes 💖
                </button>
                <motion.button
                  onHoverStart={dodgeNo}
                  onFocus={dodgeNo}
                  onTouchStart={dodgeNo}
                  onClick={() => {
                    if (settings.noIsDodger) dodgeNo();
                  }}
                  animate={{ x: noPos.x, y: noPos.y, scale: Math.max(0.55, 1 - noAttempts * 0.08) }}
                  transition={SPRING_DODGE}
                  className="btn-wipe tap-spring min-h-14 rounded-full border border-white/50 px-10 text-lg font-semibold text-white/85"
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
                className="i-lucide-chevron-down size-5"
              />
            </motion.a>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
