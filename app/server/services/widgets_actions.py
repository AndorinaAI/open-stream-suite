"""
server/services/widgets_actions.py — Despachador principal de acciones para widgets
Delega en server/services/actions/ (timer, promo, chat, goal, ticker).
"""

from aiohttp import web
from server.config import logger
from server.services.actions import (
    handle_timer_action,
    handle_promo_action,
    handle_chat_action,
    handle_goal_action,
    handle_ticker_action
)

async def handle_widget_action(request):
    """
    Acción universal de widget (compatible con OpenDeck, StreamDeck, Ajazz, móviles y dashboard).
    Soporta POST JSON: { "widget": "timer"|"promo"|"chat"|"goal"|"ticker", "action": "...", "params": {...} }
    Soporta GET query params: /api/widgets/action?widget=promo&streamer=pepe
    """
    if request.method == "GET" or not request.can_read_body:
        data = dict(request.query)
        widget = data.get("widget", "")
        action = data.get("action", "")
        params = {k: v for k, v in data.items() if k not in ("widget", "action")}
        if "seconds" in params:
            try: params["seconds"] = int(params["seconds"])
            except ValueError: pass
        if "amount" in params:
            try: params["amount"] = float(params["amount"])
            except ValueError: pass
    else:
        try:
            data = await request.json()
        except Exception:
            data = dict(request.query)
        widget = data.get("widget", "")
        action = data.get("action", "")
        params = data.get("params", {})
        if not params and isinstance(data, dict):
            params = {k: v for k, v in data.items() if k not in ("widget", "action")}

    logger.info(f"🕹️ Widget Action recibida: {widget} -> {action} ({params})")

    # GET es para lecturas o para el camino de decks (que ya valida Origin).
    # Una acción con efectos desde /api/widgets/action debe ir por POST con token.
    read_only = {("chat", "get_recent"), ("promo", "get_history")}
    if request.method == "GET" and not request.path.startswith("/api/deck/") and (widget, action) not in read_only:
        return web.json_response({
            "status": "error",
            "error": "Las acciones de widget requieren POST con X-Local-Token",
        }, status=403)

    if widget == "timer":
        return await handle_timer_action(action, params)
    elif widget in ("promo", "shoutout"):
        return await handle_promo_action(action, params)
    elif widget == "chat":
        return await handle_chat_action(action, params)
    elif widget == "goal":
        return await handle_goal_action(action, params)
    elif widget == "ticker":
        return await handle_ticker_action(action, params)

    return web.json_response({"status": "error", "error": f"Unknown widget: {widget}"}, status=400)
