# 📦 Open Stream Suite Installers

<p align="center">
  <a href="README.md">Español</a> | <b>English</b>
</p>

Instructions to install dependencies and configure desktop shortcuts across supported operating systems:

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch)
Run the automated installation script:
```bash
./installers/install_linux.sh
```
This creates the Python virtual environment in `app/venv/`, installs all required dependencies, and registers the desktop launcher shortcut in your system application menu (`~/.local/share/applications/open-stream-suite.desktop`).

---

### 🪟 Windows (10 / 11)
Double-click on:
```text
installers\install_windows.bat
```
or run it from PowerShell / CMD. Requires Python 3 installed with "Add Python to PATH" enabled.

---

### 🍎 macOS
Double-click on:
```text
installers/install_macos.command
```
or execute it in Terminal. Requires Python 3 (`brew install python python-tk`).

---

👉 For complete instructions and troubleshooting steps, read: **[INSTALLATION_AND_STARTUP.md](../INSTALLATION_AND_STARTUP.md)** · [Español](../INSTALACION_E_INICIO.md).
