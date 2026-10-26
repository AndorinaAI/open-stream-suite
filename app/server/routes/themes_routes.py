"""
server/routes/themes_routes.py — Rutas HTTP de la API de temas y estilos visuales
Controladores que gestionan packs de temas, guardado, aplicación y anclaje de chat.
"""

from aiohttp import web
from server.routes.errors import internal_error_response
from server.services.theme_defaults import (
    DEFAULT_PACK_TALLER,
    DEFAULT_THEMES_DATA,
    DEFAULT_OVERLAY_THEMES
)
from server.services.validation_utils import is_valid_pack_id, is_valid_theme_id
from server.services.theme_manager import (
    STREAMTHEMES_DIR,
    THEMES_DIR,
    COMMON_THEMES_CSS,
    CHAT_CONFIG_FILE,
    THEMES_STATE_FILE,
    RESERVED_PACK_DIRS,
    load_theme_state,
    save_theme_state,
    get_pack_styles_dir,
    get_pack_overlays_dir,
    find_pack_dir,
    get_theme_dir,
    init_themes_directory,
    sync_common_themes_css,
    get_all_packs_and_themes,
    sync_chat_with_theme
)
from server.services.theme_service import (
    create_pack_service,
    create_theme_service,
    save_theme_service,
    apply_theme_service,
    apply_shape_service,
    toggle_chat_anchor_service,
    restore_theme_service,
    set_overlay_theme_service,
    set_overlay_backdrop_service
)


async def handle_get_theme_packs(request):
    """Devuelve todos los packs de temas y sus contenidos modularizados"""
    data = get_all_packs_and_themes()
    return web.json_response({"status": "ok", **data})


async def handle_create_pack(request):
    """Crea una nueva carpeta de pack en streamthemes/<pack_id>/ con sus subcarpetas styles/ y overlays/"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    try:
        meta = create_pack_service(
            name=body.get("name", ""),
            icon=body.get("icon", "🎨"),
            badge=body.get("badge", "PACK PERSONALIZADO"),
            description=body.get("description", "Colección modular de temas y estilos personalizados."),
            author=body.get("author", "Usuario")
        )
        return web.json_response({"status": "ok", "pack": meta})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)
    except FileExistsError as e:
        return web.json_response({"error": str(e)}, status=409)


async def handle_create_theme(request):
    """Crea un nuevo tema dentro de un pack específico"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    try:
        theme_meta = create_theme_service(body)
        return web.json_response({"status": "ok", "theme": theme_meta})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)
    except FileNotFoundError as e:
        return web.json_response({"error": str(e)}, status=404)
    except FileExistsError as e:
        return web.json_response({"error": str(e)}, status=409)


async def handle_save_theme(request):
    """Guarda las configuraciones y el código CSS modificado de un tema en disco"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    try:
        current_meta = await save_theme_service(body)
        return web.json_response({"status": "ok", "theme": current_meta})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)
    except FileNotFoundError as e:
        return web.json_response({"error": str(e)}, status=404)


async def handle_apply_theme(request):
    """Aplica y activa un tema en vivo para todas las escenas de OBS y el panel"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    theme_id = str(body.get("theme", "")).strip()
    pack_id = str(body.get("pack", "Maker_Theme_Pack")).strip()

    try:
        res = await apply_theme_service(pack_id, theme_id)
        return web.json_response({"status": "ok", **res})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)


async def handle_chat_anchor_toggle(request):
    """Alterna el anclaje del chat al tema activo o activa un derivado personalizado"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    pack_id = str(body.get("packId", "Maker_Theme_Pack")).strip()
    theme_id = str(body.get("themeId", "")).strip()
    anchored = bool(body.get("anchored", True))

    if not is_valid_pack_id(pack_id) or not is_valid_theme_id(pack_id, theme_id):
        return web.json_response({"error": "Pack o tema no válido"}, status=400)

    try:
        res = toggle_chat_anchor_service(pack_id, theme_id, anchored)
        return web.json_response({"status": "ok", **res})
    except FileNotFoundError as e:
        return web.json_response({"error": str(e)}, status=404)


async def handle_restore_theme(request):
    """Restaura un tema modificado a su configuración y CSS original de fábrica"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    pack_id = str(body.get("packId", "Maker_Theme_Pack")).strip()
    theme_id = str(body.get("themeId", "")).strip()

    try:
        res = await restore_theme_service(pack_id, theme_id)
        return web.json_response({"status": "ok", **res})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400 if "requerido" in str(e) else 404)
    except FileNotFoundError as e:
        return web.json_response({"error": str(e)}, status=404)


async def handle_set_overlay_theme(request):
    """Asigna un tema visual específico a una overlay o escena de OBS determinada"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    overlay_key = str(body.get("overlayKey", "")).strip()
    theme_id = str(body.get("themeId", "")).strip() if body.get("themeId") else None
    shape_raw = body.get("shapeId")
    shape_id = str(shape_raw).strip() if shape_raw is not None else ("__clear__" if "shapeId" in body else None)

    if not overlay_key:
        return web.json_response({"error": "overlayKey requerido"}, status=400)
    if theme_id is None and shape_id is None:
        return web.json_response({"error": "themeId o shapeId requerido"}, status=400)

    try:
        res = await set_overlay_theme_service(overlay_key, theme_id=theme_id, shape_id=shape_id)
        return web.json_response({"status": "ok", **res})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)


async def handle_apply_shape(request):
    """Aplica una forma física globalmente a todas las escenas de OBS y el panel"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)
    if not isinstance(body, dict):
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    shape_id = str(body.get("shape", "original")).strip()
    try:
        res = await apply_shape_service(shape_id)
        return web.json_response({"status": "ok", **res})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)


async def handle_set_overlay_backdrop(request):
    """Guarda y sincroniza el fondo/apertura decorativo para una escena de OBS"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    overlay_key = str(body.get("overlayKey", "")).strip()
    backdrop = body.get("backdrop")

    if not overlay_key:
        return web.json_response({"error": "overlayKey requerido"}, status=400)

    try:
        res = await set_overlay_backdrop_service(overlay_key, backdrop)
        return web.json_response({"status": "ok", **res})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)


def register_themes_routes(app):
    """Registra todas las rutas para la gestión modular de temas y packs"""
    init_themes_directory()
    app.router.add_get("/api/themes/packs", handle_get_theme_packs)
    app.router.add_post("/api/themes/packs/create", handle_create_pack)
    app.router.add_post("/api/themes/create", handle_create_theme)
    app.router.add_post("/api/themes/save", handle_save_theme)
    app.router.add_post("/api/themes/restore", handle_restore_theme)
    app.router.add_post("/api/themes/reset-assignment", handle_reset_assignment)
    app.router.add_post("/api/themes/overlay-assignment", handle_set_overlay_theme)
    app.router.add_post("/api/themes/backdrop", handle_set_overlay_backdrop)
    app.router.add_post("/api/themes/apply", handle_apply_theme)
    app.router.add_post("/api/themes/apply-shape", handle_apply_shape)
    app.router.add_post("/api/themes/chat-anchor", handle_chat_anchor_toggle)



async def handle_reset_assignment(request):
    """Restaura la asignación de fábrica de una escena, widget o alerta."""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)
    key = str(body.get("overlayKey", "")).strip()
    if not key:
        return web.json_response({"error": "overlayKey requerido"}, status=400)
    try:
        from server.services.theme_service import reset_overlay_assignment_service
        res = await reset_overlay_assignment_service(key)
        return web.json_response({"status": "ok", **res})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)
    except Exception as e:
        return internal_error_response("reiniciando la asignación de la overlay", e)
