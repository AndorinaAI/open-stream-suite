import unittest
import io
from pathlib import Path
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from aiohttp import web, FormData

from server.config import MEDIA_DIR, LOCAL_AUTH_TOKEN
from server.routes.media_routes import (
    handle_list_media, handle_upload_media, handle_delete_media,
    handle_mkdir_media, handle_rename_media, handle_move_media, handle_copy_media
)

class MediaExplorerTestCase(AioHTTPTestCase):
    async def get_application(self):
        app = web.Application()
        app.router.add_get("/api/media", handle_list_media)
        app.router.add_post("/api/upload", handle_upload_media)
        app.router.add_post("/api/media/delete", handle_delete_media)
        app.router.add_post("/api/media/mkdir", handle_mkdir_media)
        app.router.add_post("/api/media/rename", handle_rename_media)
        app.router.add_post("/api/media/move", handle_move_media)
        app.router.add_post("/api/media/copy", handle_copy_media)
        return app

    def setUp(self):
        super().setUp()
        self.headers = {"X-Local-Token": LOCAL_AUTH_TOKEN, "Content-Type": "application/json"}

    @unittest_run_loop
    async def test_01_list_media_structure(self):
        """Verifica que /api/media devuelva estructura completa con files, folders, tree y stats"""
        resp = await self.client.get("/api/media")
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertIn("files", data)
        self.assertIn("folders", data)
        self.assertIn("tree", data)
        self.assertIn("stats", data)
        self.assertIn("videos", data["folders"])
        self.assertIn("sounds", data["folders"])
        self.assertIn("images", data["folders"])

    @unittest_run_loop
    async def test_02_auto_classify_upload(self):
        """Verifica que la subida auto-clasifique vídeos a videos/, audios a sounds/ e imágenes a images/"""
        fd = FormData()
        fd.add_field("file_0", b"FAKE_VIDEO_CONTENT", filename="meme_clip.mp4", content_type="video/mp4")
        fd.add_field("file_1", b"FAKE_AUDIO_CONTENT", filename="victory_sfx.wav", content_type="audio/wav")
        fd.add_field("file_2", b"FAKE_IMAGE_CONTENT", filename="badge_sub.png", content_type="image/png")

        resp = await self.client.post("/api/upload?auto_classify=true", data=fd)
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("/media/videos/meme_clip.mp4", data.get("destinations", []))
        self.assertIn("/media/sounds/victory_sfx.wav", data.get("destinations", []))
        self.assertIn("/media/images/badge_sub.png", data.get("destinations", []))

    @unittest_run_loop
    async def test_03_mkdir_rename_move_copy_delete(self):
        """Verifica el ciclo completo de explorador: crear carpeta, mover, renombrar, copiar y eliminar"""
        # 1. Crear carpeta 'test_folder'
        r1 = await self.client.post("/api/media/mkdir", json={"name": "test_folder", "parent": ""}, headers=self.headers)
        self.assertEqual(r1.status, 200)
        d1 = await r1.json()
        self.assertEqual(d1.get("status"), "ok")

        # 2. Mover 'videos/meme_clip.mp4' a 'test_folder'
        r2 = await self.client.post("/api/media/move", json={"sources": ["videos/meme_clip.mp4"], "target_folder": "test_folder"}, headers=self.headers)
        self.assertEqual(r2.status, 200)

        # 3. Renombrar en 'test_folder'
        r3 = await self.client.post("/api/media/rename", json={"path": "test_folder/meme_clip.mp4", "new_name": "renamed_clip.mp4"}, headers=self.headers)
        self.assertEqual(r3.status, 200)

        # 4. Copiar elemento
        r4 = await self.client.post("/api/media/copy", json={"sources": ["test_folder/renamed_clip.mp4"], "target_folder": "videos"}, headers=self.headers)
        self.assertEqual(r4.status, 200)

        # 5. Eliminar carpeta de test y copia
        r5 = await self.client.post("/api/media/delete", json={"paths": ["test_folder", "videos/renamed_clip.mp4", "sounds/victory_sfx.wav", "images/badge_sub.png"]}, headers=self.headers)
        self.assertEqual(r5.status, 200)

if __name__ == "__main__":
    unittest.main()
