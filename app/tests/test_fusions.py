import unittest
import json
import shutil
from pathlib import Path
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from aiohttp import web

from server.app import create_app, LOCAL_AUTH_TOKEN
from server.services.fusions_service import FUSIONS_FILE, load_fusions, save_fusions
from server.services.theme_manager import THEMES_STATE_FILE
from server.config import BASE_DIR
from server.services.theme_service import load_theme_state, save_theme_state

class FusionsTestCase(AioHTTPTestCase):
    async def get_application(self):
        return create_app()

    def setUp(self):
        super().setUp()
        self.headers = {
            "X-Local-Token": LOCAL_AUTH_TOKEN,
            "Content-Type": "application/json"
        }
        # Backup fusions.json and themes_state.json
        self.fusions_backup = None
        if FUSIONS_FILE.exists():
            self.fusions_backup = FUSIONS_FILE.read_text(encoding="utf-8")
        self.themes_state_backup = None
        if THEMES_STATE_FILE.exists():
            self.themes_state_backup = THEMES_STATE_FILE.read_text(encoding="utf-8")
        self.config_backup = None
        config_file = BASE_DIR / "config.js"
        if config_file.exists():
            self.config_backup = config_file.read_text(encoding="utf-8")

    def tearDown(self):
        super().tearDown()
        if self.fusions_backup is not None:
            FUSIONS_FILE.write_text(self.fusions_backup, encoding="utf-8")
        elif FUSIONS_FILE.exists():
            FUSIONS_FILE.unlink()

        if self.themes_state_backup is not None:
            THEMES_STATE_FILE.write_text(self.themes_state_backup, encoding="utf-8")
        if self.config_backup is not None:
            (BASE_DIR / "config.js").write_text(self.config_backup, encoding="utf-8")

    @unittest_run_loop
    async def test_01_get_fusions_list(self):
        """Verifica que /api/fusions devuelva la lista de fusiones activas"""
        resp = await self.client.get("/api/fusions")
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("fusions", data)
        self.assertIsInstance(data["fusions"], list)
        self.assertGreaterEqual(len(data["fusions"]), 1)
        # La fusion por defecto debe estar presente
        starter = next((f for f in data["fusions"] if f.get("id") == "fusion_starter_mix"), None)
        self.assertIsNotNone(starter)
        self.assertIn("scenes", starter)
        self.assertIn("defaultTheme", starter)

    @unittest_run_loop
    async def test_02_create_and_update_fusion(self):
        """Verifica la creación y actualización de una fusión personalizada con persistencia en disco"""
        payload = {
            "name": "Fusión Gaming & Taller",
            "icon": "🕹️",
            "description": "Fusión híbrida de pruebas con HUD Gamer y Desk Maker",
            "scenes": ["gamer_gameplay", "maker-desk", "cozy_art"],
            "defaultTheme": "cyberpunk"
        }
        resp = await self.client.post("/api/fusions", json=payload, headers=self.headers)
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data.get("status"), "ok")
        fusion = data.get("fusion", {})
        fusion_id = fusion.get("id")
        self.assertTrue(fusion_id.startswith("fusion_"))
        self.assertEqual(fusion.get("name"), "Fusión Gaming & Taller")
        self.assertEqual(len(fusion.get("scenes")), 3)

        # Verificar persistencia en fusions.json
        on_disk = load_fusions()
        found = next((f for f in on_disk if f.get("id") == fusion_id), None)
        self.assertIsNotNone(found)
        self.assertEqual(found.get("icon"), "🕹️")

        # Actualizar la misma fusión
        update_payload = {
            "id": fusion_id,
            "name": "Fusión Gaming & Taller Actualizada",
            "icon": "⚡",
            "description": "Descripción actualizada",
            "scenes": ["gamer_gameplay", "maker-desk"],
            "defaultTheme": "terminal"
        }
        resp_up = await self.client.post("/api/fusions", json=update_payload, headers=self.headers)
        self.assertEqual(resp_up.status, 200)
        up_data = await resp_up.json()
        self.assertEqual(up_data["fusion"]["name"], "Fusión Gaming & Taller Actualizada")
        self.assertEqual(len(up_data["fusion"]["scenes"]), 2)
        self.assertEqual(up_data["fusion"]["defaultTheme"], "terminal")

    @unittest_run_loop
    async def test_03_get_single_fusion_and_404(self):
        """Verifica la obtención de una fusión por ID y el código 404 para ID inexistente"""
        resp_ok = await self.client.get("/api/fusions/fusion_starter_mix")
        self.assertEqual(resp_ok.status, 200)
        data_ok = await resp_ok.json()
        self.assertEqual(data_ok["fusion"]["id"], "fusion_starter_mix")

        resp_404 = await self.client.get("/api/fusions/fusion_inexistente_999")
        self.assertEqual(resp_404.status, 404)

    @unittest_run_loop
    async def test_04_apply_batch_theme_to_fusion(self):
        """Verifica que /api/fusions/{id}/apply-theme aplique el tema a todas las escenas de la fusión"""
        # Crear fusion con 3 escenas específicas
        fusion_id = "test_fusion_batch_theme"
        create_payload = {
            "id": fusion_id,
            "name": "Test Batch Theme Fusion",
            "scenes": ["gamer_gameplay", "cozy_art", "oss_chatting"],
            "defaultTheme": "maker"
        }
        await self.client.post("/api/fusions", json=create_payload, headers=self.headers)

        # Aplicar tema en lote
        apply_payload = {"themeId": "synthwave"}
        resp = await self.client.post(f"/api/fusions/{fusion_id}/apply-theme", json=apply_payload, headers=self.headers)
        self.assertEqual(resp.status, 200)
        res_data = await resp.json()
        self.assertEqual(res_data.get("status"), "ok")
        self.assertEqual(res_data.get("themeId"), "synthwave")
        self.assertEqual(len(res_data.get("appliedScenes", [])), 3)

        # Verificar que themes_state.json fue actualizado con la asignación por escena
        state = load_theme_state()
        overlay_themes = state.get("overlayThemes", {})
        self.assertEqual(overlay_themes.get("gamer_gameplay"), "synthwave")
        self.assertEqual(overlay_themes.get("cozy_art"), "synthwave")
        self.assertEqual(overlay_themes.get("oss_chatting"), "synthwave")

    @unittest_run_loop
    async def test_05_apply_batch_shape_to_fusion(self):
        """Verifica que /api/fusions/{id}/apply-shape aplique formas (física, original, auto) en lote"""
        fusion_id = "test_fusion_batch_shape"
        create_payload = {
            "id": fusion_id,
            "name": "Test Batch Shape Fusion",
            "scenes": ["gamer_gameplay", "cozy_art", "oss_chatting"],
            "defaultTheme": "maker"
        }
        await self.client.post("/api/fusions", json=create_payload, headers=self.headers)

        # 1. Aplicar forma física universal (gamer_hex_shield)
        resp1 = await self.client.post(f"/api/fusions/{fusion_id}/apply-shape", json={"shapeId": "gamer_hex_shield"}, headers=self.headers)
        self.assertEqual(resp1.status, 200)
        state1 = load_theme_state()
        self.assertEqual(state1.get("overlayShapes", {}).get("gamer_gameplay"), "gamer_hex_shield")
        self.assertEqual(state1.get("overlayShapes", {}).get("cozy_art"), "gamer_hex_shield")
        self.assertEqual(state1.get("overlayShapes", {}).get("oss_chatting"), "gamer_hex_shield")

        # 2. Aplicar forma 'original' para restaurar geometría nativa
        resp2 = await self.client.post(f"/api/fusions/{fusion_id}/apply-shape", json={"shapeId": "original"}, headers=self.headers)
        self.assertEqual(resp2.status, 200)
        state2 = load_theme_state()
        self.assertEqual(state2.get("overlayShapes", {}).get("gamer_gameplay"), "original")
        self.assertEqual(state2.get("overlayShapes", {}).get("cozy_art"), "original")
        self.assertEqual(state2.get("overlayShapes", {}).get("oss_chatting"), "original")

        # 3. Aplicar forma 'auto' para limpiar la forma personalizada
        resp3 = await self.client.post(f"/api/fusions/{fusion_id}/apply-shape", json={"shapeId": "auto"}, headers=self.headers)
        self.assertEqual(resp3.status, 200)
        state3 = load_theme_state()
        self.assertNotIn("gamer_gameplay", state3.get("overlayShapes", {}))
        self.assertNotIn("cozy_art", state3.get("overlayShapes", {}))
        self.assertNotIn("oss_chatting", state3.get("overlayShapes", {}))

    @unittest_run_loop
    async def test_06_delete_fusion(self):
        """Verifica la eliminación de una fusión y su respuesta adecuada"""
        fusion_id = "test_fusion_to_delete"
        await self.client.post("/api/fusions", json={"id": fusion_id, "name": "A Borrar", "scenes": []}, headers=self.headers)

        del_resp = await self.client.delete(f"/api/fusions/{fusion_id}", headers=self.headers)
        self.assertEqual(del_resp.status, 200)
        d_data = await del_resp.json()
        self.assertEqual(d_data.get("status"), "ok")
        self.assertEqual(d_data.get("deletedId"), fusion_id)

        # Comprobar que ya no existe
        get_resp = await self.client.get(f"/api/fusions/{fusion_id}")
        self.assertEqual(get_resp.status, 404)

        # Intentar eliminar de nuevo debe dar 404
        del_again = await self.client.delete(f"/api/fusions/{fusion_id}", headers=self.headers)
        self.assertEqual(del_again.status, 404)

    @unittest_run_loop
    async def test_07_edge_cases_and_validations(self):
        """Prueba casos borde y validaciones de datos en Fusions"""
        # 1. Nombre vacío al crear fusión debe devolver 400
        r_empty_name = await self.client.post("/api/fusions", json={"name": "   ", "scenes": []}, headers=self.headers)
        self.assertEqual(r_empty_name.status, 400)
        d_err = await r_empty_name.json()
        self.assertIn("error", d_err)

        # 2. Payload no JSON
        r_bad_payload = await self.client.post("/api/fusions", data="no-json", headers=self.headers)
        self.assertEqual(r_bad_payload.status, 400)

        # 3. Aplicar tema sin themeId
        r_no_theme = await self.client.post("/api/fusions/fusion_starter_mix/apply-theme", json={}, headers=self.headers)
        self.assertEqual(r_no_theme.status, 400)

        # 4. Aplicar tema o forma a fusión que no existe debe dar 404
        r_theme_404 = await self.client.post("/api/fusions/non_existent/apply-theme", json={"themeId": "maker"}, headers=self.headers)
        self.assertEqual(r_theme_404.status, 404)

        r_shape_404 = await self.client.post("/api/fusions/non_existent/apply-shape", json={"shapeId": "original"}, headers=self.headers)
        self.assertEqual(r_shape_404.status, 404)

        # 5. Fusión con lista de escenas vacía debe aplicar con 0 escenas sin error
        empty_fusion_id = "test_empty_scenes_fusion"
        await self.client.post("/api/fusions", json={"id": empty_fusion_id, "name": "Vacía", "scenes": []}, headers=self.headers)
        r_empty_apply = await self.client.post(f"/api/fusions/{empty_fusion_id}/apply-theme", json={"themeId": "terminal"}, headers=self.headers)
        self.assertEqual(r_empty_apply.status, 200)
        self.assertEqual(len((await r_empty_apply.json()).get("appliedScenes", [])), 0)

if __name__ == "__main__":
    unittest.main()
