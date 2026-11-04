/** Editable section headings (kicker / title / note) — shared by server + client. */

export type Heading = { kicker: string; title: string; note: string };

export const HEADING_SECTIONS = [
  { key: "gate", label: "Secret door (lock screen)" },
  { key: "timeline", label: "Timeline" },
  { key: "photos", label: "Photos" },
  { key: "chats", label: "Chats" },
  { key: "letter", label: "Love letter" },
  { key: "loves", label: "Things you love" },
  { key: "games", label: "Games" },
  { key: "countdown", label: "Countdown" },
] as const;

export type HeadingKey = (typeof HEADING_SECTIONS)[number]["key"];
export type Headings = Record<HeadingKey, Heading>;

export const DEFAULT_HEADINGS: Headings = {
  gate: { kicker: "a secret door", title: "When did we become us?", note: "the day it all started" },
  timeline: { kicker: "chapter by chapter", title: "Your timeline", note: "every chapter has you in it" },
  photos: { kicker: "freeze-framed feelings", title: "Your photos", note: "keep scrolling · tap one to relive it" },
  chats: { kicker: "exhibit A, your honor", title: "What your chats say", note: "the receipts" },
  letter: { kicker: "sealed with a kiss", title: "A love letter", note: "from my heart to yours" },
  loves: { kicker: "the little things", title: "Things you love", note: "collect them all" },
  // empty note → each game's own blurb is shown
  games: { kicker: "play with me", title: "Little games", note: "" },
  countdown: { kicker: "tick tock", title: "A countdown", note: "" },
};

/** Parse the stored JSON, filling anything missing with defaults. */
export function parseHeadings(raw: string | null | undefined): Headings {
  let stored: Record<string, Partial<Heading>> = {};
  try {
    const v: unknown = JSON.parse(raw || "{}");
    if (v && typeof v === "object") stored = v as Record<string, Partial<Heading>>;
  } catch {
    stored = {};
  }
  const out = {} as Headings;
  for (const { key } of HEADING_SECTIONS) {
    const d = DEFAULT_HEADINGS[key];
    const s = stored[key] ?? {};
    out[key] = {
      kicker: typeof s.kicker === "string" ? s.kicker : d.kicker,
      title: typeof s.title === "string" && s.title.trim() ? s.title : d.title,
      note: typeof s.note === "string" ? s.note : d.note,
    };
  }
  return out;
}
