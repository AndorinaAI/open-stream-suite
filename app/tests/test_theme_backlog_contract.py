"""Contrato de la Fase 1: catálogo dinámico, defaults y formas en fusiones.

No escribe en los JSON reales: mockea load/save y las llamadas de aplicación.
"""
import asyncio
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from server.services import components_catalog, fusions_service, theme_manager


class TestDynamicCatalog(unittest.TestCase):
    def test_alert_shapes_are_dynamic(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            pack = root / "streamthemes" / "Pack_Test" / "pack.json"
            pack.parent.mkdir(parents=True)
            pack.write_text(json.dumps({"id": "Pack_Test", "shapes": [{"id": "audit_shape"}]}), encoding="utf-8")
            components_catalog.invalidate_shape_cache()
            with patch.object(components_catalog, "BASE_DIR", root):
                before = components_catalog.get_alert_shapes()
                self.assertIn("audit_shape", before)
                # un segundo pack en caliente, sin reiniciar
                pack2 = root / "streamthemes" / "Pack_Test_2" / "pack.json"
                pack2.parent.mkdir(parents=True)
                pack2.write_text(json.dumps({"id": "Pack_Test_2", "shapes": [{"id": "second_shape"}]}), encoding="utf-8")
                after = components_catalog.get_alert_shapes()
                self.assertIn("second_shape", after)
            components_catalog.invalidate_shape_cache()

    def test_supports_shape_matrix(self):
        self.assertTrue(components_catalog.supports_shape("alert", "card", "pill"))
        self.assertTrue(components_catalog.supports_shape("widget", "ticker", "pill"))
        self.assertFalse(components_catalog.supports_shape("scene", "chill", "pill"))
        self.assertTrue(components_catalog.supports_shape("scene", "chill", "gamer_mecha"))


class TestFusionDefaultsAndWarnings(unittest.TestCase):
    def _patches(self):
        return (
            patch.object(fusions_service, "load_fusions", return_value=[]),
            patch.object(fusions_service, "save_fusions", return_value=True),
        )

    def test_rejects_invalid_default_theme(self):
        p1, p2 = self._patches()
        with p1, p2, self.assertRaises(ValueError):
            fusions_service.create_or_update_fusion({"name": "X", "defaultTheme": "no-theme"})

    def test_rejects_invalid_default_shape(self):
        p1, p2 = self._patches()
        with p1, p2, self.assertRaises(ValueError):
            fusions_service.create_or_update_fusion({"name": "X", "defaultShape": "no-shape"})

    def test_reports_unknown_members(self):
        p1, p2 = self._patches()
        with p1, p2:
            fusion = fusions_service.create_or_update_fusion({
                "name": "Mix",
                "scenes": ["chill", "no-existe"],
                "widgets": ["ticker", "no-widget"],
                "alerts": ["card", "no-alert"],
            })
        self.assertEqual(fusion["unknownScenes"], ["no-existe"])
        self.assertEqual(fusion["unknownWidgets"], ["no-widget"])
        self.assertEqual(fusion["unknownAlerts"], ["no-alert"])
        self.assertTrue(fusion["warnings"])

    def test_accepts_valid_generic_default_shape(self):
        p1, p2 = self._patches()
        with p1, p2:
            fusion = fusions_service.create_or_update_fusion({
                "name": "Generica", "defaultTheme": "maker", "defaultShape": "pill",
                "alerts": ["card"],
            })
        self.assertEqual(fusion["defaultShape"], "pill")

    def test_all_unknown_members_is_error(self):
        p1, p2 = self._patches()
        with p1, p2, self.assertRaises(ValueError):
            fusions_service.create_or_update_fusion({
                "name": "Vacia",
                "scenes": ["no-existe"],
                "widgets": ["no-widget"],
            })


class TestFusionShapeBatch(unittest.TestCase):
    def _run(self, shape, fusion):
        apply_mock = AsyncMock(return_value={"status": "ok"})
        with patch.object(fusions_service, "get_fusion_by_id", return_value=fusion), \
             patch.object(fusions_service, "set_overlay_theme_service", apply_mock), \
             patch.object(fusions_service, "create_or_update_fusion", return_value=fusion):
            result = asyncio.run(fusions_service.apply_fusion_shape_batch("f1", shape))
        return result, apply_mock

    def test_mixed_scene_and_alert_generic_shape(self):
        fusion = {
            "id": "f1", "defaultTheme": "maker", "defaultShape": "original",
            "scenes": ["chill"], "widgets": [], "alerts": ["card"],
        }
        result, apply_mock = self._run("pill", fusion)
        self.assertEqual(result["appliedAlerts"], ["card"])
        self.assertEqual(result["skippedScenes"], ["chill"])
        self.assertEqual(result["status"], "partial")
        self.assertEqual(apply_mock.await_count, 1)

    def test_alert_only_generic_shape_is_allowed(self):
        fusion = {
            "id": "f1", "defaultTheme": "maker", "defaultShape": "original",
            "scenes": [], "widgets": [], "alerts": ["card"],
        }
        result, apply_mock = self._run("pill", fusion)
        self.assertEqual(result["appliedAlerts"], ["card"])
        self.assertEqual(result["status"], "ok")

    def test_ui_surfaces_unknown_members_and_skips(self):
        js = (Path(__file__).resolve().parent.parent / "alerts" / "js" / "themes" / "13-fusions.js").read_text(encoding="utf-8")
        for token in ("unknownScenes", "unknownWidgets", "unknownAlerts", "members_ignored_scenes",
                      "skippedScenes", "skippedWidgets", "skippedAlerts"):
            self.assertIn(token, js)

    def test_invalid_shape_is_rejected(self):
        fusion = {
            "id": "f1", "defaultTheme": "maker", "defaultShape": "original",
            "scenes": ["chill"], "widgets": [], "alerts": ["card"],
        }
        with self.assertRaises(ValueError):
            self._run("no-shape", fusion)



class TestPhase2UIContract(unittest.TestCase):
    def test_phase2_ui_contracts(self):
        base = Path(__file__).resolve().parent.parent
        scene = (base / "alerts" / "js" / "themes" / "06-scene-helpers.js").read_text(encoding="utf-8")
        self.assertIn("sceneCount", scene)
        self.assertNotIn("todas las 9 escenas", scene)
        fusion = (base / "alerts" / "js" / "themes" / "13-fusions.js").read_text(encoding="utf-8")
        self.assertIn("formatBatchSummary", fusion)
        for token in ("batch_scenes", "batch_widgets", "batch_alerts"):
            self.assertIn(token, fusion)
        overlay = (base / "alerts" / "js" / "themes" / "10-overlay-actions.js").read_text(encoding="utf-8")
        self.assertIn("previousTheme", overlay)
        editor = (base / "alerts" / "js" / "themes" / "11-scene-editor.js").read_text(encoding="utf-8")
        self.assertIn("previousShape", editor)
        components = (base / "alerts" / "js" / "component-themes.js").read_text(encoding="utf-8")
        self.assertIn("select_theme_or_shape", components)

    def test_i18n_phase2_keys(self):
        import json
        base = Path(__file__).resolve().parent.parent
        for lang in ("es", "en"):
            data = json.loads((base / "languages" / f"{lang}.alerts.json").read_text(encoding="utf-8"))
            for section, key in (("fusions", "label_default_shape"), ("themes", "shape_label"),
                                 ("widgets", "select_theme_or_shape")):
                self.assertIn(key, data.get(section, {}), f"{lang}.{section}.{key}")
            common = json.loads((base / "languages" / f"{lang}.common.json").read_text(encoding="utf-8"))
            self.assertIn("refresh", common.get("common", {}), lang)


class TestPhase3StateAndPersistence(unittest.TestCase):
    def test_normalize_orphans_and_active_shape(self):
        state = {
            "activeTheme": "no-theme",
            "activeShape": None,
            "overlayThemes": {
                "chill": "chill",
                "maker-desk": "no-theme",
                "widget:chat": "no-theme",
                "alert:card": "maker",
            },
            "overlayShapes": {
                "chill": "pill",              # forma genérica no válida en escena
                "maker-desk": "gamer_mecha",  # válida
                "widget:chat": "original",    # se limpia
                "alert:card": "pill",         # válida en alerta
            },
            "overlayThemeExplicit": {"chill": True, "widget:chat": True},
        }
        report = theme_manager.normalize_theme_assignments(state)
        self.assertEqual(state["activeTheme"], "maker")
        self.assertEqual(state["activeShape"], "original")
        self.assertEqual(state["overlayThemes"]["chill"], "chill")
        self.assertEqual(state["overlayThemes"]["maker-desk"], "maker")
        self.assertNotIn("widget:chat", state["overlayThemes"])
        self.assertNotIn("chill", state["overlayShapes"])
        self.assertEqual(state["overlayShapes"]["maker-desk"], "gamer_mecha")
        self.assertNotIn("widget:chat", state["overlayShapes"])
        self.assertEqual(state["overlayShapes"]["alert:card"], "pill")
        self.assertTrue(report["dropped_themes"] or report["restored"])

    def test_config_payload_has_defaults_and_active_shape(self):
        from server.services.overlay_service import build_config_payload
        from unittest.mock import patch
        fake = {"activeTheme": "maker", "activeShape": None, "overlayThemes": {"chill": "chill"}}
        with patch("server.services.theme_manager.load_theme_state", return_value=fake):
            payload = build_config_payload({})
        self.assertEqual(payload["activeShape"], "original")
        self.assertEqual(len(payload["defaultOverlayThemes"]), 27)

    def test_atomic_write_preserves_old_on_replace_failure(self):
        from server.services import fs_utils
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "state.json"
            path.write_text("old", encoding="utf-8")
            with patch.object(fs_utils.os, "replace", side_effect=OSError("boom")):
                with self.assertRaises(OSError):
                    fs_utils.atomic_write_text(path, "new")
            self.assertEqual(path.read_text(encoding="utf-8"), "old")

    def test_fusion_schema_is_persisted(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "fusions.json"
            path.write_text(json.dumps([{"id": "f", "name": "F", "scenes": ["chill"]}]), encoding="utf-8")
            with patch.object(fusions_service, "FUSIONS_FILE", path):
                loaded = fusions_service.load_fusions()
            self.assertEqual(loaded[0]["widgets"], [])
            self.assertEqual(loaded[0]["alerts"], [])
            self.assertEqual(loaded[0]["defaultTheme"], "maker")
            self.assertEqual(loaded[0]["defaultShape"], "original")
            disk = json.loads(path.read_text(encoding="utf-8"))
            self.assertIn("widgets", disk[0])
            self.assertIn("alerts", disk[0])

    def test_defaults_single_source(self):
        base = Path(__file__).resolve().parent.parent
        js = (base / "common" / "overlay.js").read_text(encoding="utf-8")
        self.assertIn("config.defaultOverlayThemes", js)
        self.assertNotIn("'print': 'print'", js)
        py = theme_manager.DEFAULT_OVERLAY_THEMES
        self.assertEqual(len(py), 27)


class TestPhase4VisualContract(unittest.TestCase):
    def test_maker_has_structural_tokens(self):
        base = Path(__file__).resolve().parent.parent
        css = (base / "streamthemes" / "Maker_Theme_Pack" / "styles" / "maker" / "style.css").read_text(encoding="utf-8")
        tokens = ("--frame-radius", "--frame-border-width", "--frame-border-style", "--frame-clip-path",
                  "--frame-shadow", "--frame-corner-display", "--panel-radius", "--panel-clip-path",
                  "--panel-backdrop", "--panel-shadow", "--badge-radius", "--badge-clip-path",
                  "--header-radius", "--header-clip-path")
        for token in tokens:
            self.assertIn(token + ":", css)
        generated = (base / "common" / "themes.css").read_text(encoding="utf-8")
        self.assertIn("Tema: maker", generated)

    def test_gameplay_hud_has_panel_target(self):
        base = Path(__file__).resolve().parent.parent
        html = (base / "streamthemes" / "Gamer_Pro_Pack" / "overlays" / "gameplay_hud" / "index.html").read_text(encoding="utf-8")
        self.assertIn('data-oss-cam="true" data-oss-panel="true"', html)

    def test_generic_shape_labels(self):
        base = Path(__file__).resolve().parent.parent
        js = (base / "alerts" / "js" / "component-themes.js").read_text(encoding="utf-8")
        self.assertIn("GENERIC_SHAPE_LABELS", js)
        self.assertIn("shapeLabel(s)", js)
        import json
        for lang in ("es", "en"):
            data = json.loads((base / "languages" / f"{lang}.alerts.json").read_text(encoding="utf-8"))
            self.assertIn("shape_pill", data.get("widgets", {}), lang)
            self.assertIn("shape_soft_card", data.get("widgets", {}), lang)

if __name__ == "__main__":
    unittest.main()
