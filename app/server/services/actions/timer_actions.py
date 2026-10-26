"""Acciones y controles del temporizador."""
from aiohttp import web
from server.state import system

async def handle_timer_action(action, params):
    # Control de temporizador
    payload = {
        "type": "timer_control",
        "action": action,
        "seconds": params.get("seconds", 300),
        "title": params.get("title", "TEMPORIZADOR"),
        **params
    }
    await system.broadcast(payload)
    return web.json_response({"status": "ok", "action": action, "widget": "timer", "payload": payload})

