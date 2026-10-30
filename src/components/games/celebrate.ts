const HEART =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";

/** Heart confetti burst (lazy-loads canvas-confetti). */
export function celebrate(origin = { x: 0.5, y: 0.6 }) {
  void import("canvas-confetti").then(({ default: confetti }) => {
    const heart = confetti.shapeFromPath({ path: HEART });
    confetti({
      particleCount: 70,
      spread: 80,
      origin,
      shapes: [heart, "circle"],
      scalar: 1.3,
      colors: ["#D64560", "#E8879C", "#F6DCE2", "#C9973F"],
    });
  });
}

export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** localStorage best score helpers (per-device; no PII). */
export function readBest(key: string): number | null {
  try {
    const v = window.localStorage.getItem(`ange-best:${key}`);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

export function writeBest(key: string, value: number) {
  try {
    window.localStorage.setItem(`ange-best:${key}`, String(value));
  } catch {
    // private mode — ignore
  }
}
