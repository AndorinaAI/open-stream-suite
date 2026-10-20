import json
from aiohttp import web
from server.config import logger, TRIGGERS_FILE
from server.state import system
from server.routes.widgets_routes import handle_widget_action

async def handle_deck_trigger(request):
    """
    Endpoint para Elgato Stream Deck / Ajazz AKP / OpenDeck / Bitfocus Companion.
    Permite disparar cualquier trigger/meme por ID, nombre o comando chat.
    Soporta GET o POST.
    Ejemplo: GET /api/deck/trigger?id=susto
    """
    ident = request.query.get("id") or request.query.get("name") or request.query.get("command")
    if not ident and request.can_read_body:
        try:
            data = await request.json()
            ident = data.get("id") or data.get("name") or data.get("command")
        except Exception:
            pass

    if not ident:
        return web.json_response({
            "status": "error",
            "message": "Falta parámetro 'id' o 'name'. Ejemplo: /api/deck/trigger?id=alerta_susto"
        }, status=400)

    trigger = system.find_trigger_by_id_or_name(ident)
    if not trigger:
        # Intentar por reward title o comando chat
        trigger = system.find_trigger_by_command(ident.lstrip("!")) or system.find_trigger_by_reward(ident)

    if not trigger:
        return web.json_response({
            "status": "error",
            "message": f"Trigger no encontrado: '{ident}'"
        }, status=404)

    user = request.query.get("user") or "StreamDeck"
    await system.dispatch_trigger(trigger, user, reason="stream_deck")
    logger.info(f"🎮 [StreamDeck] Trigger disparado con éxito: {trigger.get('title')}")
    return web.json_response({
        "status": "ok",
        "action": "trigger",
        "trigger": trigger.get("title"),
        "id": trigger.get("id")
    })

async def handle_deck_theme(request):
    """
    Aplica una paleta de color / tema a OBS Studio desde el Stream Deck.
    Ejemplo: GET /api/deck/theme?id=cyberpunk
    """
    theme_id = request.query.get("id") or request.query.get("theme")
    pack_id = request.query.get("pack") or "pack_open_stream_suite"
    if not theme_id and request.can_read_body:
        try:
            data = await request.json()
            theme_id = data.get("id") or data.get("theme")
            pack_id = data.get("pack") or pack_id
        except Exception:
            pass

    if not theme_id:
        return web.json_response({
            "status": "error",
            "message": "Falta parámetro 'id'. Ejemplo: /api/deck/theme?id=maker"
        }, status=400)

    from server.routes.themes_routes import save_theme_state, sync_chat_with_theme, THEMES_DIR
    save_theme_state({"activePack": pack_id, "activeTheme": theme_id})

    theme_file = THEMES_DIR / pack_id / theme_id / "theme.json"
    if theme_file.exists():
        try:
            with open(theme_file, "r", encoding="utf-8") as f:
                t_data = json.load(f)
            if t_data.get("chatAnchored", True):
                sync_chat_with_theme(t_data)
        except Exception:
            pass

    # Enviar broadcast WebSocket de cambio de tema a todas las pantallas de OBS
    await system.broadcast({
        "type": "theme_change",
        "theme": theme_id,
        "pack": pack_id
    })
    logger.info(f"🎨 [StreamDeck] Tema aplicado a OBS: {theme_id}")
    return web.json_response({
        "status": "ok",
        "action": "theme_applied",
        "theme": theme_id,
        "pack": pack_id
    })

async def handle_deck_timer(request):
    """
    Controla el temporizador del stream en OBS desde el Stream Deck.
    Ejemplo: GET /api/deck/timer?action=start&seconds=300
    """
    action = request.query.get("action") or "start"
    seconds = int(request.query.get("seconds") or 300)
    title = request.query.get("title") or "TEMPORIZADOR"

    payload = {
        "type": "timer_control",
        "action": action,
        "seconds": seconds,
        "title": title
    }
    await system.broadcast(payload)
    logger.info(f"⏱️ [StreamDeck] Temporizador: {action} ({seconds}s)")
    return web.json_response({
        "status": "ok",
        "action": "timer",
        "payload": payload
    })

async def handle_deck_alert(request):
    """
    Dispara una alerta de prueba desde el Stream Deck.
    Ejemplo: GET /api/deck/alert?type=follow&user=StreamerVIP
    """
    alert_type = request.query.get("type") or "follow"
    user = request.query.get("user") or "MakerAmigo"
    amount = request.query.get("amount") or ""

    from server.routes.alerts_routes import format_alert_event
    alert_data = format_alert_event(alert_type, {"user": user, "amount": amount})
    if alert_data:
        await system.broadcast(alert_data)
        return web.json_response({"status": "ok", "alert": alert_data})

    return web.json_response({"status": "error", "message": f"Tipo de alerta no válido: {alert_type}"}, status=400)

async def handle_deck_explode(request):
    """
    Lanza lluvia de emoticonos en OBS.
    Ejemplo: GET /api/deck/explode?emoji=🎉&count=40
    """
    emoji = request.query.get("emoji") or "🎉"
    count = int(request.query.get("count") or 40)
    await system.broadcast({
        "type": "explode_emotes",
        "emoji": emoji,
        "count": count
    })
    return web.json_response({"status": "ok", "emoji": emoji, "count": count})

