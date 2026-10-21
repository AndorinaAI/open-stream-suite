#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — INICIADOR PARA LINUX / MACOS
# ====================================================================
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [ -f "$DIR/launcher.py" ]; then
    APP_DIR="$DIR"
else
    APP_DIR="$( cd "$DIR/.." >/dev/null 2>&1 && pwd )"
fi
cd "$APP_DIR"

if [ -f "venv/bin/python3" ]; then
    PYTHON_EXEC="venv/bin/python3"
else
    PYTHON_EXEC="python3"
fi

# Si se ejecuta desde terminal interactiva o doble clic, arrancar desacoplado y cerrar la consola
if [ -t 0 ] && [ "$1" != "--foreground" ]; then
    nohup $PYTHON_EXEC launcher.py "$@" >/dev/null 2>&1 &
    exit 0
else
    exec $PYTHON_EXEC launcher.py "$@"
fi
