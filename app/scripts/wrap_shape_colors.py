#!/usr/bin/env python3
"""Envuelve los colores literales de las formas en tokens del tema.

Las formas (`streamthemes/<Pack>/shapes.css`) pintaban color a mano:

    background: linear-gradient(135deg, rgba(46,34,22,.95), …) !important;
    border: 2px solid #C4A47C !important;
    color: #4A3B32 !important;

Eso hace que una forma de otro pack **pise la paleta** del tema elegido. Aquí
cada valor se envuelve en su token, conservándolo como respaldo:

    background: var(--color-panel-bg, linear-gradient(…)) !important;
    border: 2px solid var(--color-border-cyan, #C4A47C) !important;
    color: var(--color-text-light, #4A3B32) !important;

Resultado: el tema manda; sin tema, la forma conserva su carácter.

Uso:
    python scripts/wrap_shape_colors.py --check   # CI: 1 si queda algun literal
    python scripts/wrap_shape_colors.py           # aplicar
    python scripts/wrap_shape_colors.py --dry-run
"""
import argparse
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
PACKS_DIR = BASE / "streamthemes"

# Propiedad -> token del tema que debe mandar.
TOKEN_FOR = {
    "background": "--color-panel-bg",
    "background-color": "--color-panel-bg",
    "color": "--color-text-light",
    "border-color": "--color-border-cyan",
}

# Valores que no son color pintable.
SKIP_VALUES = {"transparent", "inherit", "none", "currentcolor", "initial", "unset", ""}

# `border: 2px solid #C4A47C` -> el color va en el medio.
BORDER_SHORTHAND = re.compile(
    r"^(\s*border(?:-(?:top|right|bottom|left))?\s*:\s*)([^;]*?)(\s+solid\s+)(#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\))(\s*(?:!\s*important)?\s*;?\s*)$"
)

PROP_LINE = re.compile(
    r"^(\s*)(background|background-color|color|border-color)(\s*:\s*)(.+?)(\s*!\s*important)?(\s*;?\s*)$"
)


def _already_tokenized(value: str) -> bool:
    return "var(--" in value


def _wrap(value: str, token: str) -> str:
    return f"var({token}, {value})"


def wrap_colors(css: str) -> str:
    """Devuelve el CSS con cada color literal envuelto en su token. Idempotente."""
    out = []
    for line in css.split("\n"):
        # 1) `border` / `border-top` … con color al final
        m = BORDER_SHORTHAND.match(line)
        if m and not _already_tokenized(m.group(4)):
            prefix, size_style, sep, color, tail = m.groups()
            out.append(f"{prefix}{size_style}{sep}{_wrap(color, '--color-border-cyan')}{tail}")
            continue

        # 2) propiedad de color directa
        m = PROP_LINE.match(line)
        if m:
            indent, prop, colon, value, important, tail = m.groups()
            value = (value or "").strip()
            if value.lower() in SKIP_VALUES or _already_tokenized(value):
                out.append(line)
                continue
            token = TOKEN_FOR[prop]
            out.append(f"{indent}{prop}{colon}{_wrap(value, token)}{important or ''}{tail}")
            continue

        out.append(line)
    return "\n".join(out)


def literals_left(css: str) -> int:
    """Cuenta colores de forma que siguen sin token (para --check)."""
    count = 0
    for line in css.split("\n"):
        m = PROP_LINE.match(line)
        if m:
            value = (m.group(4) or "").strip()
            if value.lower() not in SKIP_VALUES and not _already_tokenized(value):
                count += 1
            continue
        m = BORDER_SHORTHAND.match(line)
        if m and not _already_tokenized(m.group(4)):
            count += 1
    return count


def shape_files():
    return sorted(PACKS_DIR.glob("*/shapes.css"))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="falla si queda algún literal (CI)")
    ap.add_argument("--dry-run", action="store_true", help="no escribe nada")
    args = ap.parse_args()

    files = shape_files()
    if not files:
        print(f"No se encontraron {PACKS_DIR}/*/shapes.css", file=sys.stderr)
        return 1

    pending = []
    for path in files:
        original = path.read_text(encoding="utf-8")
        if args.check:
            left = literals_left(original)
            if left:
                pending.append((path.name, left))
            continue
        wrapped = wrap_colors(original)
        if args.check:
            if left:
                pending.append((path.name, left))
            continue
        if wrapped == original:
            print(f"= {path.parent.name}/shapes.css (sin cambios)")
            continue
        if args.dry_run:
            antes = literals_left(original)
            print(f"~ {path.parent.name}/shapes.css: {antes} literales -> {left}")
            continue
        path.write_text(wrapped, encoding="utf-8")
        print(f"✓ {path.parent.name}/shapes.css")

    if args.check:
        if pending:
            for name, n in pending:
                print(f"✗ {name}: {n} colores sin token", file=sys.stderr)
            print("Ejecuta: python scripts/wrap_shape_colors.py", file=sys.stderr)
            return 1
        print("Todas las formas usan tokens del tema.")
        return 0

    if args.dry_run:
        print("(dry-run: no se escribió nada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
