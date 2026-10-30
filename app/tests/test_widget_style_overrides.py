"""Contrato de la separación contenido / aspecto en los widgets.

Un `preset` es una **plantilla de contenido** (qué meta, qué anuncio, qué
frase). El aspecto lo define el tema del pack. Antes cada preset llevaba dentro
un look completo con colores fijos, así que aplicar una plantilla machacaba el
tema.

El aspecto del usuario vive en `styleOverrides`, que
`common/widget-overrides.js` traduce a variables `--widget-*`.
"""
import json
import unittest
from pathlib import Path

from server.config import BASE_DIR

APP = Path(BASE_DIR)
WIDGETS = ["chat", "goal", "promo", "shoutout", "ticker", "timer"]
VISUAL_KEYS = (
    "shape", "bgType", "bgColor", "bgGradient", "bgOpacity",
    "borderStyle", "borderWidth", "borderColor", "borderRadius",
    "accentColor", "glowIntensity", "fontFamily", "fontSize",
    "barColorStart", "barColorEnd", "barPattern", "barHeight",
    "animation", "textColor",
)
OVERRIDE_KEYS = (
    "accentColor", "bgColor", "bgOpacity", "borderColor", "borderWidth",
    "borderStyle", "glowIntensity", "fontFamily", "fontSize",
    "barPattern", "barHeight",
)


def _config(widget):
    return json.loads((APP / "widgets" / widget / "config.json").read_text(encoding="utf-8"))


class ContentAspectSeparationContract(unittest.TestCase):
    def test_no_visual_keys_in_presets(self):
        """Ningún preset puede volver a llevar aspecto."""
        for w in WIDGETS:
            for preset in (_config(w).get("presets") or []):
                found = [k for k in VISUAL_KEYS if k in preset]
                self.assertEqual(
                    found, [],
                    f"{w}/{preset.get('id')}: el preset lleva claves visuales {found}",
                )

    def test_style_overrides_exists(self):
        for w in WIDGETS:
            data = _config(w)
            self.assertIn("styleOverrides", data,
                          f"{w}: falta styleOverrides")
            self.assertIsInstance(data["styleOverrides"], dict)

    def test_overrides_only_use_known_keys(self):
        for w in WIDGETS:
            for key in (_config(w).get("styleOverrides") or {}):
                self.assertIn(key, OVERRIDE_KEYS,
                              f"{w}: '{key}' no tiene variable --widget-* asociada")


class OverridesLayerContract(unittest.TestCase):
    def test_mapping_is_complete(self):
        js = (APP / "common/widget-overrides.js").read_text(encoding="utf-8")
        for key in OVERRIDE_KEYS:
            self.assertIn(f"{key}:", js, f"falta {key} en el MAP de overrides")

    def test_css_consumes_override_variables(self):
        css = (APP / "common/oss-skin.css").read_text(encoding="utf-8")
        for var in ("--widget-border", "--widget-bg", "--widget-font", "--widget-accent"):
            self.assertIn(var, css, f"oss-skin.css no consume {var}")

    def test_no_overrides_means_no_change(self):
        """Sin `--widget-*` definidas, la cadena cae al tema."""
        css = (APP / "common/oss-skin.css").read_text(encoding="utf-8")
        self.assertIn("var(--widget-border, var(--color-border-cyan", css)
        self.assertIn("var(--widget-bg, var(--color-panel-bg", css)


if __name__ == "__main__":
    unittest.main()
