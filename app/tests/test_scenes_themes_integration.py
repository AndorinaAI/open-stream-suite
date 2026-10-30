"""T4 — Pruebas de integración escenas <-> temas.

Cubre los defectos reales encontrados y corregidos:
  1. /scenes/<clave>/index.html daba 404 en 21 de las 27 escenas (mapa kebab
     escrito a mano) y en todas las variantes camelCase / con subcarpeta.
  2. Claves de escena inconsistentes (camelCase vs kebab vs snake): se aceptan
     todas como alias y se persiste SIEMPRE la clave canónica.
  3. Estado con claves huérfanas ('starting', 'maker', 'print') que rompían la
     sincronización escena<->tema.
  4. aplicaciones de tema rotas: la validación anterior usaba rutas relativas y
     rechazaba packs válidos (POST /api/themes/apply -> 400).
  5. Fusiones: claves no canónicas y escenas desconocidas.
"""
import json
import re
import unittest
from pathlib import Path

from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop

from server.app import create_app, LOCAL_AUTH_TOKEN
from server.config import BASE_DIR
from server.routes.static_routes import resolve_legacy_scene
from server.services import components_catalog, scenes_catalog
from server.services.fusions_service import FUSIONS_FILE, load_fusions, save_fusions
from server.services.theme_manager import THEMES_STATE_FILE, load_theme_state, save_theme_state, migrate_theme_state
from server.services.theme_defaults import DEFAULT_OVERLAY_THEMES
from server.services.validation_utils import (
    is_valid_pack_id,
    is_valid_theme_id,
    is_valid_scene_key,
    is_valid_shape_id,
)

SCENES_JS = BASE_DIR / "alerts" / "js" / "themes" / "05-scenes-data.js"
STATE_JS = BASE_DIR / "alerts" / "js" / "themes" / "01-state.js"


class CatalogSyncTestCase(unittest.TestCase):
    """El catálogo backend NO puede desincronizarse del panel."""

    def test_catalog_matches_panel_scene_keys(self):
        js = SCENES_JS.read_text(encoding="utf-8")
        keys_js = re.findall(r"key:\s*'([^']+)'", js)
        self.assertEqual(
            sorted(keys_js),
            sorted(scenes_catalog.canonical_scene_keys()),
            "app/scenes.json está desincronizado: ejecuta python3 scripts/build_scenes_json.py",
        )

    def test_default_themes_have_only_canonical_scene_keys(self):
        canonical = set(scenes_catalog.canonical_scene_keys())
        self.assertEqual(set(DEFAULT_OVERLAY_THEMES), canonical,
                         "DEFAULT_OVERLAY_THEMES contiene claves que no son escenas")
        # L1: la fuente única es theme_defaults.py y el panel la recibe en
        # config.defaultOverlayThemes; 01-state.js ya no duplica el mapa.
        js = STATE_JS.read_text(encoding="utf-8")
        self.assertIn("defaultOverlayThemes", js)
        self.assertIn("window.OSS_CONFIG", js)

    def test_every_scene_path_exists_on_disk(self):
        missing = [s["key"] for s in scenes_catalog.get_scenes()
                   if not (BASE_DIR / s["path"].lstrip("/")).is_file()]
        self.assertEqual(missing, [], f"rutas de escena inexistentes: {missing}")


class SceneKeyNormalizationTestCase(unittest.TestCase):
    def test_accepts_every_convention(self):
        cases = {
            "maker-desk": "maker-desk",
            "maker_desk": "maker-desk",
            "maker/desk": "maker-desk",
            "desk": "maker-desk",
            "startingSoon": "startingSoon",
            "starting-soon": "startingSoon",
            "screens/starting-soon": "startingSoon",
            "beRightBack": "beRightBack",
            "be-right-back": "beRightBack",
            "oss_chatting": "oss_chatting",
            "oss-chatting": "oss_chatting",
            "just_chatting": "oss_chatting",
            "cozy_brb": "cozy_brb",
            "coffee-break": "cozy_brb",
        }
        for raw, expected in cases.items():
            self.assertEqual(scenes_catalog.normalize_scene_key(raw), expected, raw)
            self.assertTrue(is_valid_scene_key(raw), raw)

    def test_rejects_unknown_keys(self):
        for raw in ("starting", "no-existe-esta-escena", "maker", "print", "", "  "):
            self.assertIsNone(scenes_catalog.normalize_scene_key(raw), raw)
            self.assertFalse(is_valid_scene_key(raw), raw)

    def test_legacy_redirect_targets_existing_files(self):
        for scene in scenes_catalog.get_scenes():
            for raw in [scene["key"]] + scene["aliases"]:
                target = resolve_legacy_scene(raw)
                self.assertIsNotNone(target, f"sin destino para {raw}")
                assert target is not None
                if target.startswith("/overlays/"):
                    # /overlays/ está montado en Maker_Theme_Pack/overlays
                    disk = (BASE_DIR / "streamthemes" / "Maker_Theme_Pack" / "overlays"
                            / target[len("/overlays/"):])
                else:
                    disk = BASE_DIR / target.lstrip("/")
                self.assertTrue(disk.is_file(), f"{raw} -> {target} no existe en disco")


