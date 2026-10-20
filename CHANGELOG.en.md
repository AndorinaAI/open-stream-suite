# Changelog

<p align="center">
  <a href="CHANGELOG.md">Español</a> | <b>English</b>
</p>

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — 2026-10-20

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
- Primary development and testing environment is Linux. Windows and macOS support are **experimental**.
- The license (PolyForm Noncommercial 1.0.0) restricts commercial monetization; it is a source-available license rather than an OSI open source license.
