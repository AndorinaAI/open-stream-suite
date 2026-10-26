"""Regresión de V3-03: ningún contador de escenas hardcodeado.

El panel decía "9 escenas/pantallas" en una app de 27. Los contadores visibles
deben salir del catálogo real (`window.OSS_SCENES`) y las cadenas de i18n usar el
parámetro `{count}`.

Excepción legítima (no se toca): las descripciones del pack Maker dicen "9
pantallas listas" porque ese pack tiene exactamente 9 escenas.
"""
import json
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR

LANG_FILES = ("es.json", "en.json", "es.alerts.json", "en.alerts.json")
LANG_DIR = BASE_DIR / "languages"
KEYS_WITH_COUNT = (
    "themes.confirm_apply_all",
    "themes.confirm_restore_all_scenes_texts",
    "themes.confirm_restore_all_scenes_themes",
)
JS_CALLERS = (
    "alerts/js/themes/02-packs.js",
    "alerts/js/themes/09-overlay-folders-render.js",
    "alerts/js/themes/10-overlay-actions.js",
)


def flatten(obj, prefix=""):
    out = {}
    if isinstance(obj, dict):
        for key, value in obj.items():
            out.update(flatten(value, prefix + key + "."))
    else:
        out[prefix[:-1]] = obj
    return out


def load(name):
    return flatten(json.loads((LANG_DIR / name).read_text(encoding="utf-8")))


class TestNoHardcodedSceneCount(unittest.TestCase):
    def test_subtitle_has_no_hardcoded_number(self):
        for name in LANG_FILES:
            subtitle = load(name).get("themes.section_subtitle")
            self.assertIsNotNone(subtitle, f"{name}: falta themes.section_subtitle")
            self.assertFalse(
                re.search(r"\b\d+\b", subtitle),
                f"{name}: el subtítulo fija un número de escenas -> {subtitle}",
            )

    def test_confirmations_use_count_parameter(self):
        for name in LANG_FILES:
            data = load(name)
            for key in KEYS_WITH_COUNT:
                value = data.get(key)
                self.assertIsNotNone(value, f"{name}: falta {key}")
                self.assertIn("{count}", value, f"{name}:{key} no usa {{count}} -> {value}")
                self.assertFalse(
                    re.search(r"\b(9|27)\b", value),
                    f"{name}:{key} fija un número de escenas -> {value}",
                )

    def test_panel_static_texts_have_no_count(self):
        html = (BASE_DIR / "alerts" / "panel.html").read_text(encoding="utf-8")
        subtitle = re.search(r'data-i18n="themes\.section_subtitle"[^>]*>\s*([^<]+)', html)
        self.assertIsNotNone(subtitle, "no se encontró el subtítulo de la sección")
        self.assertFalse(re.search(r"\b\d+\b", subtitle.group(1)), subtitle.group(1))
        # El badge de escenas por carpeta lo rellena el JS: sin número fijo.
        self.assertNotRegex(html, r"overlays-count-in-folder-badge[^>]*>\s*\d+")

    def test_js_callers_use_the_real_catalog(self):
        for rel in JS_CALLERS:
            src = (BASE_DIR / rel).read_text(encoding="utf-8")
            self.assertIn("OSS_SCENES.length", src, rel)
            self.assertIn("count: sceneCount", src, rel)
            self.assertNotRegex(src, r"todas las \d+ escenas", rel)
            self.assertNotRegex(src, r"todas las \d+ overlays", rel)


if __name__ == "__main__":
    unittest.main()
