"""
Open Stream Suite — Controlador del Servidor Local
Gestiona el ciclo de vida del subproceso server.py de forma limpia y multiplataforma.
"""

import os
import sys
import time
import signal
import atexit
import threading
import subprocess
import urllib.request
import json
from pathlib import Path

from launcher.i18n import _

APP_DIR = Path(__file__).resolve().parent.parent
PID_FILE = APP_DIR / ".server.pid"


class ServerController:
    def __init__(self, port=8080, on_log_line=None):
        self.port = port
        self.on_log_line = on_log_line
        self.process = None
        self._reader_thread = None
        self._stopping = False
        atexit.register(self.stop)

    @property
    def base_url(self):
        return f"http://127.0.0.1:{self.port}"

    def is_running(self):
        """Verifica si el servidor responde correctamente a /api/status"""
        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/status",
                headers={"User-Agent": "OpenStreamSuite-Launcher"}
            )
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    return data.get("status") == "ok", data
        except Exception:
            pass

        # Si el subproceso aún existe localmente pero no responde, sigue vivo si poll() is None
        if self.process and self.process.poll() is None:
            return True, {"status": "starting"}

        return False, {}

    def start(self):
        """Inicia server.py como subproceso independiente"""
        if self.process and self.process.poll() is None:
            return True, _("launcher.server_running")

        alive, _status = self.is_running()
        if alive and not self.process:
            return True, "El servidor ya estaba activo en segundo plano"

        self._stopping = False
        env = os.environ.copy()
        env["PYTHONUNBUFFERED"] = "1"

        creation_flags = 0
        if sys.platform == "win32":
            creation_flags = subprocess.CREATE_NEW_PROCESS_GROUP

        try:
            self.process = subprocess.Popen(
                [sys.executable, str(APP_DIR / "server.py")],
                cwd=str(APP_DIR),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                creationflags=creation_flags
            )

            # Guardar PID
            try:
                PID_FILE.write_text(str(self.process.pid))
            except Exception:
                pass

            # Hilo de lectura de logs
            self._reader_thread = threading.Thread(target=self._read_output, daemon=True)
            self._reader_thread.start()

            return True, _("server.started_pid", pid=self.process.pid)
        except Exception as e:
            return False, _("launcher.server_start_error", e=e)

    def _read_output(self):
        """Lee la salida estándar del servidor y la pasa al callback de logging"""
        if not self.process or not self.process.stdout:
            return
        try:
            for line in iter(self.process.stdout.readline, ""):
                if not line:
                    break
                clean_line = line.rstrip()
                if self.on_log_line and callable(self.on_log_line):
                    self.on_log_line(clean_line)
        except Exception:
            pass

    def stop(self, timeout=4.0):
        """Detiene el subproceso del servidor de forma limpia"""
        self._stopping = True

        if not self.process:
            # Si no hay subproceso pero hay PID_FILE, intentar limpiar si es nuestro
            if PID_FILE.exists():
                try:
                    pid = int(PID_FILE.read_text().strip())
                    if sys.platform != "win32":
                        os.kill(pid, signal.SIGTERM)
                except Exception:
                    pass
                try:
                    PID_FILE.unlink(missing_ok=True)
                except Exception:
                    pass
            return True

        proc = self.process
        self.process = None

        if proc.poll() is not None:
            PID_FILE.unlink(missing_ok=True)
            return True

        try:
            if sys.platform == "win32":
                proc.terminate()
            else:
                proc.send_signal(signal.SIGINT)

            start_t = time.time()
            while time.time() - start_t < timeout:
                if proc.poll() is not None:
                    break
                time.sleep(0.15)

            if proc.poll() is None:
                proc.kill()
                proc.wait(timeout=1.5)
        except Exception:
            pass
        finally:
            PID_FILE.unlink(missing_ok=True)

        return True
