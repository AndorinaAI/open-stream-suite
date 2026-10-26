import aiohttp
from aiohttp import web
from server.config import CLIENT_ID, logger
from server.routes.errors import internal_error_response, invalid_json_response
from server.state import system

async def handle_get_twitch_rewards(request):
    """Obtiene las recompensas de puntos de canal reales del streamer en Twitch"""
    if not system.token_data:
        return web.json_response({"rewards": [], "connected": False, "error": "No hay token de Twitch guardado"})
    
    if not system.user_info:
        await system.fetch_user_info()
    
    if not system.user_info:
        return web.json_response({"rewards": [], "connected": False, "error": "No se pudo obtener información del usuario"})

    broadcaster_id = system.user_info["id"]
    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {system.token_data.get('access_token')}"
    }
    url = f"https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id={broadcaster_id}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    rewards = []
                    for r in data.get("data", []):
                        rewards.append({
                            "id": r.get("id"),
                            "title": r.get("title"),
                            "cost": r.get("cost"),
                            "color": r.get("background_color", "#57D6C4"),
                            "enabled": r.get("is_enabled", True),
                            "prompt": r.get("prompt", "")
                        })
                    return web.json_response({"rewards": rewards, "connected": True})
                elif resp.status == 401:
                    if await system.refresh_access_token():
                        return await handle_get_twitch_rewards(request)
                err_text = await resp.text()
                return web.json_response({"rewards": [], "connected": False, "error": err_text})
    except Exception as e:
        logger.exception(f"Error consultando custom rewards de Twitch: {e}")
        return web.json_response({"rewards": [], "connected": False, "error": "No se pudieron consultar las recompensas en Twitch"})

async def handle_create_twitch_reward(request):
    """Crea una nueva recompensa de puntos de canal directamente en la cuenta de Twitch del streamer"""
    if not system.token_data or not system.user_info:
        return web.json_response({"error": "No conectado con Twitch"}, status=401)

    # V3-08: cuerpo inválido → 400 (antes `await request.json()` sin `try` daba 500).
    try:
        data = await request.json()
    except Exception:
        return invalid_json_response()
    if not isinstance(data, dict):
        return invalid_json_response()

    title = str(data.get("title", "")).strip()
    try:
        cost = int(data.get("cost", 100) or 100)
    except (TypeError, ValueError):
        return web.json_response({"error": "El coste debe ser un número entero"}, status=400)
    if cost < 1:
        return web.json_response({"error": "El coste debe ser mayor que 0"}, status=400)
    prompt = str(data.get("prompt", "")).strip()
    color = data.get("background_color", "#57D6C4")

    if not title:
        return web.json_response({"error": "El título es obligatorio"}, status=400)

    broadcaster_id = system.user_info["id"]
    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {system.token_data['access_token']}",
        "Content-Type": "application/json"
    }
    body = {
        "title": title,
        "cost": cost,
        "prompt": prompt,
        "is_enabled": True,
        "background_color": color,
        "is_user_input_required": False
    }

    url = f"https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id={broadcaster_id}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=body) as resp:
                res_data = await resp.json()
                if resp.status in (200, 201):
                    logger.info(f"✓ Recompensa de Twitch creada con éxito: {title} ({cost} pts)")
                    return web.json_response({"status": "ok", "reward": res_data.get("data", [{}])[0]})
                elif resp.status in (401, 403):
                    return web.json_response({
                        "status": "need_auth",
                        "message": "Falta el permiso 'channel:manage:redemptions'. Haz clic en Conectar con Twitch para concederlo en 1 segundo.",
                        "auth_url": "/auth"
                    }, status=403)
                else:
                    return web.json_response({"error": res_data.get("message", "Error al crear recompensa en Twitch")}, status=resp.status)
    except Exception as e:
        return internal_error_response("creando la recompensa en Twitch", e)

async def handle_update_twitch_reward(request):
    """Actualiza una recompensa de puntos de canal existente en Twitch vía Helix API"""
    if not system.token_data or not system.user_info:
        return web.json_response({"status": "need_auth", "error": "No hay token de Twitch guardado", "auth_url": "/auth"}, status=401)

    broadcaster_id = system.user_info["id"]
    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {system.token_data.get('access_token')}",
        "Content-Type": "application/json"
    }

    try:
        data = await request.json()
    except Exception:
        return invalid_json_response()
    if not isinstance(data, dict):
        return invalid_json_response()

    reward_id = data.get("id")
    if not reward_id:
        return web.json_response({"status": "error", "error": "Falta el ID de la recompensa"}, status=400)

    url = f"https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id={broadcaster_id}&id={reward_id}"

    payload = {}
    if "title" in data and data["title"]:
        payload["title"] = str(data["title"]).strip()
    if "cost" in data and data["cost"] is not None:
        try:
            payload["cost"] = int(data["cost"])
        except (TypeError, ValueError):
            return web.json_response({"status": "error", "error": "El coste debe ser un número entero"}, status=400)
    if "prompt" in data:
        payload["prompt"] = str(data["prompt"]).strip()
    if "is_enabled" in data:
        payload["is_enabled"] = bool(data["is_enabled"])
    if "background_color" in data and data["background_color"]:
        bg = str(data["background_color"]).strip()
        if not bg.startswith("#"):
            bg = f"#{bg}"
        payload["background_color"] = bg

    try:
        async with aiohttp.ClientSession() as session:
            async with session.patch(url, headers=headers, json=payload) as resp:
                res_data = await resp.json()
                if resp.status == 200:
                    logger.info(f"✓ Recompensa de Twitch actualizada: {payload.get('title', reward_id)}")
                    return web.json_response({"status": "ok", "reward": res_data.get("data", [{}])[0]})
                elif resp.status in (401, 403):
                    return web.json_response({
                        "status": "need_auth",
                        "error": "Falta el permiso 'channel:manage:redemptions'. Haz clic en Conectar Twitch para autorizarlo.",
                        "auth_url": "/auth"
                    }, status=403)
                else:
                    return web.json_response({"status": "error", "error": res_data.get("message", "Error al actualizar recompensa")}, status=resp.status)
    except Exception as e:
        return internal_error_response("actualizando la recompensa en Twitch", e, with_status_key=True)

async def handle_delete_twitch_reward(request):
    """Elimina una recompensa de puntos de canal en Twitch vía Helix API"""
    if not system.token_data or not system.user_info:
        return web.json_response({"status": "need_auth", "auth_url": "/auth"}, status=401)

    broadcaster_id = system.user_info["id"]
    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {system.token_data.get('access_token')}"
    }

    try:
        data = await request.json()
    except Exception:
        return invalid_json_response()
    if not isinstance(data, dict):
        return invalid_json_response()

    reward_id = data.get("id")
    if not reward_id:
        return web.json_response({"status": "error", "error": "Falta el ID de la recompensa"}, status=400)

    url = f"https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id={broadcaster_id}&id={reward_id}"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.delete(url, headers=headers) as resp:
                if resp.status in (200, 204):
                    logger.info(f"✓ Recompensa de Twitch eliminada: {reward_id}")
                    return web.json_response({"status": "ok", "deleted": reward_id})
                elif resp.status in (401, 403):
                    return web.json_response({"status": "need_auth", "auth_url": "/auth"}, status=403)
                err_text = await resp.text()
                return web.json_response({"status": "error", "error": err_text}, status=resp.status)
    except Exception as e:
        return internal_error_response("eliminando la recompensa en Twitch", e, with_status_key=True)
