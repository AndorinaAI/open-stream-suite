"""Regresiones del contrato de temas H1-H10 (auditoría PENDIENTES_SISTEMA_TEMAS).

No requieren servidor: prueban helpers, validaciones y la estructura de los
módulos que implementan la precedencia global, las formas y los temas por alerta.
"""
import asyncio
import unittest
from pathlib import Path

from server.services import components_catalog, theme_manager, theme_service
from server.services.validation_utils import get_theme_dir

APP = Path(__file__).resolve().parent.parent


class TestThemeContractH1H10(unittest.TestCase):
    def test_h1_h4_explicit_map_only_custom_scenes(self):
        explicit = theme_manager.derive_explicit_theme_map({
            "overlayThemes": {
                "chill": "chill",                 # valor de fábrica
                "game": "synthwave",              # personalizado
                "widget:ticker": "terminal",      # componente siempre explícito
                "alert:card": "toxic_rad",
            }
        })
        self.assertNotIn("chill", explicit)
        self.assertTrue(explicit.get("game"))
        self.assertTrue(explicit.get("widget:ticker"))
        self.assertTrue(explicit.get("alert:card"))

    def test_h1_config_includes_global_state(self):
        from server.services.overlay_service import build_config_payload
        payload = build_config_payload({})
        for key in ("activeTheme", "globalThemeActive", "overlayThemeExplicit", "overlayShapes"):
            self.assertIn(key, payload)

    def test_h2_scene_respects_explicit_assignment(self):
        js = (APP / "common" / "overlay.js").read_text(encoding="utf-8")
        self.assertIn("hasExplicitTheme", js)
        self.assertIn("globalThemeActive", js)
        self.assertIn("!hasExplicitTheme", js)

    def test_h3_widget_preserves_shape_on_global_theme(self):
        js = (APP / "common" / "widget-theme.js").read_text(encoding="utf-8")
        self.assertIn("theme !== undefined", js)
        self.assertIn("shape !== undefined", js)
        self.assertIn("handleMessage", js)
        for w in ("ticker", "chat", "goal", "timer", "shoutout"):
            net = (APP / "widgets" / w / "js" / "network.js").read_text(encoding="utf-8")
            self.assertIn("OSSTheme.handleMessage", net, w)

    def test_h5_alert_per_type_themes(self):
        helper = (APP / "alerts" / "js" / "overlay" / "02b-alert-shapes.js").read_text(encoding="utf-8")
        queue = (APP / "alerts" / "js" / "overlay" / "03-alert-queue.js").read_text(encoding="utf-8")
        for token in ("applyThemeFor", "setTheme", "configure", "visibleType"):
            self.assertIn(token, helper)
        self.assertIn("applyAll('card')", queue)
        self.assertIn("applyAll('banner')", queue)

    def test_h6_original_migration(self):
        state = {
            "overlayThemes": {},
            "overlayShapes": {
                "widget:chat": "original",
                "alert:card": "original",
                "maker-desk": "original",
            },
        }
        theme_manager.migrate_theme_state(state)
        self.assertNotIn("widget:chat", state["overlayShapes"])
        self.assertNotIn("alert:card", state["overlayShapes"])
        self.assertEqual(state["overlayShapes"]["maker-desk"], "original")

    def test_h7_unknown_scene_rejected_even_shape_only(self):
        with self.assertRaises(ValueError):
            asyncio.run(theme_service.set_overlay_theme_service(
                "no-existe", shape_id="gamer_mecha"))

    def test_h8_global_shape_validation(self):
        with self.assertRaises(ValueError):
            asyncio.run(theme_service.apply_shape_service("bogus"))
        with self.assertRaises(ValueError):
            asyncio.run(theme_service.apply_shape_service("pill"))

    def test_h9_create_theme_has_factory_defaults(self):
        src = (APP / "server" / "services" / "theme_service.py").read_text(encoding="utf-8")
        self.assertIn('theme_dir / "theme.default.json"', src)
        self.assertIn('theme_dir / "style.default.css"', src)

    def test_h10_invalid_pack_and_theme_paths(self):
        with self.assertRaises(ValueError):
            theme_service.create_theme_service({"packId": "../hack", "name": "X"})
        with self.assertRaises(ValueError):
            asyncio.run(theme_service.save_theme_service(
                {"packId": "../hack", "id": "x", "css": "body{}"}))
        self.assertIsNone(get_theme_dir("Maker_Theme_Pack", "../../x"))

    def test_component_original_is_reset_alias(self):
        self.assertTrue(components_catalog.is_valid_component_shape("alert", "card", "original"))


if __name__ == "__main__":
    unittest.main()
