#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — PREVIEW / CATÁLOGO (COMPATIBILIDAD HACIA ATRÁS)
# ====================================================================
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
exec "$DIR/scripts/iniciar_preview.sh" "$@"
