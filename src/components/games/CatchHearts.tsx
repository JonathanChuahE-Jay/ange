"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { celebrate, readBest, writeBest } from "./celebrate";

const DURATION = 30_000;
const LIVES = 3;

type Kind = "rose" | "gold" | "dark";
type Drop = { x: number; y: number; vy: number; r: number; kind: Kind; rot: number; vr: number };
type Pop = { x: number; y: number; text: string; color: string; t: number };

const COLORS: Record<Kind, string> = { rose: "#D64560", gold: "#C9973F", dark: "#43263A" };

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, fill: string, cracked = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(r / 12, r / 12);
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.bezierCurveTo(-12, 1, -11, -10, -5.5, -10);
  ctx.bezierCurveTo(-2.5, -10, -0.8, -8, 0, -6);
  ctx.bezierCurveTo(0.8, -8, 2.5, -10, 5.5, -10);
  ctx.bezierCurveTo(11, -10, 12, 1, 0, 9);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.shadowColor = fill;
  ctx.shadowBlur = cracked ? 0 : 10;
  ctx.fill();
  if (cracked) {
    ctx.strokeStyle = "#FBE9EE";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-2, -1);
    ctx.lineTo(2, 2);
    ctx.lineTo(-1, 7);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(-4.5, -5.5, 2.4, 1.5, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Catch the Hearts — 30s arcade: rose +1, gold +3, dark heart costs a life. */
export function CatchHearts() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [left, setLeft] = useState(DURATION);
  const [best, setBest] = useState<number | null>(null);
  const [newBest, setNewBest] = useState(false);

  // mutable game state lives in a ref so the RAF loop never re-renders React per frame
  const g = useRef({
    w: 0, h: 0, dpr: 1,
    basketX: 0, targetX: 0,
    drops: [] as Drop[], pops: [] as Pop[],
    score: 0, lives: LIVES, start: 0, last: 0, spawnIn: 0,
    keys: { left: false, right: false },
    raf: 0,
  });

  useEffect(() => setBest(readBest("catch")), []);

  // size canvas to its box (crisp on retina)
  useEffect(() => {
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c) return;
    const resize = () => {
      const s = g.current;
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = el.clientWidth;
      s.h = el.clientHeight;
      c.width = s.w * s.dpr;
      c.height = s.h * s.dpr;
      if (!s.basketX) s.basketX = s.targetX = s.w / 2;
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const s = g.current;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.clearRect(0, 0, s.w, s.h);

    for (const d of s.drops) drawHeart(ctx, d.x, d.y, d.r, d.rot, COLORS[d.kind], d.kind === "dark");

    // basket: a soft cup with a glowing rim
    const bw = Math.min(110, s.w * 0.24);
    const by = s.h - 34;
    ctx.save();
    ctx.shadowColor = "rgba(214,69,96,0.55)";
    ctx.shadowBlur = 18;
    const grad = ctx.createLinearGradient(0, by - 10, 0, by + 26);
    grad.addColorStop(0, "#E25A74");
    grad.addColorStop(1, "#B03052");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(s.basketX - bw / 2, by);
    ctx.lineTo(s.basketX + bw / 2, by);
    ctx.quadraticCurveTo(s.basketX + bw / 2 - 6, by + 26, s.basketX + bw / 2 - 18, by + 26);
    ctx.lineTo(s.basketX - bw / 2 + 18, by + 26);
    ctx.quadraticCurveTo(s.basketX - bw / 2 + 6, by + 26, s.basketX - bw / 2, by);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#F3E3C3";
    ctx.fillRect(s.basketX - bw / 2 - 4, by - 4, bw + 8, 6);
    drawHeart(ctx, s.basketX, by + 13, 8, 0, "#FBE9EE");

    // floating score pops
    for (const p of s.pops) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / 700);
      ctx.fillStyle = p.color;
      ctx.font = "700 18px var(--font-inter), sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y - p.t * 0.05);
      ctx.globalAlpha = 1;
    }
  }, []);

  const end = useCallback(() => {
    const s = g.current;
    cancelAnimationFrame(s.raf);
    setPhase("over");
    const prev = readBest("catch");
    if (prev === null || s.score > prev) {
      writeBest("catch", s.score);
      setBest(s.score);
      setNewBest(s.score > 0);
      if (s.score > 0) celebrate({ x: 0.5, y: 0.55 });
    }
  }, []);

  const loop = useCallback(
    (t: number) => {
      const s = g.current;
      const dt = Math.min(40, t - (s.last || t));
      s.last = t;
      const elapsed = t - s.start;
      const remaining = Math.max(0, DURATION - elapsed);
      const progress = elapsed / DURATION; // difficulty ramps up

      // input
      if (s.keys.left) s.targetX -= 0.6 * dt;
      if (s.keys.right) s.targetX += 0.6 * dt;
      s.targetX = Math.max(30, Math.min(s.w - 30, s.targetX));
      s.basketX += (s.targetX - s.basketX) * Math.min(1, dt * 0.02);

      // spawn
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        const roll = Math.random();
        const kind: Kind = roll < 0.12 + progress * 0.12 ? "dark" : roll > 0.9 ? "gold" : "rose";
        s.drops.push({
          x: 20 + Math.random() * (s.w - 40),
          y: -20,
          vy: (0.12 + Math.random() * 0.08 + progress * 0.14) * (kind === "gold" ? 1.25 : 1),
          r: kind === "gold" ? 13 : 15 + Math.random() * 5,
          kind,
          rot: (Math.random() - 0.5) * 0.6,
          vr: (Math.random() - 0.5) * 0.002,
        });
        s.spawnIn = 520 - progress * 280 + Math.random() * 200;
      }

      // physics + catches
      const bw = Math.min(110, s.w * 0.24);
      const by = s.h - 34;
      const kept: Drop[] = [];
      for (const d of s.drops) {
        d.y += d.vy * dt;
        d.rot += d.vr * dt;
        const caught = d.y + d.r * 0.6 >= by && d.y - d.r <= by + 12 && Math.abs(d.x - s.basketX) < bw / 2 + d.r * 0.4;
        if (caught) {
          if (d.kind === "dark") {
            s.lives -= 1;
            setLives(s.lives);
            s.pops.push({ x: d.x, y: by - 20, text: "ouch", color: "#43263A", t: 0 });
            wrap.current?.animate(
              [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }],
              { duration: 260 },
            );
          } else {
            const pts = d.kind === "gold" ? 3 : 1;
            s.score += pts;
            setScore(s.score);
            s.pops.push({ x: d.x, y: by - 20, text: `+${pts}`, color: COLORS[d.kind], t: 0 });
          }
          continue;
        }
        if (d.y - d.r < s.h + 10) kept.push(d);
      }
      s.drops = kept;
      s.pops = s.pops.map((p) => ({ ...p, t: p.t + dt })).filter((p) => p.t < 700);

      draw();
      setLeft(remaining);
      if (remaining <= 0 || s.lives <= 0) return end();
      s.raf = requestAnimationFrame(loop);
    },
    [draw, end],
  );

  const start = () => {
    const s = g.current;
    Object.assign(s, { drops: [], pops: [], score: 0, lives: LIVES, last: 0, spawnIn: 300, start: performance.now() });
    s.basketX = s.targetX = s.w / 2;
    setScore(0);
    setLives(LIVES);
    setLeft(DURATION);
    setNewBest(false);
    setPhase("playing");
    s.raf = requestAnimationFrame(loop);
    wrap.current?.focus();
  };

  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);

  // keyboard (only while the game box is focused, so arrows still scroll the page otherwise)
  const onKey = (down: boolean) => (e: React.KeyboardEvent) => {
    const s = g.current;
    if (e.key === "ArrowLeft" || e.key === "a") { s.keys.left = down; e.preventDefault(); }
    if (e.key === "ArrowRight" || e.key === "d") { s.keys.right = down; e.preventDefault(); }
    if (down && (e.key === " " || e.key === "Enter") && phase !== "playing") { e.preventDefault(); start(); }
  };

  const onPointer = (e: React.PointerEvent) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (rect) g.current.targetX = e.clientX - rect.left;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-xl items-center justify-between text-sm font-semibold text-inksoft">
        <span className="flex items-center gap-1.5"><span className="icon-[lucide--heart] size-4 text-rose" />{score} pts</span>
        <span className="flex items-center gap-1" aria-label={`${lives} lives`}>
          {Array.from({ length: LIVES }).map((_, i) => (
            <span key={i} className={i < lives ? "icon-[lucide--heart] size-4 text-rose" : "icon-[lucide--heart-crack] size-4 text-line"} />
          ))}
        </span>
        <span className="flex items-center gap-1.5 tabular-nums"><span className="icon-[lucide--timer] size-4 text-rose" />{Math.ceil(left / 1000)}s</span>
        <span className="flex items-center gap-1.5"><span className="icon-[lucide--trophy] size-4 text-gold" />best {best ?? "—"}</span>
      </div>

      <div
        ref={wrap}
        tabIndex={0}
        role="application"
        aria-label="Catch the hearts game. Move with mouse, touch, or arrow keys."
        onKeyDown={onKey(true)}
        onKeyUp={onKey(false)}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        className="relative mt-4 h-[min(60vh,420px)] w-full max-w-xl touch-none overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-[#2A1230] via-dusk1 to-dusk2 outline-none focus-visible:ring-4 focus-visible:ring-rose/30"
      >
        <div aria-hidden className="stars-layer absolute inset-0 opacity-60" />
        <canvas ref={canvas} className="absolute inset-0 size-full" />

        <AnimatePresence>
          {phase !== "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-dusk0/55 px-6 text-center backdrop-blur-[2px]"
            >
              {phase === "ready" ? (
                <>
                  <p className="font-display text-3xl text-white">Catch my heart</p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/80">
                    <span className="flex items-center gap-1.5"><span className="icon-[lucide--heart] size-4 text-rose" /> +1</span>
                    <span className="flex items-center gap-1.5"><span className="icon-[lucide--heart] size-4 text-gold" /> +3</span>
                    <span className="flex items-center gap-1.5"><span className="icon-[lucide--heart-crack] size-4 text-white/60" /> lose a life</span>
                  </div>
                  <p className="mt-2 text-[13px] text-white/50">mouse, finger or arrow keys · 30 seconds</p>
                </>
              ) : (
                <>
                  <p className="font-hand text-2xl text-goldsoft">{newBest ? "new best!" : lives <= 0 ? "heartbroken…" : "time's up"}</p>
                  <p className="mt-1 font-display text-5xl text-white">{score}</p>
                  <p className="mt-1 text-sm text-white/60">
                    {score >= 40 ? "you caught every bit of me" : score >= 20 ? "my heart is in good hands" : "try again, I'll wait"}
                  </p>
                </>
              )}
              <button
                onClick={start}
                className="mt-6 flex min-h-12 items-center gap-2 rounded-full bg-rose px-8 font-bold text-white shadow-[0_0_30px_rgb(214_69_96/0.5)] transition-colors hover:bg-rosedeep"
              >
                <span className={phase === "ready" ? "icon-[lucide--play] size-4" : "icon-[lucide--rotate-ccw] size-4"} />
                {phase === "ready" ? "Start" : "Play again"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
