#!/usr/bin/env python3
"""Contrato del bloque de CSS de las vistas.

La misma regla ganaba o perdia segun la vista porque cada HTML cargaba una
combinacion distinta de CSS: las 27 escenas NO cargaban `oss-skin.css` (con 27
usando `data-oss-panel`), los widgets no cargaban `components.css` y
`fonts.css` iba al principio o al final.

Este test fija la lista y el orden unicos, y que `oss-skin.css` vaya al final
(es la capa de skin de componentes: debe poder ganar a la base).
"""
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP / "scripts") not in sys.path:
    sys.path.insert(0, str(APP / "scripts"))

import normalize_view_links as N  # noqa: E402

CANONICAL_TAIL = (
    "common/fonts.css",
    "common/styles.css",
    "common/generated/archetypes.css",
    "common/generated/shapes.css",
    "common/themes.css",
    "common/components.css",
)


class TestViewLinksContract(unittest.TestCase):
    def setUp(self):
        self.views = N.view_targets()

    def test_1_hay_vistas(self):
        self.assertGreaterEqual(len(self.views), 30, "no se encontraron las vistas")

    def test_2_todas_cargan_el_bloque_canonico(self):
        offenders = {}
        for path in self.views:
            html = path.read_text(encoding="utf-8")
            for suffix in CANONICAL_TAIL + ("common/oss-skin.css",):
                if suffix not in html:
                    offenders.setdefault(str(path.relative_to(APP)), []).append(suffix)
        self.assertEqual({}, offenders,
                         "vistas sin el bloque canonico de CSS: "
                         + repr(offenders))

    def test_3_el_orden_es_el_mismo_en_todas(self):
        offenders = {}
        for path in self.views:
            hrefs = re.findall(r'<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"',
                               path.read_text(encoding="utf-8"))
            common = [h for h in hrefs if N._slot_of(h) is not None]
            slots = [N._slot_of(h) for h in common]
            expected = [slot for slot, _ in N.COMMON_SLOTS] + [N.OSS_SKIN]
            if [s for s in slots if s != N.OSS_SKIN] != expected[:-1]:
                offenders[str(path.relative_to(APP))] = slots
            elif N.OSS_SKIN in slots and slots[-1] != N.OSS_SKIN:
                offenders[str(path.relative_to(APP))] = slots
        self.assertEqual({}, offenders, "orden de CSS distinto: " + repr(offenders))

    def test_4_oss_skin_va_al_final(self):
        offenders = []
        for path in self.views:
            html = path.read_text(encoding="utf-8")
            hrefs = re.findall(r'<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"', html)
            slot_hrefs = [h for h in hrefs if N._slot_of(h) == N.OSS_SKIN]
            self.assertEqual(1, len(slot_hrefs), f"{path.name}: oss-skin.css debe aparecer una vez")
            self.assertTrue(hrefs[-1].endswith("common/oss-skin.css"), f"{path.name}: debe ser el último")
            if not hrefs[-1].endswith("common/oss-skin.css"):
                offenders.append(str(path.relative_to(APP)))
        self.assertEqual([], offenders)

    def test_5_el_normalizador_no_tiene_nada_que_hacer(self):
        """Si esto falla: `python scripts/normalize_view_links.py`."""
        pending = []
        for path in self.views:
            _text, changed = N.normalize_text(path.read_text(encoding="utf-8"))
            if changed:
                pending.append(str(path.relative_to(APP)))
        self.assertEqual([], pending,
                         "vistas con el bloque desnormalizado (ejecuta el script): "
                         + repr(pending))


if __name__ == "__main__":
    unittest.main()
