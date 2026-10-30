"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import type { Settings } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const LetterScene = dynamic(() => import("./LetterScene"), { ssr: false });

/** WebGL error boundary → fall back to the CSS envelope. */
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** A love letter — a 3D envelope that opens on tap (CSS fallback), then the
 *  airmail letter. */
export function Letter({ settings }: { settings: Settings }) {
  const [open, setOpen] = useState(false);

  return (
    <section id="letter" className="relative scroll-mt-20 overflow-x-clip py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob size-80 bg-goldsoft/70 right-[-4rem] top-10" style={{ animationDuration: "15s" }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-5">
        <SectionHeading
          kicker="sealed with a kiss"
          title="A love letter"
          icon="i-lucide-mail"
          note="from my heart to yours"
        />

        <AnimatePresence mode="wait">
          {!open ? (
            <motion.div
              key="sealed"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -14 }}
              transition={{ duration: 0.35 }}
              className="mt-14 w-full max-w-md"
            >
              <SceneBoundary fallback={<CssEnvelope onOpen={() => setOpen(true)} />}>
                <LetterScene onOpened={() => setOpen(true)} />
              </SceneBoundary>
            </motion.div>
          ) : (
            <motion.article
              key="letter"
              initial={{ opacity: 0, y: 30, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-14 w-full max-w-xl"
            >
              {/* airmail striped frame */}
              <div
                className="rounded-lg p-[8px] shadow-2xl"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, #D64560 0 14px, #FFF8F3 14px 28px, #5B7DB1 28px 42px, #FFF8F3 42px 56px)",
                }}
              >
                <div className="relative rounded-[3px] bg-[#FFFBF0] p-7 md:p-11">
                  <span aria-hidden className="tape -top-3 left-1/2 z-5 -translate-x-1/2 rotate-2" />

                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[11px] font-bold tracking-[0.35em] text-gold uppercase">
                      Par Avion
                    </p>
                    <div className="flex rotate-3 flex-col items-center rounded-sm border-2 border-dashed border-gold/50 bg-white px-2.5 py-1.5">
                      <span className="i-lucide-heart size-4.5 fill-rose text-rose" aria-hidden />
                      <span className="text-[9px] font-bold tracking-[0.2em] text-gold">LOVE POST</span>
                    </div>
                  </div>

                  <h3 className="mt-5 font-display text-3xl text-ink">{settings.letterTitle}</h3>
                  <p
                    className="wrap mt-4 font-hand text-[1.55rem] leading-[1.7] text-ink/90 first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.9] first-letter:text-rose"
                    data-multiline
                  >
                    {settings.letterBody}
                  </p>

                  <div className="mt-8 flex items-end justify-between gap-4">
                    <svg width="120" height="18" viewBox="0 0 120 18" fill="none" aria-hidden className="text-gold">
                      <path
                        d="M2 12 C 25 4, 45 16, 66 9 S 100 8, 118 11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M104 5 l6 5 -7 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                    <p className="font-hand text-3xl text-rose">{settings.letterSignoff}</p>
                  </div>

                  <div className="absolute right-6 bottom-6 flex size-15 items-center justify-center rounded-full bg-rosedeep shadow-lg md:right-8 md:bottom-8">
                    <span className="i-lucide-heart size-6.5 fill-rosemist text-rosemist" aria-hidden />
                  </div>
                </div>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/** The no-WebGL fallback: the original CSS envelope. */
function CssEnvelope({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="tap-spring group relative w-full"
      aria-label="Open the letter"
    >
      <div className="relative aspect-[10/7] overflow-hidden rounded-2xl bg-gradient-to-br from-rose to-rosedeep shadow-2xl">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/2 bg-[#E8879C]"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-[#C74E68]"
          style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }}
        />
        <div aria-hidden className="absolute top-1/2 left-8 flex -translate-y-[130%] flex-col gap-2">
          <span className="h-0.5 w-24 rounded bg-white/60" />
          <span className="h-0.5 w-32 rounded bg-white/45" />
          <span className="h-0.5 w-28 rounded bg-white/35" />
        </div>
        <div className="absolute top-1/2 left-1/2 flex size-18 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink shadow-xl ring-4 ring-rosedeep/50">
          <span className="i-lucide-heart size-8 fill-rose text-rose" />
        </div>
      </div>
      <p className="mt-6 text-center font-hand text-2xl text-inksoft transition-colors group-hover:text-rose">
        tap to open
      </p>
    </button>
  );
}
