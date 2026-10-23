---
name: open-stream-themes
description: >-
  Expert guide and design system reference for Open Stream Suite themes, physical frame shapes,
  and overlay Fusions. Use when creating or editing stream packs, themes, CSS geometric tokens,
  or managing custom hybrid Fusions.
---

# Open Stream Suite — Themes, Shapes & Fusions Architecture Guide

This skill documents the physical styling engine and custom hybrid Fusions system in Open Stream Suite.

---

## 1. Physical Frame & Border Design Tokens

Themes in Open Stream Suite are not merely flat color or neon changes; each Pack and Theme defines distinct **physical geometries**, surface textures, and frame styles via standard CSS variables:

Token | Description | Typical Values
:--- | :--- | :---
`--frame-radius` | Border radius of camera boxes and primary frames | `0px` (Maker/Gamer), `4px-10px` (Open Stream), `20px-26px` (Cozy)
`--frame-border-width` | Border thickness | `1px` (Clean hairline), `2px` (Standard), `2.5px` (Esports)
`--frame-border-style` | CSS border style | `solid`, `dashed` (Retro terminal), `double` (Champion)
`--frame-clip-path` | Polygon chamfer / cut-corners | `none` vs `polygon(0 0, calc(100% - 20px) 0, 100% 20px, ...)`
`--frame-shadow` | Ambient glow or diffuse drop shadow | Diffuse soft shadows for Cozy; high-intensity neon glow for Cyber/Esports; `none` for Stealth/Minimal
`--frame-corner-display` | Display of decorative corner bracket marks | `block` (Maker technical marks) vs `none` (Clean/Cozy)
`--panel-radius` | Radius for chat cards, info panels, stats | `0px` to `22px`
`--panel-clip-path` | Chamfer for stats and header panels | Used in Gamer Pro and Cyberpunk
`--panel-backdrop` | Blur strength for glassmorphism | `blur(6px)` to `blur(18px)`
`--badge-radius` | Radius of stream badges / tags | `0px`, `4px`, or `50px` (pill)

---

## 2. Pack Archetypes & The 20 Physical Shapes Catalog

The engine supports 20 universal physical frame and panel archetypes (`data-theme-shape`), grouped into 6 thematic families:

### ☕ Cozy Lo-Fi & Art
- `cozy_polaroid`: Classic vintage Polaroid frame with wide bottom chin, warm paper texture, washi tape, and handwritten photo caption.
- `cozy_canvas`: Canvas texture with warm wooden trim and brass corner pushpins.
- `cozy_soft`: Ultra-soft 28px pill curves with frosted glass and minimal styling.

### 🎮 Gamer Pro & Esports
- `gamer_mecha`: 45° chamfered polygon cutout with dual corner reticles and neon laser glow.
- `gamer_tactical_hud`: Military FPS telemetry frame with dash brackets and live ● LIVE REC indicator.
- `gamer_stealth`: Pure carbon black minimal frame with 8px chamfer and zero reflective glare.
- `gamer_hex_shield`: Perimeter Sci-Fi hexagonal armor with ⬡ SHIELD: ACTIVE status tag.
- `gamer_cyber_glitch`: Neon asymmetric polygon cuts with chromatic aberration (cyan/magenta split) and visual glitch telemetry.
- `gamer_arcade_retro`: 8-bit stepped pixel cabinet bezel with 1UP red marquee and INSERT COIN counter.

### 🛠️ Maker & Technical Workshop
- `maker_blueprint`: Precision engineering frame with CAD blueprint grid, angle calipers, and ⌖ CALIB: 1:1 crosshair mark.
- `maker_workbench`: Heavy industrial studio workbench with ⨁ corner rivets, orange accents, and project phase markers.
- `maker_circuit_pcb`: Emerald green PCB electronic board with gold traces, GND solder pads, and SMD components.

### ⚡ Open Stream Suite Official
- `openstream_glass`: Swiss neo-glassmorphism with 16px radius, deep 24px backdrop blur, and subtle specular borders.
- `openstream_studio`: Professional TV broadcast line with pulsing ● ON AIR tally and lower-third ticker.

### 📜 Fantasy, RPG & Gothic
- `fantasy_parchment`: Organic hand-torn medieval parchment edges, crimson wax seal ⚜, and antique gold borders.
- `fantasy_runic_stone`: Obsidian carved stone block with glowing ancient Nordic runes in corners.
- `gothic_vampire`: Victorian dark gothic arches with blood-red crimson trim and bat emblem 🦇.

### 💥 Comic, Pop Art & Retro TV
- `comic_manga_action`: Bold 5px ink outlines, solid comic shadows, and action impact badge 💥 GO!!.
- `pop_synth_neon`: 80s synthwave wireframe grid horizon with fluorescent magenta/cyan borders and retro sun ☀.
- `vintage_crt_monitor`: 90s curved bubble CRT monitor bezel with grey casing, scanlines, and green ● POWER LED.

---

## 3. Fusions System (Custom Hybrid Packs)

