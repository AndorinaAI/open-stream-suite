"""Acciones de chat en pantalla, emoticonos y comandos de moderación."""
import time
from aiohttp import web
from server.state import system

async def handle_chat_action(action, params):
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
        message = params.get("message", "¡Saludos desde el chat!")
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

