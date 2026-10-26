#!/usr/bin/env python3
"""Tests de `server.services.validation_utils` y del catálogo único de escenas (T4).

Sustituye al test heredado de `tests/test_validation_utils.py`, que no podía
ejecutarse (importaba `app.server...` sin poner `app/` en el path) y afirmaba un
contrato INVENTADO: claves de escena que no existen (`maker`, `print`, `screens`,
`gamer`, `podcast`) y formas físicas que ningún `pack.json` declara (`rounded`,
`soft_card`, `scifi`, `hexagon`, …). Al no poder ejecutarse, nunca falló.

Lo que se comprueba aquí es el contrato real:
  * packs/temas/formas se validan contra el contenido de `streamthemes/`;
  * toda forma conocida de clave de escena (canónica, kebab↔snake, ruta
    `maker/desk`, segmento de carpeta `desk`) resuelve a la clave canónica;
  * las claves desconocidas se rechazan (antes contaminaban el estado).

Ejecutar:  cd app && ./venv/bin/python -m pytest tests/test_validation_utils.py -q
"""
import json
import unittest
from pathlib import Path

from server.config import BASE_DIR
from server.services import scenes_catalog
from server.services.validation_utils import (
    is_valid_pack_id,
    is_valid_theme_id,
    is_valid_scene_key,
    is_valid_shape_id,
    normalize_scene_key,
    SPECIAL_SHAPE_IDS,
)

PACKS = ("Maker_Theme_Pack", "Gamer_Pro_Pack", "Open_stream_Pack", "Cozy_LoFi_Pack")


