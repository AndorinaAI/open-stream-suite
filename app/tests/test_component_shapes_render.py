"""Contrato de render de formas: toda forma ofrecida en el panel se pinta.

Regresión de un bug real (auditoría 1.0.2): las alertas ofrecían las 20 formas
físicas de pack, pero `common/styles.css` solo las usaba para alternar adornos
de escena (`.washi-tape`, `.reticle-*`), que no existen en el overlay de
alertas ni en los widgets → elegir una forma física no cambiaba nada.
"""
import json
import unittest
from pathlib import Path

from server.config import BASE_DIR
from server.services import components_catalog as C

APP = Path(BASE_DIR)
STYLES = APP / "common" / "styles.css"


def pack_shape_ids() -> set:
    ids = set()
    for pack_json in (APP / "streamthemes").glob("*/pack.json"):
        try:
            data = json.loads(pack_json.read_text(encoding="utf-8"))
        except Exception:
            continue
        for shape in data.get("shapes", []) or []:
            if isinstance(shape, dict) and shape.get("id"):
                ids.add(str(shape["id"]))
    return ids


class TestComponentShapesRender(unittest.TestCase):
    def setUp(self):
        self.css = STYLES.read_text(encoding="utf-8")
        self.physical = pack_shape_ids()

    def test_1_catalogo_coincide_con_los_packs(self):
        self.assertEqual(self.physical, C.get_pack_shape_ids())
        self.assertTrue(self.physical, "los packs deben declarar formas físicas")

    def test_2_escenas_pintan_cada_forma_fisica(self):
        for sid in sorted(self.physical):
            self.assertIn(f'body[data-theme-shape="{sid}"]', self.css, f"escena sin regla: {sid}")

    def test_3_alertas_pintan_cada_forma_fisica(self):
        for sid in sorted(self.physical):
            for sel in ("#alert-card", "#banner-alert-root"):
                self.assertIn(
                    f'body[data-theme-shape="{sid}"] {sel}', self.css,
                    f"alerta sin regla: {sid} -> {sel}",
                )

    def test_4_widgets_pintan_cada_forma_fisica(self):
        for sid in sorted(self.physical):
            self.assertIn(
                f'body[data-theme-shape="{sid}"] [data-oss-shape-target]', self.css,
                f"widget sin regla: {sid}",
            )

    def test_5_genericas_se_pintan_desde_oss_shape(self):
        oss = (APP / "common" / "oss-shape.js").read_text(encoding="utf-8")
        for sid in sorted(C.WIDGET_SHAPE_SET):
            self.assertIn(f"{sid}:", oss, f"genérica sin render en oss-shape.js: {sid}")

    def test_6_catalogo_ofrece_lo_que_se_pinta(self):
        for wid in C.widget_ids():
            shapes = C.shape_ids_for("widget", wid)
            if wid == "chat":
                self.assertEqual(shapes, set(C.WIDGET_SHAPE_SET), "chat solo admite las genéricas")
            else:
                self.assertTrue(self.physical <= shapes, f"{wid} no ofrece las formas físicas")
            for sid in sorted(shapes):
                if sid in C.WIDGET_SHAPE_SET:
                    continue  # genéricas: inline vía oss-shape.js
                self.assertTrue(
                    C.supports_shape("widget", wid, sid)
                    and f'body[data-theme-shape="{sid}"] [data-oss-shape-target]' in self.css,
                    f"widget {wid}: {sid} ofrecida sin render",
                )
        for aid in C.alert_ids():
            shapes = C.shape_ids_for("alert", aid)
            self.assertTrue(self.physical <= shapes, f"alerta {aid} sin formas físicas")
            for sid in sorted(shapes):
                if sid in C.WIDGET_SHAPE_SET:
                    continue
                self.assertIn(
                    f'body[data-theme-shape="{sid}"] #{"alert-card" if aid == "card" else "banner-alert-root"}',
                    self.css, f"alerta {aid}: {sid} ofrecida sin render",
                )

    def test_7_formas_invalidas_siguen_rechazandose(self):
        self.assertFalse(C.supports_shape("widget", "goal", "no-existe"))
        self.assertFalse(C.supports_shape("alert", "card", "no-existe"))
        self.assertFalse(C.supports_shape("widget", "chat", "cozy_polaroid"))
        self.assertTrue(C.supports_shape("widget", "goal", "auto"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
