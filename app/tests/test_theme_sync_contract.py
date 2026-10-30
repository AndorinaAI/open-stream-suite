#!/usr/bin/env python3
"""Un tema = `theme.json`. Todo lo demas es derivado y debe cuadrar.

Comprueba la cadena completa:

    theme.json -> style.css -> common/themes.css
    theme.default.json -> style.default.css

Si alguien edita un derivado a mano (o deja la copia de fabrica atras), este
test falla y dice exactamente que tema y que fichero.
"""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

from server.services import theme_render as R  # noqa: E402
from server.services.theme_manager import sync_common_themes_css  # noqa: E402

THEMES_CSS = APP / "common" / "themes.css"


class TestThemeSyncContract(unittest.TestCase):
    def test_1_cada_theme_json_genera_su_style_css(self):
        offenders = {}
        for theme_dir in R.theme_dirs():
            meta_path = theme_dir / "theme.json"
            if not meta_path.is_file():
                continue
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            spec = R.spec_from_meta(meta, pack_id=theme_dir.parent.parent.name,
                                    theme_id=theme_dir.name)
            expected = R.render_theme_css(spec)
            actual = (theme_dir / "style.css").read_text(encoding="utf-8")
            if expected != actual:
                offenders[theme_dir.name] = "style.css no sale de theme.json"
        self.assertEqual({}, offenders, repr(offenders))

    def test_2_la_copia_de_fabrica_es_reproducible(self):
        offenders = {}
        for theme_dir in R.theme_dirs():
            factory_json = theme_dir / "theme.default.json"
            factory_css = theme_dir / "style.default.css"
            if not factory_json.is_file():
                continue
            meta = json.loads(factory_json.read_text(encoding="utf-8"))
            spec = R.spec_from_meta(meta, pack_id=theme_dir.parent.parent.name,
                                    theme_id=theme_dir.name)
            expected = R.render_theme_css(spec)
            if not factory_css.is_file() or factory_css.read_text(encoding="utf-8") != expected:
                offenders[theme_dir.name] = "style.default.css no sale de theme.default.json"
        self.assertEqual({}, offenders, repr(offenders))

    def test_3_themes_css_es_la_compilacion_de_los_style(self):
        before = THEMES_CSS.read_text(encoding="utf-8")
        sync_common_themes_css()
        after = THEMES_CSS.read_text(encoding="utf-8")
        self.assertEqual(before, after,
                         "common/themes.css estaba desfasado; ejecuta sync_common_themes_css()")

    def test_4_todo_tema_declara_archetype_y_tokens(self):
        missing = {}
        for theme_dir in R.theme_dirs():
            meta_path = theme_dir / "theme.json"
            if not meta_path.is_file():
                continue
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            problems = []
            if not meta.get("archetype"):
                problems.append("sin archetype")
            tokens = meta.get("tokens") or {}
            for token in R.REQUIRED_TOKENS:
                if token not in tokens:
                    problems.append(f"sin {token}")
            if problems:
                missing[theme_dir.name] = problems
        self.assertEqual({}, missing, repr(missing))


    def test_5_la_copia_de_fabrica_declara_archetype(self):
        """Si el default no lo declara, `restore` deja el tema sin `--skin-*`.

        Bug real: los 21 `theme.default.json` se migraron con `tokens` pero sin
        `archetype`; restaurar un tema lo dejaba sin familia de skin.
        """
        offenders = {}
        for theme_dir in R.theme_dirs():
            path = theme_dir / "theme.default.json"
            if not path.is_file():
                continue
            meta = json.loads(path.read_text(encoding="utf-8"))
            if not meta.get("archetype"):
                offenders[theme_dir.name] = "theme.default.json sin archetype"
        self.assertEqual({}, offenders, repr(offenders))

    def test_6_guardar_y_restaurar_conserva_archetype_y_tokens(self):
        """Ciclo completo de los botones Guardar / Restaurar del panel."""
        import asyncio

        from server.services import theme_service as T

        theme_dir = next(d for d in R.theme_dirs() if d.name == "chill")
        pack_id = theme_dir.parent.parent.name
        original = json.loads((theme_dir / "theme.json").read_text(encoding="utf-8"))

        asyncio.run(T.save_theme_service(dict(original, packId=pack_id, accentCyan="#AA00FF")))
        saved = json.loads((theme_dir / "theme.json").read_text(encoding="utf-8"))
        self.assertEqual("#AA00FF", saved["tokens"]["--color-accent-cyan"])
        self.assertEqual("maker", saved.get("archetype"))

        asyncio.run(T.restore_theme_service(pack_id, "chill"))
        restored = json.loads((theme_dir / "theme.json").read_text(encoding="utf-8"))
        self.assertEqual(original["tokens"]["--color-accent-cyan"],
                         restored["tokens"]["--color-accent-cyan"])
        self.assertEqual("maker", restored.get("archetype"),
                         "restaurar perdio el arquetipo")
        self.assertTrue(restored.get("tokens"), "restaurar perdio los tokens")


if __name__ == "__main__":
    unittest.main()
