"""Asignación en lote: N componentes en UNA petición, con detalle de fallos.

Regresión de la auditoría 1.0.2: el panel aplicaba por miembro (una fusión con
varias escenas seleccionadas = decenas de POST). Aquí se fija el contrato del
endpoint y se comprueba que el estado del usuario se restaura al terminar.
"""
import json
import unittest
from pathlib import Path

from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop

from server.app import create_app
from server.config import BASE_DIR, LOCAL_AUTH_TOKEN

STATE = Path(BASE_DIR) / "themes_state.json"
BULK = "/api/themes/overlay-assignment/bulk"


class BulkAssignmentTestCase(AioHTTPTestCase):
    async def get_application(self):
        return create_app()

    def setUp(self):
        super().setUp()
        self.headers = {"X-Local-Token": LOCAL_AUTH_TOKEN, "Content-Type": "application/json"}
        self._backup = STATE.read_bytes() if STATE.exists() else None

    def tearDown(self):
        # El test no debe dejar rastro en la configuración del usuario.
        if self._backup is not None:
            STATE.write_bytes(self._backup)
        super().tearDown()

    @unittest_run_loop
    async def test_aplica_varias_claves_en_una_peticion(self):
        payload = {"assignments": [
            {"overlayKey": "maker-desk", "themeId": "neon_streamer"},
            {"overlayKey": "widget:goal", "themeId": "latte_caramel", "shapeId": "cozy_polaroid"},
        ]}
        res = await self.client.post(BULK, json=payload, headers=self.headers)
        self.assertEqual(res.status, 200)
        data = await res.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(sorted(data["applied"]), ["maker-desk", "widget:goal"])
        state = json.loads(STATE.read_text(encoding="utf-8"))
        self.assertEqual(state["overlayThemes"]["maker-desk"], "neon_streamer")
        self.assertEqual(state["overlayThemes"]["widget:goal"], "latte_caramel")
        self.assertEqual(state["overlayShapes"]["widget:goal"], "cozy_polaroid")

    @unittest_run_loop
    async def test_informa_de_fallos_parciales_sin_abortar(self):
        payload = {"assignments": [
            {"overlayKey": "widget:goal", "themeId": "latte_caramel"},
            {"overlayKey": "no-existe", "themeId": "neon_streamer"},
        ]}
        res = await self.client.post(BULK, json=payload, headers=self.headers)
        self.assertEqual(res.status, 200)
        data = await res.json()
        self.assertEqual(data["status"], "partial")
        self.assertIn("widget:goal", data["applied"])
        self.assertEqual(data["failed"][0]["overlayKey"], "no-existe")
        state = json.loads(STATE.read_text(encoding="utf-8"))
        self.assertEqual(state["overlayThemes"]["widget:goal"], "latte_caramel", "lo válido sí se aplica")

    @unittest_run_loop
    async def test_rechaza_payloads_invalidos_con_400(self):
        for bad in ({"assignments": []}, {"assignments": "x"}, {}, {"assignments": [{"themeId": "x"}]}):
            res = await self.client.post(BULK, json=bad, headers=self.headers)
            self.assertEqual(res.status, 400, f"debería ser 400: {bad}")
        res = await self.client.post(BULK, data='{"assignments":', headers=self.headers)
        self.assertEqual(res.status, 400)
        res = await self.client.post(BULK, json={"assignments": [{"overlayKey": f"k{i}"} for i in range(201)]},
                                     headers=self.headers)
        self.assertEqual(res.status, 400)


if __name__ == "__main__":
    unittest.main(verbosity=2)