### What is a Fusion?
A **Fusion** allows streamers to assemble a personalized super-pack by selecting favorite scenes and layouts across different packs (e.g. Maker Camera + Gamer HUD + Cozy Chatting).

### Architecture & Storage
- **File:** `app/fusions.json`
- **Schema:**
  ```json
  {
    "id": "fusion_example_id",
    "name": "My Custom Hybrid",
    "icon": "⚡",
    "description": "Optional notes...",
    "scenes": ["maker-desk", "oss_chatting", "gamer_victory"],
    "defaultTheme": "maker",
    "updatedAt": "2026-10-22T02:00:00Z"
  }
  ```
- **Backend Service:** `app/server/services/fusions_service.py`
- **REST Endpoints:** `app/server/routes/fusions_routes.py`
  - `GET /api/fusions`
  - `POST /api/fusions` (Includes `defaultTheme` and `defaultShape`)
  - `GET /api/fusions/{id}`
  - `DELETE /api/fusions/{id}`
  - `POST /api/fusions/{id}/apply-theme` (Batch theme application)
  - `POST /api/fusions/{id}/apply-shape` (Batch physical shape application)
- **Frontend Controller:** `app/alerts/js/themes/13-fusions.js`

---

## 4. Backdrop Aperture & Cutouts Engine (`backdrop-aperture.js`)

Allows applying decorative backgrounds (thematic gradients, textures, wallpapers, or custom image URLs) to stream overlays without blocking OBS video sources (webcams, gameplay captures) positioned behind the browser source:

- **SVG Mask Architecture:**
  - Injects `#oss-backdrop-aperture-layer` (`z-index: 0`) masked by `<mask id="oss-aperture-mask">`.
  - Automatically queries all viewport/camera selectors (`.camera-frame`, `.cam-box`, `.cam-inner-viewport`, `.face-viewport`, `.desk-viewport`, `.stream-frame`, `.pip-cam-box`, `.guest-cam`, `[data-cutout="true"]`, `[data-oss-cam]`).
  - Carves out transparent apertures (`fill="#000000"`) while preserving computed `border-radius` and polygonal 45° chamfers (`clip-path: polygon(...)`).
- **Persistence & Synchronization:** Saved via `POST /api/themes/backdrop` and persisted in `themes_state.json` under `"backdrops"`. Real-time WebSocket synchronization across all open OBS instances using event `overlay_backdrop_change`.
- **HUD Controls:** Streamers can select preset backgrounds (Kraft paper, Tatami wood, Carbon mesh, CAD blueprint, Acoustic slate) or paste a custom image URL directly from the floating HUD toolbar.

---

## 5. Universal Semantic Contract (`data-oss-*`) & Multi-Aspect Ratio Geometry

To decouple pack creation from specific CSS class names and ensure total interchangeability:

1. **Mandatory Semantic Markers**:
   - `data-oss-cam="true"`: Primary camera container. Receives borders, shapes, chamfers, and shadows.
   - `data-oss-viewport="true"`: Transparent camera viewport cut out for OBS capture.
   - `data-oss-cam-label="true"`: Camera label or badge element.
   - `data-oss-panel="true"`: Chat boxes, task lists, pomodoro or stats cards.
   - `data-oss-bar="top|bottom"`: Top headers or bottom news/stage tickers.

2. **Aspect Ratio Fluidity (16:9, 4:3, 21:9, 9:16)**:
   - Physical shapes rely on relative `calc(100% - 24px)` coordinates and corner-pinned accents (`top: 6px; left: 6px;`).
   - Adapts fluidly to 16:9 widescreen, 4:3 retro, 21:9 ultrawide, and 9:16 vertical layouts (TikTok / Shorts) without distorted angles.

3. **Text Key Isolation (`data-text-key`)**:
   - All editable labels must carry unique namespace keys (e.g. `victory.title`, `cozy.cafeCamLabel`, `speedrun.game`).
   - Prevents cross-scene collisions and enables automated bidirectional sync via `POST /api/overlays/texts`.

4. **Polygonal Insets Safety Rule**:
   - Containers with `clip-path` or `overflow: hidden` must never place badges/labels at negative coordinates.
   - Always use inward positive offsets (`top: 10px; left: 14px;`) or layout padding.

5. **On-Demand Floating HUD Panels**:
   - Auxiliary panels (`#oss-countdown-control`, `#oss-speedrun-control`, `#oss-brb-phrases-control`) start hidden (`display: none;`).
   - Toggled via contextual HUD buttons (`⏱️`, `⚡`, `🔄`) and closed with `✕`.

---

## 6. Testing & Compilation Procedure

1. When updating themes, compile `common/themes.css`:
   ```bash
   /home/andorina/OpenStreamSuite/app/venv/bin/python3 -c "import sys; sys.path.append('app'); from server.services.theme_manager import sync_common_themes_css; sync_common_themes_css()"
   ```
2. Verify in browser: `http://localhost:8080/alerts/panel.html` -> Tab "⚡ Fusiones".
3. Verify live OBS scene rendering at `http://localhost:8080/streamthemes/<Pack>/overlays/<Scene>/index.html`.

