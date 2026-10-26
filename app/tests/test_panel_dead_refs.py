"""Regresión de V3-07: referencias muertas en el panel.

`09-overlay-folders-render.js` consultaba `overlays-btn-back-folders`, un id que
**no existe** en `panel.html`: el botón real («⬅️ Volver a Carpetas») vive dentro
de `overlays-folder-details-view`, así que se oculta junto con el contenedor y no
necesita lógica propia (opción elegida: quitar la referencia muerta).

Si algún día se decide lo contrario (añadir el id al botón real y volver a
consultarlo), hay que actualizar esta lista y el comentario del módulo **a la vez**.
"""
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR

DEAD_IDS = ("overlays-btn-back-folders",)
# Solo referencias de código (no comentarios ni prosa).
REFERENCE_PATTERN = r"""(getElementById|querySelector|querySelectorAll)\(\s*['"](?:#)?{id}['"]"""


class TestNoDeadPanelReferences(unittest.TestCase):
    def test_dead_ids_are_not_referenced_in_code(self):
        offenders = []
        for path in sorted((BASE_DIR / "alerts").rglob("*.js")):
            source = path.read_text(encoding="utf-8")
            for dead in DEAD_IDS:
                if re.search(REFERENCE_PATTERN.format(id=re.escape(dead)), source):
                    offenders.append(f"{path.relative_to(BASE_DIR)} → {dead}")
        self.assertEqual(offenders, [], "referencias a ids inexistentes:\n  " + "\n  ".join(offenders))

    def test_real_back_button_lives_inside_the_details_view(self):
        html = (BASE_DIR / "alerts" / "panel.html").read_text(encoding="utf-8")
        folders_index = html.index('id="overlays-folders-view"')
        details_index = html.index('id="overlays-folder-details-view"')
        back_index = html.index("themes.btn_back_folders")
        self.assertGreater(details_index, folders_index)
        self.assertGreater(
            back_index, details_index,
            "el botón de volver debe estar dentro del contenedor de detalles",
        )


if __name__ == "__main__":
    unittest.main()


    def test_real_back_button_lives_inside_the_details_view(self):
        html = (BASE_DIR / "alerts" / "panel.html").read_text(encoding="utf-8")
        folders_index = html.index('id="overlays-folders-view"')
        details_index = html.index('id="overlays-folder-details-view"')
        back_index = html.index("themes.btn_back_folders")
        self.assertGreater(details_index, folders_index)
        self.assertGreater(
            back_index, details_index,
            "el botón de volver debe estar dentro del contenedor de detalles",
        )


if __name__ == "__main__":
    unittest.main()
