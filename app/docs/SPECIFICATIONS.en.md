# PROJECT: OPEN STREAM SUITE — COMPLETE OVERLAY SYSTEM FOR TWITCH & OBS STUDIO

<p align="center">
  <a href="SPECIFICATIONS.md">Español</a> | <b>English</b>
</p>

> [!NOTE]
> **HISTORICAL DESIGN SPECIFICATION (PHASE ZERO)**  
> This document represents the original design brief and architectural vision under which the project was conceived.  
> The technical architecture has since evolved into a production-grade modular Python backend (`aiohttp`), bidirectional WebSocket communication, full REST API (`/api/*`), hardware Deck and Twitch EventSub/IRC integration, and a universal 20-shape physical geometric engine (`data-theme-shape`).  
> For current architectural standards and specifications, please refer to [CONVENTIONS.en.md](../CONVENTIONS.en.md) and [GUIA_DESARROLLO_Y_TEMAS.en.md](GUIA_DESARROLLO_Y_TEMAS.en.md).

---

## 1. GENERAL OBJECTIVE
Design and implement a complete, professional, coherent visual streaming system for Twitch and OBS Studio. The system must include scenes for gaming, coding, maker fabrication, chatting, and interstitial screens.

Core channel philosophy: **PLAY. CREATE. TINKER.**

The identity unites diverse activities (gaming, 3D printing, electronics, programming, casual chat) under a cohesive, high-tech, welcoming aesthetic.

---

## 2. CONCEPT & VISUAL PERSONALITY
A contemporary stream lab blending technical tooling, creative production studio, and clean telemetry control panels.
- Inspiring curiosities: Engineering, CAD drawings, development tooling, hardware faceplates, calibration crosshairs, and industrial vinyl-cutter registration marks.
- Controlled, intentional typography and clean dark glassmorphism.

---

## 3. COLOR PALETTE
- **Graphite Dark Background**: `#191D21`
- **Bone White Foreground**: `#F2EEE5`
- **Electronic Cyan Accent**: `#57D6C4`
- **Maker Orange Accent**: `#FF783F`
- **Muted Blueprint Slate**: `#8B969C`
- **Translucent Card Tint**: `rgba(46, 54, 59, 0.72)`

---

## 4. TYPOGRAPHY
Curated offline webfonts embedded locally:
- Primary UI: **Outfit**
- Technical / Data / Monospace: **JetBrains Mono**
- Supporting: **Inter**, **Orbitron**, **Montserrat**, **Rajdhani**, **Press Start 2P**

---

## 5. TECHNICAL ARCHITECTURE
- HTML5, CSS3 with native custom properties (variables), and vanilla JavaScript.
- Direct GPU-accelerated rendering in Chromium (OBS Browser Source) with zero heavy video loops.
- Centralized configuration and hot-reloadable design tokens.
- Automatic viewport scaling (1080p canvas with responsive aspect-ratio adaptation).

---

## 6. BRAND IDENTITY
- Channel Name: **Andorina**
- Tagline: *JUGAR. CREAR. TRASTEAR.*
- Clean modular logos, SVG iconography, and dynamic state badges (`● LIVE`, `⌖ CALIB`, `ON AIR`).

---

## 7. CORE SCENE ARCHETYPES
1. **Gameplay HUD**: Clean minimalist framing for game capture and facecam.
2. **Maker Desk**: Top-down / workbench camera setup with project phase timeline.
3. **Maker PC / Coding**: Window capture and code inspection terminal.
4. **3D Printing & Fabrication**: Machine telemetry and multi-angle camera monitoring.
5. **Just Chatting / Podcast**: Large-format facecam framing with chat card and dynamic nameplates.
6. **Starting Soon**: Ambient countdown timer with animated tech progress bar.
7. **Be Right Back (BRB)**: Interstitial scene with rotating streamer status messages.
8. **Stream Ending**: Outro screen with community credits and social links.

---

## 8. COMMON FRAME & PANEL SYSTEM
All scenes inherit design variables and structural layout from `common/styles.css` and `common/themes.css`:
- Rounded chamfers, border highlights, and drop shadows.
- Transparent inner cutouts (`data-oss-viewport="true"`) for OBS video capture alignment.

---

## 9. ANIMATIONS & TRANSITIONS
- Micro-interactions: subtle hover states, glowing border pulses, and smooth opacity transitions.
- Zero frame-rate drops: pure CSS transitions and hardware-accelerated transforms (`transform: translate3d`).

---

## 10. CENTRALIZED CONFIGURATION
Central configuration file (`config.js`) housing channel handles, social URLs, project titles, and default timers, accessible globally by all overlay scenes.

---

## 11. DIRECTORY STRUCTURE
Organized into decoupled modular components:
- `streamthemes/`: Standalone pack overlays and styles.
- `widgets/`: Independent mini-apps (Chat, Goals, Timers, Shoutout, Ticker).
- `common/`: Global design tokens, shared runtime engine, and local webfonts.
- `server/`: Async Python server handling WebSocket broadcasting, Twitch IRC, and REST endpoints.

---

## 12. CATALOG & PREVIEW SYSTEM
Standalone catalog dashboard (`alerts/panel.html` and `common/catalog.js`) allowing streamers to preview all overlays, test simulated events, and edit on-screen texts live.

---

## 13. OBS STUDIO INTEGRATION
1. Add a **Browser Source** in OBS Studio.
2. Point the URL to the local server endpoint: `http://127.0.0.1:8080/streamthemes/<Pack>/overlays/<Scene>/index.html`.
3. Set Canvas Resolution to **1920 × 1080**.
4. Check **Shutdown source when not visible** and **Refresh browser when scene becomes active**.

---

## 14. CODE QUALITY STANDARDS
- Zero external CDN dependencies (100% offline local asset resolution).
- Semantic HTML markup (`data-oss-*`).
- W3C valid CSS with CSS variables for all themeable colors.
- Fully asynchronous Python backend using `aiohttp` and `asyncio`.

---

## 15. VISUAL & FUNCTIONAL VALIDATION
Automated test suite verifying endpoint responses, overlay text extraction, theme compilation, and WebSocket events.

---

## 16. AESTHETIC ACCEPTANCE CRITERIA
- Premium broadcast-grade finish.
- High visual legibility across light and dark stream content.
- Flawless alpha channel transparency with zero fringing or jagged artifacts.

---

## 17. EXECUTION ORDER
1. Foundational Design System & Common Styles.
2. Semantic HTML Scene Assembly.
3. Reactive WebSocket & Real-Time Sync Engine.
4. Floating HUD In-Situ Overlay Editor.
5. Multi-Pack Unification and Physical Shape Archetypes.

---

## 18. MODULAR ARCHITECTURE, FACTORY RESTORE & HARDWARE CONTROLS
- Full physical shape decoupling (`data-theme-shape`) offering 20 interchangeable frame geometries across all 4 packs.
- 1-Click factory theme restore (`POST /api/themes/restore`).
- Native integration with Stream Deck, Ajazz AKP keyboards, and Bitfocus Companion via `/api/deck/*`.
