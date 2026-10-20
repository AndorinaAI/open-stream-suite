import shutil
from pathlib import Path
from aiohttp import web
from server.config import BASE_DIR, MEDIA_DIR, logger

ALLOWED_MEDIA_EXTENSIONS = {
    ".webm", ".mp4", ".mov", ".mkv",
    ".mp3", ".wav", ".ogg", ".aac", ".m4a",
    ".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"
}

VIDEO_EXTENSIONS = {".webm", ".mp4", ".mov", ".mkv"}
SOUND_EXTENSIONS = {".mp3", ".wav", ".ogg", ".aac", ".m4a"}
IMAGE_EXTENSIONS = {".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"}

def get_media_type(suffix: str) -> str:
    s = suffix.lower()
    if s in VIDEO_EXTENSIONS:
        return "video"
    elif s in SOUND_EXTENSIONS:
        return "sound"
    elif s in IMAGE_EXTENSIONS:
        return "image"
    return "other"

def resolve_safe_media_path(rel_path: str, allow_root: bool = False) -> Path | None:
    """Resuelve una ruta relativa y asegura que resida estrictamente dentro de MEDIA_DIR."""
    if rel_path is None:
        return None
    cleaned = str(rel_path).strip()
    # Permitir raíz si se solicita expresamente
    if cleaned in ("", ".", "/"):
        return MEDIA_DIR.resolve() if allow_root else None

    # Mitigar path traversal básico
    if ".." in cleaned or cleaned.startswith("/") or "\\" in cleaned:
        return None

    media_root = MEDIA_DIR.resolve()
    target = (media_root / cleaned).resolve()

    try:
        is_safe = target.is_relative_to(media_root)
    except AttributeError:
        is_safe = str(target).startswith(str(media_root))

    if not is_safe:
        return None
    if not allow_root and target == media_root:
        return None
    return target

def build_folder_tree(current_dir: Path, rel_path: str = "") -> dict:
    """Construye recursivamente el árbol de directorios con conteo de archivos."""
    name = current_dir.name if rel_path else "Biblioteca de Medios"
    subfolders = []
    direct_files = 0

    try:
        for item in sorted(current_dir.iterdir(), key=lambda x: x.name.lower()):
            if item.is_dir():
                sub_rel = f"{rel_path}/{item.name}".strip("/") if rel_path else item.name
                subfolders.append(build_folder_tree(item, sub_rel))
            elif item.is_file() and item.suffix.lower() in ALLOWED_MEDIA_EXTENSIONS:
                direct_files += 1
    except Exception as e:
        logger.warning(f"Error explorando directorio {current_dir}: {e}")

    # Total recursivo
    total_files = direct_files + sum(sf["total_files"] for sf in subfolders)

    return {
        "name": name,
        "path": rel_path,
        "direct_files": direct_files,
        "total_files": total_files,
        "subfolders": subfolders
    }

async def handle_list_media(request):
    """Lista todos los archivos, árbol de carpetas y estadísticas para el explorador."""
    # Asegurar carpetas base
    for d in ("images", "sounds", "videos"):
        (MEDIA_DIR / d).mkdir(parents=True, exist_ok=True)

    files = []
    folders = [""]  # Raíz
    media_root = MEDIA_DIR.resolve()

    # Recorrer carpetas
    for p in sorted(media_root.rglob("*")):
        try:
            rel = str(p.relative_to(media_root))
            if p.is_dir():
                folders.append(rel)
            elif p.is_file() and p.suffix.lower() in ALLOWED_MEDIA_EXTENSIONS:
                stat = p.stat()
                mtype = get_media_type(p.suffix)
                folder_rel = str(p.parent.relative_to(media_root)) if p.parent != media_root else ""
                files.append({
                    "name": p.name,
                    "rel_path": rel,
                    "folder": folder_rel,
                    "url": "/media/" + rel,
                    "type": mtype,
                    "size_kb": round(stat.st_size / 1024, 1),
                    "size_bytes": stat.st_size,
                    "mtime": int(stat.st_mtime * 1000),
                    "ext": p.suffix.lower()
                })
        except Exception as e:
            logger.debug(f"Saltando archivo ilegible {p}: {e}")

    # Ordenar archivos: más recientes primero por defecto
    files.sort(key=lambda x: x["mtime"], reverse=True)

    tree = build_folder_tree(media_root, "")
    total_bytes = sum(f["size_bytes"] for f in files)
    total_mb = round(total_bytes / (1024 * 1024), 2)

    stats = {
        "total_files": len(files),
        "total_size_mb": total_mb,
        "videos_count": sum(1 for f in files if f["type"] == "video"),
        "sounds_count": sum(1 for f in files if f["type"] == "sound"),
        "images_count": sum(1 for f in files if f["type"] == "image"),
        "folders_count": len(folders) - 1
    }

    return web.json_response({
        "files": files,
        "folders": sorted(folders),
        "tree": tree,
        "stats": stats
    })

