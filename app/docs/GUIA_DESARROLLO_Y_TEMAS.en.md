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
