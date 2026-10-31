# Ange 💖

A romantic, full-stack single-page website for one very special person —
timeline, photos, chat quotes, a love letter, things they love, a live
countdown, Spotify songs and a prize wheel. Every word, photo and prize is
editable from a private admin panel.

## Quick start (via mise)

```bash
mise run start    # install → migrate → build (if needed) → serve on http://localhost:3000
mise run stop     # stop the server
mise run dev      # hot-reload dev server
mise run clean    # clear build + npm caches
```

Everything runs on port 3000 and binds `0.0.0.0`, so on the same WiFi you can
open it from a phone at `http://<your-ip>:3000`.

## The admin panel

- URL: **`/admin`** (there's also a tiny 🔒 link in the site footer)
- Default password: **`ange-admin`** — change it in `.env.local` (`ADMIN_PASSWORD`)
  before showing this to anyone, and definitely before hosting it.

Configure in `.env.local` (see `.env.example`):

| Var | Purpose |
|-----|---------|
| `ADMIN_PASSWORD` | admin login password |
| `AUTH_SECRET` | JWT signing secret (rotate to log everyone out) |
| `DATABASE_URL` | SQLite file path (default `./data/ange.db`) |

## What's inside

- **Next.js 16** (App Router, Turbopack) + React 19 — one codebase, deploys to
  any Node server or Vercel
- **SQLite** via better-sqlite3 + Drizzle ORM (`mise run start` migrates automatically)
- **Three.js** hero: floating glass hearts, sparkles & stars with pointer parallax
- **UnoCSS** + lucide icons, **TanStack Query**, **Zod** everywhere,
  namespaced error codes, paginated list endpoints, skeleton loaders,
  global toast/modal — see `DESIGN.md` for the design system & motion specs
- Versions: frontend shown in the footer; backend via `/api/version` and the
  `X-App-Version` header on every `/api/*` response

## Deploy free on Render

`render.yaml` is a Render Blueprint on the **free** plan:

1. render.com → **New → Blueprint** → pick this GitHub repo
2. Enter an `ADMIN_PASSWORD` when asked (`AUTH_SECRET` is generated for you)
3. Deploy — the site is at `https://ange-xxxx.onrender.com`

Free-plan caveats: the service sleeps after ~15 min idle (first visit takes
~30–60 s to wake up), and there's **no persistent disk**. Every deploy/restart/wake
restores the database from the committed snapshot **`seed/ange.db`** — all photos,
videos, music and text live inside it. So edits made in the admin panel *on Render*
vanish on the next restart. To publish content:

```bash
mise run dev              # edit everything in /admin locally
npm run db:snapshot       # data/ange.db → seed/ange.db
git add seed/ange.db && git commit -m "content" && git push   # Render redeploys
```

(GitHub caps files at 100 MB — the script warns as the snapshot nears that.)
To keep admin edits on the server instead, use a paid instance + disk at
`/var/data` and `DATABASE_URL=/var/data/ange.db`.

## Hosting on a server later

1. Copy the folder (or `git clone`) to the server, install [mise](https://mise.jdx.dev)
2. Edit `.env.local`: set a strong `ADMIN_PASSWORD` + fresh `AUTH_SECRET`
3. `mise run start` — or run it under systemd/pm2:
   `ExecStart=mise exec -- node_modules/.bin/next start -H 0.0.0.0 -p 3000`
4. Put HTTPS in front (Caddy/nginx) — the session cookie is `Secure` in
   production unless `ALLOW_INSECURE_COOKIE=1`

Notes: the site sets `noindex`; there's no rate limiting on the two anonymous
endpoints (`/api/answer`, `/api/spin`) — fine for a personal server, add a
proxy-level limiter if you expose it publicly.

## First-run demo content

The database seeds itself with placeholder content (cute placeholder photos,
sample chats, two songs, six prizes). Replace everything from the admin panel —
the placeholders are clearly marked.
