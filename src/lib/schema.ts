import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(), // always 1
  askerName: text("asker_name").notNull().default("Me"),
  partnerName: text("partner_name").notNull().default("You"),
  question: text("question").notNull().default("Would you be my date?"),
  questionSubtext: text("question_subtext")
    .notNull()
    .default("I made this little corner of the internet just for you."),
  yesResponse: text("yes_response")
    .notNull()
    .default("Best. Answer. Ever. Scroll down — there's more for you."),
  noIsDodger: integer("no_is_dodger").notNull().default(1),
  whatsappPhone: text("whatsapp_phone").notNull().default(""), // legacy, unused (kept so existing DBs need no migration)
  /** "YYYY-MM-DD" — the day they became a couple; unlocks the public site */
  anniversaryDate: text("anniversary_date").notNull().default(""),
  countdownTitle: text("countdown_title")
    .notNull()
    .default("Counting every second until…"),
  countdownTarget: text("countdown_target"), // ISO datetime, nullable
  letterTitle: text("letter_title").notNull().default("A letter for you"),
  letterBody: text("letter_body")
    .notNull()
    .default(
      "My dearest,\n\nSome feelings are too big for chat bubbles, so here they are on paper.\n\n" +
        "Every ordinary day is better with you in it. I don't need a special occasion to " +
        "celebrate you — but today, I made you this anyway.\n\n" +
        "Yours, always.",
    ),
  letterSignoff: text("letter_signoff").notNull().default("Yours, always"),
  /** JSON: per-section { kicker, title, note } overrides (see lib/headings.ts) */
  headings: text("headings").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
});

export const timelineEvents = sqliteTable("timeline_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // free-form label, e.g. "2024-02-14" or "Summer 2023"
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  emoji: text("emoji").notNull().default("✨"),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const photos = sqliteTable("photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caption: text("caption").notNull().default(""),
  mime: text("mime").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  /** motion clip: null | 'auto' (generated) | 'user' (uploaded) */
  videoSource: text("video_source"),
  /** auto-generated cinematic motion clip (mp4), null until rendered */
  video: blob("video", { mode: "buffer" }),
  videoMime: text("video_mime"),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const chatQuotes = sqliteTable("chat_quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  side: text("side").notNull().default("me"), // 'me' | 'partner'
  text: text("text").notNull(),
  timeLabel: text("time_label").notNull().default(""),
  /** ms to wait after the previous message before this one appears */
  delayMs: integer("delay_ms").notNull().default(900),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const loves = sqliteTable("loves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emoji: text("emoji").notNull().default("❤️"),
  text: text("text").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

/** "How well do you know us?" quiz — options stored as a JSON string array. */
export const quizQuestions = sqliteTable("quiz_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON: string[] (2–4)
  answerIndex: integer("answer_index").notNull().default(0),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const tracks = sqliteTable("tracks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  artist: text("artist").notNull().default(""),
  note: text("note").notNull().default(""),
  mime: text("mime").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const answers = sqliteTable("answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  answer: text("answer").notNull(), // 'yes' | 'no'
  createdAt: text("created_at").notNull(),
});
