# OBS STUDIO STEP-BY-STEP SETUP GUIDE

<p align="center">
  <a href="OBS_SETUP.md">Español</a> | <b>English</b>
</p>

This guide details the correct integration method, local server URLs, viewport dimensions, pixel coordinates, and layer stacking order for all broadcast scenes in **Open Stream Suite** within **OBS Studio**.

---

## 1. Core OBS Integration Concepts

### A. Loading Method: Browser Source via Local URL
> [!IMPORTANT]
> **DO NOT check «Local file»**. 
> All Open Stream Suite scenes are interactive broadcast web applications connected in real time via WebSockets to the local Python engine (`http://127.0.0.1:8080`). Loading files using the `file:///` protocol blocks hot theme synchronization, Web Audio synth effects, live on-canvas text editing, and alerts.

1. Open **OBS Studio**.
2. Verify your base canvas settings in **Settings** → **Video**:
   - **Base (Canvas) Resolution**: `1920x1080`
   - **Output (Scaled) Resolution**: `1920x1080`
   - **Common FPS Values**: `60`
3. In your scene's **Sources** dock, click **`+`** → **Browser**.
4. **Uncheck** the «Local file» checkbox if enabled.
5. Paste the scene's corresponding **URL** (example: `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/maker_desk/index.html`).
   > [!TIP]
   > From the web control panel (`http://127.0.0.1:8080`), every scene card includes a **«📋 Copiar URL OBS»** button that automatically copies the ready-to-use URL with assigned theme and lock parameters (`?theme=...&lock=1`).
6. Configure Browser Source properties:
   - **Width**: `1920`
   - **Height**: `1080`
   - **FPS**: `60`
   - **Control audio via OBS**: *Unchecked* (unless you want to capture overlay audio on an isolated OBS mixer track).
   - **Shutdown source when not visible**: *Recommended* to free GPU/RAM when switching scenes.
   - **Refresh browser when scene becomes active**: *Checked*.

### B. Layer Stacking Hierarchy (Z-Order in OBS)
1. **The Overlay Browser source must ALWAYS sit at the VERY TOP of your sources list**, above webcams, desktop window captures, and games.
2. The overlay's technical frames, headers, and borders use precise vector cutout masks (*SVG aperture masks*) so your video capture sources show cleanly through transparent viewports.
3. Cameras and desktop captures must be positioned **underneath** the overlay.

---

## 2. Complete Scene Catalog & Viewport Coordinates (27 Scenes)

### Pack 1: Maker Theme Pack (Workshop, CAD & Electronics)

| Scene | OBS Source URL | Camera & Capture Coordinates / Size |
| :--- | :--- | :--- |
| **1. Game** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/game/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Facecam**: 360×203 (x: 48, y: 767)<br>• **Game Capture**: 1920×1080 (x:0, y:0) |
| **2. Maker Desk** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/maker_desk/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Facecam**: 456×257 (x: 1432, y: 112)<br>• **Aux PC Capture**: 456×257 (x: 1432, y: 389)<br>• **Desk Overhead Cam**: 1376×774 (x: 32, y: 112) |
| **3. Maker PC** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/maker_pc/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Facecam**: 456×257 (x: 1432, y: 112)<br>• **Aux Desk Cam**: 456×257 (x: 1432, y: 389)<br>• **Main PC Display**: 1376×774 (x: 32, y: 112) |
| **4. Print Machine** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/print_machine/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Facecam**: 456×257 (x: 1432, y: 112)<br>• **Detail / Macro Cam**: 456×257 (x: 1432, y: 389)<br>• **Machine Action Cam**: 1376×774 (x: 32, y: 112) |
| **5. Print Design** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/print_design/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Facecam**: 456×257 (x: 1432, y: 112)<br>• **Process Aux Cam**: 456×257 (x: 1432, y: 389)<br>• **CAD App Capture**: 1376×774 (x: 32, y: 112) |
| **6. Chill** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/chill/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Main Wide Cam**: 1280×720 (x: 32, y: 112)<br>• **Chat Box Dock**: 544×800 (x: 1344, y: 154) |
| **7. Starting Soon** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/screens/starting-soon/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |
| **8. Coffee Break** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/screens/coffee-break/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |
| **9. Ending** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/screens/ending/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |

