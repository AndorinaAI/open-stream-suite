<p align="center">
  <img src="app/assets/imagencorp/banner_github_header.png" alt="Open Stream Suite" width="100%">
</p>

<p align="center">
  <b>English</b> | <a href="README.es.md">Español</a>
</p>

# OPEN STREAM SUITE — MODULAR OVERLAYS, ALERTS & CONTROL SUITE FOR TWITCH & OBS STUDIO

> **PLAY · CREATE · SHARE**  
> Contemporary, modular, and lightweight visual identity for gaming, programming, maker streams, content creation, and just chatting.  
> 🚀 **[Step-by-Step Installation & Startup Guide](app/docs/INSTALLATION_AND_STARTUP.md)** · [Español](app/docs/INSTALACION_E_INICIO.md)

> [!WARNING]
> **Active Development & Operating System Notice**  
> Nothing in this suite is exhaustively or completely tested yet; we are in active early development and testing on Linux.  
> We do **NOT** use proprietary operating systems like Windows or macOS, nor do we have any intention of using them.  
> Support, compatibility, and bug fixes for Windows and macOS will evolve **solely based on community feedback, bug reports, and pull requests** submitted by users of those systems.

---

## 1. Overview

**Open Stream Suite** is a collection of professional, modular overlays and streaming tools tailored for content creators. Instead of loud, heavy, generic gaming templates, it uses a technical, clean aesthetic: registration marks, clean monospace typography for metadata, subtle accent colors, and deep respect for on-screen live content.

### Key Features
- **100% Offline (No Internet connection required for overlays)**: Typography is bundled locally in `common/fonts/` and served by the backend. Works completely offline on your computer without external CDNs.
- **Ultra-lightweight Performance**: Built with native HTML5, CSS3, and Vanilla JavaScript. Zero heavy web frameworks or npm build steps for the frontend.
- **True Transparency**: Live broadcast scenes have real transparent backgrounds so games, terminals, and webcams sit seamlessly underneath without muddy dark tint filters.
- **Centralized Configuration**: Edit streamer channel names, project titles, active development phases, and social links from [`app/config.js`](app/config.js) or via the web control panel.
- **Modular Themes & Factory Reset**: Complete theme packs in `app/streamthemes/<pack>/styles/<theme>/` with backup `.default.json` / `.default.css` files allowing 1-click instant factory restoration.
- **Independent Visual Themes per Scene**: Each OBS Studio scene overlay can wear its own style (Arcade for Gaming, Chill for Just Chatting, Cyberpunk for coding/tech, etc.).
- **Backdrop Aperture & Cutouts System**: Apply decorative backgrounds, textures, and gradients to your stream overlays with automatic SVG mask cutouts (`<mask id="oss-aperture-mask">`). OBS video sources (webcams, gameplay captures) underneath remain 100% visible and unblocked.
- **Radical Pack Visual Differentiation**:
  - ☕ **Cozy Lo-Fi**: Warm, organic, analog aesthetic. **Strictly neon-free**. Soft 28px squircles, Polaroid webcam frames with washi tape, warm paper drop shadows, spinning vinyl player, and Pomodoro focus widgets.
  - ⚡ **Gamer Pro**: Aggressive tournament esports & tactical HUD. 45° chamfers, target reticles `[+]`, live match telemetry (FPS, Ping, K/D, Streak), real Speedrun Split board with gold/green deltas, victory clutch podium.
  - 🎙️ **Open Stream**: Swiss broadcast studio neo-glass. Frosted glassmorphism (`blur(24px)`), stereo audio VU meters, `ON AIR` broadcast indicators, lower-third news ticker, and debate agenda cards.
  - 🛠️ **Maker & Taller**: CAD engineering blueprint and industrial fab lab. Millimeter drafting grid, edge ruler tick marks, registration marks `⌖`, project phases lifecycle bar, 3D printing & plotter telemetry.
