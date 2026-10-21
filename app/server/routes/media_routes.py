from pathlib import Path
from aiohttp import web
from server.config import MEDIA_DIR, logger
from server.services.media_service import (
    ALLOWED_MEDIA_EXTENSIONS,
    VIDEO_EXTENSIONS,
    SOUND_EXTENSIONS,
    IMAGE_EXTENSIONS,
    get_media_type,
    resolve_safe_media_path,
    build_folder_tree,
    list_media_library,
    create_media_folder,
    rename_media_item,
    move_media_items,
    copy_media_items,
    delete_media_items,
)

async def handle_list_media(request):
    """Lista todos los archivos, árbol de carpetas y estadísticas para el explorador."""
    data = list_media_library()
    return web.json_response(data)

async def handle_upload_media(request):
    """Sube archivos con soporte para auto-clasificación por tipo o destino en carpeta."""
    reader = await request.multipart()
    saved = []
    destinations = []
    media_root = MEDIA_DIR.resolve()

    auto_classify_param = request.query.get("auto_classify", "true").lower()
    auto_classify = auto_classify_param not in ("false", "0", "no")
    target_folder_param = request.query.get("folder", "").strip()

    while True:
        part = await reader.next()
        if part is None:
            break

        if part.filename is None:
            try:
                field_name = part.name
                field_value = (await part.read(decode=True)).decode("utf-8").strip()
                if field_name == "auto_classify":
                    auto_classify = field_value.lower() not in ("false", "0", "no")
                elif field_name == "folder":
                    target_folder_param = field_value
            except Exception:
                pass
            continue

        raw_fn = Path(part.filename).name.replace(" ", "_")
        if not raw_fn or ".." in raw_fn or "/" in raw_fn or "\\" in raw_fn:
            return web.json_response({"error": "Nombre de archivo no válido o malformado"}, status=400)

        ext = Path(raw_fn).suffix.lower()
        if ext not in ALLOWED_MEDIA_EXTENSIONS:
            return web.json_response({
                "error": f"Extensión '{ext}' no permitida. Formatos válidos: {', '.join(sorted(ALLOWED_MEDIA_EXTENSIONS))}"
            }, status=400)

        if auto_classify:
            subfolder = "videos" if ext in VIDEO_EXTENSIONS else ("sounds" if ext in SOUND_EXTENSIONS else "images")
            target_dir = media_root / subfolder
        elif target_folder_param:
            resolved_folder = resolve_safe_media_path(target_folder_param, allow_root=True)
            if not resolved_folder:
                return web.json_response({"error": "Carpeta de destino no válida o no autorizada"}, status=400)
            target_dir = resolved_folder
        else:
            subfolder = "videos" if ext in VIDEO_EXTENSIONS else ("sounds" if ext in SOUND_EXTENSIONS else "images")
            target_dir = media_root / subfolder

        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = (target_dir / raw_fn).resolve()

        try:
            if not target_path.is_relative_to(media_root) or target_path == media_root:
                return web.json_response({"error": "Intento de path traversal detectado"}, status=400)
        except AttributeError:
            if not str(target_path).startswith(str(media_root) + "/"):
                return web.json_response({"error": "Intento de path traversal detectado"}, status=400)

        with open(target_path, "wb") as f:
            while True:
                chunk = await part.read_chunk()
                if not chunk:
                    break
                f.write(chunk)

        rel_saved = str(target_path.relative_to(media_root))
        saved.append(raw_fn)
        destinations.append("/media/" + rel_saved)
        logger.info(f"✓ Archivo subido con éxito y verificado: {rel_saved}")

    return web.json_response({"status": "ok", "uploaded": saved, "destinations": destinations})

async def handle_mkdir_media(request):
    """Crea un nuevo subdirectorio de forma segura."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    folder_name = data.get("name", "")
    parent_path = data.get("parent", "")

    ok, result = create_media_folder(folder_name, parent_path)
    if not ok:
        return web.json_response({"error": result}, status=400)

    return web.json_response({"status": "ok", "folder": result})

async def handle_rename_media(request):
    """Renombra un archivo o carpeta de forma segura."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    rel_path = data.get("path", "")
    new_name = data.get("new_name", "")

    status, resp = rename_media_item(rel_path, new_name)
    return web.json_response(resp, status=status)

async def handle_move_media(request):
    """Mueve uno o varios archivos/carpetas a otra carpeta de destino."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    sources = data.get("sources", [])
    if isinstance(data.get("source"), str):
        sources.append(data.get("source"))

    target_folder = str(data.get("target_folder", "")).strip()
    status, resp = move_media_items(sources, target_folder)
    return web.json_response(resp, status=status)

async def handle_copy_media(request):
    """Copia uno o varios archivos a otra carpeta o duplica en la misma carpeta."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    sources = data.get("sources", [])
    if isinstance(data.get("source"), str):
        sources.append(data.get("source"))

    target_folder = str(data.get("target_folder", "")).strip()
    status, resp = copy_media_items(sources, target_folder)
    return web.json_response(resp, status=status)

async def handle_delete_media(request):
    """Elimina uno o varios archivos o carpetas de forma segura."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    paths_to_delete = data.get("paths", [])
    if "path" in data and isinstance(data["path"], str):
        paths_to_delete.append(data["path"])

    if not paths_to_delete:
        return web.json_response({"error": "No se especificaron rutas a eliminar"}, status=400)

    status, resp = delete_media_items(paths_to_delete)
    return web.json_response(resp, status=status)
