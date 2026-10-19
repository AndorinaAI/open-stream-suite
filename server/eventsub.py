import asyncio
import json
import aiohttp
from server.config import CLIENT_ID, logger

async def subscribe_eventsub(system, session_id):
    """Suscribe a todos los eventos requeridos con el session_id de WebSocket"""
    if not system.user_info or not system.token_data:
        return
    user_id = system.user_info["id"]
    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {system.token_data['access_token']}",
        "Content-Type": "application/json"
    }
    
    subscriptions = [
        # 1. Follows
        {
            "type": "channel.follow",
            "version": "2",
            "condition": {"broadcaster_user_id": user_id, "moderator_user_id": user_id}
        },
        # 2. Suscripciones
        {
            "type": "channel.subscribe",
            "version": "1",
            "condition": {"broadcaster_user_id": user_id}
        },
        # 3. Mensajes de resub
        {
            "type": "channel.subscription.message",
            "version": "1",
            "condition": {"broadcaster_user_id": user_id}
        },
        # 4. Bits / Cheers
        {
            "type": "channel.cheer",
            "version": "1",
            "condition": {"broadcaster_user_id": user_id}
        },
        # 5. Puntos de canal (TriggerFyre)
        {
            "type": "channel.channel_points_custom_reward_redemption.add",
            "version": "1",
            "condition": {"broadcaster_user_id": user_id}
        },
        # 6. Raids
        {
            "type": "channel.raid",
            "version": "1",
            "condition": {"to_broadcaster_user_id": user_id}
        }
    ]

    async with aiohttp.ClientSession() as session:
        for sub in subscriptions:
            body = {
                "type": sub["type"],
                "version": sub["version"],
                "condition": sub["condition"],
                "transport": {
                    "method": "websocket",
                    "session_id": session_id
                }
            }
            async with session.post("https://api.twitch.tv/helix/eventsub/subscriptions", headers=headers, json=body) as resp:
                res_json = await resp.json()
                if resp.status in (200, 202):
                    logger.info(f"✓ EventSub suscrito con éxito: {sub['type']}")
                else:
                    logger.warning(f"Aviso en suscripción {sub['type']}: {res_json.get('message', res_json)}")

async def handle_twitch_event(system, payload):
    """Procesa un evento de Twitch y lo traduce a una alerta visual"""
    sub_type = payload.get("subscription", {}).get("type")
    event = payload.get("event", {})
    logger.info(f"🎯 Evento recibido de Twitch: {sub_type}")

    # 1. Nuevo Follow
    if sub_type == "channel.follow":
        await system.broadcast({
            "type": "follow",
            "user": event.get("user_name", "Alguien"),
            "title": "¡NUEVO SEGUIDOR!",
            "message": "Se une a la comunidad del taller",
            "accent": "#57D6C4"
        })

    # 2. Nueva Suscripción
    elif sub_type in ("channel.subscribe", "channel.subscription.message"):
        tier = event.get("tier", "1000")
        tier_name = "Nivel 1" if tier == "1000" else ("Nivel 2" if tier == "2000" else "Nivel 3")
        await system.broadcast({
            "type": "sub",
            "user": event.get("user_name", "Alguien"),
            "title": "¡NUEVA SUSCRIPCIÓN!",
            "message": f"Suscrito con {tier_name}" + (f': "{event.get("message", {}).get("text", "")}"' if event.get("message") else ""),
            "accent": "#FF783F"
        })

    # 3. Bits / Cheers
    elif sub_type == "channel.cheer":
        bits = event.get("bits", 0)
        await system.broadcast({
            "type": "bits",
            "user": event.get("user_name", "Anónimo"),
            "bits": bits,
            "title": f"¡{bits} BITS!",
            "message": event.get("message", ""),
            "accent": "#F59E0B"
        })

    # 4. Puntos de canal (TriggerFyre)
    elif sub_type == "channel.channel_points_custom_reward_redemption.add":
        reward_title = event.get("reward", {}).get("title", "")
        user_name = event.get("user_name", "")
        user_input = event.get("user_input", "")
        logger.info(f"💎 Canjeo de Puntos de Canal: '{reward_title}' por {user_name}")

        trigger = system.find_trigger_by_reward(reward_title)
        if trigger:
            await system.dispatch_trigger(trigger, user_name, reason="points")
        else:
            await system.broadcast({
                "type": "channel_points",
                "user": user_name,
                "title": reward_title,
                "message": user_input or "Canjeo de puntos",
                "accent": "#89B4FA"
            })

    # 5. Raid
    elif sub_type == "channel.raid":
        viewers = event.get("viewers", 0)
        await system.broadcast({
            "type": "raid",
            "user": event.get("from_broadcaster_user_name", "Alguien"),
            "viewers": viewers,
            "title": f"¡RAID DE {viewers} PERSONAS!",
            "message": "¡Bienvenidos al taller!",
            "accent": "#EC4899"
        })

async def run_eventsub(system):
    """Bucle principal de conexión WebSocket a Twitch EventSub"""
    ws_url = "wss://eventsub.wss.twitch.tv/ws"
    while system.running:
        if not system.token_data:
            await asyncio.sleep(3)
            continue
        
        if not system.user_info:
            await system.fetch_user_info()
            if not system.user_info:
                await asyncio.sleep(5)
                continue

        try:
            logger.info(f"Conectando a Twitch EventSub WebSocket ({ws_url})...")
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(ws_url) as ws:
                    system.eventsub_ws = ws
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            data = json.loads(msg.data)
                            msg_type = data.get("metadata", {}).get("message_type")

                            # Mensaje de bienvenida inicial
                            if msg_type == "session_welcome":
                                system.session_id = data["payload"]["session"]["id"]
                                logger.info(f"✓ Sesión EventSub establecida (ID: {system.session_id[:8]}...)")
                                await subscribe_eventsub(system, system.session_id)

                            # Mensaje de reconexión
                            elif msg_type == "session_reconnect":
                                ws_url = data["payload"]["session"]["reconnect_url"]
                                logger.info(f"Reconexión solicitada por Twitch a: {ws_url}")
                                break

                            # Notificación de evento real de Twitch
                            elif msg_type == "notification":
                                await handle_twitch_event(system, data["payload"])

                            elif msg_type == "session_keepalive":
                                pass

                        elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                            break
        except Exception as e:
            logger.error(f"Error en EventSub WebSocket: {e}")
            await asyncio.sleep(5)
