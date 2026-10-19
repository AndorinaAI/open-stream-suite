from pathlib import Path
from aiohttp import web
from server.config import BASE_DIR, MEDIA_DIR, logger

async def handle_list_media(request):
    """Lista todos los archivos de vídeo, audio e imagen disponibles"""
    files = []
    for ext in ("*.webm", "*.mp4", "*.mp3", "*.wav", "*.gif", "*.png", "*.jpg"):
        for p in MEDIA_DIR.rglob(ext):
            files.append({
                "name": p.name,
                "url": "/media/" + str(p.relative_to(MEDIA_DIR)),
                "type": "video" if p.suffix in (".webm", ".mp4") else ("sound" if p.suffix in (".mp3", ".wav") else "image"),
                "size_kb": round(p.stat().st_size / 1024, 1)
            })
    return web.json_response({"files": files})

ALLOWED_MEDIA_EXTENSIONS = {
    ".webm", ".mp4", ".mov", ".mkv",
    ".mp3", ".wav", ".ogg", ".aac", ".m4a",
    ".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"
}

async def handle_upload_media(request):
    """Sube un archivo de media (vídeo, audio, imagen) de forma segura y controlada"""
    reader = await request.multipart()
    saved = []
    media_root = MEDIA_DIR.resolve()

    while True:
        part = await reader.next()
        if part is None:
            break
        if part.filename:
            # 1. Extraer estrictamente el nombre base para mitigar path traversal
            raw_fn = Path(part.filename).name.replace(" ", "_")
            if not raw_fn or ".." in raw_fn or "/" in raw_fn or "\\" in raw_fn:
                return web.json_response({"error": "Nombre de archivo no válido o malformado"}, status=400)

            # 2. Validar extensión contra lista blanca permitida
            ext = Path(raw_fn).suffix.lower()
            if ext not in ALLOWED_MEDIA_EXTENSIONS:
                return web.json_response({
                    "error": f"Extensión '{ext}' no permitida. Formatos válidos: {', '.join(sorted(ALLOWED_MEDIA_EXTENSIONS))}"
                }, status=400)

            # 3. Determinar subdirectorio seguro
            subfolder = "videos" if ext in (".webm", ".mp4", ".mov", ".mkv") else ("sounds" if ext in (".mp3", ".wav", ".ogg", ".aac", ".m4a") else "images")
            target_path = (MEDIA_DIR / subfolder / raw_fn).resolve()

            # 4. Comprobar que la ruta resuelta está estrictamente dentro de MEDIA_DIR
            try:
                if not target_path.is_relative_to(media_root) or target_path == media_root:
                    return web.json_response({"error": "Intento de path traversal detectado"}, status=400)
            except AttributeError:
                # Python < 3.9 fallback
                if not str(target_path).startswith(str(media_root) + "/"):
                    return web.json_response({"error": "Intento de path traversal detectado"}, status=400)

            target_path.parent.mkdir(parents=True, exist_ok=True)
            with open(target_path, "wb") as f:
                while True:
                    chunk = await part.read_chunk()
                    if not chunk:
                        break
                    f.write(chunk)

            saved.append(raw_fn)
            logger.info(f"✓ Archivo subido con éxito y verificado: {raw_fn}")

    return web.json_response({"status": "ok", "uploaded": saved})

async def handle_delete_media(request):
    """Elimina un archivo de media del directorio alerts/media de forma segura"""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    rel_path = str(data.get("path", "")).strip()
    if not rel_path or ".." in rel_path or rel_path.startswith("/") or "\\" in rel_path:
        return web.json_response({"error": "Ruta inválida"}, status=400)

    media_root = MEDIA_DIR.resolve()
    target = (MEDIA_DIR / rel_path).resolve()

    # Comprobación estricta de límites
    try:
        is_safe = target.is_relative_to(media_root) and target != media_root
    except AttributeError:
        is_safe = str(target).startswith(str(media_root) + "/")

    if not is_safe:
        return web.json_response({"error": "Ruta no autorizada fuera del directorio de medios"}, status=400)

    if target.exists() and target.is_file():
        target.unlink()
        logger.info(f"✓ Archivo eliminado con seguridad: {target.name}")
        return web.json_response({"status": "ok", "deleted": target.name})

    return web.json_response({"error": "Archivo no encontrado"}, status=404)
