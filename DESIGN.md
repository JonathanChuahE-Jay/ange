# Ange — a love website

A romantic, full-stack single-page experience for one special person, with a
private admin panel to edit every word, photo, date and prize.

## Stack

| Layer      | Choice |
|------------|--------|
| Framework  | Next.js 16 (App Router, Turbopack, React 19) — one codebase, deployable to any Node server or Vercel later |
| DB         | SQLite via better-sqlite3 + Drizzle ORM (file at `data/ange.db`) |
| Styling    | Tailwind CSS v4 (`@theme` tokens in globals.css) + `@iconify/tailwind4` icons (`icon-[lucide--heart]`) |
| UI kits    | shadcn/ui (Dialog, Tooltip, Button) · Aceternity UI (Timeline, FloatingDock, 3D Card, Spotlight, TextGenerateEffect) · Magic UI (Marquee, AnimatedList, MagicCard, BorderBeam, ShimmerButton, Meteors, DotPattern, ScrollProgress, ShineBorder) · React Bits (BlurText, ShinyText) — all vendored in `src/components/kit/` |
| Data       | TanStack Query v5 |
| Validation | Zod v4 (every form + every API body) |
| 3D         | three + @react-three/fiber + @react-three/drei (hero scene) |
| Motion     | `motion` (framer-motion v14) + canvas-confetti |
| Auth       | Admin password → jose JWT in HttpOnly cookie |

## Design language

Dreamy dusk-romantic. The hero is a deep plum → rose dusk sky with floating
glass hearts and sparkles (Three.js); the rest of the page is warm cream paper
with rose ink, so the content feels like a love letter unfolding.

### Palette

| Token        | Value     | Use |
|--------------|-----------|-----|
| `--bg`       | `#FFF8F3` | page background (cream) |
| `--ink`      | `#43263A` | headings/text (deep plum) |
| `--ink-soft` | `#7A5B6E` | secondary text |
| `--rose`     | `#D64560` | primary accent |
| `--rose-deep`| `#B03052` | hover/danger |
| `--rose-soft`| `#F6DCE2` | blush fills |
| `--rose-mist`| `#FBE9EE` | section tints |
| `--gold`     | `#C9973F` | sparkle accents, wheel rim, tape |
| `--line`     | `#F0DCE0` | hairlines |
| `--dusk-0` … `--dusk-3` | `#1C0F22 #3A1533 #6E2748 #B34A5E` | hero/countdown/footer gradients |

Decorations (globals.css): drifting `.blob` gradient blobs, `.tape` washi
strips, `.stars-layer` CSS star fields, `.petal` falling petals, `.vinyl` /
`.eq-bar` music indicators, `.bulb` carnival pulses, `.flip-dusk` glass flip
cards, airmail repeating-linear-gradient frame.

### Typography

- Display: **Playfair Display** (headings, the big question)
- Handwriting: **Caveat** (love letter, cute annotations)
- UI/body: **Inter** (admin, labels, chat bubbles)

## Public page — sections (single scroll, anchor nav)

A dusk → paper → dusk arc: the hero opens dark, the middle unfolds like a
scrapbook on cream paper (drifting gradient blobs, washi tape, handwritten
annotations), and the countdown + footer close in dusk again so the page ends
where it began.

1. **Hero / The Question** — full-viewport Three.js dusk scene (8 floating
   glass hearts, Sparkles, Stars, pointer parallax). Centered card:
   “{asker} has a question for {partner}”, the question in Playfair, then
   **Yes** (primary pill) and **No** (ghost). No dodges/shrinks with playful
   labels when `noIsDodger` is on; Yes → heart confetti + recorded answer +
   sweet response. If already answered Yes → celebratory state with date.
2. **Your timeline** — scrapbook journey: a gradient spine that **fills as you
   scroll**, heart nodes that light up as the line reaches them, alternating
   softly-tilted cards that straighten on hover, ghost chapter numbers, gold
   date pills (event emojis are admin data but not rendered).
3. **Your photos** — a **slidable polaroid strip**: scroll-snap + swipe on
   touch, arrow buttons on desktop, washi tape, always-visible Caveat
   captions; lightbox with prev/next.
4. **What your chats say** — a **WhatsApp-styled phone** (green header, status
   bar, online dot, #DCF8C6 outgoing bubbles with blue double ticks, ❤️
   reaction, typing dots) next to a **scan-to-reply QR card**: the QR encodes a
   `wa.me/<phone>` deep link (admin sets the number) so she can open a real
   WhatsApp chat with you.
