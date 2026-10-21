"""
server/routes/overlay_routes.py — Rutas HTTP para gestión de textos de overlays y escenas
"""

from aiohttp import web
from server.config import logger
from server.state import system
from server.services.overlay_service import (
    OVERLAY_TEXTS_FILE,
    CONFIG_JS_FILE,
    DEFAULT_OVERLAY_TEXTS,
    load_overlay_texts,
    save_overlay_texts_to_disk,
    reset_overlay_texts,
)

# Alias de compatibilidad hacia atrás
load_overlay_texts_from_disk = load_overlay_texts


async def handle_get_overlay_texts(request):
    """Devuelve todos los textos de las escenas y overlays en JSON"""
    data = load_overlay_texts()
    return web.json_response({"status": "ok", "texts": data})


async def handle_save_overlay_texts(request):
    """Guarda los textos modificados y emite evento WebSocket a todas las escenas conectadas en OBS"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    texts = body.get("texts", body)
    if not isinstance(texts, dict):
        return web.json_response({"error": "Estructura de textos no válida"}, status=400)

    save_overlay_texts_to_disk(texts)

    # Emitir evento en caliente a OBS Studio para actualizar textos al instante
    await system.broadcast({
        "type": "overlay_texts_update",
        "texts": texts
    })

    logger.info("📢 Textos de escenas y overlays actualizados en vivo")
    return web.json_response({"status": "ok", "texts": texts})


async def handle_reset_overlay_texts(request):
    """Restaura todos los textos de overlays o una sección específica a los valores originales de fábrica"""
    section = "all"
    if request.can_read_body:
        try:
            body = await request.json()
            section = body.get("section", "all")
        except Exception:
            pass

    current_texts = reset_overlay_texts(section)
    await system.broadcast({
        "type": "overlay_texts_update",
        "texts": current_texts
    })
    logger.info(f"↺ Textos de overlays restaurados (sección: {section})")
    return web.json_response({"status": "ok", "texts": current_texts, "reset_section": section})


def register_overlay_routes(app):
    """Registra los endpoints para gestión de textos de overlays y escenas"""
    # Inicializar archivo si no existe
    if not OVERLAY_TEXTS_FILE.exists():
        save_overlay_texts_to_disk(DEFAULT_OVERLAY_TEXTS)

    app.router.add_get("/api/overlays/texts", handle_get_overlay_texts)
    app.router.add_post("/api/overlays/texts", handle_save_overlay_texts)
    app.router.add_post("/api/overlays/texts/reset", handle_reset_overlay_texts)
