"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PhotoMeta } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/kit/dialog";
import BlurText from "@/components/kit/BlurText";
import { CardBody, CardContainer, CardItem } from "@/components/kit/3d-card";
import { SectionHeading } from "./SectionHeading";

const TILTS = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-3", "-rotate-3", "rotate-1"];

/** Photos — a slidable polaroid strip (scroll-snap + arrows). Mount reveal:
 *  grid-reveal/grid-blur; hover: cards/image-zoom + shadow-rise straighten;
 *  lightbox: modals/spring-pop. */
export function Photos({ photos }: { photos: PhotoMeta[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  // +1 = going forward (new photo enters from the right), -1 = backward
  const [dir, setDir] = useState<1 | -1>(1);
  const go = (d: 1 | -1) => {
    setDir(d);
    setOpenIdx((i) => (i === null ? i : (i + d + photos.length) % photos.length));
  };
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
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
          icon="icon-[lucide--camera]"
          note="swipe through the wall"
        />
      </div>

      {photos.length === 0 ? (
        <div className="mx-auto mt-14 flex max-w-md flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-white/70 px-8 py-12 text-center">
          <span className="icon-[lucide--camera] size-8 text-rose/60" aria-hidden />
          <p className="text-inksoft">No photos yet — hang the first memory in the admin panel</p>
        </div>
      ) : (
        <div className="relative mt-14">
          <div
            ref={scroller}
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1.25rem,calc(50vw-36rem))] pb-8 pt-6 md:gap-8"
          >
            {photos.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, filter: "blur(12px)", scale: 0.98 }}
                whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.42,
                  delay: Math.min(i * 0.05, 0.3),
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className={`w-[68vw] max-w-[300px] shrink-0 snap-center transition-transform duration-300 hover:rotate-0 md:w-[300px] ${TILTS[i % TILTS.length]}`}
              >
                {/* Aceternity 3D card: the photo and caption float at different depths */}
                <CardContainer containerClassName="py-0" className="w-full">
                  <CardBody className="h-auto w-full">
                    <button
                      onClick={() => setOpenIdx(i)}
                      aria-label={`Open photo: ${p.caption || "photo"}`}
                      className="group/card relative block w-full rounded-sm bg-white p-3 pb-4 shadow-[0_20px_40px_-20px_rgb(67_38_58/0.45)] transition-shadow duration-300 hover:shadow-[0_30px_60px_-20px_rgb(176_48_82/0.5)] md:p-3.5 md:pb-4"
                    >
                      <span aria-hidden className="tape -top-3 left-1/2 z-5 -translate-x-1/2 -rotate-3" />
                      <CardItem translateZ={50} className="w-full">
                        <span className="img-zoom-frame block overflow-hidden rounded-[2px] bg-rosemist/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/photos/${p.id}/raw`}
                            alt={p.caption || "a photo of us"}
                            loading="lazy"
                            className="aspect-[4/5] w-full object-cover"
                          />
                        </span>
                      </CardItem>
                      <CardItem translateZ={30} className="w-full">
                        <span
                          className="wrap mt-3 line-clamp-2 block text-center font-hand text-xl leading-snug text-ink"
                          data-multiline
                        >
                          {p.caption || "us"}
                        </span>
                      </CardItem>
                    </button>
                  </CardBody>
                </CardContainer>
              </motion.div>
            ))}
          </div>

          {/* arrows */}
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Previous photos"
            className="absolute top-[45%] left-3 z-10 flex size-11 items-center justify-center rounded-full border border-line bg-white/90 text-rose shadow-lg backdrop-blur transition-colors hover:bg-rose hover:text-white"
          >
            <span className="icon-[lucide--chevron-left] size-5" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Next photos"
            className="absolute top-[45%] right-3 z-10 flex size-11 items-center justify-center rounded-full border border-line bg-white/90 text-rose shadow-lg backdrop-blur transition-colors hover:bg-rose hover:text-white"
          >
            <span className="icon-[lucide--chevron-right] size-5" />
          </button>
        </div>
      )}

      <Dialog open={openIdx !== null} onOpenChange={(o) => !o && setOpenIdx(null)}>
        {openIdx !== null && photos[openIdx] && (
          <Lightbox
            photo={photos[openIdx]}
            index={openIdx}
            total={photos.length}
            hasPrev={photos.length > 1}
            hasNext={photos.length > 1}
            dir={dir}
            onPrev={() => go(-1)}
            onNext={() => go(1)}
            onClose={() => setOpenIdx(null)}
          />
        )}
      </Dialog>
    </section>
  );
}

const SLIDE = {
  enter: (d: 1 | -1) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0.4 }),
  center: { x: "0%", opacity: 1 },
  exit: (d: 1 | -1) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0.4 }),
};

function Lightbox({
  photo,
  index,
  total,
  dir,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: {
  photo: PhotoMeta;
  index: number;
  total: number;
  dir: 1 | -1;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <DialogContent
      showCloseButton={false}
      className="max-w-2xl gap-0 rounded-3xl border-line bg-bg p-5 sm:max-w-2xl md:p-6"
    >
      <DialogTitle className="sr-only">{photo.caption || "Photo"}</DialogTitle>
      <DialogDescription className="sr-only">Use the arrows to browse photos</DialogDescription>

      {/* fixed-size stage so nothing below it ever shifts between photos */}
      <div className="relative h-[min(62vh,560px)] overflow-hidden rounded-2xl bg-rosemist/40">
        {/* carousel slide: the new photo pushes the old one out in the travel direction */}
        <AnimatePresence initial={false} custom={dir}>
          <motion.img
            key={photo.id}
            custom={dir}
            variants={SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 320, damping: 34 }, opacity: { duration: 0.2 } }}
            src={`/api/photos/${photo.id}/raw`}
            alt={photo.caption || "a photo of us"}
            className="absolute inset-0 size-full object-contain"
          />
        </AnimatePresence>
      </div>

      {/* caption: letters blur in one by one (React Bits BlurText) */}
      <div className="flex h-16 items-center justify-center overflow-hidden">
        <BlurText
          key={photo.id}
          text={photo.caption || "us"}
          trigger="load"
          animateBy="letters"
          effect="focus"
          direction="bottom"
          delay={18}
          className="justify-center text-center font-hand text-2xl text-ink"
        />
      </div>

      {/* static controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous photo"
          className="flex size-11 items-center justify-center rounded-full bg-rosemist text-rose transition-colors hover:bg-rose hover:text-white disabled:opacity-30"
        >
          <span className="icon-[lucide--chevron-left] size-5" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-bold tracking-[0.25em] text-inksoft/70 tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <button onClick={onClose} className="text-sm font-semibold text-inksoft hover:text-rose">
            close
          </button>
        </div>
        <button
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next photo"
          className="flex size-11 items-center justify-center rounded-full bg-rosemist text-rose transition-colors hover:bg-rose hover:text-white disabled:opacity-30"
        >
          <span className="icon-[lucide--chevron-right] size-5" />
        </button>
      </div>
    </DialogContent>
  );
}
