> **Abridged translation.** This English version is a summary. The canonical, complete guide is [Español](GUIA_DESARROLLO_Y_TEMAS.md).

> **Port:** example URLs use `8080`; replace it if you change `SERVER_PORT`.

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
| **Disk Size & Memory** | 10 MB to 80 MB per scene (video loops / raster layers). | Lightweight shared bundle (~200 KB cached for entire suite). Instant load. |
| **OBS CPU Usage** | Continuous video decoding overhead. | Zero background video decoding. Direct GPU-accelerated vector Chromium rendering. |
| **Sharpness** | Scaling bitmaps causes pixelation or blurring. | Scalable SVG and CSS that render razor sharp at 1080p, 1440p, or 4K. |
| **Interactivity** | Static. Changing text requires reopening Photoshop. | **100% dynamic**: edit text in HUD/panel and all scenes update live. |
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
├── streamthemes/              # Modular theme packs for overlays and styles
│   ├── Cozy_LoFi_Pack/        # Lo-Fi scenes, Pomodoro, Art Dual Cam, and styles
│   ├── Gamer_Pro_Pack/        # Gameplay HUD, Speedrun, Victory Clutch, and styles
│   ├── Maker_Theme_Pack/      # Workshop scenes (desk, pc, print, chill, game) and styles
│   └── Open_stream_Pack/      # Just Chatting, Desktop Share, Podcast, and styles
│
├── common/                    # Shared design system tokens & runtime
│   ├── overlay/               # Submodules: editor/ (01-05a), dom-injector.js, backdrop-aperture.js, icons.js
│   ├── fonts/                 # Local offline webfonts (WOFF2)
│   ├── components.css, fonts.css, i18n.js, overlay.js, styles.css, themes.css
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

### 4.1. Component skins: one convention, every component

**Goal:** a widget or an alert is written **once**, with its base look, and then adopts **whatever appearance is assigned to it** with no extra CSS. A new theme **only declares tokens**: its style reaches scenes, widgets and alerts automatically, and it shows up on its own in the panel menus (the catalogue and the archetype map are derived from disk).

`common/oss-skin.css` (shared layer) plus `common/oss-skin.js` (resolves the theme archetype from the `themeArchetypes` map the server publishes in `config.js`) make it possible.

| Token | Declared in | What it controls in components |
| :--- | :--- | :--- |
| `--skin-panel-radius`, `--skin-panel-clip` | `common/styles.css` (per archetype) | Panel radius and clip while no physical shape is selected |
| `--skin-panel-decor` (+ `-position`, `-size`, `-repeat`) | `common/styles.css` (per archetype) | Corner marks / technical decoration, painted with `background` |
| `--skin-scene-pattern` (+ `-position`, `-size`) | `streamthemes/<Pack>/styles/<theme>/style.css` | Pack SCENE texture (e.g. the Maker blueprint grid): painted on the scene background, never on components |
| `--frame-border-width`, `--frame-border-style`, `--color-border-cyan`, `--panel-shadow`, `--theme-glow` | theme | Card frame, glow and shadow |
| `--skin-font-display`, `--skin-badge-radius` | `common/styles.css` (per archetype) | Typography for badges and titles marked with `data-oss-badge` / `data-oss-panel-title` |

**Component contract** (all a component author must do):
1. Mark its root with `data-oss-shape-target` or `data-oss-panel="true"`.
2. Link `common/oss-skin.css` and `common/oss-skin.js`.
3. Nothing else: it never needs to know about any pack or theme.

**Priority** (highest first): physical shape (`body[data-theme-shape]`) → archetype skin → component base look. **With no theme assigned not a single rule applies**, so every component keeps its original look.

> **About `!important`**: `common/oss-skin.css` uses it only on frame and decoration, because several widgets apply their look through injected CSS or inline styles and, without it, the assigned appearance was lost. The radius (`--skin-panel-radius`) **never** uses it: the physical shape always wins. Covered by `tests/test_component_skin_contract.py`.

