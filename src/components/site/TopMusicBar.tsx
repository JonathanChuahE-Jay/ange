"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/kit/tooltip";

/** Floating top music bar — plays admin-uploaded tracks site-wide. */
export function TopMusicBar({ tracks }: { tracks: Track[] }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

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
      data-dodge-avoid
      className="fixed top-3 left-1/2 z-50 -translate-x-1/2"
      role="region"
      aria-label="Music player"
    >
      <div className="flex max-w-[calc(100vw-1.5rem)] items-center gap-1.5 rounded-full border border-white/15 bg-dusk0/70 shadow-[0_10px_30px_-10px_rgb(28_15_34/0.6)] py-1.5 pr-1.5 pl-4 text-white shadow-xl backdrop-blur-md">
        {playing ? (
          <span className="flex h-4 items-end gap-[3px]" aria-hidden>
            <span className="eq-bar" style={{ animationDelay: "0ms" }} />
            <span className="eq-bar" style={{ animationDelay: "0.2s" }} />
            <span className="eq-bar" style={{ animationDelay: "0.4s" }} />
          </span>
        ) : (
          <span className="icon-[lucide--music] size-4 text-goldsoft" aria-hidden />
        )}
        <div className="mx-1 min-w-0 w-28 sm:w-44">
          <p className="truncate text-[13px] font-semibold">{current.title}</p>
          {current.artist && <p className="truncate text-[11px] text-white/55">{current.artist}</p>}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
          onClick={() => step(-1)}
          aria-label="Previous song"
          className="tap-spring flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        >
          <span className="icon-[lucide--skip-back] size-4 fill-white" />
        </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Previous song</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="tap-spring flex size-10 items-center justify-center rounded-full bg-rose shadow-md transition-transform hover:scale-105"
        >
          <span
            className={
              playing ? "icon-[lucide--pause] size-5 fill-white" : "icon-[lucide--play] size-5 ml-0.5 fill-white"
            }
          />
        </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{playing ? "Pause" : "Play"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
          onClick={() => step(1)}
          aria-label="Next song"
          className="tap-spring flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        >
          <span className="icon-[lucide--skip-forward] size-4 fill-white" />
        </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Next song</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function absoluteUrl(id: number) {
  if (typeof window === "undefined") return `/api/tracks/${id}/raw`;
  return new URL(`/api/tracks/${id}/raw`, window.location.href).href;
}
