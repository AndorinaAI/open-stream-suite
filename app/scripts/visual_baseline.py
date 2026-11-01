#!/usr/bin/env python3
"""Arnés de regresión visual de las superficies de Open Stream Suite.

Captura una imagen por superficie (6 widgets + receptor de alertas + 27 escenas)
y compara dos capturas con diferencia de píxeles. Es la red de seguridad para
tocar la capa de apariencia: sin esto, vaciar `common/styles.css` es a ciegas.

Uso:
    python scripts/visual_baseline.py --out .backups/visual/base
    python scripts/visual_baseline.py --out .backups/visual/despues
    python scripts/visual_baseline.py --compare .backups/visual/base .backups/visual/despues

Necesita el servidor levantado en --base-url (por defecto localhost:8080).
Sale con código 1 si alguna superficie supera el umbral de diferencia.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
VIEWPORT = {"height": 1080, "width": 1920}
SETTLE_MS = 700

WIDGETS = ("chat", "ticker", "timer", "goal", "promo", "shoutout")


def targets() -> list:
    """[(etiqueta, ruta_url)] de todas las superficies."""
    out = [(f"widget-{w}", f"/widgets/{w}/index.html") for w in WIDGETS]
    out.append(("alerts", "/alerts/index.html"))
    for html in sorted(BASE_DIR.glob("streamthemes/*/overlays/**/index.html")):
        rel = html.relative_to(BASE_DIR).as_posix()
        label = rel.replace("streamthemes/", "").replace("/overlays/", "-").replace("/index.html", "")
        out.append((f"scene-{label.replace('/', '-')}", "/" + rel))
    return out


def capture(out_dir: Path, base_url: str) -> int:
    from playwright.sync_api import sync_playwright

    out_dir.mkdir(parents=True, exist_ok=True)
    items = targets()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        for label, path in items:
            page = browser.new_page(viewport=VIEWPORT)
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)[:120]))
            try:
                page.goto(base_url + path, wait_until="networkidle", timeout=20000)
                page.wait_for_timeout(SETTLE_MS)
                page.screenshot(path=str(out_dir / f"{label}.png"))
                state = page.evaluate(
                    "() => ({...document.body.dataset})")
                mark = " " if not errors else " !"
                print(f"{mark} {label:<46} {state}")
            except Exception as exc:
                print(f"x {label:<46} {exc}")
            finally:
                page.close()
        browser.close()
    return 0


def compare(before: Path, after: Path, threshold: float) -> int:
    from PIL import Image, ImageChops

    rows = []
    for png in sorted(before.glob("*.png")):
        other = after / png.name
        if not other.exists():
            rows.append((png.stem, None, "falta en la segunda captura"))
            continue
        a = Image.open(png).convert("RGB")
        b = Image.open(other).convert("RGB")
        if a.size != b.size:
            rows.append((png.stem, 100.0, "tamaño distinto"))
            continue
        diff = ImageChops.difference(a, b)
        changed = sum(1 for pixel in diff.getdata() if pixel != (0, 0, 0))
        ratio = changed * 100.0 / (a.size[0] * a.size[1])
        rows.append((png.stem, ratio, ""))

    rows.sort(key=lambda r: -1 if r[1] is None else -r[1])
    print(f"{'superficie':<48}{'% píxeles distintos':>22}  nota")
    for name, ratio, note in rows:
        value = "—" if ratio is None else f"{ratio:.4f}%"
        print(f"{name:<48}{value:>22}  {note}")

    over = [r for r in rows if r[1] is None or r[1] > threshold]
    print(f"\n{len(rows)} superficies | {len(over)} por encima del umbral {threshold}%")
    for name, ratio, note in over:
        print(f"  - {name}: {ratio if ratio is None else f'{ratio:.3f}%'} {note}")
    return 1 if over else 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Regresión visual de superficies")
    parser.add_argument("--out", help="carpeta donde guardar las capturas")
    parser.add_argument("--compare", nargs=2, metavar=("ANTES", "DESPUES"))
    parser.add_argument("--threshold", type=float, default=2.0,
                        help="%% de píxeles distintos tolerado (por defecto 2)")
    parser.add_argument("--base-url", default="http://localhost:8080")
    args = parser.parse_args(argv)

    if args.compare:
        return compare(Path(args.compare[0]), Path(args.compare[1]), args.threshold)
    if not args.out:
        parser.error("indica --out o --compare")
    return capture(Path(args.out), args.base_url.rstrip("/"))


if __name__ == "__main__":
    sys.exit(main())
