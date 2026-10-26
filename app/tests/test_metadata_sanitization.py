"""Regresión de V3-01/V3-06: metadatos que llegan a `innerHTML`.

La auditoría V3 reprodujo un XSS real: un tema con
`name = '<img src=x onerror=...>'` se guardaba por API y el panel lo ejecutaba
al renderizar el catálogo. Este módulo comprueba las tres mitades del arreglo:

1. La API rechaza el HTML antes de escribir en disco (`sanitize_metadata_text`).
2. Ningún dato de fábrica se rompe con esa regla (integridad del catálogo).
3. Los sinks del panel escapan siempre (contrato estático sobre el JS).

No escribe en los JSON ni en `common/themes.css` reales: mockea escritura y usa
un `streamthemes/` temporal.
"""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from server.config import BASE_DIR
from server.services import fusions_service, theme_service, validation_utils
from server.services.validation_utils import (
    METADATA_DESC_MAX,
    METADATA_NAME_MAX,
    sanitize_metadata_text,
)

XSS = '<img src=x onerror=window.__auditXss=1>'
JS_DIR = BASE_DIR / "alerts" / "js"


class TestSanitizeMetadataText(unittest.TestCase):
    def test_rejects_html_tags(self):
        for payload in (XSS, "<b>hola</b>", "a > b", "5 < 3"):
            with self.assertRaises(ValueError, msg=payload):
                sanitize_metadata_text(payload, "Nombre del tema", required=True)

    def test_rejects_html_in_all_metadata_fields(self):
        with self.assertRaises(ValueError):
            sanitize_metadata_text(XSS, "Badge del tema")
        with self.assertRaises(ValueError):
            sanitize_metadata_text(XSS, "Descripción del tema", max_length=METADATA_DESC_MAX)
        with self.assertRaises(ValueError):
            sanitize_metadata_text(XSS, "Icono", max_length=8)

    def test_strips_control_chars_and_collapses_spaces(self):
        cleaned = sanitize_metadata_text("  Tema\x00  de\n\nprueba\t ", "Nombre")
        self.assertEqual(cleaned, "Tema de prueba")

    def test_keeps_ampersands_accents_and_emoji(self):
        # Los packs de fábrica contienen '&' y acentos; deben pasar intactos.
        for value in ("Pack Cozy Lo-Fi & Arte", "Vúmetros estéreo", "⚡", "Chill & Relax (5 temas)"):
            self.assertEqual(sanitize_metadata_text(value, "Nombre"), value)

    def test_length_limit(self):
        self.assertEqual(len(sanitize_metadata_text("a" * METADATA_NAME_MAX, "Nombre")), METADATA_NAME_MAX)
        with self.assertRaises(ValueError):
            sanitize_metadata_text("a" * (METADATA_NAME_MAX + 1), "Nombre")

    def test_empty_value(self):
        with self.assertRaises(ValueError):
            sanitize_metadata_text("   ", "Nombre del tema", required=True)
        self.assertEqual(sanitize_metadata_text("", "Descripción", default="por defecto"), "por defecto")
        self.assertEqual(sanitize_metadata_text(None, "Icono", default="⚡"), "⚡")


class TestFactoryCatalogSurvivesRule(unittest.TestCase):
    """La regla no debe rechazar ningún nombre/badge/desc del catálogo real."""

    def test_every_factory_metadata_is_accepted_unchanged(self):
        streamthemes = BASE_DIR / "streamthemes"
        files = list(streamthemes.glob("*/pack.json")) + list(streamthemes.glob("*/styles/*/theme.json"))
        self.assertGreater(len(files), 20)
        checked = 0
        for path in files:
            data = json.loads(path.read_text(encoding="utf-8"))
            for key, max_len in (
                ("name", METADATA_NAME_MAX),
                ("badge", METADATA_NAME_MAX),
                ("description", METADATA_DESC_MAX),
                ("desc", METADATA_DESC_MAX),
                ("icon", 8),
            ):
                value = data.get(key)
                if not isinstance(value, str):
                    continue
                self.assertEqual(
                    sanitize_metadata_text(value, f"{path.name}:{key}", max_length=max_len),
                    value,
                    f"{path} → {key} se rompería con la nueva validación",
                )
                checked += 1
        self.assertGreater(checked, 50)