async def handle_upload_media(request):
    """Sube archivos con soporte para auto-clasificación por tipo o destino en carpeta."""
    reader = await request.multipart()
    saved = []
    destinations = []
    media_root = MEDIA_DIR.resolve()

    # Leer parámetros desde query o campos
    auto_classify_param = request.query.get("auto_classify", "true").lower()
    auto_classify = auto_classify_param not in ("false", "0", "no")
    target_folder_param = request.query.get("folder", "").strip()

    while True:
        part = await reader.next()
        if part is None:
            break

        # Si es un campo de formulario normal
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

        # Es un archivo subido
        raw_fn = Path(part.filename).name.replace(" ", "_")
        if not raw_fn or ".." in raw_fn or "/" in raw_fn or "\\" in raw_fn:
            return web.json_response({"error": "Nombre de archivo no válido o malformado"}, status=400)

        ext = Path(raw_fn).suffix.lower()
        if ext not in ALLOWED_MEDIA_EXTENSIONS:
            return web.json_response({
                "error": f"Extensión '{ext}' no permitida. Formatos válidos: {', '.join(sorted(ALLOWED_MEDIA_EXTENSIONS))}"
            }, status=400)

        # Determinar carpeta de destino
        if auto_classify:
            subfolder = "videos" if ext in VIDEO_EXTENSIONS else ("sounds" if ext in SOUND_EXTENSIONS else "images")
            target_dir = media_root / subfolder
        elif target_folder_param:
            resolved_folder = resolve_safe_media_path(target_folder_param, allow_root=True)
            if not resolved_folder:
                return web.json_response({"error": "Carpeta de destino no válida o no autorizada"}, status=400)
            target_dir = resolved_folder
        else:
            # Fallback seguro: auto clasificar
            subfolder = "videos" if ext in VIDEO_EXTENSIONS else ("sounds" if ext in SOUND_EXTENSIONS else "images")
            target_dir = media_root / subfolder

        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = (target_dir / raw_fn).resolve()

        # Comprobar seguridad de la ruta final
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

    folder_name = str(data.get("name", "")).strip().replace(" ", "_")
    parent_path = str(data.get("parent", "")).strip()

    if not folder_name or ".." in folder_name or "/" in folder_name or "\\" in folder_name:
        return web.json_response({"error": "Nombre de carpeta no válido"}, status=400)

    # Solo caracteres seguros
    if not all(c.isalnum() or c in ("-", "_") for c in folder_name):
        return web.json_response({"error": "El nombre solo puede contener letras, números, guiones y guiones bajos"}, status=400)

    parent_dir = resolve_safe_media_path(parent_path, allow_root=True)
    if not parent_dir:
        return web.json_response({"error": "Directorio padre no válido"}, status=400)

    new_dir = (parent_dir / folder_name).resolve()
    media_root = MEDIA_DIR.resolve()

    try:
        if not new_dir.is_relative_to(media_root) or new_dir == media_root:
            return web.json_response({"error": "Ruta no autorizada"}, status=400)
    except AttributeError:
        if not str(new_dir).startswith(str(media_root) + "/"):
            return web.json_response({"error": "Ruta no autorizada"}, status=400)

    new_dir.mkdir(parents=True, exist_ok=True)
    rel = str(new_dir.relative_to(media_root))
    logger.info(f"📁 Directorio creado: {rel}")
    return web.json_response({"status": "ok", "folder": rel})

