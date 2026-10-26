import hmac
import secrets
import time
import urllib.parse
import aiohttp
from aiohttp import web
from server.config import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPES
from server.state import system

_OAUTH_SESSION_COOKIE = "oss_oauth_session"
_OAUTH_STATE_TTL = 600
_OAUTH_SECURE_COOKIE = REDIRECT_URI.startswith("https://")
# state -> {"expires": timestamp, "session": cookie nonce}
_OAUTH_STATES: dict[str, dict] = {}


def _new_oauth_state() -> tuple[str, str]:
    """Crea state y nonce de sesión; ambos se guardan en el servidor."""
    now = time.time()
    for key, data in list(_OAUTH_STATES.items()):
        expires = data.get("expires", 0) if isinstance(data, dict) else data
        if expires < now:
            _OAUTH_STATES.pop(key, None)
    state = secrets.token_urlsafe(32)
    session = secrets.token_urlsafe(32)
    _OAUTH_STATES[state] = {"expires": now + _OAUTH_STATE_TTL, "session": session}
    return state, session


def _consume_oauth_state(state: str, session: str) -> bool:
    """Consume el state una sola vez y exige el nonce de la misma sesión."""
    if not state or not session:
        return False
    data = _OAUTH_STATES.pop(state, None)
    if not isinstance(data, dict):
        return False
    if data.get("expires", 0) < time.time():
        return False
    return hmac.compare_digest(str(data.get("session", "")), str(session))


def _oauth_error(text: str, status: int = 400):
    resp = web.Response(text=text, status=status)
    resp.del_cookie(_OAUTH_SESSION_COOKIE, path="/")
    return resp

async def handle_auth(request):
    """Inicia el flujo OAuth con Twitch"""
    scope_str = "%20".join(SCOPES)
    state, session = _new_oauth_state()
    auth_url = (
        f"https://id.twitch.tv/oauth2/authorize"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
        f"&response_type=code"
        f"&scope={scope_str}"
        f"&state={urllib.parse.quote(state)}"
        f"&force_verify=true"
    )
    resp = web.HTTPFound(auth_url)
    resp.set_cookie(
        _OAUTH_SESSION_COOKIE,
        session,
        max_age=_OAUTH_STATE_TTL,
        httponly=True,
        samesite="Lax",
        secure=_OAUTH_SECURE_COOKIE,
        path="/",
    )
    raise resp

async def handle_callback(request):
    """Procesa el código devuelto por Twitch tras autorizar"""
    code = request.query.get("code")
    state = request.query.get("state", "")
    session = request.cookies.get(_OAUTH_SESSION_COOKIE, "")
    if not code:
        return _oauth_error("Error: No se recibió código de autorización de Twitch.")
    if not _consume_oauth_state(state, session):
        return _oauth_error("Error: state OAuth inválido o caducado. Reinicia el inicio de sesión.")
    
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI
    }

    async with aiohttp.ClientSession() as http_session:
        async with http_session.post(url, data=params) as resp:
            if resp.status == 200:
                token_data = await resp.json()
                system.save_token(token_data)
                await system.fetch_user_info()
                success = web.HTTPFound("/alerts/panel.html?auth=success")
                success.del_cookie(_OAUTH_SESSION_COOKIE, path="/")
                raise success
            else:
                err_text = await resp.text()
                return _oauth_error(f"Error al canjear token con Twitch: {err_text}")

async def handle_logout(request):
    """Cierra la sesión de Twitch, borra token.json y limpia el estado"""
    system.clear_token()
    return web.json_response({
        "status": "ok",
        "message": "Sesión de Twitch cerrada correctamente"
    })
