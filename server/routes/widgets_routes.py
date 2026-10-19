import json
import time
import aiohttp
import xml.etree.ElementTree as ET
from aiohttp import web
from server.config import (
    WIDGETS_DIR,
    WIDGETS_CONFIG_FILE,
    WIDGET_CONFIG_MAPPING,
    CLIENT_ID,
    logger
)
from server.state import system

def load_widgets_config():
    """Carga la configuración persistente modular de cada widget desde widgets/<widget>/config.json"""
    cfg = {}

    # 1. Cargar cada archivo modular individual definido en WIDGET_CONFIG_MAPPING
    for widget_key, file_path in WIDGET_CONFIG_MAPPING.items():
        if widget_key in cfg:
            continue
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    cfg[widget_key] = json.load(f)
            except Exception as e:
                logger.error(f"Error al leer config modular de {widget_key} ({file_path}): {e}")

    # 2. Si faltan widgets o hay una configuración previa en widgets_config.json, complementar
    if WIDGETS_CONFIG_FILE.exists():
        try:
            with open(WIDGETS_CONFIG_FILE, "r", encoding="utf-8") as f:
                legacy = json.load(f)
                if isinstance(legacy, dict):
                    for k, v in legacy.items():
                        if k not in cfg:
                            cfg[k] = v
        except Exception as e:
            logger.error(f"Error al leer widgets_config.json legado: {e}")

    # 3. Escanear dinámicamente cualquier otra subcarpeta en widgets/ que tenga config.json
    if WIDGETS_DIR.exists():
        for sub in WIDGETS_DIR.iterdir():
            if sub.is_dir() and sub.name not in ["__pycache__", ".git"]:
                w_cfg_file = sub / "config.json"
                if w_cfg_file.exists() and sub.name not in cfg and sub.name != "shoutout":
                    try:
                        with open(w_cfg_file, "r", encoding="utf-8") as f:
                            cfg[sub.name] = json.load(f)
                    except Exception as e:
                        logger.error(f"Error al leer config de {sub.name}: {e}")

    return cfg