async def handle_rename_media(request):
    """Renombra un archivo o carpeta de forma segura."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    rel_path = str(data.get("path", "")).strip()
    new_name = str(data.get("new_name", "")).strip().replace(" ", "_")

    if not rel_path or not new_name or ".." in new_name or "/" in new_name or "\\" in new_name:
        return web.json_response({"error": "Parámetros de renombrado no válidos"}, status=400)

    target = resolve_safe_media_path(rel_path)
    if not target or not target.exists():
        return web.json_response({"error": "Elemento original no encontrado"}, status=404)

    # Si es archivo, validar extensión
    if target.is_file():
        new_ext = Path(new_name).suffix.lower()
        if not new_ext:
            # Conservar extensión original si el usuario no la escribió
            new_name = new_name + target.suffix.lower()
            new_ext = target.suffix.lower()
        if new_ext not in ALLOWED_MEDIA_EXTENSIONS:
            return web.json_response({"error": f"Extensión '{new_ext}' no permitida"}, status=400)

    dest = target.parent / new_name
    if dest.exists() and dest != target:
        return web.json_response({"error": "Ya existe un archivo o carpeta con ese nombre"}, status=409)

    target.rename(dest)
    media_root = MEDIA_DIR.resolve()
    new_rel = str(dest.relative_to(media_root))
    logger.info(f"✏️ Elemento renombrado: {rel_path} ➜ {new_rel}")
    return web.json_response({"status": "ok", "old_path": rel_path, "new_path": new_rel, "url": "/media/" + new_rel})

async def handle_move_media(request):
    """Mueve uno o varios archivos/carpetas a otra carpeta de destino (drag & drop o cortar-pegar)."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    sources = data.get("sources", [])
    if isinstance(data.get("source"), str):
        sources.append(data.get("source"))

    target_folder = str(data.get("target_folder", "")).strip()
    dest_dir = resolve_safe_media_path(target_folder, allow_root=True)

    if not dest_dir or not dest_dir.is_dir():
        return web.json_response({"error": "Carpeta de destino no válida"}, status=400)

    moved = []
    for src_rel in sources:
        src = resolve_safe_media_path(src_rel)
        if not src or not src.exists():
            continue
        # Evitar mover una carpeta dentro de sí misma
        if src.is_dir():
            try:
                if dest_dir == src or dest_dir.is_relative_to(src):
                    continue
            except AttributeError:
                if str(dest_dir).startswith(str(src)):
                    continue

        dest_file = dest_dir / src.name
        # Si ya existe con el mismo nombre y es diferente ruta, renombrar con sufijo
        if dest_file.exists() and dest_file != src:
            stem = src.stem
            suffix = src.suffix
            counter = 1
            while dest_file.exists():
                dest_file = dest_dir / f"{stem}_{counter}{suffix}"
                counter += 1

        shutil.move(str(src), str(dest_file))
        moved.append(src.name)

    logger.info(f"📦 {len(moved)} elementos movidos a {target_folder or 'raíz'}")
    return web.json_response({"status": "ok", "moved": moved, "count": len(moved)})

async def handle_copy_media(request):
    """Copia uno o varios archivos a otra carpeta o duplica en la misma carpeta (copiar-pegar)."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    sources = data.get("sources", [])
    if isinstance(data.get("source"), str):
        sources.append(data.get("source"))

    target_folder = str(data.get("target_folder", "")).strip()
    dest_dir = resolve_safe_media_path(target_folder, allow_root=True)

    if not dest_dir or not dest_dir.is_dir():
        return web.json_response({"error": "Carpeta de destino no válida"}, status=400)

    copied = []
    for src_rel in sources:
        src = resolve_safe_media_path(src_rel)
        if not src or not src.exists():
            continue

        if src.is_file():
            dest_file = dest_dir / src.name
            if dest_file.exists():
                # Crear copia con nombre alternativo
                stem = src.stem
                suffix = src.suffix
                counter = 1
                while dest_file.exists():
                    dest_file = dest_dir / f"{stem}_copia{counter if counter > 1 else ''}{suffix}"
                    counter += 1
            shutil.copy2(str(src), str(dest_file))
            copied.append(dest_file.name)
        elif src.is_dir():
            dest_subdir = dest_dir / src.name
            if dest_subdir.exists():
                counter = 1
                while dest_subdir.exists():
                    dest_subdir = dest_dir / f"{src.name}_copia{counter if counter > 1 else ''}"
                    counter += 1
            shutil.copytree(str(src), str(dest_subdir))
            copied.append(dest_subdir.name)

    logger.info(f"📋 {len(copied)} elementos copiados a {target_folder or 'raíz'}")
    return web.json_response({"status": "ok", "copied": copied, "count": len(copied)})

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

    deleted = []
    media_root = MEDIA_DIR.resolve()

    for rel_path in paths_to_delete:
        target = resolve_safe_media_path(rel_path)
        if not target or not target.exists():
            continue

        # Proteger carpetas base y raíz
        if target == media_root:
            continue

        if target.is_dir():
            shutil.rmtree(str(target))
            deleted.append(target.name)
            logger.info(f"🗑️ Carpeta eliminada con seguridad: {target.name}")
        elif target.is_file():
            target.unlink()
            deleted.append(target.name)
            logger.info(f"✓ Archivo eliminado con seguridad: {target.name}")

    if not deleted:
        return web.json_response({"error": "No se encontraron elementos para eliminar"}, status=404)

    return web.json_response({"status": "ok", "deleted": deleted, "count": len(deleted)})
