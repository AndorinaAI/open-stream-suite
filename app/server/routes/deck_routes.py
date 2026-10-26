import json
from aiohttp import web
from server.config import logger
from server.state import system
from server.routes.widgets_routes import handle_widget_action
from server.services.theme_manager import (
    save_theme_state,
    load_theme_state,
    get_theme_dir,
    sync_chat_with_theme,
    THEMES_DIR,
    STREAMTHEMES_DIR,
)
from server.services.theme_service import apply_theme_service
from server.services.validation_utils import is_valid_pack_id, is_valid_theme_id
from server.services.deck_service import (
    execute_deck_knob,
    get_deck_actions_catalog,
    get_deck_system_status,
)

async def handle_deck_trigger(request):
    """
    Endpoint para Elgato Stream Deck / Ajazz AKP / OpenDeck / Bitfocus Companion.
    Permite disparar cualquier trigger/meme por ID, nombre o comando chat.
    Soporta GET o POST.
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
    """Aplica un tema desde el Stream Deck usando la misma validación que la API web."""
    theme_id = request.query.get("id") or request.query.get("theme")
    explicit_pack = request.query.get("pack")
    if not theme_id and request.can_read_body:
        try:
            data = await request.json()
            theme_id = data.get("id") or data.get("theme")
            if data.get("pack"):
                explicit_pack = data.get("pack")
        except Exception:
            pass

    theme_id = str(theme_id or "").strip()
    if not theme_id:
        return web.json_response({
            "status": "error",
            "message": "Falta parámetro 'id'. Ejemplo: /api/deck/theme?id=maker"
        }, status=400)

    if explicit_pack:
        pack_id = str(explicit_pack).strip()
        if not is_valid_pack_id(pack_id) or not is_valid_theme_id(pack_id, theme_id):
            return web.json_response({
                "status": "error",
                "message": f"El tema '{theme_id}' no existe en el pack '{pack_id}'"
            }, status=404)
    else:
        pack_id = None
        for candidate in sorted(STREAMTHEMES_DIR.iterdir()):
            if candidate.is_dir() and is_valid_theme_id(candidate.name, theme_id):
                pack_id = candidate.name
                break
        if not pack_id:
            return web.json_response({
                "status": "error",
                "message": f"El tema '{theme_id}' no existe en ningún pack de temas"
            }, status=404)

    result = await apply_theme_service(pack_id, theme_id)
    return web.json_response({
        "status": "ok",
        "action": "theme_applied",
        "theme": theme_id,
        "pack": pack_id,
        "archetype": result.get("archetype"),
    })

async def handle_deck_timer(request):
    """Controla el temporizador del stream en OBS desde el Stream Deck."""
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
    """Dispara una alerta de prueba desde el Stream Deck."""
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
    """Lanza lluvia de emoticonos en OBS."""
    emoji = request.query.get("emoji") or "🎉"
    count = int(request.query.get("count") or 40)
    await system.broadcast({
        "type": "explode_emotes",
        "emoji": emoji,
        "count": count
    })
    return web.json_response({"status": "ok", "emoji": emoji, "count": count})

async def handle_deck_knob(request):
    """Endpoint para mandos giratorios (Knobs / Encoders) y zonas táctiles."""
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

    delta_param = int(params["delta"]) if "delta" in params else None

    result = await execute_deck_knob(knob, action, ticks, delta_param, params)
    status_code = result.pop("code", 200)
    return web.json_response(result, status=status_code)

async def handle_deck_actions_catalog(request):
    """Devuelve un catálogo completo con todos los triggers, temas, widgets y acciones."""
    catalog = get_deck_actions_catalog()
    return web.json_response(catalog)

async def handle_deck_status(request):
    """Devuelve el estado en tiempo real del sistema para el Launcher y Decks."""
    data = get_deck_system_status()
    return web.json_response(data)

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
