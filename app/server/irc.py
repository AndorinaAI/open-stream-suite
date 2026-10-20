import asyncio
import time
import aiohttp
import json
from server.config import logger, WIDGETS_CONFIG_FILE, CLIENT_ID

async def run_twitch_irc(system):
    """Escucha mensajes de chat de Twitch en tiempo real para comandos con permisos y cooldown"""
    while system.running:
        if not system.user_info:
            await asyncio.sleep(3)
            continue
        channel = system.user_info.get("login", "").lower()
        if not channel:
            await asyncio.sleep(3)
            continue

        try:
            logger.info(f"Conectando a Twitch IRC para comandos en #{channel}...")
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect("wss://irc-ws.chat.twitch.tv:443") as ws:
                    await ws.send_str("CAP REQ :twitch.tv/tags twitch.tv/commands")
                    await ws.send_str("PASS oauth:dummy")
                    await ws.send_str(f"NICK justinfan{int(time.time()) % 90000 + 10000}")
                    await ws.send_str(f"JOIN #{channel}")
                    logger.info(f"✓ Conectado a Twitch IRC (#{channel}) para ejecutar comandos")

                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            line = msg.data.strip()
                            if line.startswith("PING"):
                                await ws.send_str("PONG :tmi.twitch.tv")
                                continue
                            if "PRIVMSG" in line:
                                await handle_irc_command(system, line)
                        elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                            break
        except Exception as e:
            logger.warning(f"Aviso en conexión IRC Twitch: {e}")
            await asyncio.sleep(5)

async def handle_irc_command(system, raw_line):
    parts = raw_line.split(" :", 2)
    if len(parts) < 3:
        return
    tag_str = parts[0]
    text = parts[2].strip()

    tags = {}
    for item in tag_str.split(";"):
        if "=" in item:
            k, v = item.split("=", 1)
            tags[k.lstrip("@")] = v

    user = tags.get("display-name", "Usuario")
    user_login = tags.get("user-name", "").lower() or tags.get("login", "").lower() or user.lower()
    badges = tags.get("badges", "")
    color = tags.get("color", "#57D6C4") or "#57D6C4"

    # Auto-detectar y registrar insignia oficial de artista de Twitch en cualquier mensaje
    if ("artist-badge/" in badges or "artist/" in badges) and user_login:
        system.auto_register_artist(user_login)

    # Difundir a clientes conectados y registrar en buffer de chat reciente para el panel
    await system.broadcast({
        "type": "chat_message",
        "user": user,
        "message": text,
        "badges": badges,
        "color": color
    })

    if not text.startswith("!"):
        return

    cmd = text.split()[0].lower()
    is_broadcaster = "broadcaster/" in badges
    is_mod = is_broadcaster or "moderator/" in badges

    # Comandos de chat para Spotlight (Destacar comentario en pantalla)
    if cmd in ("!destacar", "!pin") and (is_broadcaster or is_mod):
        args = text[len(cmd):].strip()
        if not args or args.lower() in ("off", "quitar", "clear"):
            await system.broadcast({"type": "chat_spotlight", "active": False})
            logger.info("📌 Spotlight quitado por comando de chat")
            return

        target_user = user
        spotlight_text = args
        if args.startswith("@"):
            parts_dest = args.split(" ", 1)
            target_user = parts_dest[0].lstrip("@")
            spotlight_text = parts_dest[1] if len(parts_dest) > 1 else ""

        if spotlight_text:
            await system.broadcast({
                "type": "chat_spotlight",
                "active": True,
                "user": target_user,
                "message": spotlight_text,
                "color": "#57D6C4"
            })
            logger.info(f"📌 Spotlight activado por chat: {target_user} -> {spotlight_text}")
            return

    if cmd in ("!unpin", "!quitar") and (is_broadcaster or is_mod):
        await system.broadcast({"type": "chat_spotlight", "active": False})
        logger.info("📌 Spotlight quitado por comando de chat")
        return

    # Comandos de chat para Promoción y Shoutouts (!promo, !so, !shoutout)
    if cmd in ("!promo", "!so", "!shoutout") and (is_broadcaster or is_mod):
        args = text[len(cmd):].strip()
        if args:
            asyncio.create_task(handle_irc_promo_command(system, user, args))
            return

    trigger = system.find_trigger_by_command(cmd)
    if not trigger:
        return

    perm = trigger.get("command_permissions", "everyone")
    is_vip = is_mod or "vip/" in badges
    is_artist = is_broadcaster or "artist-badge/" in badges or "artist/" in badges
    is_sub = is_vip or "subscriber/" in badges

    allowed = False
    if perm == "everyone":
        allowed = True
    elif perm == "subs" and is_sub:
        allowed = True
    elif perm == "vip" and is_vip:
        allowed = True
    elif perm == "artists" and is_artist:
        allowed = True
    elif perm == "mods" and is_mod:
        allowed = True
    elif perm == "broadcaster" and is_broadcaster:
        allowed = True
    elif perm.startswith("role:"):
        role_id = perm.split("role:", 1)[1]
        allowed = is_broadcaster or system.user_has_custom_role(user, role_id) or (role_id in ("role_artista", "role_artistas", "twitch_artists") and is_artist)

    if not allowed:
        logger.info(f"Comando {cmd} bloqueado para {user} (Requiere rol: {perm})")
        return

    # Cooldown
    trig_id = trigger.get("id", cmd)
    now = time.time()
    cooldown_sec = trigger.get("cooldown_seconds", 0)
    last_time = system.trigger_cooldowns.get(trig_id, 0)
    if now - last_time < cooldown_sec:
        logger.info(f"Comando {cmd} en enfriamiento ({int(cooldown_sec - (now - last_time))}s restantes)")
        return

    system.trigger_cooldowns[trig_id] = now
    await system.dispatch_trigger(trigger, user, reason="chat_command")

