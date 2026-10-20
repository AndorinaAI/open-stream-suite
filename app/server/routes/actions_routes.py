import asyncio
import aiohttp
from aiohttp import web
from server.config import CLIENT_ID, logger
from server.state import system

async def handle_status(request):
    """Devuelve el estado de conexión del sistema en JSON"""
    return web.json_response({
        "twitch_connected": bool(system.user_info),
        "user": system.user_info,
        "connected_obs_clients": len(system.connected_clients)
    })

async def handle_test_alert(request):
    """Endpoint REST para lanzar alertas de prueba"""
    data = await request.json()
    spec_act = data.get("special_action", "none")
    if spec_act and spec_act != "none":
        asyncio.create_task(system.execute_special_action(spec_act, data.get("special_action_param", ""), data.get("user", "Streamer")))
    await system.broadcast(data)
    return web.json_response({"status": "ok", "dispatched": data})

async def handle_explode_emotes(request):
    """Lanza una explosión de emoticonos en OBS"""
    data = await request.json()
    emoji = data.get("emoji", "🎉")
    count = data.get("count", 40)
    await system.broadcast({"type": "explode_emotes", "emoji": emoji, "count": count})
    return web.json_response({"status": "ok", "exploded": emoji})

async def handle_timer_control(request):
    """Controla el temporizador del stream en OBS (start, pause, reset, set)"""
    data = await request.json()
    action = data.get("action", "start")
    seconds = data.get("seconds", 300)
    title = data.get("title", "TEMPORIZADOR STREAM")
    payload = {
        "type": "timer_control",
        "action": action,
        "seconds": seconds,
        "title": title
    }
    await system.broadcast(payload)
    return web.json_response({"status": "ok", "timer": payload})

async def handle_shoutout(request):
    """Lanza una tarjeta holográfica de shoutout para otro streamer"""
    data = await request.json()
    streamer = data.get("streamer", "").strip().lower()
    display_name = data.get("display_name", streamer)
    game = data.get("game", "")
    avatar = data.get("avatar", "")

    # Si tenemos token y no tenemos avatar, intentar consultar Helix
    if streamer and not avatar and system.token_data:
        try:
            headers = {
                "Client-Id": CLIENT_ID,
                "Authorization": f"Bearer {system.token_data.get('access_token')}"
            }
            async with aiohttp.ClientSession() as session:
                async with session.get(f"https://api.twitch.tv/helix/users?login={streamer}", headers=headers) as resp:
                    if resp.status == 200:
                        u_data = await resp.json()
                        if u_data.get("data"):
                            u = u_data["data"][0]
                            display_name = u.get("display_name", streamer)
                            avatar = u.get("profile_image_url", "")
                            
                            # Consultar juego/categoría actual del streamer
                            async with session.get(f"https://api.twitch.tv/helix/channels?broadcaster_id={u['id']}", headers=headers) as c_resp:
                                if c_resp.status == 200:
                                    c_data = await c_resp.json()
                                    if c_data.get("data"):
                                        game = c_data["data"][0].get("game_name", "")
        except Exception as e:
            logger.warning(f"No se pudo consultar Twitch Helix para shoutout: {e}")

    payload = {
        "type": "shoutout",
        "streamer": streamer,
        "display_name": display_name or streamer or "Streamer Amigo",
        "game": game or "Cacharreo & Directos",
        "avatar": avatar or "https://static-cdn.jtvnw.net/jtv_user_pictures/e33e6764-4631-48b0-9f1d-4cc6e5afc6fd-profile_image-300x300.png",
        "duration": data.get("duration", 8000)
    }
    await system.broadcast(payload)
    return web.json_response({"status": "ok", "shoutout": payload})

async def handle_theme_switch(request):
    """Cambia el tema visual en vivo para todas las escenas y widgets conectados en OBS"""
    data = await request.json()
    theme = data.get("theme", "maker")
    await system.broadcast({"type": "theme_change", "theme": theme})
    logger.info(f"🎨 Tema cambiado a: {theme}")
    return web.json_response({"status": "ok", "theme": theme})

async def handle_play_sound(request):
    """Reproduce un efecto de sonido directamente en OBS"""
    data = await request.json()
    sound_url = data.get("sound_url", "")
    volume = data.get("volume", 0.8)
    await system.broadcast({"type": "sound", "sound_url": sound_url, "volume": volume})
    return web.json_response({"status": "ok", "sound": sound_url})
