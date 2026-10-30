import { desc } from "drizzle-orm";
import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import { route } from "@/lib/handlers";

export async function GET() {
  return route(async () => {
    await requireAuth();
    ensureSeed();

    const answers = db.select().from(t.answers).orderBy(desc(t.answers.createdAt)).limit(10).all();
    const wins = db.select().from(t.prizeWins).orderBy(desc(t.prizeWins.createdAt)).limit(20).all();
    const counts = {
      timeline: db.select().from(t.timelineEvents).all().length,
      photos: db.select().from(t.photos).all().length,
      chats: db.select().from(t.chatQuotes).all().length,
      loves: db.select().from(t.loves).all().length,
      tracks: db.select().from(t.tracks).all().length,
      prizes: db.select().from(t.prizes).all().length,
    };
    const yes = answers.find((a) => a.answer === "yes");

    return Response.json({
      latestAnswer: answers[0]
        ? { answer: answers[0].answer, at: answers[0].createdAt }
        : null,
      yesAt: yes?.createdAt ?? null,
      prizeWins: wins.map((w) => ({ id: w.id, prizeLabel: w.prizeLabel, at: w.createdAt })),
      counts,
    });
  });
}
