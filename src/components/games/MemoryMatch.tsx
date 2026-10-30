"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PhotoMeta } from "@/lib/types";
import { cn } from "@/lib/utils";
import { celebrate, formatTime, readBest, writeBest } from "./celebrate";

const PAIRS = 6;
const ICONS = [
  "icon-[lucide--heart]",
  "icon-[lucide--sparkles]",
  "icon-[lucide--star]",
  "icon-[lucide--flower-2]",
  "icon-[lucide--moon-star]",
  "icon-[lucide--sun]",
  "icon-[lucide--music]",
  "icon-[lucide--gift]",
];

type Face = { kind: "photo"; id: number } | { kind: "icon"; icon: string };
type Card = { uid: number; pair: number; face: Face };

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Faces: real photos first (that's the charm), topped up with icons. */
function buildDeck(photos: PhotoMeta[]): Card[] {
  const faces: Face[] = [
    ...shuffle(photos).slice(0, PAIRS).map((p) => ({ kind: "photo" as const, id: p.id })),
    ...shuffle(ICONS).map((icon) => ({ kind: "icon" as const, icon })),
  ].slice(0, PAIRS);
  return shuffle(faces.flatMap((face, pair) => [0, 1].map((k) => ({ uid: pair * 2 + k, pair, face }))));
}

export function MemoryMatch({ photos }: { photos: PhotoMeta[] }) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]); // uids face-up (unmatched)
  const [matched, setMatched] = useState<Set<number>>(new Set()); // pair ids
  const [moves, setMoves] = useState(0);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const lock = useRef(false);
  // source of truth for taps that land before React re-renders
  const openRef = useRef<number[]>([]);
  const matchedRef = useRef<Set<number>>(new Set());

  const reset = useCallback(() => {
    setDeck(buildDeck(photos));
    setOpen([]);
    setMatched(new Set());
    openRef.current = [];
    matchedRef.current = new Set();
    setMoves(0);
    setStartAt(null);
    lock.current = false;
  }, [photos]);

  useEffect(() => {
    reset();
    setBest(readBest("memory"));
  }, [reset]);

  const won = deck.length > 0 && matched.size === PAIRS;

  useEffect(() => {
    if (startAt === null || won) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [startAt, won]);

  useEffect(() => {
    if (!won) return;
    celebrate();
    if (best === null || moves < best) {
      writeBest("memory", moves);
      setBest(moves);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const flip = (card: Card) => {
    if (lock.current || won || openRef.current.includes(card.uid) || matchedRef.current.has(card.pair)) return;
    if (startAt === null) {
      setStartAt(Date.now());
      setNow(Date.now());
    }
    const next = [...openRef.current, card.uid];
    openRef.current = next;
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((uid) => deck.find((c) => c.uid === uid)!);
    if (a.pair === b.pair) {
      matchedRef.current = new Set(matchedRef.current).add(a.pair);
      setMatched(matchedRef.current);
      openRef.current = [];
      setOpen([]);
    } else {
      lock.current = true;
      window.setTimeout(() => {
        openRef.current = [];
        setOpen([]);
        lock.current = false;
      }, 850);
    }
  };

  const elapsed = startAt === null ? 0 : now - startAt;
  const stars = useMemo(() => (moves <= PAIRS + 2 ? 3 : moves <= PAIRS + 6 ? 2 : 1), [moves]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-md items-center justify-between text-sm font-semibold text-inksoft">
        <span className="flex items-center gap-1.5"><span className="icon-[lucide--mouse-pointer-click] size-4 text-rose" />{moves} moves</span>
        <span className="flex items-center gap-1.5 tabular-nums"><span className="icon-[lucide--timer] size-4 text-rose" />{formatTime(elapsed)}</span>
        <span className="flex items-center gap-1.5"><span className="icon-[lucide--trophy] size-4 text-gold" />best {best ?? "—"}</span>
      </div>

      <div className="relative mt-5 grid w-full max-w-md grid-cols-4 gap-2.5 sm:gap-3">
        {deck.map((card) => {
          const faceUp = open.includes(card.uid) || matched.has(card.pair);
          const isMatched = matched.has(card.pair);
          return (
            <button
              key={card.uid}
              onClick={() => flip(card)}
              aria-label={faceUp ? "Revealed card" : "Hidden card"}
              className="group aspect-[3/4] [perspective:800px]"
            >
              <motion.div
                animate={{ rotateY: faceUp ? 180 : 0, scale: isMatched ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative size-full [transform-style:preserve-3d]"
              >
                {/* back */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl border border-white/40 bg-gradient-to-br from-rose to-rosedeep shadow-[0_8px_18px_-8px_rgb(176_48_82/0.6)] [backface-visibility:hidden] group-hover:brightness-110">
                  <div className="absolute inset-1.5 rounded-lg border border-white/25" />
                  <span className="icon-[lucide--heart] size-6 text-white/85" />
                </div>
                {/* front */}
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl border-2 bg-white shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]",
                    isMatched ? "border-gold shadow-[0_0_18px_rgb(201_151_63/0.5)]" : "border-line",
                  )}
                >
                  {card.face.kind === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/photos/${card.face.id}/raw`} alt="" className="size-full object-cover" />
                  ) : (
                    <span className={cn(card.face.icon, "size-8 text-rose")} />
                  )}
                </div>
              </motion.div>
            </button>
          );
        })}

        <AnimatePresence>
          {won && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-bg/85 text-center backdrop-blur-sm"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 400, damping: 14 }}
                    className={cn("icon-[lucide--star] size-9", i < stars ? "text-gold" : "text-line")}
                  />
                ))}
              </div>
              <p className="mt-3 font-display text-3xl text-ink">Perfect match</p>
              <p className="mt-1 font-hand text-2xl text-inksoft">
                {moves} moves in {formatTime(elapsed)} — just like us
              </p>
              <button
                onClick={reset}
                className="mt-5 flex min-h-11 items-center gap-2 rounded-full bg-rose px-6 font-bold text-white transition-colors hover:bg-rosedeep"
              >
                <span className="icon-[lucide--rotate-ccw] size-4" /> Play again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
