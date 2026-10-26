import json
import aiohttp
from aiohttp import web
from server.config import logger
from server.state import system
from server.security import is_websocket_allowed

async def handle_ws(request):
    """Punto de conexión WebSocket para la fuente de OBS y el panel."""
    if not is_websocket_allowed(request):
        logger.warning(f"🚫 WebSocket rechazado (Origin: {request.headers.get('Origin', '')})")
        return web.json_response({"status": "error", "error": "Origen o token no autorizado"}, status=403)
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    system.connected_clients.add(ws)
    logger.info(f"Cliente conectado al WebSocket local (Total: {len(system.connected_clients)})")

    # Enviar estado actual al conectarse
    await ws.send_json({
        "type": "system_status",
        "twitch_connected": bool(system.user_info),
        "user_name": system.user_info["display_name"] if system.user_info else None
    })

    try:
        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data) if msg.data else {}
                except Exception:
                    data = {}
                # Pruebas manuales desde el panel y control desde OpenDeck / Stream Deck
                action = data.get("action")
                if action == "test":
                    await system.broadcast(data.get("payload", {}))
                elif action == "trigger":
                    ident = data.get("id") or data.get("name") or data.get("command")
                    if ident:
                        trig = system.find_trigger_by_id_or_name(ident) or system.find_trigger_by_command(str(ident).lstrip("!"))
                        if trig:
                            await system.dispatch_trigger(trig, data.get("user", "WebSocketDeck"), reason="ws_deck")
                            await ws.send_json({"status": "ok", "action": "trigger", "id": trig.get("id")})
                        else:
                            await ws.send_json({"status": "error", "message": f"Trigger '{ident}' no encontrado"})
                elif action == "theme":
                    theme_id = data.get("id") or data.get("theme")
                    if theme_id:
                        await system.broadcast({"type": "theme_change", "theme": theme_id})
                        await ws.send_json({"status": "ok", "action": "theme", "theme": theme_id})
                elif action == "timer":
                    payload = {
                        "type": "timer_control",
                        "action": data.get("timer_action", "start"),
                        "seconds": int(data.get("seconds", 300)),
                        "title": data.get("title", "TEMPORIZADOR")
                    }
                    await system.broadcast(payload)
                    await ws.send_json({"status": "ok", "action": "timer", "payload": payload})
                elif action == "explode":
                    await system.broadcast({
                        "type": "explode_emotes",
                        "emoji": data.get("emoji", "🎉"),
                        "count": int(data.get("count", 40))
                    })
                    await ws.send_json({"status": "ok", "action": "explode"})
                elif action == "alert":
                    from server.routes.alerts_routes import format_alert_event
                    alert_type = data.get("alert_type") or data.get("type", "follow")
                    user = data.get("user", "DeckUser")
                    alert_data = format_alert_event(alert_type, {"user": user, "amount": data.get("amount", "")})
                    if alert_data:
                        await system.broadcast(alert_data)
                        await ws.send_json({"status": "ok", "action": "alert", "alert": alert_data})
    finally:
        system.connected_clients.discard(ws)
        logger.info(f"Cliente desconectado del WebSocket (Restantes: {len(system.connected_clients)})")

    return ws
