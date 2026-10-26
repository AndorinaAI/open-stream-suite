"""
Open Stream Suite — Integración con Bandeja del Sistema (Tray)
Permite minimizar a la bandeja, controlar el servidor y acceder rápidamente al panel y escenas.
"""

import sys
import threading
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent
ICON_PATH = APP_DIR / "assets" / "favicon.png"

# Asegurar que en Linux los paquetes del sistema (PyGObject / AyatanaAppIndicator)
# sean accesibles incluso si el entorno virtual se creó sin --system-site-packages.
if sys.platform.startswith("linux"):
    for p in ("/usr/lib/python3/dist-packages", "/usr/local/lib/python3/dist-packages"):
        if p not in sys.path and Path(p).is_dir():
            sys.path.append(p)

from launcher.i18n import _

try:
    import pystray
    from PIL import Image
    TRAY_SUPPORTED = True
except ImportError:
    TRAY_SUPPORTED = False


class TrayController:
    def __init__(
        self,
        on_open_panel=None,
        on_show_window=None,
        on_hide_window=None,
        on_toggle_server=None,
        on_open_url=None,
        on_open_folder=None,
        on_quit=None,
        base_url="http://localhost:8080"
    ):
        self.on_open_panel = on_open_panel
        self.on_show_window = on_show_window
        self.on_hide_window = on_hide_window
        self.on_toggle_server = on_toggle_server
        self.on_open_url = on_open_url
        self.on_open_folder = on_open_folder
        self.on_quit = on_quit
        self.base_url = base_url
        self.icon = None
        self._thread = None
        self.server_running = False

    def is_available(self):
        return TRAY_SUPPORTED and ICON_PATH.exists()

    def update_state(self, server_running, base_url=None):
        self.server_running = server_running
        if base_url:
            self.base_url = base_url
        self.refresh_menu()

    def refresh_menu(self):
        if self.icon:
            try:
                self.icon.menu = self._build_menu()
                self.icon.update_menu()
            except Exception:
                pass

    def _safe_call(self, callback, *args):
        if callback and callable(callback):
            try:
                callback(*args)
            except TypeError:
                try:
                    callback()
                except Exception:
                    pass
            except Exception:
                pass

    def _safe_open_url(self, url):
        if self.on_open_url and callable(self.on_open_url):
            try:
                self.on_open_url(url)
                return
            except Exception:
                pass
        try:
            import webbrowser
            webbrowser.open(url)
        except Exception:
            pass

    def _safe_open_folder(self):
        if self.on_open_folder and callable(self.on_open_folder):
            try:
                self.on_open_folder()
                return
            except Exception:
                pass
        target = APP_DIR / "streamthemes"
        if not target.exists():
            target = APP_DIR
        try:
            if sys.platform == "win32":
                import os
                os.startfile(str(target))
            elif sys.platform == "darwin":
                import subprocess
                subprocess.Popen(["open", str(target)])
            else:
                import subprocess
                subprocess.Popen(["xdg-open", str(target)])
        except Exception:
            pass

    def _build_menu(self):
        lbl_show = _("launcher.tray_show", "👁️ Mostrar Ventana")
        lbl_hide = _("launcher.tray_hide", "🙈 Minimizar a la Bandeja")
        lbl_panel = _("launcher.tray_panel", "🎛️ Panel de Control (Alertas y Memes)")
        lbl_scenes = _("launcher.tray_scenes", "🎬 Escenas de OBS")
        lbl_chatting = _("launcher.tray_scene_chatting", "💬 Just Chatting")
        lbl_gameplay = _("launcher.tray_scene_gameplay", "🎮 Gameplay / Compartir Pantalla")
        lbl_starting = _("launcher.tray_scene_starting", "⏳ Comenzamos Pronto")
        lbl_brb = _("launcher.tray_scene_brb", "☕ Ya Vuelvo (BRB)")
        lbl_ending = _("launcher.tray_scene_ending", "👋 Fin de Emisión")
        lbl_chat = _("launcher.tray_chat", "💬 Overlay de Chat")
        lbl_alerts = _("launcher.tray_alerts", "🔔 Overlay de Alertas")
        lbl_folder = _("launcher.tray_overlays_folder", "📂 Carpeta de Temas y Overlays")
        lbl_server = (
            _("launcher.tray_server_stop", "⏹️ Detener Servidor")
            if self.server_running
            else _("launcher.tray_server_start", "⚡ Iniciar Servidor")
        )
        lbl_quit = _("launcher.tray_quit", "❌ Salir")

        scenes_menu = pystray.Menu(
            pystray.MenuItem(lbl_chatting, lambda *a: self._safe_open_url(f"{self.base_url}/streamthemes/Open_stream_Pack/overlays/just_chatting/")),
            pystray.MenuItem(lbl_gameplay, lambda *a: self._safe_open_url(f"{self.base_url}/streamthemes/Open_stream_Pack/overlays/desktop_share/")),
            pystray.MenuItem(lbl_starting, lambda *a: self._safe_open_url(f"{self.base_url}/streamthemes/Open_stream_Pack/overlays/screens/starting-soon/")),
            pystray.MenuItem(lbl_brb, lambda *a: self._safe_open_url(f"{self.base_url}/streamthemes/Open_stream_Pack/overlays/screens/be-right-back/")),
            pystray.MenuItem(lbl_ending, lambda *a: self._safe_open_url(f"{self.base_url}/streamthemes/Open_stream_Pack/overlays/screens/ending/")),
        )

        return pystray.Menu(
            pystray.MenuItem(lbl_show, lambda *a: self._safe_call(self.on_show_window), default=True),
            pystray.MenuItem(lbl_hide, lambda *a: self._safe_call(self.on_hide_window)),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(lbl_panel, lambda *a: self._safe_call(self.on_open_panel)),
            pystray.MenuItem(lbl_scenes, scenes_menu),
            pystray.MenuItem(lbl_chat, lambda *a: self._safe_open_url(f"{self.base_url}/chat/")),
            pystray.MenuItem(lbl_alerts, lambda *a: self._safe_open_url(f"{self.base_url}/alerts/")),
            pystray.MenuItem(lbl_folder, lambda *a: self._safe_open_folder()),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(lbl_server, lambda *a: self._safe_call(self.on_toggle_server)),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(lbl_quit, lambda *a: self._safe_call(self.on_quit))
        )

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
            # macOS requires run_detached for proper operation
            import sys
            if sys.platform == "darwin":
                # For macOS, use run_detached instead of run in a thread
                self.icon.run_detached()
            else:
                self._thread = threading.Thread(target=self.icon.run, daemon=True)
                self._thread.start()
            return True
        except Exception:
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

