"""Contrato de las tres capas: estructura, paleta y personalizacion.

Ninguna capa puede escribir las propiedades de otra:

- ESTRUCTURA (forma)  -> border-radius, clip-path, adornos
- PALETA (tema)       -> --color-*
- PERSONALIZACION     -> overrides del widget

Estos casos pinchan las trampas que ya hemos pisado una vez.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

APP = Path(__file__).resolve().parents[1]
WIDGETS = ("chat", "goal", "shoutout", "ticker", "timer")


class TestOrnamentBelongsToShape:
    """El adorno lo pinta la forma, no el tema."""

    @pytest.mark.parametrize("widget", WIDGETS)
    def test_1_cada_widget_tiene_el_gancho_de_adorno(self, widget: str) -> None:
        html = (APP / "widgets" / widget / "index.html").read_text(encoding="utf-8")
        assert 'data-ornament="tape"' in html, f"{widget} sin gancho de adorno"

    def test_2_el_adorno_exige_una_forma_elegida(self) -> None:
        """Sin `data-theme-shape` no se pinta: el tema no decide estructura."""
        css = (APP / "common" / "oss-skin.css").read_text(encoding="utf-8")
        lines = css.splitlines()
        found = 0
        for i, ln in enumerate(lines):
            if "--skin-ornament-tape" in ln and "display:" in ln:
                selector = lines[i - 1].strip()
                assert "data-theme-shape" in selector, (
                    f"la cinta se pinta sin forma: {selector[:70]}"
                )
                found += 1
        assert found, "no hay regla que encienda la cinta"

    def test_3_el_adorno_no_usa_pseudo_elementos(self) -> None:
        """Las formas ya usan ::before/::after; un tercero las borraria."""
        css = (APP / "common" / "oss-skin.css").read_text(encoding="utf-8")
        head = css.split("ADORNO DEL ARQUETIPO", 1)[-1].split("====", 1)[-1]
        assert "oss-ornament" in head
        assert "::after" not in head, "el adorno vuelve a usar ::after"

    def test_4_una_forma_puede_vetar_el_adorno(self) -> None:
        """`geometry.ornaments` = adornos que la forma NO admite."""
        pcb = json.loads(
            (APP / "streamthemes" / "Maker_Theme_Pack" / "pack.json").read_text(encoding="utf-8")
        )
        shape = next(s for s in pcb["shapes"] if s["id"] == "maker_circuit_pcb")
        assert "tape" in (shape.get("geometry") or {}).get("ornaments", [])

    def test_5_una_forma_puede_heredar_el_adorno(self) -> None:
        """`ornaments: null` = hereda los del arquetipo (polaroid + cinta)."""
        cozy = json.loads(
            (APP / "streamthemes" / "Cozy_LoFi_Pack" / "pack.json").read_text(encoding="utf-8")
        )
        shape = next(s for s in cozy["shapes"] if s["id"] == "cozy_polaroid")
        assert not (shape.get("geometry") or {}).get("ornaments")


class TestLayersDoNotWriteEachOther:
    """Cada capa escribe solo lo suyo."""

    def test_6_las_formas_no_fijan_colores(self) -> None:
        """Un color literal en shapes.css pisaria la paleta del tema."""
        harmless = ("none", "transparent", "inherit", "currentColor", "unset", "auto")
        offenders = []
        for css in sorted((APP / "streamthemes").glob("*/shapes.css")):
            for n, line in enumerate(css.read_text(encoding="utf-8").splitlines(), 1):
                s = line.strip()
                if not s or s.startswith(("/*", "*", "//")):
                    continue
                if not s.startswith(("background:", "color:", "background-color:")):
                    continue
                if "var(--" in s or any(h in s for h in harmless):
                    continue
                offenders.append(f"{css.parent.name}:{n} {s[:50]}")
        assert not offenders, "formas con color literal:\n" + "\n".join(offenders[:5])

    def test_7_la_tarjeta_de_alerta_lee_la_paleta(self) -> None:
        css = (APP / "alerts" / "css" / "alerts-widget.css").read_text(encoding="utf-8")
        assert "var(--color-panel-bg" in css, "la tarjeta de alerta ignora la paleta"
