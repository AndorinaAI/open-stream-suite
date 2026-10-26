#!/usr/bin/env python3
"""Inserta `<link rel="preload" as="font">` para los .woff2 que cada página usa.

Por qué (T4): `common/fonts.css` usa `font-display: swap` y las escenas no
declaraban ningún preload, así que los .woff2 se descubrían DESPUÉS del primer
pintado: el texto se maquetaba con la fuente de reserva y se re-maquetaba cuando
llegaba la fuente web (medido: `document.fonts` `loadingdone` a 45–166 ms, con
hasta 79 elementos cambiando de sitio ≥5 px sólo por este motivo). Con el preload
la petición arranca al parsear el HTML, en paralelo con el CSS.

La lista de fuentes por página NO se adivina: sale de los `.woff2` que la página
descarga realmente en Chrome (sonda CDP `t4_probe.py` → `fontsRequested`).

Uso:
  python3 scripts/apply_font_preloads.py <results_probe.json> [--check]
      --check  no escribe; falla si falta algún preload
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
APP = REPO / "app"
SCENES_JSON = APP / "scenes.json"

# Fuentes de la interfaz del panel (styles.css → --font-primary / --font-tech)
PANEL_FONTS = [
    "inter_normal_400.woff2", "inter_normal_600.woff2",
    "inter_normal_700.woff2", "inter_normal_800.woff2",
    "jetbrains_mono_normal_400.woff2", "jetbrains_mono_normal_700.woff2",
]

MARK_BEGIN = "<!-- preload-fonts:T4 (generado por scripts/apply_font_preloads.py) -->"
MARK_END = "<!-- /preload-fonts:T4 -->"


def tag_for(font_file: str) -> str:
    return (f'  <link rel="preload" as="font" type="font/woff2" crossorigin '
            f'href="/common/fonts/{font_file}">')


def apply_to(path: Path, fonts: list[str], check: bool) -> tuple[bool, str]:
    """Inserta/actualiza el bloque de preloads. Devuelve (cambió, motivo)."""
    if not path.is_file():
        return False, "no existe"
    html = path.read_text(encoding="utf-8")
    block = "\n".join([MARK_BEGIN] + [tag_for(f) for f in sorted(fonts)] + [MARK_END])
    existing = re.search(re.escape(MARK_BEGIN) + r".*?" + re.escape(MARK_END), html, flags=re.S)

    if existing:
        if existing.group(0) == block:
            return False, "ya sincronizado"
        if check:
            return True, "desincronizado"
        html = html[:existing.start()] + block + html[existing.end():]
    else:
        if check:
            return True, "falta el bloque de preloads"
        anchor = re.search(r"[ \t]*<meta charset=[^>]*>\n", html)
        if anchor:
            html = html[:anchor.end()] + block + "\n" + html[anchor.end():]
        else:
            head = re.search(r"<head[^>]*>\n", html)
            if not head:
                return False, "sin <head>"
            html = html[:head.end()] + block + "\n" + html[head.end():]

    path.write_text(html, encoding="utf-8")
    return True, "actualizado"


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    results = json.load(open(sys.argv[1], encoding="utf-8"))
    check = "--check" in sys.argv

    scenes = {s["key"]: s for s in json.load(open(SCENES_JSON, encoding="utf-8"))["scenes"]}
    plan: dict[Path, set[str]] = {}

    # 1. Escenas: fuentes medidas en Chrome por escena
    missing_measure = []
    for record in results:
        key = record.get("key")
        scene = scenes.get(key)
        fonts = record.get("fontsRequested") or []
        if not scene or not fonts:
            missing_measure.append(key)
            continue
        path = APP / scene["path"].lstrip("/")
        plan.setdefault(path, set()).update(fonts)

    # 2. Panel y catálogo: fuentes de la interfaz
    for rel in ("alerts/panel.html", "index.html", "alerts/index.html"):
        path = APP / rel
        if path.is_file():
            plan.setdefault(path, set()).update(PANEL_FONTS)

    changed = 0
    for path, fonts in sorted(plan.items()):
        did_change, why = apply_to(path, sorted(fonts), check)
        if did_change:
            changed += 1
            print(f"{'✗' if check else '✓'} {path.relative_to(REPO)} ({len(fonts)} fuentes) — {why}")

    print(f"\nTotal: {len(plan)} páginas, {changed} {'desincronizadas' if check else 'actualizadas'}")
    if missing_measure:
        print(f"⚠️ sin medida de fuentes (no se tocan): {missing_measure}")
    if check and changed:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
