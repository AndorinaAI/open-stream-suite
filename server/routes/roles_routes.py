import json
import aiohttp
from aiohttp import web
from server.config import ROLES_FILE, CLIENT_ID, logger
from server.state import system

async def handle_get_roles(request):
    """Devuelve los roles y funciones oficiales del canal definidos en roles.json"""
    if not ROLES_FILE.exists():
        default_roles = {
            "roles": [
                {
                    "id": "role_artista",
                    "name": "Artista",
                    "color": "#EC4899",
                    "badge": "🎨",
                    "description": "Creadores de arte, emotes y overlays del canal (insignia oficial de Twitch)",
                    "members": []
                },
                {
                    "id": "role_moderador",
                    "name": "Moderador",
                    "color": "#3B82F6",
                    "badge": "🛡️",
                    "description": "Modera el chat y gestiona mensajes en directo",
                    "members": []
                },
                {
                    "id": "role_vip",
                    "name": "VIP",
                    "color": "#8B5CF6",
                    "badge": "💎",
                    "description": "Espectadores destacados con insignia de diamante",
                    "members": []
                },
                {
                    "id": "role_editor",
                    "name": "Editor",
                    "color": "#10B981",
                    "badge": "🎬",
                    "description": "Edita emisiones, títulos, etiquetas y categorías",
                    "members": []
                },
                {
                    "id": "role_moderador_principal",
                    "name": "Moderador principal",
                    "color": "#06B6D4",
                    "badge": "⚔️",
                    "description": "Líder del equipo de moderación del canal",
                    "members": []
                },
                {
                    "id": "role_director_comercial",
                    "name": "Director comercial",
                    "color": "#F59E0B",
                    "badge": "💼",
                    "description": "Gestiona acuerdos comerciales y patrocinios",
                    "members": []
                }
            ]
        }
        with open(ROLES_FILE, "w", encoding="utf-8") as f:
            json.dump(default_roles, f, indent=2, ensure_ascii=False)
        return web.json_response(default_roles)

    try:
        with open(ROLES_FILE, "r", encoding="utf-8") as f:
            return web.json_response(json.load(f))
    except Exception as e:
        return web.json_response({"roles": [], "error": str(e)})

async def handle_save_roles(request):
    """Guarda nuevos roles personalizados en roles.json"""
    data = await request.json()
    with open(ROLES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info("✓ Roles personalizados guardados en roles.json")
    return web.json_response({"status": "ok", "saved": True})

async def handle_get_twitch_mods_and_vips(request):
    """Consulta la lista real de moderadores, VIPs y Editores del canal de Twitch del streamer"""
    if not system.token_data or not system.user_info:
        return web.json_response({"moderators": [], "vips": [], "editors": [], "connected": False, "status": "not_connected"})

    b_id = system.user_info["id"]
    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {system.token_data['access_token']}"
    }

    # Verificar si el token tiene los scopes necesarios para leer funciones
    current_scopes = set(system.token_data.get("scope", []))
    needed_scopes = {"moderation:read", "channel:read:vips", "channel:read:editors"}
    missing = needed_scopes - current_scopes
    if missing:
        logger.warning(f"Faltan scopes en el token de Twitch para leer funciones: {missing}")
        return web.json_response({
            "status": "need_auth",
            "connected": True,
            "missing_scopes": list(missing),
            "auth_url": f"/auth",
            "error": "Twitch requiere que autorices los permisos para leer las Funciones de tu canal (moderadores, VIPs y editores)."
        })

    mods = []
    vips = []
    editors = []
    try:
        async with aiohttp.ClientSession() as session:
            # Moderadores (/helix/moderation/moderators)
            async with session.get(f"https://api.twitch.tv/helix/moderation/moderators?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    d = await resp.json()
                    mods = [m.get("user_login") or m.get("user_name") for m in d.get("data", [])]
                elif resp.status in (401, 403):
                    return web.json_response({
                        "status": "need_auth",
                        "connected": True,
                        "auth_url": f"/auth",
                        "error": "Permisos de Twitch insuficientes para leer moderadores. Por favor reautoriza tu cuenta."
                    })

            # VIPs (/helix/channels/vips)
            async with session.get(f"https://api.twitch.tv/helix/channels/vips?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    d = await resp.json()
                    vips = [v.get("user_login") or v.get("user_name") for v in d.get("data", [])]

            # Editores (/helix/channels/editors)
            async with session.get(f"https://api.twitch.tv/helix/channels/editors?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    d = await resp.json()
                    editors = [e.get("user_login") or e.get("user_name") for e in d.get("data", [])]
    except Exception as e:
        logger.warning(f"Aviso consultando roles de Twitch: {e}")

    return web.json_response({"moderators": mods, "vips": vips, "editors": editors, "connected": True, "status": "ok"})
