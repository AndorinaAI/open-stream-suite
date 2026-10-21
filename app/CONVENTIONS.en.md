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
│   ├── config.py              # Constants, paths (BASE_DIR, MEDIA_DIR), Twitch scopes
│   ├── state.py               # Singleton TwitchAlertSystem, WS clients, in-memory state
│   ├── eventsub.py            # Twitch EventSub WebSocket (Follows, Subs, Bits, Channel Points)
│   ├── irc.py                 # Twitch IRC WebSocket (Chat commands, permissions, artists)
│   ├── app.py                 # create_app() factory and server startup configuration
│   └── routes/                # Decoupled REST controllers & WS handlers
│       ├── auth_routes.py     # /auth, /callback (Twitch OAuth2)
│       ├── ws_routes.py       # /ws (WebSockets for OBS & panel)
│       ├── triggers_routes.py # /api/triggers (GET, POST)
│       ├── roles_routes.py    # /api/roles, /api/twitch/mods_and_vips
│       ├── rewards_routes.py  # /api/twitch/rewards (Twitch Helix CRUD)
│       ├── media_routes.py    # /api/media, /api/upload, /api/media/delete
│       ├── actions_routes.py  # /api/test, /api/explode, /api/timer, /api/theme...
│       ├── deck_routes.py     # /api/deck/* (dedicated hardware & macro controller API)
│       └── static_routes.py   # Whitelisted static assets; never exposes app/ root
│
├── alerts/                    # Streamer web dashboard & OBS alert engine
│   ├── panel.html             # Streamer dashboard (clean semantic HTML)
│   ├── index.html             # OBS transparent alert & video meme engine
│   ├── css/panel.css          # Dashboard styling
│   └── js/                    # Decoupled frontend modules
│       ├── api.js             # Unified REST API client (with X-Local-Token)
│       ├── audio.js           # Web Audio API sound synthesizer & player
│       ├── rewards.js         # Twitch channel points reward manager
│       ├── roles.js           # Channel roles and community VIP manager
│       ├── triggers.js        # Trigger configuration and special actions
│       ├── media.js           # Local media manager
│       ├── widgets-core.js    # Widgets modal, Drawer, tabs, and PiP preview
│       ├── widgets-shortcuts.js # Universal shortcuts and macro deck manager
│       ├── widgets.js         # Widgets grid orchestrator
│       └── main.js            # Bootstrap, tab navigation, and polling
│
├── widgets/                   # Modular decoupled widgets (Mini-App + OBS Overlay)
│   ├── timer/                 # Multi-mode broadcast timer
│   ├── chat/                  # Interactive chat overlay with floating emote physics
│   ├── shoutout/              # Streamer promo & shoutout card
│   ├── goal/                  # Follower, subscriber, and bit target progress bar
│   └── ticker/                # Minimal broadcast ribbon
│
├── overlays/                  # OBS Studio scene overlays organized by packs
│   ├── maker/                 # Maker pack (workbench + webcam)
│   ├── print/                 # 3D print/cutter pack (machine + design)
│   ├── game/                  # Gaming pack (gameplay + camera)
│   ├── chill/                 # Just Chatting / community discussion
│   └── screens/               # Stream flow screens (starting-soon, BRB, ending)
│
├── themes/                    # Modular theme packs (theme.json, style.css, factory backups)
├── languages/                 # Multi-language dictionary files (es.json, en.json)
├── common/                    # Shared CSS tokens, local fonts, and i18n engine
└── tests/                     # Automated unit test suite
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
- `GET /api/deck/knob?knob=theme|timer|volume&action=next|prev`: Rotary dial control.
- `GET /api/deck/widget?widget=<name>&action=<action>`: One-click widget control.

### C. Modular Themes & Factory Restoration
Themes live in `themes/<pack>/<theme>/`:
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
