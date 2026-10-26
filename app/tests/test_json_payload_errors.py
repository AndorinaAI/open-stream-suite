"""Regresión de V3-08: payload JSON inválido debe responder 400, no 500.

Los endpoints de recompensas y la simulación de donaciones hacían
`await request.json()` sin protección (500 con traza) o convertían cualquier
error en un 500 genérico con `str(e)`.
"""
import unittest
from unittest.mock import patch

from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop

from server.app import create_app
from server.config import LOCAL_AUTH_TOKEN
from server.state import system

INVALID_JSON = '{"title": "x",}'


class JsonPayloadErrorTestCase(AioHTTPTestCase):
    async def get_application(self):
        return create_app()

    def setUp(self):
        super().setUp()
        self.headers = {"X-Local-Token": LOCAL_AUTH_TOKEN, "Content-Type": "application/json"}

    def _fake_twitch_session(self):
        """Evita el 401 previo al parseo en las rutas que exigen Twitch."""
        return (
            patch.object(system, "token_data", {"access_token": "test"}),
            patch.object(system, "user_info", {"id": "1", "display_name": "test"}),
        )

    @unittest_run_loop
    async def test_fusions_rejects_invalid_json(self):
        response = await self.client.post("/api/fusions", data=INVALID_JSON, headers=self.headers)
        self.assertEqual(response.status, 400)
        self.assertEqual((await response.json()).get("error"), "Payload JSON inválido")

    @unittest_run_loop
    async def test_reward_create_rejects_invalid_json(self):
        token, user = self._fake_twitch_session()
        with token, user:
            response = await self.client.post(
                "/api/twitch/rewards/create", data=INVALID_JSON, headers=self.headers
            )
        self.assertEqual(response.status, 400)

    @unittest_run_loop
    async def test_reward_delete_rejects_invalid_json(self):
        token, user = self._fake_twitch_session()
        with token, user:
            response = await self.client.post(
                "/api/twitch/rewards/delete", data=INVALID_JSON, headers=self.headers
            )
        self.assertEqual(response.status, 400)

    @unittest_run_loop
    async def test_reward_create_rejects_non_numeric_cost(self):
        token, user = self._fake_twitch_session()
        with token, user:
            response = await self.client.post(
                "/api/twitch/rewards/create",
                json={"title": "Prueba", "cost": "no-es-un-numero"},
                headers=self.headers,
            )
        self.assertEqual(response.status, 400)
        self.assertIn("coste", (await response.json()).get("error", ""))

    @unittest_run_loop
    async def test_tip_simulate_rejects_invalid_json(self):
        response = await self.client.post("/api/tips/simulate", data=INVALID_JSON, headers=self.headers)
        self.assertEqual(response.status, 400)
        body = await response.json()
        self.assertEqual(body.get("status"), "error")
        self.assertNotIn("Traceback", str(body))

    @unittest_run_loop
    async def test_internal_error_is_generic_and_does_not_leak(self):
        with patch(
            "server.routes.fusions_routes.create_or_update_fusion",
            side_effect=RuntimeError("/home/andorina/secreto/token.json"),
        ):
            response = await self.client.post(
                "/api/fusions", json={"name": "Fusión"}, headers=self.headers
            )
        self.assertEqual(response.status, 500)
        body = await response.json()
        self.assertEqual(body.get("error"), "Error interno del servidor")
        self.assertNotIn("secreto", str(body))


if __name__ == "__main__":
    unittest.main()
