"""Acciones y disparos de promociones y shoutouts."""
import time
import aiohttp
from aiohttp import web
from server.config import CLIENT_ID, logger
from server.state import system
from server.services.widgets_service import load_widgets_config, save_widgets_config

async def handle_promo_action(action, params):
    if action == "get_history":
        if not hasattr(system, "recent_promos"):
            system.recent_promos = []
        return web.json_response({"status": "ok", "history": system.recent_promos})

    elif action == "clear_history":
        system.recent_promos = []
        return web.json_response({"status": "ok", "history": []})

    # Disparo o repetición de promoción (streamer shoutout, producto maker, redes o personalizada)
    promo_type = params.get("type", "shoutout")
    streamer = params.get("streamer", "").strip().lower().lstrip("@")
    display_name = params.get("display_name", params.get("title", ""))
    title = params.get("title", "")
    subtitle = params.get("subtitle", "")
    message = params.get("message", "")
    eyebrow = params.get("eyebrow", "")
    price = params.get("price", "")
    link = params.get("link", "")
    avatar = params.get("avatar", "")
    image_url = params.get("image_url", params.get("media_url", ""))
    clip_url = params.get("clip_url", "")
    clip_embed_url = params.get("clip_embed_url", "")
    clip_slug = params.get("clip_slug", "")
    play_clip = params.get("play_clip", False)
    animation = params.get("animation", "slide_up")
    custom_styles = params.get("styles", {})

    # Leer configuración persistente para herencia de estilos
    cfg = load_widgets_config()
    promo_cfg = cfg.get("promo", {})
    same_style_as_chat = params.get("inherit_chat_styles", promo_cfg.get("sameStyleAsChat", False))
    chat_styles = (cfg.get("chat", {}).get("styles", {})) if same_style_as_chat else {}

    # Si es promo de streamer y faltan datos, intentar consultar Twitch Helix
    if promo_type == "shoutout" and streamer and system.token_data and CLIENT_ID:
        try:
            headers = {
                "Client-Id": CLIENT_ID,
                "Authorization": f"Bearer {system.token_data.get('access_token')}"
            }
            async with aiohttp.ClientSession() as session:
                # 1. Info usuario
                async with session.get(f"https://api.twitch.tv/helix/users?login={streamer}", headers=headers) as resp:
                    if resp.status == 200:
                        u_data = await resp.json()
                        if u_data.get("data") and len(u_data["data"]) > 0:
                            u = u_data["data"][0]
                            if not display_name or display_name == streamer:
                                display_name = u.get("display_name", streamer)
                            if not avatar:
                                avatar = u.get("profile_image_url", "")
                            broadcaster_id = u.get("id")

                            # 2. Juego actual si no se indicó
                            if not subtitle:
                                async with session.get(f"https://api.twitch.tv/helix/channels?broadcaster_id={broadcaster_id}", headers=headers) as c_resp:
                                    if c_resp.status == 200:
                                        c_data = await c_resp.json()
                                        if c_data.get("data") and len(c_data["data"]) > 0:
                                            subtitle = c_data["data"][0].get("game_name", "")

                            # 3. Si se solicita clip y no se proporcionó uno específico, consultar clip top
                            if play_clip and not clip_url and not clip_embed_url:
                                async with session.get(f"https://api.twitch.tv/helix/clips?broadcaster_id={broadcaster_id}&first=1", headers=headers) as cl_resp:
                                    if cl_resp.status == 200:
                                        cl_data = await cl_resp.json()
                                        if cl_data.get("data") and len(cl_data["data"]) > 0:
                                            top_clip = cl_data["data"][0]
                                            clip_url = top_clip.get("url", "")
                                            clip_embed_url = top_clip.get("embed_url", "")
                                            clip_slug = top_clip.get("id", "")
        except Exception as e:
            logger.warning(f"Error consultando Helix en trigger promo: {e}")

    # Generar enlace predeterminado para streamer si no tiene
    if not link and streamer:
        link = f"https://twitch.tv/{streamer}"

    color = params.get("color")
    if not color:
        color = chat_styles.get("borderColor") if same_style_as_chat else "#57D6C4"

    payload = {
        "type": "shoutout",
        "promo_type": promo_type,
        "streamer": streamer,
        "display_name": display_name or streamer or title or "Promoción",
        "title": title or display_name or streamer or "Promoción",
        "subtitle": subtitle or params.get("game", ""),
        "game": subtitle or params.get("game", ""),
        "message": message,
        "eyebrow": eyebrow,
        "price": price,
        "link": link,
        "qr_data": params.get("qr_data", link),
        "qr_type": params.get("qr_type", "url"),
        "qr_logo": params.get("qr_logo", "none"),
        "qr_label": params.get("qr_label", "📱 ESCANEAR"),
        "show_qr": params.get("show_qr", True),
        "avatar": avatar,
        "image_url": image_url,
        "clip_url": clip_url,
        "clip_embed_url": clip_embed_url,
        "clip_slug": clip_slug,
        "play_clip": play_clip,
        "animation": animation,
        "styles": custom_styles,
        "inherit_chat_styles": same_style_as_chat,
        "chat_styles": chat_styles,
        "color": color,
        "duration": params.get("duration", promo_cfg.get("duration", 8000))
    }

    # Registrar en el historial de la sesión
    if not hasattr(system, "recent_promos"):
        system.recent_promos = []
    hist_entry = {
        "id": "promo_" + str(int(time.time() * 1000)),
        "timestamp": time.strftime("%H:%M:%S"),
        **payload
    }
    system.recent_promos.insert(0, hist_entry)
    if len(system.recent_promos) > 30:
        system.recent_promos.pop()

    await system.broadcast(payload)
    logger.info(f"📢 Promoción emitida a OBS: {payload.get('display_name')} (Tipo: {promo_type})")
    return web.json_response({"status": "ok", "action": "promote", "widget": "promo", "payload": payload, "history": system.recent_promos})