class TestValidationUtils(unittest.TestCase):

    def test_pack_ids(self):
        for pack in PACKS:
            self.assertTrue(is_valid_pack_id(pack), f"pack válido rechazado: {pack}")
        for invalid in ("", "Invalid_Pack", "../app", "Maker_Theme_Pack/../.."):
            self.assertFalse(is_valid_pack_id(invalid), f"pack inválido aceptado: {invalid!r}")
        self.assertFalse(is_valid_pack_id(None))  # type: ignore[arg-type]

    def test_theme_ids(self):
        self.assertTrue(is_valid_theme_id("Maker_Theme_Pack", "maker"))
        self.assertTrue(is_valid_theme_id("Maker_Theme_Pack", "chill"))
        self.assertTrue(is_valid_theme_id("Gamer_Pro_Pack", "cyber_glitch"))
        self.assertTrue(is_valid_theme_id("Open_stream_Pack", "emerald_matrix"))
        # Sin pack: vale si existe en cualquier pack (comportamiento documentado)
        self.assertTrue(is_valid_theme_id(theme_id="synthwave"))
        self.assertTrue(is_valid_theme_id("", "maker"))
        self.assertTrue(is_valid_theme_id(None, "maker"))  # type: ignore[arg-type]
        # Compatibilidad con la firma antigua is_valid_theme_id(theme_id)
        self.assertTrue(is_valid_theme_id("maker"))

        self.assertFalse(is_valid_theme_id("Maker_Theme_Pack", ""))
        self.assertFalse(is_valid_theme_id("Maker_Theme_Pack", "invalid_theme"))
        self.assertFalse(is_valid_theme_id("Invalid_Pack", "maker"))
        self.assertFalse(is_valid_theme_id("Maker_Theme_Pack", "no-existe-este-tema"))

    def test_scene_keys_canonicos(self):
        catalog = json.loads((BASE_DIR / "scenes.json").read_text(encoding="utf-8"))
        keys = [s["key"] for s in catalog["scenes"]]
        self.assertEqual(len(keys), catalog["scene_count"])
        for key in keys:
            self.assertTrue(is_valid_scene_key(key), f"clave canónica rechazada: {key}")
            self.assertEqual(normalize_scene_key(key), key)

        for invalid in ("", "invalid_scene", "no-existe-esta-escena", "starting"):
            self.assertFalse(is_valid_scene_key(invalid), f"clave inválida aceptada: {invalid!r}")
            self.assertIsNone(normalize_scene_key(invalid))
        self.assertFalse(is_valid_scene_key(None))  # type: ignore[arg-type]
        self.assertIsNone(normalize_scene_key(None))  # type: ignore[arg-type]

    def test_aliases_resuelven_a_la_canonica(self):
        """Las tres familias de alias documentadas (kebab↔snake, ruta y carpeta)."""
        casos = {
            "starting-soon": "startingSoon",
            "starting_soon": "startingSoon",
            "screens/starting-soon": "startingSoon",
            "be-right-back": "beRightBack",
            "maker_desk": "maker-desk",
            "maker/desk": "maker-desk",
            "desk": "maker-desk",
            "just_chatting": "oss_chatting",
            "just-chatting": "oss_chatting",
            "gameplay_hud": "gamer_gameplay",
            "speedrun_split": "gamer_speedrun",
            "victory_clutch": "gamer_victory",
            "coffee-break": "cozy_brb",
        }
        for alias, canonical in casos.items():
            self.assertTrue(is_valid_scene_key(alias), f"alias rechazado: {alias}")
            self.assertEqual(normalize_scene_key(alias), canonical, f"alias mal resuelto: {alias}")

    def test_alias_map_completo_y_sin_huerfanos(self):
        """Todo alias del catálogo apunta a una escena real y `scenes_catalog` lo sabe."""
        catalog = json.loads((BASE_DIR / "scenes.json").read_text(encoding="utf-8"))
        keys = {s["key"] for s in catalog["scenes"]}
        for alias, target in catalog["alias_map"].items():
            self.assertIn(target, keys, f"alias huérfano: {alias} → {target}")
            self.assertEqual(normalize_scene_key(alias), target)
            self.assertTrue(is_valid_scene_key(alias))
        for key in keys:
            self.assertIn(key, catalog["alias_map"])

    def test_default_themes_solo_claves_canonicas(self):
        catalog = json.loads((BASE_DIR / "scenes.json").read_text(encoding="utf-8"))
        keys = {s["key"] for s in catalog["scenes"]}
        self.assertEqual(set(catalog["default_themes"]), keys)
        # 'maker' y 'print' son secciones de textos, no escenas: no pueden estar aquí
        self.assertNotIn("maker", catalog["default_themes"])
        self.assertNotIn("print", catalog["default_themes"])

    def test_shape_ids(self):
        pack_json = json.loads(
            (BASE_DIR / "streamthemes" / "Gamer_Pro_Pack" / "pack.json").read_text(encoding="utf-8")
        )
        reales = [s["id"] if isinstance(s, dict) else s for s in pack_json.get("shapes", [])]
        self.assertTrue(reales, "Gamer_Pro_Pack no declara formas físicas")
        for shape in reales:
            self.assertTrue(is_valid_shape_id(shape), f"forma real rechazada: {shape}")
        for special in SPECIAL_SHAPE_IDS:
            self.assertTrue(is_valid_shape_id(special), f"valor especial rechazado: {special}")
        for invalid in ("", "invalid_shape", "forma_inventada"):
            self.assertFalse(is_valid_shape_id(invalid), f"forma inválida aceptada: {invalid!r}")
        self.assertFalse(is_valid_shape_id(None))  # type: ignore[arg-type]

    def test_catalogo_generado_y_sincronizado(self):
        """`scenes.json` no puede quedar desincronizado de 05-scenes-data.js."""
        import subprocess
        import sys
        script = Path(BASE_DIR).parent / "scripts" / "build_scenes_json.py"
        if not script.is_file():
            self.skipTest("scripts/build_scenes_json.py no disponible")
        proc = subprocess.run([sys.executable, str(script), "--check"], capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_normalize_es_idempotente_y_case_insensitive_tolerante(self):
        for form in ("startingSoon", "starting-soon", "starting_soon", "screens/starting-soon"):
            canonical = normalize_scene_key(form)
            self.assertEqual(normalize_scene_key(canonical), canonical)


if __name__ == "__main__":
    unittest.main()
