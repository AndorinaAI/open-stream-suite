"""Las formas no imponen su paleta: el tema manda.

Regresion: `streamthemes/<Pack>/shapes.css` traia 218 colores literales
(`background`, `border`, `color`). Una forma de otro pack pisaba el tema, que es
el "se mezclan raro" que se veia en escenas.

Ahora cada color va envuelto: `var(--color-*, <literal de la forma>)`. El tema
gana; sin tema, la forma conserva su caracter.
"""
import importlib.util
import unittest
from pathlib import Path

from server.config import BASE_DIR

APP = Path(BASE_DIR)
SCRIPT = APP / "scripts/wrap_shape_colors.py"


def _load_script():
    spec = importlib.util.spec_from_file_location("wrap_shape_colors", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class ShapeColorsUseTokensContract(unittest.TestCase):
    def test_no_literal_colors_left(self):
        mod = _load_script()
        for path in mod.shape_files():
            left = mod.literals_left(path.read_text(encoding="utf-8"))
            self.assertEqual(
                left, 0,
                f"{path.parent.name}/shapes.css: {left} colores sin token del tema",
            )

    def test_generated_css_speaks_tokens(self):
        css = (APP / "common/generated/shapes.css").read_text(encoding="utf-8")
        self.assertGreater(
            css.count("var(--color-"), 100,
            "shapes.css generado deberia consumir los tokens de color del tema",
        )

    def test_wrapper_is_idempotent(self):
        mod = _load_script()
        sample = (
            "body[data-theme-shape=\"x\"] .foo {\n"
            "  background: #123456 !important;\n"
            "  color: #ABCDEF;\n"
            "  border: 2px solid #C4A47C !important;\n"
            "}\n"
        )
        once = mod.wrap_colors(sample)
        twice = mod.wrap_colors(once)
        self.assertEqual(once, twice, "no debe envolver dos veces")


if __name__ == "__main__":
    unittest.main()
