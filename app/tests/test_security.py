"""
Open Stream Suite — Tests de seguridad
Verifica que no se exponen secretos por HTTP, que los endpoints de decks rechazan
peticiones cross-site y que la lista blanca de estáticos sigue funcionando.
Requiere el servidor en marcha (TEST_BASE_URL, por defecto http://localhost:8080).
"""

import os
import unittest
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8080")


class StaticExposureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            r = requests.get(f"{BASE_URL}/api/status", timeout=1)
            if r.status_code != 200:
                raise unittest.SkipTest(f"Servidor en {BASE_URL} devolvió HTTP {r.status_code}")
        except Exception:
            raise unittest.SkipTest(f"Servidor no disponible en {BASE_URL} (tests omitidos)")

    def test_01_secret_files_not_served(self):
        """Ni .env, ni token.json, ni .local_token, ni el código del servidor son accesibles por HTTP"""
        for path in (".env", "token.json", ".local_token", "server/config.py",
                     "triggers.json", "donations_config.json", "roles.json", "server.py"):
            r = requests.get(f"{BASE_URL}/{path}", timeout=5)
            self.assertEqual(r.status_code, 404, f"/{path} no debería servirse (HTTP {r.status_code})")

    def test_02_path_traversal_blocked(self):
        """Intentos de salir de las carpetas estáticas no devuelven secretos"""
        for path in ("alerts/../.env", "common/../.env", "docs/../.env", "plugins/../app/.env"):
            r = requests.get(f"{BASE_URL}/{path}", timeout=5)
            self.assertNotEqual(r.status_code, 200, f"/{path} no debería servirse")
            self.assertNotIn("TWITCH_CLIENT_SECRET", r.text)

    def test_03_public_files_still_served(self):
        """La lista blanca sigue sirviendo lo necesario para panel, overlays y guías"""
        for path in ("alerts/panel.html", "common/styles.css", "config.js", "index.html",
                     "CONVENTIONS.md", "docs/GUIA_INTEGRACION_DECKS.md", "plugins/README.md"):
            r = requests.get(f"{BASE_URL}/{path}", timeout=5)
            self.assertEqual(r.status_code, 200, f"/{path} debería servirse")

    def test_04_markdown_is_readable_in_browser(self):
        """Los .md se sirven como texto para visualizarse en el navegador"""
        r = requests.get(f"{BASE_URL}/plugins/README.md", timeout=5)
        self.assertTrue(r.headers.get("Content-Type", "").startswith("text/plain"))


class DeckProtectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            r = requests.get(f"{BASE_URL}/api/status", timeout=1)
            if r.status_code != 200:
                raise unittest.SkipTest(f"Servidor en {BASE_URL} devolvió HTTP {r.status_code}")
        except Exception:
            raise unittest.SkipTest(f"Servidor no disponible en {BASE_URL} (tests omitidos)")

    def test_01_cross_site_request_rejected(self):
        """Una página web externa no puede disparar acciones del deck"""
        r = requests.get(f"{BASE_URL}/api/deck/status", headers={"Origin": "https://sitio-malicioso.example"}, timeout=5)
        self.assertEqual(r.status_code, 403)
        r = requests.get(f"{BASE_URL}/api/deck/status", headers={"Sec-Fetch-Site": "cross-site"}, timeout=5)
        self.assertEqual(r.status_code, 403)

    def test_02_local_origin_allowed(self):
        """El panel (mismo origen) y los decks (sin Origin) siguen funcionando"""
        r = requests.get(f"{BASE_URL}/api/deck/status", timeout=5)
        self.assertEqual(r.status_code, 200)
        r = requests.get(f"{BASE_URL}/api/deck/status", headers={"Origin": BASE_URL, "Sec-Fetch-Site": "same-origin"}, timeout=5)
        self.assertEqual(r.status_code, 200)

    def test_03_local_token_not_given_to_proxied_requests(self):
        """Una petición que llega por túnel/proxy no recibe el token local"""
        r = requests.get(f"{BASE_URL}/api/local-token", headers={"X-Forwarded-For": "203.0.113.5"}, timeout=5)
        self.assertEqual(r.status_code, 403)
        r = requests.get(f"{BASE_URL}/api/local-token", timeout=5)
        self.assertEqual(r.status_code, 200)


if __name__ == "__main__":
    unittest.main()
