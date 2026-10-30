"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Mode = "default" | "hover" | "text";

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], label, select, summary, [data-cursor="hover"]';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]';

const HEART =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";

type Burst = { id: number; x: number; y: number };

/**
 * Custom cursor for the public site (mouse/trackpad only): the native cursor
 * is hidden; a glowing heart sits exactly at the pointer, a soft ring trails
 * it on a spring, and a short comet tail of dots follows. Over links/buttons
 * the ring swells and fills; over text fields it becomes an I-beam. Clicks
 * pop a little burst of hearts.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("default");
  const [down, setDown] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const reduced = useRef(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 380, damping: 30, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 380, damping: 30, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apply = () => setEnabled(fine.matches);
    apply();
    fine.addEventListener("change", apply);
    return () => fine.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = e.target as Element | null;
      setMode(el?.closest(TEXT) ? "text" : el?.closest(INTERACTIVE) ? "hover" : "default");
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setDown(true);
      if (!reduced.current) {
        const id = performance.now();
        setBursts((b) => [...b.slice(-4), { id, x: e.clientX, y: e.clientY }]);
        window.setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 700);
      }
    };
    const onUp = () => setDown(false);
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) setVisible(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseout", onLeave);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const ring =
    mode === "hover"
      ? { width: 54, height: 54, borderRadius: 999, backgroundColor: "rgba(214,69,96,0.16)", borderColor: "rgba(214,69,96,0.85)" }
      : mode === "text"
        ? { width: 3, height: 26, borderRadius: 2, backgroundColor: "rgba(214,69,96,0.95)", borderColor: "rgba(214,69,96,0)" }
        : { width: 34, height: 34, borderRadius: 999, backgroundColor: "rgba(214,69,96,0)", borderColor: "rgba(232,135,156,0.7)" };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]" style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}>
      {/* comet tail */}
      {!reduced.current && [0.5, 0.38, 0.28, 0.2].map((k, i) => <TailDot key={i} x={x} y={y} k={k} i={i} />)}

      {/* trailing ring */}
      <motion.div
        className="absolute top-0 left-0 border-[1.5px] mix-blend-normal backdrop-blur-[1px]"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{ ...ring, scale: down ? 0.82 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
      />

      {/* heart at the exact pointer */}
      <motion.div
        className="absolute top-0 left-0"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: mode === "text" ? 0 : down ? 0.7 : mode === "hover" ? 1.25 : 1, opacity: mode === "text" ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
      >
        <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] drop-shadow-[0_0_6px_rgba(214,69,96,0.9)]">
          <path d={HEART} fill="#D64560" stroke="#FFF" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </motion.div>

      {/* click bursts */}
      <AnimatePresence>
        {bursts.map((b) => (
          <div key={b.id} className="absolute top-0 left-0" style={{ transform: `translate(${b.x}px, ${b.y}px)` }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
              return (
                <motion.svg
                  key={i}
                  viewBox="0 0 24 24"
                  className="absolute -top-[5px] -left-[5px] h-[10px] w-[10px]"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                  animate={{ x: Math.cos(a) * 30, y: Math.sin(a) * 30, opacity: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <path d={HEART} fill={i % 2 ? "#F3C98B" : "#E8879C"} />
                </motion.svg>
              );
            })}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function TailDot({ x, y, k, i }: { x: MotionValue<number>; y: MotionValue<number>; k: number; i: number }) {
  // each dot is a progressively softer spring → a smooth comet tail
  const sx = useSpring(x, { stiffness: 260 - i * 50, damping: 22 + i * 2, mass: 0.4 + i * 0.15 });
  const sy = useSpring(y, { stiffness: 260 - i * 50, damping: 22 + i * 2, mass: 0.4 + i * 0.15 });
  const size = 7 - i * 1.3;
  return (
    <motion.span
      className="absolute top-0 left-0 rounded-full bg-rose"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", width: size, height: size, opacity: k }}
    />
  );
}
