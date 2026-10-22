"""
server/routes/fusions_routes.py — Rutas HTTP de la API de Fusiones (Fusions)
Controladores REST para crear, listar, modificar, eliminar y aplicar estilos en lote a fusiones de overlays.
"""

from aiohttp import web
from server.services.fusions_service import (
    load_fusions,
    get_fusion_by_id,
    create_or_update_fusion,
    delete_fusion,
    apply_fusion_theme_batch,
    apply_fusion_shape_batch
)


async def handle_get_fusions(request):
    """Devuelve la lista de todas las fusiones configuradas"""
    fusions = load_fusions()
    return web.json_response({"status": "ok", "fusions": fusions})


async def handle_get_single_fusion(request):
    """Devuelve los datos de una fusión concreta"""
    fusion_id = request.match_info.get("id", "").strip()
    fusion = get_fusion_by_id(fusion_id)
    if not fusion:
        return web.json_response({"error": "Fusión no encontrada"}, status=404)
    return web.json_response({"status": "ok", "fusion": fusion})


async def handle_save_fusion(request):
    """Crea o actualiza una fusión de overlays"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    try:
        fusion = create_or_update_fusion(body)
        return web.json_response({"status": "ok", "fusion": fusion})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_delete_fusion(request):
    """Elimina una fusión de overlays"""
    fusion_id = request.match_info.get("id", "").strip()
    if not fusion_id:
        return web.json_response({"error": "ID de fusión requerido"}, status=400)

    success = delete_fusion(fusion_id)
    if not success:
        return web.json_response({"error": "Fusión no encontrada"}, status=404)
    return web.json_response({"status": "ok", "deletedId": fusion_id})


async def handle_apply_fusion_theme(request):
    """Aplica un tema visual a todos los overlays pertenecientes a una fusión"""
    fusion_id = request.match_info.get("id", "").strip()
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    theme_id = str(body.get("themeId", "")).strip()
    if not theme_id:
        return web.json_response({"error": "themeId requerido"}, status=400)

    try:
        res = await apply_fusion_theme_batch(fusion_id, theme_id)
        return web.json_response(res)
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=404)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_apply_fusion_shape(request):
    """Aplica una forma física a todos los overlays pertenecientes a una fusión"""
    fusion_id = request.match_info.get("id", "").strip()
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    shape_id = str(body.get("shapeId", "original")).strip()

    try:
        res = await apply_fusion_shape_batch(fusion_id, shape_id)
        return web.json_response(res)
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=404)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


def register_fusions_routes(app):
    """Registra los endpoints HTTP para la gestión de Fusiones de overlays"""
    app.router.add_get("/api/fusions", handle_get_fusions)
    app.router.add_post("/api/fusions", handle_save_fusion)
    app.router.add_get("/api/fusions/{id}", handle_get_single_fusion)
    app.router.add_delete("/api/fusions/{id}", handle_delete_fusion)
    app.router.add_post("/api/fusions/{id}/apply-theme", handle_apply_fusion_theme)
    app.router.add_post("/api/fusions/{id}/apply-shape", handle_apply_fusion_shape)
