import shutil
from pathlib import Path
from server.config import MEDIA_DIR, logger

ALLOWED_MEDIA_EXTENSIONS = {
    ".webm", ".mp4", ".mov", ".mkv",
    ".mp3", ".wav", ".ogg", ".aac", ".m4a",
    ".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"
}

VIDEO_EXTENSIONS = {".webm", ".mp4", ".mov", ".mkv"}
SOUND_EXTENSIONS = {".mp3", ".wav", ".ogg", ".aac", ".m4a"}
IMAGE_EXTENSIONS = {".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"}

def get_media_type(suffix: str) -> str:
    """Retorna la categoría de medio ('video', 'sound', 'image', 'other') según su extensión."""
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

    total_files = direct_files + sum(sf["total_files"] for sf in subfolders)

    return {
        "name": name,
        "path": rel_path,
        "direct_files": direct_files,
        "total_files": total_files,
        "subfolders": subfolders
    }

def list_media_library() -> dict:
    """Escanea y compila la biblioteca completa de medios, árbol de carpetas y estadísticas."""
    for d in ("images", "sounds", "videos"):
        (MEDIA_DIR / d).mkdir(parents=True, exist_ok=True)

    files = []
    folders = [""]  # Raíz
    media_root = MEDIA_DIR.resolve()

    for p in sorted(media_root.rglob("*")):
        try:
            rel = p.relative_to(media_root).as_posix()
            if p.is_dir():
                folders.append(rel)
            elif p.is_file() and p.suffix.lower() in ALLOWED_MEDIA_EXTENSIONS:
                stat = p.stat()
                mtype = get_media_type(p.suffix)
                folder_rel = p.parent.relative_to(media_root).as_posix() if p.parent != media_root else ""
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

    return {
        "files": files,
        "folders": sorted(folders),
        "tree": tree,
        "stats": stats
    }

def create_media_folder(folder_name: str, parent_path: str = "") -> tuple[bool, str]:
    """Crea un directorio de medios validando sanitización y permisos."""
    folder_name = str(folder_name).strip().replace(" ", "_")
    if not folder_name or ".." in folder_name or "/" in folder_name or "\\" in folder_name:
        return False, "Nombre de carpeta no válido"

    if not all(c.isalnum() or c in ("-", "_") for c in folder_name):
        return False, "El nombre solo puede contener letras, números, guiones y guiones bajos"

    parent_dir = resolve_safe_media_path(parent_path, allow_root=True)
    if not parent_dir:
        return False, "Directorio padre no válido"

    new_dir = (parent_dir / folder_name).resolve()
    media_root = MEDIA_DIR.resolve()

    try:
        if not new_dir.is_relative_to(media_root) or new_dir == media_root:
            return False, "Ruta no autorizada"
    except AttributeError:
        if not str(new_dir).startswith(str(media_root) + "/"):
            return False, "Ruta no autorizada"

    new_dir.mkdir(parents=True, exist_ok=True)
    rel = new_dir.relative_to(media_root).as_posix()
    logger.info(f"📁 Directorio creado: {rel}")
    return True, rel

def rename_media_item(rel_path: str, new_name: str) -> tuple[int, dict]:
    """Renombra un archivo o carpeta dentro de MEDIA_DIR con validación de extensiones."""
    rel_path = str(rel_path).strip()
    new_name = str(new_name).strip().replace(" ", "_")

    if not rel_path or not new_name or ".." in new_name or "/" in new_name or "\\" in new_name:
        return 400, {"error": "Parámetros de renombrado no válidos"}

    target = resolve_safe_media_path(rel_path)
    if not target or not target.exists():
        return 404, {"error": "Elemento original no encontrado"}

    if target.is_file():
        new_ext = Path(new_name).suffix.lower()
        if not new_ext:
            new_name = new_name + target.suffix.lower()
            new_ext = target.suffix.lower()
        if new_ext not in ALLOWED_MEDIA_EXTENSIONS:
            return 400, {"error": f"Extensión '{new_ext}' no permitida"}

    dest = target.parent / new_name
    if dest.exists() and dest != target:
        return 409, {"error": "Ya existe un archivo o carpeta con ese nombre"}

    target.rename(dest)
    media_root = MEDIA_DIR.resolve()
    new_rel = dest.relative_to(media_root).as_posix()
    logger.info(f"✏️ Elemento renombrado: {rel_path} ➜ {new_rel}")
    return 200, {"status": "ok", "old_path": rel_path, "new_path": new_rel, "url": "/media/" + new_rel}

def move_media_items(sources: list, target_folder: str) -> tuple[int, dict]:
    """Mueve archivos/carpetas a la carpeta de destino resolviendo colisiones."""
    dest_dir = resolve_safe_media_path(target_folder, allow_root=True)
    if not dest_dir or not dest_dir.is_dir():
        return 400, {"error": "Carpeta de destino no válida"}

    moved = []
    for src_rel in sources:
        src = resolve_safe_media_path(src_rel)
        if not src or not src.exists():
            continue
        if src.is_dir():
            try:
                if dest_dir == src or dest_dir.is_relative_to(src):
                    continue
            except AttributeError:
                if str(dest_dir).startswith(str(src)):
                    continue

        dest_file = dest_dir / src.name
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
    return 200, {"status": "ok", "moved": moved, "count": len(moved)}

def copy_media_items(sources: list, target_folder: str) -> tuple[int, dict]:
    """Copia archivos/carpetas a la carpeta destino agregando sufijos numéricos si existen."""
    dest_dir = resolve_safe_media_path(target_folder, allow_root=True)
    if not dest_dir or not dest_dir.is_dir():
        return 400, {"error": "Carpeta de destino no válida"}

    copied = []
    for src_rel in sources:
        src = resolve_safe_media_path(src_rel)
        if not src or not src.exists():
            continue

        if src.is_file():
            dest_file = dest_dir / src.name
            if dest_file.exists():
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
    return 200, {"status": "ok", "copied": copied, "count": len(copied)}

def delete_media_items(paths_to_delete: list) -> tuple[int, dict]:
    """Elimina permanentemente archivos o carpetas de la biblioteca de medios."""
    deleted = []
    media_root = MEDIA_DIR.resolve()

    for rel_path in paths_to_delete:
        target = resolve_safe_media_path(rel_path)
        if not target or not target.exists():
            continue

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
        return 404, {"error": "No se encontraron elementos para eliminar"}

    return 200, {"status": "ok", "deleted": deleted, "count": len(deleted)}