class ValidationMigrationTestCase(unittest.TestCase):
    def test_pack_and_theme_validation_uses_absolute_paths(self):
        # Regresión: STREAMTHEMES_DIR relativo al cwd hacía fallar todo
        self.assertTrue(is_valid_pack_id("Maker_Theme_Pack"))
        self.assertTrue(is_valid_theme_id("Maker_Theme_Pack", "maker"))
        self.assertTrue(is_valid_theme_id(None, "neon_streamer"))
        self.assertFalse(is_valid_pack_id("No_Existe"))
        self.assertFalse(is_valid_theme_id("Maker_Theme_Pack", "tema_fantasma"))

    def test_shape_validation_uses_pack_json(self):
        self.assertTrue(is_valid_shape_id("auto"))
        self.assertTrue(is_valid_shape_id("original"))
        self.assertFalse(is_valid_shape_id("forma_inventada"))

    def test_migration_drops_orphan_and_renames_alias_keys(self):
        state = {
            "overlayThemes": {"starting": "ambient", "maker": "maker", "maker_desk": "terminal", "oss_chatting": "neon_streamer"},
            "overlayShapes": {"starting": "fantasy_parchment", "desk": "maker_blueprint"},
            "backdrops": {"no-existe": {"a": 1}, "cozy_art": {"b": 2}},
        }
        report = migrate_theme_state(state)
        self.assertIn("starting", report["dropped_themes"])
        self.assertIn("maker", report["dropped_themes"])
        self.assertEqual(state["overlayThemes"].get("maker-desk"), "terminal")
        self.assertEqual(set(state["overlayThemes"]), {"maker-desk", "oss_chatting"})
        self.assertEqual(set(state["overlayShapes"]), {"maker-desk"})
        self.assertEqual(set(state["backdrops"]), {"cozy_art"})
        self.assertIn("maker_desk", report["renamed"])

    def test_load_state_migrates_file_on_disk(self):
        backup = THEMES_STATE_FILE.read_text(encoding="utf-8") if THEMES_STATE_FILE.exists() else None
        try:
            THEMES_STATE_FILE.write_text(json.dumps({
                "activePack": "Maker_Theme_Pack", "activeTheme": "maker",
                "overlayThemes": {"starting": "ambient"}, "overlayShapes": {"starting": "fantasy_parchment"},
            }), encoding="utf-8")
            state = load_theme_state()
            self.assertNotIn("starting", state["overlayThemes"])
            self.assertNotIn("maker", state["overlayThemes"])
            self.assertIn("maker-desk", state["overlayThemes"])
            # y al guardar, la limpieza queda persistida
            save_theme_state(state)
            on_disk = json.loads(THEMES_STATE_FILE.read_text(encoding="utf-8"))
            self.assertNotIn("starting", on_disk["overlayThemes"])
            self.assertNotIn("starting", on_disk.get("overlayShapes", {}))
        finally:
            if backup is not None:
                THEMES_STATE_FILE.write_text(backup, encoding="utf-8")


