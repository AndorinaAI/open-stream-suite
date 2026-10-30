#!/usr/bin/env python3
"""Un pack nuevo se anade solo: manifiesto -> catalogo -> CSS generado.

Es la promesa de la Fase 3 del plan: publicar un pack son **3 ficheros**
(`pack.json`, `styles/<tema>/theme.json` + `style.css` y, si hace falta,
`shapes.css`). Sin tocar Python, ni el CSS comun, ni las listas del panel:

  * el pack entra en el catalogo que consumen backend y panel;
  * su forma fisica produce regla de componente (alerta / banner / widget);
  * su decoracion de escena se concatena tal cual (es CSS del pack);
  * el manifiesto valida sin problemas.

El test monta el pack en un directorio temporal y apunta el motor ahi, asi
que no toca `streamthemes/` ni los generados del repo.
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

from server.services import theme_engine  # noqa: E402


PACK = {
    "id": "Demo_New_Pack",
    "name": "Demo New Pack",
    "archetype": "cozy",
    "version": "0.0.1",
    "shapes": [
        {
            "id": "demo_sticker",
            "name": "Sticker Demo",
            "icon": "\u2605",
            "archetype": "cozy",
            "description": "Forma de prueba del contrato.",
            "geometry": {"panelRadius": "13px", "ornaments": ["tape"]},
        }
    ],
}

SCENE_CSS = (
    "/* escena del pack demo */\n"
    'body[data-theme-shape="demo_sticker"] {\n'
    "  outline: 1px solid red;\n"
    "}\n"
)


class TestThemeCatalogAuto(unittest.TestCase):
    """Un pack publicado aparece sin escribir codigo."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        root = Path(self._tmp.name)
        pack_dir = root / "Demo_New_Pack"
        (pack_dir / "styles" / "demo").mkdir(parents=True)
        (pack_dir / "pack.json").write_text(
            json.dumps(PACK, ensure_ascii=False), encoding="utf-8")
        (pack_dir / "styles" / "demo" / "theme.json").write_text(
            json.dumps({"id": "demo", "name": "Demo", "archetype": "cozy"}),
            encoding="utf-8")
        (pack_dir / "styles" / "demo" / "style.css").write_text("", encoding="utf-8")
        (pack_dir / "shapes.css").write_text(SCENE_CSS, encoding="utf-8")

        patcher = mock.patch.object(theme_engine, "STREAMTHEMES_DIR", root)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_pack_sin_codigo_aparece_en_el_catalogo(self):
        catalog = theme_engine.build_shape_catalog()
        ids = [shape["id"] for shape in catalog["shapes"]]
        self.assertIn("demo_sticker", ids, "el pack nuevo no llega al catalogo")
        entry = next(s for s in catalog["shapes"] if s["id"] == "demo_sticker")
        self.assertEqual("Demo_New_Pack", entry["packId"])
        self.assertEqual("13px", entry["geometry"]["panelRadius"])
        self.assertEqual(["tape"], entry["geometry"]["ornaments"])

    def test_pack_sin_codigo_genera_su_css(self):
        css = theme_engine.build_shapes_css()
        # Capa 1: la geometria del manifiesto se traduce a reglas de componente.
        for target in ("#alert-card", "#banner-alert-root", "[data-oss-shape-target]"):
            self.assertIn(f'body[data-theme-shape="demo_sticker"] {target}', css,
                          f"falta el destino {target}")
        self.assertIn("border-radius: 13px;", css)
        self.assertIn("--skin-ornament-tape: none !important;", css)
        # Capa 2: la decoracion de escena del pack se concatena tal cual.
        self.assertIn("Pack: Demo_New_Pack", css)
        self.assertIn("outline: 1px solid red;", css)

    def test_pack_sin_codigo_valida(self):
        self.assertEqual([], theme_engine.validate_manifest())

    def test_pack_sin_codigo_aparece_en_el_catalogo_publicado(self):
        """`config.js` publica defaults, arquetipo de forma y atmosfera.

        Es lo que elimina las listas hardcodeadas de `overlay.js`: el pack
        nuevo trae su tema y su forma por defecto, y su forma resuelve su
        arquetipo, sin tocar una linea de JavaScript.
        """
        from server.services.overlay_service import build_theme_catalog

        catalog = build_theme_catalog()
        packs = {p["id"]: p for p in catalog["packs"]}
        self.assertIn("Demo_New_Pack", packs, "el pack nuevo no llega a config.js")
        self.assertEqual("cozy", packs["Demo_New_Pack"]["archetype"])
        # El arquetipo de la forma se publica: el cliente ya no necesita mapa.
        self.assertEqual("cozy", catalog["shapeArchetypes"]["demo_sticker"])
        # La atmosfera del arquetipo sale del manifiesto (no del JS).
        self.assertIn("cozy", catalog["archetypeAtmosphere"])
        # Los defaults del pack viajan en el catalogo (aqui vacios: el pack de
        # prueba no los declara, y no debe inventarse ninguno).
        self.assertIn("Demo_New_Pack", catalog["packDefaults"])


if __name__ == "__main__":
    unittest.main()
