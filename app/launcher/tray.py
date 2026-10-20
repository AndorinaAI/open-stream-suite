"""
Open Stream Suite — Integración con Bandeja del Sistema (Tray)
Permite minimizar a la bandeja, controlar el servidor y acceder rápidamente al panel.
"""

import sys
import threading
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent
ICON_PATH = APP_DIR / "assets" / "favicon.png"

from launcher.i18n import _

try:
    import pystray
    from PIL import Image
    TRAY_SUPPORTED = True
except ImportError:
    TRAY_SUPPORTED = False


class TrayController:
    def __init__(self, on_open_panel=None, on_show_window=None, on_toggle_server=None, on_quit=None):
        self.on_open_panel = on_open_panel
        self.on_show_window = on_show_window
        self.on_toggle_server = on_toggle_server
        self.on_quit = on_quit
        self.icon = None
        self._thread = None
        self.server_running = False

    def is_available(self):
        return TRAY_SUPPORTED and ICON_PATH.exists()

    def update_state(self, server_running):
        self.server_running = server_running
        if self.icon:
            try:
                self.icon.menu = self._build_menu()
                self.icon.update_menu()
            except Exception:
                pass

    def _build_menu(self):
        lbl_show = _("launcher.tray_show")
        lbl_panel = _("server.btn_open_panel", "🎛️ Abrir Panel de Control")
        lbl_server = _("server.btn_stop", "⏹️ Detener Servidor") if self.server_running else _("server.btn_start", "⚡ Iniciar Servidor")
        lbl_quit = _("launcher.tray_quit", "❌ Salir")

        return pystray.Menu(
            pystray.MenuItem(lbl_show, lambda: self._safe_call(self.on_show_window), default=True),
            pystray.MenuItem(lbl_panel, lambda: self._safe_call(self.on_open_panel)),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(lbl_server, lambda: self._safe_call(self.on_toggle_server)),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(lbl_quit, lambda: self._safe_call(self.on_quit))
        )

    def _safe_call(self, callback):
        if callback and callable(callback):
            try:
                callback()
            except Exception:
                pass

    def start(self):
        """Inicia el icono en un hilo secundario"""
        if not self.is_available():
            return False

        try:
            image = Image.open(ICON_PATH)
            self.icon = pystray.Icon(
                "open_stream_suite",
                image,
                "Open Stream Suite",
                menu=self._build_menu()
            )
            self._thread = threading.Thread(target=self.icon.run, daemon=True)
            self._thread.start()
            return True
        except Exception as e:
            self.icon = None
            return False

    def stop(self):
        """Detiene el icono de la bandeja"""
        if self.icon:
            try:
                self.icon.stop()
            except Exception:
                pass
            self.icon = None
