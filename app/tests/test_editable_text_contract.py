#!/usr/bin/env python3
"""Contrato de textos editables (paso 4d del plan).

`dom-injector.js` sabe APLICAR textos por `data-text-key`, pero solo los
elementos que ya traian el atributo eran editables: el barrido detecto ~180
textos del producto que se quedaban fuera.

Aqui se fija:

  1. `common/overlay/static-texts.json` declara lo que NO es editable
     (relojes, telemetria, iconos) con selectores y patrones;
  2. el motor expone `OSSSkin.autoTagTexts()` y respeta `data-oss-static`;
  3. la escena la ejecuta ANTES de aplicar la configuracion de textos;
  4. todas las vistas cargan el motor (si no, no hay auto-etiqueta).
"""
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

STATIC_TEXTS = APP / "common" / "overlay" / "static-texts.json"
OSS_SKIN_JS = APP / "common" / "oss-skin.js"
OVERLAY_JS = APP / "common" / "overlay.js"


class TestEditableTextContract(unittest.TestCase):
    def test_1_las_reglas_de_texto_fijo_son_validas(self):
        data = json.loads(STATIC_TEXTS.read_text(encoding="utf-8"))
        self.assertIsInstance(data.get("selectors"), list)
        self.assertIsInstance(data.get("textPatterns"), list)
        self.assertTrue(data["selectors"], "sin selectores fijos")
        self.assertIn("[data-oss-static]", data["selectors"],
                      "falta la marca explicita data-oss-static")
        for pattern in data["textPatterns"]:
            re.compile(pattern)  # lanza si no es una regex valida

    def test_2_el_motor_expone_la_autoetiqueta(self):
        js = OSS_SKIN_JS.read_text(encoding="utf-8")
        self.assertIn("autoTagTexts", js)
        self.assertIn("data-text-key", js)
        self.assertIn("data-oss-static", js)
        self.assertIn("static-texts.json", js,
                      "la auto-etiqueta no lee las reglas de texto fijo")

    def test_3_la_escena_etiqueta_antes_de_aplicar_textos(self):
        js = OVERLAY_JS.read_text(encoding="utf-8")
        start = js.index("function applyConfigToDOM(")
        end = js.index("function initOverlay(", start)
        block = js[start:end]
        self.assertIn("autoTagTexts", block,
                      "applyConfigToDOM no auto-etiqueta antes de aplicar textos")
        self.assertLess(block.index("autoTagTexts"),
                        block.index("OSSDomInjector.applyConfigToDOM(config)"),
                        "la auto-etiqueta debe ir ANTES de aplicar la configuracion")

    def test_4_todas_las_vistas_cargan_el_motor(self):
        sys.path.insert(0, str(APP / "scripts"))
        import normalize_view_links as N  # noqa: E402

        # `alerts/panel.html` es el panel de control (no renderiza overlays).
        offenders = []
        for path in N.view_targets():
            if path.name == "panel.html":
                continue
            html = path.read_text(encoding="utf-8")
            if "oss-skin.js" not in html:
                offenders.append(str(path.relative_to(APP)))
        self.assertEqual([], offenders,
                         "vistas sin el motor de auto-etiqueta: " + repr(offenders))


if __name__ == "__main__":
    unittest.main()
