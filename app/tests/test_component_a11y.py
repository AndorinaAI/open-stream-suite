"""Regresión de V3-02: los selectores de componentes tienen nombre accesible.

El panel mostraba tres `<select>` por fila (tema, forma, fusión) sin etiqueta ni
`aria-label`: no se sabía cuál era cuál y un lector de pantalla no tenía nombre.
Aquí se comprueba el contrato estático del módulo y que las claves i18n existen.
"""
import json
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR

SRC = BASE_DIR / "alerts" / "js" / "component-themes.js"
LANG_DIR = BASE_DIR / "languages"
HEADER_KEYS = (
    "widgets.col_component",
    "widgets.col_theme",
    "widgets.col_shape",
    "widgets.col_fusion",
)


def flatten(obj, prefix=""):
    out = {}
    if isinstance(obj, dict):
        for key, value in obj.items():
            out.update(flatten(value, prefix + key + "."))
    else:
        out[prefix[:-1]] = obj
    return out


class TestComponentThemesAccessibility(unittest.TestCase):
    def setUp(self):
        self.src = SRC.read_text(encoding="utf-8")

    def test_every_select_has_an_aria_label(self):
        selects = [line for line in self.src.splitlines() if "<select" in line]
        self.assertGreaterEqual(len(selects), 3, "se esperaban los 3 selects por fila")
        for line in selects:
            self.assertIn("aria-label=", line, f"select sin nombre accesible: {line.strip()}")

    def test_action_buttons_have_accessible_names(self):
        for handler in ("ComponentThemes.apply", "ComponentThemes.reset", "ComponentThemes.addToFusion"):
            self.assertRegex(
                self.src,
                rf'aria-label="[^"]*"[^>]*onclick="{re.escape(handler)}',
                f"{handler} no tiene aria-label",
            )

    def test_column_header_is_rendered(self):
        self.assertIn("function headerRow()", self.src)
        self.assertRegex(self.src, r"headerRow\(\)\s*\+\s*rows\.join")

    def test_header_keys_exist_in_spanish_and_english(self):
        for name in ("es.alerts.json", "en.alerts.json"):
            data = flatten(json.loads((LANG_DIR / name).read_text(encoding="utf-8")))
            for key in HEADER_KEYS:
                value = data.get(key)
                self.assertIsInstance(value, str, f"{name}: falta {key}")
                self.assertTrue(value.strip(), f"{name}: {key} vacío")


if __name__ == "__main__":
    unittest.main()
