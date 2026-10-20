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
        """Verifica que /api/themes/packs devuelva los packs modulares y los 6 temas del pack_open_stream_suite"""
        resp = await self.client.get("/api/themes/packs")
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("packs", data)

        pack_ids = [p["id"] for p in data["packs"]]
        self.assertIn("pack_open_stream_suite", pack_ids)

        taller_pack = next(p for p in data["packs"] if p["id"] == "pack_open_stream_suite")
        theme_ids = [t["id"] for t in taller_pack["themes"]]
        for expected in ("maker", "print", "terminal", "chill", "cyberpunk", "synthwave"):
            self.assertIn(expected, theme_ids)

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
        # Modificar el tema 'maker'
        theme_dir = THEMES_DIR / "pack_open_stream_suite" / "maker"
        self.assertTrue(theme_dir.exists())

        # Guardar una modificación
        custom_css = 'body[data-theme="maker"] { --color-accent-cyan: #123456; }'
        r1 = await self.client.post("/api/themes/save", json={
            "packId": "pack_open_stream_suite",
            "id": "maker",
            "css": custom_css,
            "accentCyan": "#123456"
        }, headers=self.headers)
        self.assertEqual(r1.status, 200)

        saved_css = (theme_dir / "style.css").read_text(encoding="utf-8")
        self.assertIn("#123456", saved_css)

        # Restaurar original vía API
        r2 = await self.client.post("/api/themes/restore", json={
            "packId": "pack_open_stream_suite",
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
        # Asignar tema 'arcade_8bit' a la overlay 'game'
        payload = {"overlayKey": "game", "themeId": "arcade_8bit"}
        r = await self.client.post("/api/themes/overlay-assignment", json=payload, headers=self.headers)
        self.assertEqual(r.status, 200)
        d = await r.json()
        self.assertEqual(d.get("status"), "ok")
        self.assertEqual(d.get("overlayThemes", {}).get("game"), "arcade_8bit")

        # Comprobar que /api/themes/packs incluye la asignación
        r_get = await self.client.get("/api/themes/packs")
        self.assertEqual(r_get.status, 200)
        d_get = await r_get.json()
        self.assertEqual(d_get.get("overlayThemes", {}).get("game"), "arcade_8bit")

if __name__ == "__main__":
    unittest.main()
