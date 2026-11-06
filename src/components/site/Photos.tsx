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

type Rect = { top: number; left: number; width: number; height: number; rotate: number };

/**
 * The thumbnail's TRUE geometry. Its polaroid is tilted, so getBoundingClientRect
 * returns a larger axis-aligned box — instead take the untransformed size, the
 * card's live rotation/scale, and the (rotation-invariant) centre.
 */
function measureThumb(img: HTMLImageElement): Rect {
  const r = img.getBoundingClientRect();
  const card = img.closest("button");
  let rotate = 0;
  let scale = 1;
  const tf = card ? getComputedStyle(card).transform : "none";
  if (tf && tf !== "none") {
    const m = new DOMMatrixReadOnly(tf);
    rotate = (Math.atan2(m.b, m.a) * 180) / Math.PI;
    scale = Math.hypot(m.a, m.b);
  }
  const width = img.offsetWidth * scale;
  const height = img.offsetHeight * scale;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  return { top: cy - height / 2, left: cx - width / 2, width, height, rotate };
}
type Opened = { index: number; from: Rect; aspect: number };

/**
 * Photos — a pinned polaroid strip that glides sideways as you scroll down the
 * page (no arrows). Tapping a photo lifts it out of its frame and zooms it to
 * fit the screen (never cropped or zoomed); an uploaded video plays there.
 */
