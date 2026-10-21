"""
server/routes/alerts_routes.py — Rutas HTTP de la API de alertas en vivo
Controladores para consultar y guardar configuración de alertas, temas y pruebas.
"""

from aiohttp import web
from server.services.alerts_service import (
    ALERTS_CONFIG_FILE,
    THEMES_CONFIG_FILE,
    load_alerts_config,
    save_alerts_config,
    load_alert_themes_config,
    save_alert_themes_config,
    format_alert_event,
    apply_alert_theme_service,
    test_alert_service
)
from server.state import system


async def handle_get_alerts_config(request):
    """Devuelve la configuración completa de alertas"""
    cfg = load_alerts_config()
    return web.json_response({"status": "ok", "config": {"alerts": cfg}, "alerts": cfg})


async def handle_save_alerts_config(request):
    """Guarda la configuración completa de alertas y notifica a OBS"""
    try:
        data = await request.json()
        new_cfg = data.get("alerts") or data.get("config") or data
        if isinstance(new_cfg, dict) and "alerts" in new_cfg and isinstance(new_cfg["alerts"], dict):
            new_cfg = new_cfg["alerts"]

        if not isinstance(new_cfg, dict):
            return web.json_response({"error": "Payload inválido"}, status=400)

        if save_alerts_config(new_cfg):
            await system.broadcast({
                "type": "alerts_config_updated",
                "config": {"alerts": new_cfg},
                "alerts": new_cfg
            })
            return web.json_response({"status": "ok", "config": {"alerts": new_cfg}, "alerts": new_cfg})
        return web.json_response({"error": "No se pudo guardar alerts_config.json"}, status=500)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_get_alert_themes(request):
    """Devuelve los temas de alertas (predefinidos y personalizados)"""
    return web.json_response({"status": "ok", "themesConfig": load_alert_themes_config()})


async def handle_save_alert_themes(request):
    """Guarda nuevos temas o actualiza temas existentes"""
    try:
        data = await request.json()
        cfg = load_alert_themes_config()
        if "deleteThemeId" in data:
            del_id = data["deleteThemeId"]
            if del_id in cfg.get("themes", {}):
                del cfg["themes"][del_id]
        if "theme" in data and isinstance(data["theme"], dict):
            t_obj = data["theme"]
            t_id = t_obj.get("id")
            if t_id:
                cfg.setdefault("themes", {})[t_id] = t_obj
        if "themes" in data:
            cfg["themes"] = data["themes"]
        if "activeTheme" in data:
            cfg["activeTheme"] = data["activeTheme"]
        save_alert_themes_config(cfg)
        return web.json_response({"status": "ok", "themesConfig": cfg})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_apply_alert_theme(request):
    """Aplica un tema predefinido o personalizado a una o todas las alertas"""
    try:
        data = await request.json()
        theme_id = data.get("themeId")
        target = data.get("target", "all")
        result = await apply_alert_theme_service(theme_id, target)
        return web.json_response({"status": "ok", **result})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=404 if "no encontrado" in str(e) else 400)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_test_alert_advanced(request):
    """Dispara una alerta de prueba avanzada para cualquier evento"""
    try:
        data = await request.json()
        alert_type = data.get("alertType", "follow")
        event_data = data.get("eventData", data)

        payload = await test_alert_service(alert_type, event_data)
        if payload:
            return web.json_response({"status": "ok", "alert": payload})
        return web.json_response({"error": "No se pudo generar la alerta"}, status=400)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


def register_alerts_routes(app):
    """Registra las rutas REST para la suite de alertas y temas"""
    app.router.add_get("/api/alerts/config", handle_get_alerts_config)
    app.router.add_post("/api/alerts/config", handle_save_alerts_config)
    app.router.add_get("/api/alerts/themes", handle_get_alert_themes)
    app.router.add_post("/api/alerts/themes", handle_save_alert_themes)
    app.router.add_post("/api/alerts/apply-theme", handle_apply_alert_theme)
    app.router.add_post("/api/alerts/test", handle_test_alert_advanced)
