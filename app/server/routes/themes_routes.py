"""
server/routes/themes_routes.py — Rutas HTTP de la API de temas y estilos visuales
Controladores que gestionan packs de temas, guardado, aplicación y anclaje de chat.
"""

from aiohttp import web
from server.routes.errors import internal_error_response, read_json_object
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
from server.services import theme_render
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
    body = await read_json_object(request)
    if body is None:
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
    body = await read_json_object(request)
    if body is None:
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
    body = await read_json_object(request)
    if body is None:
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
    body = await read_json_object(request)
    if body is None:
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
    body = await read_json_object(request)
    if body is None:
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
    body = await read_json_object(request)
    if body is None:
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


async def handle_get_theme_palette(request):
    """Paleta real de cada tema (tokens de color y geometria).

    El panel la usa para ofrecer LOS COLORES DEL PACK al personalizar, en vez
    de colores fijos que no pertenecen a ningun tema.
    """
    from server.services.overlay_service import build_theme_palette
    return web.json_response({"status": "ok", "palette": build_theme_palette()})


async def handle_set_overlay_theme(request):
    """Asigna un tema visual específico a una overlay o escena de OBS determinada"""
    body = await read_json_object(request)
    if body is None:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    overlay_key = str(body.get("overlayKey", "")).strip()
    # `themeId: ""` significa «heredar el tema global», NO «campo ausente».
    # Antes se convertia en None, el handler respondia 400 «themeId o shapeId
    # requerido» y el desplegable «Heredar tema global» no hacia nada.
    theme_raw = body.get("themeId")
    if theme_raw in (None, ""):
        theme_id = "__clear__" if "themeId" in body else None
    else:
        theme_id = str(theme_raw).strip()
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


async def handle_set_overlay_theme_bulk(request):
    """Asigna tema/forma a VARIOS componentes en una sola petición.

    El panel aplicaba por miembro (una fusión con varias escenas = decenas de
    peticiones HTTP). Aquí se hace el mismo trabajo en una llamada, reutilizando
    `set_overlay_theme_service` (que ya difunde y persiste por clave), y se
    devuelve el detalle de lo aplicado y lo fallido sin abortar al primer error.
    """
    body = await read_json_object(request)
    if body is None:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    assignments = body.get("assignments")
    if not isinstance(assignments, list) or not assignments:
        return web.json_response({"error": "assignments debe ser una lista no vacía"}, status=400)
    if len(assignments) > 200:
        return web.json_response({"error": "Demasiadas asignaciones (máximo 200)"}, status=400)

    applied, failed = [], []
    for item in assignments:
        if not isinstance(item, dict):
            failed.append({"overlayKey": "", "error": "entrada inválida"})
            continue
        key = str(item.get("overlayKey", "")).strip()
        theme_id = str(item.get("themeId", "")).strip() if item.get("themeId") else None
        shape_raw = item.get("shapeId")
        shape_id = str(shape_raw).strip() if shape_raw is not None else ("__clear__" if "shapeId" in item else None)
        if not key:
            failed.append({"overlayKey": "", "error": "overlayKey requerido"})
            continue
        if theme_id is None and shape_id is None:
            failed.append({"overlayKey": key, "error": "themeId o shapeId requerido"})
            continue
        try:
            await set_overlay_theme_service(key, theme_id=theme_id, shape_id=shape_id)
            applied.append(key)
        except ValueError as e:
            failed.append({"overlayKey": key, "error": str(e)})
        except Exception as e:  # defensivo: un miembro no debe tumbar el lote
            from server.config import logger as _logger
            _logger.warning(f"Error aplicando asignación en lote a '{key}': {e}")
            failed.append({"overlayKey": key, "error": "error interno"})

    if not applied:
        # Ninguna entrada válida: es un error del cliente, no un lote parcial.
        return web.json_response({
            "error": "Ninguna asignación válida en el lote",
            "status": "error",
            "applied": [],
            "failed": failed,
        }, status=400)

    return web.json_response({
        "status": "ok" if not failed else "partial",
        "applied": applied,
        "failed": failed,
    })


async def handle_apply_shape(request):
    """Aplica una forma física globalmente a todas las escenas de OBS y el panel"""
    body = await read_json_object(request)
    if body is None:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    shape_id = str(body.get("shape", "original")).strip()
    try:
        res = await apply_shape_service(shape_id)
        return web.json_response({"status": "ok", **res})
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)


async def handle_set_overlay_backdrop(request):
    """Guarda y sincroniza el fondo/apertura decorativo para una escena de OBS"""
    body = await read_json_object(request)
    if body is None:
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


async def handle_preview_theme(request):
    """Devuelve el CSS que producirá un `theme.json`, SIN escribir en disco.

    Es lo que usa el editor del panel para que la vista previa sea el CSS real
    (con todos los tokens normalizados) y no un CSS inventado con literales.
    """
    body = await read_json_object(request)
    if body is None:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)
    try:
        css = theme_render.preview_css(body)
    except ValueError as exc:
        return web.json_response({"error": str(exc)}, status=400)
    except Exception as exc:  # noqa: BLE001 - se devuelve 500 controlado
        return internal_error_response("previsualizando el tema", exc)
    return web.json_response({"status": "ok", "css": css})


def register_themes_routes(app):
    """Registra todas las rutas para la gestión modular de temas y packs"""
    init_themes_directory()
    app.router.add_get("/api/themes/packs", handle_get_theme_packs)
    app.router.add_get("/api/themes/palette", handle_get_theme_palette)
    app.router.add_post("/api/themes/preview", handle_preview_theme)
    app.router.add_post("/api/themes/packs/create", handle_create_pack)
    app.router.add_post("/api/themes/create", handle_create_theme)
    app.router.add_post("/api/themes/save", handle_save_theme)
    app.router.add_post("/api/themes/restore", handle_restore_theme)
    app.router.add_post("/api/themes/reset-assignment", handle_reset_assignment)
    app.router.add_post("/api/themes/overlay-assignment", handle_set_overlay_theme)
    app.router.add_post("/api/themes/overlay-assignment/bulk", handle_set_overlay_theme_bulk)
    app.router.add_post("/api/themes/backdrop", handle_set_overlay_backdrop)
    app.router.add_post("/api/themes/apply", handle_apply_theme)
    app.router.add_post("/api/themes/apply-shape", handle_apply_shape)
    app.router.add_post("/api/themes/chat-anchor", handle_chat_anchor_toggle)



async def handle_reset_assignment(request):
    """Restaura la asignación de fábrica de una escena, widget o alerta."""
    body = await read_json_object(request)
    if body is None:
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