async def handle_deck_knob(request):
    """
    Endpoint para mandos giratorios (Knobs / Encoders) y zonas táctiles de Ajazz AKP05 y Stream Deck +.
    Soporta GET y POST.
    Parámetros:
      - knob: 'timer' | 'theme' | 'goal' | 'fx' | 'volume' (o número 1-4)
      - action: 'rotate' | 'step' | 'press' | 'click' | 'touch' | 'tap' | 'next' | 'prev'
      - ticks: +/-1 (dirección de giro)
      - delta: valor numérico opcional (segundos o cantidad)
    """
    params = dict(request.query)
    if request.can_read_body and request.method == "POST":
        try:
            body = await request.json()
            params.update(body)
        except Exception:
            pass

    knob_raw = str(params.get("knob", "timer")).lower()
    knob_map = {"1": "timer", "2": "theme", "3": "goal", "4": "fx"}
    knob = knob_map.get(knob_raw, knob_raw)
    action = str(params.get("action", "rotate")).lower()
    
    try:
        ticks = int(params.get("ticks") or (1 if action == "next" else (-1 if action == "prev" else 1)))
    except ValueError:
        ticks = 1

    if knob == "timer":
        if action in ("press", "click"):
            payload = {"type": "timer_control", "action": "pause"}
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "knob": "timer", "action": "pause"})
        elif action in ("touch", "tap"):
            payload = {"type": "timer_control", "action": "start", "seconds": 300, "title": "DESCANSO"}
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "knob": "timer", "action": "start_5m"})
        else:
            delta = int(params.get("delta") or (ticks * 60))
            payload = {"type": "timer_control", "action": "add", "seconds": delta}
            await system.broadcast(payload)
            return web.json_response({"status": "ok", "knob": "timer", "action": "step", "seconds_delta": delta})

    elif knob == "theme":
        from server.routes.themes_routes import get_all_packs_and_themes, load_theme_state, save_theme_state, sync_chat_with_theme, THEMES_DIR
        packs_data = get_all_packs_and_themes()
        themes_list = []
        for p in packs_data.get("packs", []):
            for t in p.get("themes", []):
                themes_list.append((p.get("id"), t.get("id"), t.get("name")))

        if not themes_list:
            return web.json_response({"status": "error", "message": "No hay temas disponibles"}, status=404)

        current_active = load_theme_state().get("activeTheme", "maker_electronico")
        current_idx = 0
        for idx, (p_id, t_id, name) in enumerate(themes_list):
            if t_id == current_active:
                current_idx = idx
                break

        if action in ("press", "click"):
            target = next(((p, t, n) for p, t, n in themes_list if t == "maker_electronico"), themes_list[0])
            new_pack, new_theme, new_name = target
        else:
            new_idx = (current_idx + ticks) % len(themes_list)
            new_pack, new_theme, new_name = themes_list[new_idx]

        save_theme_state({"activePack": new_pack, "activeTheme": new_theme})
        theme_file = THEMES_DIR / new_pack / new_theme / "theme.json"
        if theme_file.exists():
            try:
                with open(theme_file, "r", encoding="utf-8") as f:
                    t_data = json.load(f)
                if t_data.get("chatAnchored", True):
                    sync_chat_with_theme(t_data)
            except Exception:
                pass

        await system.broadcast({
            "type": "theme_change",
            "theme": new_theme,
            "pack": new_pack
        })
        logger.info(f"🎛️ [Knob Theme] Tema cambiado a: {new_theme} ({new_name})")
        return web.json_response({
            "status": "ok",
            "knob": "theme",
            "activeTheme": new_theme,
            "themeName": new_name,
            "pack": new_pack
        })

    elif knob == "goal":
        from server.routes.widgets_routes import load_widgets_config, save_widgets_config
        cfg = load_widgets_config()
        goal_cfg = cfg.get("goal", {})
        goals_list = goal_cfg.get("goals", [])
        if action in ("press", "click", "touch", "tap"):
            await system.broadcast({"type": "explode_emotes", "emoji": "🎯", "count": 30})
            return web.json_response({"status": "ok", "knob": "goal", "action": "celebrate"})
        else:
            delta = int(params.get("delta") or (ticks * 1))
            if goals_list:
                active_id = goal_cfg.get("activeGoalId")
                target = next((g for g in goals_list if g.get("id") == active_id), goals_list[0])
                target["current"] = max(0, target.get("current", 0) + delta)
                save_widgets_config(cfg)
                await system.broadcast({
                    "type": "goal_update",
                    "goal": target,
                    "goals": goals_list
                })
                return web.json_response({"status": "ok", "knob": "goal", "action": "step", "goal": target})
            return web.json_response({"status": "ok", "knob": "goal", "delta": delta})

    elif knob in ("fx", "sound", "effects"):
        if action in ("press", "click"):
            await system.broadcast({"type": "play_sound", "sound": "chime"})
            return web.json_response({"status": "ok", "knob": "fx", "action": "chime"})
        elif ticks >= 0:
            await system.broadcast({"type": "explode_emotes", "emoji": "🎉", "count": 40})
            return web.json_response({"status": "ok", "knob": "fx", "emoji": "🎉"})
        else:
            await system.broadcast({"type": "explode_emotes", "emoji": "❤️", "count": 40})
            return web.json_response({"status": "ok", "knob": "fx", "emoji": "❤️"})

    await system.broadcast({"type": "knob_event", "knob": knob, "action": action, "params": params})
    return web.json_response({"status": "ok", "knob": knob, "action": action})

