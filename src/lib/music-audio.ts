"use client";

/**
 * One shared <audio> element for the site's music.
 *
 * Browsers only allow sound after a user gesture, and iOS Safari ties that
 * permission to the ELEMENT that played during the gesture. The date gate's
 * "Open the door" tap calls primeMusic(), which plays a silent clip on this
 * element inside the gesture; the music player later reuses the same element,
 * so the song can start by itself once the site opens.
 */
let el: HTMLAudioElement | null = null;

// 0-length silent WAV
const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export function getMusicAudio(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = "none";
  }
  return el;
}

/** Call synchronously inside a user gesture (click/submit) to allow autoplay later. */
export function primeMusic() {
  if (typeof window === "undefined") return;
  const a = getMusicAudio();
  if (a.src && !a.src.startsWith("data:")) return; // real music already loaded
  a.src = SILENT;
  void a.play().catch(() => {});
}