export function Photos({ photos }: { photos: PhotoMeta[] }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [distance, setDistance] = useState(0);
  const [vh, setVh] = useState(800);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [active, setActive] = useState(0);

  // how far the track must travel = its overflow beyond the viewport
  useLayoutEffect(() => {
    const track = trackRef.current;
    const panel = panelRef.current;
    if (!track || !panel) return;
    const measure = () => {
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
      // the sticky panel is 100svh tall — a STABLE height. window.innerHeight
      // changes on phones as the address bar slides in/out, which resized this
      // whole scroller mid-swipe and made the page jump.
      setVh(panel.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(panel);
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
    const from = measureThumb(img);
    const aspect = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : from.width / from.height;
    setOpened({ index, from, aspect });
  }, []);

  if (photos.length === 0) {
    return (
      <section id="photos" className="relative scroll-mt-20 py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <SectionHeading section="photos" icon="icon-[lucide--camera]" showNote={false} />
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
        {/* safe center: on short screens overflow goes DOWN, so the heading never
            gets clipped / pushed up against the timeline above */}
        <div ref={panelRef} className="sticky top-0 flex h-[100svh] flex-col justify-[safe_center] overflow-hidden pt-14">
          <div className="mx-auto w-full max-w-6xl px-5">
            <SectionHeading section="photos" icon="icon-[lucide--camera]" />
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
                    className="aspect-[4/5] w-full object-cover"
                    style={{ opacity: opened?.index === i ? 0 : 1 }}
                  />
                  {/* lifted-out slot */}
                  {opened?.index === i && <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#FBE9EE_0_8px,#F6DCE2_8px_16px)]" />}
                  {/* hint */}
                  <span className="pointer-events-none absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 pointer-coarse:opacity-100">
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
              const img = imgRefs.current[opened.index];
              return img ? measureThumb(img) : opened.from;
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
  // show the whole photo at its true proportions — never crop or zoom it
  // (the blurred backdrop fills the leftover space)
  let width = vw;
  let height = vw / aspect;
  if (height > vh) {
    height = vh;
    width = vh * aspect;
  }
  return { top: (vh - height) / 2, left: (vw - width) / 2, width, height, rotate: 0 };
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
  // only a video you uploaded plays here; the auto-generated Ken Burns clip
  // zooms into the photo, so the viewer shows the still photo instead
  const [noVideo, setNoVideo] = useState(photo.videoSource !== "user");
  // the admin chooses per video whether it plays with sound
  const [muted, setMuted] = useState(!photo.videoSound);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useRef(false);

  const top = useMotionValue(from.top);
  const left = useMotionValue(from.left);
  const width = useMotionValue(from.width);
  const height = useMotionValue(from.height);
  const rotate = useMotionValue(from.rotate);
  const radius = useMotionValue(3);
  const shade = useMotionValue(0);
  // the big drop shadow fades with the backdrop so nothing pops when it lands
  const shadow = useTransform(shade, (s) => `0 40px 120px -20px rgb(0 0 0 / ${(0.7 * s).toFixed(3)})`);

  useEffect(() => {
    setMounted(true);
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    const prev = html.style.overflow;
    const prevGutter = html.style.scrollbarGutter;
    // keep the scrollbar's space while locked so the strip doesn't shift sideways
    // (and then jump back when the viewer closes)
    html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden"; // the page stays put underneath
    return () => {
      html.style.overflow = prev;
      html.style.scrollbarGutter = prevGutter;
    };
  }, []);

  // zoom in
  useEffect(() => {
    if (!mounted) return;
    const to = fitRect(aspect);
    const t = reduced.current ? { duration: 0 } : { duration: 0.75, ease: EASE };
    void animate(shade, 1, { duration: reduced.current ? 0 : 0.5 });
    void animate(radius, 0, t);
    void animate(rotate, 0, t);
    void animate(top, to.top, t);
    void animate(left, to.left, t);
    void animate(width, to.width, t);
    void animate(height, to.height, t).then(() => {
      setPhase("shown");
      if (reduced.current) return;
      const v = videoRef.current;
      if (!v) return setNoVideo(true);
      v.muted = !photo.videoSound;
      void v.play().catch(() => {
        // the browser blocked audio autoplay — play silently, the speaker button can unmute
        if (!v.muted) {
          v.muted = true;
          setMuted(true);
          void v.play().catch(() => setNoVideo(true));
        } else setNoVideo(true);
      });
    });
  }, [mounted, aspect, top, left, width, height, rotate, radius, shade, photo.videoSound]);

  const close = useCallback(() => {
    if (phase === "out") return;
    setPhase("out");
    setVideoOn(false);
    videoRef.current?.pause();
    const to = sourceRect();
    const t = reduced.current ? { duration: 0 } : { duration: 0.6, ease: EASE };
    void animate(shade, 0, { duration: reduced.current ? 0 : 0.45 });
    void animate(radius, 3, t);
    void animate(rotate, to.rotate, t);
    void animate(top, to.top, t);
    void animate(left, to.left, t);
    void animate(width, to.width, t);
    void animate(height, to.height, t).then(onClosed);
  }, [phase, sourceRect, onClosed, top, left, width, height, rotate, radius, shade]);

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
        style={{ top, left, width, height, rotate, borderRadius: radius, boxShadow: shadow }}
        className="absolute overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={photo.caption || "a photo of us"}
          className="absolute inset-0 size-full object-cover"
        />
        {!noVideo && (
          <video
            ref={videoRef}
            src={`/api/photos/${photo.id}/video`}
            poster={src}
            muted={muted}
            playsInline
            preload="auto"
            onPlaying={() => setVideoOn(true)}
            onError={() => setNoVideo(true)}
            className="absolute inset-0 size-full bg-black object-contain transition-opacity"
            // fade in gently; on close vanish fast so no black letterbox rides the flight home
            style={{ opacity: videoOn ? 1 : 0, transitionDuration: phase === "out" ? "150ms" : "500ms" }}
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

      {/* sound toggle — only for videos the admin set to play with sound */}
      {photo.videoSound && !noVideo && videoOn && phase === "shown" && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            const v = videoRef.current;
            if (!v) return;
            v.muted = !v.muted;
            setMuted(v.muted);
            if (v.paused) void v.play().catch(() => {});
          }}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
        >
          <span className={muted ? "icon-[lucide--volume-x] size-5" : "icon-[lucide--volume-2] size-5"} />
        </motion.button>
      )}

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
