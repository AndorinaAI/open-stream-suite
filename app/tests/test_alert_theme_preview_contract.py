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
QUEUE_JS = APP / 'alerts/js/overlay/03-alert-queue.js'
ALERTS_CSS = APP / 'alerts/css/alerts-themes.css'
ALERTS_ROUTES = APP / 'server/routes/alerts_routes.py'
WS_CLIENT = APP / 'alerts/js/overlay/04-ws-client.js'
THEMES_JS_04 = APP / 'alerts/js/alerts-studio/04-themes.js'
CONTROLS_JS = APP / 'alerts/js/alerts-studio/03-controls.js'
PREVIEW_JS = APP / "alerts/js/alerts-studio/06-preview-test.js"
THEMES_JS = APP / "alerts/js/component-themes.js"
PANEL_HTML = APP / "alerts/panel.html"
INDEX_HTML = APP / "alerts/index.html"


def _read(path):
    return path.read_text(encoding="utf-8")


class AlertThemeApplyContract(unittest.TestCase):
    def test_effective_theme_prefers_assigned_over_global(self):
        """El tema asignado a la alerta gana al global, siempre."""
        js = _read(SHAPES_JS)
        body = re.search(r"function effectiveTheme\(type\)\s*\{(.*?)\n  \}", js, re.S)
        self.assertIsNotNone(body, "effectiveTheme() no encontrada")
        code = body.group(1)

        self.assertIn(
            "themes[type] || globalTheme", code,
            "effectiveTheme debe usar el tema del miembro y caer al global solo "
            "si no hay ninguno asignado (themes[type] || globalTheme)",
        )
        # El patrón antiguo solo miraba el tema propio si el mapa explícito
        # lo marcaba; con ese mapa incompleto el tema se perdía.
        self.assertNotIn(
            "explicit[type] ? themes[type]", js,
            "no se debe condicionar el tema asignado a overlayThemeExplicit: "
            "ese mapa puede venir incompleto",
        )

    def test_apply_theme_for_uses_effective_theme(self):
        js = _read(SHAPES_JS)
        body = re.search(r"function applyThemeFor\(type\)\s*\{(.*?)\n  \}", js, re.S)
        self.assertIsNotNone(body)
        self.assertIn("effectiveTheme(type)", body.group(1))

    def test_overlay_sets_data_theme_on_body(self):
        js = _read(SHAPES_JS)
        self.assertIn("document.body.setAttribute('data-theme', theme)", js)
        self.assertIn("document.body.removeAttribute('data-theme')", js)


