# OBS STUDIO STEP-BY-STEP SETUP GUIDE

<p align="center">
  <a href="OBS_SETUP.md">Español</a> | <b>English</b>
</p>

This guide details the exact pixel coordinates, viewport dimensions, and layer order for setting up all 9 scenes in **OBS Studio**.

---

## 1. Core OBS Concepts

1. **Scene Resolution (Canvas)**:
   - Configure Base (Canvas) and Output (Scaled) resolution to **1920 × 1080** at 60 fps (in *Settings → Video*).
2. **Adding an Overlay**:
   - In the **Sources** dock, click **`+`** → **Browser**.
   - Check the **«Local file»** checkbox.
   - Click *Browse* and select the corresponding `index.html` file inside `overlays/` (or use the local URL `http://localhost:8080/overlays/...`).
   - Width: **1920**
   - Height: **1080**
   - Ensure you check **«Shutdown source when not visible»** and **«Refresh browser when scene becomes active»**.
3. **Layer Ordering**:
   - The **Overlay** source must always sit at the **very top of your sources list**, above webcams and screen captures, so technical frames and labels render cleanly over video.
   - If a webcam extends beyond its frame, hold down the **`Alt`** key while dragging the red bounding box edges in OBS preview to crop out excess video with pixel precision.

---

## 2. Coordinates & Dimensions per Scene

### 1. GAME SCENE
* **Purpose**: Full-screen gameplay.
* **File**: `overlays/game/index.html` (or `http://localhost:8080/overlays/game/index.html`)
* **Layers (top to bottom)**:
  1. `Overlay GAME` (Browser: 1920×1080, x:0, y:0)
  2. `Facecam` (Video Capture Device: 360×203, **x: 48, y: 767**)
  3. `Game Capture` (Game Capture or Window: 1920×1080, x:0, y:0)

---

### 2. MAIN SCENE — CAMERA + WEBCAM
* **Purpose**: Overhead camera on desk, workbench, or main action shot with picture-in-picture auxiliary frame.
* **File**: `overlays/maker/desk/index.html` (or `http://localhost:8080/overlays/maker/desk/index.html`)
* **Layers (top to bottom)**:
  1. `Overlay MAKER DESK` (Browser: 1920×1080, x:0, y:0)
  2. `Facecam` (Capture Device: 456×257, **x: 1432, y: 112**)
  3. `PC Aux Capture` (Screen Capture: 456×257, **x: 1432, y: 389**)
  4. `Overhead Desk Cam` (Capture Device: 1376×774, **x: 32, y: 112**)

---

### 3. PC SCREEN SCENE — DESKTOP + WEBCAM
* **Purpose**: Programming, terminal, code reviews, design software, or tutorials.
* **File**: `overlays/maker/pc/index.html` (or `http://localhost:8080/overlays/maker/pc/index.html`)
* **Layers (top to bottom)**:
  1. `Overlay MAKER PC` (Browser: 1920×1080, x:0, y:0)
  2. `Facecam` (Capture Device: 456×257, **x: 1432, y: 112**)
  3. `Aux Workbench Cam` (Optional secondary cam: 456×257, **x: 1432, y: 389**)
  4. `Main Display Capture` (Monitor: 1376×774, **x: 32, y: 112**)

---

### 4. SECONDARY CAM SCENE — PROCESS / ACTION
* **Purpose**: Dedicated camera on 3D printer, vinyl cutter, soldering iron, or mechanical tool.
* **File**: `overlays/print/machine/index.html` (or `http://localhost:8080/overlays/print/machine/index.html`)
* **Layers (top to bottom)**:
  1. `Overlay PRINT MACHINE` (Browser: 1920×1080, x:0, y:0)
  2. `Facecam` (Capture Device: 456×257, **x: 1432, y: 112**)
  3. `Macro / Detail Cam` (Capture Device: 456×257, **x: 1432, y: 389**)
  4. `Machine View Cam` (Capture Device: 1376×774, **x: 32, y: 112**)

---

### 5. DESIGN SCREEN SCENE — FULL SCREEN APP
* **Purpose**: Vector illustration, CAD, video editing, or 3D modeling.
* **File**: `overlays/print/design/index.html` (or `http://localhost:8080/overlays/print/design/index.html`)
* **Layers (top to bottom)**:
  1. `Overlay PRINT DESIGN` (Browser: 1920×1080, x:0, y:0)
  2. `Facecam` (Capture Device: 456×257, **x: 1432, y: 112**)
  3. `Aux Process Cam` (Capture Device: 456×257, **x: 1432, y: 389**)
  4. `Design App Window` (Display Capture: 1376×774, **x: 32, y: 112**)

---

### 6. CHILL SCENE — JUST CHATTING
* **Purpose**: Q&A, community conversations, podcasts, and chill streams.
* **File**: `overlays/chill/index.html` (or `http://localhost:8080/overlays/chill/index.html`)
* **Layers (top to bottom)**:
  1. `Overlay CHILL` (Browser: 1920×1080, x:0, y:0)
  2. `Twitch Chat Source` (Browser source: 544×800, **x: 1344, y: 154**)
  3. `Main Wide Facecam` (Camera: 1280×720, **x: 32, y: 112**)

---

### 7. STARTING SOON SCENE
* **Purpose**: Full-screen holding screen before broadcast starts.
* **File**: `overlays/screens/starting-soon/index.html`
* **Layers**:
  1. `Overlay STARTING SOON` (Browser: 1920×1080, x:0, y:0)
  2. *(Optional)* Royalty-free background music track.

---

### 8. BE RIGHT BACK SCENE
* **Purpose**: Short break or technical pause.
* **File**: `overlays/screens/be-right-back/index.html`
* **Layers**:
  1. `Overlay BE RIGHT BACK` (Browser: 1920×1080, x:0, y:0)
  2. *(Optional)* Background music.

---

### 9. ENDING SCENE
* **Purpose**: Stream conclusion and credits.
* **File**: `overlays/screens/ending/index.html`
* **Layers**:
  1. `Overlay ENDING` (Browser: 1920×1080, x:0, y:0)
  2. *(Optional)* Outro music.

---

## 3. Quick Camera Alignment in OBS

If your capture card or camera has a different aspect ratio (such as 4:3 or unscaled 1080p):
1. Select the camera source in the OBS preview.
2. Press `Ctrl + E` (*Transform → Edit Transform*).
3. Directly enter the **Position** (X, Y) and **Size** (Width, Height) according to the specifications above.
4. If edges bleed past the frame, hold down the **`Alt`** key and drag the red handles to crop out the extra margin.
