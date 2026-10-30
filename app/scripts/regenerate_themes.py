#!/usr/bin/env python3
"""Regenera (o comprueba) el CSS de todos los temas desde su `theme.json`.

`theme.json` es la unica fuente: `style.css` y `common/themes.css` son
derivados. Este CLI es la herramienta de mantenimiento y el guardian del CI.

    python scripts/regenerate_themes.py            # aplica
    python scripts/regenerate_themes.py --check    # falla si hay diferencias
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from server.services.theme_render import (  # noqa: E402
    regenerate_all_factory_copies,
    regenerate_all_themes,
)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="no escribe; devuelve 1 si algun style.css esta desfasado")
    args = parser.parse_args(argv)

    pending = regenerate_all_themes(check=args.check)
    factory = regenerate_all_factory_copies(check=args.check)
    if not pending and not factory:
        print("Temas: nada que regenerar (theme.json -> style.css al dia; fabrica al dia).")
        return 0
    if args.check:
        print("Temas desactualizados respecto a theme.json:")
        for name, why in sorted({**pending, **factory}.items()):
            print(f"  - {name}: {why}")
        print("Ejecuta: python scripts/regenerate_themes.py")
        return 1

    print(f"Temas regenerados: {len(pending)} | copias de fabrica: {len(factory)}")
    for name in sorted(set(pending) | set(factory)):
        print(f"  + {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