**Adding a new appearance (checklist)**
1. Create `streamthemes/<Pack>/styles/<theme>/theme.json` and `style.css` with its tokens.
2. Declare the pack archetype (`pack.json → "archetype"`) or let it be inferred from the name.
3. Nothing else: it appears in the menus (scenes, widgets and alerts) and its appearance applies to every component **at once**. There are no lists to edit.

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
| **Gamer Pro (`gamer_speedrun`, dir `speedrun_split/`)** | Interactive stopwatch with milliseconds, split recording, delta tracking (`+` / `-`), keyboard `Space` toggle. | Draggable `#oss-speedrun-control` with `[▶/⏸ Start]`, `[⚡ Split]`, `[⏮ Prev]`, `[🔄 Reset]`. |
| **Lo-Fi / Synthwave (`cozy_starting`, `oss_starting`, `gamer_starting`)** | Countdown timer synced with `.tech-progress-fill`. Direct clock click to pause/resume. | Draggable `#oss-countdown-control` with Pomodoro/Coffee presets (25m, 50m, 5m, 10m) and `±1m` steps. |
| **Maker Desk (`maker-desk`)** | Interactive workshop stage manager. Clicking `01 PLAN`, `02 MONTAJE`, etc. highlights phase and updates active status. | HUD with dynamic phase switching, `➕ Add Phase` and `🗑️ Delete Phase`. |
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
   - The backend updates `overlay_texts_config.json` and broadcasts the WebSocket event `overlay_texts_update` to all open browser sources in OBS Studio.

---

### 8.5. Step-by-Step: Creating a New Overlay with Interactive Logic

1. **HTML Structure with Universal Semantic Contract**:
   Include standard stylesheets and apply semantic `data-oss-*` attributes so the engine automatically manages borders, shapes, and cutouts:
   ```html
   <link rel="stylesheet" href="../../../common/themes.css">
   <link rel="stylesheet" href="style.css">
   ...
   <!-- Camera frame compatible with all physical shapes -->
   <div class="camera-frame" data-oss-cam="true">
     <div class="cam-viewport" data-oss-viewport="true"></div>
     <div class="cam-label" data-oss-cam-label="true">
       <span data-text-key="my_scene.camLabel">PRIMARY CAMERA</span>
     </div>
   </div>

   <!-- Interactive card with isolated editable text -->
   <div class="interactive-card" data-oss-panel="true" id="my-custom-widget">
     <div class="widget-header">
       <span class="widget-title" data-text-key="my_scene.title">SESSION STATUS</span>
       <span class="badge" data-text-key="my_scene.badge">ACTIVE</span>
     </div>
     <div class="counter-display" id="session-counter">00:00</div>
   </div>
   <script src="../../../config.js"></script>
   <script src="../../../common/overlay.js"></script>
   ```

2. **Text Key Isolation (`data-text-key`)**:
   - Always prefix keys with a unique scene namespace (e.g., `my_scene.title`, `my_scene.camLabel`).
   - `dom-injector.js` and `05a-extract-texts.js` automatically parse all `[data-text-key]` elements for live on-canvas editing and persistent synchronization with `POST /api/overlays/texts`.

3. **Draggable Control Menus**:
   If your overlay includes an interactive floating HUD, build it with a `.hud-drag-handle` header, initialize it hidden (`display: none;`), and invoke:
   ```javascript
   makeDraggable(document.getElementById('my-custom-control'), '.hud-drag-handle');
   ```

4. **Configuration Synchronization**:
   Define keys in `overlay_texts_config.json` and `overlay_texts_config.en.json` to persist texts, active states, and custom flags.

---

### 8.6. Universal Semantic Compatibility Contract (`data-oss-*`) & Aspect Ratio Fluidity

To ensure total decoupling between scenes and themes:

1. **Mandatory Semantic Attribute Specifications**:
   - `data-oss-cam="true"`: Primary camera or video capture container.
   - `data-oss-viewport="true"`: Transparent inner window for OBS video sources and SVG mask cutout engine.
   - `data-oss-cam-label="true|bar|bottom"`: Camera label or badge element. Use `"bar"` or class `.cam-bottom-bar` for full-width bottom chin bars.
   - `data-oss-panel="true"`: Content cards, chat boxes, stats, or split lists.
   - `data-oss-bar="top|bottom|left|right"`: Top headers, bottom news/status tickers, or side columns.
   - `data-oss-orientation="horizontal|vertical"`: Element orientation (auto-detected via aspect-ratio or bar position, or explicitly declared in HTML).
   - `data-text-key="section.field"`: Isolated text key for live on-canvas editing and persistent broadcasting.

