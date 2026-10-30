#!/usr/bin/env python3
"""Contrato de "el tema llega al contenido de los widgets" (Fase 5).

El bug: solo se pintaba el contenedor (`.chat-container`, `.timer-card`). Los
mensajes, filas y tarjetas seguian con el estilo base del widget, asi que
aplicar un tema no se notaba.

La guarda `body[data-theme-archetype][data-oss-widget]` garantiza que SIN tema
no exista ni una regla: el comportamiento actual queda intacto (eso lo demuestra
`docs/regression/widget-content-metrics.json`).
"""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

SKIN_CSS = APP / "common" / "oss-skin.css"
SKIN_JS = APP / "common" / "oss-skin.js"
SNAPSHOT = APP / "docs" / "regression" / "widget-content-metrics.json"
EVIDENCE = APP / "docs" / "regression" / "widget-content-metrics-after.md"

WIDGETS = ("chat", "goal", "ticker", "shoutout", "promo", "timer")
CONTENT_RULES = (
    ".chat-msg",
    ".prompter-item",
    ".goal-item",
    ".shoutout-card-body",
)


class TestWidgetContentTheme(unittest.TestCase):
    def setUp(self):
        self.css = SKIN_CSS.read_text(encoding="utf-8")
        self.js = SKIN_JS.read_text(encoding="utf-8")

    def test_1_hay_regla_de_contenido_con_guarda(self):
        for sel in CONTENT_RULES:
            self.assertIn(sel, self.css, f"falta la regla de contenido para {sel}")
        # todas las reglas de contenido exigen tema + widget
        for line in self.css.splitlines():
            if any(sel in line for sel in CONTENT_RULES) and "{" in line:
                self.assertIn("body[data-theme-archetype][data-oss-widget]", line,
                              f"regla de contenido sin guarda: {line.strip()[:80]}")

    def test_2_usa_tokens_y_no_colores_literales(self):
        block = self.css[self.css.index("CONTENIDO DE WIDGETS"):]
        block = block[:block.index("*/", block.index("============ */"))] if False else block
        for token in ("--skin-panel-radius", "--color-panel-bg", "--color-border-cyan", "--skin-font-body"):
            self.assertIn(token, block, f"el contenido no consume {token}")
        # Ningun hex suelto en las reglas de contenido. Un hex DENTRO de un
        # `var(--token, #fallback)` no cuenta: es el ultimo recurso cuando el
        # tema no define el token, y sin el la caja quedaria sin fondo.
        import re
        rules = re.findall(r"body\[data-theme-archetype\]\[data-oss-widget\][^{]*\{[^}]*\}", self.css)
        self.assertTrue(rules, "no se encontraron reglas de contenido")
        for rule in rules:
            sin_fallbacks = re.sub(r"var\([^()]*(?:\([^()]*\)[^()]*)*#[0-9A-Fa-f]{3,8}[^()]*\)", "var()", rule)
            self.assertIsNone(re.search(r"#[0-9A-Fa-f]{3,8}\b", sin_fallbacks),
                              f"color literal en regla de contenido: {rule[:80]}")

    def test_3_el_motor_declara_los_scopes(self):
        self.assertIn("CONTENT_THEME_SCOPES", self.js)
        for widget in WIDGETS:
            self.assertIn(f"{widget}:", self.js, f"falta el scope de {widget}")
        self.assertIn("adoptWidgetContentStyles", self.js)
        # se invoca al aplicar el tema
        start = self.js.index("function apply(")
        end = self.js.index("function clear(", start)
        self.assertIn("adoptWidgetContentStyles", self.js[start:end])

    def test_4_sin_tema_no_se_marca_nada(self):
        """La funcion sale antes de tocar el DOM si no hay tema o arquetipo."""
        start = self.js.index("function adoptWidgetContentStyles(")
        body = self.js[start:start + 900]
        self.assertIn("if (!body.getAttribute('data-theme')", body)
        self.assertIn("return 0", body)

    def test_5_la_evidencia_de_regresion_existe(self):
        self.assertTrue(SNAPSHOT.is_file(), "falta el snapshot de metricas")
        data = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        widgets = data.get("widgets") or {}
        self.assertEqual(set(WIDGETS), set(widgets), "el snapshot no cubre los 6 widgets")
        for widget, states in widgets.items():
            self.assertEqual({"none", "maker", "cozy"}, set(states), f"{widget}: faltan estados")
            # sin tema: estilo base del widget (sin tocar)
            self.assertNotIn("error", states["none"], f"{widget}/none fallo al medir")
            # con tema: el contenido ya no es el estilo base
            self.assertNotEqual(states["none"], states["cozy"],
                                f"{widget}: el tema no cambia el contenido")
        self.assertTrue(EVIDENCE.is_file(), "falta el informe antes->despues")


if __name__ == "__main__":
    unittest.main()
