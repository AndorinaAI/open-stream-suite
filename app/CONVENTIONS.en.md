# CODE CONVENTIONS, ARCHITECTURE & STRUCTURE STANDARDS
## Open Stream Suite — Modular Overlays, Widgets & Triggers Suite

<p align="center">
  <a href="CONVENTIONS.md">Español</a> | <b>English</b>
</p>

This document defines the official system architecture, folder conventions, and code standards for Open Stream Suite to enable seamless, modular, regression-free development and **Autonomous AI Vibe Coding**.

---

## 1. Core Principles

1. **Small, Modular Modules**:
   - No single file should become an unmaintainable monolith.
   - Target module size: **100 - 400 lines of code**.
   - Each file has a single, well-defined responsibility (Separation of Concerns).
2. **Zero Heavy Frontend Dependencies**:
   - The entire web frontend operates with **Vanilla JavaScript (ES6+), semantic HTML5, and native modern CSS3** (CSS custom properties, glassmorphism, flexbox/grid).
   - Do not introduce complex bundlers or compilers (Webpack, Vite, Tailwind CLI) unless explicitly requested: browser sources and the control panel must load instantly without a build pipeline.
3. **Decoupled Backend and Frontend**:
   - The Python backend exposes REST API endpoints (`/api/...`) and real-time bidirectional WebSocket events (`/ws`).
   - The frontend communicates with the backend through the unified client `alerts/js/api.js`.
4. **OBS Studio Compatibility**:
   - Overlays (`index.html`) must use a transparent background (`background: transparent`), standard 1920x1080 dimensions (or the specific widget size), and prevent scrollbars (`overflow: hidden`).
5. **Zero Regressions**:
   - Every modification must be validated against:
     - The Python server starts cleanly without import errors or port collisions.
     - Core REST endpoints return `200 OK`.
     - Browser console in `panel.html` and overlay pages remains at **0 JavaScript errors**.

---

## 2. Project Directory Map

