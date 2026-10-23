# 🎬 COMPLETE GUIDE: CREATING THEMES, SCENES & OVERLAYS FROM SCRATCH
### Open Stream Suite — Modular Streaming System for OBS Studio

<p align="center">
  <a href="GUIA_CREAR_TEMAS_Y_ESCENAS_DESDE_CERO.md">Español</a> | <b>English</b>
</p>

This guide explains the architecture of Open Stream Suite: **how the workflow operates**, **how overlays are added to OBS Studio**, **why themes and scenes are separated**, and **how to create custom themes and scenes from scratch**.

---

## 📑 TABLE OF CONTENTS
1. [Mental Model: Scene vs Theme vs Pack vs Widget](#1-mental-model-scene-vs-theme-vs-pack-vs-widget)
2. [Adding Overlays to OBS Studio (Step by Step)](#2-adding-overlays-to-obs-studio-step-by-step)
3. [Understanding the Scene Mode Selector](#3-understanding-the-scene-mode-selector)
4. [Creating a New Visual Theme from Scratch](#4-creating-a-new-visual-theme-from-scratch)
5. [Creating a New Scene / Overlay from Scratch](#5-creating-a-new-scene--overlay-from-scratch)
6. [Live Text Customization & OBS Synchronization](#6-live-text-customization--obs-synchronization)
7. [Programmed Overlay Functions & Draggable Floating Controls](#7-programmed-overlay-functions--draggable-floating-controls)
8. [Frequently Asked Questions & Troubleshooting](#8-frequently-asked-questions--troubleshooting)

---

## 1. Mental Model: Scene vs Theme vs Pack vs Widget

To understand how the suite is structured:

| Concept | What is it? | Where does it live? | Example |
| :--- | :--- | :--- | :--- |
| **Scene (Overlay)** | A full 1920×1080 canvas in OBS with camera frames, labels, and layer layouts. | In OBS Studio (Scenes dock) and in the `/overlays/` folder. | Game Scene, Maker Desk Scene, Be Right Back Scene. |
| **Theme** | The **visual styling** (neon colors, glow effects, typography, and backgrounds) that dresses your scenes and widgets. | In `/themes/<pack>/<theme>/` and loaded dynamically via `/common/themes.css`. | Maker (Cyan), Print (Orange), Cyberpunk (Neon Yellow). |
| **Theme Pack** | A **container directory** bundling several related themes sharing a common aesthetic. | In `/themes/<pack_id>/`. | `pack_open_stream_suite` (official themes). |
| **Widget** | An independent modular element (chat box, goal bar, ticker ribbon, countdown timer). | In `/widgets/<name>/`. | Chat Widget, Pomodoro Timer. |

> [!TIP]
> **Summary:** You arrange the **Scenes** you need in OBS Studio (gaming, coding, chatting). With 1 click in the web control panel, you switch the **Theme** of all your scenes simultaneously without touching OBS settings.

---

## 2. Adding Overlays to OBS Studio (Step by Step)

OBS Studio does not require custom plugins: each overlay is a standard **Browser Source**.

### Step 1: Set Canvas Resolution
1. Open OBS Studio.
2. Go to **Settings → Video**.
3. Ensure both **Base (Canvas) Resolution** and **Output (Scaled) Resolution** are set to:
   - **`1920 × 1080`**
   - **`60 fps`** (or 30 fps depending on your hardware).

### Step 2: Create the OBS Scene & Add Browser Source
1. In the **Scenes** dock, click **`+`** and give it a name (*"01 // GAME"* or *"02 // MAKER DESK"*).
2. In the **Sources** dock, click **`+`** → **Browser**.
3. Name it `Overlay Game`.
4. In properties:
   - **URL**: Enter the local URL served by your background server:
     ```text
     http://localhost:8080/overlays/game/index.html
     ```
     *(Or check "Local file" and browse to `overlays/game/index.html`).*
   - **Width**: `1920`
   - **Height**: `1080`
   - Check **Shutdown source when not visible**.
   - Check **Refresh browser when scene becomes active**.
5. Click **OK**.

---

## 3. Understanding the Scene Mode Selector

The Mode selector in the Theme Studio preview allows you to test how each individual broadcast scene (Game, Maker Desk, Maker PC, Print Machine, Print Design, Chill, Screens) looks under different color schemes without opening OBS.

---

## 4. Creating a New Visual Theme from Scratch

Themes are defined as modular folders in `app/themes/<pack_id>/<theme_id>/`:

1. Create a new directory, for example: `app/themes/pack_custom/matrix_green/`
2. Add `theme.json`:
   ```json
   {
     "id": "matrix_green",
     "name": "Matrix Green",
     "author": "Streamer",
     "accent": "#00FF66",
     "accentSecondary": "#008F11",
     "bg": "#0D1117"
   }
   ```
3. Add `style.css`:
   ```css
   body[data-theme="matrix_green"] {
     --color-accent-cyan: #00FF66;
     --color-accent-orange: #008F11;
     --color-border-cyan: rgba(0, 255, 102, 0.4);
   }
   ```
4. Create backup copies `theme.default.json` and `style.default.css` for instant 1-click factory restoration.
5. Reload the Theme Studio in the web panel: your theme will appear immediately!

---

## 5. Creating a New Scene / Overlay from Scratch

1. Create a folder in `app/overlays/<category>/<scene_name>/` (e.g., `app/overlays/music/dj/`).
2. Create an `index.html` loading common styles:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <link rel="stylesheet" href="../../../common/styles.css">
     <link rel="stylesheet" href="../../../common/themes.css">
   </head>
   <body data-theme="maker">
     <div class="overlay-container">
       <!-- Camera Frame with Universal Semantic Contract -->
       <div class="camera-frame" data-oss-cam="true">
         <div class="cam-viewport" data-oss-viewport="true"></div>
         <div class="cam-label" data-oss-cam-label="true">
           <span data-text-key="dj.camLabel">DJ SET // LIVE</span>
         </div>
       </div>

       <!-- Content Panel -->
       <div class="track-panel" data-oss-panel="true">
         <span data-text-key="dj.trackTitle">NOW PLAYING: RETRO SYNTH</span>
       </div>
     </div>
     <script src="../../../config.js"></script>
     <script src="../../../common/overlay.js"></script>
   </body>
   </html>
   ```
3. In OBS Studio, add a Browser Source pointing to `http://localhost:8080/overlays/music/dj/index.html` with size 1920×1080.

---

## 5.1. Universal Semantic Compatibility Contract (`data-oss-*`)
To allow **any developer or streamer to build a brand new pack without needing to know class names from other packs**, the Open Stream Suite engine implements the **Universal Semantic Contract**:

| Semantic Attribute | Applied To | Engine Functionality |
|---|---|---|
| `data-oss-cam="true"` | Primary camera or capture container | Automatically inherits all 20 physical shapes (45° chamfers, polaroids, hex shields, parchments, pixel cabinets, etc.), shadows, borders, and accents. |
| `data-oss-viewport="true"` | Inner video window area | Generates the transparent cutout for OBS video capture and the SVG aperture engine (`backdrop-aperture.js`). |
| `data-oss-cam-label="true"` | Camera label or badge | Adapts typography and placement (polaroid pushpin, neon pill, engineering tag, wax seal). |
| `data-oss-panel="true"` | Chat cards, stats, podiums, task lists | Applies frosted glassmorphism, rounded corners, or angular chamfers matching the active shape. |
| `data-oss-bar="top\|bottom"` | Header bars or bottom status tickers | Styles status and news tickers with theme accents. |

> [!TIP]
> **Total Decoupling**: It does not matter whether your class is `.my-cam`, `.webcam-box`, or `.stream-window`. Adding `data-oss-cam="true"` allows the engine to recognize it instantly and apply any of the **20 physical archetypes** (Cozy, Gamer, Maker, OpenStream, Fantasy/RPG/Gothic, and Comic/Synthwave/Retro CRT) seamlessly.

---

### Catalog of the 20 Available Physical Shapes
1. **☕ Cozy Lo-Fi & Art**: `cozy_polaroid`, `cozy_canvas`, `cozy_soft`.
2. **🎮 Gamer Pro & Esports**: `gamer_mecha`, `gamer_tactical_hud`, `gamer_stealth`, `gamer_hex_shield`, `gamer_cyber_glitch`, `gamer_arcade_retro`.
3. **🛠️ Maker & Workshop**: `maker_blueprint`, `maker_workbench`, `maker_circuit_pcb`.
4. **⚡ Open Stream Suite**: `openstream_glass`, `openstream_studio`.
5. **📜 Fantasy, RPG & Gothic**: `fantasy_parchment`, `fantasy_runic_stone`, `gothic_vampire`.
6. **💥 Comic, Pop Art & Retro TV**: `comic_manga_action`, `pop_synth_neon`, `vintage_crt_monitor`.

---

## 5.2. Fluidity & Adaptability to Camera Aspect Ratios
Physical frame shapes are not locked to static pixel dimensions:

- **Classic Horizontal Cameras (16:9 and 4:3)**: Supports standard modern webcams, retro consoles, and compact cameras.
- **Ultrawide Cameras (21:9)**: Ideal for cockpit simulators and multi-monitor broadcast captures.
- **Vertical Cameras (9:16)**: Essential for mobile streaming, TikTok Live, and YouTube Shorts.

### How Chamfers and Brackets Avoid Distortion
The engine uses relative coordinates calculated via CSS `calc()`:
```css
/* Example: Relative octagonal chamfer adapting fluidly to any width or height */
clip-path: polygon(
  24px 0%, calc(100% - 24px) 0%,
  100% 24px, 100% calc(100% - 24px),
  calc(100% - 24px) 100%, 24px 100%,
  0% calc(100% - 24px), 0% 24px
);
```
Decorative accents (corner pluses `+`, target reticles, engineering brackets) are anchored to corners (`top: 6px; left: 6px;`, `bottom: 6px; right: 6px;`). Both a 400×710 vertical frame and a 1280×720 widescreen frame display with identical millimeter precision.

---

## 5.3. Golden Rule of Text Isolation (`data-text-key`)
When an overlay features text that streamers can edit live on canvas (titles, badges, game names, timer deltas), always assign **`data-text-key="section.field"`**:

```html
<span data-text-key="speedrun.game">SUPER MARIO 64</span>
<span data-text-key="cozy.cafeCamLabel">COZY CAFE CAM</span>
<h1 data-text-key="victory.title">VICTORY</h1>
```

### Why Unique Keys Are Mandatory Across Scenes
- Reusing generic keys across scenes (e.g., `game.badgeText` or `cam.title`) causes changes in one scene to overwrite another (e.g., a Victory Clutch banner displaying `"MODO JUEGO"` or an art canvas camera displaying `"CHAT EN DIRECTO"`).
- With isolated keys (`victory.*`, `speedrun.*`, `art.*`, `pomodoro.*`, `cozy.*`, `oss.*`), each scene maintains 100% independent content.
- **Zero-Code Persistence**: `dom-injector.js` and `05a-extract-texts.js` automatically detect all `[data-text-key]` elements. Clicking `💾 Save Changes` persists them to the backend and broadcasts them across WebSockets to OBS Studio with zero custom JavaScript.

---

## 5.4. Polygonal Geometry Safety Rule against `clip-path`
When applying angular polygonal archetypes (`gamer_mecha`, `gamer_tactical_hud`):

> [!CAUTION]
> If a camera container uses `clip-path` or `overflow: hidden`, child elements placed at **negative coordinates** (e.g., `top: -14px;` or `left: -20px;`) will be clipped and disappear.

**The Positive Insets Rule**:
- Always position labels and tags using positive inward offsets:
  ```css
  /* CORRECT: Safely positioned within visible area */
  .cam-label {
    position: absolute;
    top: 10px;
    left: 14px;
  }
  ```
- Or place labels outside the `clip-path` element using an external wrapper.

---

## 5.5. On-Demand Non-Obtrusive Floating Panels
To keep broadcast canvases clean and professional:
- Auxiliary interactive panels (`#oss-countdown-control`, `#oss-speedrun-control`, `#oss-brb-phrases-control`) start **hidden by default** (`display: none;`).
- They can be toggled on demand via the floating HUD toolbar buttons (`⏱️ Timer`, `⚡ Splits`, `🔄 BRB Phrases`) or closed with `✕`.
- Powered by `makeDraggable`, streamers can move them anywhere across the viewport without obscuring webcams or chat widgets.

---

## 6. Live Text Customization & OBS Synchronization

Text customization in **Open Stream Suite** does not rely on obscure JSON editing or modals blocking your view; you edit texts directly on the canvas:

1. **Unified Action Button**:
   - Every overlay card features the **`🖥️ Ver Pantalla Completa / ✏️ Editar Textos`** button.
   - Clicking it launches the overlay at full 1920×1080 resolution with the interactive editing suite enabled.

2. **Direct On-Canvas Editing (`contenteditable="true"`)**:
   - All titles, subtitles, project phases, personal bests, and badge labels can be edited directly by clicking on them.
   - A bright cyan/neon focus ring highlights the active text field.

3. **Floating Control HUD (`#open-stream-suite-screen-hud`)**:
   - The top floating toolbar provides:
     - **`🎯 Ir a Texto...`**: Comprehensive dropdown jumping directly to any label on screen.
     - **`💾 Guardar Cambios`**: Persists changes to `/api/overlays/texts` and triggers WebSocket broadcasts to all OBS instances.
     - **`🔄 Restablecer`**: Reverts texts back to factory defaults.
     - **`❌ Cerrar HUD`**: Hides HUD to view the clean broadcast canvas.
     - **`⋮⋮ Drag Handle`**: Reposition the HUD anywhere to avoid blocking content.

4. **Reactive Animation Pausing (`window.__OSS_IS_EDITING__`)**:
   - When any editable text receives focus or keyboard input, `window.__OSS_IS_EDITING__` automatically engages.
   - All timed rotations (e.g., BRB phrases) pause to prevent the DOM from updating underneath your cursor.

---

## 7. Programmed Overlay Functions & Draggable Floating Controls

Overlays in Open Stream Suite are fully programmable web applications:

### Golden Rule: All Floating Menus MUST be Draggable (`makeDraggable`)
> [!IMPORTANT]
> **Non-Obtrusive Guarantee**: Never leave a floating panel or control menu in a static CSS fixed position. Always wrap it with `makeDraggable(panel, handleSelector)` so the streamer can drag it out of the way of cameras, chat, and critical on-stream information.

- **Pointer Events**: Uses `pointerdown`, `pointermove`, `pointerup` with `setPointerCapture` and `touch-action: none`.
- **Drag Handle**: Visual header with `.hud-drag-handle`, `⋮⋮` glyph, and `cursor: grab / grabbing`.
- **Screen Clamping**: Floating controls cannot be dragged off-screen.

### Native Programmed Capabilities:
1. **Speedrun Splits Stopwatch (`Gamer_Pro_Pack`)**:
   - Centisecond timer with lap splits.
   - Floating draggable HUD `#oss-speedrun-control` with `[▶ Start]`, `[⚡ Split]`, `[⏮ Prev]`, `[🔄 Reset]`.
   - `Space` key shortcut for splits (automatically ignored when typing in editable inputs).
   - Direct click on deltas (`+` / `-`) or PBs to adjust split targets.
2. **Pomodoro & Countdown Timers (`Cozy_LoFi_Pack` & Starting Soon)**:
   - Synchronized countdown with SVG/CSS progress fills (`.tech-progress-fill`).
   - Draggable `#oss-countdown-control` with 25m, 50m, 5m, 10m presets and `±1m` micro-adjustments.
   - Direct click on the giant clock digits to pause/resume.
3. **Interactive Project Phase Manager (`Maker_Theme_Pack`)**:
   - Direct click on any stage (`01 PLAN`, `02 MONTAJE`, etc.) sets it as active and syncs with `FASE ACTUAL`.
   - HUD buttons `➕ Add Phase` and `🗑️ Delete Phase` to manage roadmaps live on stream.
4. **Podcast Multi-Cam Layout Switcher (`Open_stream_Pack`)**:
   - HUD buttons: `[👥 2 Cams]`, `[👥 3 Cams]`, `[👥 4 Cams]`.
   - Automatically recalibrates CSS Grid dimensions and generates guest lower-thirds.
5. **Direct Canvas Interactions**:
   - Click victory clutch banners to cycle states (`VICTORY`, `DEFEAT`, `ACE`, `MATCH POINT`).
   - Click stats badges to toggle modes (`COMPETITIVE`, `RANKED`, FPS).
   - Click floating webcam (`desktop_share`) to cycle between the 4 corners.

---

## 8. Frequently Asked Questions & Troubleshooting

### ❓ Does `server.py` need to run continuously?
- **For live Twitch alerts, channel point triggers, and real-time syncing**: Yes, the local server handles WebSockets and Twitch API connectivity.
- **For offline frame graphics**: You can load scenes locally via OBS browser source with file paths.

### ❓ Why does my webcam appear in front of overlay borders or texts?
In the OBS Sources list, layer order is top-to-bottom. **The Browser Source (Overlay) must be at the very top of the list**. Your webcam video capture device must be placed underneath.

### ❓ How do I preview scenes at full resolution?
Click **`🖥️ Ver Pantalla Completa / ✏️ Editar Textos`** on any scene card in the control panel.

