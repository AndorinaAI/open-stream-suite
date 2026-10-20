#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — LANZADOR LOCAL DE PRUEBAS / CATÁLOGO
# ====================================================================
# Abre el catálogo de previsualización en tu navegador por defecto.
# Detecta si el servidor principal ya está corriendo para evitar colisiones.

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Leer SERVER_PORT de .env si existe
SERVER_PORT=8080
if [ -f ".env" ]; then
    ENV_PORT=$(grep -E '^\s*SERVER_PORT\s*=' .env | cut -d '=' -f 2 | tr -d ' "[:space:]')
    if [ -n "$ENV_PORT" ]; then
        SERVER_PORT="$ENV_PORT"
    fi
fi

echo "--------------------------------------------------------"
echo "🛠️  OPEN STREAM SUITE — INICIANDO VISUALIZADOR LOCAL"
echo "Directorio: $DIR"
echo "--------------------------------------------------------"

# 1. Si el servidor principal ya está activo en SERVER_PORT, usarlo directamente
if curl -s "http://localhost:$SERVER_PORT/api/status" >/dev/null 2>&1; then
    echo "✓ Servidor Open Stream Suite ya activo en http://localhost:$SERVER_PORT"
    echo "Abriendo catálogo en http://localhost:$SERVER_PORT/index.html ..."
    xdg-open "http://localhost:$SERVER_PORT/index.html" 2>/dev/null || true
    exit 0
fi

# 2. Si no está activo el servidor principal, levantar servidor ligero en puerto dedicado
PREVIEW_PORT="${PREVIEW_PORT:-8082}"

# Comprobar si el puerto está libre o probar siguiente
if lsof -Pi :$PREVIEW_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    PREVIEW_PORT=$((PREVIEW_PORT + 1))
fi

echo "Iniciando servidor de previsualización en http://localhost:$PREVIEW_PORT ..."
echo "Pulsa Ctrl+C para detener."
(sleep 1 && xdg-open "http://localhost:$PREVIEW_PORT/index.html" 2>/dev/null) &
python3 -m http.server $PREVIEW_PORT