```text
app/                           # Core project application
├── server.py                  # Server entrypoint (~35 lines)
├── server/                    # Modular Python backend (aiohttp + WebSockets)
│   ├── config.py              # Constants, paths (BASE_DIR, MEDIA_DIR, DONATIONS_CONFIG_FILE)
│   ├── state.py               # Singleton TwitchAlertSystem state coordinator (~127 lines)
│   ├── eventsub.py            # Twitch EventSub WebSocket (Follows, Subs, Bits, Channel Points)
│   ├── irc.py                 # Twitch IRC WebSocket (Chat commands, artists, moderation)
│   ├── app.py                 # create_app() factory and server startup configuration
│   ├── routes/                # Decoupled domain REST controllers & WS handlers
│   │   ├── deck_routes.py     # /api/deck/* (dedicated hardware & macro controller API)
│   │   ├── media_routes.py    # /api/media, /api/upload, /api/media/delete
│   │   ├── overlay_routes.py  # /api/overlays/texts (GET, POST, reset)
│   │   ├── rewards_routes.py  # /api/twitch/rewards (Twitch Helix CRUD)
│   │   ├── themes_routes.py   # /api/themes/* (packs, creation, restoration, chat-anchor)
│   │   ├── webhooks_routes.py # /api/webhooks/* (Ko-fi, PayPal, Buy Me a Coffee, Streamlabs)
│   │   └── widgets_routes.py  # /api/widgets/config (GET, POST, reset)
│   └── services/              # Domain services and business logic
│       ├── actions/           # Widget action dispatchers (Deck, commands, API)
│       │   └── chat_actions.py, goal_actions.py, promo_actions.py, ticker_actions.py, timer_actions.py
│       ├── alerts_service.py      # Core alert triggers and broadcast engine
│       ├── bot_timers_service.py  # Automated periodic chat announcements
│       ├── deck_service.py        # Macro pad orchestrator & hardware mappings
│       ├── donations_service.py   # Unified tips & multi-platform webhook handler
│       ├── media_service.py       # Physical filesystem media management
│       ├── overlay_service.py     # Scene texts configuration and persistence
│       ├── theme_manager.py       # Physical theme directory and file operations
│       ├── theme_service.py       # Theme packs, inheritance, and chat anchor logic
│       ├── triggers_service.py    # Trigger lookups, custom roles, and OBS payloads
│       ├── twitch_service.py      # Helix API communication operations
│       └── widgets_service.py     # Widget configuration presets and schemas
│
├── alerts/                    # Streamer web dashboard & OBS alert engine
│   ├── panel.html             # Streamer control dashboard
│   ├── index.html             # OBS transparent alert & video meme engine (~60 lines)
│   ├── css/
│   │   ├── panel/             # Modular dashboard styles by component (01-08)
│   │   ├── alerts-widget.css  # Dedicated OBS overlay styles
│   │   ├── alerts-themes.css  # Procedural visual alert styles (cyberpunk, neon, etc.)
│   │   └── panel.css          # Unified CSS bundle loader
│   └── js/                    # Decoupled frontend modules
│       ├── alerts-studio/     # Alert customization studio (01-06)
│       ├── media/             # Media explorer (01-06)
│       ├── overlay/           # OBS alert engine runtime (01-04)
│       ├── overlay-texts/     # Scene text editor (01-03)
│       ├── rewards/           # Twitch reward manager (01-03)
│       ├── roles/             # Custom roles & VIP manager (01-04)
│       ├── themes/            # Theme & scene pack manager (01-12)
│       ├── triggers/          # Meme & trigger editor (01-03)
│       ├── widgets-core/      # Mini-App core & donations modal (01-06)
│       ├── api.js             # Unified REST API client (with X-Local-Token)
│       ├── audio.js           # Audio player & Web Audio synthesizer
│       ├── monitor.js         # Interactive 16:9 OBS monitor with drag-and-drop
│       ├── overlay-widget.js  # Self-loading OBS alert engine coordinator
│       └── main.js            # Bootstrap, tab navigation, and polling
│
├── widgets/                   # Modular decoupled widgets (Mini-App + OBS Overlay)
│   ├── timer/                 # Broadcast timer (countdown, stopwatch, pomodoro)
│   │   ├── panel/             # Mini-App submodules (01-06)
│   │   ├── js/                # OBS rendering submodules (render.js, etc.)
│   │   ├── index.html, style.css, widget.js, panel.html
│   ├── chat/                  # Interactive chat overlay with floating emote physics
│   │   ├── panel/             # Mini-App submodules (01-08)
│   │   ├── js/                # Chat submodules (feed, particles, timers)
│   │   ├── index.html, style.css, widget.js, panel.html
│   ├── shoutout/              # Streamer promo & shoutout card
│   │   ├── panel/             # Mini-App submodules (01-08)
│   │   ├── index.html, style.css, widget.js, panel.html
│   ├── goal/                  # Follower, subscriber, and bit target progress bar
│   │   ├── panel/             # Mini-App submodules (01-05)
│   │   ├── index.html, style.css, widget.js, panel.html
│   └── ticker/                # Minimal broadcast ribbon
│       ├── panel/             # Mini-App submodules (01-04)
│       ├── index.html, style.css, widget.js, panel.html
│
├── streamthemes/              # Theme packs & OBS overlays (1920×1080)
│   └── <Pack>/                # pack.json + styles/<theme>/ + overlays/<scene>/
│       ├── overlays/          # Pack scenes (e.g. game/, chill/, screens/, maker/desk/)
│       └── styles/            # Pack themes (style.css + theme.json + .default.*)
│
├── common/                    # Shared design system tokens and runtime libraries
│   ├── overlay/
│   │   ├── editor/            # Floating HUD overlay editor submodules (01-05a)
│   │   ├── editor.js          # In-situ floating HUD coordinator and loader
│   │   ├── dom-injector.js    # Visual config DOM injector for scenes
│   │   ├── backdrop-aperture.js # SVG cutout aperture mask engine for backdrops
│   │   └── icons.js           # Shared SVG icons
│   ├── fonts/                 # Local offline webfonts (WOFF2)
│   ├── fonts.css              # Local @font-face font family declarations
│   ├── catalog.css            # Overlay catalog styling
│   ├── catalog.js             # Responsive catalog logic
│   ├── components.css         # Common UI components
│   ├── i18n.js                # Internationalization engine (ES / EN)
│   ├── overlay.js             # Base runtime for OBS Studio scenes
│   ├── styles.css             # Global CSS variables, 20 physical shapes, and reset
│   └── themes.css             # Live synced theme style definitions
│
├── launcher/                  # Cross-platform desktop launcher (Tkinter)
│   ├── gui.py, server_ctl.py, twitch_ctl.py, updater.py, i18n.py
│   └── tabs/                  # Decoupled tabs (server, twitch, logs, guide)
│
├── assets/                    # Brand identity and visual assets
│   └── imagencorp/            # Logos (SVG/PNG), favicon and screenshots
│
├── languages/                 # Internationalization dictionaries (i18n)
│   ├── es.json, en.json       # Main unified language dictionaries
│   └── *.alerts.json, *.widgets.json, *.overlays.json # Domain dictionaries
│
├── scripts/                   # Deployment assistants and startup scripts
│   ├── iniciar_stream.sh/.bat # Direct desktop launcher
│   ├── iniciar_alertas.sh     # Direct backend server runner
│   ├── iniciar_preview.sh     # Lightweight local preview runner
│   └── setup_cloudflare.sh, setup_vps_tunnel.sh # Tunnel deployment assistants
│
├── tests/                     # Automated unit test suite (unittest)
├── docs/                      # Architectural, setup, and OBS guides
├── index.html                 # Interactive scene catalog (~320 lines)
└── iniciar_stream.sh/.bat     # Backward-compatibility wrappers in app/ root
```

