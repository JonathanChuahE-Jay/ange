import { desc } from "drizzle-orm";
import { db, ensureSeed } from "./db";
import * as t from "./schema";
import type { SiteContent } from "./types";

/** Load everything the public page needs (photos as metadata only). */
export function getSiteContent(): SiteContent {
  ensureSeed();

  const settingsRow = db.select().from(t.settings).limit(1).all()[0];
  const timeline = db
    .select()
    .from(t.timelineEvents)
    .orderBy(t.timelineEvents.position)
    .all();
  const photoRows = db.select().from(t.photos).orderBy(t.photos.position).all();
  const chats = db.select().from(t.chatQuotes).orderBy(t.chatQuotes.position).all();
  const loveRows = db.select().from(t.loves).orderBy(t.loves.position).all();
  const trackRows = db.select().from(t.tracks).orderBy(t.tracks.position).all();
  const prizeRows = db.select().from(t.prizes).orderBy(t.prizes.position).all();
  const answerRows = db.select().from(t.answers).orderBy(desc(t.answers.createdAt)).limit(1).all();

  return {
    settings: {
      askerName: settingsRow?.askerName ?? "Me",
      partnerName: settingsRow?.partnerName ?? "You",
      question: settingsRow?.question ?? "Would you be my date?",
      questionSubtext: settingsRow?.questionSubtext ?? "",
      yesResponse: settingsRow?.yesResponse ?? "",
      noIsDodger: (settingsRow?.noIsDodger ?? 1) === 1,
      whatsappPhone: settingsRow?.whatsappPhone ?? "",
      countdownTitle: settingsRow?.countdownTitle ?? "",
      countdownTarget: settingsRow?.countdownTarget ?? null,
      letterTitle: settingsRow?.letterTitle ?? "",
      letterBody: settingsRow?.letterBody ?? "",
      letterSignoff: settingsRow?.letterSignoff ?? "",
    },
    timeline: timeline.map((e) => ({
      id: e.id, date: e.date, title: e.title, description: e.description,
      emoji: e.emoji, position: e.position,
    })),
    photos: photoRows.map((p) => ({ id: p.id, caption: p.caption })),
    chats: chats.map((c) => ({
      id: c.id, side: c.side === "partner" ? "partner" : "me",
      text: c.text, timeLabel: c.timeLabel, position: c.position,
    })),
    loves: loveRows.map((l) => ({ id: l.id, emoji: l.emoji, text: l.text })),
    tracks: trackRows.map((s) => ({ id: s.id, title: s.title, artist: s.artist })),
    prizes: prizeRows.map((p) => ({
      id: p.id, label: p.label, emoji: p.emoji, color: p.color, weight: p.weight,
    })),
    answeredYesAt: answerRows[0]?.answer === "yes" ? answerRows[0].createdAt : null,
  };
}
