#!/usr/bin/env bash
# Un comando para el E2E del backlog de temas. Requiere el servidor en :8080.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/app"
if ! curl -fsS http://localhost:8080/api/themes/packs >/dev/null 2>&1; then
  echo "ERROR: el servidor no responde en http://localhost:8080" >&2
  exit 2
fi
exec venv/bin/python tests/e2e_theme_backlog.py
