"use client";

import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "question", label: "Question", emoji: "💌" },
  { id: "timeline", label: "Timeline", emoji: "🕰️" },
  { id: "photos", label: "Photos", emoji: "📷" },
  { id: "chats", label: "Chats", emoji: "💬" },
  { id: "letter", label: "Letter", emoji: "✉️" },
  { id: "loves", label: "Loves", emoji: "💗" },
  { id: "countdown", label: "Countdown", emoji: "⏳" },
  { id: "wheel", label: "Prizes", emoji: "🎁" },
];

/**
 * Floating nav — spec: hide-on-scroll/scale-down (shrinks + fades scrolling
 * down past 10px, springs back on scroll up), active tracking via
 * IntersectionObserver.
 */
export function DotNav() {
  const [active, setActive] = useState("question");
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 10 && y > lastY.current + 4) setHidden(true);
      else if (y < lastY.current - 4 || y <= 10) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* desktop: right-side dots */}
      <nav
        aria-label="Sections"
        className="fixed top-1/2 right-6 z-50 hidden -translate-y-1/2 flex-col gap-3 transition-all duration-200 lg:flex"
        style={{
          transform: `translateY(-50%) scale(${hidden ? 0.88 : 1})`,
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? "none" : "auto",
        }}
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-label={s.label}
            aria-current={active === s.id ? "true" : undefined}
            className="group relative flex size-10 items-center justify-center"
          >
            <span
              className={`rounded-full transition-all duration-300 ${
                active === s.id
                  ? "size-3.5 bg-rose shadow-md ring-4 ring-rosemist"
                  : "size-2.5 bg-ink/25 group-hover:bg-rose/70"
              }`}
            />
            <span className="pointer-events-none absolute right-full mr-2 rounded-full bg-ink px-3 py-1 text-[12px] font-semibold whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {s.emoji} {s.label}
            </span>
          </a>
        ))}
      </nav>

      {/* mobile: bottom emoji bar */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 lg:hidden"
        style={{
          transform: `scale(${hidden ? 0.88 : 1})`,
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? "none" : "auto",
          transition: "transform 200ms cubic-bezier(0.4,0,1,1), opacity 200ms cubic-bezier(0.4,0,1,1)",
        }}
      >
        <div
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/40 bg-ink/85 px-2 py-2 shadow-2xl backdrop-blur-md"
          style={{ scrollbarWidth: "none" }}
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-label={s.label}
              aria-current={active === s.id ? "true" : undefined}
              className={`flex size-10 min-w-10 shrink-0 items-center justify-center rounded-full text-lg transition-all duration-300 ${
                active === s.id ? "bg-rose/90 shadow-md" : ""
              }`}
            >
              <span aria-hidden>{s.emoji}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
