#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — ACTUALIZADOR AUTOMÁTICO VÍA GIT
# ====================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

BRANCH="${1:-main}"

echo "============================================================"
echo "  🔄 ACTUALIZADOR DE OPEN STREAM SUITE"
echo "============================================================"
echo "Canal / Rama seleccionada: $BRANCH"
echo

if [ ! -d ".git" ]; then
    echo "⚠️ Esta carpeta no fue clonada con Git."
    echo "Descarga la última versión desde: https://github.com/andorina/open-stream-suite/releases"
    exit 1
fi

echo "📥 Descargando últimos cambios desde GitHub (rama: $BRANCH)..."
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo
echo "📦 Actualizando dependencias..."
if [ -f "app/venv/bin/pip" ]; then
    app/venv/bin/pip install -r app/requirements.txt
fi

echo
echo "============================================================"
echo "  ✅ ACTUALIZACIÓN COMPLETADA CON ÉXITO"
echo "============================================================"
echo "Reinicia la aplicación para aplicar todos los cambios."
echo "============================================================"
