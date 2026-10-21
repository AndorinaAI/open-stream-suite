#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — INSTALADOR AUTOMÁTICO PARA MACOS
# ====================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
APP_DIR="$DIR/app"

echo "============================================================"
echo "  🎮 OPEN STREAM SUITE — Instalación en macOS"
echo "============================================================"

if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 no está instalado. Instálalo desde https://www.python.org/ o con Homebrew: brew install python python-tk"
    exit 1
fi

echo "✓ Python detectado: $(python3 --version)"

if [ ! -d "$APP_DIR/venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv "$APP_DIR/venv"
fi

echo "📥 Instalando dependencias de Python..."
"$APP_DIR/venv/bin/pip" install --upgrade pip
"$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt"

if [ ! -f "$APP_DIR/.env" ]; then
    echo "📄 Creando app/.env..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

chmod +x "$DIR/Mac/Iniciar Open Stream Suite.command"

echo
echo "============================================================"
echo "  ✅ INSTALACIÓN COMPLETADA EN MACOS"
echo "============================================================"
echo "Puedes iniciar la suite haciendo doble clic en:"
echo "  'Mac/Iniciar Open Stream Suite.command'"
echo "============================================================"