2. **URL Control Query Parameters for OBS Studio**:
   - `?theme=<id>`: Force a specific color theme (e.g. `?theme=cyberpunk`).
   - `?shape=<id>`: Force one of the 20 physical shapes (e.g. `?shape=gamer_mecha`).
   - `?lock=1` or `?lockTheme=1`: Permanently freezes the scene in OBS Studio to the URL values, ignoring incoming global WebSocket theme changes.
   - `?lang=en` or `?lang=es`: Reserved — only the `/api/overlays/texts` endpoint honours it; scenes do not apply it yet.

3. **Fluid Adaptability across Camera Aspect Ratios and Catalog of 20 Physical Shapes**:
   - The engine provides 20 universal physical shape archetypes (`data-theme-shape`), grouped into 6 families:
     - **☕ Cozy Lo-Fi & Art**: `cozy_polaroid`, `cozy_canvas`, `cozy_soft`.
     - **🎮 Gamer Pro & Esports**: `gamer_mecha`, `gamer_tactical_hud`, `gamer_stealth`, `gamer_hex_shield`, `gamer_cyber_glitch`, `gamer_arcade_retro`.
     - **🛠️ Maker & Technical Workshop**: `maker_blueprint`, `maker_workbench`, `maker_circuit_pcb`.
     - **⚡ Open Stream Suite Official**: `openstream_glass`, `openstream_studio`.
     - **📜 Fantasy, RPG & Gothic**: `fantasy_parchment`, `fantasy_runic_stone`, `gothic_vampire`.
     - **💥 Comic, Pop Art & Retro TV**: `comic_manga_action`, `pop_synth_neon`, `vintage_crt_monitor`.
   - Physical shapes rely on relative `calc(100% - 24px)` coordinates and corner-pinned pseudo-elements (`top: 6px; left: 6px;`).
   - They fluidly accommodate 16:9 widescreen, 4:3 retro, 21:9 ultrawide, and 9:16 vertical mobile layouts (TikTok / Shorts) without distorted chamfers or displaced brackets.

4. **Polygonal Geometry Safety against `clip-path`**:
   - When using angular polygonal shapes (`gamer_mecha`, `gamer_tactical_hud`), child elements must never use negative positioning (`top: -12px;`, `bottom: -36px;`).
   - Always use inward positive insets (`top: 10px; left: 14px;`) or layout padding to guarantee full visibility.

5. **On-Demand Non-Obtrusive Floating Panels**:
   - Auxiliary floating panels (`oss-countdown-control`, `oss-speedrun-control`, `oss-brb-phrases-control`) start hidden (`display: none;`) to prevent obscuring side widgets (splits, pomodoro, notes).
   - They toggle open and closed via HUD toolbar buttons (`⏱️ Timer`, `⚡ Splits`, `🔄 BRB Phrases`) or the top-right `✕` close button.

---

### REST API Endpoints Reference

