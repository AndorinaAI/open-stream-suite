"""
Taller Live — Suite de Smoke Tests
Verifica los endpoints críticos, la protección contra Path Traversal,
autenticación de endpoints POST con token local y restricciones CORS.
"""

import unittest
import requests
import json
import os
from pathlib import Path

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8080")

class TallerLiveSmokeTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Obtener el token local desde el archivo o vía API
        cls.token = ""
        token_file = Path(__file__).resolve().parent.parent / ".local_token"
        if token_file.exists():
            cls.token = token_file.read_text(encoding="utf-8").strip()
        else:
            resp = requests.get(f"{BASE_URL}/api/local-token")
            if resp.status_code == 200:
                cls.token = resp.json().get("token", "")

    def test_01_status_endpoint(self):
        """Verifica que /api/status responde correctamente con el estado del sistema"""
        r = requests.get(f"{BASE_URL}/api/status", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("twitch_connected", data)

    def test_02_local_token_endpoint(self):
        """Verifica que /api/local-token responde con un token hex válido"""
        r = requests.get(f"{BASE_URL}/api/local-token", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertTrue(len(data.get("token", "")) >= 32)

    def test_03_post_unauthenticated_is_blocked(self):
        """Verifica que una llamada POST sin X-Local-Token es rechazada con HTTP 403"""
        r = requests.post(f"{BASE_URL}/api/explode", json={"count": 1}, timeout=5)
        self.assertEqual(r.status_code, 403)
        self.assertIn("Acceso denegado", r.text)

    def test_04_post_authenticated_succeeds(self):
        """Verifica que una llamada POST con X-Local-Token es aceptada con HTTP 200"""
        headers = {"X-Local-Token": self.token, "Content-Type": "application/json"}
        r = requests.post(f"{BASE_URL}/api/explode", json={"count": 1}, headers=headers, timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")

    def test_05_path_traversal_extension_whitelist(self):
        """Verifica que la subida de ficheros rechaza extensiones no permitidas (.py, .sh, etc.)"""
        headers = {"X-Local-Token": self.token}
        files = {"file": ("malicious.py", b"print('hack')", "text/plain")}
        r = requests.post(f"{BASE_URL}/api/upload", files=files, headers=headers, timeout=5)
        self.assertEqual(r.status_code, 400)
        self.assertIn("no permitida", r.text)

    def test_06_cors_foreign_origin_blocked(self):
        """Verifica que una petición preflight OPTIONS desde un origen externo no autorizado es rechazada con 403"""
        headers = {
            "Origin": "https://sitio-malicioso.com",
            "Access-Control-Request-Method": "POST"
        }
        r = requests.options(f"{BASE_URL}/api/explode", headers=headers, timeout=5)
        self.assertEqual(r.status_code, 403)

    def test_07_widgets_config_endpoint(self):
        """Verifica que /api/widgets/config devuelve la configuración modular"""
        r = requests.get(f"{BASE_URL}/api/widgets/config", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        cfg = data.get("config", data)
        self.assertIn("timer", cfg)
        self.assertIn("ticker", cfg)

    def test_08_public_webhook_bypass(self):
        """Verifica que los webhooks de donaciones no requieren el token local privado"""
        payload = {
            "platform": "kofi",
            "user": "SmokeTestUser",
            "amount": "3.00",
            "currency": "EUR",
            "message": "Smoke test webhook"
        }
        r = requests.post(f"{BASE_URL}/api/webhooks/tip", json=payload, timeout=5)
        self.assertEqual(r.status_code, 200)

if __name__ == "__main__":
    unittest.main()