5. **A love letter** — a **Three.js envelope** that physically opens on tap
   (flap swings back, letter slides out toward the viewer, then hands off to
   the airmail HTML letter). CSS envelope fallback when WebGL/reduced-motion
   can't run.
6. **Things you love** — sticker sheet: rotated pills on alternating
   rose/gold/blush fills that straighten and lift on hover.
7. **A countdown** — the dark drama anchor: dusk gradient + CSS star field +
   rose glow + drifting ♥ petals; glowing glass split-flap flip-clock
   (days/hours/min/sec); “It’s today!” celebration state when reached.
8. **A prize wheel** — carnival style: gold rim with pulsing bulbs (fixed,
   non-rotating), lucide heart hub, gold pointer, pedestal glow; **radial
   labels** (read outward, truncated to 14 chars so they never stack);
   server-picked weighted prize, celebratory modal + confetti.
9. **Footer** — dusk close: heart divider, “made with ♥ by X for Y”, both
    versions, tiny 🔒 admin link, drifting ♥ petals.

**Top music bar** (fixed, site-wide): plays **admin-uploaded audio files**
(MP3/M4A/WAV/OGG ≤ 16 MB) with prev/play/next and animated eq bars, streaming
via `/api/tracks/[id]/raw` with HTTP Range support. Hidden when no tracks.
(Spotify section removed.)

Floating dot-nav (right, desktop) / bottom emoji pill bar (mobile), hides on
scroll down, springs back on scroll up.

## Admin (`/admin`)

Password login (jose session cookie, 7 days). Sidebar sections: Overview
(answer status, prize wins, counts), Question & names (+ WhatsApp number),
Countdown, Love letter, Timeline, Photos (upload up to 8 MB), Chats, Loves,
Music (audio upload ≤ 16 MB, inline preview, metadata edit), Prizes. Every
list row: edit (modal) + delete (confirm). Logout with confirm.

## Motion

- Primary pill CTA (Yes, logins, spins): `buttons/circle-drop`
- Ghost/outline buttons (No, secondary): `buttons/background-wipe`
- All buttons press feedback: `buttons/tap-spring`
- Inputs focus: `inputs/ring-scale-in`
- Toggles: `selection-controls/springy`
- Global modal: `modals/spring-pop`
- Prize-result / celebratory modal: `modals/bounce-in`
- Global toast: `toasts/pop-in`
- Content cards: `cards/shadow-rise`
- Photo cards: `cards/image-zoom`
- Photo grid mount: `grid-reveal/grid-blur`
- Card grids mount / scroll into view: `grid-reveal/grid-fade-up`
- Countdown digits: `numbers/flip-number`
- Dot-nav active indicator: `navigation-indicator/bouncy-spring`
- Admin list rows: `list-items/list-pop`
- Floating nav hide/show: `hide-on-scroll/scale-down`

Not built in this app (no gap, just absent): dropdowns (native select used
where needed, no custom menu), hamburger overlays (mobile nav is an
always-visible bottom bar), carousels, checkboxes.

Named tokens (see `src/lib/motion.ts`): `EASE_OUT_SOFT = cubic-bezier(0.16,1,0.3,1)`,
spring presets, and per-spec reduced-motion fallbacks (≤150 ms fades, no travel).

## States & feedback

- Skeleton loaders on every async section (shimmering rose-mist blocks).
- Global toast (aria-live) with exhaustive `ErrorCode → message` map.
- Global modal + confirm dialog; every delete/logout confirms.
- Errors show friendly message + code; unknown codes get a generic fallback.

## Responsive

Audited at 390×844: single-column sections, chat phone fits, wheel scales to
min(80vw, 420px), nav becomes bottom pill bar, dialogs fit viewport, all touch
targets ≥ 40px. No horizontal overflow anywhere.

## Versions & API conventions

- `FRONTEND_VERSION` shown in footer; `BACKEND_VERSION` exposed via
  `/api/version` and `X-App-Version` on `/api/*`; error payloads include it.
- Error codes: namespaced `domain.entity.reason` snake_case, centralized in
  `src/lib/errors.ts`, exhaustive frontend map in `src/lib/api.ts`.
- List endpoints paginate: `page`, `pageSize`, `hasNext`, `hasPrev`, `total`.

## Gaps

- No auth rate-limiting (fine for LAN/personal server; noted in README before
  public hosting).
- Refero was not available; design references skipped.
