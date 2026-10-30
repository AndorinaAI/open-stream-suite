#!/usr/bin/env python3
"""Contrato de un widget: lo mínimo para que el sistema lo trate bien.

Un widget NO necesita declarar qué temas, formas ni colores existen: el
catálogo los publica y la UI los pinta. Lo que sí necesita es cumplir este
contrato, y si falta algo el panel falla en silencio ("Cargando módulo…").

Comprueba, por cada `app/widgets/<id>/`:

  1. `index.html` con `data-oss-panel` y `data-oss-shape-target`
     (sin la primera, el tema no pinta el contenedor; sin la segunda, las
     formas físicas no se ven).
  2. `config.json` (lo publica /api/widgets/config).
  3. `widget.js` inicializando `OSSTheme.init('<id>')`.
  4. Al menos un `panel/*.js` registrando `WidgetModules['<id>']`
     (sin esto, la mini-app no pinta sus controles).

Los symlinks (p. ej. `promo -> shoutout`) se omiten: comparten código con el
directorio real y su id se resuelve por URL.

Uso:
    python scripts/check_widget_contract.py
Salida: 0 si todos cumplen, 1 y un listado de lo que falta si no.
"""
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
WIDGETS_DIR = BASE / "widgets"


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def check_widget(path: Path) -> list:
    """Lista de problemas del widget. Vacía = cumple el contrato."""
    wid = path.name
    problems = []

    index = path / "index.html"
    if not index.exists():
        problems.append("falta index.html")
    else:
        html = _read(index)
        if "data-oss-panel" not in html:
            problems.append("index.html sin data-oss-panel (el tema no pinta el contenedor)")
        if "data-oss-shape-target" not in html:
            problems.append("index.html sin data-oss-shape-target (las formas no se ven)")

    if not (path / "config.json").exists():
        problems.append("falta config.json")

    widget_js = path / "widget.js"
    if not widget_js.exists():
        problems.append("falta widget.js")
    else:
        js = _read(widget_js)
        if "OSSTheme.init(" not in js:
            problems.append("widget.js no llama a OSSTheme.init()")

    panel_dir = path / "panel"
    panel_files = sorted(panel_dir.glob("*.js")) if panel_dir.is_dir() else []
    registered = any(
        (f"WidgetModules['{wid}']" in _read(p)) or (f'WidgetModules["{wid}"]' in _read(p))
        for p in panel_files
    )
    if not registered:
        problems.append(f"ningún panel/*.js registra WidgetModules['{wid}']")

    return problems


def main() -> int:
    if not WIDGETS_DIR.is_dir():
        print(f"No existe {WIDGETS_DIR}", file=sys.stderr)
        return 1

    failed = 0
    checked = 0
    for path in sorted(WIDGETS_DIR.iterdir()):
        if not path.is_dir() or path.is_symlink():
            continue  # los alias comparten el directorio real
        checked += 1
        problems = check_widget(path)
        if problems:
            failed += 1
            print(f"✗ {path.name}")
            for p in problems:
                print(f"    - {p}")
        else:
            print(f"✓ {path.name}")

    if failed:
        print(f"\n{failed} de {checked} widgets no cumplen el contrato.", file=sys.stderr)
        print("Ver docs/GUIA_NUEVO_WIDGET.md", file=sys.stderr)
        return 1
    print(f"\n{checked} widgets cumplen el contrato.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
