"""Regresión: `?lang=` debe llegar de verdad a los textos de la escena.

El parámetro estaba documentado y la API ya servía `?lang=en`
(`load_overlay_texts`), pero `common/overlay.js` pedía `/api/overlays/texts`
**sin** el idioma, así que una escena abierta con `?lang=en` seguía mostrando los
textos en español (el pendiente lo describía como “`?lang=` inerte”).
"""
import unittest

from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop

from server.app import create_app
from server.config import BASE_DIR
from server.services.overlay_service import OVERLAY_TEXTS_FILE


class TestOverlayTextsLanguage(AioHTTPTestCase):
    async def get_application(self):
        return create_app()

    @unittest_run_loop
    async def test_english_texts_are_served_with_lang_en(self):
        spanish = (await (await self.client.get("/api/overlays/texts")).json())["texts"]
        english = (await (await self.client.get("/api/overlays/texts?lang=en")).json())["texts"]
        self.assertNotEqual(spanish, english)
        # Valores conocidos de cada catálogo (así se detecta si se sirviera el mismo).
        self.assertEqual(spanish["channel"]["tagline"], "JUGAR · CREAR · COMPARTIR")
        self.assertEqual(english["channel"]["tagline"], "PLAY · CREATE · SHARE")

    @unittest_run_loop
    async def test_unknown_language_falls_back_to_default(self):
        response = await self.client.get("/api/overlays/texts?lang=xx")
        self.assertEqual(response.status, 200)
        texts = (await response.json())["texts"]
        self.assertEqual(texts["channel"]["tagline"], "JUGAR · CREAR · COMPARTIR")

    def test_overlay_js_sends_the_language_to_the_api(self):
        source = (BASE_DIR / "common" / "overlay.js").read_text(encoding="utf-8")
        self.assertIn("api/overlays/texts?lang=", source)
        self.assertIn("function currentLang()", source)
        # El evento en vivo no debe revertir una escena en inglés.
        self.assertIn("syncTextsFromServer()", source)

    def test_english_catalog_exists(self):
        english = OVERLAY_TEXTS_FILE.with_name("overlay_texts_config.en.json")
        self.assertTrue(english.exists(), "falta overlay_texts_config.en.json")


if __name__ == "__main__":
    unittest.main()