class ScenesThemesAPITestCase(AioHTTPTestCase):
    async def get_application(self):
        return create_app()

    def setUp(self):
        super().setUp()
        self.headers = {"X-Local-Token": LOCAL_AUTH_TOKEN, "Content-Type": "application/json"}
        self.state_backup = THEMES_STATE_FILE.read_text(encoding="utf-8") if THEMES_STATE_FILE.exists() else None
        self.fusions_backup = FUSIONS_FILE.read_text(encoding="utf-8") if FUSIONS_FILE.exists() else None
        self.config_backup = (BASE_DIR / "config.js").read_text(encoding="utf-8") if (BASE_DIR / "config.js").exists() else None

    def tearDown(self):
        super().tearDown()
        if self.state_backup is not None:
            THEMES_STATE_FILE.write_text(self.state_backup, encoding="utf-8")
        if self.fusions_backup is not None:
            FUSIONS_FILE.write_text(self.fusions_backup, encoding="utf-8")
        if self.config_backup is not None:
            (BASE_DIR / "config.js").write_text(self.config_backup, encoding="utf-8")

    # --- 1. rutas heredadas de escena ---
    @unittest_run_loop
    async def test_01_all_scenes_and_aliases_resolve(self):
        raw_keys = []
        for scene in scenes_catalog.get_scenes():
            raw_keys += [scene["key"]] + scene["aliases"]
        broken = []
        for raw in raw_keys:
            resp = await self.client.get(f"/scenes/{raw}/index.html", allow_redirects=False)
            if resp.status != 302:
                broken.append((raw, resp.status))
                continue
            final = await self.client.get(resp.headers["Location"])
            if final.status != 200:
                broken.append((raw, final.status))
        self.assertEqual(broken, [], f"rutas heredadas rotas: {broken}")

    @unittest_run_loop
    async def test_02_unknown_scene_is_404(self):
        resp = await self.client.get("/scenes/no-existe-esta-escena/index.html", allow_redirects=False)
        self.assertEqual(resp.status, 404)

    # --- 2/3. asignación de tema por escena: aliases, validación y estado ---
    @unittest_run_loop
    async def test_03_assign_theme_normalizes_alias_key(self):
        resp = await self.client.post("/api/themes/overlay-assignment",
                                      json={"overlayKey": "screens/starting-soon", "themeId": "synthwave"},
                                      headers=self.headers)
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        self.assertEqual(data["overlayKey"], "startingSoon")
        self.assertEqual(data["overlayThemes"]["startingSoon"], "synthwave")

    @unittest_run_loop
    async def test_04_assign_theme_rejects_unknown_scene_and_theme(self):
        r1 = await self.client.post("/api/themes/overlay-assignment",
                                    json={"overlayKey": "no-existe-esta-escena", "themeId": "maker"},
                                    headers=self.headers)
        self.assertEqual(r1.status, 400)
        r2 = await self.client.post("/api/themes/overlay-assignment",
                                    json={"overlayKey": "maker-desk", "themeId": "tema_fantasma"},
                                    headers=self.headers)
        self.assertEqual(r2.status, 400)
        r3 = await self.client.post("/api/themes/overlay-assignment",
                                    json={"overlayKey": "maker-desk", "shapeId": "forma_inventada"},
                                    headers=self.headers)
        self.assertEqual(r3.status, 400)

    @unittest_run_loop
    async def test_05_apply_theme_to_pack_still_works(self):
        """Regresión: la validación con rutas relativas devolvía 400 aquí."""
        resp = await self.client.post("/api/themes/apply",
                                      json={"pack": "Maker_Theme_Pack", "theme": "maker"},
                                      headers=self.headers)
        self.assertEqual(resp.status, 200, await resp.text())

    @unittest_run_loop
    async def test_06_state_has_no_orphan_keys_after_api_use(self):
        await self.client.get("/api/themes/packs")
        resp = await self.client.post("/api/themes/overlay-assignment",
                                      json={"overlayKey": "cozy_brb", "themeId": "latte_caramel"},
                                      headers=self.headers)
        self.assertEqual(resp.status, 200)
        on_disk = json.loads(THEMES_STATE_FILE.read_text(encoding="utf-8"))
        canonical = set(scenes_catalog.canonical_scene_keys())

        def _valid(key):
            """Escena canonica O componente (widget/alert) con formato kind:id.

            Desde que existe la asignacion por componente (`overlay-assignment`
            acepta `widget:chat`/`alert:card`), el estado guarda claves que no
            son escenas y NO son huerfanas.
            """
            return key in canonical or bool(components_catalog.parse_key(key))

        self.assertEqual({k for k in on_disk["overlayThemes"] if not _valid(k)}, set())
        self.assertEqual({k for k in on_disk.get("overlayShapes", {}) if not _valid(k)}, set())

    # --- 5. fusiones ---
    @unittest_run_loop
    async def test_07_fusion_normalizes_and_reports_unknown_scenes(self):
        payload = {
            "name": "Fusion T4 alias",
            "scenes": ["maker/desk", "screens/starting-soon", "no-existe-esta-escena", "maker-desk"],
        }
        resp = await self.client.post("/api/fusions", json=payload, headers=self.headers)
        self.assertEqual(resp.status, 200, await resp.text())
        data = await resp.json()
        fusion = data.get("fusion") or {}
        self.assertEqual(sorted(fusion.get("scenes", [])), ["maker-desk", "startingSoon"])
        self.assertEqual(fusion.get("unknownScenes"), ["no-existe-esta-escena"])
        # limpiar
        await self.client.delete(f"/api/fusions/{fusion['id']}", headers=self.headers)

    @unittest_run_loop
    async def test_08_fusion_batch_theme_applies_canonical_keys(self):
        resp = await self.client.post("/api/fusions", json={"name": "Fusion batch T4", "scenes": ["maker-desk", "cozy_brb"]},
                                      headers=self.headers)
        fusion_id = (await resp.json())["fusion"]["id"]
        applied = await self.client.post(f"/api/fusions/{fusion_id}/apply-theme",
                                         json={"themeId": "neon_streamer"}, headers=self.headers)
        self.assertEqual(applied.status, 200, await applied.text())
        data = await applied.json()
        self.assertEqual(sorted(data.get("appliedScenes", [])), ["cozy_brb", "maker-desk"])
        on_disk = json.loads(THEMES_STATE_FILE.read_text(encoding="utf-8"))
        self.assertEqual(on_disk["overlayThemes"]["cozy_brb"], "neon_streamer")
        await self.client.delete(f"/api/fusions/{fusion_id}", headers=self.headers)


if __name__ == "__main__":
    unittest.main(verbosity=2)
