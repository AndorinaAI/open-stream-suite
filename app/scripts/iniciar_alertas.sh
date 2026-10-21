#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — INICIADOR DEL SERVIDOR DE ALERTAS Y TRIGGERS
# ====================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$DIR/server.py" ]; then
    APP_DIR="$DIR"
else
    APP_DIR="$(cd "$DIR/.." && pwd)"
fi
cd "$APP_DIR"

# Leer SERVER_PORT de .env si existe
PORT=8080
if [ -f ".env" ]; then
    ENV_PORT=$(grep -E '^\s*SERVER_PORT\s*=' .env | cut -d '=' -f 2 | tr -d ' "[:space:]')
    if [ -n "$ENV_PORT" ]; then
        PORT="$ENV_PORT"
    fi
fi
PORT="${SERVER_PORT:-$PORT}"

echo "--------------------------------------------------------"
echo "🛠️  OPEN STREAM SUITE — INICIANDO SISTEMA DE ALERTAS Y TRIGGERS"
echo "Puerto configurado: $PORT"
echo "--------------------------------------------------------"

# Comprobar si existe el entorno virtual
if [ ! -d "venv" ]; then
    echo "Creando entorno virtual e instalando dependencias..."
    python3 -m venv venv
    if [ -f "requirements.txt" ]; then
        ./venv/bin/pip install -r requirements.txt
    else
        ./venv/bin/pip install aiohttp websockets requests
    fi
fi

# Abrir el panel de control en el navegador
(sleep 1.5 && xdg-open "http://localhost:$PORT/alerts/panel.html" 2>/dev/null) &

# Ejecutar el servidor Python
./venv/bin/python3 server.py