async def handle_deck_actions_catalog(request):
    """
    Devuelve un catálogo completo con todos los triggers, temas, widgets y acciones
    con sus URLs de 1-clic listas para copiar y pegar en Stream Deck / Ajazz AKP / OpenDeck.
    """
    triggers = []
    if TRIGGERS_FILE.exists():
        try:
            with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                triggers = [
                    {
                        "id": t.get("id"),
                        "title": t.get("title"),
                        "command": t.get("chat_command"),
                        "url": f"http://localhost:8080/api/deck/trigger?id={t.get('id')}"
                    }
                    for t in data.get("triggers", [])
                ]
        except Exception:
            pass

    return web.json_response({
        "status": "ok",
        "info": "Acciones preparadas para Elgato Stream Deck, Ajazz AKP y OpenDeck (Bitfocus Companion)",
        "triggers": triggers,
        "timer_actions": [
            {"label": "Iniciar 5 Min", "url": "http://localhost:8080/api/deck/timer?action=start&seconds=300"},
            {"label": "Iniciar 10 Min", "url": "http://localhost:8080/api/deck/timer?action=start&seconds=600"},
            {"label": "Pausar", "url": "http://localhost:8080/api/deck/timer?action=pause"},
            {"label": "Reiniciar", "url": "http://localhost:8080/api/deck/timer?action=reset"}
        ],
        "widget_actions": [
            {"label": "Shoutout Streamer (Promo)", "url": "http://localhost:8080/api/deck/widget?widget=promo&streamer=STREAMER_NAME"},
            {"label": "Sumar +1 a Meta (Goal)", "url": "http://localhost:8080/api/deck/widget?widget=goal&action=add&amount=1"},
            {"label": "Mensaje en Ticker", "url": "http://localhost:8080/api/deck/widget?widget=ticker&action=message&text=HOLA+STREAM"},
            {"label": "Limpiar Chat Overlay", "url": "http://localhost:8080/api/deck/widget?widget=chat&action=clear"}
        ],
        "effects": [
            {"label": "Lluvia de Confeti 🎉", "url": "http://localhost:8080/api/deck/explode?emoji=🎉&count=40"},
            {"label": "Lluvia de Corazones ❤️", "url": "http://localhost:8080/api/deck/explode?emoji=❤️&count=40"}
        ]
    })

async def handle_deck_status(request):
    """
    Devuelve el estado en tiempo real del sistema para el Launcher de escritorio,
    OpenDeck, Ajazz AKP y plugins de Elgato Stream Deck.
    Ejemplo: GET /api/deck/status
    """
    from server.routes.themes_routes import load_theme_state
    theme_state = load_theme_state()
    active_theme = theme_state.get("activeTheme", "maker_electronico")
    active_pack = theme_state.get("activePack", "pack_open_stream_suite")

    return web.json_response({
        "status": "ok",
        "running": True,
        "connectedClients": len(system.connected_clients),
        "activeTheme": active_theme,
        "activePack": active_pack,
        "twitchConnected": bool(system.user_info),
        "user": system.user_info.get("display_name") if system.user_info else None
    })

def register_deck_routes(app):
    """Registra las rutas de integración para Decks físicos (Ajazz, Stream Deck, OpenDeck)"""
    app.router.add_get("/api/deck/status", handle_deck_status)
    app.router.add_post("/api/deck/status", handle_deck_status)
    app.router.add_get("/api/deck/trigger", handle_deck_trigger)
    app.router.add_post("/api/deck/trigger", handle_deck_trigger)
    app.router.add_get("/api/deck/theme", handle_deck_theme)
    app.router.add_post("/api/deck/theme", handle_deck_theme)
    app.router.add_get("/api/deck/timer", handle_deck_timer)
    app.router.add_post("/api/deck/timer", handle_deck_timer)
    app.router.add_get("/api/deck/alert", handle_deck_alert)
    app.router.add_post("/api/deck/alert", handle_deck_alert)
    app.router.add_get("/api/deck/explode", handle_deck_explode)
    app.router.add_post("/api/deck/explode", handle_deck_explode)
    app.router.add_get("/api/deck/widget", handle_widget_action)
    app.router.add_post("/api/deck/widget", handle_widget_action)
    app.router.add_get("/api/deck/knob", handle_deck_knob)
    app.router.add_post("/api/deck/knob", handle_deck_knob)
    app.router.add_get("/api/deck/actions", handle_deck_actions_catalog)
