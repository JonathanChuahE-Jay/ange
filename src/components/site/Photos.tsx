"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PhotoMeta } from "@/lib/types";
import BlurText from "@/components/kit/BlurText";
import { SectionHeading } from "./SectionHeading";

const TILTS = [-2.2, 2, -1.2, 2.8, -2.8, 1.2];
const EASE = [0.22, 1, 0.36, 1] as const;

type Rect = { top: number; left: number; width: number; height: number };
type Opened = { index: number; from: Rect; aspect: number };

/**
 * Photos — a pinned polaroid strip that glides sideways as you scroll down the
 * page (no arrows). Tapping a photo lifts it out of its frame and zooms it to
 * fullscreen, where it turns into its generated motion clip.
 */
export function Photos({ photos }: { photos: PhotoMeta[] }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [distance, setDistance] = useState(0);
  const [vh, setVh] = useState(800);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [active, setActive] = useState(0);

  // how far the track must travel = its overflow beyond the viewport
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
      setVh(window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [photos.length]);

  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });
  const dist = useMotionValue(0);
  useEffect(() => dist.set(distance), [distance, dist]);
  const rawX = useTransform([scrollYProgress, dist], ([p, d]: number[]) => -p * d);
  const x = useSpring(rawX, { stiffness: 220, damping: 38, mass: 0.5 });
  const barScale = useSpring(scrollYProgress, { stiffness: 220, damping: 38 });
  useMotionValueEvent(scrollYProgress, "change", (p) =>
    setActive(Math.min(photos.length - 1, Math.round(p * (photos.length - 1)))),
  );

  const open = useCallback((index: number) => {
    const img = imgRefs.current[index];
    if (!img) return;
    const r = img.getBoundingClientRect();
    const aspect = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : r.width / r.height;
    setOpened({ index, from: { top: r.top, left: r.left, width: r.width, height: r.height }, aspect });
  }, []);

  if (photos.length === 0) {
    return (
      <section id="photos" className="relative scroll-mt-20 py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <SectionHeading kicker="freeze-framed feelings" title="Your photos" icon="icon-[lucide--camera]" />
        </div>
        <div className="mx-auto mt-14 flex max-w-md flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-white/70 px-8 py-12 text-center">
          <span className="icon-[lucide--camera] size-8 text-rose/60" aria-hidden />
          <p className="text-inksoft">No photos yet — hang the first memory in the admin panel</p>
        </div>
      </section>
    );
  }

  return (
    <section id="photos" className="relative scroll-mt-0">
      {/* tall scroller: vertical scroll distance == horizontal travel */}
      <div ref={outerRef} style={{ height: distance + vh }} className="relative">
        <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden pt-14">
          <div className="mx-auto w-full max-w-6xl px-5">
            <SectionHeading
              kicker="freeze-framed feelings"
              title="Your photos"
              icon="icon-[lucide--camera]"
              note="keep scrolling · tap one to relive it"
            />
          </div>

          <motion.div
            ref={trackRef}
            style={{ x }}
            className="mt-8 flex w-max items-center gap-7 px-[max(1.25rem,calc(50vw-150px))] py-6 will-change-transform md:mt-10 md:gap-10"
          >
            {photos.map((p, i) => (
              <motion.button
                key={p.id}
                onClick={() => open(i)}
                aria-label={`Open photo: ${p.caption || "photo"}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.36), ease: EASE }}
                whileHover={{ rotate: 0, y: -8, scale: 1.03 }}
                style={{ rotate: TILTS[i % TILTS.length] }}
                className="group relative w-[min(62vw,280px)] shrink-0 rounded-sm bg-white p-3 pb-4 text-left shadow-[0_22px_45px_-22px_rgb(67_38_58/0.5)] transition-shadow duration-300 hover:shadow-[0_34px_60px_-22px_rgb(176_48_82/0.55)] md:w-[290px]"
              >
                <span aria-hidden className="tape -top-3 left-1/2 z-5 -translate-x-1/2 -rotate-3" />
                <span className="relative block overflow-hidden rounded-[2px] bg-rosemist/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={(el) => {
                      imgRefs.current[i] = el;
                    }}
                    src={`/api/photos/${p.id}/raw`}
                    alt={p.caption || "a photo of us"}
                    loading={i < 4 ? "eager" : "lazy"}
                    className="aspect-[4/5] w-full object-cover transition-opacity duration-150"
                    style={{ opacity: opened?.index === i ? 0 : 1 }}
                  />
                  {/* lifted-out slot */}
                  {opened?.index === i && <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#FBE9EE_0_8px,#F6DCE2_8px_16px)]" />}
                  {/* hint */}
                  <span className="pointer-events-none absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                    <span className="icon-[lucide--play] ml-0.5 size-3.5" />
                  </span>
                </span>
                <span className="wrap mt-3 line-clamp-2 block text-center font-hand text-xl leading-snug text-ink" data-multiline>
                  {p.caption || "us"}
                </span>
              </motion.button>
            ))}
          </motion.div>

          {/* progress instead of arrows */}
          <div className="mx-auto mt-6 flex w-[min(80vw,320px)] items-center gap-3" aria-hidden>
            <span className="w-12 text-right text-[12px] font-bold tracking-[0.2em] text-inksoft/70 tabular-nums">
              {String(active + 1).padStart(2, "0")}
            </span>
            <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-line">
              <motion.span
                style={{ scaleX: barScale }}
                className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-rose to-gold"
              />
            </span>
            <span className="w-12 text-[12px] font-bold tracking-[0.2em] text-inksoft/70 tabular-nums">
              {String(photos.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {opened && (
          <Cinema
            key={photos[opened.index].id}
            photo={photos[opened.index]}
            from={opened.from}
            aspect={opened.aspect}
            sourceRect={() => {
              const r = imgRefs.current[opened.index]?.getBoundingClientRect();
              return r ? { top: r.top, left: r.left, width: r.width, height: r.height } : opened.from;
            }}
            onClosed={() => setOpened(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ viewer */

function fitRect(aspect: number): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // fill the screen on phones; on wide screens fill the height (backdrop fills the sides)
  let width = vw;
  let height = vw / aspect;
  if (height > vh) {
    height = vh;
    width = vh * aspect;
  }
  if (vw / vh < 0.9) {
    // portrait phone: cover the whole screen for a true fullscreen feel
    width = vw;
    height = vh;
  }
  return { top: (vh - height) / 2, left: (vw - width) / 2, width, height };
}

function Cinema({
  photo,
  from,
  aspect,
  sourceRect,
  onClosed,
}: {
  photo: PhotoMeta;
  from: Rect;
  aspect: number;
  sourceRect: () => Rect;
  onClosed: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"in" | "shown" | "out">("in");
  const [videoOn, setVideoOn] = useState(false);
  // the clip may have finished rendering after this page loaded — always try it,
  // and only fall back to a CSS Ken Burns if it really isn't there (404)
  const [noVideo, setNoVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useRef(false);

  const top = useMotionValue(from.top);
  const left = useMotionValue(from.left);
  const width = useMotionValue(from.width);
  const height = useMotionValue(from.height);
  const radius = useMotionValue(3);
  const shade = useMotionValue(0);

  useEffect(() => {
    setMounted(true);
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden"; // the page stays put underneath
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  // zoom in
  useEffect(() => {
    if (!mounted) return;
    const to = fitRect(aspect);
    const t = reduced.current ? { duration: 0 } : { duration: 0.75, ease: EASE };
    void animate(shade, 1, { duration: reduced.current ? 0 : 0.5 });
    void animate(radius, 0, t);
    void animate(top, to.top, t);
    void animate(left, to.left, t);
    void animate(width, to.width, t);
    void animate(height, to.height, t).then(() => {
      setPhase("shown");
      if (reduced.current) return;
      const v = videoRef.current;
      if (!v) return setNoVideo(true);
      void v.play().catch(() => setNoVideo(true));
    });
  }, [mounted, aspect, top, left, width, height, radius, shade]);

  const close = useCallback(() => {
    if (phase === "out") return;
    setPhase("out");
    setVideoOn(false);
    videoRef.current?.pause();
    const to = sourceRect();
    const t = reduced.current ? { duration: 0 } : { duration: 0.6, ease: EASE };
    void animate(shade, 0, { duration: reduced.current ? 0 : 0.45 });
    void animate(radius, 3, t);
    void animate(top, to.top, t);
    void animate(left, to.left, t);
    void animate(width, to.width, t);
    void animate(height, to.height, t).then(onClosed);
  }, [phase, sourceRect, onClosed, top, left, width, height, radius, shade]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  if (!mounted) return null;
  const src = `/api/photos/${photo.id}/raw`;

  return createPortal(
    <div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-label={photo.caption || "Photo"} onClick={close}>
      {/* backdrop: dusk + blurred echo of the photo */}
      <motion.div style={{ opacity: shade }} className="absolute inset-0 bg-dusk0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-55 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(28_15_34/0.75)_100%)]" />
      </motion.div>

      {/* the photo, flying from its frame to fullscreen — then it becomes a film */}
      <motion.div
        style={{ top, left, width, height, borderRadius: radius }}
        className="absolute overflow-hidden shadow-[0_40px_120px_-20px_rgb(0_0_0/0.7)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          src={src}
          alt={photo.caption || "a photo of us"}
          className="absolute inset-0 size-full object-cover"
          // no clip yet (still rendering) → gentle Ken Burns so it still feels alive
          animate={noVideo && phase === "shown" && !reduced.current ? { scale: 1.12 } : { scale: 1 }}
          transition={{ duration: 7, ease: "easeInOut" }}
        />
        {!noVideo && (
          <video
            ref={videoRef}
            src={`/api/photos/${photo.id}/video`}
            muted
            playsInline
            preload="auto"
            onPlaying={() => setVideoOn(true)}
            onError={() => setNoVideo(true)}
            className="absolute inset-0 size-full object-cover transition-opacity duration-500"
            style={{ opacity: videoOn ? 1 : 0 }}
          />
        )}
        {/* cinematic dressing */}
        <motion.div
          animate={{ opacity: phase === "shown" ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.45)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <Sparkles />
        </motion.div>
      </motion.div>

      {/* caption + hint */}
      <AnimatePresence>
        {phase === "shown" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center"
          >
            <BlurText
              text={photo.caption || "us"}
              trigger="load"
              animateBy="words"
              direction="bottom"
              delay={90}
              className="wrap justify-center font-hand text-4xl leading-tight text-white drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)] md:text-5xl"
            />
            <p className="mt-4 text-[11px] font-bold tracking-[0.3em] text-white/60 uppercase">tap anywhere to close</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/** Soft sparkles drifting up through the film. */
function Sparkles() {
  const dots = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      left: `${(i * 61) % 100}%`,
      size: 3 + ((i * 7) % 5),
      delay: (i * 0.37) % 4,
      dur: 5 + ((i * 13) % 5),
      heart: i % 4 === 0,
    })),
  ).current;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {dots.map((d, i) =>
        d.heart ? (
          <motion.span
            key={i}
            className="icon-[lucide--heart] absolute bottom-0 text-rosesoft/80"
            style={{ left: d.left, width: d.size * 3, height: d.size * 3 }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: "-110vh", opacity: [0, 0.9, 0.9, 0], rotate: [0, 15, -10, 0] }}
            transition={{ duration: d.dur + 2, delay: d.delay, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <motion.span
            key={i}
            className="absolute bottom-0 rounded-full bg-[#FFE3B0] shadow-[0_0_8px_#FFD9A0]"
            style={{ left: d.left, width: d.size, height: d.size }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: "-110vh", opacity: [0, 1, 1, 0] }}
            transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "linear" }}
          />
        ),
      )}
    </div>
  );
}
