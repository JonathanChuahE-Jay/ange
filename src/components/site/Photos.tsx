"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PhotoMeta } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { SectionHeading } from "./SectionHeading";

const TILTS = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-3", "-rotate-3", "rotate-1"];

/** Photos — a slidable polaroid strip (scroll-snap + arrows). Mount reveal:
 *  grid-reveal/grid-blur; hover: cards/image-zoom + shadow-rise straighten;
 *  lightbox: modals/spring-pop. */
export function Photos({ photos }: { photos: PhotoMeta[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setOpenIdx((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setOpenIdx((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIdx, photos.length]);

  return (
    <section id="photos" className="relative scroll-mt-20 overflow-x-clip py-24">
      <div className="mx-auto w-full max-w-6xl px-5">
        <SectionHeading
          kicker="freeze-framed feelings"
          title="Your photos"
          icon="i-lucide-camera"
          note="swipe through the wall"
        />
      </div>

      {photos.length === 0 ? (
        <div className="mx-auto mt-14 flex max-w-md flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-white/70 px-8 py-12 text-center">
          <span className="i-lucide-camera size-8 text-rose/60" aria-hidden />
          <p className="text-inksoft">No photos yet — hang the first memory in the admin panel</p>
        </div>
      ) : (
        <div className="relative mt-14">
          <div
            ref={scroller}
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1.25rem,calc(50vw-36rem))] pb-8 pt-6 md:gap-8"
          >
            {photos.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, filter: "blur(12px)", scale: 0.98 }}
                whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.42,
                  delay: Math.min(i * 0.05, 0.3),
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                onClick={() => setOpenIdx(i)}
                aria-label={`Open photo: ${p.caption || "photo"}`}
                className={`shadow-rise group relative w-[68vw] max-w-[300px] shrink-0 snap-center rounded-sm bg-white p-3 pb-4 transition-transform duration-300 hover:rotate-0 md:w-[300px] md:p-3.5 md:pb-4 ${TILTS[i % TILTS.length]}`}
              >
                <span aria-hidden className="tape -top-3 left-1/2 z-5 -translate-x-1/2 -rotate-3" />
                <span className="img-zoom-frame block overflow-hidden rounded-[2px] bg-rosemist/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/photos/${p.id}/raw`}
                    alt={p.caption || "a photo of us"}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </span>
                <span
                  className="wrap mt-3 block text-center font-hand text-xl leading-snug text-ink line-clamp-2"
                  data-multiline
                >
                  {p.caption || "us"}
                </span>
              </motion.button>
            ))}
          </div>

          {/* arrows */}
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Previous photos"
            className="tap-spring absolute top-[45%] left-3 z-10 flex size-11 items-center justify-center rounded-full border border-line bg-white/90 text-rose shadow-lg backdrop-blur transition-transform hover:scale-110"
          >
            <span className="i-lucide-chevron-left size-5" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Next photos"
            className="tap-spring absolute top-[45%] right-3 z-10 flex size-11 items-center justify-center rounded-full border border-line bg-white/90 text-rose shadow-lg backdrop-blur transition-transform hover:scale-110"
          >
            <span className="i-lucide-chevron-right size-5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {openIdx !== null && photos[openIdx] && (
          <Lightbox
            photo={photos[openIdx]}
            hasPrev={photos.length > 1}
            hasNext={photos.length > 1}
            onPrev={() => setOpenIdx((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))}
            onNext={() => setOpenIdx((i) => (i === null ? i : (i + 1) % photos.length))}
            onClose={() => setOpenIdx(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function Lightbox({
  photo,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: {
  photo: PhotoMeta;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="img-zoom-frame overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/${photo.id}/raw`}
            alt={photo.caption || "a photo of us"}
            className="max-h-[70vh] w-full object-contain"
          />
        </div>
        {photo.caption && (
          <p className="wrap text-center font-hand text-2xl text-ink" data-multiline>
            {photo.caption}
          </p>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous photo"
            className="tap-spring flex size-11 items-center justify-center rounded-full bg-rosemist text-rose disabled:opacity-30"
          >
            <span className="i-lucide-chevron-left size-5" />
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-inksoft hover:text-rose">
            close
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next photo"
            className="tap-spring flex size-11 items-center justify-center rounded-full bg-rosemist text-rose disabled:opacity-30"
          >
            <span className="i-lucide-chevron-right size-5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
