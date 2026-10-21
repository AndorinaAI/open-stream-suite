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

All widgets adhere to 4 core principles:
1. **100% Transparent Background**: `html, body { background: transparent !important; margin: 0; overflow: hidden; }`.
2. **Global CSS Design Tokens**: Link `../../common/styles.css` and `../../common/themes.css`.
3. **Local WebSocket Listener**: Connect to `ws://localhost:8080/ws` for reactive events.
4. **Targeted Viewport Dimensions**: Designed specifically for their OBS source size (e.g. 400×140 for timers, 460×120 for goal bars).

---

## 3. Building a New Modular Widget from Scratch

Create a folder `app/widgets/my-widget/` containing:
- `index.html`: Browser source rendered in OBS.
- `style.css`: Visual styling with CSS variables.
- `widget.js`: WebSocket listeners and animation logic.
- `panel.js`: Interactive controls for the dashboard mini-app.
- `config.json`: Default state and user settings.

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