def save_widgets_config(cfg):
    """Guarda la configuración persistente en los archivos modulares widgets/<widget>/config.json y respalda widgets_config.json"""
    if not isinstance(cfg, dict):
        return False
    success = True
    try:
        # 1. Guardar cada sección en su carpeta modular correspondiente
        for widget_key, val in cfg.items():
            target_path = WIDGET_CONFIG_MAPPING.get(widget_key)
            if not target_path:
                target_path = WIDGETS_DIR / widget_key / "config.json"

            try:
                target_path.parent.mkdir(parents=True, exist_ok=True)
                with open(target_path, "w", encoding="utf-8") as f:
                    json.dump(val, f, indent=2, ensure_ascii=False)
            except Exception as e:
                logger.error(f"Error guardando config modular para {widget_key} en {target_path}: {e}")
                success = False

        # 2. Respaldar el archivo unificado widgets_config.json para compatibilidad total
        try:
            with open(WIDGETS_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error guardando copia unificada widgets_config.json: {e}")

        return success
    except Exception as e:
        logger.error(f"Error general en save_widgets_config: {e}")
        return False

async def auto_sync_twitch_goals(cfg):
    """Sincroniza automáticamente las metas oficiales reales de Twitch vía Helix sin botones manuales"""
    if not system.token_data or not system.user_info or not CLIENT_ID:
        return False
    
    b_id = system.user_info.get("id")
    if not b_id:
        return False

    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {system.token_data['access_token']}"
    }

    goal_cfg = cfg.get("goal", {})
    goals_list = goal_cfg.get("goals", [])
    changed = False

    try:
        async with aiohttp.ClientSession() as session:
            # 1. Seguidores reales de Twitch
            async with session.get(f"https://api.twitch.tv/helix/channels/followers?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    f_data = await resp.json()
                    total_followers = f_data.get("total")
                    if total_followers is not None:
                        total_followers = int(total_followers)
                        if goal_cfg.get("type") == "followers" and goal_cfg.get("current") != total_followers:
                            goal_cfg["current"] = total_followers
                            changed = True
                        for g in goals_list:
                            if g.get("type") in ["followers", "follower"] and g.get("category") == "twitch":
                                if g.get("current") != total_followers:
                                    g["current"] = total_followers
                                    changed = True

            # 2. Suscriptores reales de Twitch
            async with session.get(f"https://api.twitch.tv/helix/subscriptions?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    s_data = await resp.json()
                    total_subs = s_data.get("total")
                    if total_subs is not None:
                        total_subs = int(total_subs)
                        if goal_cfg.get("type") in ["subscribers", "subs"] and goal_cfg.get("current") != total_subs:
                            goal_cfg["current"] = total_subs
                            changed = True
                        for g in goals_list:
                            if g.get("type") in ["subscribers", "subs"] and g.get("category") == "twitch":
                                if g.get("current") != total_subs:
                                    g["current"] = total_subs
                                    changed = True

            # 3. Metas oficiales creadas en Twitch Helix Goals
            async with session.get(f"https://api.twitch.tv/helix/goals?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    g_data = await resp.json()
                    items = g_data.get("data", [])
                    if items:
                        for item in items:
                            g_type = item.get("type") # "follower" or "subscription"
                            cur = item.get("current_amount")
                            targ = item.get("target_amount")
                            desc = item.get("description")
                            for g in goals_list:
                                if (g.get("type") == "followers" and g_type == "follower") or (g.get("type") in ["subscribers", "subs"] and g_type == "subscription"):
                                    if cur is not None and g.get("current") != int(cur):
                                        g["current"] = int(cur)
                                        changed = True
                                    if targ is not None and g.get("target") != int(targ):
                                        g["target"] = int(targ)
                                        changed = True
                                    if desc and g.get("title") != desc:
                                        g["title"] = desc
                                        changed = True
    except Exception as e:
        logger.warning(f"Aviso en sincronización automática de metas Twitch: {e}")

    if changed:
        cfg["goal"] = goal_cfg
        save_widgets_config(cfg)
    return changed

async def handle_get_widgets_config(request):
    """Devuelve la configuración completa de widgets y sus accesos directos"""
    cfg = load_widgets_config()
    try:
        # Auto-sincronizar métricas oficiales de Twitch si está conectado
        await auto_sync_twitch_goals(cfg)
    except Exception as e:
        logger.warning(f"Error comprobando métricas de Twitch: {e}")
    return web.json_response({"status": "ok", "config": cfg})

async def handle_save_widgets_config(request):
    """Actualiza la configuración de widgets y notifica por WebSocket a OBS"""
    data = await request.json()
    cfg = data.get("config", {})
    if not cfg:
        return web.json_response({"status": "error", "error": "No data provided"}, status=400)
    
    if save_widgets_config(cfg):
        # Difundir a todos los widgets conectados
        await system.broadcast({
            "type": "widgets_config_updated",
            "config": cfg
        })
        return web.json_response({"status": "ok", "config": cfg})
    return web.json_response({"status": "error", "error": "Could not save configuration"}, status=500)

async def handle_get_single_widget_config(request):
    """Devuelve la configuración modular de un widget individual"""
    widget = request.match_info.get("widget", "").lower()
    cfg = load_widgets_config()
    if widget == "goal":
        try:
            await auto_sync_twitch_goals(cfg)
        except Exception as e:
            logger.warning(f"Error comprobando métricas de Twitch para goal: {e}")

    widget_cfg = cfg.get(widget)
    if widget_cfg is None:
        # Compatibilidad alias shoutout <-> promo
        if widget == "shoutout":
            widget_cfg = cfg.get("promo")
        elif widget == "promo":
            widget_cfg = cfg.get("shoutout")

    if widget_cfg is None:
        return web.json_response({"status": "error", "error": f"Widget '{widget}' no encontrado"}, status=404)

    return web.json_response({"status": "ok", "widget": widget, "config": widget_cfg})

async def handle_save_single_widget_config(request):
    """Actualiza la configuración de un widget individual y notifica por WebSocket a OBS"""
    widget = request.match_info.get("widget", "").lower()
    try:
        data = await request.json()
    except Exception:
        data = {}

    widget_cfg = data.get("config", data)
    if not widget_cfg or not isinstance(widget_cfg, dict):
        return web.json_response({"status": "error", "error": "Configuración inválida"}, status=400)

    cfg = load_widgets_config()
    save_key = "promo" if widget == "shoutout" and "promo" in cfg else widget
    cfg[save_key] = widget_cfg

    if save_widgets_config(cfg):
        await system.broadcast({
            "type": "widgets_config_updated",
            "widget": save_key,
            "config": cfg
        })
        return web.json_response({"status": "ok", "widget": save_key, "config": widget_cfg})
    return web.json_response({"status": "error", "error": f"No se pudo guardar la configuración de {widget}"}, status=500)

async def handle_widget_action(request):
    """
    Acción universal de widget (compatible con OpenDeck, StreamDeck, móviles y dashboard).
    Payload: { "widget": "timer"|"promo"|"chat"|"goal", "action": "...", "params": {...} }
    """
    data = await request.json()
    widget = data.get("widget", "")
    action = data.get("action", "")
    params = data.get("params", {})

    logger.info(f"🕹️ Widget Action recibida: {widget} -> {action} ({params})")

    if widget == "timer":
        # Control de temporizador
        payload = {
            "type": "timer_control",
            "action": action,
            "seconds": params.get("seconds", 300),
            "title": params.get("title", "TEMPORIZADOR"),
            **params
        }
        await system.broadcast(payload)
        return web.json_response({"status": "ok", "action": action, "widget": widget, "payload": payload})

    elif widget == "promo" or widget == "shoutout":
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

    elif widget == "chat":
        if action == "explode":
            # Explosión de emotes o partículas
            emoji = params.get("emoji", "🎉")
            count = params.get("count", 40)
            payload = {
                "type": "explode_emotes",
                "emoji": emoji,
                "count": count
            }
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "action": "explode", "widget": "chat", "payload": payload})

        elif action == "simulate":
            # Mensaje de chat simulado para pruebas
            user = params.get("user", "Viewer")
            color = params.get("color", "#57D6C4")
            message = params.get("message", "¡Saludos desde el chat del taller!")
            badges = params.get("badges", "")
            payload = {
                "type": "chat_message",
                "user": user,
                "color": color,
                "message": message,
                "badges": badges
            }
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "action": "simulate", "widget": "chat", "payload": payload})

        elif action == "spotlight":
            # Destacar o des-destacar mensaje en pantalla
            active = params.get("active", True)
            user = params.get("user", "")
            message = params.get("message", "")
            color = params.get("color", "#57D6C4")
            payload = {
                "type": "chat_spotlight",
                "active": active,
                "user": user,
                "message": message,
                "color": color
            }
            # Persistir estado de spotlight en widgets_config.json
            cfg = load_widgets_config()
            if "chat" in cfg:
                cfg["chat"]["spotlight"] = {
                    "active": active,
                    "user": user,
                    "message": message,
                    "color": color
                }
                save_widgets_config(cfg)

            await system.broadcast(payload)
            return web.json_response({"status": "ok", "action": "spotlight", "widget": "chat", "payload": payload})

        elif action == "send":
            # Enviar mensaje al chat desde el panel o Stream Deck
            message = params.get("message", "").strip()
            if message:
                ok = await system.send_chat_message(message)
                return web.json_response({"status": "ok", "action": "send", "sent": ok, "message": message})
            return web.json_response({"status": "error", "error": "Mensaje vacío"}, status=400)

        elif action == "get_recent":
            # Obtener buffer de mensajes recientes para el panel
            return web.json_response({"status": "ok", "messages": system.recent_chat_messages})

        elif action == "clear":
            # Limpiar chat de pantalla
            payload = {"type": "chat_clear"}
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "action": "clear", "widget": "chat", "payload": payload})

    elif widget == "goal":
        cfg = load_widgets_config()
        goal_cfg = cfg.get("goal", {})
        goals_list = goal_cfg.get("goals", [])
        
        # 1. Protección de metas oficiales de Twitch contra manipulación manual
        if action in ["increment", "add", "set", "reset"]:
            target_id = params.get("goal_id") or goal_cfg.get("activeGoalId")
            target_goal = None
            for g in goals_list:
                if g.get("id") == target_id:
                    target_goal = g
                    break
            if not target_goal and goals_list:
                target_goal = goals_list[0]

            if target_goal and (target_goal.get("category") == "twitch" or target_goal.get("type") in ["followers", "subscribers", "subs", "bits"]):
                return web.json_response({
                    "status": "error",
                    "error": "🔒 Las metas oficiales de Twitch se sincronizan solas en vivo y no se pueden falsear manualmente."
                }, status=403)

            # Para metas personalizadas libres
            if target_goal:
                if action in ["increment", "add"]:
                    delta = int(params.get("amount", 1))
                    cur = int(target_goal.get("current", 0))
                    target_goal["current"] = max(0, cur + delta)
                elif action == "set":
                    target_goal["current"] = max(0, int(params.get("current", 0)))
                elif action == "reset":
                    target_goal["current"] = 0
                
                # Si coincide con la activa, reflejar en top level
                if target_goal.get("id") == goal_cfg.get("activeGoalId"):
                    goal_cfg["current"] = target_goal["current"]

        elif action == "toggle_goal":
            target_id = params.get("goal_id")
            for g in goals_list:
                if g.get("id") == target_id:
                    g["active"] = not g.get("active", True)
                    break

        elif action == "delete_goal":
            target_id = params.get("goal_id")
            goal_cfg["goals"] = [g for g in goals_list if g.get("id") != target_id or g.get("category") == "twitch"]
            if goal_cfg.get("activeGoalId") == target_id and goal_cfg["goals"]:
                goal_cfg["activeGoalId"] = goal_cfg["goals"][0].get("id")

        elif action == "add_goal":
            new_g = params.get("goal")
            if new_g and isinstance(new_g, dict) and "id" in new_g:
                goal_cfg.setdefault("goals", []).append(new_g)

        elif action in ["update", "save"]:
            if "displayMode" in params:
                goal_cfg["displayMode"] = params["displayMode"]
            if "rotationInterval" in params:
                goal_cfg["rotationInterval"] = max(3, int(params["rotationInterval"]))
            if "activeGoalId" in params:
                goal_cfg["activeGoalId"] = params["activeGoalId"]
            if "goals" in params and isinstance(params["goals"], list):
                # Mantener los valores reales de Twitch al guardar metas completas
                for incoming_g in params["goals"]:
                    if incoming_g.get("category") == "twitch":
                        # buscar el valor previo real
                        for prev_g in goals_list:
                            if prev_g.get("id") == incoming_g.get("id") or prev_g.get("type") == incoming_g.get("type"):
                                incoming_g["current"] = prev_g.get("current", incoming_g.get("current", 0))
                goal_cfg["goals"] = params["goals"]
            if "styles" in params and isinstance(params["styles"], dict):
                goal_cfg["styles"] = params["styles"]
            if "sameStyleAsChat" in params:
                goal_cfg["sameStyleAsChat"] = params["sameStyleAsChat"] is True
            if "celebrateOnFinish" in params:
                goal_cfg["celebrateOnFinish"] = params["celebrateOnFinish"] is not False
            if "celebrateSound" in params:
                goal_cfg["celebrateSound"] = params["celebrateSound"] is not False

        # Guardar cambios
        cfg["goal"] = goal_cfg
        save_widgets_config(cfg)

        # Preparar estilos efectivos si se hereda de chat
        effective_styles = dict(goal_cfg.get("styles", {}))
        if goal_cfg.get("sameStyleAsChat", False):
            chat_styles = cfg.get("chat", {}).get("styles", {})
            for k in ["shape", "bgType", "bgColor", "bgGradient", "borderStyle", "borderWidth", "borderColor", "glowIntensity", "bgOpacity", "fontFamily"]:
                if k in chat_styles:
                    effective_styles[k] = chat_styles[k]
            if "borderColor" in chat_styles:
                effective_styles["accentColor"] = chat_styles["borderColor"]
                effective_styles["barColorStart"] = chat_styles["borderColor"]

        # Meta primaria activa
        active_id = goal_cfg.get("activeGoalId")
        primary_goal = None
        for g in goal_cfg.get("goals", []):
            if g.get("id") == active_id:
                primary_goal = g
                break
        if not primary_goal and goal_cfg.get("goals"):
            primary_goal = goal_cfg["goals"][0]

        # Payload para broadcast a OBS y widgets
        payload = {
            "type": "goal_update",
            "action": action,
            "displayMode": goal_cfg.get("displayMode", "stacked"),
            "rotationInterval": goal_cfg.get("rotationInterval", 10),
            "activeGoalId": active_id,
            "goals": goal_cfg.get("goals", []),
            "styles": effective_styles,
            "celebrateOnFinish": goal_cfg.get("celebrateOnFinish", True),
            "celebrateSound": goal_cfg.get("celebrateSound", True),
            "sameStyleAsChat": goal_cfg.get("sameStyleAsChat", False),
            "current": primary_goal.get("current", 0) if primary_goal else 0,
            "target": primary_goal.get("target", 100) if primary_goal else 100,
            "title": primary_goal.get("title", "OBJETIVO") if primary_goal else "OBJETIVO",
            "prefix": primary_goal.get("prefix", "") if primary_goal else "",
            "suffix": primary_goal.get("suffix", "") if primary_goal else "",
            "subtextFormat": primary_goal.get("subtextFormat", "{pct}% COMPLETADO") if primary_goal else "{pct}% COMPLETADO",
            "timestamp": time.time()
        }
        await system.broadcast(payload)
        await system.broadcast({
            "type": "update_goal",
            "current": payload["current"],
            "target": payload["target"],
            "title": payload["title"]
        })

        return web.json_response({
            "status": "ok",
            "action": action,
            "widget": "goal",
            "payload": payload
        })

    elif widget == "ticker":
        cfg = load_widgets_config()
        tk_cfg = cfg.get("ticker", {})

        if action in ["message", "set_message"]:
            msg = params.get("message", "")
            if msg:
                tk_cfg["fixedMessage"] = msg
                cfg["ticker"] = tk_cfg
                save_widgets_config(cfg)
            payload = {
                "type": "ticker_message",
                "message": msg or tk_cfg.get("fixedMessage", "")
            }
            await system.broadcast(payload)
            await system.broadcast({
                "type": "widgets_config_updated",
                "widget": "ticker",
                "config": cfg
            })
            return web.json_response({"status": "ok", "action": action, "widget": "ticker", "payload": payload})

        elif action == "flash_news":
            news = params.get("message", "🚨 ÚLTIMA HORA EN DIRECTO")
            duration = int(params.get("duration", 12))
            payload = {
                "type": "ticker_flash",
                "message": news,
                "duration": duration
            }
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "action": "flash_news", "widget": "ticker", "payload": payload})

        elif action == "simulate":
            event_type = params.get("event", "follow")
            user = params.get("user", "ViewerPro")
            payload = {
                "type": event_type,
                "platform": params.get("platform", "kofi"),
                "user": user,
                "name": user,
                "amount": str(amount),
                "bits": amount,
                "viewers": amount,
                "months": params.get("months", 1),
                "tier": params.get("tier", "Tier 1"),
                "message": params.get("message", "")
            }
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "action": "simulate", "widget": "ticker", "payload": payload})

        elif action in ["pause", "resume", "toggle_pause"]:
            paused = params.get("paused")
            payload = {
                "type": "ticker_pause",
                "action": action,
                "paused": paused
            }
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "action": action, "widget": "ticker", "payload": payload})

        elif action in ["update", "save"]:
            for k in ["displayMode", "speed", "fixedMessage", "showFollows", "showSubs", "showBits", "showRaids", "showGoal", "separator", "styles", "rotationInterval", "activePreset"]:
                if k in params:
                    tk_cfg[k] = params[k]
            cfg["ticker"] = tk_cfg
            save_widgets_config(cfg)
            payload = {
                "type": "ticker_update",
                "config": tk_cfg
            }
            await system.broadcast(payload)
            await system.broadcast({
                "type": "widgets_config_updated",
                "widget": "ticker",
                "config": cfg
            })
            return web.json_response({"status": "ok", "action": action, "widget": "ticker", "payload": payload})

    return web.json_response({"status": "error", "error": f"Unknown widget: {widget}"}, status=400)

