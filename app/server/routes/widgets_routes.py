"""
server/routes/widgets_routes.py — Rutas HTTP de la API modular de widgets
Controladores para consultar/guardar configuraciones, acciones rápidas y lector de feeds RSS.
"""

import json
import aiohttp
import xml.etree.ElementTree as ET
from aiohttp import web
from server.config import (
    WIDGETS_DIR,
    WIDGETS_CONFIG_FILE,
    WIDGET_CONFIG_MAPPING,
    logger
)
from server.state import system
from server.services.widgets_service import (
    load_widgets_config,
    save_widgets_config,
    auto_sync_twitch_goals
)
from server.services.widgets_actions import handle_widget_action

async def handle_get_widgets_config(request):
    """Devuelve la configuración completa de widgets y sus accesos directos"""
    cfg = load_widgets_config()
    try:
        # Auto-sincronizar métricas oficiales de Twitch si está conectado
        await auto_sync_twitch_goals(cfg)
    except Exception as e:
        logger.warning(f"Error comprobando métricas de Twitch: {e}")
    return web.json_response({"status": "ok", "config": cfg})

async def handle_save_widgets_config(request):
    """Actualiza la configuración de widgets y notifica por WebSocket a OBS"""
    data = await request.json()
    cfg = data.get("config", {})
    if not cfg:
        return web.json_response({"status": "error", "error": "No data provided"}, status=400)
    
    if save_widgets_config(cfg):
        # Difundir a todos los widgets conectados
        await system.broadcast({
            "type": "widgets_config_updated",
            "config": cfg
        })
        return web.json_response({"status": "ok", "config": cfg})
    return web.json_response({"status": "error", "error": "Could not save configuration"}, status=500)

async def handle_get_single_widget_config(request):
    """Devuelve la configuración modular de un widget individual"""
    widget = request.match_info.get("widget", "").lower()
    cfg = load_widgets_config()
    if widget == "goal":
        try:
            await auto_sync_twitch_goals(cfg)
        except Exception as e:
            logger.warning(f"Error comprobando métricas de Twitch para goal: {e}")

    widget_cfg = cfg.get(widget)
    if widget_cfg is None:
        # Compatibilidad alias shoutout <-> promo
        if widget == "shoutout":
            widget_cfg = cfg.get("promo")
        elif widget == "promo":
            widget_cfg = cfg.get("shoutout")

    if widget_cfg is None:
        return web.json_response({"status": "error", "error": f"Widget '{widget}' no encontrado"}, status=404)

    return web.json_response({"status": "ok", "widget": widget, "config": widget_cfg})

async def handle_save_single_widget_config(request):
    """Actualiza la configuración de un widget individual y notifica por WebSocket a OBS"""
    widget = request.match_info.get("widget", "").lower()
    try:
        data = await request.json()
    except Exception:
        data = {}

    widget_cfg = data.get("config", data)
    if not widget_cfg or not isinstance(widget_cfg, dict):
        return web.json_response({"status": "error", "error": "Configuración inválida"}, status=400)

    cfg = load_widgets_config()
    save_key = "promo" if widget == "shoutout" and "promo" in cfg else widget
    cfg[save_key] = widget_cfg

    if save_widgets_config(cfg):
        await system.broadcast({
            "type": "widgets_config_updated",
            "widget": save_key,
            "config": cfg
        })
        return web.json_response({"status": "ok", "widget": save_key, "config": widget_cfg})
    return web.json_response({"status": "error", "error": f"No se pudo guardar la configuración de {widget}"}, status=500)



async def handle_get_rss_feed(request):
    """Obtiene y parsea un feed RSS/Atom para mostrar noticias en el Ticker/Prompter"""
    url = request.query.get("url", "").strip()
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return web.json_response({"status": "error", "error": "URL de RSS inválida"}, status=400)

    headers = {
        "User-Agent": "Mozilla/5.0 (OpenStreamSuiteOverlay/1.0; RSS Reader)"
    }
    try:
        timeout = aiohttp.ClientTimeout(total=8)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=headers) as resp:
                if resp.status != 200:
                    return web.json_response({"status": "error", "error": f"HTTP {resp.status} al obtener RSS"}, status=resp.status)
                xml_text = await resp.text()

        # Parsear XML (RSS 2.0 o Atom)
        root = ET.fromstring(xml_text)
        items_list = []
        feed_title = "Noticias RSS"

        # Formato RSS 2.0 (<channel><item>...)
        channel = root.find("channel")
        if channel is not None:
            t_el = channel.find("title")
            if t_el is not None and t_el.text:
                feed_title = t_el.text.strip()
            for it in channel.findall("item"):
                title_el = it.find("title")
                link_el = it.find("link")
                if title_el is not None and title_el.text:
                    clean_title = title_el.text.strip().replace("\n", " ").replace("\r", "")
                    items_list.append({
                        "title": clean_title,
                        "link": link_el.text.strip() if link_el is not None and link_el.text else ""
                    })
        else:
            # Formato Atom (<feed><entry>...)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            t_el = root.find("atom:title", ns) or root.find("title")
            if t_el is not None and t_el.text:
                feed_title = t_el.text.strip()
            entries = root.findall("atom:entry", ns) or root.findall("entry")
            for entry in entries:
                title_el = entry.find("atom:title", ns) or entry.find("title")
                if title_el is not None and title_el.text:
                    clean_title = title_el.text.strip().replace("\n", " ").replace("\r", "")
                    items_list.append({
                        "title": clean_title,
                        "link": ""
                    })

        return web.json_response({
            "status": "ok",
            "feed_title": feed_title,
            "count": len(items_list),
            "items": items_list[:25]
        })
    except Exception as e:
        logger.warning(f"Error parseando feed RSS ({url}): {e}")
        return web.json_response({"status": "error", "error": f"Error al parsear RSS: {str(e)}"}, status=500)

def register_widgets_routes(app):
    """Registra las rutas de la API de widgets"""
    app.router.add_get("/api/widgets/config", handle_get_widgets_config)
    app.router.add_post("/api/widgets/config", handle_save_widgets_config)
    app.router.add_get("/api/widgets/{widget}/config", handle_get_single_widget_config)
    app.router.add_post("/api/widgets/{widget}/config", handle_save_single_widget_config)
    app.router.add_get("/api/widgets/action", handle_widget_action)
    app.router.add_post("/api/widgets/action", handle_widget_action)
    app.router.add_get("/api/rss/feed", handle_get_rss_feed)
