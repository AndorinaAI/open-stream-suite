# Changelog

<p align="center">
  <a href="CHANGELOG.md">Español</a> | <b>English</b>
</p>

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2-alpha] — 2026-10-26

Full audit round (**V2 + V3**), physical shape engine for widgets and alerts, native theme integration, dual AGPL/commercial licence, no Google Fonts CDN dependency and up-to-date i18n. Closed findings: `app/docs/AUDITORIA_WEBAPP_V3.md` and `app/docs/TAREAS_PRIORIZADAS_V3.md`.

### Fixed — English scenes (`?lang=`)

- A scene's `?lang=en` parameter now really reaches the texts: `common/overlay.js` requests `/api/overlays/texts?lang=…` (it used to request it without a language, so the scene stayed in Spanish) and takes the language from `?lang=` or from the one selected in the panel (`oss-lang`). A live `overlay_texts_update` event no longer reverts an English scene (it re-fetches its own language).
- **Regression**: new `tests/test_overlay_lang_param.py` suite (4 tests: ES/EN over the API, unknown language → default, and the client contract).

### Cleanup — Dead panel reference (V3-07)

- Removed the `overlays-btn-back-folders` lookup in `09-overlay-folders-render.js`: the id does not exist and the real "⬅️ Back to folders" button lives inside `overlays-folder-details-view`, so it is hidden along with the container without extra logic.
- **Regression**: new `tests/test_panel_dead_refs.py` suite (2 tests: no **code** reference to the dead id — comments are ignored — and the button kept inside the details container).

### Fixed — No internal detail leaks and malformed JSON handling (V3-05, V3-08)

- **V3-05 (no leaking internals)**: new `server/routes/errors.py` module with `internal_error_response()` / `internal_error_text()` / `invalid_json_response()`. The **12 500 responses** that returned `str(e)` (fusions ×4, rewards ×3, webhooks ×4, themes ×1) now log the detail internally and reply **"Error interno del servidor"**; for public webhooks the message no longer leaves the machine. The rewards query without Twitch also returns a generic message.
- **V3-08 (bad payload)**: `await request.json()` is now guarded in rewards (create/update/delete), tip simulation and the Ko-fi/BMC/PayPal webhooks → **400 "Payload JSON inválido"** instead of 500; a reward `cost` is validated (non-numeric or `< 1` → 400). The legitimate **tolerant** patterns of the deck and update endpoints (query-param fallback) are kept and explicitly distinguished by the test.
- **Regression**: new `tests/test_error_disclosure_contract.py` (3 tests, including an **AST** analysis requiring that no `request.json()` read can end in a 500) and `tests/test_json_payload_errors.py` (6 runtime tests). Full battery: **20 suites green**.

### Fixed — Component accessibility and read-only theme catalog (V3-02, V3-04)

- **V3-02 (accessibility)**: each component's three `<select>`s (theme, shape and fusion) now carry an `aria-label` with the component name, so do the Apply/Reset/➕ buttons, and a visible **column header** row was added (Component · Theme · Shape · Apply · Reset · Fusion) with the new `widgets.col_*` i18n keys in ES and EN.
- **V3-04 (reads must not write)**: `GET /api/themes/packs` **no longer rewrites** `common/themes.css`. The `streamthemes/` bootstrap is idempotent (once per process) and CSS recompilation is decided by freshness (`themes_css_is_stale()`), so manually added themes are still picked up without writing on every request. Measured: **3 GETs → 0 recompilations** and untouched `mtime` (previously 3 recompilations).
- **Regression**: new `tests/test_component_a11y.py` (4 tests) and `tests/test_themes_read_only.py` (5 tests).

### Fixed — Real scene counters (V3-03)

- Panel texts and batch confirmations no longer hardcode a scene count: the section subtitle **drops the "9"** ("each of your broadcast screens") and the confirmations (`confirm_apply_all`, `confirm_restore_all_scenes_texts`, `confirm_restore_all_scenes_themes`) use the **`{count}`** parameter in all four ES/EN dictionaries.
- The three JS callers now pass `count: window.OSS_SCENES.length`, and the per-folder scene badge no longer starts with a fixed "9". The Maker pack descriptions ("...with 9 ready screens") are kept on purpose: they describe its 9 real scenes.
- **Regression:** new `tests/test_i18n_scene_count.py` suite (4 tests).

