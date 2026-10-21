#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — INICIADOR DIRECTO (MACOS)
# ====================================================================
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/../app"

if [ -f "venv/bin/python3" ]; then
    PYTHON_EXEC="venv/bin/python3"
else
    PYTHON_EXEC="python3"
fi

echo "🚀 Iniciando Open Stream Suite..."
exec $PYTHON_EXEC launcher.py "$@"
