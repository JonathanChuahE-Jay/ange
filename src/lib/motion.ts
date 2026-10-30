/**
 * Motion tokens — the single source for durations and curves.
 * Specs: see the Motion section of DESIGN.md; each entry implements its spec
 * via these tokens so no call site invents numbers.
 */

export const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;      // "unnamed ease-out" default
export const EASE_SETTLE = [0.34, 1.3, 0.64, 1] as const;      // circle-drop in
export const EASE_LEAVE = [0.5, 0, 0.75, 0] as const;          // circle-drop out
export const EASE_IN_OUT_ACCEL = [0.55, 0, 0.9, 0.45] as const;// flip upper flap
export const EASE_FLAP_IN = [0.1, 0.55, 0.45, 1] as const;     // flip lower flap
export const EASE_EXIT = [0.4, 0, 1, 1] as const;              // generic exit
export const EASE_SMOOTH = [0.25, 0.46, 0.45, 0.94] as const;  // grid-blur / image-zoom
export const EASE_BOUNCE_IN = [0.34, 1.56, 0.64, 1] as const;  // overshoot (no spring lib)
export const EASE_SPRINGY = [0.34, 1.8, 0.64, 1] as const;     // bouncy-spring fallback
export const EASE_GLIDE = [0.22, 1, 0.36, 1] as const;         // blur-cover / wipe

// Springs (motion library)
export const SPRING_POP = { type: "spring", stiffness: 500, damping: 32 } as const;
export const SPRING_BOUNCY = { type: "spring", stiffness: 500, damping: 22 } as const;
export const SPRING_NAV = { type: "spring", stiffness: 400, damping: 15 } as const;
export const SPRING_BACK = { type: "spring", stiffness: 380, damping: 30 } as const;
export const SPRING_DODGE = { type: "spring", stiffness: 300, damping: 20 } as const;

// Durations (ms)
export const D = {
  fast: 120,
  base: 200,
  wipe: 300,
  pop: 260,
  modalIn: 250,
  flip: 150,
  gridBlur: 420,
  imageZoom: 400,
  circleDrop: 380,
  bounceIn: 500,
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
