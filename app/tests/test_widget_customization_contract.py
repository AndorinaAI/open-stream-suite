#!/usr/bin/env python3
"""Contrato del esquema comun de personalizacion de widgets (paso 12b).

Fija la precedencia unica y que el esquema sea el MISMO para todos los widgets:

    con tema asignado -> base del tema + overrides del usuario
    sin tema          -> configuracion del usuario
"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

from server.services import widget_customization as WC  # noqa: E402

COMMON_KEYS = {axis.key for axis in WC.COMMON_AXES}


class TestWidgetCustomizationContract(unittest.TestCase):
    def test_1_todos_los_widgets_comparten_los_ejes_comunes(self):
        for widget in WC.DEFAULT_WIDGETS:
            schema = WC.schema_for(widget)
            keys = {axis["key"] for axis in schema["axes"]}
            self.assertTrue(COMMON_KEYS <= keys,
                            f"{widget}: le faltan ejes comunes {COMMON_KEYS - keys}")
            for axis in schema["axes"]:
                self.assertIn(axis["kind"], ("color", "number", "enum", "text", "gradient"))

    def test_2_normaliza_tipos_y_rangos(self):
        normalized = WC.normalize_styles("goal", {
            "borderWidth": 999, "bgOpacity": -5, "bgColor": "no-es-color",
            "borderStyle": "inventado", "desconocida": 1,
        })
        self.assertEqual(12, normalized["borderWidth"])
        self.assertEqual(0, normalized["bgOpacity"])
        self.assertEqual("#1E1B18", normalized["bgColor"])
        self.assertEqual("solid", normalized["borderStyle"])
        self.assertNotIn("desconocida", normalized)

    def test_3_solo_son_overrides_los_ejes_cambiados(self):
        overrides = WC.customization_for("goal").overrides({
            "borderColor": "#FF0000",   # cambiado
            "borderWidth": 2,           # igual al default
        })
        self.assertEqual({"borderColor"}, set(overrides))

    def test_4_con_tema_la_base_es_del_tema_y_gana_el_override(self):
        tokens = {"--color-panel-bg": "#313244", "--color-border-cyan": "#89B4FA",
                  "--color-accent-cyan": "#89B4FA"}
        effective = WC.effective_styles("goal", {"borderColor": "#FF0000"}, tokens)
        self.assertEqual("#313244", effective["bgColor"])       # del tema
        self.assertEqual("#89B4FA", effective["accentColor"])   # del tema
        self.assertEqual("#FF0000", effective["borderColor"])   # override del usuario

    def test_5_sin_tema_manda_la_configuracion_del_usuario(self):
        effective = WC.effective_styles("goal", {"bgColor": "#101010"}, None)
        self.assertEqual("#101010", effective["bgColor"])

    def test_6_la_ruta_publica_el_esquema(self):
        src = (APP / "server" / "routes" / "widgets_routes.py").read_text(encoding="utf-8")
        self.assertIn("/api/widgets/customization", src)
        self.assertIn("handle_widget_customization", src)


if __name__ == "__main__":
    unittest.main()
