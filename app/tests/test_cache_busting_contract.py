"""Contrato de versiones de caché (`?v=N`) en el panel.

Los `?v=` se han olvidado ya tres veces en este proyecto (el acordeón de
temas, el simulador de alertas y la pestaña 🎨 Tema). Cada olvido deja el
arreglo escrito en disco pero **sin ejecutar** en el navegador, así que el
síntoma es idéntico a «no funciona».

Este test no puede saber si has cambiado un JS sin subir la versión, pero sí
detecta lo que de verdad pasó: que la versión se quede en un valor conocido
como viejo, o que un fichero crítico se sirva sin `?v=` ninguno.
"""
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR

APP = Path(BASE_DIR)
PANEL = APP / "alerts/panel.html"
INDEX = APP / "alerts/index.html"

# Versiones que ya provocaron un "no se ve el cambio". Si un fichero aparece
# servido con una de estas, el navegador está ejecutando la versión anterior.
STALE = {
    "01-miniapp.js": 50,          # faltaba renderMiniAppTheme (pestaña Tema)
    "widget-overrides.js": 5,     # faltaba el ThemePicker completo
    "component-themes.js": 3,     # sin auto-aplicar al cambiar de tema
    "02a-layout-dom.js": 52,      # sin la galería legacy oculta
    "06-preview-test.js": 53,     # generaba banner-theme-*
    "widgets-shortcuts.js": 6,    # usaba prompt() nativo
    "ui-feedback.js": 1,          # sin formDialog
}

# Ficheros que deben servirse SIEMPRE versionados (nunca en crudo).
MUST_BE_VERSIONED = (
    "common/theme-bootstrap.js",
    "common/widget-theme.js",
    "alerts/js/overlay/04-ws-client.js",
    "alerts/js/overlay/03-alert-queue.js",
    "alerts/js/alerts-studio/01-miniapp.js",
)


def _served(text):
    """{nombre_fichero: version} de todos los `?v=N` de un HTML."""
    out = {}
    for name, ver in re.findall(r"([A-Za-z0-9_/-]+\.(?:js|css))\?v=(\d+)", text):
        out[name.rsplit("/", 1)[-1]] = int(ver)
    return out


class CacheBustingContract(unittest.TestCase):
    def test_no_stale_versions_in_panel(self):
        served = _served(PANEL.read_text(encoding="utf-8"))
        for name, old in STALE.items():
            if name in served:
                self.assertNotEqual(
                    served[name], old,
                    f"{name} sigue en ?v={old}: el navegador ejecutará la "
                    f"versión anterior y el arreglo no se verá",
                )

    def test_critical_files_are_versioned(self):
        htmls = [PANEL, INDEX]
        for w in ("chat", "goal", "shoutout", "ticker", "timer"):
            htmls.append(APP / "widgets" / w / "index.html")
        texts = [p.read_text(encoding="utf-8") for p in htmls if p.exists()]
        for rel in MUST_BE_VERSIONED:
            base = rel.rsplit("/", 1)[-1]
            found = any(re.search(re.escape(base) + r"\?v=\d+", t) for t in texts)
            self.assertTrue(found,
                            f"{base} se sirve sin ?v= en todas las vistas: "
                            f"el navegador puede cachearlo")

    def test_new_theme_bootstrap_is_loaded_before_widget_theme(self):
        """El arranque de tema debe existir antes de que `OSSTheme.init` lo use."""
        for w in ("chat", "goal", "shoutout", "ticker", "timer"):
            html = (APP / "widgets" / w / "index.html").read_text(encoding="utf-8")
            i_boot = html.find("theme-bootstrap.js")
            i_theme = html.find("widget-theme.js")
            self.assertGreater(i_boot, -1, f"{w}: no carga theme-bootstrap.js")
            self.assertLess(i_boot, i_theme,
                            f"{w}: theme-bootstrap.js debe ir antes de widget-theme.js")


if __name__ == "__main__":
    unittest.main()
