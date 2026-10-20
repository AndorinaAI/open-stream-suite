import urllib.parse
import aiohttp
from aiohttp import web
from server.config import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPES
from server.state import system

async def handle_auth(request):
    """Inicia el flujo OAuth con Twitch"""
    scope_str = "%20".join(SCOPES)
    auth_url = (
        f"https://id.twitch.tv/oauth2/authorize"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
        f"&response_type=code"
        f"&scope={scope_str}"
        f"&force_verify=true"
    )
    raise web.HTTPFound(auth_url)

async def handle_callback(request):
    """Procesa el código devuelto por Twitch tras autorizar"""
    code = request.query.get("code")
    if not code:
        return web.Response(text="Error: No se recibió código de autorización de Twitch.", status=400)
    
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=params) as resp:
            if resp.status == 200:
                token_data = await resp.json()
                system.save_token(token_data)
                await system.fetch_user_info()
                raise web.HTTPFound("/alerts/panel.html?auth=success")
            else:
                err_text = await resp.text()
                return web.Response(text=f"Error al canjear token con Twitch: {err_text}", status=400)

async def handle_logout(request):
    """Cierra la sesión de Twitch, borra token.json y limpia el estado"""
    system.clear_token()
    return web.json_response({
        "status": "ok",
        "message": "Sesión de Twitch cerrada correctamente"
    })