### Changed — Dual licence (AGPL-3.0 + commercial) and mandatory CLA

- **The public licence moves from CC BY-NC-SA 4.0 to GNU AGPL v3.0 or later**: the project is now **free software** (OSI/FSF recognised), so it can be distributed through repositories and distributions that require free licences, with no ambiguity about internal use, SaaS or embedding.
- **New paid commercial licence** (`LICENSE-COMMERCIAL.en.md`, ES/EN): lets companies and agencies use, integrate or embed the software **without publishing their code** (white-labelling, hosted service, redistribution, support). Contact: **admin@andorina.dev**.
- **Mandatory CLA for contributions** (`.github/CLA.en.md`, ES/EN): every contribution grants the Licensor enough rights to **relicense** the project (legal basis of the dual-licence model). Template added to the PR template; a PR without a signature is not merged.
- **Trademark policy** (`TRADEMARK.en.md`): the name, logo and visual identity are covered by neither licence; white-labelling requires authorisation.
- **Third-party notices** (`NOTICE.en.md`): the **15 OFL typeface families** with their copyright notices and reserved names (Comfortaa, Orbitron, Press Start 2P, Quicksand, Share Tech Mono), full licence texts in `app/common/fonts/LICENSES/`, and the Python dependency licences (including `pystray` and `python-xlib`, LGPL).
- **Historical note:** versions published before **2026-10-26** were released under CC BY-NC-SA 4.0; copies already delivered to third parties keep those terms.

### Fixed — WebApp Audit V3 (V3-01, V3-06)

- **Real XSS in theme, pack and fusion metadata (V3-01)**: `name`, `badge`, `desc` and `icon` were stored unvalidated and rendered with `innerHTML`, allowing JavaScript execution on the same origin as `/api/local-token` (reproduced during the audit). New `sanitize_metadata_text()` sanitizer in `server/services/validation_utils.py` (rejects `<`/`>`, strips control characters, collapses whitespace and caps length) applied in `create_pack_service`, `create_theme_service`, `save_theme_service` and `create_or_update_fusion` **before** writing to disk; plus escaping of every panel sink (`esc`, `themeEscapeHtml`, `themeJsArg`, `escapeHtml`).
- **Sanitized fusion ids (V3-06)**: the incoming `id` is validated by `_is_safe_fusion_id()` (rejects quotes, parentheses, `;`, `<`, `>` and spaces), new ids are generated as ASCII slugs (they could contain accents before) and are serialized in the panel with `themeJsArg`/`themeEscapeHtml` (five `onclick` handlers and one `id`).
- **Regression**: new `tests/test_metadata_sanitization.py` suite (16 tests: sanitizer, factory catalog integrity, rejection in the three services and a static escaping contract). The 6 related suites (84 tests) are green and the hashes of `themes_state.json`, `fusions.json`, `config.js`, `overlay_texts_config.json` and `common/themes.css` are unchanged.

### Fixed — Theme backlog M1–M13 / L1–L8 (phases 1–5)
- **Phase 1:** dynamic per-pack shape catalog; validated fusion defaults; unknown members return `warnings`/`unknown*`; `apply-shape` is capability-aware and reports `skipped*`.
- **Phase 2:** real 27-scene counter, full batch summary, cache only after API confirmation, i18n notices, and no API call when no theme/shape is selected.
- **Phase 3:** atomic writes with locks, persistent orphan-state normalization, single source for `defaultOverlayThemes`, `activeShape: original`, and the complete fusion schema.
- **Phase 4:** 14 structural tokens for `maker`, shape target in `gameplay_hud`, and readable labels for the 9 generic shapes.
- **Phase 5:** `renderStudio()` alert-block test and a one-command E2E (`tests/e2e_theme_backlog.py` + `scripts/run_theme_e2e.sh`) with snapshot/restore.

