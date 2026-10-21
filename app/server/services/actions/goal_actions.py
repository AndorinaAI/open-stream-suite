"""Acciones de metas, progreso, incremento y celebraciones."""
from aiohttp import web
from server.state import system
from server.services.widgets_service import load_widgets_config, save_widgets_config

async def handle_goal_action(action, params):
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

