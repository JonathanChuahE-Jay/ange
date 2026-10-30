import { db, ensureSeed } from "@/lib/db";
import * as t from "@/lib/schema";
import { ApiError } from "@/lib/errors";
import { route } from "@/lib/handlers";

/** Server-side weighted spin so the result can't be fiddled with. */
export async function POST() {
  return route(async () => {
    ensureSeed();
    const rows = db.select().from(t.prizes).orderBy(t.prizes.position).all();
    if (rows.length === 0) throw new ApiError("spin.prizes.empty");

    const total = rows.reduce((s, p) => s + Math.max(1, p.weight), 0);
    let roll = Math.random() * total;
    let picked = rows[0];
    let index = 0;
    for (let i = 0; i < rows.length; i++) {
      roll -= Math.max(1, rows[i].weight);
      if (roll <= 0) {
        picked = rows[i];
        index = i;
        break;
      }
    }

    db.insert(t.prizeWins)
      .values({ prizeId: picked.id, prizeLabel: `${picked.emoji} ${picked.label}`, createdAt: new Date().toISOString() })
      .run();

    return Response.json({ index, prize: { id: picked.id, label: picked.label, emoji: picked.emoji, color: picked.color } });
  });
}
