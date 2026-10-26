"""Reglas de confianza compartidas por HTTP, WebSocket y servicios.

La comprobación de origen debe ser exacta: comparar ``startswith("http://localhost")``
permitía ``http://localhost.evil.com`` y entregaba el token local a una página externa.
"""
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlsplit

from server.config import DECK_TOKEN, DONATIONS_CONFIG_FILE, HOST, LOCAL_AUTH_TOKEN, PORT

_LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}


def is_loopback_host(host: str) -> bool:
    """True para las direcciones en las que el servidor no sale a la red."""
    return str(host or "").strip().lower().strip("[]") in _LOOPBACK_HOSTS


def deck_token_required() -> bool:
    """Los decks exigen token si hay uno configurado o si escuchamos en red."""
    return bool(DECK_TOKEN) or not is_loopback_host(HOST)


def _origin_key(value: str) -> tuple[str, str, int] | None:
    """Normaliza un origen/URL a (esquema, host, puerto efectivo).

    Devuelve ``None`` si no es un origen http(s) válido. No se aceptan rutas,
    credenciales, comodines ni puertos inválidos.
    """
    if not value or not isinstance(value, str):
        return None
    try:
        parsed = urlsplit(value.strip())
    except ValueError:
        return None
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https") or not parsed.hostname:
        return None
    if parsed.username or parsed.password:
        return None
    if parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        return None
    host = parsed.hostname.lower().strip("[]")
    if not host:
        return None
    try:
        port = parsed.port
    except ValueError:
        return None
    if port is None:
        port = 443 if scheme == "https" else 80
    return scheme, host, port


def _tunnel_origin_key() -> tuple[str, str, int] | None:
    try:
        if not Path(DONATIONS_CONFIG_FILE).exists():
            return None
        with open(DONATIONS_CONFIG_FILE, "r", encoding="utf-8") as f:
            config = json.load(f)
        return _origin_key(str(config.get("tunnelUrl", "")))
    except (OSError, ValueError, TypeError):
        return None


def is_origin_allowed(origin: str) -> bool:
    """True solo para el origen local exacto o el túnel configurado exacto.

    Un host de loopback no basta: otro puerto local es otro origen y no debe
    recibir el token ni abrir el WebSocket. El puerto local permitido es el
    puerto real del servidor (``SERVER_PORT``).
    """
    if not origin:
        return True  # clientes no navegador (curl, decks, launcher)
    key = _origin_key(origin)
    if key is None:
        return False
    scheme, host, port = key
    if host in _LOOPBACK_HOSTS:
        return scheme == "http" and port == PORT
    tunnel = _tunnel_origin_key()
    return bool(tunnel and key == tunnel)


def is_local_request(request) -> bool:
    """True si la petición procede del propio equipo y no de un túnel/proxy."""
    if any(h in request.headers for h in ("CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP", "Forwarded")):
        return False
    return request.remote in ("127.0.0.1", "::1", None)


def _request_token(request) -> str:
    supplied = request.headers.get("X-Local-Token") or request.query.get("token")
    if not supplied:
        auth = request.headers.get("Authorization", "")
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            supplied = parts[1]
    return supplied or ""


def is_websocket_allowed(request) -> bool:
    """Autoriza el handshake WS.

    - Navegador: el ``Origin`` debe ser exactamente local o el túnel configurado.
      El navegador no permite falsificar ``Origin``, así que esto bloquea páginas
      externas sin obligar a inyectar el token en cada overlay de OBS.
    - Cliente no navegador (sin Origin): exige token local; los decks y scripts
      pueden enviarlo como ``?token=`` o ``X-Local-Token``.
    """
    origin = request.headers.get("Origin")
    if origin is not None:
        return is_origin_allowed(origin)
    return _request_token(request) == LOCAL_AUTH_TOKEN and is_local_request(request)
