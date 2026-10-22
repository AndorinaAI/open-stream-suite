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


def get_configured_port(default=8080):
    env_file = APP_DIR / ".env"
    if env_file.exists():
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("SERVER_PORT=") and not line.startswith("#"):
                        return int(line.split("=", 1)[1].strip())
        except Exception:
            pass
    return default


class ServerController:
    def __init__(self, port=None, on_log_line=None):
        self.port = port if port is not None else get_configured_port()
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
                    return True, data
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
        """Detiene el subproceso del servidor de forma limpia y garantizada"""
        self._stopping = True

        # 1. Intentar apagado elegante vía API HTTP local (/api/system/shutdown)
        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/system/shutdown",
                data=b"{}",
                headers={"Content-Type": "application/json", "User-Agent": "OpenStreamSuite-Launcher"}
            )
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                pass
        except Exception:
            pass

        # 2. Si tenemos el subproceso instanciado directamente
        if self.process:
            proc = self.process
            self.process = None
            try:
                if sys.platform == "win32":
                    proc.terminate()
                else:
                    proc.send_signal(signal.SIGINT)

                start_t = time.time()
                while time.time() - start_t < 1.2:
                    if proc.poll() is not None:
                        break
                    time.sleep(0.1)

                if proc.poll() is None:
                    proc.kill()
                    proc.wait(timeout=1.0)
            except Exception:
                pass

        # 3. Limpiar procesos por archivo PID
        pid_candidates = [
            PID_FILE,
            APP_DIR.parent / "OpenStreamSuite" / "app" / ".server.pid",
            Path.home() / "OpenStreamSuite" / "app" / ".server.pid"
        ]
        for pid_path in pid_candidates:
            if pid_path.exists():
                try:
                    pid = int(pid_path.read_text().strip())
                    if sys.platform != "win32":
                        try:
                            os.kill(pid, signal.SIGTERM)
                            time.sleep(0.2)
                            if os.path.exists(f"/proc/{pid}"):
                                os.kill(pid, signal.SIGKILL)
                        except ProcessLookupError:
                            pass
                    else:
                        subprocess.run(["taskkill", "/F", "/PID", str(pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                except Exception:
                    pass
                try:
                    pid_path.unlink(missing_ok=True)
                except Exception:
                    pass

        # 4. Comprobación y liberación del puerto si todavía responde
        start_wait = time.time()
        while time.time() - start_wait < timeout:
            alive, _ = self.is_running()
            if not alive:
                break

            if sys.platform != "win32":
                try:
                    subprocess.run(["fuser", "-k", f"{self.port}/tcp"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                except Exception:
                    pass
            else:
                try:
                    out = subprocess.check_output(f'netstat -ano | findstr :{self.port}', shell=True, text=True)
                    for line in out.strip().splitlines():
                        parts = line.split()
                        if len(parts) >= 5 and "LISTENING" in parts:
                            p = parts[-1]
                            subprocess.run(["taskkill", "/F", "/PID", p], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                except Exception:
                    pass
            time.sleep(0.2)

        alive, _ = self.is_running()
        return not alive
