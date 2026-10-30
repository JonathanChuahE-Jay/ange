"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import type { Prize } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/kit/dialog";
import { ShimmerButton } from "@/components/kit/shimmer-button";
import { ShineBorder } from "@/components/kit/shine-border";
import { SectionHeading } from "./SectionHeading";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

type SpinResult = { index: number; prize: Prize };

/** A prize wheel — carnival style: gold rim, pulsing bulbs, server-picked prize. */
export function Wheel({ prizes }: { prizes: Prize[] }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const rotRef = useRef(0);

  const spin = useMutation({
    mutationFn: () => api.send<SpinResult>("/api/spin", "POST"),
    onSuccess: (res) => {
      const seg = 360 / prizes.length;
      const centerOf = (res.index + 0.5) * seg;
      const current = rotRef.current;
      const targetMod = (360 - centerOf - (current % 360) + 360) % 360;
      const final = current + 4 * 360 + targetMod;

      setSpinning(true);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduce) {
        rotRef.current = final;
        setRotation(final);
        finish(res);
        return;
      }

      const start = performance.now();
      const duration = 4200;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const value = current + (final - current) * eased;
        rotRef.current = value;
        setRotation(value);
        if (p < 1) requestAnimationFrame(tick);
        else finish(res);
      };
      requestAnimationFrame(tick);
    },
    onError: () => setSpinning(false),
  });

  function finish(res: SpinResult) {
    setSpinning(false);
    setResult(res);
    void import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.7 },
        colors: ["#D64560", "#E8879C", "#F6DCE2", "#C9973F"],
      });
    });
  }

  const R = 160;
  const seg = 360 / Math.max(1, prizes.length);
  const BULBS = 12;

  function segmentPath(i: number) {
    const a0 = (i * seg - 90) * (Math.PI / 180);
    const a1 = ((i + 1) * seg - 90) * (Math.PI / 180);
    const x0 = R + R * Math.cos(a0);
    const y0 = R + R * Math.sin(a0);
    const x1 = R + R * Math.cos(a1);
    const y1 = R + R * Math.sin(a1);
    const large = seg > 180 ? 1 : 0;
    return `M ${R} ${R} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
  }

  return (
    <section id="wheel" className="relative w-full scroll-mt-20 overflow-x-clip px-5 py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob size-80 bg-rosemist right-[-5rem] top-1/4" style={{ animationDuration: "16s" }} />
      </div>

      <div className="relative mx-auto mt-2 max-w-3xl">
        <SectionHeading
          kicker="every slice is a win"
          title="A prize wheel"
          icon="icon-[lucide--gift]"
          note="no take-backs, only prizes"
        />

        <div className="mt-16 flex flex-col items-center">
          <div className="relative">
            {/* pedestal glow */}
            <div aria-hidden className="absolute -bottom-10 left-1/2 h-12 w-[85%] -translate-x-1/2 rounded-[100%] bg-rose/25 blur-2xl" />

            {/* pointer */}
            <div
              aria-hidden
              className="absolute -top-2 left-1/2 z-10 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "15px solid transparent",
                borderRight: "15px solid transparent",
                borderTop: "30px solid #C9973F",
                filter: "drop-shadow(0 3px 4px rgb(0 0 0 / 0.3))",
              }}
            />
            <svg
              viewBox={`0 0 ${R * 2} ${R * 2}`}
              className="size-[min(78vw,340px)] drop-shadow-2xl"
              role="img"
              aria-label="Prize wheel"
            >
              <circle cx={R} cy={R} r={R} fill="#fff" />
              <g
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center",
                }}
              >
                {prizes.map((p, i) => {
                  const center = (i + 0.5) * seg;
                  const light = i % 2 === 0;
                  const label =
                    p.label.length > 14 ? `${p.label.slice(0, 13)}…` : p.label;
                  return (
                    <g key={p.id}>
                      <path
                        d={segmentPath(i)}
                        fill={p.color}
                        opacity={light ? 1 : 0.82}
                        stroke="#FFF8F3"
                        strokeWidth={2.5}
                      />
                      {/* small heart near the rim */}
                      <g transform={`rotate(${center} ${R} ${R})`}>
                        <path
                          transform={`translate(${R - 6} ${R - R * 0.76}) scale(0.5)`}
                          d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
                          fill="#fff"
                          opacity={0.85}
                        />
                        {/* radial label — reads outward so it never stacks */}
                        <text
                          transform={`translate(${R} ${R - R * 0.44}) rotate(-90)`}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={R * 0.066}
                          fontWeight={700}
                          fill="#fff"
                        >
                          {label}
                        </text>
                      </g>
                    </g>
                  );
                })}
                {/* hub */}
                <circle cx={R} cy={R} r={R * 0.15} fill="#43263A" stroke="#C9973F" strokeWidth={3} />
                <g transform={`translate(${R - 10} ${R - 10}) scale(0.83)`}>
                  <path
                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                    fill="#F6DCE2"
                  />
                </g>
              </g>

              {/* fixed gold rim + carnival bulbs (do not rotate) */}
              <circle cx={R} cy={R} r={R - 4} fill="none" stroke="#C9973F" strokeWidth={7} />
              {Array.from({ length: BULBS }).map((_, k) => {
                const a = (k / BULBS) * Math.PI * 2 - Math.PI / 2;
                const rr = R - 17;
                return (
                  <circle
                    key={k}
                    cx={R + Math.cos(a) * rr}
                    cy={R + Math.sin(a) * rr}
                    r={5}
                    fill="#F3E3C3"
                    className="bulb"
                    style={{ animationDelay: `${(k % 3) * 0.25}s` }}
                  />
                );
              })}
            </svg>
          </div>

          <ShimmerButton
            onClick={() => !spinning && spin.mutate()}
            disabled={spinning || prizes.length === 0}
            background="linear-gradient(135deg, #D64560 0%, #B03052 100%)"
            shimmerColor="#F3E3C3"
            className="tap-spring mt-12 min-h-14 px-12 font-display text-xl font-bold tracking-[0.15em] uppercase shadow-[0_14px_40px_-10px_rgb(214_69_96/0.7)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="relative z-10">
              {spinning ? "spinning…" : prizes.length === 0 ? "No prizes yet" : "Spin"}
            </span>
          </ShimmerButton>
          <p className="mt-3 font-hand text-xl text-inksoft">
            one spin = one redeemable prize, screenshot your coupon
          </p>
        </div>
      </div>

      <Dialog open={result !== null} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-line bg-bg p-8 sm:max-w-sm">
          <ShineBorder borderWidth={2} duration={10} shineColor={["#D64560", "#C9973F", "#F6DCE2"]} />
          {result && (
            <div className="flex flex-col items-center py-2 text-center">
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                transition={{ duration: 0.45, ease: [0.215, 0.61, 0.355, 1] }}
                className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose to-rosedeep text-white shadow-[0_14px_30px_-10px_rgb(214_69_96/0.7)]"
                aria-hidden
              >
                <span className="icon-[lucide--gift] size-10" />
              </motion.span>
              <DialogDescription className="mt-3 font-hand text-2xl text-gold">you won…</DialogDescription>
              <DialogTitle className="wrap mt-1 font-display text-4xl font-normal text-ink">
                {result.prize.label}!
              </DialogTitle>
              <p className="mt-2 text-[15px] text-inksoft">Screenshot this as your coupon</p>
              <ShimmerButton
                onClick={() => setResult(null)}
                background="linear-gradient(135deg, #D64560 0%, #B03052 100%)"
                shimmerColor="#FFE3EA"
                className="tap-spring mt-6 min-h-12 px-8 font-bold"
              >
                <span className="relative z-10">Claim it</span>
              </ShimmerButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
