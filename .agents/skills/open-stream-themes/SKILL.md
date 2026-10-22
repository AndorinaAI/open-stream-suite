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

## 2. Pack Archetypes & Signature Styles

### 🛠️ Maker & Taller Pack (`Maker_Theme_Pack`)
- **Aesthetic:** Blueprint, engineering, lab calibration, CAD drawings, industrial fab.
- **Physical Geometry:** Technical corner brackets (`--frame-corner-display: block`), zero or micro-radius (`0px - 2px`), precision crosshair marks, workshop warning accents.

### 🎮 Gamer Pro & Esports Pack (`Gamer_Pro_Pack`)
- **Aesthetic:** High-octane tournament, mecha telemetry, HUD overlays, tactical carbon.
- **Physical Geometry:** 45° chamfered cut corners (`clip-path: polygon(...)`), angled stat bars, segmented energy meters, high-voltage glows or stealth matte.

### ☕ Cozy Lo-Fi Pack (`Cozy_LoFi_Pack`)
- **Aesthetic:** Hygge, warm cafe, pastel anime, relax & study.
- **Physical Geometry:** Ultra-smooth pill curves (`border-radius: 20px - 26px`), soft frosted glass, warm ambient diffuse shadows (no harsh neon glares or sharp points).

### ✨ Open Stream Pack (`Open_stream_Pack`)
- **Aesthetic:** Sleek modern broadcast, neo-glassmorphism.
- **Physical Geometry:** Clean curved rectangles (`8px - 12px`), balanced 1px-2px borders, elegant floating cards, broadcast tickers.

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
  - `POST /api/fusions`
  - `GET /api/fusions/{id}`
  - `DELETE /api/fusions/{id}`
  - `POST /api/fusions/{id}/apply-theme` (Batch theme application)
- **Frontend Controller:** `app/alerts/js/themes/13-fusions.js`

---

## 4. Backdrop Aperture & Cutouts Engine (`backdrop-aperture.js`)

Allows applying decorative backgrounds (thematic gradients, textures, wallpapers, or custom image URLs) to stream overlays without blocking OBS video sources (webcams, gameplay captures) positioned behind the browser source:

- **SVG Mask Architecture:**
  - Injects `#oss-backdrop-aperture-layer` (`z-index: 0`) masked by `<mask id="oss-aperture-mask">`.
  - Automatically queries all viewport/camera selectors (`.camera-frame`, `.cam-box`, `.cam-inner-viewport`, `.face-viewport`, `.desk-viewport`, `.stream-frame`, `.pip-cam-box`, `.guest-cam`, `[data-cutout="true"]`).
  - Carves out transparent apertures (`fill="#000000"`) while preserving computed `border-radius` and polygonal 45° chamfers (`clip-path: polygon(...)`).
- **HUD Controls:** Streamers can select preset backgrounds (Kraft paper, Tatami wood, Carbon mesh, CAD blueprint, Acoustic slate) or paste a custom image URL directly from the floating HUD toolbar.

---

## 5. Testing & Compilation Procedure

1. When updating themes, compile `common/themes.css`:
   ```bash
   /home/andorina/OpenStreamSuite/app/venv/bin/python3 -c "import sys; sys.path.append('app'); from server.services.theme_manager import sync_common_themes_css; sync_common_themes_css()"
   ```
2. Verify in browser: `http://localhost:8080/alerts/panel.html` -> Tab "⚡ Fusiones".
3. Verify live OBS scene rendering at `http://localhost:8080/streamthemes/<Pack>/overlays/<Scene>/index.html`.