---

## 3. Architecture Extensions

### A. Dual-Layer Widgets ("Mini-Apps")
Each widget inside `widgets/<name>/` implements a two-tier architecture:
1. **OBS Overlay Layer**: Transparent, ultra-lightweight web page rendered in OBS. Listens to WebSocket events (`/ws`) for instant reactions.
2. **Control Dashboard Mini-App Layer (`panel.html`)**: Interactive configuration card with live PiP preview and two editing modes:
   - **Visual Controls**: Sliders, number inputs, color pickers, and toggles.
   - **Code / JSON & CSS Mode**: Direct reactive editing with live syntax validation.

### B. Universal Deck & External Controller API
External hardware and macro tools (Ajazz AKP, Elgato Stream Deck, OpenDeck, Loupedeck, Touch Portal, curl) interact through:
- `GET /api/deck/actions`: Self-documenting list of available hardware commands.
- `GET /api/deck/status`: Server health check.
- `GET /api/deck/trigger?id=<id>`: Fire any alert or video meme.
- `GET /api/deck/timer?action=start|pause|reset&seconds=300`: Timer control.
- `GET /api/deck/theme?theme=<name>`: Switch visual theme across overlays.
- `GET /api/deck/explode?emoji=🎉&count=40`: Screen confetti & emote shower.
- `GET /api/deck/alert?type=follow|sub|raid|cheer`: Test simulated alerts.
- `GET /api/deck/knob?knob=theme|timer|volume&action=next|prev`: Rotary dial control.
- `GET /api/deck/widget?widget=<name>&action=<action>`: One-click widget control.

### C. Modular Themes & Factory Restoration
Themes live in `app/streamthemes/<pack>/styles/<theme>/`:
- `theme.json` & `style.css`: Active theme variables and stylesheet.
- `theme.default.json` & `style.default.css`: Clean factory backups.
- `POST /api/themes/restore`: Reverts user modifications back to original factory defaults with 1 click.

### D. Overlays with Programmed Functions, Draggable Elements & Live Editing

Overlays in Open Stream Suite are dynamic broadcast web apps combining high-end aesthetics with client-side logic:

