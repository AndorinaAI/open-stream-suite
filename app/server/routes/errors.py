"""Respuestas de error homogéneas para las rutas HTTP (V3-05, V3-08).

* `invalid_json_response()` → **400 controlado** cuando el cuerpo no es JSON
  válido (antes `await request.json()` sin `try` rompía con un 500).
* `internal_error_response()` / `internal_error_text()` → **500 genérico**: el
  detalle se queda en el log interno y nunca viaja al cliente. Antes varias rutas
  devolvían `str(e)`, filtrando trazas de aiohttp/Twitch y rutas de disco
  (visible fuera de la máquina en los webhooks públicos).
"""
from aiohttp import web

from server.config import logger

INTERNAL_ERROR_MESSAGE = "Error interno del servidor"
INVALID_JSON_MESSAGE = "Payload JSON inválido"


def invalid_json_response(*, with_status_key: bool = False):
    """400 para cuerpos que no son JSON válido."""
    payload = {"error": INVALID_JSON_MESSAGE}
    if with_status_key:
        payload["status"] = "error"
    return web.json_response(payload, status=400)


def invalid_json_text():
    """400 en texto plano (webhooks que no consumen JSON)."""
    return web.Response(text=INVALID_JSON_MESSAGE, status=400)


def internal_error_response(context: str, error: Exception, *, with_status_key: bool = False):
    """500 genérico: el error real solo se registra en el log interno."""
    logger.exception(f"Error interno en {context}: {error}")
    payload = {"error": INTERNAL_ERROR_MESSAGE}
    if with_status_key:
        payload["status"] = "error"
    return web.json_response(payload, status=500)


def internal_error_text(context: str, error: Exception):
    """500 genérico en texto plano (webhooks de plataformas externas)."""
    logger.exception(f"Error interno en {context}: {error}")
    return web.Response(text=INTERNAL_ERROR_MESSAGE, status=500)
