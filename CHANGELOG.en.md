# Changelog

<p align="center">
  <a href="CHANGELOG.md">Español</a> | <b>English</b>
</p>

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1-alpha] — 2026-10-23

### Fixed — Architectural Audit and Critical Fixes
- **Server WebSocket (NameError)**: Resolved critical error caused by uninitialized `data` variable in `app/server/routes/ws_routes.py`. Incoming WebSocket text messages are now safely parsed without breaking the connection.
- **Theme State & Scene Assignment Persistence**: `save_theme_state()` now safely merges the existing state in `themes_state.json`, preventing accidental wipeouts of scene assignments (`overlayThemes`, `overlayShapes`, and `backdrops`) when applying global packs or shapes.
- **Overlay HUD Local Authentication**: Added missing `X-Local-Token` header in all POST requests for theme and shape assignments and text resets from the HUD (`04-phrases-theme.js` and `05-inline-editor.js`), resolving silent 403 Forbidden errors.
- **Quick Test Buttons in Control Panel**: Implemented and globally exposed in `api.js` the functions `sendAlertTest`, `sendCustomAlertTest`, and `syncGoalWithTwitch`, eliminating console `ReferenceError`s.
- **Physical Shapes in Fusions**: Added persistence in backend (`fusions_service.py`) for `defaultShape`, and integrated the shape selector into the Fusion editor modal in `panel.html` and `13-fusions.js`.
- **Live Shape Preservation**: `overlay.js` preserves active physical shapes (`activeShape`) upon receiving WebSocket events `theme_change` and `overlay_theme_change`, preventing global theme color changes from resetting shapes back to `original`.
- **Persistent Backdrop Aperture Engine**: Created endpoint `POST /api/themes/backdrop` and persistence service for the SVG cutout backdrop engine `window.OSSAperture`, with real-time WebSocket sync via `overlay_backdrop_change`.
- **Per-Scene Text Isolation**: `collectSceneTexts` and `dom-injector.js` isolate non-maker custom scene text modifications under `customScenes[sceneKey]`, preventing cross-pack collisions on shared keys (`beRightBack.title`, etc.).
- **Surgical Text Restoration**: Updated `restoreSceneTexts` and `OverlayTexts.reset` to forward `sceneKey`, resetting only the chosen scene's texts without wiping the entire stream.
- **Active Design Tokens**: Connected `--theme-glow`, `--panel-radius`, and `--panel-clip-path` in `common/styles.css` for active rendering on camera frames and panels in OBS.
- **Synchronization of overlay_texts_config.en.json**: Filled the 18 missing English keys and added support for serving localized texts via `?lang=en`.
- **Cozy Lo-Fi Pack Palette Synchronization**: Synchronized all 6 color values (`accentCyan`, `accentOrange`, `bgDark`, `panelBg`, `textDim`, `textLight`) in `theme.json` and `theme.default.json` for all 5 Cozy themes to match their actual CSS.
- **Cleaned Legacy Ghost Defaults & Orphan Keys**: Replaced ghost defaults (`pack_open_stream_suite`, `maker_electronico`) with canonical IDs (`Maker_Theme_Pack`, `maker`), and cleaned orphan entries in `themes_state.json`.
- **Scene Modal Shape Selector**: Added physical frame shape selector to the scene editor modal in `panel.html` and wired it in `11-scene-editor.js`.
- **Pre-Start Update Check**: When auto-opening the panel on server startup is enabled, the launcher queries for new updates and prompts the user whether to update immediately or start the server and update later.
- **Native RGBA Transparent Icons**: Re-rendered all PNG icons (32, 64, 128, 256, and 512px) with full alpha channel (`RGBA`), removing solid white background and edge artifacts (JPG effect) across taskbar and tray.
- **Linux Taskbar Integration (Gear Icon Fix)**: Configured window class `StartupWMClass=openstreamsuite`, initialized Tkinter with `className="openstreamsuite"`, and loaded persistent multi-resolution icon photos, enabling GNOME Shell, Ubuntu Dock, and KDE to display the official logo instead of the fallback gear icon.
- **Resilient Updater (Git Reset & Config Preservation)**: Re-engineered `apply_update()` in `updater.py` to auto-backup and seamlessly merge user configurations (`themes_state.json`, `fusions.json`, texts, widgets) with clean Git synchronization, resolving dirty tree conflicts.
- **Python 3.12 Compatibility**: Replaced deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)`.

## [1.0.0-alpha] — 2026-10-21

### Changed — Comprehensive Modular Architecture Refactor
- **Modular Backend (`app/server/`)**: Routes completely decoupled into `server/routes/` and business logic into `server/services/`, with transparent backward-compatibility re-exports in `server/*.py`.
- **Alerts Overlay (`app/alerts/`)**: `alerts/index.html` reduced to ~60 lines with styles extracted to `css/alerts-widget.css` and dedicated engines in `js/overlay/` (audio synth, canvas particles, alert queue, WebSocket client).
- **Decoupled Widgets (`app/widgets/`)**: Every widget now follows a standardized two-layer architecture with submodules in `widgets/<widget>/panel/` (Mini-App controls) and `widgets/<widget>/js/` (OBS runtime), with `panel.js` serving as an auto-loading loader shim.
- **Scene Catalog (`app/index.html`)**: Extracted `common/catalog.css` and `common/catalog.js` with responsive ResizeObserver logic.
- **Directory Layout & Scripts**: Deployment assistants and tunnel scripts organized into `app/scripts/` with wrapper entry points preserved in `app/` root.
- **Zero Breakage**: 100% backward compatibility preserved across OBS Studio browser sources, Stream Deck macro pads, and web panels.

### Added — Full Internationalization (i18n)
- Complete English translation of the entire control panel: headers, tabs, buttons, labels, modals, dropdowns, floating/emerging panels (widget mini-apps), toasts, and `alert()` / `confirm()` dialogs.
- Live dynamic translation: DOM inserted by JavaScript (modals, rendered lists, select options) is re-translated automatically when the language changes.
- Toasts and error messages translated even when they contain variables (`${user}`, `{branch}`), via placeholder-segmented translation.
- Panel links to `.md` guides now point to their `.en.md` sibling when the active language is English (including pairs with different filenames: `INSTALACION_E_INICIO.md` ↔ `INSTALLATION_AND_STARTUP.md`).
- Bilingual docs: every link to another `.md` now includes its English version (`[English](….en.md)`), and every `.en.md` its Spanish sibling.
- Desktop launcher: startup guide, dialogs, and status messages now wired to the dictionary (`languages/es.json` / `languages/en.json`) with live refresh on language change.
- Panel translation dictionary expanded from 378 to over 1,650 Spanish→English pairs, verified against the real DOM (panel, mini-apps, modals, dropdowns, toasts and dialogs).
- The user's own content (trigger titles, saved theme descriptions, presets) is left untranslated: only the interface is translated.

## [1.0.0-alpha] — 2026-10-20

Initial public alpha release.

### Highlights
- OBS Studio broadcast scenes and overlays with modular theme packs (and 1-click factory reset per theme).
- Modular on-screen widgets: chat with emote physics, goal bar, shoutout card, ticker ribbon, and multi-mode timer.
- Live alerts, triggers, and rewards suite powered by a local backend server (aiohttp + WebSockets, Twitch EventSub & IRC).
- Web-based streamer control panel with embedded architecture and theme creation guides.
- Physical macro deck integrations: Ajazz AKP05 (10 LCD keys + touch strip + 4 knobs), AKP153/03/846, Elgato Stream Deck, OpenDeck, and Bitfocus Companion via the `/api/deck/*` API.
- Cross-platform desktop application featuring system tray minimization, server monitoring, and Twitch account management.
- Automated installers (`installers/`) and 1-click root startup scripts for Linux, Windows, and macOS.
- Update check system with branch switching (`main` or `dev`), visual notifications in panel and launcher, and `actualizar.sh` / `actualizar.bat` scripts.
- Multi-language support with `languages/` dictionaries (Spanish and English) across documentation, web panel, desktop app, and widgets.
- Project structure: `app/` (core app), `plugins/` (deck integration), `imagencorp/` (brand identity & live screenshots), and `languages/` (localization).

### Security
- The backend binds to `127.0.0.1` by default. Exposing to the local network requires `SERVER_HOST` and `DECK_TOKEN` is strongly recommended.
- Static assets are strictly whitelisted; root files containing `.env`, `token.json`, and `.local_token` are completely blocked from HTTP access.
- `/api/deck/*` rejects cross-site web requests and supports optional `DECK_TOKEN` headers.
- The local panel authentication token is strictly issued to local loopback clients (never to external proxies or tunnels).

### Known Limitations
- Primary development and testing environment is Linux. Windows and macOS support are **experimental** (developed according to community feedback).
- The license (CC BY-NC-SA 4.0) restricts commercial monetization and requires ShareAlike reciprocity; applied with retroactive effect across all commits.
