# 🛠️ DEVELOPMENT, THEMES & WIDGETS ARCHITECTURE GUIDE
### Open Stream Suite — Modular Overlays, Alerts & Triggers with Web Code

<p align="center">
  <a href="GUIA_DESARROLLO_Y_TEMAS.md">Español</a> | <b>English</b>
</p>

Welcome to the technical guide for Open Stream Suite. Here you will learn **how the system architecture works**, **why building overlays with web code is vastly superior to Photoshop**, **how to build custom widgets**, and **how to design and package new themes**.

---

## 📑 TABLE OF CONTENTS
1. [Overlays with Code vs Photoshop](#1-overlays-with-code-vs-photoshop)
2. [Project Architecture & Conventions](#2-project-architecture--conventions)
3. [Building a New Modular Widget from Scratch](#3-building-a-new-modular-widget-from-scratch)
4. [Creating & Packaging a New Visual Theme](#4-creating--packaging-a-new-visual-theme)
5. [Real-time Communication: WebSocket & Event Dispatching](#5-real-time-communication-websocket--event-dispatching)
6. [Local TriggerFyre: Videos, Memes & Twitch Channel Points](#6-local-triggerfyre-videos-memes--twitch-channel-points)
7. [OBS Studio Best Practices](#7-obs-studio-best-practices)
8. [Programmed Functions in Overlays & Draggable Floating Controls](#8-programmed-functions-in-overlays--draggable-floating-controls)

---

## 1. Overlays with Code vs Photoshop

Historically, streamers designed overlays in graphic software like Photoshop, exporting huge transparent PNG files or heavy looping videos.

### Why Code (HTML5 + CSS3 + JS) is Superior:

| Feature | Photoshop / PNG / Video Loops | Web Code (HTML5 / CSS3 / Vanilla JS) |
| :--- | :--- | :--- |
| **Disk Size & Memory** | 10 MB to 80 MB per scene. | Under **50 KB** total. Instant load. |
| **OBS CPU Usage** | Decoding continuous video loops takes 5-15% CPU. | Under **0.5% CPU**. Native GPU hardware acceleration. |
| **Sharpness** | Scaling bitmaps causes pixelation or blurring. | Scalable SVG and CSS that render razor sharp at 1080p, 1440p, or 4K. |
| **Interactivity** | Static. Changing text requires reopening Photoshop. | **100% dynamic**: edit text in panel and all scenes update live. |
| **Twitch Integration** | Zero reactive capability. | Real-time reactions to follows, subs, bits, and chat via WebSockets. |
| **Native Transparency** | Prone to fringing, halo artifacts, or dirty alpha edges. | Pure alpha transparency (`background: transparent !important`). |

---

## 2. Project Architecture & Conventions

```text
app/                           # Core project root directory
├── server.py                  # Entrypoint (~35 lines) for direct server launch
├── server/                    # Modular Python backend (aiohttp + WebSockets)
│   ├── config.py, state.py, eventsub.py, irc.py, app.py
│   ├── routes/                # Decoupled REST & WS controllers by domain
│   │   ├── deck_routes.py, media_routes.py, overlay_routes.py, rewards_routes.py...
│   │   └── themes_routes.py, webhooks_routes.py, widgets_routes.py, static_routes.py
│   └── services/              # Domain business logic & persistence
│       ├── alerts_service.py, deck_service.py, donations_service.py, media_service.py...
│       ├── overlay_service.py, theme_manager.py, theme_service.py, widgets_service.py
│       └── actions/           # Submodules for Stream Deck actions & chat triggers
│
├── alerts/                    # Streamer dashboard and OBS alerts overlay
│   ├── panel.html             # Full-featured control dashboard for the streamer
│   ├── index.html             # Transparent alerts canvas for OBS Studio (~60 lines)
│   ├── css/
│   │   ├── panel/             # Modular dashboard styles by component (01-08)
│   │   ├── alerts-widget.css  # Dedicated styles for OBS alerts overlay
│   │   └── panel.css          # Unified CSS bundle importer
│   └── js/                    # Decoupled frontend modules
│       ├── alerts-studio/, media/, overlay/, overlay-texts/, rewards/, roles/, themes/, triggers/, widgets-core/
│       ├── api.js, audio.js, monitor.js, overlay-widget.js, main.js
│       └── forwarders: media.js, triggers.js, widgets-core.js, overlay-texts.js, rewards.js, roles.js
│
├── widgets/                   # Modular decoupled widgets (Mini-App + OBS Overlay)
│   ├── chat/                  # On-screen chat with emotes, badges, and particles
│   │   ├── panel/             # Mini-App dashboard submodules (01-08)
│   │   ├── js/                # OBS overlay submodules (styles.js, parser.js, render.js, network.js, particles.js)
│   │   └── index.html, style.css, widget.js, panel.js, config.json
│   ├── goal/                  # Multi-item follower, sub, and tip goal bars
│   │   ├── panel/             # Mini-App dashboard submodules (01-05)
│   │   ├── js/                # OBS overlay submodules (confetti.js, render.js, network.js)
│   │   └── index.html, style.css, widget.js, panel.js, config.json
│   ├── shoutout/              # Holographic streamer promo cards & dynamic QR
│   │   ├── panel/             # Mini-App dashboard submodules (01-08)
│   │   ├── js/                # OBS overlay submodules (styles.js, render.js, network.js)
│   │   └── index.html, style.css, widget.js, panel.js, config.json
│   ├── ticker/                # News prompter, RSS ticker, and real-time metrics
│   │   ├── panel/             # Mini-App dashboard submodules (01-04)
│   │   ├── js/                # OBS overlay submodules (state-data.js, render.js, network.js)
│   │   └── index.html, style.css, widget.js, panel.js, config.json
│   └── timer/                 # Modular timer (countdown, stopwatch, block layouts)
│       ├── panel/             # Mini-App dashboard submodules (01-06)
│       ├── js/                # OBS overlay submodules (state-data.js, render.js, engine.js, network.js)
│       └── index.html, style.css, widget.js, panel.js, config.json
│
├── scenes/                    # Full 1920×1080 scene overlays for OBS Studio
│   ├── game/, maker-desk/, maker-pc/, print-machine/, print-design/, chill/, starting-soon/, be-right-back/, ending/
│
├── common/                    # Shared design system tokens & runtime
│   ├── overlay/               # Overlay submodules: editor/, dom-injector.js, icons.js
│   ├── catalog.css, catalog.js, components.css, editor.js, i18n.js, overlay.js, styles.css, themes.css
│
├── launcher/                  # Cross-platform desktop launcher (Tkinter)
│   ├── gui.py, server_ctl.py, twitch_ctl.py, updater.py, i18n.py
│   └── tabs/                  # Decoupled tabs (server, twitch, logs, guide)
│
├── assets/                    # Brand identity and visual assets
│   └── imagencorp/            # Logos (SVG/PNG), favicon and screenshots
├── languages/                 # Internationalization dictionaries (i18n)
├── scripts/                   # Deployment assistants and startup scripts
└── docs/                      # Architectural, setup, and OBS guides
```

All widgets adhere to 4 core principles:
1. **100% Transparent Background**: `html, body { background: transparent !important; margin: 0; overflow: hidden; }`.
2. **Global CSS Design Tokens**: Link `../../common/styles.css` and `../../common/themes.css`.
3. **Local WebSocket Listener**: Connect to `ws://localhost:8080/ws` for reactive events.
4. **Targeted Viewport Dimensions**: Designed specifically for their OBS source size (e.g. 400×140 for timers, 460×120 for goal bars).

---

## 3. Building a New Modular Widget from Scratch

Every widget inside `app/widgets/<widget_id>/` follows a clean two-layer decoupled architecture (OBS Overlay + Dashboard Mini-App):
- `index.html`: Browser source rendered in OBS Studio with zero lag.
- `style.css`: Visual styling with CSS variables and design tokens.
- `widget.js`: Entry point coordinator for the OBS overlay (dynamically loads `js/` if needed).
- `js/`: Modular runtime scripts for the OBS overlay:
  - `render.js`: DOM rendering and visual updates.
  - `styles.js`: Theme reactivity and dynamic styles.
  - `network.js`: WebSocket auto-reconnect and IRC listeners.
- `panel/`: Modular Mini-App controls for the streamer dashboard:
  - `01-shortcuts.js`: Fast action buttons and deck macros.
  - `02-controls.js`: Parameter form controls and live state sync.
  - `03-presets.js`: Visual preset picker and customization.
- `panel.js`: Backward-compatibility loader shim dynamically importing `panel/*.js`.
- `config.json`: Default isolated configuration state for the widget.

---

## 4. Creating & Packaging a New Visual Theme

Themes live inside `app/themes/<pack_id>/<theme_id>/`:
- `theme.json`: Theme metadata (name, palette colors, font tokens).
- `style.css`: Custom stylesheet modifying CSS properties on `body[data-theme="..."]`.
- `theme.default.json` & `style.default.css`: Clean factory backups.

---

## 5. Real-time Communication: WebSocket & Event Dispatching

Connect to `ws://localhost:8080/ws` from any client:
```javascript
const socket = new WebSocket('ws://localhost:8080/ws');
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.event === 'theme_changed') {
    document.body.setAttribute('data-theme', msg.theme);
  }
};
```

---

## 6. Local TriggerFyre: Videos, Memes & Twitch Channel Points

Open Stream Suite embeds a full TriggerFyre engine on `http://localhost:8080/alerts/`:
- **Direct Twitch Helix Integration**: Create Channel Point rewards directly from the dashboard.
- **Trigger Modes**: Channel points only, chat command only, or both. Role permissions for sub/vip/mod/streamer.
- **Multi-layer Media Compositor**: WebM transparent video + independent MP3/WAV audio track + banner overlays with `{user}` templating.
- **16:9 Interactive Placement**: Drag to position anywhere on canvas or activate random placement.

---

## 7. OBS Studio Best Practices

1. **Base Resolution**: Canvas set to **1920 × 1080**.
2. **Layering Order**:
   - 🔝 Top: Alerts & Triggers (`http://localhost:8080/alerts/index.html`).
   - 🔼 Middle: Dynamic widgets (`/widgets/chat/index.html`).
   - 🔲 Scene Overlay: (`/streamthemes/.../index.html`).
   - 📷 Bottom: Physical webcams and window captures behind frames.
3. **Browser Source Settings**:
   - Enable *Control audio via OBS*.
   - Enable *Shutdown source when not visible*.
   - Framerate: 60 FPS.

---

## 8. Programmed Functions in Overlays & Draggable Floating Controls

### 8.1. Philosophy: Overlays as Interactive Broadcast Web Applications
In **Open Stream Suite**, overlays are not static graphics; they are **interactive broadcast applications** running in OBS Studio's browser source or full-screen preview.

Overlays feature programmed functionality such as:
- Precision stopwatches with real-time lap/split recording and delta calculations.
- Countdown timers synchronized millisecond-by-millisecond with SVG/CSS progress indicators.
- Interactive workshop project stage managers with active phase indicators.
- Dynamic multi-cam layout switchers for podcasts and dual/triple-cam interviews.
- Interactive state badges (e.g. victory/defeat cycling, performance stats).

---

### 8.2. Golden Rule: All Floating Panels MUST be Draggable (`makeDraggable`)
> [!IMPORTANT]
> **Non-Obtrusive Guarantee**: A floating menu, HUD, or control panel **must never permanently block** cameras, chat, gameplay, or text that the streamer needs to view or edit.

Every floating control (`#open-stream-suite-screen-hud`, `#oss-countdown-control`, `#oss-speedrun-control`, `#oss-brb-phrases-control`) must be draggable:

1. **Universal Helper `makeDraggable(panel, handleSelector)`**:
   Provided in `common/overlay.js`:
   - Built on standard Pointer Events (`pointerdown`, `pointermove`, `pointerup`) with `setPointerCapture` and `touch-action: none`.
   - Prevents dragging when interacting with interactive form controls (`button`, `input`, `[contenteditable]`).
   - Restricts coordinates so floating controls cannot be dragged outside viewport boundaries.
2. **Required Drag Handle**:
   - All floating panels must feature a top header with class `.hud-drag-handle`, the `⋮⋮` glyph, and `cursor: grab / grabbing`.

---

### 8.3. Native Programmed Functions Catalog

| Pack / Scene | Programmed Function | Floating Controls / HUD |
|---|---|---|
| **Gamer Pro (`speedrun_splits`)** | Interactive stopwatch with milliseconds, split recording, delta tracking (`+` / `-`), keyboard `Space` toggle. | Draggable `#oss-speedrun-control` with `[▶/⏸ Start]`, `[⚡ Split]`, `[⏮ Prev]`, `[🔄 Reset]`. |
| **Lo-Fi / Synthwave (`starting_soon`, `countdown`)** | Countdown timer synced with `.tech-progress-fill`. Direct clock click to pause/resume. | Draggable `#oss-countdown-control` with Pomodoro/Coffee presets (25m, 50m, 5m, 10m) and `±1m` steps. |
| **Maker Desk (`fases_proyecto`)** | Interactive workshop stage manager. Clicking `01 PLAN`, `02 MONTAJE`, etc. highlights phase and updates active status. | HUD with dynamic phase switching, `➕ Add Phase` and `🗑️ Delete Phase`. |
| **Open Stream (`podcast_talk`)** | Dynamic camera grid switcher (2, 3, or 4 participants) with automated CSS Grid reflow and editable guest lower-thirds. | HUD layout buttons: `[👥 2 Cams]`, `[👥 3 Cams]`, `[👥 4 Cams]`. |
| **Gameplay HUD & Victory Clutch** | Direct click to cycle status (`VICTORY`, `DEFEAT`, `ACE`, `MATCH POINT`) and toggle modes (`COMPETITIVE`, `RANKED`, FPS). | Direct canvas interaction with persistent state. |

---

### 8.4. Live Text Editing Architecture (`common/overlay.js`)

1. **Reactive Animation & Interval Pausing (`window.__OSS_IS_EDITING__`)**:
   - Focusing or editing any element with `contenteditable="true"` automatically flags `window.__OSS_IS_EDITING__ = true`.
   - All rotating text timers (such as BRB phrases) pause immediately to ensure elements do not switch or rerender under the user's cursor.
2. **Document-Level Event Delegation**:
   - Click listeners on dynamic rows (`.split-row`, `.phase-item`) are attached via `document.addEventListener('click', e => e.target.closest(...))` to persist across DOM updates.
3. **Persistence & OBS Studio WebSocket Broadcast**:
   - Clicking `💾 Guardar` posts modified texts and active states to `POST /api/overlays/texts` (authenticated via `X-Local-Token`).
   - The backend updates `overlay_texts_config.json` and broadcasts the WebSocket event `overlay_texts_updated` to all open browser sources in OBS Studio.

