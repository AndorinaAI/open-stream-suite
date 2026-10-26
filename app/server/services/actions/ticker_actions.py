"""Acciones de marquesina (ticker), noticias y alertas de última hora."""
from aiohttp import web
from server.state import system
from server.services.widgets_service import load_widgets_config, save_widgets_config

async def handle_ticker_action(action, params):
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

    elif action in ("flash_news", "flash"):
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
        amount = params.get("amount", 1)
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

    return web.json_response({"status": "error", "error": f"Acción de ticker desconocida: {action}"}, status=400)
