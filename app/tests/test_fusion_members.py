#!/usr/bin/env python3
"""Tests del modelo nativo de miembros de fusión (widgets + alertas de panel)."""
import unittest
from unittest.mock import AsyncMock, patch

from server.services import components_catalog as C
from server.services import fusions_service as F


class TestComponentsCatalog(unittest.TestCase):
    def test_widgets_lista_directorios_reales(self):
        ids = C.widget_ids()
        self.assertIn("chat", ids)
        self.assertIn("shoutout", ids)
        # `promo` es un symlink a `shoutout`, pero es un widget con identidad
        # propia en el panel (config, atajos y tarjeta). Excluirlo hacia que el
        # backend rechazara `widget:promo` con «Componente desconocido».
        self.assertIn("promo", ids, "promo debe estar: el panel lo ofrece")
        self.assertEqual(len(ids), len(set(ids)), "sin duplicados")

    def test_alerts_panel(self):
        self.assertEqual(C.alert_ids(), ["card", "banner"])

    def test_parse_key(self):
        self.assertEqual(C.parse_key("widget:chat"), ("widget", "chat"))
        self.assertEqual(C.parse_key("alert:card"), ("alert", "card"))
        self.assertIsNone(C.parse_key("maker-desk"))
        self.assertIsNone(C.parse_key("widget:"))

    def test_shapes_por_componente(self):
        for wid in C.widget_ids():
            self.assertTrue(C.supports_shapes("widget", wid), wid)
        for aid in C.alert_ids():
            self.assertTrue(C.supports_shapes("alert", aid), aid)
        self.assertTrue(C.is_valid_component_shape("widget", "chat", "bubble"))
        self.assertTrue(C.is_valid_component_shape("alert", "card", "bubble"))
        self.assertTrue(C.is_valid_component_shape("alert", "card", "gamer_mecha"))
        self.assertFalse(C.is_valid_component_shape("widget", "chat", "no-existe"))
        self.assertTrue(C.is_valid_component_shape("widget", "chat", "auto"))


class TestFusionSchema(unittest.TestCase):
    def setUp(self):
        self.fusions = []
        self.p_load = patch.object(F, "load_fusions", side_effect=lambda: self.fusions)
        self.p_save = patch.object(F, "save_fusions", side_effect=lambda f: self.fusions.__setitem__(slice(None), f))
        self.p_load.start(); self.p_save.start()

    def tearDown(self):
        self.p_load.stop(); self.p_save.stop()

    def test_normaliza_miembros_y_descarta_desconocidos(self):
        obj = F.create_or_update_fusion({
            "id": "f1", "name": "Test", "scenes": [],
            "widgets": ["chat", "nope", "chat"], "alerts": ["card", "zzz"],
        })
        self.assertEqual(obj["widgets"], ["chat"])
        self.assertEqual(obj["alerts"], ["card"])
        self.assertEqual(obj.get("unknownWidgets"), ["nope"])
        self.assertEqual(obj.get("unknownAlerts"), ["zzz"])

    def test_persiste_todos_los_miembros(self):
        obj = F.create_or_update_fusion({"id": "f2", "name": "T2", "scenes": ["maker-desk"],
                                         "widgets": ["ticker"], "alerts": ["banner"]})
        self.assertEqual(obj["scenes"], ["maker-desk"])
        self.assertEqual(obj["widgets"], ["ticker"])
        self.assertEqual(obj["alerts"], ["banner"])


class TestFusionApply(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.fusion = {"id": "f1", "name": "T", "scenes": [], "widgets": ["chat", "ticker"],
                       "alerts": ["card"], "defaultTheme": "maker", "defaultShape": "original"}
        self.p_load = patch.object(F, "load_fusions", return_value=[self.fusion])
        self.p_save = patch.object(F, "save_fusions", return_value=True)
        self.p_set = patch.object(F, "set_overlay_theme_service", new_callable=AsyncMock, return_value={})
        self.p_reset = patch.object(F, "reset_overlay_assignment_service", new_callable=AsyncMock, return_value={})
        for p in (self.p_load, self.p_save, self.p_set, self.p_reset): p.start()

    def tearDown(self):
        for p in (self.p_load, self.p_save, self.p_set, self.p_reset): p.stop()

    async def test_apply_theme_a_todos_los_miembros(self):
        res = await F.apply_fusion_theme_batch("f1", "synthwave")
        self.assertEqual(res["appliedWidgets"], ["chat", "ticker"])
        self.assertEqual(res["appliedAlerts"], ["card"])
        self.assertEqual(res["status"], "ok")
        called = {c.args[0] for c in F.set_overlay_theme_service.await_args_list}
        self.assertEqual(called, {"widget:chat", "widget:ticker", "alert:card"})

    async def test_apply_shape_a_todos_los_miembros(self):
        res = await F.apply_fusion_shape_batch("f1", "bubble")
        self.assertEqual(res["appliedWidgets"], ["chat", "ticker"])
        self.assertEqual(res["appliedAlerts"], ["card"])

    async def test_reset_restaura_todos_los_miembros(self):
        res = await F.reset_fusion_batch("f1")
        self.assertEqual(res["resetWidgets"], ["chat", "ticker"])
        self.assertEqual(res["resetAlerts"], ["card"])
        keys = {c.args[0] for c in F.reset_overlay_assignment_service.await_args_list}
        self.assertEqual(keys, {"widget:chat", "widget:ticker", "alert:card"})
        self.assertEqual(self.fusion["defaultTheme"], "maker")


if __name__ == "__main__":
    unittest.main(verbosity=2)
