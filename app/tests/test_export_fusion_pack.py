#!/usr/bin/env python3
"""Contrato de "exportar una fusión como pack" (paso 19b).

Una fusión agrupa escenas de varios packs. Exportarla debe producir un **pack
real** en `streamthemes/` (tema + forma + escenas) que aparezca solo en el
catálogo y en los menús, sin tocar código.
"""
import json
import shutil
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

from server.config import BASE_DIR  # noqa: E402
from server.services import fusions_service as F  # noqa: E402

STREAMTHEMES = Path(BASE_DIR) / "streamthemes"


class TestExportFusionAsPack(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fusion_id = "test_export_fusion_pack"
        cls.pack_dir = None
        F.create_or_update_fusion({
            "id": cls.fusion_id,
            "name": "Test Export Pack",
            "icon": "📦",
            "description": "Fusion de prueba para el export.",
            "scenes": ["maker-desk"],
            "widgets": [],
            "alerts": [],
            "defaultTheme": "chill",
            "defaultShape": "maker_blueprint",
        })

    @classmethod
    def tearDownClass(cls):
        try:
            F.delete_fusion(cls.fusion_id)
        except Exception:
            pass
        if cls.pack_dir and cls.pack_dir.exists():
            shutil.rmtree(cls.pack_dir, ignore_errors=True)
        # El pack temporal registro su tema en `common/themes.css`: al borrarlo
        # hay que recompilar para no dejar un bloque huerfano (lo comprueba
        # `test_theme_sync_contract`).
        from server.services.theme_manager import sync_common_themes_css
        sync_common_themes_css()

    def test_1_exporta_un_pack_real(self):
        res = F.export_fusion_as_pack(self.fusion_id)
        self.assertEqual("ok", res["status"])
        type(self).pack_dir = STREAMTHEMES / res["packId"]
        self.assertTrue(type(self).pack_dir.is_dir(), "no se creo el pack")
        self.assertEqual("chill", res["theme"])
        self.assertEqual("maker_blueprint", res["shape"])

    def test_2_el_pack_tiene_manifiesto_completo(self):
        meta = json.loads((type(self).pack_dir / "pack.json").read_text(encoding="utf-8"))
        self.assertEqual("maker", meta["archetype"])
        self.assertEqual("chill", meta["defaultTheme"])
        self.assertEqual("maker_blueprint", meta["defaultShape"])
        self.assertTrue(meta["shapes"], "el pack no trae formas")
        self.assertIn("maker_blueprint", [s["id"] for s in meta["shapes"]])

    def test_3_el_pack_tiene_su_tema_y_sus_escenas(self):
        theme_dir = type(self).pack_dir / "styles" / "chill"
        for name in ("theme.json", "style.css", "style.default.css"):
            self.assertTrue((theme_dir / name).is_file(), f"falta {name}")
        overlays = list((type(self).pack_dir / "overlays").iterdir())
        self.assertTrue(overlays, "el pack no trae escenas")

    def test_4_el_pack_aparece_en_el_catalogo(self):
        from server.services.overlay_service import build_theme_catalog

        catalog = build_theme_catalog()
        ids = {p["id"] for p in catalog["packs"]}
        self.assertIn(type(self).pack_dir.name, ids,
                      "el pack exportado no entra en config.js por si solo")

    def test_5_el_endpoint_esta_registrado(self):
        src = (APP / "server" / "routes" / "fusions_routes.py").read_text(encoding="utf-8")
        self.assertIn("/api/fusions/{id}/export-pack", src)
        self.assertIn("handle_export_fusion_pack", src)


if __name__ == "__main__":
    unittest.main()