class TestServicesRejectHtmlMetadata(unittest.TestCase):
    def test_create_pack_rejects_html_and_creates_nothing(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            with patch.object(theme_service, "STREAMTHEMES_DIR", root):
                with self.assertRaises(ValueError):
                    theme_service.create_pack_service(name=XSS)
            self.assertEqual(list(root.iterdir()), [], "no debe crearse ningún pack con metadatos inválidos")

    def test_create_theme_rejects_html_before_touching_disk(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "Maker_Theme_Pack").mkdir()
            with patch.object(theme_service, "STREAMTHEMES_DIR", root), \
                 patch.object(validation_utils, "STREAMTHEMES_DIR", root), \
                 patch.object(theme_service, "sync_common_themes_css", lambda *a, **k: None):
                for body in ({"name": XSS}, {"name": "Tema Ok", "badge": XSS},
                             {"name": "Tema Ok", "desc": XSS}):
                    with self.assertRaises(ValueError, msg=repr(body)):
                        theme_service.create_theme_service(dict(body, packId="Maker_Theme_Pack"))
            self.assertFalse((root / "Maker_Theme_Pack" / "styles").exists())


class TestFusionMetadata(unittest.TestCase):
    def _patches(self):
        return (
            patch.object(fusions_service, "load_fusions", return_value=[]),
            patch.object(fusions_service, "save_fusions", return_value=True),
        )

    def test_rejects_html_in_fusion_metadata(self):
        p1, p2 = self._patches()
        base = {"name": "Fusión segura", "defaultTheme": "maker", "defaultShape": "original"}
        for override in ({"name": XSS}, {"icon": XSS}, {"description": XSS}):
            with p1, p2, self.assertRaises(ValueError, msg=repr(override)):
                fusions_service.create_or_update_fusion(dict(base, **override))

    def test_rejects_unsafe_fusion_id(self):
        p1, p2 = self._patches()
        with p1, p2, self.assertRaises(ValueError):
            fusions_service.create_or_update_fusion(
                {"id": "fusion_ok'); alert(1); //", "name": "Fusión", "defaultTheme": "maker",
                 "defaultShape": "original"}
            )

    def test_accepts_safe_fusion_and_keeps_ampersand(self):
        p1, p2 = self._patches()
        with p1, p2:
            fusion = fusions_service.create_or_update_fusion(
                {"id": "test_v3_fusion", "name": "Charla & Maker", "icon": "⚡",
                 "description": "Mix de packs", "defaultTheme": "maker", "defaultShape": "original"}
            )
        self.assertEqual(fusion["name"], "Charla & Maker")
        self.assertEqual(fusion["id"], "test_v3_fusion")


class TestPanelSinksAreEscaped(unittest.TestCase):
    """Contrato estático: ningún metadato de disco llega crudo a un innerHTML."""

    def _src(self, *parts):
        return JS_DIR.joinpath(*parts).read_text(encoding="utf-8")

    def test_component_themes_escapes_pack_and_theme_metadata(self):
        src = self._src("component-themes.js")
        for needle in ("esc(pack.name", "esc(pack.icon", "esc(name)", "esc(id)", "esc(e && e.message)"):
            self.assertIn(needle, src)
        self.assertNotIn("${name}</option>", src)

    def test_scene_card_and_modal_escape_theme_display_name(self):
        card = self._src("themes", "10-overlay-actions.js")
        self.assertIn("themeEscapeHtml(defaultName)", card)
        self.assertNotIn(".replace('{name}', defaultName)", card)

        modal = self._src("themes", "11-scene-editor.js")
        self.assertIn("themeEscapeHtml(defaultInfo.name)", modal)
        # Los hints que van a innerHTML nunca insertan el nombre crudo.
        self.assertNotIn("<b>${defaultInfo.name}</b>", modal)

    def test_fusion_icon_is_escaped(self):
        src = self._src("themes", "13-fusions.js")
        self.assertIn("escapeHtml(fusion.icon", src)
        self.assertNotIn("${fusion.icon", src)

    def test_fusion_ids_are_serialized_safely(self):
        # V3-06: el id va a `onclick="fn(...)"` y a `id="..."` → serializado.
        src = self._src("themes", "13-fusions.js")
        self.assertNotIn("('${fusion.id}')", src)
        self.assertIn("themeJsArg(fusion.id)", src)
        self.assertIn("themeEscapeHtml(fusion.id)", src)


if __name__ == "__main__":
    unittest.main()
