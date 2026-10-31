// Snapshot / restore the SQLite DB (photos, videos, music, all content live inside it).
//   node scripts/db-snapshot.mjs save     → data/ange.db  → seed/ange.db (compact, commit this)
//   node scripts/db-snapshot.mjs restore  → seed/ange.db  → $DATABASE_URL, only if no DB exists yet
// Restore runs before `drizzle-kit push` on Render so a fresh (free-plan, ephemeral)
// instance boots with the committed content instead of the demo seed.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const SEED = path.join(process.cwd(), "seed", "ange.db");
const raw = (process.env.DATABASE_URL ?? "data/ange.db").replace(/^\.\//, "");
const DB = path.isAbsolute(raw) ? raw : path.join(process.cwd(), "data", path.relative("data", raw));

const mode = process.argv[2];

if (mode === "save") {
  if (!fs.existsSync(DB)) throw new Error(`no database at ${DB}`);
  fs.mkdirSync(path.dirname(SEED), { recursive: true });
  fs.rmSync(SEED, { force: true });
  const db = new Database(DB, { readonly: true });
  db.exec(`VACUUM INTO '${SEED.replace(/'/g, "''")}'`); // consistent copy incl. WAL contents
  db.close();
  const mb = (fs.statSync(SEED).size / 1024 / 1024).toFixed(1);
  console.log(`snapshot saved → seed/ange.db (${mb} MB)`);
  if (mb > 95) console.warn("⚠ over ~95 MB — GitHub rejects files above 100 MB");
} else if (mode === "restore") {
  if (fs.existsSync(DB) && fs.statSync(DB).size > 0) {
    console.log(`database already exists at ${DB} — keeping it`);
  } else if (!fs.existsSync(SEED)) {
    console.log("no seed/ange.db snapshot — app will create demo content");
  } else {
    fs.mkdirSync(path.dirname(DB), { recursive: true });
    for (const ext of ["-wal", "-shm"]) fs.rmSync(DB + ext, { force: true });
    fs.copyFileSync(SEED, DB);
    console.log(`restored seed/ange.db → ${DB}`);
  }
} else {
  console.error("usage: node scripts/db-snapshot.mjs save|restore");
  process.exit(1);
}
