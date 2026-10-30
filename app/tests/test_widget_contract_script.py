"""Contrato de widget: el script de CI y la guía deben existir y pasar."""

import unittest
from pathlib import Path

from server.config import BASE_DIR

APP = Path(BASE_DIR)


class WidgetContractScriptTest(unittest.TestCase):
    def test_every_widget_passes(self):
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "check_widget_contract", APP / "scripts/check_widget_contract.py"
        )
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)

        for path in sorted(mod.WIDGETS_DIR.iterdir()):
            if not path.is_dir() or path.is_symlink():
                continue
            self.assertEqual(mod.check_widget(path), [],
                             f"{path.name} no cumple el contrato de widget")

    def test_guide_exists(self):
        guide = APP / "docs/GUIA_NUEVO_WIDGET.md"
        self.assertTrue(guide.exists(), "falta la guía de widgets")
        text = guide.read_text(encoding="utf-8")
        for token in ("data-oss-panel", "data-oss-shape-target", "WidgetModules"):
            self.assertIn(token, text, f"la guía no menciona {token}")


if __name__ == "__main__":
    unittest.main()