- **Programmed Overlay Logic & Floating Draggable Controls**: Overlays are dynamic broadcast web applications rather than passive templates. They feature centisecond speedrun split timers with live deltas (+/-), millisecond-synchronized Pomodoro countdowns, multi-cam grid switchers, click-cycle victory badges, and floating draggable HUD menus designed never to obstruct gameplay or cameras.
- **Physical Deck Plugins**: Native integrations in [`plugins/`](plugins/README.en.md) for Elgato Stream Deck, Ajazz AKP05 (10 keys + panoramic touch strip + 4 knobs), Ajazz AKP153/03/846, and OpenDeck (Bitfocus Companion).
- **Robust Security**: Whitelisted file upload controls, anti path-traversal protection, CORS restricted to localhost/custom domain, and cryptographic local token authentication for mutating requests.

---

## 2. Project Structure

```text
OpenStreamSuite/
├── README.md               # English README (primary)
├── README.es.md            # Spanish README (Español)
├── LICENSE                 # Public licence (AGPL-3.0-or-later)
├── LICENSE-COMMERCIAL.md   # Paid commercial licence (dual licensing) / .en.md
├── NOTICE.md               # Third-party notices: OFL fonts & dependencies / .en.md
├── TRADEMARK.md            # Brand policy (logo and name are not licensed) / .en.md
│
├── Linux/                  # Installer, launcher, updater and instructions (ES/EN)
├── Mac/                    # same for macOS
├── Windows/                # same for Windows
│
├── languages/              # Multi-language dictionary files (JSON)
│   ├── es.json             # Spanish localization
│   └── en.json             # English localization
│
├── app/assets/imagencorp/  # Visual identity, vector logos, and screenshots
│   ├── README.en.md        # Brand manual and color palette
│   ├── logos/              # Symbols, favicon, horizontal logos (SVG & PNG)
│   └── screenshots/        # High-resolution live screenshots
│
├── plugins/                # Physical deck plugins and macros
│   ├── README.en.md        # Deck plugins setup guide
│   ├── stream_deck/        # Native Elgato Stream Deck plugin (.sdPlugin)
│   ├── ajazz/              # Ajazz AKP05 & AKP153 profiles + CLI bridge
│   ├── opendeck_companion/ # Companion page for OpenDeck and stream controllers
│   └── assets/             # SVG icons for LCD buttons
│
└── app/                    # Core project files
    ├── CONVENTIONS.en.md   # Architecture standards & dev guidelines
    ├── config.js           # Stream customization settings
    ├── index.html          # Interactive scene catalog & preview
    ├── server.py           # Backend Python server (aiohttp + WebSockets)
    ├── launcher.py         # Desktop launcher application
    ├── requirements.txt    # Python dependencies
    ├── .env.example        # Environment variables template
    ├── server/             # Modular backend (routes, state, EventSub, IRC)
    ├── alerts/             # Web control panel & OBS alert engine
    ├── widgets/            # Chat, goals, shoutout, ticker, and timer
    ├── streamthemes/       # Modular broadcast packs (overlays, themes & factory defaults)
    │   ├── Maker_Theme_Pack/      # 6 Maker/CAD themes + 9 OBS scenes
    │   ├── Open_stream_Pack/      # 5 Neo-Glass themes + 6 OBS scenes
    │   ├── Gamer_Pro_Pack/        # 5 Esports HUD themes + 6 OBS scenes
    │   └── Cozy_LoFi_Pack/        # 5 Relax/Botanical themes + 6 OBS scenes
    ├── common/             # Shared CSS, 100% offline local fonts & i18n engine
    ├── docs/               # Technical documentation & guides
    └── tests/              # Automated unit tests (67 tests)
```

---

## 3. Step-by-Step OBS Studio Setup

All overlays are loaded into OBS Studio as **Browser Sources** connected to the local server.

### Step 1: Base Canvas Setup
1. Open **OBS Studio**.
2. Go to **Settings** → **Video**.
3. Set both **Base (Canvas) Resolution** and **Output (Scaled) Resolution** to **`1920x1080`**.

