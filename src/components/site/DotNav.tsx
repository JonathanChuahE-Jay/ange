"use client";

import { useEffect, useRef, useState } from "react";
import { FloatingDock, type DockItem } from "@/components/kit/floating-dock";

const SECTIONS: DockItem[] = [
  { id: "question", title: "Question", icon: "icon-[lucide--heart]" },
  { id: "timeline", title: "Timeline", icon: "icon-[lucide--book-heart]" },
  { id: "photos", title: "Photos", icon: "icon-[lucide--camera]" },
  { id: "chats", title: "Chats", icon: "icon-[lucide--message-circle-heart]" },
  { id: "letter", title: "Letter", icon: "icon-[lucide--mail]" },
  { id: "loves", title: "Loves", icon: "icon-[lucide--sparkles]" },
  { id: "games", title: "Games", icon: "icon-[lucide--gamepad-2]" },
  { id: "countdown", title: "Countdown", icon: "icon-[lucide--timer]" },
  { id: "wheel", title: "Prizes", icon: "icon-[lucide--gift]" },
];

/**
 * Section nav — Aceternity floating dock (magnifies on hover, desktop) /
 * compact icon bar (mobile). Hides while scrolling down, returns on scroll up;
 * active section tracked via IntersectionObserver.
 */
export function DotNav() {
  const [active, setActive] = useState("question");
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
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

  return <FloatingDock items={SECTIONS} active={active} hidden={hidden} />;
}
