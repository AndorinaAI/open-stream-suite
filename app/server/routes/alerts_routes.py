import json
import os
from pathlib import Path
from aiohttp import web
from server.config import BASE_DIR, logger
from server.state import system

ALERTS_CONFIG_FILE = BASE_DIR / "alerts_config.json"

def load_alerts_config():
    """Carga la configuración persistente de alertas en vivo"""
    if ALERTS_CONFIG_FILE.exists():
        try:
            with open(ALERTS_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error cargando alerts_config.json: {e}")
    return {}

def save_alerts_config(cfg):
    """Guarda la configuración persistente de alertas en vivo"""
    try:
        with open(ALERTS_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error guardando alerts_config.json: {e}")
        return False

THEMES_CONFIG_FILE = BASE_DIR / "alerts_themes_config.json"

def load_alert_themes_config():
    """Carga los temas predefinidos y personalizados para alertas"""
    if THEMES_CONFIG_FILE.exists():
        try:
            with open(THEMES_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error cargando {THEMES_CONFIG_FILE}: {e}")
    return {"activeTheme": "cyberpunk", "themes": {}}

def save_alert_themes_config(cfg):
    """Guarda temas predefinidos y personalizados para alertas"""
    try:
        with open(THEMES_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error guardando {THEMES_CONFIG_FILE}: {e}")
        return False

def format_alert_event(alert_type, event_data):
    """
    Combina un evento en vivo (Twitch EventSub o Webhook de donación)
    con la configuración personalizada guardada en alerts_config.json.
    Soporta personalización individual por plataforma para donaciones (Ko-fi, PayPal, BMC, Streamlabs).
    """
    cfg = load_alerts_config()
    alert_conf = cfg.get(alert_type, {})

    if alert_conf.get("enabled") is False:
        logger.info(f"Aviso: Alerta '{alert_type}' está desactivada por el usuario.")
        return None

    user = str(event_data.get("user") or event_data.get("user_name") or "Usuario")
    months = str(event_data.get("months") or "1")
    tier = str(event_data.get("tier") or "Tier 1")
    amount = str(event_data.get("amount") or "")
    currency = str(event_data.get("currency") or "EUR")
    viewers = str(event_data.get("viewers") or "0")
    bits = str(event_data.get("bits") or "0")
    message = str(event_data.get("message") or "")
    recipient = str(event_data.get("recipient") or "Alguien")
    count = str(event_data.get("count") or "5")
    raw_platform = str(event_data.get("platform") or "")
    platform_key = raw_platform.lower().replace(" ", "").replace("-", "")

    # Mapeo legible del nombre de plataforma
    platform_names = {
        "kofi": "Ko-fi",
        "paypal": "PayPal",
        "buymeacoffee": "Buy Me a Coffee",
        "bmc": "Buy Me a Coffee",
        "streamlabs": "Streamlabs"
    }
    display_platform = platform_names.get(platform_key, raw_platform or "Donación")

    def replace_vars(template):
        if not template:
            return ""
        return (
            template
            .replace("{user}", user)
            .replace("{username}", user)
            .replace("{months}", months)
            .replace("{tier}", tier)
            .replace("{amount}", amount)
            .replace("{currency}", currency)
            .replace("{viewers}", viewers)
            .replace("{bits}", bits)
            .replace("{message}", message)
            .replace("{recipient}", recipient)
            .replace("{count}", count)
            .replace("{platform}", display_platform)
        )

    # Soporte para personalización por plataforma en donaciones
    plat_conf = {}
    if alert_type == "donation":
        per_platform_enabled = alert_conf.get("perPlatformEnabled", False) or alert_conf.get("perPlatform", False)
        if per_platform_enabled:
            platforms = alert_conf.get("platforms", {})
            # Buscar coincidencia exacta o normalizada
            plat_conf = platforms.get(platform_key) or platforms.get(raw_platform.lower()) or {}

    template_title = (
        plat_conf.get("titleTemplate") or
        plat_conf.get("templateTitle") or
        alert_conf.get("templateTitle") or 
        alert_conf.get("titleTemplate") or 
        event_data.get("title") or 
        "¡NUEVA ALERTA!"
    )
    template_msg = (
        plat_conf.get("subtitleTemplate") or
        plat_conf.get("templateMessage") or
        alert_conf.get("templateMessage") or 
        alert_conf.get("subtitleTemplate") or 
        event_data.get("message") or 
        ""
    )

    title = replace_vars(template_title)
    msg = replace_vars(template_msg)

    plat_media_mode = plat_conf.get("mediaMode")
    resolved_media_mode = plat_media_mode if (plat_media_mode and plat_media_mode != "inherit") else alert_conf.get("mediaMode", "banner")

    payload = {
        "type": "custom_alert",
        "alertType": alert_type,
        "platform": platform_key,
        "platformDisplay": display_platform,
        "badge": plat_conf.get("badge") or alert_conf.get("badge"),
        "user": user,
        "title": title,
        "message": msg,
        "mediaMode": resolved_media_mode,
        "mediaUrl": plat_conf.get("mediaUrl") or alert_conf.get("mediaUrl", ""),
        "mediaType": plat_conf.get("mediaType") or alert_conf.get("mediaType", "image"),
        "soundMode": plat_conf.get("soundMode") or alert_conf.get("soundMode", "synth"),
        "soundUrl": plat_conf.get("soundUrl") or alert_conf.get("soundUrl", ""),
        "synthTone": plat_conf.get("synthTone") or alert_conf.get("synthTone", "coin" if alert_type == "donation" else "sub"),
        "soundVolume": plat_conf.get("soundVolume") if plat_conf.get("soundVolume") is not None else alert_conf.get("soundVolume", 80),
        "videoVolume": plat_conf.get("videoVolume") if plat_conf.get("videoVolume") is not None else alert_conf.get("videoVolume", 80),
        "duration": alert_conf.get("duration", 5000),
        "position": alert_conf.get("position", "center"),
        "customX": alert_conf.get("customX", 50),
        "customY": alert_conf.get("customY", 30),
        "animationIn": plat_conf.get("bannerAnimation") or alert_conf.get("bannerAnimation") or alert_conf.get("animationIn", "pop"),
        "animationOut": alert_conf.get("animationOut", "fade"),
        "bannerStyle": plat_conf.get("bannerStyle") or alert_conf.get("bannerStyle", "cyberpunk"),
        "bannerIcon": plat_conf.get("bannerIcon") or alert_conf.get("bannerIcon", "coffee" if alert_type == "donation" else "star"),
        "accentColor": plat_conf.get("bannerAccentColor") or plat_conf.get("accentColor") or alert_conf.get("accentColor", "#57D6C4"),
        "bgColor": alert_conf.get("bgColor", "#191D21"),
        "bgOpacity": alert_conf.get("bgOpacity", 92),
        "borderColor": plat_conf.get("bannerBorderColor") or alert_conf.get("borderColor", "#57D6C4"),
        "bannerBorderColor": plat_conf.get("bannerBorderColor") or alert_conf.get("bannerBorderColor") or alert_conf.get("borderColor") or "#57D6C4",
        "bannerTextColor": plat_conf.get("bannerTextColor") or alert_conf.get("bannerTextColor") or "#FFFFFF",
        "bannerFontFamily": plat_conf.get("bannerFontFamily") or alert_conf.get("bannerFontFamily") or alert_conf.get("fontFamily") or "var(--font-tech), monospace",
        "bannerAnimation": plat_conf.get("bannerAnimation") or alert_conf.get("bannerAnimation") or alert_conf.get("animationIn") or "pop",
        "showParticles": alert_conf.get("showParticles", True),
        "particleEmoji": plat_conf.get("particleEmoji") or alert_conf.get("particleEmoji", "💰" if alert_type == "donation" else "🎉"),
        "showCaption": alert_conf.get("showCaption", alert_conf.get("overlayText", True)),
        "captionPosition": alert_conf.get("captionPosition", alert_conf.get("textPosition", "below")),
        "fontFamily": plat_conf.get("bannerFontFamily") or alert_conf.get("fontFamily", "outfit"),
        "titleFontSize": alert_conf.get("titleFontSize", 13),
        "userFontSize": alert_conf.get("userFontSize", 26),
        "messageFontSize": alert_conf.get("messageFontSize", 14),
        "glowIntensity": alert_conf.get("glowIntensity", 40)
    }

    # Si los estilos están linkeados con el chat, importar los valores del chat
    if alert_conf.get("chatStyleLinked"):
        try:
            from server.config import WIDGETS_DIR
            chat_cfg_file = WIDGETS_DIR / "chat" / "config.json"
            if chat_cfg_file.exists():
                with open(chat_cfg_file, "r", encoding="utf-8") as f:
                    chat_cfg = json.load(f)
                    styles = chat_cfg.get("styles", {})
                    if styles.get("fontFamily"):
                        payload["fontFamily"] = styles["fontFamily"]
                        payload["bannerFontFamily"] = styles["fontFamily"]
                    if styles.get("borderColor"):
                        payload["borderColor"] = styles["borderColor"]
                        payload["accentColor"] = styles["borderColor"]
                        payload["bannerBorderColor"] = styles["borderColor"]
                    if styles.get("glowIntensity") is not None:
                        payload["glowIntensity"] = styles["glowIntensity"]
        except Exception as e:
            logger.warning(f"No se pudieron heredar estilos del chat: {e}")

    return payload

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
        target = data.get("target", "all") # "all" o tipo de alerta específico

        themes_cfg = load_alert_themes_config()
        theme = themes_cfg.get("themes", {}).get(theme_id)
        if not theme:
            return web.json_response({"error": f"Tema '{theme_id}' no encontrado"}, status=404)

        alerts_cfg = load_alerts_config()
        targets = alerts_cfg.keys() if target == "all" else [target]

        for t in targets:
            if t in alerts_cfg:
                alerts_cfg[t]["bannerStyle"] = theme.get("style", theme_id)
                alerts_cfg[t]["bannerBorderColor"] = theme.get("borderColor") or theme.get("accentColor", "#57D6C4")
                alerts_cfg[t]["bannerAccentColor"] = theme.get("accentColor", "#57D6C4")
                alerts_cfg[t]["bannerTextColor"] = theme.get("textColor", "#FFFFFF")
                alerts_cfg[t]["bannerFontFamily"] = theme.get("fontFamily", "var(--font-tech), monospace")
                alerts_cfg[t]["bannerAnimation"] = theme.get("animation", "pop")
                alerts_cfg[t]["chatStyleLinked"] = False

        save_alerts_config(alerts_cfg)
        themes_cfg["activeTheme"] = theme_id
        save_alert_themes_config(themes_cfg)

        await system.broadcast({
            "type": "alerts_config_updated",
            "config": {"alerts": alerts_cfg},
            "alerts": alerts_cfg
        })
        return web.json_response({"status": "ok", "alerts": alerts_cfg, "appliedTheme": theme})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_test_alert_advanced(request):
    """Dispara una alerta de prueba avanzada para cualquier evento"""
    try:
        data = await request.json()
        alert_type = data.get("alertType", "follow")
        event_data = data.get("eventData", data)

        payload = format_alert_event(alert_type, event_data)
        if not payload:
            cfg = load_alerts_config()
            cached_enabled = cfg.get(alert_type, {}).get("enabled", True)
            cfg.setdefault(alert_type, {})["enabled"] = True
            save_alerts_config(cfg)
            payload = format_alert_event(alert_type, event_data)
            cfg[alert_type]["enabled"] = cached_enabled
            save_alerts_config(cfg)

        if payload:
            await system.broadcast(payload)
            logger.info(f"📢 Alerta de prueba enviada a OBS: {alert_type} ({payload.get('user')})")
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

