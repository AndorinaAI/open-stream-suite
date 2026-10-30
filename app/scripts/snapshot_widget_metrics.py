#!/usr/bin/env python3
"""Mide el contenido de los widgets y guarda/compare un snapshot.

Evidencia de regresion de la Fase 5: con el tema del pack, el CONTENIDO
(mensajes, filas, tarjetas) debe seguir al tema; sin tema, debe quedarse
exactamente como estaba.

    python scripts/snapshot_widget_metrics.py             # mide y compara
    python scripts/snapshot_widget_metrics.py --update    # regenera el snapshot
    python scripts/snapshot_widget_metrics.py --check     # falla si difiere
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
OUT = APP / "docs" / "regression" / "widget-content-metrics.json"
BASE = "http://127.0.0.1:8080"

WIDGETS = {
    "chat": ".chat-msg",
    "goal": ".goal-item",
    "ticker": ".prompter-item",
    "shoutout": ".shoutout-card-body",
    "promo": ".shoutout-card-body",
    "timer": ".timer-card",
}
STATES = {"none": None, "maker": "maker", "cozy": "latte_caramel"}
CHROME = "/home/andorina/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"

PROBE = """(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const s = getComputedStyle(el);
  return {
    radius: s.borderTopLeftRadius,
    bg: s.backgroundColor,
    borderWidth: s.borderTopWidth,
    font: s.fontFamily.split(',')[0].replace(/["']/g, '').trim()
  };
}"""


def measure() -> dict:
    from playwright.sync_api import sync_playwright

    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME)
        page = browser.new_page(viewport={"width": 900, "height": 700})
        for widget, sel in WIDGETS.items():
            out[widget] = {}
            for state, theme in STATES.items():
                url = f"{BASE}/widgets/{widget}/index.html?preview=true"
                if theme:
                    url += f"&theme={theme}"
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=9000)
                    page.wait_for_timeout(1300)
                    out[widget][state] = page.evaluate(PROBE, sel)
                except Exception as exc:  # noqa: BLE001
                    out[widget][state] = {"error": str(exc)[:120]}
        browser.close()
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--update", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args(argv)

    live = measure()
    if args.update:
        payload = {"generatedAt": date.today().isoformat(), "widgets": live}
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"snapshot actualizado: {OUT.relative_to(APP)}")
        return 0

    if not OUT.is_file():
        print("falta el snapshot; ejecuta --update")
        return 2
    expected = json.loads(OUT.read_text(encoding="utf-8"))["widgets"]
    diffs = []
    for widget, states in expected.items():
        for state, exp in states.items():
            got = live.get(widget, {}).get(state)
            if got != exp:
                diffs.append((widget, state, exp, got))
    if diffs:
        for widget, state, exp, got in diffs:
            print(f"DIF {widget}/{state}:\n  esperado {exp}\n  obtenido {got}")
        print(f"\n{len(diffs)} diferencias frente a la evidencia versionada")
        return 1
    print(f"OK: {sum(len(v) for v in expected.values())} mediciones coinciden con el snapshot")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
