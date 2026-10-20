#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — INSTALADOR AUTOMÁTICO PARA LINUX
# ====================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
APP_DIR="$DIR/app"

echo "============================================================"
echo "  🎮 OPEN STREAM SUITE — Instalación y Configuración"
echo "============================================================"
echo "Directorio del proyecto: $DIR"
echo

# 1. Comprobar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 no está instalado. Instálalo con tu gestor de paquetes (ej. sudo apt install python3 python3-venv python3-tk)."
    exit 1
fi

echo "✓ Python detectado: $(python3 --version)"

# 2. Crear entorno virtual si no existe
if [ ! -d "$APP_DIR/venv" ]; then
    echo "📦 Creando entorno virtual en app/venv..."
    python3 -m venv "$APP_DIR/venv"
fi

# 3. Instalar dependencias
echo "📥 Instalando dependencias de Python..."
"$APP_DIR/venv/bin/pip" install --upgrade pip
"$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt"
echo "✓ Dependencias instaladas correctamente."

# 4. Crear .env a partir de plantilla si no existe
if [ ! -f "$APP_DIR/.env" ]; then
    echo "📄 Creando archivo app/.env desde app/.env.example..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

# 5. Generar acceso directo .desktop
DESKTOP_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_DIR"

LAUNCHER_SCRIPT="$DIR/Iniciar Open Stream Suite.sh"
ICON_PATH="$DIR/imagencorp/logos/logo_symbol.png"

DESKTOP_FILE="$DESKTOP_DIR/open-stream-suite.desktop"
cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Type=Application
Name=Open Stream Suite
GenericName=Control de Streaming y OBS
Comment=Suite modular de overlays, alertas y control para Twitch y OBS Studio
Exec="$LAUNCHER_SCRIPT"
Icon=$ICON_PATH
Path=$DIR
Terminal=false
Categories=AudioVideo;Video;AudioVideoEditing;Network;
Keywords=stream;twitch;obs;overlays;alerts;deck;
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE"
chmod +x "$LAUNCHER_SCRIPT"

echo "✓ Acceso directo creado en: $DESKTOP_FILE"
echo
echo "============================================================"
echo "  ✅ INSTALACIÓN COMPLETADA CON ÉXITO"
echo "============================================================"
echo "Puedes iniciar la aplicación de cualquiera de estas formas:"
echo "  1. Desde el menú de aplicaciones de tu sistema ('Open Stream Suite')."
echo "  2. Haciendo doble clic en 'Iniciar Open Stream Suite.sh'."
echo "  3. Desde la terminal: ./Iniciar\ Open\ Stream\ Suite.sh"
echo "============================================================"