1. **Native Functional Capabilities in Overlays**:
   - **Stopwatches & Speedrun (`Gamer_Pro_Pack`)**:
     - Interactive stopwatch with split times (`⚡ Split`, `⏮ Prev`, `🔄 Reset`).
     - Split time recording (`.split-time`), delta calculation/toggle (`+` red / `-` green), run title and Personal Best (PB) editing.
     - Keyboard shortcut support (`Spacebar` to record split or pause without interfering with text fields).
   - **Pomodoro & Countdown Timers (`Cozy_LoFi_Pack` and Starting Soon screens)**:
     - Countdowns strictly synchronized millisecond-by-millisecond with progress bars (`.tech-progress-fill`).
     - Quick focus and coffee presets (25m, 50m, 5m, 10m) plus micro-adjustments (`+1m` / `-1m`).
     - Pause/Resume by clicking directly on the large on-screen clock.
   - **Dynamic Project Phase Manager (`Maker_Theme_Pack`)**:
     - Direct phase switching by clicking any bottom bar item (`01 PLAN`, `02 MONTAJE`, etc.).
     - Instant synchronization of `FASE ACTUAL` in the info panel and HUD buttons.
     - `➕` and `🗑️` buttons in the HUD to add or remove project phases in real time.
   - **Dynamic Camera Layouts (`Open_stream_Pack` Podcast)**:
     - Multi-camera HUD switcher (`[2 Cams] [3 Cams] [4 Cams]`) updating the CSS Grid and generating editable guest nameplates.
   - **Direct Canvas Interactions**:
     - Click victory banner (`victory_clutch`) to cycle states (`VICTORY`, `DEFEAT`, `ACE`, `MATCH POINT`).
     - Click stats bar (`gameplay_hud`) to cycle game modes (`COMPETITIVE`, `RANKED`) and FPS (`240`, `144`).
     - Click floating webcam (`desktop_share`) to rotate across the 4 viewport corners.

2. **Golden Rule: All Floating Panels & Menus MUST be Draggable (`makeDraggable`)**:
   - **Non-Obtrusive Guarantee**: Live stream content, cameras, and texts must never be obscured by static floating menus.
   - Every floating control (`#open-stream-suite-screen-hud`, `#oss-countdown-control`, `#oss-speedrun-control`, `#oss-brb-phrases-control`) must be initialized with `makeDraggable(panel, handleSelector)`.
   - **Drag Handle**: Floating windows must include a visual handle (`.hud-drag-handle`) with the `⋮⋮` glyph and `cursor: grab / grabbing`.
   - **Pointer Events**: Standard pointer API (`pointerdown`, `pointermove`, `pointerup`) with `setPointerCapture` and `touch-action: none` ensures seamless cross-device compatibility (mouse, trackpad, touchscreen).
   - Bounds must prevent floating tools from being dragged outside the viewport.

3. **Live Text Editing Architecture (`common/overlay.js`)**:
   - **Exhaustive `editableSelectors` Catalog**: All text elements across all 27 scenes must be indexed for `contenteditable="true"` and populated in the `"🎯 Ir a Texto..."` quick jump dropdown.
   - **Reactive Animation & Interval Pausing (`window.__OSS_IS_EDITING__`)**:
     - When a user focuses or edits text, `window.__OSS_IS_EDITING__` automatically engages.
     - All rotation timers pause so text does not switch underneath the user's cursor.
   - **Document Event Delegation**:
     - Click listeners for active items (`.split-row`, `.phase-item`, `.split-delta`) are attached to `document` via delegation (`e.target.closest(...)`) to survive dynamic re-renders.
   - **Bidirectional Persistence**:
     - Saving collects all modified texts and active states, posting to `POST /api/overlays/texts` with `X-Local-Token` and broadcasting over WebSockets to OBS Studio.
   - **Scene URL Lock (`?lock=1` or `?lockTheme=1`)**:
     - When an OBS browser source needs to stay permanently frozen to specific URL parameters without reacting to global theme or shape changes from the panel or other scenes, add `&lock=1` (or `&lockTheme=1`) to the URL.
     - The overlay engine will freeze the scene to the URL values and safely ignore incoming WebSocket theme/shape switch events.

