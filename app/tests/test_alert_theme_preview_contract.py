"""Contrato del tema de pack en alertas: overlay y simulador del panel.

Regresión que corrige esta ronda (el tema «no se aplicaba»):

1. ``AlertShapes.applyThemeFor`` solo usaba el tema propio del miembro si
   ``overlayThemeExplicit`` lo marcaba. Ese mapa puede no traer la clave
   (estados antiguos, o escritos por otra ruta), y entonces caía al tema
   global; con ``globalThemeActive:false`` el global es ``null`` y el
   ``<body>`` del overlay se quedaba **sin** ``data-theme``. Resultado: el
   panel mostraba un tema seleccionado y la alerta salía sin tema.
   Un tema presente en ``overlayThemes['alert:card'|'alert:banner']`` es una
   asignación manual, así que manda siempre.

2. El simulador del panel pintaba solo el sistema antiguo (``banner-theme-*``
   y colores en línea) y nunca ponía ``data-theme``, así que asignar un tema
   de pack no cambiaba nada en pantalla: el efecto solo se veía en OBS.

También se fija el bump de caché: si el navegador sirve el JS viejo, el
arreglo existe pero no se ejecuta.
"""
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR

APP = Path(BASE_DIR)
SHAPES_JS = APP / "alerts/js/overlay/02b-alert-shapes.js"
PREVIEW_JS = APP / "alerts/js/alerts-studio/06-preview-test.js"
PANEL_HTML = APP / "alerts/panel.html"
INDEX_HTML = APP / "alerts/index.html"


def _read(path):
    return path.read_text(encoding="utf-8")


class AlertThemeApplyContract(unittest.TestCase):
    def test_overlay_prefers_assigned_theme_over_global(self):
        """El tema asignado a la alerta gana al global, siempre."""
        js = _read(SHAPES_JS)
        body = re.search(r"function applyThemeFor\(type\)\s*\{(.*?)\n  \}", js, re.S)
        self.assertIsNotNone(body, "applyThemeFor() no encontrada")
        code = body.group(1)

        self.assertIn(
            "themes[type] || globalTheme", code,
            "applyThemeFor debe usar el tema del miembro y caer al global solo "
            "si no hay ninguno asignado (themes[type] || globalTheme)",
        )
        # El patrón antiguo solo miraba el tema propio si el mapa explícito
        # lo marcaba; con ese mapa incompleto el tema se perdía.
        self.assertNotIn(
            "explicit[type] ? themes[type]", code,
            "applyThemeFor no debe condicionar el tema asignado a "
            "overlayThemeExplicit: ese mapa puede venir incompleto",
        )

    def test_overlay_sets_data_theme_on_body(self):
        js = _read(SHAPES_JS)
        self.assertIn("document.body.setAttribute('data-theme', theme)", js)
        self.assertIn("document.body.removeAttribute('data-theme')", js)


class AlertPreviewThemeContract(unittest.TestCase):
    def test_preview_marks_panel_and_theme(self):
        """El nodo del simulador debe llevar data-oss-panel y data-theme."""
        js = _read(PREVIEW_JS)
        self.assertIn("data-oss-panel=", js, "el preview no marca data-oss-panel")
        self.assertIn("data-theme=", js, "el preview no aplica data-theme")
        self.assertIn("themeStateFor", js, "el preview no consulta el tema asignado")

    def test_preview_selects_key_by_render_mode(self):
        """banner -> alert:banner; tarjeta/multimedia -> alert:card."""
        js = _read(PREVIEW_JS)
        self.assertIn("'alert:banner'", js)
        self.assertIn("'alert:card'", js)

    def test_cache_busting_bumped(self):
        """Sin bump, el navegador ejecuta el JS anterior y «no cambia nada»."""
        panel = _read(PANEL_HTML)
        self.assertIn("06-preview-test.js?v=51", panel)
        self.assertIn("02a-layout-dom.js?v=51", panel)
        self.assertIn("02b-gallery-toast.js?v=51", panel)
        self.assertNotIn("02a-layout-dom.js?v=50", panel)

        index = _read(INDEX_HTML)
        self.assertIn("02b-alert-shapes.js?v=", index,
                      "02b-alert-shapes.js se sirve sin versión: el navegador "
                      "puede quedarse con el applyThemeFor antiguo")


if __name__ == "__main__":
    unittest.main()
