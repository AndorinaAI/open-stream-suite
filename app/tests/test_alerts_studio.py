import unittest
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from aiohttp.test_utils import AioHTTPTestCase
from server.app import create_app, LOCAL_AUTH_TOKEN
from server.routes.alerts_routes import format_alert_event, load_alerts_config, save_alerts_config

class TestAlertsStudio(AioHTTPTestCase):
    APP = Path(__file__).resolve().parent.parent

    def setUp(self):
        # Los tests de config escriben alerts_config.json; aislar el estado real.
        super().setUp()
        self._backups = {}
        for name in ("alerts_config.json", "alerts_themes_config.json"):
            path = self.APP / name
            if path.exists():
                self._backups[name] = path.read_bytes()

    def tearDown(self):
        for name, data in self._backups.items():
            (self.APP / name).write_bytes(data)
        super().tearDown()

    async def get_application(self):
        return create_app()

    def get_auth_headers(self):
        return {
            "X-Local-Token": LOCAL_AUTH_TOKEN,
            "Origin": "http://localhost:8080"
        }


    def test_alert_themes_block_is_in_render_template(self):
        """L7: el bloque de temas debe vivir en renderStudio(), no solo en panel.html."""
        js = (Path(__file__).resolve().parent.parent / "alerts" / "js" / "alerts-studio" / "02a-layout-dom.js").read_text(encoding="utf-8")
        self.assertIn('id="alert-themes-panel"', js)
        self.assertIn("ComponentThemes.load()", js)
        self.assertIn("TEMAS DE ALERTAS", js)

    async def test_get_alerts_config(self):
        resp = await self.client.get("/api/alerts/config")
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("alerts", data["config"])
        self.assertIn("sub_prime", data["config"]["alerts"])
        self.assertIn("resub", data["config"]["alerts"])
        self.assertIn("donation", data["config"]["alerts"])

    async def test_post_alerts_config(self):
        cfg = load_alerts_config()
        cfg["sub_prime"]["titleTemplate"] = "👑 ¡SUB PRIME PROBADO!"
        resp = await self.client.post(
            "/api/alerts/config",
            json={"alerts": cfg},
            headers=self.get_auth_headers()
        )
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data["status"], "ok")

        # Verify persistence
        reloaded = load_alerts_config()
        self.assertEqual(reloaded["sub_prime"]["titleTemplate"], "👑 ¡SUB PRIME PROBADO!")

    async def test_format_alert_event_sub_prime(self):
        event = format_alert_event("sub_prime", {"user": "MakerViewer"})
        self.assertIsNotNone(event)
        self.assertEqual(event["type"], "custom_alert")
        self.assertEqual(event["alertType"], "sub_prime")
        self.assertEqual(event["user"], "MakerViewer")

    async def test_format_alert_event_resub(self):
        event = format_alert_event("resub", {"user": "FielViewer", "months": 12})
        self.assertIsNotNone(event)
        self.assertEqual(event["alertType"], "resub")
        self.assertIn("12", event["title"])

    async def test_format_alert_event_donation(self):
        event = format_alert_event("donation", {"user": "Mecenas", "amount": "25.00 EUR", "message": "¡Un café!"})
        self.assertIsNotNone(event)
        self.assertEqual(event["alertType"], "donation")
        self.assertIn("25.00 EUR", event["title"])
        self.assertIn("¡Un café!", event["message"])

    async def test_api_alerts_test_endpoint(self):
        resp = await self.client.post(
            "/api/alerts/test",
            json={
                "alertType": "donation",
                "user": "Tester",
                "amount": "15.00 EUR",
                "message": "Donación de prueba"
            },
            headers=self.get_auth_headers()
        )
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["alert"]["user"], "Tester")

    async def test_get_alert_themes(self):
        resp = await self.client.get("/api/alerts/themes")
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("themes", data["themesConfig"])
        self.assertIn("cyberpunk", data["themesConfig"]["themes"])
        self.assertIn("glassmorphism", data["themesConfig"]["themes"])
        self.assertIn("neon", data["themesConfig"]["themes"])

    async def test_apply_alert_theme(self):
        resp = await self.client.post(
            "/api/alerts/apply-theme",
            json={"themeId": "neon", "target": "all"},
            headers=self.get_auth_headers()
        )
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["appliedTheme"]["style"], "neon")

        # Verify all alerts now have neon style
        reloaded = load_alerts_config()
        self.assertEqual(reloaded["follow"]["bannerStyle"], "neon")
        self.assertEqual(reloaded["sub_prime"]["bannerStyle"], "neon")

    async def test_donation_per_platform_custom_text(self):
        cfg = load_alerts_config()
        cfg["donation"]["perPlatformEnabled"] = True
        cfg["donation"]["platforms"] = {
            "kofi": {
                "titleTemplate": "☕ ¡KOFI CAFÉ DE {user}!",
                "subtitleTemplate": "Mensaje: {message} ({amount})"
            },
            "paypal": {
                "titleTemplate": "🅿️ ¡PAYPAL DE {user}!",
                "subtitleTemplate": "Importe: {amount}"
            }
        }
        save_alerts_config(cfg)

        kofi_event = format_alert_event("donation", {
            "user": "CoffeeFan",
            "amount": "5.00 EUR",
            "platform": "kofi",
            "message": "¡Buen café!"
        })
        self.assertEqual(kofi_event["title"], "☕ ¡KOFI CAFÉ DE CoffeeFan!")
        self.assertEqual(kofi_event["message"], "Mensaje: ¡Buen café! (5.00 EUR)")

        paypal_event = format_alert_event("donation", {
            "user": "PaypalFan",
            "amount": "50.00 EUR",
            "platform": "paypal"
        })
        self.assertEqual(paypal_event["title"], "🅿️ ¡PAYPAL DE PaypalFan!")
        self.assertEqual(paypal_event["message"], "Importe: 50.00 EUR")

if __name__ == "__main__":
    unittest.main()
