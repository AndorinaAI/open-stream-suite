"""Regresión de V3-04: leer el catálogo de temas no debe reescribir CSS.

`GET /api/themes/packs` → `get_all_packs_and_themes()` → `init_themes_directory()`
terminaba llamando a `sync_common_themes_css()` en **cada** petición, reescribiendo
`common/themes.css` aunque no hubiera cambios (efecto lateral en un GET).
"""
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from server.services import theme_manager
from server.services.theme_manager import COMMON_THEMES_CSS, get_all_packs_and_themes


def file_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class TestReadsDoNotRewriteThemesCss(unittest.TestCase):
    def test_reads_do_not_sync_when_css_is_fresh(self):
        before_hash = file_hash(COMMON_THEMES_CSS)
        before_mtime = COMMON_THEMES_CSS.stat().st_mtime
        with patch.object(theme_manager, "themes_css_is_stale", return_value=False), \
             patch.object(theme_manager, "sync_common_themes_css") as sync:
            for _ in range(3):
                get_all_packs_and_themes()
            sync.assert_not_called()
        self.assertEqual(before_hash, file_hash(COMMON_THEMES_CSS))
        self.assertEqual(before_mtime, COMMON_THEMES_CSS.stat().st_mtime, "el GET no debe tocar el fichero")

    def test_stale_css_is_recompiled(self):
        with patch.object(theme_manager, "themes_css_is_stale", return_value=True), \
             patch.object(theme_manager, "sync_common_themes_css") as sync:
            get_all_packs_and_themes()
            sync.assert_called()

    def test_staleness_detection(self):
        with tempfile.TemporaryDirectory() as td:
            missing = Path(td) / "themes.css"
            with patch.object(theme_manager, "COMMON_THEMES_CSS", missing):
                self.assertTrue(theme_manager.themes_css_is_stale())

    def test_recompiled_css_is_deterministic(self):
        before = file_hash(COMMON_THEMES_CSS)
        theme_manager.sync_common_themes_css()
        self.assertEqual(before, file_hash(COMMON_THEMES_CSS))
        self.assertFalse(theme_manager.themes_css_is_stale(), "tras recompilar no debe estar desfasado")

    def test_bootstrap_runs_once_per_process(self):
        with patch.object(theme_manager, "_THEMES_INITIALISED", False):
            self.assertTrue(theme_manager.init_themes_directory())
            self.assertFalse(theme_manager.init_themes_directory(), "el bootstrap no debe repetirse")


if __name__ == "__main__":
    unittest.main()
