"""Contrato del arranque de tema de los overlays.

Regresion de esta ronda (el tema no se aplicaba en NINGUN overlay):

1. `widget-theme.js` solo usaba el tema del miembro si
   `overlayThemeExplicit['widget:<id>']` era verdadero. Ese mapa no trae
   claves `widget:*`, asi que `assignedTheme()` devolvia null siempre.
2. `config.js` es el config de ESCENAS: no publica `widget:*` ni `alert:*`, y
   `/api/widgets/config` tampoco los devolvia.
3. El fallback de fondo era `transparent`: sin token, la caja desaparecia.

Ahora hay un solo arranque (`common/theme-bootstrap.js`) y un solo payload
(`build_theme_bootstrap()`), servido por los dos endpoints.
"""
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR
from server.services.overlay_service import build_theme_bootstrap

APP = Path(BASE_DIR)
WIDGET_THEME = APP / "common/widget-theme.js"
WS_CLIENT = APP / "alerts/js/overlay/04-ws-client.js"
BOOTSTRAP = APP / "common/theme-bootstrap.js"
SKIN_CSS = APP / "common/oss-skin.css"
WIDGETS_ROUTES = APP / "server/routes/widgets_routes.py"
ALERTS_ROUTES = APP / "server/routes/alerts_routes.py"

REQUIRED_KEYS = (
    "overlayThemes", "overlayShapes", "overlayThemeExplicit",
    "themeArchetypes", "globalThemeActive", "activeTheme",
)


class BootstrapPayloadContract(unittest.TestCase):
    def test_payload_has_every_key(self):
        payload = build_theme_bootstrap()
        for key in REQUIRED_KEYS:
            self.assertIn(key, payload, f"build_theme_bootstrap no publica {key}")

    def test_payload_maps_are_dicts_even_when_empty(self):
        payload = build_theme_bootstrap()
        for key in ("overlayThemes", "overlayShapes", "overlayThemeExplicit", "themeArchetypes"):
            self.assertIsInstance(payload[key], dict, f"{key} debe ser dict")

    def test_both_endpoints_publish_the_payload(self):
        self.assertIn("build_theme_bootstrap", WIDGETS_ROUTES.read_text(encoding="utf-8"))
        self.assertIn("build_theme_bootstrap", ALERTS_ROUTES.read_text(encoding="utf-8"))


class AssignedThemeContract(unittest.TestCase):
    def test_no_explicit_condition(self):
        """La presencia en overlayThemes ya es explicita."""
        js = WIDGET_THEME.read_text(encoding="utf-8")
        body = re.search(r"function assignedTheme\(\)\s*\{(.*?)\n  \}", js, re.S)
        self.assertIsNotNone(body, "assignedTheme() no encontrada")
        self.assertNotIn("isExplicitTheme", body.group(1),
                         "assignedTheme no debe condicionarse a overlayThemeExplicit")
        self.assertIn("overlayThemes", body.group(1))


class SingleBootstrapPathContract(unittest.TestCase):
    def test_overlays_use_theme_bootstrap(self):
        for path, label in ((WIDGET_THEME, "widgets"), (WS_CLIENT, "alertas")):
            js = path.read_text(encoding="utf-8")
            self.assertIn("ThemeBootstrap.load", js, f"{label} no usa ThemeBootstrap.load")
            self.assertIn("ThemeBootstrap.apply", js, f"{label} no usa ThemeBootstrap.apply")

    def test_bootstrap_api(self):
        js = BOOTSTRAP.read_text(encoding="utf-8")
        for fn in ("function load(", "function apply(", "function current("):
            self.assertIn(fn, js, f"falta {fn} en theme-bootstrap.js")

    def test_bootstrap_is_loaded_before_widget_theme(self):
        for w in ("chat", "goal", "shoutout", "ticker", "timer"):
            html = (APP / "widgets" / w / "index.html").read_text(encoding="utf-8")
            self.assertLess(html.find("theme-bootstrap.js"), html.find("widget-theme.js"),
                            f"{w}: theme-bootstrap.js debe cargarse antes")


class NoTransparentFallbackContract(unittest.TestCase):
    def test_background_never_falls_back_to_transparent(self):
        css = SKIN_CSS.read_text(encoding="utf-8")
        self.assertNotIn("color-panel-bg, transparent", css,
                         "un fallback transparent deja la caja invisible cuando "
                         "el tema no define el token")
        self.assertIn("--color-bg-dark", css,
                      "falta el ultimo recurso de fondo (--color-bg-dark)")


if __name__ == "__main__":
    unittest.main()
