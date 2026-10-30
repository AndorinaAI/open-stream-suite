#!/usr/bin/env python3
"""CLI del motor de apariencia: regenera `app/common/generated/*`.

Uso:
    python app/scripts/build_theme_engine.py            # genera (y valida)
    python app/scripts/build_theme_engine.py --check    # solo valida el manifiesto
    python app/scripts/build_theme_engine.py --stale    # sale 1 si esta desfasado

El backend lo llama al arrancar (`theme_manager.sync_common_themes_css`) y CI
comprueba que lo generado esta al dia, de modo que el motor nunca se queda
desfasado respecto al manifiesto.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from server.services import theme_engine  # noqa: E402


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Genera el motor de apariencia")
    parser.add_argument("--check", action="store_true",
                        help="solo valida el manifiesto (no escribe)")
    parser.add_argument("--stale", action="store_true",
                        help="sale con codigo 1 si lo generado esta desfasado")
    args = parser.parse_args(argv)

    problems = theme_engine.validate_manifest()
    if problems:
        print("MANIFIESTO INVALIDO:")
        for problem in problems:
            print(f"  - {problem}")
        if not args.check:
            return 1
    else:
        print("Manifiesto valido: sin problemas.")

    if args.check:
        return 0

    written = theme_engine.build_all()
    for name, content in written.items():
        print(f"  generado {name} ({len(content)} bytes)")

    if args.stale and theme_engine.is_stale():
        print("ERROR: lo generado sigue desfasado.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
