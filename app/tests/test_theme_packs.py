import unittest
import shutil
from pathlib import Path
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from aiohttp import web

from server.config import BASE_DIR, LOCAL_AUTH_TOKEN
from server.routes.themes_routes import (
    register_themes_routes, THEMES_DIR, COMMON_THEMES_CSS
)

class ThemePacksTestCase(AioHTTPTestCase):
    async def get_application(self):
        app = web.Application()
        register_themes_routes(app)
        return app

    def setUp(self):
        super().setUp()
        self.headers = {"X-Local-Token": LOCAL_AUTH_TOKEN, "Content-Type": "application/json"}

    @unittest_run_loop
    async def test_01_packs_structure_and_base_themes(self):
        """Verifica que /api/themes/packs devuelva los packs modulares y los 6 temas de Maker_Theme_Pack"""
        resp = await self.client.get("/api/themes/packs")
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("packs", data)

        pack_ids = [p["id"] for p in data["packs"]]
        self.assertTrue(any(pid.lower() in ("maker_theme_pack", "open_stream_pack") for pid in pack_ids))

        taller_pack = next(p for p in data["packs"] if p["id"] == "Maker_Theme_Pack")
        theme_ids = [t["id"] for t in taller_pack["themes"]]
        for expected in ("maker", "print", "terminal", "chill", "cyberpunk", "synthwave"):
            self.assertIn(expected, theme_ids)

        # Verificar que el pack reporta sus overlays
        self.assertIn("overlays", taller_pack)
        self.assertGreaterEqual(len(taller_pack["overlays"]), 1)

    @unittest_run_loop
    async def test_02_create_pack_and_theme_in_directory(self):
        """Verifica la creación física de carpetas y subcarpetas para nuevos packs y temas"""
        # 1. Crear nuevo pack
        pack_payload = {
            "name": "Pack Neon Test",
            "icon": "⚡",
            "badge": "TEST",
            "description": "Pack de pruebas unitarias"
        }
        r1 = await self.client.post("/api/themes/packs/create", json=pack_payload, headers=self.headers)
        self.assertEqual(r1.status, 200)
        d1 = await r1.json()
        pack_id = d1.get("pack", {}).get("id")
        self.assertTrue((THEMES_DIR / pack_id / "pack.json").exists())
        self.assertTrue((THEMES_DIR / pack_id / "styles").exists())
        self.assertTrue((THEMES_DIR / pack_id / "overlays").exists())

        # 2. Crear nuevo tema en ese pack
        theme_payload = {
            "packId": pack_id,
            "name": "Cyber Test Theme",
            "accentCyan": "#00FFCC",
            "accentOrange": "#FF0066"
        }
        r2 = await self.client.post("/api/themes/create", json=theme_payload, headers=self.headers)
        self.assertEqual(r2.status, 200)
        d2 = await r2.json()
        theme_id = d2.get("theme", {}).get("id")

        theme_dir = THEMES_DIR / pack_id / theme_id
        self.assertTrue(theme_dir.exists())
        self.assertTrue((theme_dir / "theme.json").exists())
        self.assertTrue((theme_dir / "style.css").exists())

        # 3. Guardar código CSS modificado y comprobar recompilación
        new_css = f'body[data-theme="{theme_id}"] {{ --color-accent-cyan: #00FFCC; }}'
        r3 = await self.client.post("/api/themes/save", json={
            "packId": pack_id,
            "id": theme_id,
            "css": new_css,
            "accentCyan": "#00FFCC"
        }, headers=self.headers)
        self.assertEqual(r3.status, 200)

        # Verificar que style.css en disco contiene el nuevo código
        saved_css = (theme_dir / "style.css").read_text(encoding="utf-8")
        self.assertIn("--color-accent-cyan: #00FFCC", saved_css)

        # 4. Probar alternancia de anclaje de chat y creación de derivado
        r4 = await self.client.post("/api/themes/chat-anchor", json={
            "packId": pack_id,
            "themeId": theme_id,
            "anchored": False
        }, headers=self.headers)
        self.assertEqual(r4.status, 200)
        d4 = await r4.json()
        self.assertFalse(d4.get("anchored"))
        self.assertIsNotNone(d4.get("chatDerivative"))

        # 5. Limpieza del pack de prueba
        shutil.rmtree(THEMES_DIR / pack_id)

    @unittest_run_loop
    async def test_03_restore_theme_to_original(self):
        """Verifica que un tema modificado pueda restaurarse a sus valores originales de fábrica"""
        # Modificar el tema 'maker' en Maker_Theme_Pack
        pack_id = "Maker_Theme_Pack"
        from server.routes.themes_routes import find_pack_dir
        theme_dir = find_pack_dir(pack_id) / "styles" / "maker"
        self.assertTrue(theme_dir.exists())

        # Guardar una modificación
        custom_css = 'body[data-theme="maker"] { --color-accent-cyan: #123456; }'
        r1 = await self.client.post("/api/themes/save", json={
            "packId": pack_id,
            "id": "maker",
            "css": custom_css,
            "accentCyan": "#123456"
        }, headers=self.headers)
        self.assertEqual(r1.status, 200)

        saved_css = (theme_dir / "style.css").read_text(encoding="utf-8")
        self.assertIn("#123456", saved_css)

        # Restaurar original vía API
        r2 = await self.client.post("/api/themes/restore", json={
            "packId": pack_id,
            "themeId": "maker"
        }, headers=self.headers)
        self.assertEqual(r2.status, 200)
        d2 = await r2.json()
        self.assertEqual(d2.get("status"), "ok")

        # Verificar que volvió a los colores originales (#57D6C4)
        restored_css = (theme_dir / "style.css").read_text(encoding="utf-8")
        self.assertIn("#57D6C4", restored_css)
        self.assertNotIn("#123456", restored_css)

    @unittest_run_loop
    async def test_04_overlay_theme_assignment(self):
        """Verifica la asignación de estilos visuales independientes por overlay"""
        # Asignar tema 'cyberpunk' a la overlay 'game'
        payload = {"overlayKey": "game", "themeId": "cyberpunk"}
        r = await self.client.post("/api/themes/overlay-assignment", json=payload, headers=self.headers)
        self.assertEqual(r.status, 200)
        d = await r.json()
        self.assertEqual(d.get("status"), "ok")
        self.assertEqual(d.get("overlayThemes", {}).get("game"), "cyberpunk")

        # Comprobar que /api/themes/packs incluye la asignación
        r_get = await self.client.get("/api/themes/packs")
        self.assertEqual(r_get.status, 200)
        d_get = await r_get.json()
        self.assertEqual(d_get.get("overlayThemes", {}).get("game"), "cyberpunk")

    @unittest_run_loop
    async def test_05_physical_shapes_catalog_and_assignment(self):
        """Verifica que las 20 formas físicas universales estén registradas y resuelvan correctamente"""
        from server.services.theme_service import SHAPE_TO_ARCHETYPE

        EXPECTED_20_SHAPES = [
            "cozy_polaroid", "cozy_canvas", "cozy_soft",
            "gamer_mecha", "gamer_tactical_hud", "gamer_stealth",
            "gamer_hex_shield", "gamer_cyber_glitch", "gamer_arcade_retro",
            "maker_blueprint", "maker_workbench", "maker_circuit_pcb",
            "openstream_glass", "openstream_studio",
            "fantasy_parchment", "fantasy_runic_stone", "gothic_vampire",
            "comic_manga_action", "pop_synth_neon", "vintage_crt_monitor"
        ]

        # 1. Comprobar que SHAPE_TO_ARCHETYPE tiene registradas las 20 formas
        for shape_id in EXPECTED_20_SHAPES:
            self.assertIn(shape_id, SHAPE_TO_ARCHETYPE)
            arch = SHAPE_TO_ARCHETYPE[shape_id]
            self.assertIn(arch, ("cozy", "gamer", "maker", "openstream"))

        # 2. Asignar una forma temática nueva como fantasy_parchment a un overlay
        payload = {"overlayKey": "starting", "themeId": "ambient", "shapeId": "fantasy_parchment"}
        r = await self.client.post("/api/themes/overlay-assignment", json=payload, headers=self.headers)
        self.assertEqual(r.status, 200)
        d = await r.json()
        self.assertEqual(d.get("status"), "ok")
        self.assertEqual(d.get("overlayShapes", {}).get("starting"), "fantasy_parchment")

    @unittest_run_loop
    async def test_06_overlay_shape_reset_and_edge_cases(self):
        """Verifica la restauración de estilo a 'original', eliminación con 'auto' y casos borde"""
        # 1. Asignar forma personalizada
        r1 = await self.client.post("/api/themes/overlay-assignment", json={
            "overlayKey": "gamer_victory",
            "themeId": "golden_glory",
            "shapeId": "gamer_hex_shield"
        }, headers=self.headers)
        self.assertEqual(r1.status, 200)
        d1 = await r1.json()
        self.assertEqual(d1["overlayShapes"].get("gamer_victory"), "gamer_hex_shield")

        # 2. Restaurar estilo con shapeId = 'original' (acción del botón '↺ Restaurar Estilo')
        r2 = await self.client.post("/api/themes/overlay-assignment", json={
            "overlayKey": "gamer_victory",
            "themeId": "golden_glory",
            "shapeId": "original"
        }, headers=self.headers)
        self.assertEqual(r2.status, 200)
        d2 = await r2.json()
        self.assertEqual(d2["shapeId"], "original")
        self.assertEqual(d2["overlayShapes"].get("gamer_victory"), "original")

        # 3. Restablecer con shapeId = 'auto' o JSON null (elimina forma forzada)
        r3 = await self.client.post("/api/themes/overlay-assignment", json={
            "overlayKey": "gamer_victory",
            "shapeId": "auto"
        }, headers=self.headers)
        self.assertEqual(r3.status, 200)
        d3 = await r3.json()
        self.assertNotIn("gamer_victory", d3["overlayShapes"])

        # Probar con JSON null explícito
        r3b = await self.client.post("/api/themes/overlay-assignment", json={
            "overlayKey": "gamer_victory",
            "shapeId": None
        }, headers=self.headers)
        self.assertEqual(r3b.status, 200)
        d3b = await r3b.json()
        self.assertNotIn("gamer_victory", d3b["overlayShapes"])

        # 4. Validaciones y casos de error
        # overlayKey vacío -> 400
        r_err1 = await self.client.post("/api/themes/overlay-assignment", json={
            "overlayKey": "  ",
            "themeId": "maker"
        }, headers=self.headers)
        self.assertEqual(r_err1.status, 400)

        # ni themeId ni shapeId -> 400
        r_err2 = await self.client.post("/api/themes/overlay-assignment", json={
            "overlayKey": "gamer_victory"
        }, headers=self.headers)
        self.assertEqual(r_err2.status, 400)

        # JSON inválido -> 400
        r_err3 = await self.client.post("/api/themes/overlay-assignment", data="bad-json", headers=self.headers)
        self.assertEqual(r_err3.status, 400)

if __name__ == "__main__":
    unittest.main()