### Fixed — Theme audit H1–H10
- Persistent, consistent global theme: `globalThemeActive` + `overlayThemeExplicit`; applied at boot to scenes/widgets/alerts without an explicit assignment.
- Explicit scene assignments are no longer overridden by the global theme; reset releases it.
- Global theme changes preserve widget shapes instead of clearing them.
- `card`/`banner` alerts apply their own theme when shown (they previously shared the first one).
- `original` on widgets/alerts normalizes to "no shape"; strict API for unknown scenes and global shapes.
- New themes generate `theme.default.json`/`style.default.css`; create/save validate pack/theme paths.

### Added — Alerts with physical shapes from every pack
- `card`/`banner` alerts accept the **20 physical pack shapes** in addition to the 9 generic ones (29 options in the panel).
- Applied natively by reusing scene CSS (`[data-oss-panel]` + `body[data-theme-shape]`), with panel rules added for `cozy_polaroid`, `cozy_canvas` and `cozy_soft`.
- Also works from fusions (`apply-shape` applies the physical shape to alert members).

### Fixed — Embedded scene chat
- Scene chat now embeds the real widget (`?embed=1`) inside the panel and syncs its theme with the scene via `postMessage`.
- The switch **only hides the messages**: the frame, its size and the camera stay; the space is free for the OBS widget.

### Improved — Theme/shape options in Alerts and Fusions
- **Alerts** tab: new "Alert themes" block (card and banner) with theme, shape, apply, reset and add-to-fusion, inside the real Alerts Studio layout.
- **Widgets** tab: block renamed "Widget themes" (5 rows), split from alerts.
- **Fusions**: modal with 21 styles, 22 shapes, 27 scenes, 5 widgets and 2 alerts; readable member names.

### Fixed — Scene chat and texts saving
- Chat frame switch extended to `cozy_cafe` and `oss_chatting` (it already existed for `chill`), with per-scene layout and live persistence.
- **Critical bug**: saving texts replaced the file and wiped `cozy`, `oss`, `pomodoro`, `victory`, `art` and `speedrun`; now it deep-merges.

### Added — Shapes for every widget/alert and themed banners
- Native `common/oss-shape.js`: 9 shapes for any widget and `alert:card`/`alert:banner`, applied live and restored on reset.
- Catalog and fusions: `widgets/*` and `alerts/*` declare all 9 shapes; batch `apply-shape` reaches scenes, widgets and alerts.
- Banners: with a pack theme they are driven by tokens (gradient, border, shadow, text); without one the presets remain.

### Fixed — Native theme integration for widgets and alerts
- **Live shape**: `widget_theme_change` applies theme and shape without reload; reset clears `data-theme-shape`.
- **Precedence**: a widget/alert explicit assignment is no longer overridden by the global theme.
- **UI**: "Component themes" block (theme/shape/reset/add to fusion) and fusion members with removal.
- **Single reset**: new `POST /api/themes/reset-assignment`.
- **Conventions**: single boot in `common/widget-theme.js`; chat presets yield to pack themes; more text/background colours tokenised.

### Added — Fusions with widgets and panel alerts (native end-to-end)
- Fusions group **scenes + widgets + alerts**: `widgets[]` / `alerts[]` in `fusions.json`, validated against `GET /api/components/catalog`.
- **Theme and shape** apply in batch to every member; shapes only reach shape-capable widgets (`chat`) and pack scenes.
- **Resets**: `POST /api/fusions/{id}/reset` (whole fusion) and `reset_overlay_assignment_service` (single member).
- **Native consumption**: `config.js` publishes `overlayThemes`/`overlayShapes`; widgets and alerts read them at boot and listen to targeted events (`widget_theme_change` / `alert_theme_change`).
- **UI**: widget/alert pickers in the fusion modal, member counter and a "Reset fusion" button.