async def handle_irc_promo_command(system, requester, args):
    """Procesa el comando !promo o !so de chat para promocionar a un canal con tarjeta, clip opcional y estilos de chat"""
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

    # Si hay token de Twitch, consultar Twitch Helix para avatar, juego y clip más top
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

    # Cargar estilos de chat para cumplir: "Si se envia desde !promo hereda estilos de chat"
    chat_styles = {}
    try:
        if WIDGETS_CONFIG_FILE.exists():
            with open(WIDGETS_CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
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

    # Registrar en historial de la sesión
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

async def run_chat_bot_timers(system):
    """Ejecuta los mensajes periódicos automáticos configurados para el chat de Twitch"""
    timer_states = {} # timer_id -> {"last_sent": float, "last_counter": int}

    # Esperar unos segundos iniciales para estabilizar conexión
    await asyncio.sleep(15)

    while system.running:
        await asyncio.sleep(20)
        if not system.user_info or not WIDGETS_CONFIG_FILE.exists():
            continue

        try:
            with open(WIDGETS_CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)

            chat_cfg = data.get("chat", {})
            timers = chat_cfg.get("botTimers", [])
            now = time.time()

            for t in timers:
                if not t.get("enabled", True):
                    continue

                t_id = t.get("id", "")
                interval_min = int(t.get("intervalMinutes", 15))
                min_lines = int(t.get("minChatLines", 5))
                message = t.get("message", "").strip()

                if not message:
                    continue

                st = timer_states.setdefault(t_id, {"last_sent": now, "last_counter": system.chat_message_counter})
                time_elapsed = (now - st["last_sent"]) >= (interval_min * 60)
                lines_elapsed = (system.chat_message_counter - st["last_counter"]) >= min_lines

                if time_elapsed and lines_elapsed:
                    logger.info(f"🤖 Ejecutando mensaje programado de chat: [{t.get('name', t_id)}]")
                    await system.send_chat_message(message)
                    st["last_sent"] = now
                    st["last_counter"] = system.chat_message_counter

        except Exception as e:
            logger.debug(f"Aviso en loop de timers de chat: {e}")