class PackThemeWinsContract(unittest.TestCase):
    """El estilo base legacy ya no existe: solo manda el tema del pack."""

    def test_overlay_has_no_legacy_class(self):
        js = _read(QUEUE_JS)
        self.assertNotIn("banner-theme-", js,
                         "el overlay no debe generar clases banner-theme-*")
        self.assertIn("banner-alert-root anim-", js)

    def test_preview_has_no_legacy_class(self):
        js = _read(PREVIEW_JS)
        # Busca la CONSTRUCCIÓN de la clase, no una mención en un comentario.
        self.assertNotIn("banner-theme-${", js,
                         "el preview no debe generar clases banner-theme-*")
        self.assertIn("banner-alert-root${legacyClass}", js)

    def test_css_catalogue_is_gone(self):
        css = _read(ALERTS_CSS)
        self.assertNotIn(".banner-theme-", css,
                         "el catalogo de 9 temas legacy debe estar borrado del CSS")

    def test_preview_falls_back_to_global_theme(self):
        """Sin tema propio, el simulador pinta el tema global (como el overlay)."""
        js = _read(PREVIEW_JS)
        self.assertIn("previewTheme.theme || previewTheme.globalTheme", js)

    def test_theme_state_exposes_global(self):
        js = _read(THEMES_JS)
        self.assertIn("state.globalThemeActive = !!packsRes.globalThemeActive", js)
        self.assertIn("globalTheme: state.globalThemeActive", js)

    def test_selects_apply_on_change(self):
        """Elegir en el desplegable debe guardar; antes habia que pulsar Aplicar."""
        js = _read(THEMES_JS)
        self.assertEqual(
            js.count('onchange="ComponentThemes.apply('), 2,
            "los desplegables de tema y forma deben auto-aplicar al cambiar",
        )

    def test_apply_refreshes_preview(self):
        js = _read(THEMES_JS)
        self.assertIn("AlertsStudio.updatePreview(true)", js)

    def test_user_customisation_survives_pack_theme(self):
        """Los colores propios se aplican siempre: el usuario puede mezclar."""
        js = _read(QUEUE_JS)
        # Antes, con pack theme se borraban --banner-border/--banner-accent/
        # --banner-text y el color del usuario. Ahora se aplican siempre.
        self.assertNotIn("removeProperty('--banner-text')", js,
                         "borrar el color de texto del usuario rompe la mezcla")
        self.assertIn("setProperty('--banner-border', item.bannerBorderColor)", js)
        self.assertIn("setProperty('--banner-text', item.bannerTextColor)", js)


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
        self.assertIn("06-preview-test.js?v=54", panel)
        self.assertIn("02a-layout-dom.js?v=55", panel)
        self.assertIn("02b-gallery-toast.js?v=51", panel)
        self.assertNotIn("02a-layout-dom.js?v=50", panel)

        index = _read(INDEX_HTML)
        self.assertIn("02b-alert-shapes.js?v=", index,
                      "02b-alert-shapes.js se sirve sin versión: el navegador "
                      "puede quedarse con el applyThemeFor antiguo")
        self.assertIn("03-alert-queue.js?v=", index,
                      "03-alert-queue.js se sirve sin versión: el navegador "
                      "puede quedarse con la regla antigua de banner-theme-*")


class AlertsConfigPayloadContract(unittest.TestCase):
    """El overlay debe recibir los mapas de tema, no solo {alerts, config, status}.

    Regresion: `/api/alerts/config` devolvia solo `{alerts, config, status}`, y
    `config.js` no publica las claves `alert:*`. Resultado: `AlertShapes`
    arrancaba con el mapa vacio, no encontraba `alert:card` / `alert:banner` y
    borraba `data-theme`, asi que el tema del pack nunca se aplicaba en OBS.
    """

    def test_endpoint_publishes_theme_maps(self):
        src = _read(ALERTS_ROUTES)
        self.assertIn("build_theme_bootstrap", src,
                      "/api/alerts/config debe publicar el arranque de tema")

    def test_overlay_reads_its_own_endpoint(self):
        js = _read(WS_CLIENT)
        self.assertIn("/api/alerts/config", js,
                      "el overlay no puede depender de config.js: no trae alert:*")


class LegacyThemeSystemRemovedContract(unittest.TestCase):
    """El catalogo paralelo de 9 estilos de alerta ya no existe."""

    def test_04_themes_is_empty(self):
        js = _read(THEMES_JS_04)
        self.assertNotIn("selectAndApplyTheme", js)
        self.assertNotIn("saveThemeAsNew", js)
        self.assertNotIn("deleteCurrentTheme", js)
        self.assertNotIn("bannerStyle", js)
        self.assertLess(len(js.splitlines()), 20,
                        "04-themes.js debe quedar como stub documentado")

    def test_animation_handler_lives_in_controls(self):
        js = _read(CONTROLS_JS)
        self.assertIn("onAnimationChange", js,
                      "el select #cfg-banner-anim sigue llamandolo")

    def test_no_selector_of_dead_styles(self):
        panel = _read(PANEL_HTML)
        self.assertNotIn("cfg-plat-banner-style", panel,
                         "el select de 9 estilos muertos debe estar eliminado")


if __name__ == "__main__":
    unittest.main()