### Added — Native pack-theme integration for widgets and alerts
- **Widgets (6/6)**: accept `?theme=<id>` and WebSocket `theme_change`; set `data-theme` on `<body>` and consume `common/themes.css` tokens with fallbacks, leaving the default look untouched.
- **Panel-based alerts**: the overlay applies `?theme=`/`theme_change`; banners and `.alert-box` natively inherit `--color-accent-cyan`, `--color-panel-bg`, `--color-text-light`.
- **Conventions** documented (ES/EN) so new widgets and alerts integrate without knowing the existing ones.
- **Native contract tests**: `tests/test_native_theming_contract.py` (12 tests; includes proof the base CSS/JS is unchanged).

### Fixed — Pack shapes on alerts and widgets (1.0.2 visual audit)
- **Picking a physical shape on an alert or a widget now actually renders**: `common/styles.css` only used the 20 pack shapes to toggle scene ornaments (`.washi-tape`, `.reticle-*`), elements that do not exist in the alerts overlay or in widgets, and the alerts CSS consumed no `--frame-*`/`--skin-*` token at all → the shape could be selected in the panel but nothing changed.
- **New coverage**: every pack shape now declares a radius and/or `clip-path` for `#alert-card`, `#banner-alert-root` and `[data-oss-shape-target]` (a widget-only hook, so the scene archetype engine stays untouched).
- **Catalogue matches rendering**: widgets now offer the 29 shapes (9 generic + 20 pack) they really draw; `chat` keeps the 9 generic ones because it exposes no shape target (it applies its own via `ChatStyles`).
- **Regression test** (`tests/test_component_shapes_render.py`): every shape offered by the catalogue must have a render rule for scenes, alerts and widgets, and the 9 generic ones must exist in `oss-shape.js`.

### Fixed — Label contrast when switching packs (1.0.2 visual audit, real browser)
- **Browser measurement** (headless Chrome, 1920×1080, simulating OBS, 132 loads = 27 scenes + 5 widgets + alerts × 4 packs): all 21 theme combinations resolve **every** token, with no text overflow, no clipping, no failed requests and no rendering errors.
- **Ink on accent plates**: white text on `--color-accent-cyan` was legible in only **1 of 21** themes (measured). Labels on solid accent plates (`.ticker-tag`, `.timeout-badge`, `.match-badge`) now use dark ink, legible in **21/21** (≥5.1:1).
- **Dark accents used as text colour**: some packs define a very dark `--color-accent-orange` (e.g. `#7928CA`), so labels using it as text dropped to ~2:1 with that pack active. Those labels now use `--color-accent-cyan` (≥5.1:1 on the dark panel in 21/21) or the light text token.
- **Polaroid caption**: the brown ink on ivory paper (4.2:1, correct) is kept only while the scene keeps that paper (`cozy_polaroid` or original shape); with other shapes it switches to light text so it never ends up brown on a dark panel.
- **Remaining fine-tuning list** (recorded in `PENDIENTES_NO_BLOQUEANTES.md`): 8 selectors between 2.0:1 and 4.3:1 (the tagline in some scenes and a couple of inline-styled labels) that depend on per-scene design decisions.

### Fixed — Single version source and up-to-date launcher
- **The launcher no longer lags behind**: it showed "v1.0.0-α" and declared `1.0.1-alpha` while the project was already at `1.0.2-alpha`. Both `app/launcher/__init__.py` and the GUI label now read **`app/version.py`** (single source of truth).
- **12 i18n dictionaries** (ES/EN, panel, alerts, widgets, overlays and launcher) updated from `v1.0.0-α` to the real version.
- **Regression test** (`tests/test_version_consistency.py`): walks the dictionaries in depth, checks the launcher follows `version.py` and that no literal version strings come back into the UI or the assets.

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

### Licence
- This version was published under **CC BY-NC-SA 4.0**; **relicensed on 2026-10-26** to **AGPL-3.0-or-later** plus a commercial licence (see `NOTICE.md`).

## [1.0.0-alpha] — 2026-10-21

Initial public alpha release (closed internally on 2026-10-20).

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
- The licence this version was published under was **CC BY-NC-SA 4.0** (non-commercial use and ShareAlike reciprocity). **Relicensed on 2026-10-26**: the whole project — every version and the entire history — is now **AGPL-3.0-or-later** plus a commercial licence; see `NOTICE.md`.