4. **Backdrop Aperture & Cutouts Engine (`app/common/overlay/backdrop-aperture.js`)**:
   - **OBS Transparency Guarantee**: Allows applying decorative wallpapers, textures, or CSS gradients to overlays without obscuring OBS video capture sources (webcams, gameplay windows, capture cards) underneath.
   - **Dynamic SVG Mask Layer (`#oss-backdrop-aperture-layer`)**:
     - Automatically scans for all viewport elements (`.camera-frame`, `.cam-box`, `.cam-inner-viewport`, `.face-viewport`, `.desk-viewport`, `.stream-frame`, `.pip-cam-box`, `.guest-cam`, `[data-cutout="true"]`).
     - Computes their bounding rects, border-radii (`rx, ry`), or 45° polygonal cuts (`clip-path: polygon(...)`), carving out transparent apertures (`fill="#000000"`) in the SVG mask (`<mask id="oss-aperture-mask">`).
     - Real-time updates: Recalculates apertures upon window resize, responsive scaling, or element dragging.
   - **Radical Pack Visual Differentiation Standards**:
     - **Cozy Lo-Fi**: Warm, organic, analog coffeehouse/botanical aesthetic. **Strictly neon-free**. Soft 28px squircles, Polaroid frames with washi tape, warm paper drop shadows, spinning vinyl player, and Pomodoro focus widgets.
     - **Gamer Pro**: High-intensity tournament esports HUD. 45° chamfers, target reticles `[+]`, live match telemetry (FPS, Ping, K/D, Streak), real Speedrun Split board with gold/green deltas, victory clutch podium.
     - **Maker & Taller**: CAD engineering blueprint and industrial fab lab. Millimeter drafting grid, edge ruler tick marks, registration marks `⌖`, project phases lifecycle bar (`01 PLAN -> 02 BUILD -> 03 TEST`), 3D printing & plotter telemetry.
     - **Open Stream**: Swiss broadcast studio neo-glass. Frosted glassmorphism (`blur(24px)`), stereo audio VU meters (Master L/R), `ON AIR` broadcast indicators, lower-third news ticker, and debate agenda cards.

### H. Universal Semantic Compatibility Contract (`data-oss-*`) & Text Key Isolation
To guarantee that **any new or existing stream pack is 100% interoperable** without authors needing to know the CSS class names of other packs:

1. **Mandatory Semantic Attributes in HTML**:
   - `data-oss-cam="true"`: Identifies a camera frame, window capture, or video viewer.
   - `data-oss-viewport="true"`: The transparent interior cutout area where the OBS video source sits.
   - `data-oss-cam-label="true|bar|bottom"`: Camera label or badge. Use `"bar"` or class `.cam-bottom-bar` for full-width bottom chin bars, preserving their alignment against floating corner tags.
   - `data-oss-panel="true"`: Content cards, chat boxes, project panels, victory podiums, or task lists.
   - `data-oss-bar="top|bottom|left|right"`: Top header bars, lower-third news/status tickers, or side columns.
   - `data-oss-orientation="horizontal|vertical"`: Element orientation. Auto-detected via aspect-ratio (`height > width * 1.05` -> `vertical`, otherwise `horizontal`) and bar position (`top|bottom` -> `horizontal`, `left|right` -> `vertical`), or explicitly set in HTML to orient badges, VU meters, or tickers according to the format.

