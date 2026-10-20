# 🚀 Installation & First Startup Guide
### Open Stream Suite · For Linux, Windows, and macOS

<p align="center">
  <a href="INSTALACION_E_INICIO.md">Español</a> | <b>English</b>
</p>

This guide explains step-by-step how to install dependencies, run the desktop control launcher, and add your first broadcast scenes to OBS Studio.

---

## 📋 Prerequisites

1. **Python 3.10 or higher** (tested on Python 3.10, 3.11, and 3.12).
   - On **Windows**: Download Python from [python.org](https://www.python.org/) and make sure to check **"Add Python to PATH"** in the installer.
   - On **Linux** (Ubuntu/Debian): `sudo apt install python3 python3-venv python3-tk`
   - On **macOS**: `brew install python python-tk` or via python.org.
2. **OBS Studio** installed on the same computer.
3. *(Optional)* A Twitch Developer account at [dev.twitch.tv](https://dev.twitch.tv/console/apps) if you want to connect live followers, subs, and chat alerts.

---

## ⚡ Method 1: Quick Automated Installation (Recommended)

The project includes automated setup scripts that configure the Python virtual environment, download required libraries, and create a desktop shortcut on your system.

### 🐧 On Linux (Ubuntu, Debian, Fedora, Arch):
Open a terminal in the project directory and run:
```bash
./installers/install_linux.sh
```
*This prepares dependencies in `app/venv/` and registers the "Open Stream Suite" desktop launcher in your application menu.*

### 🪟 On Windows (10 and 11):
1. Open the `installers\` folder.
2. **Double-click** on:
   ```text
   install_windows.bat
   ```
*A command window will automatically configure the environment and dependencies.*

### 🍎 On macOS:
1. Open the `installers/` folder.
2. **Double-click** on:
   ```text
   install_macos.command
   ```

---

## 🎮 How to Launch the Application

Once installation completes, launch the suite by double-clicking the corresponding launcher in the **project root**:

| Operating System | Startup File |
| :--- | :--- |
| 🐧 **Linux** | Double-click `Iniciar Open Stream Suite.sh` or find it in your application menu |
| 🪟 **Windows** | Double-click `Iniciar Open Stream Suite.bat` |
| 🍎 **macOS** | Double-click `Iniciar Open Stream Suite.command` |

> [!TIP]
> You can also launch from your terminal at any time:
> ```bash
> ./Iniciar\ Open\ Stream\ Suite.sh
> ```

---

## 🎛️ First Steps in the Control Dashboard

Opening the launcher displays the dark-themed control dashboard with 4 tabs:

```text
┌───────────────────────────────────────────────────────────┐
│ OPEN STREAM SUITE  v1.0.0-α                     🌐 [en ▼] │
├───────────────────────────────────────────────────────────┤
│ [🚀 Server]  [🟣 Twitch]  [📖 Guide]  [📜 Logs]           │
│                                                           │
│  SERVER STATUS: [ ACTIVE ]                                │
│  http://127.0.0.1:8080 · WebSocket ready for OBS          │
│  Connected OBS clients: 1 · Active theme: maker           │
│                                                           │
│  [⏹️ Stop Server]  [🎛️ Open Control Panel]  [📂 Overlays] │
└───────────────────────────────────────────────────────────┘
```

1. **Start the Server**: Click **`⚡ Start Server`** (the status badge turns green with `ACTIVE`).
2. **Open the Control Panel**: Click **`🎛️ Open Control Panel`**. It will open in your default browser at [http://localhost:8080/alerts/panel.html](http://localhost:8080/alerts/panel.html).
3. **System Tray**: Minimizing or closing the window keeps the application quietly running in your system tray with convenient quick-access shortcuts.
4. **Configure Twitch (Optional)**:
   - Navigate to the **🟣 Twitch** tab.
   - Enter your *Client ID* and *Client Secret*.
   - Click **Save Credentials**, then **Connect with Twitch**.

---

## 🎥 Setting Up OBS Studio

All broadcast scenes and widgets are local web pages added to OBS as **Browser Sources**:

1. Open **OBS Studio**.
2. In the **Sources** dock, click **`+`** → **Browser**.
3. Enter the local URL of the desired scene with resolution **`1920 × 1080`**:
   - **Gameplay Scene**: `http://localhost:8080/overlays/game/index.html`
   - **Just Chatting (Chill)**: `http://localhost:8080/overlays/chill/index.html`
   - **Secondary / Workbench Cam**: `http://localhost:8080/overlays/print/machine/index.html`
   - **On-Screen Alerts & Memes**: `http://localhost:8080/alerts/index.html`
4. Check both boxes:
   - ✅ *Shutdown source when not visible*.
   - ✅ *Refresh browser when scene becomes active*.

> [!NOTE]
> To preview all available interactive templates, open the local catalog at [http://localhost:8080/index.html](http://localhost:8080/index.html).

---

## 🛠️ Method 2: Manual Developer Installation

If you prefer managing the environment manually via the terminal:

```bash
# 1. Enter the app directory
cd app

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate       # On Linux / macOS
# venv\Scripts\activate       # On Windows

# 3. Install required libraries
pip install -r requirements.txt

# 4. Copy configuration template
cp .env.example .env

# 5. Run the desktop launcher
python3 launcher.py
```

---

## ❓ Frequently Asked Questions & Troubleshooting

#### 1. "Python is not recognized as an internal or external command" (Windows)
Re-run the Python installer from [python.org](https://www.python.org/) and make sure to check the box **"Add Python to PATH"** on the very first screen.

#### 2. Permission denied when running scripts on Linux / macOS
If `.sh` or `.command` files lack execution permissions, grant them in terminal:
```bash
chmod +x "Iniciar Open Stream Suite.sh" installers/*.sh
```

#### 3. Error `ModuleNotFoundError: No module named '_tkinter'` on Linux
On some lightweight Linux distributions, Tkinter is packaged separately:
- **Ubuntu / Debian**: `sudo apt install python3-tk`
- **Fedora**: `sudo dnf install python3-tkinter`
- **Arch Linux**: `sudo pacman -S tk`

#### 4. Can I use Open Stream Suite completely offline?
**Yes, 100%.** All typography is stored locally in `app/common/fonts/`. Memes, sounds, broadcast scene overlays, timers, neon themes, and widgets work completely without an Internet connection. Internet access is only required if you want live Twitch follower and chat event alerts.
