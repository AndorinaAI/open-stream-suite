#!/usr/bin/env python3
"""Contrato del generador de CSS de temas (`theme_render`).

Garantiza lo que hacia imposible tocar un tema sin romper otro:

  * el CSS es DETERMINISTA (dos renders = mismo hash);
  * contiene el contrato completo de tokens;
  * **conserva los colores del pack** (el bug real: el editor metia los grises
    del maker en cualquier tema);
  * `cssExtra` se concatena sin perder nada;
  * el CSS enviado por la UI se descompone en `tokens` + `cssExtra`.
"""
import hashlib
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

from server.services import theme_render as R  # noqa: E402


def _spec(**kw):
    base = {
        "id": "demo",
        "colors": {
            "bgDark": "#181825",
            "textLight": "#CDD6F4",
            "accentCyan": "#89B4FA",
            "accentOrange": "#CBA6F7",
            "panelBg": "#313244",
            "textDim": "#A6ADC8",
        },
        "tokens": {
            "--theme-glow": "0 0 14px rgba(137, 180, 250, 0.4)",
            "--frame-radius": "8px",
            "--frame-border-width": "1.5px",
            "--frame-border-style": "solid",
            "--frame-clip-path": "none",
            "--frame-shadow": "none",
            "--frame-corner-display": "none",
            "--panel-radius": "8px",
            "--panel-clip-path": "none",
            "--panel-backdrop": "blur(12px)",
            "--panel-shadow": "none",
            "--badge-radius": "6px",
            "--badge-clip-path": "none",
            "--header-radius": "6px",
            "--header-clip-path": "none",
            "--color-border-cyan": "rgba(137, 180, 250, 0.4)",
            "--color-border-cyan-bright": "#89B4FA",
        },
    }
    base.update(kw)
    return R.spec_from_meta(base)


class TestThemeRenderContract(unittest.TestCase):
    def test_1_es_determinista(self):
        spec = _spec()
        self.assertEqual(R.css_hash(R.render_theme_css(spec)),
                         R.css_hash(R.render_theme_css(spec)))

    def test_2_contiene_el_contrato_completo(self):
        css = R.render_theme_css(_spec())
        for token in R.REQUIRED_TOKENS:
            self.assertIn(f"{token}:", css, f"falta {token}")
        self.assertEqual([], R.validate_rendered_css(css, _spec()))

    def test_3_conserva_los_colores_del_pack(self):
        """El bug original: el panel pintaba todo tema con el gris del maker."""
        css = R.render_theme_css(_spec())
        self.assertIn("--color-bg-dark: #181825;", css)
        self.assertIn("--color-accent-cyan: #89B4FA;", css)
        self.assertNotIn("#2E363B", css.split("}")[0], "no debe meter el gris del maker")

    def test_4_css_extra_se_concatena(self):
        css = R.render_theme_css(_spec(cssExtra="@keyframes x { from { opacity: 0 } }"))
        self.assertIn("@keyframes x", css)
        self.assertTrue(css.rstrip().endswith("}"))

    def test_5_el_css_de_la_ui_se_descompone_en_tokens(self):
        incoming = (
            'body[data-theme="demo"] {\n'
            "  --color-bg-dark: #101010;\n"
            "  --color-accent-cyan: #FF0000;\n"
            "}\n"
            "@keyframes pulso { from { opacity: 0 } }"
        )
        tokens, extra = R.tokens_from_css(incoming, "demo")
        self.assertEqual("#101010", tokens["--color-bg-dark"])
        self.assertEqual("#FF0000", tokens["--color-accent-cyan"])
        self.assertIn("@keyframes pulso", extra)

    def test_6_rechaza_css_peligroso(self):
        spec = _spec(cssExtra="@import url('http://evil/x.css');")
        problems = R.validate_rendered_css(R.render_theme_css(spec), spec)
        self.assertTrue(any("@import" in p for p in problems))

    def test_7_los_21_temas_reproducen_su_css(self):
        pending = R.regenerate_all_themes(check=True)
        self.assertEqual({}, pending,
                         "hay temas cuyo style.css no sale de su theme.json: "
                         + repr(pending))
        self.assertGreaterEqual(len(R.theme_dirs()), 20)


    def test_8_el_preview_devuelve_el_css_real(self):
        """El editor del panel previsualiza el CSS que se va a guardar.

        Antes la vista previa la generaba el JS con literales (el bug que
        pintaba los grises del maker en cualquier tema). Ahora sale del mismo
        generador que escribe el fichero.
        """
        meta = {
            "id": "demo", "packId": "Demo_Pack", "archetype": "cozy",
            "bgDark": "#181825", "accentCyan": "#89B4FA",
            "glowIntensity": 40, "borderStyle": "rounded",
            "tokens": {"--color-panel-bg": "#313244", "--color-text-dim": "#A6ADC8",
                       "--theme-glow": "none", "--frame-radius": "8px",
                       "--frame-border-width": "1.5px", "--frame-border-style": "solid",
                       "--frame-clip-path": "none", "--frame-shadow": "none",
                       "--frame-corner-display": "none", "--panel-radius": "8px",
                       "--panel-clip-path": "none", "--panel-backdrop": "blur(12px)",
                       "--panel-shadow": "none", "--badge-radius": "6px",
                       "--badge-clip-path": "none", "--header-radius": "6px",
                       "--header-clip-path": "none",
                       "--color-border-cyan": "#89B4FA66", "--color-border-cyan-bright": "#89B4FA"},
        }
        css = R.preview_css(meta)
        self.assertIn('body[data-theme="demo"]', css)
        self.assertIn("--color-bg-dark: #181825;", css)
        self.assertIn("--color-panel-bg: #313244;", css)
        for token in R.REQUIRED_TOKENS:
            self.assertIn(f"{token}:", css)

    def test_9_la_ruta_de_preview_existe(self):
        src = (APP / "server" / "routes" / "themes_routes.py").read_text(encoding="utf-8")
        self.assertIn("/api/themes/preview", src)
        self.assertIn("handle_preview_theme", src)


if __name__ == "__main__":
    unittest.main()