2. **Fluid Adaptability to Any Camera Aspect Ratio and Catalog of 20 Physical Shapes**:
   - The engine provides 20 universal physical shape archetypes (`data-theme-shape`), grouped into 6 thematic families:
     - **☕ Cozy Lo-Fi & Art**: `cozy_polaroid` (vintage Polaroid frame with washi tape & handwritten caption), `cozy_canvas` (canvas texture with brass pushpins), `cozy_soft` (ultra-soft 28px pill minimalism).
     - **🎮 Gamer Pro & Esports**: `gamer_mecha` (45° chamfered polygon cutout with corner reticles), `gamer_tactical_hud` (military telemetry with LIVE REC badge), `gamer_stealth` (carbon black matte with 8px cut), `gamer_hex_shield` (perimeter Sci-Fi hexagonal armor with ⬡ SHIELD: ACTIVE status), `gamer_cyber_glitch` (asymmetric polygon cuts with cyan/magenta chromatic aberration), `gamer_arcade_retro` (8-bit stepped pixel cabinet with 1UP marquee).
     - **🛠️ Maker & Technical Workshop**: `maker_blueprint` (CAD blueprint grid, angle calipers & ⌖ CALIB: 1:1 crosshairs), `maker_workbench` (industrial studio workbench with ⨁ corner rivets), `maker_circuit_pcb` (emerald PCB board with gold traces and GND vias).
     - **⚡ Open Stream Suite Official**: `openstream_glass` (Swiss neo-glassmorphism with 16px radius & 24px blur), `openstream_studio` (pro broadcast frame with flashing ● ON AIR light).
     - **📜 Fantasy, RPG & Gothic**: `fantasy_parchment` (medieval parchment with crimson wax seal ⚜), `fantasy_runic_stone` (obsidian carved stone with glowing Nordic runes), `gothic_vampire` (Victorian dark gothic arches with blood-red trim & bat emblem 🦇).
     - **💥 Comic, Pop Art & Retro TV**: `comic_manga_action` (bold 5px ink outlines & 💥 GO!! impact badge), `pop_synth_neon` (80s synthwave wireframe horizon with retro sun ☀), `vintage_crt_monitor` (90s curved bubble CRT monitor bezel with POWER LED).
   - Physical shapes rely on relative coordinates (`calc(100% - 24px)`) and corner-anchored pseudo-elements (`top: 6px; left: 6px;`).
   - They automatically support any camera aspect ratio: **16:9** (standard widescreen), **4:3** (retro/classic), **21:9** (ultrawide), or **9:16** (vertical mobile for TikTok, Shorts, and Instagram Reels) without distorted chamfers or displaced corner brackets.

3. **Editable Text Key Isolation (`data-text-key`)**:
   - Each scene must use dedicated key prefixes (e.g., `victory.title`, `cozy.cafeCamLabel`, `speedrun.game`, `art.projectName`, `oss.mainCamLabel`).
   - **Never reuse the same key for elements with different semantics** across scenes (preventing a victory clutch podium from displaying `"MODO JUEGO"` or an art camera from renaming itself `"CHAT EN DIRECTO"`).
   - Keys are synchronized across `overlay_texts_config.json` (Spanish) and `overlay_texts_config.en.json` (English).

4. **Polygonal Geometry Safety Rule against `clip-path`**:
   - Child elements, badges, and pins must never use negative positioning (`top: -12px;`, `bottom: -36px;`) when their container uses `clip-path` or `overflow: hidden`.
   - Always use inward positive insets: `top: 10px; left: 14px;` or layout padding/margins to guarantee full visibility.

5. **On-Demand Non-Obtrusive Floating Panels**:
   - Interactive floating panels (`oss-countdown-control`, `oss-speedrun-control`, `oss-brb-phrases-control`) start hidden by default (`display: none;`) to prevent obscuring side widgets (splits, pomodoro, notes).
   - They are opened and closed on demand via HUD action buttons (`⏱️ Temporizador / Timer`, `⚡ Splits`, `🔄 Frases BRB / BRB Phrases`) or the top-right `✕` close button.

---

## 4. Coding Standards

### Backend (Python):
- **Asynchronous functions**: All route handlers and Twitch listeners must be `async def`.
- **Paths**: Always use `pathlib.Path` referenced relative to `server.config.BASE_DIR`.
- **JSON responses**: `web.json_response({"status": "ok", ...})` or error `web.json_response({"status": "error", "message": "..."}, status=400)`.
- **Naming**: snake_case for functions and variables; CamelCase for classes.

### Frontend (JavaScript):
- **API calls**: Always use `API.<method>()` defined in `alerts/js/api.js`.
- **Internationalization**: Use `i18n.t("key")` for UI strings and `data-i18n="key"` on HTML elements.
- **Error handling**: Clean `try...catch` blocks with non-blocking toast notifications.

### CSS:
- Always leverage design tokens defined in `common/styles.css` (`--color-accent-cyan`, `--color-bg-dark`, `--font-primary`, etc.).
