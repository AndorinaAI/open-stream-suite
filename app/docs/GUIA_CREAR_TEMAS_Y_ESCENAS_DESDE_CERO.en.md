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
7. [Frequently Asked Questions & Troubleshooting](#7-frequently-asked-questions--troubleshooting)

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
       <!-- Custom camera frames and metadata -->
     </div>
     <script src="../../../common/overlay.js"></script>
   </body>
   </html>
   ```
3. In OBS Studio, add a Browser Source pointing to `http://localhost:8080/overlays/music/dj/index.html` with size 1920×1080.

---

## 6. Live Text Customization & OBS Synchronization

To update streamer name, project phases, and on-screen phrases without editing HTML files:
1. Open the control panel at [http://localhost:8080/alerts/panel.html](http://localhost:8080/alerts/panel.html).
2. Go to the **Textos de Escenas** tab.
3. Edit the fields (Streamer Name, Project Title, Active Phase, BRB phrases).
4. Click **Guardar y Aplicar a OBS**: the server broadcasts the changes via WebSockets, and all connected OBS browser sources update instantly in real time!
