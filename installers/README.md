# 📦 Instaladores de Open Stream Suite

<p align="center">
  <b>Español</b> | <a href="README.en.md">English</a>
</p>

Instrucciones para instalar dependencias y crear accesos directos en cada sistema operativo:

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch)
Ejecuta el script de instalación automática:
```bash
./installers/install_linux.sh
```
Esto creará el entorno virtual `app/venv/`, instalará las dependencias y registrará el acceso directo en tu menú de aplicaciones (`~/.local/share/applications/open-stream-suite.desktop`).

---

### 🪟 Windows (10 / 11)
Haz doble clic en:
```text
installers\install_windows.bat
```
o ejecútalo desde PowerShell / CMD. Requiere tener Python 3 instalado y marcado en el PATH.

---

### 🍎 macOS
Haz doble clic en:
```text
installers/install_macos.command
```
o ejecútalo en la Terminal. Requiere Python 3 (`brew install python python-tk`).

---

👉 Para ver la guía completa con capturas y pasos detallados, consulta: **[INSTALACION_E_INICIO.md](../INSTALACION_E_INICIO.md)** ([English](../INSTALLATION_AND_STARTUP.md)).

