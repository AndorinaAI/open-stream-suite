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

    from server.routes.alerts_routes import format_alert_event

    # 1. Nuevo Follow
    if sub_type == "channel.follow":
        payload = format_alert_event("follow", {
            "user": event.get("user_name", "Alguien"),
            "title": "¡NUEVO SEGUIDOR!",
            "message": "Se une a la comunidad del stream"
        })
        if payload:
            await system.broadcast(payload)

    # 2. Suscripciones (T1, T2, T3, Prime, Resub, Regalos)
    elif sub_type in ("channel.subscribe", "channel.subscription.message", "channel.subscription.gift", "channel.subscription.community_gift"):
        user_name = event.get("user_name", "Alguien")
        tier_code = str(event.get("tier", "1000"))
        tier_label = "Nivel 1" if tier_code == "1000" else ("Nivel 2" if tier_code == "2000" else ("Nivel 3" if tier_code == "3000" else "Twitch Prime"))
        months = event.get("cumulative_months") or event.get("streak_months") or 1
        sub_msg = event.get("message", {}).get("text", "") if isinstance(event.get("message"), dict) else str(event.get("message") or "")

        if sub_type == "channel.subscription.gift":
            alert_type = "sub_gift"
        elif sub_type == "channel.subscription.community_gift":
            alert_type = "sub_community_gift"
        elif tier_code == "Prime" or event.get("is_prime"):
            alert_type = "sub_prime"
        elif months > 1:
            alert_type = "resub"
        elif tier_code == "2000":
            alert_type = "sub_t2"
        elif tier_code == "3000":
            alert_type = "sub_t3"
        else:
            alert_type = "sub_t1"

        payload = format_alert_event(alert_type, {
            "user": user_name,
            "months": months,
            "tier": tier_label,
            "message": sub_msg,
            "recipient": event.get("recipient_user_name", "Alguien"),
            "count": event.get("total", 5)
        })
        if payload:
            await system.broadcast(payload)

    # 3. Bits / Cheers
    elif sub_type == "channel.cheer":
        bits = event.get("bits", 0)
        payload = format_alert_event("cheer", {
            "user": event.get("user_name", "Anónimo"),
            "bits": bits,
            "message": event.get("message", "")
        })
        if payload:
            await system.broadcast(payload)

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
                "type": "custom_alert",
                "alertType": "channel_points",
                "user": user_name,
                "title": reward_title,
                "message": user_input or "Canjeo de puntos",
                "accentColor": "#89B4FA",
                "mediaMode": "banner",
                "bannerStyle": "glassmorphism",
                "bannerIcon": "star",
                "duration": 5000,
                "animationIn": "pop",
                "animationOut": "fade"
            })

    # 5. Raid
    elif sub_type == "channel.raid":
        viewers = event.get("viewers", 0)
        payload = format_alert_event("raid", {
            "user": event.get("from_broadcaster_user_name", "Alguien"),
            "viewers": viewers,
            "message": "¡Bienvenidos al stream!"
        })
        if payload:
            await system.broadcast(payload)

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
