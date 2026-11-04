# ELYSIUM RADICAL REBUILD — Build Contract

Two workers build in parallel: (A) HTML+CSS, (B) JavaScript. This spec is the
contract. Both sides MUST use these exact IDs, classes, and behaviors.

## Design tokens (CSS custom properties)

```css
:root {
  --bg: #04070c;        /* near-black */
  --bg2: #0a121b;       /* panel */
  --bg3: #0e1824;       /* raised */
  --ice: #8fd8f8;       /* primary accent */
  --ice-dim: #4a7d99;
  --gold: #d9a94f;      /* secondary accent */
  --blood: #d64545;     /* combat accent */
  --text: #e9f1f6;
  --muted: #8fa0ad;
  --line: rgba(143,216,248,.14);
}
```

Fonts (Google Fonts CDN link in <head>):
- Display: `Cinzel` (700, 900) — headings, logo text, numbers
- Body: `Inter` (400, 500, 600)

## Page structure (index.html) — section order & IDs

1. `#intro` — full-screen intro overlay
   - `<canvas id="intro-canvas">`
   - `<button id="intro-skip">` ("Skip")
   - `<div id="intro-title">` (letters injected by JS)
   - Hidden after play: `body.intro-done #intro { display:none }`.
     Session skip: if `sessionStorage.elysium_intro_seen === '1'`, JS adds
     `intro-done` to body immediately, no animation.
2. `<div class="grain">` and `<div class="vignette">` — fixed overlays (CSS only,
   pointer-events:none).
