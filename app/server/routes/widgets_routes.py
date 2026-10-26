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
    auto_sync_twitch_goals,
    is_valid_widget_key
)
from server.services.widgets_actions import handle_widget_action
from server.services.url_safety import assert_public_url, UnsafeURL, safe_redirect

MAX_RSS_BYTES = 2_000_000
RSS_CHUNK_BYTES = 64 * 1024


class RSSFeedTooLarge(Exception):
    """El cuerpo del feed supera el límite permitido."""


async def _read_rss_body(resp) -> bytes:
    """Lee el cuerpo completo, no solo el primer chunk de un feed chunked/gzip."""
    body = bytearray()
    async for chunk in resp.content.iter_chunked(RSS_CHUNK_BYTES):
        body.extend(chunk)
        if len(body) > MAX_RSS_BYTES:
            raise RSSFeedTooLarge()
    return bytes(body)


async def handle_get_widgets_config(request):
    """Devuelve la configuración completa de widgets y sus accesos directos"""
    # La sincronización con Twitch es explícita (/api/twitch/channel):
    # un GET de configuración no debe hacer red ni modificar metas.
    return web.json_response({"status": "ok", "config": load_widgets_config()})

async def handle_save_widgets_config(request):
    """Actualiza la configuración de widgets y notifica por WebSocket a OBS."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"status": "error", "error": "Payload JSON inválido"}, status=400)
    cfg = data.get("config", {}) if isinstance(data, dict) else {}
    if not cfg or not isinstance(cfg, dict):
        return web.json_response({"status": "error", "error": "No data provided"}, status=400)
    invalid = [key for key in cfg if not is_valid_widget_key(key)]
    if invalid:
        return web.json_response({"status": "error", "error": f"Widget(s) no válido(s): {', '.join(map(str, invalid))}"}, status=400)
    
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
    if not is_valid_widget_key(widget):
        return web.json_response({"status": "error", "error": f"Widget '{widget}' no válido"}, status=404)
    cfg = load_widgets_config()

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
    if not is_valid_widget_key(widget):
        return web.json_response({"status": "error", "error": f"Widget '{widget}' no válido"}, status=404)
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"status": "error", "error": "Payload JSON inválido"}, status=400)

    widget_cfg = data.get("config", data) if isinstance(data, dict) else None
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



async def handle_sync_twitch_channel(request):
    """Sincroniza metas oficiales con Twitch Helix bajo demanda (botón Sync Twitch)."""
    if not system.token_data or not system.user_info:
        return web.json_response({"status": "error", "error": "Twitch no conectado"}, status=400)
    cfg = load_widgets_config()
    changed = await auto_sync_twitch_goals(cfg)
    return web.json_response({"status": "ok", "synced": bool(changed), "config": cfg.get("goal", {})})


async def handle_get_rss_feed(request):
    """Obtiene un feed RSS/Atom público, bloqueando SSRF y respuestas enormes."""
    url = request.query.get("url", "").strip()
    if not url:
        return web.json_response({"status": "error", "error": "URL de RSS inválida"}, status=400)

    headers = {"User-Agent": "Mozilla/5.0 (OpenStreamSuiteOverlay/1.0; RSS Reader)"}
    current = url
    try:
        timeout = aiohttp.ClientTimeout(total=8)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            for _ in range(5):
                current = await assert_public_url(current)
                async with session.get(current, headers=headers, allow_redirects=False) as resp:
                    if resp.status in (301, 302, 303, 307, 308):
                        location = resp.headers.get("Location", "")
                        try:
                            current = safe_redirect(current, location)
                        except UnsafeURL as e:
                            return web.json_response({"status": "error", "error": str(e)}, status=400)
                        continue
                    if resp.status != 200:
                        return web.json_response(
                            {"status": "error", "error": f"HTTP {resp.status} al obtener RSS"},
                            status=resp.status,
                        )
                    try:
                        raw = await _read_rss_body(resp)
                    except RSSFeedTooLarge:
                        return web.json_response(
                            {"status": "error", "error": "El feed supera el límite de 2 MB"},
                            status=413,
                        )
                    xml_text = raw.decode("utf-8", errors="replace")
                    break
            else:
                return web.json_response({"status": "error", "error": "Demasiadas redirecciones"}, status=400)
    except UnsafeURL as e:
        return web.json_response({"status": "error", "error": str(e)}, status=400)
    except Exception as e:
        logger.warning(f"Error obteniendo feed RSS: {e}")
        return web.json_response({"status": "error", "error": "No se pudo obtener el feed RSS"}, status=502)

    try:
        root = ET.fromstring(xml_text)
    except Exception:
        return web.json_response({"status": "error", "error": "El contenido no es XML/RSS válido"}, status=422)

    items_list = []
    feed_title = "Noticias RSS"
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
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        t_el = root.find("atom:title", ns) or root.find("title")
        if t_el is not None and t_el.text:
            feed_title = t_el.text.strip()
        entries = root.findall("atom:entry", ns) or root.findall("entry")
        for entry in entries:
            title_el = entry.find("atom:title", ns) or entry.find("title")
            if title_el is not None and title_el.text:
                clean_title = title_el.text.strip().replace("\n", " ").replace("\r", "")
                items_list.append({"title": clean_title, "link": ""})

    return web.json_response({
        "status": "ok",
        "feed_title": feed_title,
        "count": len(items_list),
        "items": items_list[:25]
    })

def register_widgets_routes(app):
    """Registra las rutas de la API de widgets"""
    app.router.add_get("/api/components/catalog", handle_components_catalog)
    app.router.add_get("/api/widgets/config", handle_get_widgets_config)
    app.router.add_post("/api/widgets/config", handle_save_widgets_config)
    app.router.add_get("/api/widgets/{widget}/config", handle_get_single_widget_config)
    app.router.add_post("/api/widgets/{widget}/config", handle_save_single_widget_config)
    app.router.add_get("/api/widgets/action", handle_widget_action)
    app.router.add_post("/api/widgets/action", handle_widget_action)
    app.router.add_get("/api/twitch/channel", handle_sync_twitch_channel)
    app.router.add_get("/api/rss/feed", handle_get_rss_feed)


async def handle_components_catalog(request):
    """Catálogo de miembros tematizables (widgets y alertas de panel)."""
    from server.services import components_catalog
    return web.json_response(components_catalog.catalog())
