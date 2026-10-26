"""Catálogo único de escenas (fuente de verdad compartida backend/frontend).

`app/scenes.json` se GENERA desde `app/alerts/js/themes/05-scenes-data.js`
(ver `scripts/build_scenes_json.py`) y es lo que el backend usa para:

  * traducir cualquier forma de clave (camelCase, kebab-case, snake_case,
    nombre de carpeta o ruta `maker/desk`) a la clave CANÓNICA de escena;
  * resolver las rutas heredadas `/scenes/<clave>/index.html`;
  * validar claves antes de escribir estado (temas, formas, fusiones).

Antes de este catálogo, la validación usaba una lista escrita a mano con claves
que no existían (`maker_desk`, `starting-soon`, …) y rechazaba claves reales
(`maker-desk`, `startingSoon`), además de interpretar las rutas de streamthemes
en relativo al cwd (siempre fallaban las validaciones de pack/tema).
"""
from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Optional

from server.config import BASE_DIR

logger = logging.getLogger("OpenStreamSuite")

CATALOG_FILE = BASE_DIR / "scenes.json"

_lock = threading.Lock()
_cache: dict | None = None
_cache_mtime: float = 0.0


def try_autobuild() -> bool:
    """Genera `app/scenes.json` si falta, usando el generador de `scripts/`.

    `scenes.json` es un fichero GENERADO y llegó a estar sin versionar: si un clon
    del repo no lo traía, el backend arrancaba sin catálogo (degradado: sin
    resolución de alias de escena, sin validación de claves). Ahora se
    autoconstruye la primera vez que hace falta. Devuelve True si quedó generado.
    """
    if CATALOG_FILE.exists():
        return False
    builder = BASE_DIR.parent / "scripts" / "build_scenes_json.py"
    if not builder.is_file():
        logger.warning("⚠️ Catálogo de escenas ausente (%s) y sin generador (%s)", CATALOG_FILE, builder)
        return False
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("oss_build_scenes_json", builder)
        if spec is None or spec.loader is None:
            logger.warning("⚠️ No se pudo cargar el generador de catálogo: %s", builder)
            return False
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        data = module.build()
        CATALOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        CATALOG_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        logger.info(
            "✓ Catálogo de escenas generado automáticamente (%s escenas, %s alias)",
            data["scene_count"], len(data["alias_map"]),
        )
        return True
    except Exception as e:
        logger.warning("⚠️ No se pudo generar el catálogo de escenas: %s", e)
        return False


def _load() -> dict:
    """Carga el catálogo (con caché invalidada por mtime)."""
    global _cache, _cache_mtime
    if not CATALOG_FILE.exists():
        try_autobuild()
    if not CATALOG_FILE.exists():
        if _cache is None:
            logger.warning("⚠️ Catálogo de escenas ausente (%s): usa scripts/build_scenes_json.py", CATALOG_FILE)
            return {"scenes": [], "alias_map": {}, "default_themes": {}}
        return _cache
    mtime = CATALOG_FILE.stat().st_mtime
    with _lock:
        if _cache is None or mtime != _cache_mtime:
            with open(CATALOG_FILE, "r", encoding="utf-8") as f:
                _cache = json.load(f)
            _cache_mtime = mtime
        current = _cache or {"scenes": [], "alias_map": {}, "default_themes": {}}
        return current


def reload() -> dict:
    """Fuerza la recarga (tests / cambios en caliente)."""
    global _cache, _cache_mtime
    with _lock:
        _cache = None
        _cache_mtime = 0.0
    return _load()


def get_scenes() -> list[dict]:
    return list(_load().get("scenes", []))


def canonical_scene_keys() -> list[str]:
    return [s["key"] for s in get_scenes()]


def normalize_scene_key(raw_key) -> Optional[str]:
    """Devuelve la clave canónica de escena o None si no es una escena conocida."""
    if raw_key is None:
        return None
    key = str(raw_key).strip().strip("/")
    if not key:
        return None
    alias_map = _load().get("alias_map", {})
    if key in alias_map:
        return alias_map[key]
    low = key.lower()
    if low in alias_map:
        return alias_map[low]
    squashed = low.replace("-", "").replace("_", "")
    for alias, target in alias_map.items():
        if alias.lower().replace("-", "").replace("_", "") == squashed:
            return target
    return None


def is_known_scene(raw_key) -> bool:
    return normalize_scene_key(raw_key) is not None


def get_scene(raw_key) -> Optional[dict]:
    canonical = normalize_scene_key(raw_key)
    if not canonical:
        return None
    for scene in get_scenes():
        if scene["key"] == canonical:
            return scene
    return None


def scene_path(raw_key) -> Optional[str]:
    scene = get_scene(raw_key)
    return scene["path"] if scene else None


def default_themes() -> dict:
    return dict(_load().get("default_themes", {}))


def legacy_scene_target(raw_scene: str) -> Optional[str]:
    """Ruta a la que redirigir `/scenes/<raw_scene>/index.html`.

    - Las escenas del pack Maker viven bajo `/overlays/…` (el servidor monta
      `/overlays/` en Maker_Theme_Pack/overlays).
    - El resto se sirve por su ruta real `/streamthemes/<Pack>/overlays/…`.
    - `screens/…`, `maker/desk`, `just_chatting`… se aceptan como alias.
    """
    if raw_scene is None:
        return None
    raw = str(raw_scene).strip().strip("/")
    if raw.endswith("/index.html"):
        raw = raw[: -len("/index.html")]
    if not raw:
        return None

    scene = get_scene(raw)
    if scene is None:
        # último intento: quitar el prefijo de subcarpeta (screens/…) y reintentar
        if "/" in raw:
            scene = get_scene(raw.split("/", 1)[1])
    if scene is None:
        return None

    path = scene["path"]
    maker_prefix = "/streamthemes/Maker_Theme_Pack/overlays/"
    if path.startswith(maker_prefix):
        return "/overlays/" + path[len(maker_prefix):]
    return path


def describe() -> dict:
    """Resumen para diagnósticos (/api/status no lo usa; útil en tests)."""
    data = _load()
    return {
        "scenes": len(data.get("scenes", [])),
        "aliases": len(data.get("alias_map", {})),
        "catalog_file": str(CATALOG_FILE),
    }


__all__ = [
    "CATALOG_FILE",
    "canonical_scene_keys",
    "default_themes",
    "describe",
    "get_scene",
    "get_scenes",
    "is_known_scene",
    "legacy_scene_target",
    "normalize_scene_key",
    "reload",
    "scene_path",
]
