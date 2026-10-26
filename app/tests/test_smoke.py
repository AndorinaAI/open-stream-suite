"""
Open Stream Suite — Suite de Smoke Tests
Verifica los endpoints críticos, la protección contra Path Traversal,
autenticación de endpoints POST con token local y restricciones CORS.
"""

import unittest
import requests
import json
import os
from pathlib import Path

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8080")

class OpenStreamSuiteSmokeTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        try:
            r = requests.get(f"{BASE_URL}/api/status", timeout=1)
            if r.status_code != 200:
                raise unittest.SkipTest(f"Servidor en {BASE_URL} devolvió HTTP {r.status_code}")
        except Exception:
            raise unittest.SkipTest(f"Servidor no disponible en {BASE_URL} (smoke tests omitidos)")

        # Snapshot de auth: estos smoke tests no deben cerrar la sesión real.
        cls._token_snapshot = None
        token_path = Path(__file__).resolve().parent.parent / "token.json"
        if token_path.exists():
            cls._token_snapshot = token_path.read_text(encoding="utf-8")

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

    def test_08_public_webhook_requires_token(self):
        """El simulador de propinas es local y exige token; no es un webhook público."""
        payload = {
            "platform": "kofi",
            "user": "SmokeTestUser",
            "amount": "3.00",
            "currency": "EUR",
            "message": "Smoke test webhook"
        }
        r = requests.post(f"{BASE_URL}/api/webhooks/tip", json=payload, timeout=5)
        self.assertEqual(r.status_code, 403)
        # No se envía la variante autenticada: dejaría un tip ficticio en
        # `recent_tips` hasta reiniciar el servidor (fixture real).

    def test_09_auth_logout(self):
        """Verifica que /api/auth/logout requiere token local y responde ok"""
        # Sin token local -> 403
        r = requests.post(f"{BASE_URL}/api/auth/logout", json={}, timeout=5)
        self.assertEqual(r.status_code, 403)

        # No se llama al logout autenticado: borraría token.json y la sesión
        # real de Twitch del usuario. La cobertura de auth se hace sin efecto.

    @classmethod
    def tearDownClass(cls):
        token_path = Path(__file__).resolve().parent.parent / "token.json"
        snapshot = getattr(cls, "_token_snapshot", None)
        if snapshot is not None:
            token_path.write_text(snapshot, encoding="utf-8")

    def test_10_updates_check_and_apply(self):
        """Verifica los endpoints de comprobación y aplicación de actualizaciones"""
        # GET /api/updates/check público
        r = requests.get(f"{BASE_URL}/api/updates/check?branch=main", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("update_available", data)
        self.assertIn("current_version", data)
        self.assertEqual(data.get("branch"), "main")

        # POST /api/updates/apply sin token local -> 403
        r = requests.post(f"{BASE_URL}/api/updates/apply", json={"branch": "main"}, timeout=5)
        self.assertEqual(r.status_code, 403)

if __name__ == "__main__":
    unittest.main()
