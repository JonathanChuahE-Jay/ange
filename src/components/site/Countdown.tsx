"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";
import { Meteors } from "@/components/kit/meteors";
import { BorderBeam } from "@/components/kit/border-beam";

/**
 * Countdown — spec: numbers/flip-number (split-flap: upper flap falls 150ms
 * ease-in, lower flap lands 150ms ease-out, only changed digits flip).
 * Rendered as a dusk section with star field + glowing glass cards.
 */

function FlipDigit({ digit }: { digit: string }) {
  const [prev, setPrev] = useState(digit);
  const [phase, setPhase] = useState<"idle" | "top" | "bottom">("idle");

  useEffect(() => {
    if (digit === prev) return;
    setPhase("top");
    const t1 = window.setTimeout(() => setPhase("bottom"), 150);
    const t2 = window.setTimeout(() => {
      setPrev(digit);
      setPhase("idle");
    }, 300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [digit, prev]);

  const face = "flex h-13 items-center justify-center font-display text-xl md:h-16 md:text-2xl";

  return (
    <span
      aria-hidden
      className="flip-card flip-dusk relative inline-block h-13 w-9 rounded-md shadow-md md:h-16 md:w-12"
      style={{ perspective: "400px" }}
    >
      {/* static upper half — NEXT digit */}
      <span className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-md" style={{ background: "var(--flip-bg)" }}>
        <span className={face} style={{ color: "var(--flip-fg)" }}>
          {digit}
        </span>
      </span>
      {/* static lower half — PREVIOUS digit */}
      <span className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-md" style={{ background: "var(--flip-bg)" }}>
        <span className={`absolute inset-x-0 bottom-0 ${face}`} style={{ color: "var(--flip-fg)" }}>
          {prev}
        </span>
      </span>
      {/* falling upper flap — PREVIOUS digit top */}
      <span
        className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-md"
        style={{
          background: "var(--flip-bg)",
          backfaceVisibility: "hidden",
          transformOrigin: "bottom",
          transform: phase === "top" || phase === "bottom" ? "rotateX(-90deg)" : "rotateX(0deg)",
          transition: phase === "top" ? "transform 150ms cubic-bezier(0.55,0,0.9,0.45)" : "none",
          visibility: phase === "bottom" ? "hidden" : "visible",
        }}
      >
        <span className={face} style={{ color: "var(--flip-fg)" }}>
          {prev}
        </span>
      </span>
      {/* landing lower flap — NEXT digit bottom */}
      <span
        className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-md"
        style={{
          background: "var(--flip-bg)",
          backfaceVisibility: "hidden",
          transformOrigin: "top",
          transform: phase === "bottom" ? "rotateX(0deg)" : "rotateX(90deg)",
          transition: phase === "bottom" ? "transform 150ms cubic-bezier(0.1,0.55,0.45,1)" : "none",
          visibility: phase === "idle" ? "hidden" : "visible",
        }}
      >
        <span className={`absolute inset-x-0 bottom-0 ${face}`} style={{ color: "var(--flip-fg)" }}>
          {digit}
        </span>
      </span>
      {/* fold shadow */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-black/35 transition-opacity duration-150"
        style={{ opacity: phase === "idle" ? 0.15 : 0.4 }}
      />
    </span>
  );
}

function FlipGroup({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex gap-1.5">
        {value.split("").map((d, i) => (
          <FlipDigit key={i} digit={d} />
        ))}
      </div>
      <span className="text-[12px] font-bold tracking-[0.3em] text-goldsoft/80 uppercase">{label}</span>
    </div>
  );
}

function pad(n: number, len = 2) {
  return String(Math.max(0, n)).padStart(len, "0");
}

export function Countdown({ settings }: { settings: Settings }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const target = settings.countdownTarget ? Date.parse(settings.countdownTarget) : null;
  const valid = target !== null && !Number.isNaN(target);

  let body: React.ReactNode;

  if (!valid) {
    body = (
      <div className="flex max-w-md flex-col items-center gap-3 rounded-3xl border border-white/15 bg-white/5 px-10 py-10 text-center backdrop-blur-sm">
        <span className="icon-[lucide--moon-star] size-9 text-goldsoft" aria-hidden />
        <p className="font-hand text-3xl text-white/90">a date is being picked… ✨</p>
        <p className="text-sm text-white/45">(it'll appear here the second it's set)</p>
      </div>
    );
  } else if (now >= target!) {
    body = (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose via-rosedeep to-dusk2 px-10 py-12 text-center shadow-2xl">
        <div aria-hidden className="stars-layer absolute inset-0 opacity-60" />
        <p className="relative font-display text-5xl text-white">It's today! 🎉</p>
        <p className="relative mt-3 text-white/85">
          {new Date(target!).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
        </p>
      </div>
    );
  } else {
    const diff = target! - now;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor(diff / 3_600_000) % 24;
    const minutes = Math.floor(diff / 60_000) % 60;
    const seconds = Math.floor(diff / 1000) % 60;
    body = (
      <div
        className="relative flex flex-wrap items-start justify-center gap-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 backdrop-blur-sm md:gap-9 md:px-10"
        role="timer"
        aria-label={`${days} days, ${hours} hours, ${minutes} minutes remaining`}
      >
        <BorderBeam size={140} duration={10} colorFrom="#D64560" colorTo="#F3E3C3" />
        <FlipGroup value={pad(days, Math.min(3, String(days).length))} label="days" />
        <FlipGroup value={pad(hours)} label="hours" />
        <FlipGroup value={pad(minutes)} label="minutes" />
        <FlipGroup value={pad(seconds)} label="seconds" />
      </div>
    );
  }

  return (
    <section
      id="countdown"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-dusk0 via-dusk1 to-dusk0 py-24"
    >
      {/* star field + rose glow + petals */}
      <div aria-hidden className="stars-layer absolute inset-0 opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Meteors number={18} angle={215} className="bg-rosesoft shadow-[0_0_0_1px_#ffffff10]" />
      </div>
      <div aria-hidden className="absolute top-1/2 left-1/2 size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose/20 blur-[110px]" />
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <span className="petal left-[12%] text-rose-soft" style={{ animationDuration: "12s" }}>♥</span>
        <span className="petal left-[78%] text-goldsoft" style={{ animationDuration: "16s", animationDelay: "4s" }}>♥</span>
        <span className="petal left-[46%] text-rosemist" style={{ animationDuration: "19s", animationDelay: "8s" }}>♥</span>
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-5">
        <SectionHeading
          dark
          kicker="tick tock"
          title="A countdown"
          icon="icon-[lucide--timer]"
        />
        <p className="mt-5 font-hand text-3xl text-rosemist/90">{settings.countdownTitle}</p>
        <div className="mt-12 flex justify-center">{body}</div>
      </div>
    </section>
  );
}
