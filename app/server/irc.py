import asyncio
import time
import aiohttp
from server.config import logger
from server.services.actions.promo_actions import handle_irc_promo_command
from server.services.bot_timers_service import run_chat_bot_timers

# Exportar run_chat_bot_timers para compatibilidad hacia atrás
__all__ = ["run_twitch_irc", "run_chat_bot_timers", "handle_irc_command"]

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