---

### Pack 2: Open Stream Pack (Broadcast Studio Neo-Glass)

| Scene | OBS Source URL | Layout Coordinates & Sizes |
| :--- | :--- | :--- |
| **1. Just Chatting** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/just_chatting/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Wide Main Cam**: 1280×720 (x: 48, y: 140)<br>• **Side Chat Column**: 512×860 (x: 1360, y: 140) |
| **2. Desktop Share** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/desktop_share/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Display Capture**: 1380×776 (x: 48, y: 140)<br>• **PiP Facecam**: 440×248 (x: 1432, y: 140) |
| **3. Podcast Talk** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/podcast_talk/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Host Cam**: 880×495 (x: 54, y: 220)<br>• **Guest Cam**: 880×495 (x: 986, y: 220) |
| **4. Starting Soon** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/screens/starting-soon/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |
| **5. Coffee Break** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/screens/coffee-break/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |
| **6. Ending** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/screens/ending/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |

---

### Pack 3: Gamer Pro Pack (Tournament Esports & Speedrun)

| Scene | OBS Source URL | Layout Coordinates & Sizes |
| :--- | :--- | :--- |
| **1. Gameplay HUD** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/gameplay_hud/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Chamfered Facecam**: 380×214 (x: 48, y: 770)<br>• **Full Game Capture**: 1920×1080 (x:0, y:0) |
| **2. Speedrun Split** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/speedrun_split/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Speedrun Game Window**: 1360×765 (x: 48, y: 157)<br>• **Splits & Deltas Column**: 440×820 (x: 1432, y: 130) |
| **3. Victory Clutch** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/victory_clutch/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Victory Cam Showcase**: 1280×720 (x: 320, y: 180) |
| **4. Starting Soon** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/starting-soon/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |
| **5. Coffee Break** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/coffee-break/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |
| **6. Ending** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/ending/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |

---

### Pack 4: Cozy Lo-Fi Pack (Chill, Study & Creative Art)

| Scene | OBS Source URL | Layout Coordinates & Sizes |
| :--- | :--- | :--- |
| **1. Study Pomodoro** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/study_pomodoro/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Study Cam (Squircle)**: 1240×698 (x: 48, y: 150)<br>• **Pomodoro & Playlist Dock**: 540×800 (x: 1332, y: 140) |
| **2. Art Dual Cam** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/art_dual_cam/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Overhead Art Cam**: 1180×664 (x: 48, y: 150)<br>• **Polaroid Facecam**: 580×326 (x: 1280, y: 150) |
| **3. Cafe Chat** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/cafe_chat/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Wide Cam View**: 1200×675 (x: 48, y: 160)<br>• **Textured Paper Chat**: 560×780 (x: 1300, y: 150) |
| **4. Starting Soon** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/starting-soon/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |
| **5. Coffee Break** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/coffee-break/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |
| **6. Ending** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/ending/index.html` | • **Full Canvas Overlay**: 1920×1080 (x:0, y:0) |

---

## 3. Fast Camera Alignment & Cropping in OBS

If your physical webcam or capture card has a different aspect ratio (such as 4:3 instead of 16:9):

1. **Transform Settings**:
   - Select the camera source in your OBS Sources list.
   - Press `Ctrl + E` (*Transform → Edit Transform*).
   - In **Position**, enter the exact `X` and `Y` coordinates from the table above.
   - In **Size**, enter the corresponding `Width` and `Height`.
2. **Alt-Key Precision Cropping**:
   - If the camera video slightly spills outside the decorative viewport frame, hold down the **`Alt`** key on your keyboard.
   - Drag the red bounding handles in the OBS preview window: the bounding box line turns green, cleanly cropping the video without stretching or distortion.
3. **Overlay Audio Monitoring**:
   - Sound synthesis and alerts originate directly inside the overlay. If you want to hear audio playback through your headphones while streaming, open the OBS *Advanced Audio Properties* and set the Browser source's Audio Monitoring to *Monitor and Output*.
