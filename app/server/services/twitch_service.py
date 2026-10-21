"""
Servicio para interacciones con la API Helix de Twitch y acciones especiales interactivas.
"""

import asyncio
import aiohttp
from server.config import CLIENT_ID, CLIENT_SECRET, logger


async def refresh_access_token(token_data: dict, save_token_cb=None) -> bool:
    """Refresca el token OAuth de Twitch si ha expirado."""
    if not token_data or "refresh_token" not in token_data:
        return False

    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "grant_type": "refresh_token",
        "refresh_token": token_data["refresh_token"],
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    token_data.update(data)
                    if save_token_cb:
                        save_token_cb(token_data)
                    logger.info("✓ Token de Twitch renovado con éxito.")
                    return True
                else:
                    text = await resp.text()
                    logger.error(f"Fallo al renovar token: {text}")
                    return False
    except Exception as e:
        logger.error(f"Excepción al renovar token de Twitch: {e}")
        return False


async def fetch_user_info(token_data: dict, refresh_cb=None):
    """Obtiene la información del usuario del canal autenticado."""
    if not token_data or "access_token" not in token_data:
        return None

    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {token_data.get('access_token')}"
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("https://api.twitch.tv/helix/users", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("data"):
                        user_info = data["data"][0]
                        logger.info(f"✓ Canal conectado: {user_info['display_name']} (ID: {user_info['id']})")
                        return user_info
                elif resp.status == 401:
                    logger.warning("Token expirado, intentando renovar...")
                    if refresh_cb and await refresh_cb():
                        return await fetch_user_info(token_data, refresh_cb=None)
    except Exception as e:
        logger.error(f"Error consultando info de usuario en Helix: {e}")
    return None


async def set_twitch_chat_setting(token_data: dict, user_info: dict, settings: dict) -> bool:
    """Cambia ajustes de chat en Twitch (modo emotes, modo lento, modo subs) vía Helix API."""
    if not token_data or not user_info:
        return False
    b_id = user_info.get("id")
    if not b_id:
        return False

    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {token_data.get('access_token')}",
        "Content-Type": "application/json"
    }
    url = f"https://api.twitch.tv/helix/chat/settings?broadcaster_id={b_id}&moderator_id={b_id}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.patch(url, headers=headers, json=settings) as resp:
                if resp.status == 200:
                    logger.info(f"✓ Ajuste de chat Twitch aplicado: {settings}")
                    return True
                elif resp.status in (401, 403):
                    logger.warning(f"Aviso: Falta permiso moderator:manage:chat_settings en token ({resp.status})")
                    return False
    except Exception as e:
        logger.error(f"Error cambiando chat setting en Twitch: {e}")
    return False


async def clear_twitch_chat(token_data: dict, user_info: dict) -> bool:
    """Limpia el chat de Twitch vía Helix API."""
    if not token_data or not user_info:
        return False
    b_id = user_info.get("id")
    if not b_id:
        return False

    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {token_data.get('access_token')}"
    }
    url = f"https://api.twitch.tv/helix/moderation/chat?broadcaster_id={b_id}&moderator_id={b_id}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.delete(url, headers=headers) as resp:
                return resp.status in (200, 204)
    except Exception as e:
        logger.error(f"Error limpiando chat en Twitch: {e}")
    return False


async def send_helix_chat_message(token_data: dict, user_info: dict, message: str) -> bool:
    """Envía un mensaje al chat de Twitch usando Helix API."""
    if not token_data or not user_info:
        logger.warning("No hay sesión OAuth activa con Twitch; mensaje emitido localmente")
        return False

    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {token_data.get('access_token')}",
        "Content-Type": "application/json"
    }
    body = {
        "broadcaster_id": user_info.get("id"),
        "sender_id": user_info.get("id"),
        "message": message
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post("https://api.twitch.tv/helix/chat/messages", headers=headers, json=body) as resp:
                if resp.status == 200:
                    logger.info(f"💬 Mensaje enviado al chat de Twitch: {message}")
                    return True
                else:
                    text = await resp.text()
                    logger.warning(f"Aviso al enviar mensaje Helix ({resp.status}): {text}")
    except Exception as e:
        logger.error(f"Excepción al enviar mensaje a Twitch: {e}")
    return False


async def execute_special_action(action: str, param: str, user_name: str, broadcast_cb, set_chat_setting_cb=None, clear_chat_cb=None):
    """Ejecuta acciones interactivas en Twitch (Helix) o en el Overlay de OBS."""
    try:
        logger.info(f"🎯 Ejecutando acción especial: {action} (param: {param}) por {user_name}")

        if action == "overlay_explode_emotes":
            emoji = param or "🎉"
            await broadcast_cb({"type": "explode_emotes", "emoji": emoji, "count": 45})

        elif action == "overlay_timer_add":
            seconds = int(param) if str(param).isdigit() else 60
            await broadcast_cb({"type": "timer_control", "action": "add", "seconds": seconds})
            await broadcast_cb({
                "type": "chat_notification",
                "text": f"⏱️ ¡{user_name} ha añadido +{seconds}s al temporizador del stream!"
            })

        elif action == "twitch_emote_only":
            duration = int(param) if str(param).isdigit() else 60
            if set_chat_setting_cb:
                await set_chat_setting_cb({"emote_mode": True})
            await broadcast_cb({
                "type": "chat_notification",
                "text": f"💬 ¡{user_name} activó el Modo Solo Emoticonos ({duration}s)!"
            })
            await asyncio.sleep(duration)
            if set_chat_setting_cb:
                await set_chat_setting_cb({"emote_mode": False})
            await broadcast_cb({
                "type": "chat_notification",
                "text": "💬 El chat de Twitch vuelve a modo normal."
            })

        elif action == "twitch_slow_mode":
            duration = 60
            wait_time = int(param) if str(param).isdigit() else 15
            if set_chat_setting_cb:
                await set_chat_setting_cb({"slow_mode": True, "slow_mode_wait_time": wait_time})
            await broadcast_cb({
                "type": "chat_notification",
                "text": f"🐢 ¡{user_name} activó Modo Lento ({wait_time}s entre mensajes)!"
            })
            await asyncio.sleep(duration)
            if set_chat_setting_cb:
                await set_chat_setting_cb({"slow_mode": False})
            await broadcast_cb({
                "type": "chat_notification",
                "text": "🐢 Modo Lento desactivado."
            })

        elif action == "twitch_sub_only":
            duration = int(param) if str(param).isdigit() else 60
            if set_chat_setting_cb:
                await set_chat_setting_cb({"subscriber_mode": True})
            await broadcast_cb({
                "type": "chat_notification",
                "text": f"⭐ ¡{user_name} activó el Modo Solo Suscriptores ({duration}s)!"
            })
            await asyncio.sleep(duration)
            if set_chat_setting_cb:
                await set_chat_setting_cb({"subscriber_mode": False})
            await broadcast_cb({
                "type": "chat_notification",
                "text": "⭐ Modo Solo Suscriptores desactivado."
            })

        elif action == "twitch_clear_chat":
            if clear_chat_cb:
                await clear_chat_cb()
            await broadcast_cb({
                "type": "chat_notification",
                "text": f"🧹 ¡{user_name} ha limpiado el chat de Twitch!"
            })

    except Exception as e:
        logger.error(f"Error ejecutando acción especial {action}: {e}")