### Step 2: Create Your Broadcast Scenes
In the *Scenes* dock, create a scene for each stream mode:
- `1 - GAME`
- `2 - MAIN SCENE` *(camera + desk/webcam)*
- `3 - PC SCREEN` *(screen share + webcam)*
- `4 - SECONDARY CAM` *(workbench, 3D printer, or action)*
- `5 - DESIGN SCREEN` *(full-screen app)*
- `6 - CHILL` *(Just Chatting)*
- `7 - STARTING SOON`
- `8 - BRB / PAUSE`
- `9 - ENDING`

### Step 3: Add an Overlay to a Scene
1. Select the scene in OBS (e.g. `2 - MAIN SCENE`).
2. In the **Sources** dock, click **`+`** and choose **Browser**.
3. Name it `Overlay - Main Scene`.
4. In the source properties:
   - **Do NOT check «Local file»** (overlays need HTTP/WebSocket connectivity).
   - **URL**: `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/maker/desk/index.html` (or click **«📋 Copiar URL OBS»** on any scene in the web panel).
   - **Width**: `1920`
   - **Height**: `1080`
   - Check **Shutdown source when not visible**.
   - Check **Refresh browser when scene becomes active**.
5. Click **OK**.

### Step 4: Arrange Cameras & Capture Devices
Add video capture devices or window captures **below the overlay source**:
- **Layer Order**:
  1. `Overlay` *(always top so borders render cleanly over video)*.
  2. `Webcams / Facecam` *(secondary frames)*.
  3. `Main Capture` *(gameplay, monitor, workbench)*.

To align cameras with pixel precision, see the layout guide in [app/docs/OBS_SETUP.en.md](app/docs/OBS_SETUP.en.md).

---

## 4. Local Server & Desktop Application

Open Stream Suite includes a desktop application with a control dashboard, system tray support, server health monitor, and Twitch API credentials manager:

