import json
import aiohttp
from aiohttp import web
from server.config import logger
from server.state import system

async def handle_ws(request):
    """Punto de conexión WebSocket para la fuente de OBS y el panel"""
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
                data = json.loads(msg.data)
                # Pruebas manuales desde el panel
                if data.get("action") == "test":
                    await system.broadcast(data.get("payload", {}))
    finally:
        system.connected_clients.discard(ws)
        logger.info(f"Cliente desconectado del WebSocket (Restantes: {len(system.connected_clients)})")

    return ws
