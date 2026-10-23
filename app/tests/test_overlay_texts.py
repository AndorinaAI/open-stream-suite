import unittest
import json
from pathlib import Path
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from aiohttp import web

from server.app import create_app, LOCAL_AUTH_TOKEN
from server.routes.overlay_routes import (
    OVERLAY_TEXTS_FILE, CONFIG_JS_FILE
)

class OverlayTextsTestCase(AioHTTPTestCase):
    async def get_application(self):
        return create_app()

    def setUp(self):
        super().setUp()
        self.headers = {"X-Local-Token": LOCAL_AUTH_TOKEN, "Content-Type": "application/json"}
        # Backup original files if they exist
        self.texts_backup = None
        if OVERLAY_TEXTS_FILE.exists():
            self.texts_backup = OVERLAY_TEXTS_FILE.read_text(encoding="utf-8")
        self.config_js_backup = None
        if CONFIG_JS_FILE.exists():
            self.config_js_backup = CONFIG_JS_FILE.read_text(encoding="utf-8")

    def tearDown(self):
        super().tearDown()
        if self.texts_backup is not None:
            OVERLAY_TEXTS_FILE.write_text(self.texts_backup, encoding="utf-8")
        if self.config_js_backup is not None:
            CONFIG_JS_FILE.write_text(self.config_js_backup, encoding="utf-8")

    @unittest_run_loop
    async def test_01_get_overlay_texts(self):
        """Verifica que /api/overlays/texts devuelva la estructura completa de textos de escenas"""
        resp = await self.client.get("/api/overlays/texts")
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("texts", data)

        texts = data["texts"]
        for section in ("channel", "game", "maker", "print", "chill", "startingSoon", "beRightBack", "ending"):
            self.assertIn(section, texts)

        self.assertIn("name", texts["channel"])
        self.assertIn("phases", texts["maker"])
        self.assertIn("phases", texts["print"])
        self.assertIn("statusPhrases", texts["beRightBack"])

    @unittest_run_loop
    async def test_02_save_overlay_texts_and_sync(self):
        """Verifica el guardado de textos, escritura en JSON y sincronización en config.js"""
        # 1. Obtener textos actuales
        r0 = await self.client.get("/api/overlays/texts")
        data0 = await r0.json()
        texts = data0["texts"]

        # 2. Modificar textos de varias escenas
        texts["channel"]["name"] = "ANDORINA TESTER"
        texts["channel"]["tagline"] = "CREAR · JUGAR · PROBAR"
        texts["maker"]["projectName"] = "ROBOTICA CON ARDUINO"
        texts["maker"]["phases"] = ["01 PROTOTIPO", "02 SOLDADURA", "03 FIRMWARE"]
        texts["beRightBack"]["title"] = "PAUSA DE CAFÉ"
        texts["beRightBack"]["statusPhrases"] = ["AFINANDO EL CÓDIGO...", "VOLVEMOS YA"]
        texts["ending"]["title"] = "HASTA LA PRÓXIMA"

        # 3. Guardar vía POST con token
        r1 = await self.client.post("/api/overlays/texts", json={"texts": texts}, headers=self.headers)
        self.assertEqual(r1.status, 200)
        d1 = await r1.json()
        self.assertEqual(d1.get("status"), "ok")

        # 4. Verificar persistencia en disco
        self.assertTrue(OVERLAY_TEXTS_FILE.exists())
        saved_json = json.loads(OVERLAY_TEXTS_FILE.read_text(encoding="utf-8"))
        self.assertEqual(saved_json["channel"]["name"], "ANDORINA TESTER")
        self.assertEqual(saved_json["maker"]["projectName"], "ROBOTICA CON ARDUINO")
        self.assertEqual(saved_json["beRightBack"]["title"], "PAUSA DE CAFÉ")

        # 5. Verificar sincronización en config.js
        self.assertTrue(CONFIG_JS_FILE.exists())
        config_js = CONFIG_JS_FILE.read_text(encoding="utf-8")
        self.assertIn("ANDORINA TESTER", config_js)
        self.assertIn("ROBOTICA CON ARDUINO", config_js)

        # 6. Verificar que GET posterior devuelva los nuevos valores
        r2 = await self.client.get("/api/overlays/texts")
        d2 = await r2.json()
        self.assertEqual(d2["texts"]["channel"]["name"], "ANDORINA TESTER")
        self.assertEqual(d2["texts"]["beRightBack"]["title"], "PAUSA DE CAFÉ")

    @unittest_run_loop
    async def test_03_auth_protection(self):
        """Verifica que guardar textos sin token local sea rechazado"""
        resp = await self.client.post("/api/overlays/texts", json={"texts": {}})
        self.assertEqual(resp.status, 403)

    @unittest_run_loop
    async def test_04_reset_overlay_texts_section_and_custom_scenes(self):
        """Verifica la restauración granular por sección y la limpieza de customScenes"""
        # 1. Guardar textos modificados tanto en sección base como en customScenes
        r0 = await self.client.get("/api/overlays/texts")
        texts = (await r0.json())["texts"]
        texts["beRightBack"]["title"] = "PAUSA MODIFICADA"
        texts.setdefault("customScenes", {})
        texts["customScenes"]["cozy_art"] = {"title": "Lienzo de Prueba", "artist": "Andorina"}
        texts["customScenes"]["gamer_gameplay"] = {"title": "Partida Clasificatoria"}

        await self.client.post("/api/overlays/texts", json={"texts": texts}, headers=self.headers)

        # 2. Resetear únicamente la sección beRightBack
        r_reset_brb = await self.client.post("/api/overlays/texts/reset", json={"section": "beRightBack"}, headers=self.headers)
        self.assertEqual(r_reset_brb.status, 200)
        d_brb = await r_reset_brb.json()
        self.assertEqual(d_brb["texts"]["beRightBack"]["title"], "YA VUELVO")
        # customScenes aún deben existir
        self.assertIn("cozy_art", d_brb["texts"]["customScenes"])

        # 3. Resetear la escena específica cozy_art
        r_reset_scene = await self.client.post(
            "/api/overlays/texts/reset",
            json={"section": "cozy_art", "sceneKey": "cozy_art"},
            headers=self.headers
        )
        self.assertEqual(r_reset_scene.status, 200)
        d_scene = await r_reset_scene.json()
        self.assertNotIn("cozy_art", d_scene["texts"].get("customScenes", {}))
        self.assertIn("gamer_gameplay", d_scene["texts"].get("customScenes", {}))

        # 4. Verificar sincronización en config.js
        config_js = CONFIG_JS_FILE.read_text(encoding="utf-8")
        self.assertNotIn("Lienzo de Prueba", config_js)
        self.assertIn("Partida Clasificatoria", config_js)

    @unittest_run_loop
    async def test_05_reset_all_texts_to_factory(self):
        """Verifica la restauración total de fábrica de todos los textos y escenas"""
        # Modificar varios campos
        r0 = await self.client.get("/api/overlays/texts")
        texts = (await r0.json())["texts"]
        texts["channel"]["name"] = "TEXTO TEMPORAL"
        texts.setdefault("customScenes", {})["temp_scene"] = {"val": "123"}
        await self.client.post("/api/overlays/texts", json={"texts": texts}, headers=self.headers)

        # Reset total
        r_all = await self.client.post("/api/overlays/texts/reset", json={"section": "all"}, headers=self.headers)
        self.assertEqual(r_all.status, 200)
        d_all = await r_all.json()

        self.assertEqual(d_all["texts"]["channel"]["name"], "ANDORINA")
        self.assertNotIn("customScenes", d_all["texts"])

        # Verificar config.js
        config_js = CONFIG_JS_FILE.read_text(encoding="utf-8")
        self.assertIn("ANDORINA", config_js)
        self.assertNotIn("TEXTO TEMPORAL", config_js)
