#!/usr/bin/env python3
"""Normaliza el bloque de CSS de todas las vistas a una lista y un orden unicos.

Problema que resuelve: cada tipo de vista cargaba una combinacion distinta
(las escenas no cargaban `oss-skin.css`, los widgets no cargaban
`components.css`, `fonts.css` iba al principio o al final...). La misma regla
ganaba o perdia segun la vista, asi que la apariencia dependia del HTML.

Orden canonico:

    fonts -> styles -> generated/archetypes -> generated/shapes
          -> themes -> components -> (CSS propio de la vista) -> oss-skin

`oss-skin.css` va SIEMPRE al final: es la capa de skin de componentes y debe
poder ganar a la base. Los CSS propios de la vista conservan su orden relativo
y su `?v=`.

Uso:
    python scripts/normalize_view_links.py           # aplica
    python scripts/normalize_view_links.py --check   # solo informa (CI)
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]

# Slots del bloque comun, en el orden en que se cargan.
COMMON_SLOTS = (
    ("fonts", "common/fonts.css"),
    ("styles", "common/styles.css"),
    ("archetypes", "common/generated/archetypes.css"),
    ("shapes", "common/generated/shapes.css"),
    ("themes", "common/themes.css"),
    ("components", "common/components.css"),
)
OSS_SKIN = "oss-skin"

LINK_RE = re.compile(
    r'^(?P<indent>[ \t]*)<link\b(?P<attrs>[^>]*?\brel="stylesheet"[^>]*?)>\s*$')
HREF_RE = re.compile(r'href="(?P<href>[^"]+)"')
SCRIPT_RE = re.compile(
    r'^(?P<indent>[ \t]*)<script\b[^>]*src="(?P<src>[^"]+)"[^>]*>\s*</script>\s*$')


def view_targets() -> list:
    """Todas las vistas que deben cargar el bloque comun."""
    targets = []
    targets += sorted((APP_DIR / "widgets").glob("*/index.html"))
    targets += sorted((APP_DIR / "alerts").glob("*.html"))
    targets += sorted((APP_DIR / "streamthemes").glob("*/overlays/**/index.html"))
    return targets


def _href_of(tag: str) -> str | None:
    m = HREF_RE.search(tag)
    return m.group("href") if m else None


def _slot_of(href: str) -> str | None:
    """Slot canonico de un href, o None si es CSS propio de la vista."""
    for slot, suffix in COMMON_SLOTS:
        if href.endswith(suffix):
            return slot
    if href.endswith("common/oss-skin.css"):
        return OSS_SKIN
    return None


def _prefix_of(href: str) -> str:
    """Prefijo comun del href (`/`, `../`, `../../`)."""
    idx = href.find("common/")
    return href[:idx] if idx >= 0 else ""


def desired_hrefs(hrefs: list) -> tuple:
    """Devuelve (hrefs_comunes, hrefs_propios) en el orden canonico.

    `hrefs_comunes` se construye desde el prefijo de `styles.css`; si una vista
    no lo declara se usa el prefijo mas frecuente.
    """
    styles = next((h for h in hrefs if h.endswith("common/styles.css")), None)
    if styles is None:
        return (), ()
    prefix = _prefix_of(styles)

    by_slot = {}
    own = []
    for href in hrefs:
        slot = _slot_of(href)
        if slot is None:
            own.append(href)
        else:
            by_slot.setdefault(slot, href)

    common = []
    for slot, suffix in COMMON_SLOTS:
        common.append(by_slot.get(slot) or (prefix + suffix))
    common.append(by_slot.get(OSS_SKIN) or (prefix + "common/oss-skin.css"))
    return tuple(common), tuple(own)


def normalize_scripts(text: str) -> tuple:
    """Garantiza `common/oss-skin.js` ANTES del script de la vista.

    El motor de skin (y su auto-etiqueta de textos, `autoTagTexts`) tiene que
    existir cuando `overlay.js` aplica la configuracion. Las escenas cargaban
    el CSS pero no el JS, asi que sus componentes nunca recibian el skin y sus
    textos no se podian etiquetar.
    """
    if "oss-skin.js" in text:
        return text, False
    lines = text.split("\n")
    target = None
    for i, line in enumerate(lines):
        match = SCRIPT_RE.match(line)
        if not match:
            continue
        src = match.group("src")
        if src.endswith("common/overlay.js") or src.endswith("common/widget-theme.js"):
            target = i
            break
    if target is None:
        return text, False
    match = SCRIPT_RE.match(lines[target])
    src = match.group("src")
    prefix = src[:src.index("common/")] if "common/" in src else ""
    indent = match.group("indent")
    lines.insert(target, f'{indent}<script src="{prefix}common/oss-skin.js"></script>')
    return "\n".join(lines), True


def normalize_text(text: str) -> tuple:
    """Devuelve (texto_normalizado, cambio). Reemplaza el bloque de links.

    Se reescribe el tramo que va del primer al ultimo `<link rel="stylesheet">`
    conservando cualquier linea intermedia que no sea un stylesheet.
    """
    normalized, changed_links = _normalize_links(text)
    normalized, changed_scripts = normalize_scripts(normalized)
    return normalized, (changed_links or changed_scripts)


def _normalize_links(text: str) -> tuple:
    lines = text.split("\n")
    positions = [i for i, line in enumerate(lines) if LINK_RE.match(line)]
    if not positions:
        return text, False

    indent = LINK_RE.match(lines[positions[0]]).group("indent")
    hrefs = []
    for i in positions:
        href = _href_of(lines[i])
        if href:
            hrefs.append(href)

    common, own = desired_hrefs(hrefs)
    if not common:
        return text, False

    new_block = [f'{indent}<link rel="stylesheet" href="{href}">' for href in common[:-1]]
    new_block += [f'{indent}<link rel="stylesheet" href="{href}">' for href in own]
    new_block.append(f'{indent}<link rel="stylesheet" href="{common[-1]}">')

    first, last = positions[0], positions[-1]
    kept = [line for i, line in enumerate(lines[first:last + 1])
            if not LINK_RE.match(line)]
    # Las lineas ajenas (comentarios, scripts sueltos) conservan su posicion
    # relativa: van antes del bloque nuevo.
    replacement = kept + new_block

    normalized = "\n".join(lines[:first] + replacement + lines[last + 1:])
    return normalized, normalized != text


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="no escribe; devuelve 1 si hay algo que normalizar")
    args = parser.parse_args(argv)

    changed = []
    for path in view_targets():
        text = path.read_text(encoding="utf-8")
        normalized, changed_flag = normalize_text(text)
        if not changed_flag:
            continue
        changed.append(path.relative_to(APP_DIR))
        if not args.check:
            path.write_text(normalized, encoding="utf-8")

    if not changed:
        print("Vistas normalizadas: nada que hacer.")
        return 0
    if args.check:
        print("Vistas con el bloque de CSS desnormalizado:")
        for rel in changed:
            print(f"  - {rel}")
        print("Ejecuta: python scripts/normalize_view_links.py")
        return 1

    print(f"Vistas normalizadas: {len(changed)}")
    for rel in changed:
        print(f"  + {rel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