#### Themes API
| Method | Route | Description | Payload / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/themes/packs` | Returns all packs, modular themes, and `overlayThemes` mapping. | — |
| `POST` | `/api/themes/packs/create` | Creates a new pack folder in `streamthemes/<pack_id>/`. | `{"name", "icon", "badge", "description"}` |
| `POST` | `/api/themes/create` | Creates a new modular theme within a pack. | `{"packId", "name", "accentCyan", ...}` |
| `POST` | `/api/themes/save` | Saves CSS to disk and recompiles `common/themes.css`. | `{"packId", "id", "css", ...}` |
| `POST` | `/api/themes/restore` | ↺ Restores a theme to factory defaults (`theme.default.json`). | `{"packId", "themeId"}` |
| `POST` | `/api/themes/overlay-assignment` | Assigns a visual theme or physical shape to a specific overlay. | `{"overlayKey", "themeId", "shapeId"}` |
| `POST` | `/api/themes/apply` | Globally activates a visual theme for all OBS sources. | `{"theme", "pack"}` |
| `POST` | `/api/themes/apply-shape` | Globally activates one of 20 physical shapes for all scenes. | `{"shape": "maker_blueprint"}` |
| `POST` | `/api/themes/backdrop` | Persists and broadcasts decorative backdrop selection. | `{"overlayKey", "backdrop"}` |
| `POST` | `/api/themes/chat-anchor` | Toggles chat anchoring to active theme or enables custom chat fork. | `{"packId", "themeId", "anchored"}` |

#### Fusions API
| Method | Route | Description | Payload / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fusions` | Lists all configured overlay fusions. | — |
| `POST` | `/api/fusions` | Creates or updates a hybrid fusion of scenes. | `{"id", "name", "badge", "overlays", "defaultTheme", "defaultShape"}` |
| `GET` | `/api/fusions/{id}` | Retrieves a single fusion by ID. | — |
| `DELETE` | `/api/fusions/{id}` | Deletes a fusion by ID. | — |
| `POST` | `/api/fusions/{id}/apply-theme` | Batch applies a visual theme to all scenes in the fusion. | `{"themeId": "cyberpunk"}` |
| `POST` | `/api/fusions/{id}/apply-shape` | Batch applies a physical shape to all scenes in the fusion. | `{"shapeId": "gamer_mecha"}` |

