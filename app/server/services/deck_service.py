import json
from server.config import logger, TRIGGERS_FILE
from server.state import system
from server.services.theme_manager import (
    load_theme_state,
    save_theme_state,
    get_all_packs_and_themes,
    sync_chat_with_theme,
    THEMES_DIR,
)
from server.services.widgets_service import load_widgets_config, save_widgets_config

async def execute_deck_knob(knob: str, action: str, ticks: int, delta_param: int | None, raw_params: dict) -> dict:
    """Procesa la interacción física de perillas/encoders y pantallas táctiles de decks."""
    if knob == "timer":
        if action in ("press", "click"):
            payload = {"type": "timer_control", "action": "pause"}
            await system.broadcast(payload)
            return {"status": "ok", "knob": "timer", "action": "pause"}
        elif action in ("touch", "tap"):
            payload = {"type": "timer_control", "action": "start", "seconds": 300, "title": "DESCANSO"}
            await system.broadcast(payload)
            return {"status": "ok", "knob": "timer", "action": "start_5m"}
        else:
            delta = delta_param if delta_param is not None else (ticks * 60)
            payload = {"type": "timer_control", "action": "add", "seconds": delta}
            await system.broadcast(payload)
            return {"status": "ok", "knob": "timer", "action": "step", "seconds_delta": delta}

    elif knob == "theme":
        packs_data = get_all_packs_and_themes()
        themes_list = []
        for p in packs_data.get("packs", []):
            for t in p.get("themes", []):
                themes_list.append((p.get("id"), t.get("id"), t.get("name")))

        if not themes_list:
            return {"status": "error", "message": "No hay temas disponibles", "code": 404}

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
        return {
            "status": "ok",
            "knob": "theme",
            "activeTheme": new_theme,
            "themeName": new_name,
            "pack": new_pack
        }

    elif knob == "goal":
        cfg = load_widgets_config()
        goal_cfg = cfg.get("goal", {})
        goals_list = goal_cfg.get("goals", [])
        if action in ("press", "click", "touch", "tap"):
            await system.broadcast({"type": "explode_emotes", "emoji": "🎯", "count": 30})
            return {"status": "ok", "knob": "goal", "action": "celebrate"}
        else:
            delta = delta_param if delta_param is not None else (ticks * 1)
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
                return {"status": "ok", "knob": "goal", "action": "step", "goal": target}
            return {"status": "ok", "knob": "goal", "delta": delta}

    elif knob in ("fx", "sound", "effects"):
        if action in ("press", "click"):
            await system.broadcast({"type": "play_sound", "sound": "chime"})
            return {"status": "ok", "knob": "fx", "action": "chime"}
        elif ticks >= 0:
            await system.broadcast({"type": "explode_emotes", "emoji": "🎉", "count": 40})
            return {"status": "ok", "knob": "fx", "emoji": "🎉"}
        else:
            await system.broadcast({"type": "explode_emotes", "emoji": "❤️", "count": 40})
            return {"status": "ok", "knob": "fx", "emoji": "❤️"}

    await system.broadcast({"type": "knob_event", "knob": knob, "action": action, "params": raw_params})
    return {"status": "ok", "knob": knob, "action": action}

def get_deck_actions_catalog() -> dict:
    """Genera el catálogo consolidado de acciones y URLs listas para Stream Deck y plugins."""
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

    return {
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
    }

def get_deck_system_status() -> dict:
    """Devuelve el estado en tiempo real para el Launcher y decks."""
    theme_state = load_theme_state()
    return {
        "status": "ok",
        "running": True,
        "connectedClients": len(system.connected_clients),
        "activeTheme": theme_state.get("activeTheme", "maker_electronico"),
        "activePack": theme_state.get("activePack", "pack_open_stream_suite"),
        "twitchConnected": bool(system.user_info),
        "user": system.user_info.get("display_name") if system.user_info else None
    }
