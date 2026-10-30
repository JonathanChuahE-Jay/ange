"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Smooth, inertial wheel scrolling for the public site (Lenis).
 *
 * - Touch keeps native momentum scrolling (syncTouch off) — it already feels right.
 * - Skipped entirely for prefers-reduced-motion.
 * - `<a href="#section">` links (dock, "scroll for your surprises") glide there.
 * - Pauses automatically while anything locks page scroll: the photo viewer sets
 *   html overflow:hidden; Radix dialogs (prize wheel) set body[data-scroll-locked].
 * - Inner scroll areas opt out with data-lenis-prevent (e.g. the WhatsApp chat).
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.09, // lower = floatier; 0.09 is smooth but still responsive
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      allowNestedScroll: true,
      autoRaf: true,
    });

    // pause while the page is scroll-locked by an overlay
    const html = document.documentElement;
    const body = document.body;
    const sync = () => {
      const locked = html.style.overflow === "hidden" || body.hasAttribute("data-scroll-locked");
      if (locked) lenis.stop();
      else lenis.start();
    };
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ["style"] });
    mo.observe(body, { attributes: true, attributeFilter: ["data-scroll-locked", "style"] });
    sync();

    return () => {
      mo.disconnect();
      lenis.destroy();
    };
  }, []);

  return null;
}