3. `<header id="site-nav">` — `.nav-inner`: logo img + "ELYSIUM" wordmark,
   links: World(#world) Demo(#demo) Classes(#classes) Hiscores(#hiscores)
   Lore(#lore) Community(#community); `#nav-toggle` hamburger (mobile);
   `#audio-toggle` button (🔊/🔇, aria-pressed).
4. `#hero` — `<canvas id="hero-canvas">` bg; `.hero-content`:
   - `.kicker` "UNOFFICIAL RSPS — PRELAUNCH"
   - `h1` "ENTER THE REALM"
   - `.lede` one-line pitch
   - CTA row: `<a class="btn btn-primary" href="#demo">` "Play the Demo",
     `<a class="btn btn-ghost" href="#community">` "Join Discord"
   - `#countdown`: label "LAUNCH IN", boxes `#cd-days #cd-hours #cd-mins #cd-secs`
     each `.cd-box > .cd-num + .cd-label`
   - scroll hint `.scroll-hint` ("▼ descend")
5. `#world` — `.section-head` (kicker+h2+lede), `<canvas id="worldmap-canvas">`,
   `<aside id="map-info">` with `#map-name`, `#map-desc`, `#map-stats`
   (definition list injected by JS), hint "Tap a region".
6. `#demo` — "TASTE OF ELYSIUM" idle game `#game`:
   - `#game-level` ("Level 3"), XP bar `#xp-fill` inside `#xp-bar`
   - Resources row: `#res-wood #res-ore #res-fish` (each `.res > .res-num + .res-label`)
   - Action buttons: `#act-chop` "🪓 Chop" `#act-mine` "⛏️ Mine" `#act-fish` "🎣 Fish"
   - `#game-log` (ul, latest 6 entries)
   - `#game-reset` small "reset progress" button
7. `#classes` — three `.class-card[data-class="melee|ranged|magic"]`
   (each: `.class-icon` emoji ⚔️/🏹/🔮, h3 name, `.class-tag` tagline),
   `<div id="class-display">`: `<canvas id="class-canvas">`,
   `#class-name`, `#class-desc`, `#class-abilities` (ul).
8. `#hiscores` — table `#hiscore-table > tbody#hiscore-body` (JS fills 10 rows:
   rank, name, level, xp). Note under: "Simulated — live hiscores at launch."
9. `#lore` — three `.lore-chapter` articles, each with `.lore-bg` (parallax layer),
   `.lore-kicker` ("Chapter I" etc.), h3 title, paragraphs.
10. `#community` — h2, `#member-count` (animated number), Discord + Vote buttons.
11. `<footer>` — Jagex disclaimer paragraph (`.disclaimer`), copyright,
    "elysium-ps.com" reference.

Reveal-on-scroll: every `.reveal` element starts hidden; JS adds `.in` via
IntersectionObserver → CSS transition (opacity/translateY).

## JS modules (js/*.js) — all vanilla, no CDN dependencies

All scripts loaded with plain `<script src>` tags at end of body, in this order:
`audio.js, intro.js, countdown.js, map.js, game.js, classes.js, hiscores.js, lore.js, main.js`.
Each file guards itself (`if (!document.getElementById(...)) return`).

- **audio.js** — `window.ElyAudio`: Web Audio wind/magic hum (filtered noise +
  slow LFO), `toggle()` wired to `#audio-toggle`, persists in localStorage
  `elysium_audio`. Default OFF (autoplay policy anyway).
- **intro.js** — Canvas: rune circle draws (arc progress), "ELYSIUM" letters
  materialize one by one with particle burst, then quick zoom-fade ("dive").
  `#intro-skip` ends immediately. Sets sessionStorage flag. Total ≤ 6s.
  If WebGL/canvas fails → skip instantly.
- **countdown.js** — `const LAUNCH_DATE = new Date('2026-12-05T18:00:00Z')`
  at top of file. Ticks every 1s into the four boxes. Past date → "LAUNCHED".
- **map.js** — Canvas fantasy map: dark parchment/night style, 5 regions as
  glowing zones with pulsing markers + drifting particles. Regions:
  Elysium Citadel (hub/safe), Whisperwood (woodcutting), Frostpeak (mining),
  Sunken Coast (fishing), Ember Wastes (combat/boss). Click/tap region →
  fills `#map-name/#map-desc/#map-stats` (level req, resources, danger).
  Responsive canvas (devicePixelRatio capped at 2).
- **game.js** — Idle clicker "Taste of Elysium":
  - State in localStorage `elysium_demo_v1`: {wood, ore, fish, xp, level}.
  - Actions grant resource + XP (xpNeed = 20 * level^1.5).
  - Level-up: flash + log entry, +1 per-click bonus per level.
  - Auto-gather: at level 3 unlock "Hire Lumberjack" (toggle `#auto-wood`),
    level 5 "Hire Miner" (`#auto-ore`) — 1 resource/2s each when on.
    (Worker B: add these two toggle buttons into #game — IDs `#auto-wood`,
    `#auto-ore` — Worker A: leave a `<div id="auto-row">` empty container;
    Worker B's JS will create the buttons if container exists, else skip.)
  - Log keeps last 6 entries. `#game-reset` clears storage.
- **classes.js** — Data for 3 classes (name, tagline, desc, 3 abilities each,
  color). Click card → active state, canvas draws animated silhouette:
  dark figure + class-colored aura particles + weapon glyph. Idle animation loop.
- **hiscores.js** — 10 fantasy names, random base XP. Every 2.5s random players
  gain XP, re-sort, re-render with rank change flash. Pause when tab hidden.
- **lore.js** — Parallax: on scroll, translate `.lore-bg` at 0.3x via rAF
  (passive scroll listener). Chapters:
  I "The Shattering", II "The Exile", III "The Return" — 2 short paragraphs
  each, epic tone, original writing.
- **main.js** — Smooth anchor scrolling (CSS `scroll-behavior` + JS offset for
  fixed nav), `#nav-toggle` mobile menu, `.reveal` observer, member count
  animation (2,400 → target on view), footer year, `document.fonts` guard not
  required.

## Copy rules
- Epic fantasy tone, confident. Never mention Jason, KBG, loads, or real-world
  personal info. "Elysium" is the game world.
- Keep the Jagex/RuneScape non-affiliation disclaimer verbatim in footer.
- Discord/Vote buttons link to `#` (no real URLs exist).

## Mobile-first CSS rules
- Base styles target 360px. `min-width` media queries at 640 / 900 / 1200.
- Touch targets ≥ 44px. Canvas resize handlers everywhere.
- `prefers-reduced-motion`: disable heavy animation.
- No external CSS/JS frameworks. Google Fonts only.