async def handle_irc_promo_command(system, requester, args):
    """Procesa el comando !promo o !so de chat para promocionar a un canal con tarjeta, clip opcional y estilos de chat."""
    parts = args.split(None, 1)
    target_user = parts[0].lstrip("@").strip().lower()
    custom_msg = parts[1].strip() if len(parts) > 1 else ""

    if not target_user:
        return

    logger.info(f"📢 Comando chat !promo recibido de {requester} para: {target_user}")

    display_name = target_user
    avatar = "https://static-cdn.jtvnw.net/jtv_user_pictures/e33e6764-4631-48b0-9f1d-4cc6e5afc6fd-profile_image-300x300.png"
    game = ""
    clip_url = ""
    clip_embed_url = ""
    clip_slug = ""
    broadcaster_id = None

    if system.token_data and CLIENT_ID:
        try:
            headers = {
                "Client-Id": CLIENT_ID,
                "Authorization": f"Bearer {system.token_data.get('access_token')}"
            }
            async with aiohttp.ClientSession() as session:
                # 1. Obtener usuario
                async with session.get(f"https://api.twitch.tv/helix/users?login={target_user}", headers=headers) as resp:
                    if resp.status == 200:
                        u_data = await resp.json()
                        if u_data.get("data") and len(u_data["data"]) > 0:
                            u = u_data["data"][0]
                            display_name = u.get("display_name", target_user)
                            avatar = u.get("profile_image_url", avatar)
                            broadcaster_id = u.get("id")

                # 2. Obtener juego/categoría actual
                if broadcaster_id:
                    async with session.get(f"https://api.twitch.tv/helix/channels?broadcaster_id={broadcaster_id}", headers=headers) as c_resp:
                        if c_resp.status == 200:
                            c_data = await c_resp.json()
                            if c_data.get("data") and len(c_data["data"]) > 0:
                                game = c_data["data"][0].get("game_name", "")

                # 3. Obtener clip destacado si existe
                if broadcaster_id:
                    async with session.get(f"https://api.twitch.tv/helix/clips?broadcaster_id={broadcaster_id}&first=1", headers=headers) as cl_resp:
                        if cl_resp.status == 200:
                            cl_data = await cl_resp.json()
                            if cl_data.get("data") and len(cl_data["data"]) > 0:
                                top_clip = cl_data["data"][0]
                                clip_url = top_clip.get("url", "")
                                clip_embed_url = top_clip.get("embed_url", "")
                                clip_slug = top_clip.get("id", "")
        except Exception as e:
            logger.warning(f"Aviso al consultar Twitch Helix para !promo {target_user}: {e}")

    # Enviar respuesta al chat de Twitch
    game_text = f" Estuvo jugando a {game}." if game else ""
    msg_suffix = f' "{custom_msg}"' if custom_msg else ""
    chat_reply = f"📢 ¡Echad un vistazo y seguid a @{display_name}! 🚀 https://twitch.tv/{target_user}{game_text}{msg_suffix}"
    await system.send_chat_message(chat_reply)

    # Cargar estilos de chat para cumplir herencia de estilos
    chat_styles = {}
    try:
        cfg = load_widgets_config()
        chat_styles = cfg.get("chat", {}).get("styles", {})
    except Exception as e:
        logger.debug(f"No se pudieron leer estilos de chat para promo: {e}")

    color = chat_styles.get("borderColor") or "#57D6C4"

    payload = {
        "type": "shoutout",
        "promo_type": "shoutout",
        "streamer": target_user,
        "display_name": display_name,
        "avatar": avatar,
        "game": game or "Cacharreo & Directos",
        "message": custom_msg,
        "link": f"https://twitch.tv/{target_user}",
        "show_qr": True,
        "clip_url": clip_url,
        "clip_embed_url": clip_embed_url,
        "clip_slug": clip_slug,
        "inherit_chat_styles": True,
        "chat_styles": chat_styles,
        "color": color,
        "duration": 9000,
        "source": "!promo_chat"
    }

    if not hasattr(system, "recent_promos"):
        system.recent_promos = []
    hist_entry = {
        "id": "promo_" + str(int(time.time() * 1000)),
        "timestamp": time.strftime("%H:%M:%S"),
        **payload
    }
    system.recent_promos.insert(0, hist_entry)
    if len(system.recent_promos) > 30:
        system.recent_promos.pop()

    await system.broadcast(payload)
    logger.info(f"✓ Promo emitida a OBS para {display_name} (Heredando estilos de chat)")