#### Widgets & RSS Feed API
| Method | Route | Description | Payload / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/widgets/config` | Unified dictionary with all widgets configuration. | — |
| `POST` | `/api/widgets/config` | Saves global widgets configuration. | JSON configuration object |
| `GET` | `/api/widgets/{widget}/config` | Retrieves config for a specific widget (chat, goal, timer, promo, ticker). | — |
| `POST` | `/api/widgets/{widget}/config` | Saves config for the specified widget. | Widget settings object |
| `GET/POST` | `/api/widgets/action` | Executes widget actions (chat, goal, timer, promo/shoutout, ticker). | `?widget=...&action=...` |
| `GET` | `/api/rss/feed` | Parses RSS (<channel><item>) and Atom (<feed><entry>) feeds. | `?url=https%3A%2F%2F...` |

#### Hardware Decks API (`/api/deck/*`)
| Method | Route | Description | Parameters (Query or JSON) |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/deck/status` | System health check (active theme, pack, timer, overlays). | — |
| `GET/POST` | `/api/deck/trigger` | Triggers a sound/meme trigger by ID in OBS. | `?id=trigger_id` (`&user=Name`) |
| `GET/POST` | `/api/deck/theme` | Switches visual theme globally or per scene. | `?id=cyberpunk` (`&pack=Gamer_Pro_Pack`) |
| `GET/POST` | `/api/deck/timer` | Controls the countdown/stopwatch timer. | `?action=start\|pause\|reset` (`&seconds=300`) |
| `GET/POST` | `/api/deck/alert` | Triggers a simulated test alert in OBS. | `?type=follow\|sub\|raid\|cheer` (`&user=Name&amount=...`) |
| `GET/POST` | `/api/deck/explode` | Triggers an emote/confetti screen shower. | `?emoji=🎉&count=40` |
| `GET/POST` | `/api/deck/widget` | Direct 1-click control over widgets. | `?widget=promo\|goal\|ticker\|chat&action=...` |
| `GET/POST` | `/api/deck/knob` | Hardware rotary dials, knobs, and encoders. | `?knob=timer\|theme\|goal\|fx&action=rotate\|next\|prev&ticks=1` |
| `GET` | `/api/deck/actions` | Self-documenting JSON catalog with all triggers and themes. | — |

---

## 9. Pack Scene Unification: Geometric Physical Archetypes and Hybrid Fusions

### 9.1. Decoupling Geometric Archetypes from Color Themes
To allow scenes from different packs to coexist smoothly and be combined into custom **Fusions** without losing their distinct brand identity, the architecture strictly separates the **physical frame geometry** from the **color palette**:

1. **Physical Geometric Archetypes (`data-pack`)**:
   Automatically set on `document.body.dataset.pack` by `common/overlay.js`:
   - `body[data-pack="cozy"]`: Enforces soft rounded camera frames (`--cozy-frame-radius: 28px`), polaroid badges, and pill tags (`50px`).
   - `body[data-pack="gamer"]`: Enforces 45° chamfers and polygonal cuts (`clip-path: polygon(...)`), sci-fi HUD badges, and esports bevels.
   - `body[data-pack="maker"]`: Enforces technical corner brackets, millimeter metric scale accents, and monospace technical fonts.
   - `body[data-pack="oss"]`: Clean, straight translucent frames.

2. **Color Palette Themes (`.theme-<id>`)**:
   Defined in `common/themes.css`. They govern purely color design tokens (`--color-bg`, `--color-accent`, `--color-border`, etc.).
   This allows any scene (e.g. Maker workshop or Cozy study) to adopt color themes like `synthwave`, `neon_glow`, `matrix`, or `candy` without altering its physical shape.

### 9.2. Total Harmony with Hybrid Fusions
**Fusions** (`⚡ Fusiones de Overlays` tab) allow streamers to group scenes from completely different packs (e.g. Cozy Lo-Fi chat + Maker desk + Gamer victory) into a single pack collection:
- Applying a batch theme (`POST /api/fusions/{id}/apply-theme`) applies a unified color palette to all scenes in the fusion.
- Each scene retains its physical frame archetype thanks to `data-pack`.
- Zero CSS conflicts and zero geometric distortions!

### 9.3. Preventative Pack Backups
All original stream packs in their pre-unification state are safely archived in:
`backups/packs_backup/`
Including snapshots of `Cozy_LoFi_Pack`, `Gamer_Pro_Pack`, `Maker_Theme_Pack`, `Open_stream_Pack`, and `themes_state.json`.

### 9.4. Multi-Style On-Screen Chat Links for OBS
The chat widget provides a dedicated profile manager under **🔗 Enlaces OBS por Estilo**:
- Add separate Browser Source URLs in OBS Studio for different scenes using `?profile=<id>` (e.g. `?profile=cozy_lofi`, `?profile=gamer_pro`, `?profile=maker_glass`).
- Any updates made in the visual editor synchronize reactively to OBS in real time.

### 9.5. Universal Backdrop Aperture & Cutout Engine
The `common/overlay/backdrop-aperture.js` module (`window.OSSAperture`) allows streaming scenes to display rich decorative backdrops (carbon fiber, botanical textures, gradient patterns, custom images) **without obscuring OBS capture layers** (facecams, game capture, screen shares):
- **Dynamic SVG Mask**: Using `<mask id="oss-aperture-mask">`, the engine calculates in real time the bounding rects (`getBoundingClientRect`), corner radii (`border-radius`), and polygonal cutouts (`clip-path`) of all camera/game containers (`[data-cutout="true"]`, `[data-oss-cam]`).
- **Per-Scene Persistence**: Backdrop selections are saved via `POST /api/themes/backdrop` and persisted in `themes_state.json` under `"backdrops"`.
- **Live WebSocket Broadcast**: Selecting or resetting a backdrop in the floating HUD immediately broadcasts `overlay_backdrop_change` to all connected OBS Studio sources.

### 9.6. Smart Auto Mode and Per-Scene Text Isolation (`customScenes`)
1. **Smart `auto` Mode for Physical Shapes**:
   - **Native Scene**: When an active theme belongs to the scene's native pack (e.g. Maker theme on Maker Desk), `auto` preserves the handcrafted original frame (`effectiveShape = 'original'`).
   - **Cross-Pack Crossover**: When a cross-pack theme is applied (e.g. Gamer Pro theme on Maker Desk), `auto` adopts the signature archetype shape (`cozy_polaroid`, `gamer_mecha`, `maker_blueprint`, `openstream_glass`).
2. **Surgical Per-Scene Text Isolation (`customScenes`)**:
   - To prevent editing shared text keys (like `beRightBack.title` or `startingSoon.title`) from unintentionally modifying other packs, hot-edited texts from non-maker scenes are saved under `texts.customScenes[sceneKey][key]` in `overlay_texts_config.json`.
   - `dom-injector.js` prioritizes scene-specific overrides before falling back to generic keys, providing complete text isolation and allowing individual scene text resets.



