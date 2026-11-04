import { desc, sql } from "drizzle-orm";
import { db, ensureSeed } from "./db";
import * as t from "./schema";
import type { SiteContent } from "./types";
import { ensurePhotoVideos } from "./photoVideo";
import { parseHeadings, type Headings } from "./headings";

/** Strip emoji / pictographs (the public page is emoji-free by design). */
const EMOJI_RE =
  /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
export function noEmoji(s: string): string {
  return s.replace(EMOJI_RE, "").replace(/[ \t]{2,}/g, " ").replace(/ +([.,!?…])/g, "$1").trim();
}

/** Load everything the public page needs (photos as metadata only).
 *  `raw: true` (admin) skips emoji stripping so edits round-trip. */
export function getSiteContent({ raw = false }: { raw?: boolean } = {}): SiteContent {
  const c = loadContent();
  if (raw) return c;
  const n = noEmoji;
  return {
    ...c,
    settings: {
      ...c.settings,
      askerName: n(c.settings.askerName),
      partnerName: n(c.settings.partnerName),
      question: n(c.settings.question),
      questionSubtext: n(c.settings.questionSubtext),
      yesResponse: n(c.settings.yesResponse),
      countdownTitle: n(c.settings.countdownTitle),
      letterTitle: n(c.settings.letterTitle),
      letterBody: c.settings.letterBody.replace(EMOJI_RE, ""),
      letterSignoff: n(c.settings.letterSignoff),
      headings: Object.fromEntries(
        Object.entries(c.settings.headings).map(([k, h]) => [k, { kicker: n(h.kicker), title: n(h.title), note: n(h.note) }]),
      ) as Headings,
    },
    timeline: c.timeline.map((e) => ({ ...e, emoji: "", date: n(e.date), title: n(e.title), description: n(e.description) })),
    photos: c.photos.map((p) => ({ ...p, caption: n(p.caption) })),
    chats: c.chats.map((x) => ({ ...x, text: n(x.text) })),
    loves: c.loves.map((l) => ({ ...l, emoji: "", text: n(l.text) })),
    quiz: c.quiz.map((q) => ({ ...q, question: n(q.question), options: q.options.map(n) })),
    tracks: c.tracks.map((x) => ({ ...x, title: n(x.title), artist: n(x.artist) })),
  };
}

/** Only the lock-screen heading — safe to send before the gate opens. */
export function getGateHeading() {
  ensureSeed();
  const row = db.select({ headings: t.settings.headings }).from(t.settings).limit(1).all()[0];
  const h = parseHeadings(row?.headings).gate;
  return { kicker: noEmoji(h.kicker), title: noEmoji(h.title), note: noEmoji(h.note) };
}

function loadContent(): SiteContent {
  ensureSeed();

  const settingsRow = db.select().from(t.settings).limit(1).all()[0];
  const timeline = db
    .select()
    .from(t.timelineEvents)
    .orderBy(t.timelineEvents.position)
    .all();
  // metadata only — never load image/video blobs for the page
  const photoRows = db
    .select({ id: t.photos.id, caption: t.photos.caption, hasVideo: sql<number>`${t.photos.video} IS NOT NULL`, videoSource: t.photos.videoSource })
    .from(t.photos)
    .orderBy(t.photos.position)
    .all();
  ensurePhotoVideos(); // backfill clips for photos that predate this feature
  const chats = db.select().from(t.chatQuotes).orderBy(t.chatQuotes.position).all();
  const loveRows = db.select().from(t.loves).orderBy(t.loves.position).all();
  const quizRows = db.select().from(t.quizQuestions).orderBy(t.quizQuestions.position).all();
  const trackRows = db.select().from(t.tracks).orderBy(t.tracks.position).all();
  const answerRows = db.select().from(t.answers).orderBy(desc(t.answers.createdAt)).limit(1).all();

  return {
    settings: {
      askerName: settingsRow?.askerName ?? "Me",
      partnerName: settingsRow?.partnerName ?? "You",
      question: settingsRow?.question ?? "Would you be my date?",
      questionSubtext: settingsRow?.questionSubtext ?? "",
      yesResponse: settingsRow?.yesResponse ?? "",
      noIsDodger: (settingsRow?.noIsDodger ?? 1) === 1,
      anniversaryDate: settingsRow?.anniversaryDate ?? "",
      countdownTitle: settingsRow?.countdownTitle ?? "",
      countdownTarget: settingsRow?.countdownTarget ?? null,
      letterTitle: settingsRow?.letterTitle ?? "",
      letterBody: settingsRow?.letterBody ?? "",
      letterSignoff: settingsRow?.letterSignoff ?? "",
      headings: parseHeadings(settingsRow?.headings),
    },
    timeline: timeline.map((e) => ({
      id: e.id, date: e.date, title: e.title, description: e.description,
      emoji: e.emoji, position: e.position,
    })),
    photos: photoRows.map((p) => ({ id: p.id, caption: p.caption, hasVideo: Boolean(p.hasVideo),
      videoSource: p.videoSource === "user" ? "user" : p.videoSource === "auto" ? "auto" : null })),
    chats: chats.map((c) => ({
      id: c.id, side: c.side === "partner" ? "partner" : "me",
      text: c.text, timeLabel: c.timeLabel, delayMs: c.delayMs, position: c.position,
    })),
    loves: loveRows.map((l) => ({ id: l.id, emoji: l.emoji, text: l.text })),
    quiz: quizRows.map((q) => {
      let options: string[] = [];
      try {
        const parsed: unknown = JSON.parse(q.options);
        if (Array.isArray(parsed)) options = parsed.map(String);
      } catch {
        options = [];
      }
      return { id: q.id, question: q.question, options, answerIndex: q.answerIndex };
    }).filter((q) => q.options.length >= 2),
    tracks: trackRows.map((s) => ({ id: s.id, title: s.title, artist: s.artist })),
    answeredYesAt: answerRows[0]?.answer === "yes" ? answerRows[0].createdAt : null,
  };
}