async def handle_get_rss_feed(request):
    """Obtiene y parsea un feed RSS/Atom para mostrar noticias en el Ticker/Prompter"""
    url = request.query.get("url", "").strip()
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return web.json_response({"status": "error", "error": "URL de RSS inválida"}, status=400)

    headers = {
        "User-Agent": "Mozilla/5.0 (TallerLiveOverlay/1.0; RSS Reader)"
    }
    try:
        timeout = aiohttp.ClientTimeout(total=8)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=headers) as resp:
                if resp.status != 200:
                    return web.json_response({"status": "error", "error": f"HTTP {resp.status} al obtener RSS"}, status=resp.status)
                xml_text = await resp.text()

        # Parsear XML (RSS 2.0 o Atom)
        root = ET.fromstring(xml_text)
        items_list = []
        feed_title = "Noticias RSS"

        # Formato RSS 2.0 (<channel><item>...)
        channel = root.find("channel")
        if channel is not None:
            t_el = channel.find("title")
            if t_el is not None and t_el.text:
                feed_title = t_el.text.strip()
            for it in channel.findall("item"):
                title_el = it.find("title")
                link_el = it.find("link")
                if title_el is not None and title_el.text:
                    clean_title = title_el.text.strip().replace("\n", " ").replace("\r", "")
                    items_list.append({
                        "title": clean_title,
                        "link": link_el.text.strip() if link_el is not None and link_el.text else ""
                    })
        else:
            # Formato Atom (<feed><entry>...)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            t_el = root.find("atom:title", ns) or root.find("title")
            if t_el is not None and t_el.text:
                feed_title = t_el.text.strip()
            entries = root.findall("atom:entry", ns) or root.findall("entry")
            for entry in entries:
                title_el = entry.find("atom:title", ns) or entry.find("title")
                if title_el is not None and title_el.text:
                    clean_title = title_el.text.strip().replace("\n", " ").replace("\r", "")
                    items_list.append({
                        "title": clean_title,
                        "link": ""
                    })

        return web.json_response({
            "status": "ok",
            "feed_title": feed_title,
            "count": len(items_list),
            "items": items_list[:25]
        })
    except Exception as e:
        logger.warning(f"Error parseando feed RSS ({url}): {e}")
        return web.json_response({"status": "error", "error": f"Error al parsear RSS: {str(e)}"}, status=500)

def register_widgets_routes(app):
    """Registra las rutas de la API de widgets"""
    app.router.add_get("/api/widgets/config", handle_get_widgets_config)
    app.router.add_post("/api/widgets/config", handle_save_widgets_config)
    app.router.add_get("/api/widgets/{widget}/config", handle_get_single_widget_config)
    app.router.add_post("/api/widgets/{widget}/config", handle_save_single_widget_config)
    app.router.add_post("/api/widgets/action", handle_widget_action)
    app.router.add_get("/api/rss/feed", handle_get_rss_feed)
