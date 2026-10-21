"""
Open Stream Suite — Controlador de Twitch y Credenciales
Lee y guarda las credenciales en .env de forma atómica y gestiona la conexión OAuth.
"""

import os
import re
import json
import urllib.request
import webbrowser
from pathlib import Path

from launcher.i18n import _

APP_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = APP_DIR / ".env"
LOCAL_TOKEN_FILE = APP_DIR / ".local_token"


class TwitchController:
    def __init__(self, port=8080):
        self.port = port

    @property
    def base_url(self):
        return f"http://127.0.0.1:{self.port}"

    def get_local_token(self):
        """Lee el token local para peticiones administrativas autenticadas"""
        if LOCAL_TOKEN_FILE.exists():
            try:
                return LOCAL_TOKEN_FILE.read_text(encoding="utf-8").strip()
            except Exception:
                pass
        return ""

    def load_env_credentials(self):
        """Lee Client ID y Client Secret desde el fichero .env"""
        creds = {
            "client_id": "",
            "client_secret": "",
            "port": str(self.port),
            "host": "127.0.0.1",
            "deck_token": ""
        }
        if not ENV_FILE.exists():
            return creds

        try:
            content = ENV_FILE.read_text(encoding="utf-8")
            for line in content.splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key == "TWITCH_CLIENT_ID":
                        creds["client_id"] = val
                    elif key == "TWITCH_CLIENT_SECRET":
                        creds["client_secret"] = val
                    elif key == "SERVER_PORT":
                        creds["port"] = val
                    elif key == "SERVER_HOST":
                        creds["host"] = val
                    elif key == "DECK_TOKEN":
                        creds["deck_token"] = val
        except Exception:
            pass

        return creds

    def save_env_credentials(self, client_id, client_secret, port=None, host=None, deck_token=None):
        """Guarda las credenciales en .env de forma atómica respetando comentarios"""
        lines = []
        keys_seen = set()

        if ENV_FILE.exists():
            try:
                raw_lines = ENV_FILE.read_text(encoding="utf-8").splitlines()
                for line in raw_lines:
                    sline = line.strip()
                    if sline and not sline.startswith("#") and "=" in sline:
                        k, _val = sline.split("=", 1)
                        k = k.strip()
                        if k == "TWITCH_CLIENT_ID":
                            lines.append(f"TWITCH_CLIENT_ID={client_id.strip()}")
                            keys_seen.add(k)
                        elif k == "TWITCH_CLIENT_SECRET":
                            lines.append(f"TWITCH_CLIENT_SECRET={client_secret.strip()}")
                            keys_seen.add(k)
                        elif k == "SERVER_PORT" and port:
                            lines.append(f"SERVER_PORT={port.strip()}")
                            keys_seen.add(k)
                        elif k == "SERVER_HOST" and host is not None:
                            lines.append(f"SERVER_HOST={host.strip()}")
                            keys_seen.add(k)
                        elif k == "DECK_TOKEN" and deck_token is not None:
                            lines.append(f"DECK_TOKEN={deck_token.strip()}")
                            keys_seen.add(k)
                        else:
                            lines.append(line)
                    else:
                        lines.append(line)
            except Exception:
                pass

        # Si no existían las claves, añadirlas
        if "TWITCH_CLIENT_ID" not in keys_seen:
            lines.append(f"TWITCH_CLIENT_ID={client_id.strip()}")
        if "TWITCH_CLIENT_SECRET" not in keys_seen:
            lines.append(f"TWITCH_CLIENT_SECRET={client_secret.strip()}")
        if port and "SERVER_PORT" not in keys_seen:
            lines.append(f"SERVER_PORT={port.strip()}")

        content = "\n".join(lines).strip() + "\n"
        tmp_file = APP_DIR / ".env.tmp"
        tmp_file.write_text(content, encoding="utf-8")
        tmp_file.replace(ENV_FILE)
        return True

    def get_connection_status(self):
        """Consulta /api/status para obtener el usuario de Twitch conectado"""
        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/status",
                headers={"User-Agent": "OpenStreamSuite-Launcher"}
            )
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    user = data.get("user")
                    eventsub_active = data.get("eventsub_active", False)
                    irc_active = data.get("irc_active", False)
                    connected = user is not None
                    return {
                        "online": True,
                        "connected": connected,
                        "username": user.get("display_name") or user.get("login", "") if user else "",
                        "avatar": user.get("profile_image_url", "") if user else "",
                        "eventsub": eventsub_active,
                        "irc": irc_active
                    }
        except Exception:
            pass

        return {
            "online": False,
            "connected": False,
            "username": "",
            "avatar": "",
            "eventsub": False,
            "irc": False
        }

    def open_twitch_login(self):
        """Abre el flujo de autorización OAuth en el navegador predeterminado"""
        url = f"{self.base_url}/auth"
        webbrowser.open(url)

    def logout_twitch(self):
        """Cierra la sesión llamando a /api/auth/logout con el token local"""
        token = self.get_local_token()
        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/auth/logout",
                data=b"{}",
                headers={
                    "Content-Type": "application/json",
                    "X-Local-Token": token,
                    "User-Agent": "OpenStreamSuite-Launcher"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                if resp.status == 200:
                    return True, _("launcher.session_closed")
        except Exception as e:
            return False, _("launcher.session_close_error", e=e)

        return False, _("launcher.server_contact_error")
