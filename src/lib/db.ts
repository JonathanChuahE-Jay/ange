import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const rawDbPath = (process.env.DATABASE_URL ?? "data/ange.db").replace(/^\.\//, "");
const dbFile = path.isAbsolute(rawDbPath)
  ? rawDbPath
  : path.join(process.cwd(), "data", path.relative("data", rawDbPath));

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const sqlite = new Database(dbFile);
sqlite.pragma("busy_timeout = 5000");
try {
  sqlite.pragma("journal_mode = WAL");
} catch {
  // another connection may hold the db (parallel build workers); WAL retries on next open
}

// lightweight forward migrations (drizzle-kit push needs a TTY for some diffs)
try {
  const cols = sqlite.prepare("PRAGMA table_info(settings)").all() as { name: string }[];
  if (cols.length > 0 && !cols.some((c) => c.name === "anniversary_date")) {
    sqlite.exec("ALTER TABLE settings ADD COLUMN anniversary_date text NOT NULL DEFAULT ''");
  }
} catch {
  // table not created yet — drizzle-kit push will create it with the column
}
// v1 migration: quiz table. user_version makes it run exactly once per DB
// (the table may already exist from a build worker, so "table is new" isn't reliable).
const QUIZ_SEED = [
  { question: "Where did we first meet?", options: ["At a café", "Online", "Through friends", "At school"], answerIndex: 2 },
  { question: "What's our go-to late-night snack?", options: ["Instant noodles", "Ice cream", "Fries", "Toast"], answerIndex: 0 },
  { question: "Who said “I love you” first?", options: ["Me", "You", "We said it together", "Still waiting"], answerIndex: 0 },
  { question: "What's my favourite thing about you?", options: ["Your laugh", "Your eyes", "Your kindness", "All of it"], answerIndex: 3 },
];

try {
  const version = Number(sqlite.pragma("user_version", { simple: true }) ?? 0);
  if (version < 1) {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS quiz_questions (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      question text NOT NULL,
      options text NOT NULL,
      answer_index integer DEFAULT 0 NOT NULL,
      position integer DEFAULT 0 NOT NULL,
      created_at text NOT NULL
    )`);
    const count = (sqlite.prepare("SELECT COUNT(*) AS n FROM quiz_questions").get() as { n: number }).n;
    const hasSettings = !!sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get();
    sqlite.transaction(() => {
      // only seed demo questions on installs that already exist; brand-new DBs get them from ensureSeed()
      if (count === 0 && hasSettings && sqlite.prepare("SELECT 1 FROM settings LIMIT 1").get()) {
        const ins = sqlite.prepare(
          "INSERT INTO quiz_questions (question, options, answer_index, position, created_at) VALUES (?, ?, ?, ?, ?)",
        );
        const now = new Date().toISOString();
        QUIZ_SEED.forEach((q, i) => ins.run(q.question, JSON.stringify(q.options), q.answerIndex, i, now));
      }
      sqlite.pragma("user_version = 1");
    })();
  }
  // v2: photo motion clips
  if (Number(sqlite.pragma("user_version", { simple: true }) ?? 0) < 2) {
    sqlite.transaction(() => {
      const cols = sqlite.prepare("PRAGMA table_info(photos)").all() as { name: string }[];
      if (cols.length > 0 && !cols.some((c) => c.name === "video")) {
        sqlite.exec("ALTER TABLE photos ADD COLUMN video blob");
        sqlite.exec("ALTER TABLE photos ADD COLUMN video_mime text");
      }
      sqlite.pragma("user_version = 2");
    })();
  }
  // v3: user-uploaded videos per photo
  if (Number(sqlite.pragma("user_version", { simple: true }) ?? 0) < 3) {
    sqlite.transaction(() => {
      const cols = sqlite.prepare("PRAGMA table_info(photos)").all() as { name: string }[];
      if (cols.length > 0 && !cols.some((c) => c.name === "video_source")) {
        sqlite.exec("ALTER TABLE photos ADD COLUMN video_source text");
      }
      sqlite.pragma("user_version = 3");
    })();
  }
} catch {
  // parallel build workers may race here; the next open retries
}

export const db = drizzle(sqlite, { schema });

function placeholderPhoto(from: string, to: string, glyph: string, words: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="900" height="900" fill="url(#g)"/>
  <text x="450" y="440" font-size="200" text-anchor="middle">${glyph}</text>
  <text x="450" y="600" font-size="44" fill="#ffffff" opacity="0.92" font-family="Georgia, serif" text-anchor="middle">${words}</text>
</svg>`;
  return Buffer.from(svg, "utf8");
}



function seedQuiz(now: string) {
  db.insert(schema.quizQuestions)
    .values(QUIZ_SEED.map((q, i) => ({ ...q, options: JSON.stringify(q.options), position: i, createdAt: now })))
    .run();
}

let seeded = false;

/** Idempotent: insert defaults + demo content the first time the DB is empty. */
export function ensureSeed() {
  if (seeded) return;
  seeded = true;

  const existing = db.select().from(schema.settings).limit(1).all();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  db.insert(schema.settings).values({ id: 1, updatedAt: now }).run();

  db.insert(schema.timelineEvents)
    .values([
      { date: "The day we met", title: "Hello, it's you", description: "The world quietly shifted, and I didn't even know it yet.", emoji: "🌍", position: 0, createdAt: now },
      { date: "Our first date", title: "Butterflies, officially", description: "I rehearsed what to say. Forgot all of it. Best evening ever.", emoji: "💫", position: 1, createdAt: now },
      { date: "That one trip", title: "Adventure no. 1", description: "Wrong turns, great snacks, zero regrets.", emoji: "🗺️", position: 2, createdAt: now },
      { date: "Today", title: "Still choosing you", description: "Every day, it's you. It's always you.", emoji: "❤️", position: 3, createdAt: now },
    ])
    .run();

  const p1 = placeholderPhoto("#F6DCE2", "#D64560", "🌹", "add our photos in the admin");
  const p2 = placeholderPhoto("#3A1533", "#B34A5E", "🌙", "every picture tells a story");
  const p3 = placeholderPhoto("#F3E3C3", "#C9973F", "✨", "this one's my favourite");
  db.insert(schema.photos)
    .values([
      { caption: "Placeholder — upload the real us 💕", mime: "image/svg+xml", data: p1, position: 0, createdAt: now },
      { caption: "A memory goes here", mime: "image/svg+xml", data: p2, position: 1, createdAt: now },
      { caption: "Another one for the wall", mime: "image/svg+xml", data: p3, position: 2, createdAt: now },
    ])
    .run();

  db.insert(schema.chatQuotes)
    .values([
      { side: "partner", text: "are you even real", timeLabel: "2:14 am", position: 0, createdAt: now },
      { side: "me", text: "only for you 😌", timeLabel: "2:14 am", position: 1, createdAt: now },
      { side: "partner", text: "typing… then deleting… then typing again", timeLabel: "2:15 am", position: 2, createdAt: now },
      { side: "me", text: "say it. I already know 🤭", timeLabel: "2:16 am", position: 3, createdAt: now },
      { side: "partner", text: "okay fine. I like you. a lot.", timeLabel: "2:16 am", position: 4, createdAt: now },
      { side: "me", text: "screenshot saved forever 📸❤️", timeLabel: "2:17 am", position: 5, createdAt: now },
    ])
    .run();

  seedQuiz(now);

  db.insert(schema.loves)
    .values([
      { emoji: "☕", text: "Slow mornings", position: 0, createdAt: now },
      { emoji: "🌇", text: "Sunsets we chase", position: 1, createdAt: now },
      { emoji: "😂", text: "Your laugh", position: 2, createdAt: now },
      { emoji: "🍜", text: "Midnight snacks", position: 3, createdAt: now },
      { emoji: "🌧️", text: "Rainy days in", position: 4, createdAt: now },
      { emoji: "🎬", text: "Movie marathons", position: 5, createdAt: now },
    ])
    .run();

  db.insert(schema.prizes)
    .values([
      { label: "One big hug", emoji: "🫂", color: "#D64560", weight: 3, position: 0, createdAt: now },
      { label: "Movie night — you pick", emoji: "🎬", color: "#C9973F", weight: 2, position: 1, createdAt: now },
      { label: "Dinner date", emoji: "🍽️", color: "#B03052", weight: 1, position: 2, createdAt: now },
      { label: "Breakfast in bed", emoji: "🥞", color: "#E8879C", weight: 1, position: 3, createdAt: now },
      { label: "Massage coupon", emoji: "💆", color: "#C9973F", weight: 2, position: 4, createdAt: now },
      { label: "A kiss, obviously", emoji: "💋", color: "#D64560", weight: 3, position: 5, createdAt: now },
    ])
    .run();
}
