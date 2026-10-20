"""
Open Stream Suite — Entrypoint de la Aplicación de Escritorio
Gestiona el bloqueo de instancia única, el arranque de la GUI y la bandeja.
"""

import os
import sys
import argparse
import signal
import tkinter as tk
from pathlib import Path

from launcher.server_ctl import ServerController
from launcher.twitch_ctl import TwitchController
from launcher.tray import TrayController
from launcher.i18n import _
from launcher.gui import LauncherGUI

APP_DIR = Path(__file__).resolve().parent.parent
LOCK_FILE = APP_DIR / ".launcher.lock"


def acquire_instance_lock():
    """Garantiza que sólo haya una instancia del launcher abierta"""
    if sys.platform != "win32":
        try:
            import fcntl
            f = open(LOCK_FILE, "w")
            fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
            f.write(str(os.getpid()))
            f.flush()
            return f
        except Exception:
            return None
    else:
        try:
            import msvcrt
            f = open(LOCK_FILE, "w")
            msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
            f.write(str(os.getpid()))
            f.flush()
            return f
        except Exception:
            return None


def main():
    parser = argparse.ArgumentParser(description="Open Stream Suite — Launcher")
    parser.add_argument("--no-tray", action="store_true", help="Desactiva el icono de la bandeja del sistema")
    parser.add_argument("--start-server", action="store_true", help="Inicia el servidor automáticamente al abrir")
    parser.add_argument("--minimized", action="store_true", help="Inicia minimizado en la bandeja")
    args = parser.parse_args()

    lock = acquire_instance_lock()
    if lock is None:
        print(_("launcher.already_open"))
        return 0

    root = tk.Tk()

    server_ctl = ServerController(port=8080)
    twitch_ctl = TwitchController(port=8080)

    gui = None

    def on_log_line(line):
        if gui:
            root.after(0, lambda: gui.add_log_line(line))

    server_ctl.on_log_line = on_log_line

    tray_ctl = None
    if not args.no_tray:
        tray_ctl = TrayController(
            on_open_panel=lambda: root.after(0, lambda: gui.on_open_panel() if gui else None),
            on_show_window=lambda: root.after(0, lambda: gui.show_window() if gui else None),
            on_toggle_server=lambda: root.after(0, lambda: gui.on_toggle_server() if gui else None),
            on_quit=lambda: root.after(0, lambda: _safe_quit(root, server_ctl, tray_ctl))
        )
        tray_ctl.start()

    gui = LauncherGUI(root, server_ctl, twitch_ctl, tray_ctl)

    def _safe_quit(r, s_ctl, t_ctl):
        s_ctl.stop()
        if t_ctl:
            t_ctl.stop()
        r.destroy()
        sys.exit(0)

    # Manejar señales
    def handle_signal(sig, frame):
        _safe_quit(root, server_ctl, tray_ctl)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    if args.start_server:
        root.after(500, gui.on_toggle_server)

    if args.minimized and tray_ctl and tray_ctl.is_available():
        root.withdraw()

    try:
        root.mainloop()
    finally:
        server_ctl.stop()
        if tray_ctl:
            tray_ctl.stop()
        try:
            LOCK_FILE.unlink(missing_ok=True)
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
