"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/kit/tooltip";

const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;

/**
 * Music player — a little bubble in the top-right corner. Tap it and it
 * springs open into the full player; tap outside, press Esc or the chevron
 * to tuck it back into a bubble. Plays admin-uploaded tracks site-wide.
 */
export function TopMusicBar({ tracks }: { tracks: Track[] }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    audio.current = new Audio();
    audio.current.preload = "none";
    const el = audio.current;
    const onEnded = () => {
      setIdx((i) => {
        const next = (i + 1) % tracks.length;
        if (el) {
          el.src = `/api/tracks/${tracks[next]?.id}/raw`;
          void el.play().catch(() => setPlaying(false));
        }
        return next;
      });
    };
    el.addEventListener("ended", onEnded);
    return () => {
      el.pause();
      el.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  // tuck back into a bubble on outside tap / Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (tracks.length === 0) return null;
  const current = tracks[Math.min(idx, tracks.length - 1)];

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      if (!el.src || el.src !== absoluteUrl(current.id)) {
        el.src = `/api/tracks/${current.id}/raw`;
      }
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const step = (dir: 1 | -1) => {
    const el = audio.current;
    const next = (idx + dir + tracks.length) % tracks.length;
    setIdx(next);
    if (el && playing) {
      el.src = `/api/tracks/${tracks[next].id}/raw`;
      void el.play().catch(() => setPlaying(false));
    }
  };

  return (
    <div
      ref={rootRef}
      data-dodge-avoid
      className="fixed top-3 right-3 z-50 flex justify-end"
      role="region"
      aria-label="Music player"
    >
      <motion.div
        layout
        transition={SPRING}
        style={{ borderRadius: 999 }}
        className="relative overflow-hidden border border-white/15 bg-dusk0/75 text-white shadow-[0_12px_32px_-10px_rgb(28_15_34/0.65)] backdrop-blur-md"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div
              key="player"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.25, delay: 0.08 } }}
              exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.12 } }}
              className="flex max-w-[calc(100vw-1.5rem)] items-center gap-1.5 py-1.5 pr-1.5 pl-4"
            >
              {playing ? <EqBars /> : <span className="icon-[lucide--music] size-4 shrink-0 text-goldsoft" aria-hidden />}
              <div className="mx-1 w-28 min-w-0 sm:w-44">
                <p className="truncate text-[13px] font-semibold">{current.title}</p>
                {current.artist && <p className="truncate text-[11px] text-white/55">{current.artist}</p>}
              </div>
              <IconButton label="Previous song" onClick={() => step(-1)} icon="icon-[lucide--skip-back]" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggle}
                    aria-label={playing ? "Pause" : "Play"}
                    className="tap-spring flex size-10 shrink-0 items-center justify-center rounded-full bg-rose shadow-md transition-transform hover:scale-105"
                  >
                    <span
                      className={
                        playing ? "icon-[lucide--pause] size-5 fill-white" : "icon-[lucide--play] ml-0.5 size-5 fill-white"
                      }
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{playing ? "Pause" : "Play"}</TooltipContent>
              </Tooltip>
              <IconButton label="Next song" onClick={() => step(1)} icon="icon-[lucide--skip-forward]" />
              <IconButton label="Close player" onClick={() => setOpen(false)} icon="icon-[lucide--chevron-right]" />
            </motion.div>
          ) : (
            <motion.button
              key="bubble"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, transition: { ...SPRING, delay: 0.05 } }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.12 } }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setOpen(true)}
              aria-label={playing ? `Now playing: ${current.title} — open player` : "Open music player"}
              aria-expanded={false}
              className="relative flex size-12 items-center justify-center"
            >
              {/* spinning record ring while music plays */}
              <span
                aria-hidden
                className={`absolute inset-1 rounded-full bg-[conic-gradient(from_0deg,var(--color-rose),var(--color-gold),var(--color-rose))] ${
                  playing ? "animate-spin opacity-90 [animation-duration:3s]" : "opacity-45"
                }`}
              />
              <span aria-hidden className="absolute inset-[7px] rounded-full bg-dusk0" />
              <span className="relative">
                {playing ? <EqBars /> : <span className="icon-[lucide--music] block size-5 text-goldsoft" aria-hidden />}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* soft pulse inviting the first tap */}
      {!open && !playing && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 size-12 animate-ping rounded-full bg-rose/30 [animation-duration:2.4s]"
        />
      )}
    </div>
  );
}

function EqBars() {
  return (
    <span className="flex h-4 shrink-0 items-end gap-[3px]" aria-hidden>
      <span className="eq-bar" style={{ animationDelay: "0ms" }} />
      <span className="eq-bar" style={{ animationDelay: "0.2s" }} />
      <span className="eq-bar" style={{ animationDelay: "0.4s" }} />
    </span>
  );
}

function IconButton({ label, onClick, icon }: { label: string; onClick: () => void; icon: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className="tap-spring flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        >
          <span className={`${icon} size-4 fill-white`} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function absoluteUrl(id: number) {
  if (typeof window === "undefined") return `/api/tracks/${id}/raw`;
  return new URL(`/api/tracks/${id}/raw`, window.location.href).href;
}
