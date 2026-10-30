#!/usr/bin/env python3
"""Migración al sistema único de temas: separa contenido de aspecto.

Los `presets[]` de cada widget mezclaban las dos cosas en el mismo objeto:
`title`/`target`/`type` (contenido) junto a `bgColor`/`borderColor`/`shape`
(aspecto). Aplicar una plantilla de contenido machacaba el look del tema.

Este script:

1. Quita de cada preset las claves **visuales**.
2. Las mueve a `styleOverrides` del widget, para no perder el aspecto actual
   (el usuario conserva lo que tenía configurado).
3. Deja los presets con solo contenido.
4. Hace backup `.bak` de cada fichero tocado.

Uso:
    python scripts/migrate_theme_unification.py --dry-run   # ver qué cambiaría
    python scripts/migrate_theme_unification.py             # aplicar
    python scripts/migrate_theme_unification.py --check     # CI: 1 si falta migrar

Es idempotente: ejecutarlo dos veces no cambia nada la segunda.
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
WIDGETS = ["chat", "goal", "promo", "shoutout", "ticker", "timer"]

# Claves de un preset que describen ASPECTO, no contenido. Se mueven a
# `styleOverrides` y se eliminan del preset.
VISUAL_KEYS = (
    "shape", "bgType", "bgColor", "bgGradient", "bgOpacity",
    "borderStyle", "borderWidth", "borderColor", "borderRadius",
    "accentColor", "glowIntensity", "fontFamily", "fontSize",
    "barColorStart", "barColorEnd", "barPattern", "barHeight",
    "animation", "textColor",
)

# Subconjunto que `styleOverrides` entiende hoy (ver common/widget-overrides.js).
# El resto (barColorStart/End, textColor...) no tiene variable todavía: se
# elimina del preset igualmente, pero no se escribe como override.
OVERRIDE_KEYS = (
    "accentColor", "bgColor", "bgOpacity", "borderColor", "borderWidth",
    "borderStyle", "glowIntensity", "fontFamily", "fontSize",
    "barPattern", "barHeight",
)


def migrate_widget(data):
    """Devuelve (nuevos_datos, cambiado). No muta la entrada."""
    out = json.loads(json.dumps(data))  # copia
    changed = False

    presets = out.get("presets")
    if isinstance(presets, list):
        for preset in presets:
            for key in VISUAL_KEYS:
                if key in preset:
                    preset.pop(key)
                    changed = True

    # `styleOverrides` arranca de los `styles` actuales del widget: es lo que
    # el usuario está viendo hoy, así que migrar no le cambia el aspecto.
    if "styleOverrides" not in out:
        styles = out.get("styles") if isinstance(out.get("styles"), dict) else {}
        overrides = {k: styles[k] for k in OVERRIDE_KEYS if k in styles and styles[k] not in (None, "")}
        out["styleOverrides"] = overrides
        changed = True

    return out, changed


def needs_migration(data):
    """True si queda alguna clave visual en algún preset."""
    for preset in (data.get("presets") or []):
        if any(k in preset for k in VISUAL_KEYS):
            return True
    return "styleOverrides" not in data


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="no escribe nada")
    ap.add_argument("--check", action="store_true", help="falla si algo sin migrar (CI)")
    ap.add_argument("--no-backup", action="store_true", help="no crear .bak")
    args = ap.parse_args()

    pending = []
    for w in WIDGETS:
        path = BASE / "widgets" / w / "config.json"
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            print(f"  ! {w}: JSON inválido ({exc})", file=sys.stderr)
            continue

        if args.check:
            if needs_migration(data):
                pending.append(w)
            continue

        new_data, changed = migrate_widget(data)
        if not changed:
            continue
        if args.dry_run:
            n = len((data.get("presets") or []))
            print(f"  ~ {w}: {n} presets -> sin claves visuales, "
                  f"styleOverrides={len(new_data.get('styleOverrides') or {})} claves")
            continue
        if not args.no_backup:
            shutil.copy2(path, path.with_suffix(".json.bak"))
        path.write_text(json.dumps(new_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"  ✓ {w} migrado")

    if args.check:
        if pending:
            print("Sin migrar: " + ", ".join(pending), file=sys.stderr)
            print("Ejecuta: python scripts/migrate_theme_unification.py", file=sys.stderr)
            return 1
        print("Todo migrado.")
        return 0

    if args.dry_run:
        print("(dry-run: no se escribió nada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