> [!IMPORTANT]
> **GNU/Linux Development & Community Feedback for Windows / macOS:**  
> Open Stream Suite is actively developed and tested on **GNU/Linux**. While automated installers and native launch scripts are provided for **Windows** (`.bat`) and **macOS** (`.command`), our core team **does not use proprietary operating systems in their daily workflows**. Therefore, support, compatibility checks, and edge-case fixes on Windows and Mac rely heavily on community testing and feedback. If you encounter any unexpected behavior or wish to refine the launchers on those platforms, please [open an issue or submit a pull request](https://github.com/AndorinaAI/open-stream-suite/issues). Your collaboration is greatly appreciated!

### Quick Install:
Run the installer for your operating system:
- **Linux**: `./Linux/install.sh`
- **Windows**: Double-click `Windows\install.bat`
- **macOS**: Double-click `Mac/install.command`

The installer prepares the Python virtual environment in `app/venv/`, installs dependencies, and creates system desktop shortcuts.

### Launching the Application:
Double-click the corresponding root launcher:
- 🐧 **Linux**: `Linux/Iniciar Open Stream Suite.sh`
- 🪟 **Windows**: `Windows/Iniciar Open Stream Suite.bat`
- 🍎 **macOS**: `Mac/Iniciar Open Stream Suite.command`

From the desktop launcher you can **start/stop the server**, configure Twitch credentials, switch language (ES/EN), check for software updates, and open the **Web Control Panel**.

> [!NOTE]
> **Network Security:** By default the server binds exclusively to `127.0.0.1`. To access the control panel or deck API from a secondary device or tablet on your local network, set `SERVER_HOST=0.0.0.0` and configure `DECK_TOKEN` in `app/.env` (see [`plugins/README.en.md`](plugins/README.en.md)).

### Live URLs:
- **🎛️ Streamer Control Panel**: [http://localhost:8080/alerts/panel.html](http://localhost:8080/alerts/panel.html)
- **🚨 OBS Alert Engine**: [http://localhost:8080/alerts/index.html](http://localhost:8080/alerts/index.html) *(1920×1080)*
- **📰 Interactive Catalog**: integrated into the Control Panel (`/alerts/panel.html`, Scenes view)

---

## 5. Modular OBS Widgets

Each widget can be loaded as an independent Browser Source in any scene:

| Widget | Local URL | Recommended Size | Description |
| :--- | :--- | :--- | :--- |
| **🚨 Alerts & Triggers** | `http://localhost:8080/alerts/index.html` | `1920 × 1080` | Animated CSS alerts & green-screen reaction clips. |
| **💬 Chat & Physics** | `http://localhost:8080/widgets/chat/index.html` | `440 × 850` | Direct Twitch IRC connection + floating bouncing emotes. |
| **⏱️ Timer** | `http://localhost:8080/widgets/timer/index.html` | `400 × 140` | Stopwatch, countdown timer, and pomodoro breaks. |
| **📢 Shoutout Card** | `http://localhost:8080/widgets/shoutout/index.html` | `600 × 200` | Holographic promo card with streamer avatar and game. |
| **🎯 Goal Bar** | `http://localhost:8080/widgets/goal/index.html` | `460 × 120` | Real-time follower, subscriber, or bits target tracker. |
| **📰 Event Ticker** | `http://localhost:8080/widgets/ticker/index.html` | `800 × 60` | Minimal broadcast ribbon for latest follow, sub, and tip. |

---

## 6. Documentation & Testing

- **Deck Plugins Setup Guide**: [plugins/README.en.md](plugins/README.en.md)
- **Deck Hardware Integration (API & Profiles)**: [app/docs/GUIA_INTEGRACION_DECKS.en.md](app/docs/GUIA_INTEGRACION_DECKS.en.md)
- **Create Themes & Scenes from Scratch**: [app/docs/GUIA_CREAR_TEMAS_Y_ESCENAS_DESDE_CERO.en.md](app/docs/GUIA_CREAR_TEMAS_Y_ESCENAS_DESDE_CERO.en.md)
- **Architecture & Conventions**: [app/CONVENTIONS.en.md](app/CONVENTIONS.en.md)
- **Development & Theme Engine Guide**: [app/docs/GUIA_DESARROLLO_Y_TEMAS.en.md](app/docs/GUIA_DESARROLLO_Y_TEMAS.en.md)
- **OBS Scene Coordinates & Measurements**: [app/docs/OBS_SETUP.en.md](app/docs/OBS_SETUP.en.md)
- **Run the Automated Test Suite** (with server running, from `app/`):
  ```bash
  ./venv/bin/python3 -m unittest discover tests -v
  ```

---

## 7. License & Contributions

Open Stream Suite uses a **dual licence**:

- **Public licence: [GNU AGPL v3.0 or later](LICENSE)** — free software: you may use, study, modify and redistribute the project for free **as long as you comply with the AGPL** (publish the source of your modifications and impose no further restrictions).
- **Paid commercial licence:** if you are a **company** and want to use it without publishing your code (embedding it in a product, hosted service, white-labelling, redistribution), you need the [commercial licence](LICENSE-COMMERCIAL.en.md). Contact: **admin@andorina.dev**.
- **Trademarks:** the name, logo and visual identity are covered by **neither** licence → [`TRADEMARK.en.md`](TRADEMARK.en.md).
- **Third-party assets** (typefaces, icons, Python dependencies) are not covered by the project licence → [`NOTICE.en.md`](NOTICE.en.md).

> [!IMPORTANT]
> Versions published **before 2026-10-26** were released under **CC BY-NC-SA 4.0**. Copies already delivered to third parties keep those terms; **new versions are governed by AGPL-3.0-or-later**.

> [!NOTE]
> Contributions, community fixes, and new features are warmly welcome: see [CONTRIBUTING.en.md](.github/CONTRIBUTING.en.md). **Every contribution requires signing the [CLA](.github/CLA.en.md)** so the project can keep its dual-licence model.

Third-party dependencies and assets retain their respective licenses.

Enjoy building, streaming, and sharing live! 🎮🚀
