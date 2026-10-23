"""
tests/test_audit_fixes.py — Tests automatizados para verificar las correcciones del informe de auditoría
"""

import unittest
import json
import asyncio
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from aiohttp import web
from server.app import create_app
from server.config import LOCAL_AUTH_TOKEN
from server.services.theme_manager import load_theme_state, save_theme_state
from server.services.theme_service import set_overlay_backdrop_service
from server.services.overlay_service import load_overlay_texts, reset_overlay_texts
from server.services.fusions_service import create_or_update_fusion, get_fusion_by_id


class AuditFixesTestCase(AioHTTPTestCase):

    async def get_application(self):
        return create_app()

    def setUp(self):
        super().setUp()
        self.headers = {"X-Local-Token": LOCAL_AUTH_TOKEN, "Content-Type": "application/json"}

    def test_2_2_save_theme_state_preserves_mappings(self):
        """2.2: save_theme_state no debe borrar overlayThemes ni overlayShapes al guardar un estado parcial"""
        # Guardar un estado base con asignaciones
        initial_state = load_theme_state()
        initial_state["overlayThemes"]["game"] = "cyberpunk"
        initial_state["overlayShapes"]["game"] = "gamer_mecha"
        save_theme_state(initial_state)

        # Simular una llamada parcial (ej. cambiar solo activePack y activeTheme)
        partial_state = {
            "activePack": "Maker_Theme_Pack",
            "activeTheme": "maker"
        }
        save_theme_state(partial_state)

        loaded = load_theme_state()
        self.assertEqual(loaded.get("activePack"), "Maker_Theme_Pack")
        self.assertEqual(loaded.get("activeTheme"), "maker")
        self.assertEqual(loaded.get("overlayThemes", {}).get("game"), "cyberpunk")
        self.assertEqual(loaded.get("overlayShapes", {}).get("game"), "gamer_mecha")

    @unittest_run_loop
    async def test_3_1_fusion_default_shape_persisted(self):
        """3.1: defaultShape debe persistirse en las fusiones"""
        fusion_data = {
            "id": "test_audit_fusion_shape",
            "name": "Audit Fusion Shape Test",
            "scenes": ["oss_chatting"],
            "defaultTheme": "maker",
            "defaultShape": "maker_blueprint"
        }
        created = create_or_update_fusion(fusion_data)
        self.assertEqual(created.get("defaultShape"), "maker_blueprint")

        fetched = get_fusion_by_id("test_audit_fusion_shape")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.get("defaultShape"), "maker_blueprint")

    @unittest_run_loop
    async def test_3_3_backdrop_endpoint_and_service(self):
        """3.3: Endpoint /api/themes/backdrop guarda y persiste el fondo con recorte"""
        backdrop_payload = {
            "overlayKey": "gamer_victory",
            "backdrop": {
                "mode": "preset",
                "preset": "gamer_carbon_mesh"
            }
        }
        resp = await self.client.post("/api/themes/backdrop", json=backdrop_payload, headers=self.headers)
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("overlayKey"), "gamer_victory")

        # Verificar en themes_state.json
        state = load_theme_state()
        self.assertIn("backdrops", state)
        self.assertEqual(state["backdrops"].get("gamer_victory", {}).get("preset"), "gamer_carbon_mesh")

        # Restaurar a none
        resp_clear = await self.client.post("/api/themes/backdrop", json={
            "overlayKey": "gamer_victory",
            "backdrop": {"mode": "none"}
        }, headers=self.headers)
        self.assertEqual(resp_clear.status, 200)
        state_after = load_theme_state()
        self.assertNotIn("gamer_victory", state_after.get("backdrops", {}))

    def test_4_6_overlay_texts_en_loaded(self):
        """4.6: load_overlay_texts(lang='en') carga overlay_texts_config.en.json"""
        texts_en = load_overlay_texts(lang="en")
        self.assertIn("channel", texts_en)
        self.assertIn("beRightBack", texts_en)
        self.assertEqual(texts_en["beRightBack"].get("badgeText"), "SHORT BREAK")
        self.assertEqual(texts_en["chill"].get("podcastTitle"), "OPEN STREAM PODCAST")

    @unittest_run_loop
    async def test_2_1_ws_json_handling(self):
        """2.1: El websocket no debe lanzar NameError al recibir texto JSON"""
        ws = await self.client.ws_connect("/ws")
        test_msg = json.dumps({"action": "test", "alertType": "follow"})
        await ws.send_str(test_msg)
        await asyncio.sleep(0.05)
        self.assertFalse(ws.closed)
        await ws.close()


if __name__ == "__main__":
    unittest.main()
