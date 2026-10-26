"""Catálogo único de componentes tematizables (escenas, widgets y alertas de panel).

- Las **escenas** viven en `streamthemes/` y se resuelven con `scenes_catalog`.
- Los **widgets** son las carpetas reales de `widgets/` (se deduplican symlinks:
  `promo` es un enlace a `shoutout`).
- Las **alertas de panel** son las dos plantillas que pinta el overlay:
  `card` (tarjeta `.alert-box`) y `banner` (banner procedural).

Las asignaciones se guardan en `themes_state.json` con claves `widget:<id>` y
`alert:<id>`, en los mismos diccionarios `overlayThemes` / `overlayShapes` que
usan las escenas: una sola fuente de verdad.
"""
from __future__ import annotations

import json

from server.config import BASE_DIR
from server.services.validation_utils import is_valid_scene_key, is_valid_shape_id

WIDGETS_DIR = BASE_DIR / "widgets"

# Formas que cada widget sabe aplicar de verdad (su CSS/JS las soporta).
WIDGET_SHAPE_SET = {"rounded", "bubble", "scifi", "pill", "arcade", "tag", "slant", "soft_card", "box"}


def _pack_shape_ids() -> set:
    """Formas físicas declaradas por los packs (cozy_polaroid, gamer_mecha...)."""
    ids = set()
    packs_dir = BASE_DIR / "streamthemes"
    if not packs_dir.is_dir():
        return ids
    for pack_json in packs_dir.glob("*/pack.json"):
        try:
            data = json.loads(pack_json.read_text(encoding="utf-8"))
        except Exception:
            continue
        for shape in data.get("shapes", []) or []:
            if isinstance(shape, dict) and shape.get("id"):
                ids.add(str(shape["id"]))
    return ids


ALERT_IDS = ("card", "banner")
RESET_VALUES = {"", "auto", "original", "__clear__", "none", "null"}

# Catálogo de formas de pack: se re-deriva cuando cambia algún pack.json.
# Antes `PACK_SHAPE_SET`/`ALERT_SHAPES` eran constantes de import: un pack creado
# en caliente no aparecía hasta reiniciar el servidor.
_PACK_SHAPE_CACHE = {"key": None, "ids": set()}


def _pack_shape_cache_key():
    packs_dir = BASE_DIR / "streamthemes"
    if not packs_dir.is_dir():
        return ()
    key = []
    for pack_json in sorted(packs_dir.glob("*/pack.json")):
        try:
            st = pack_json.stat()
        except OSError:
            continue
        key.append((str(pack_json), st.st_mtime_ns, st.st_size))
    return tuple(key)


def get_pack_shape_ids() -> set:
    """Formas físicas declaradas por los packs, con caché invalidable por mtime."""
    key = _pack_shape_cache_key()
    if _PACK_SHAPE_CACHE["key"] != key:
        _PACK_SHAPE_CACHE["ids"] = _pack_shape_ids()
        _PACK_SHAPE_CACHE["key"] = key
    return set(_PACK_SHAPE_CACHE["ids"])


def invalidate_shape_cache() -> None:
    _PACK_SHAPE_CACHE["key"] = None
    _PACK_SHAPE_CACHE["ids"] = set()


def get_alert_shapes() -> set:
    """9 genéricas + todas las físicas de los packs, siempre desde disco."""
    return set(WIDGET_SHAPE_SET) | get_pack_shape_ids()


def widget_shape_set(item_id: str) -> set:
    """Formas que un widget pinta de verdad.

    Las 9 genéricas las aplica `oss-shape.js` en línea; las 20 físicas de pack
    las pinta `common/styles.css` sobre `[data-oss-shape-target]` (que las
    escenas no usan), así que ofrecerlas es real y no una promesa vacía.
    `chat` no expone diana de forma: aplica las suyas con `ChatStyles`, de modo
    que se queda con las genéricas.
    """
    if item_id == "chat":
        return set(WIDGET_SHAPE_SET)
    return set(WIDGET_SHAPE_SET) | get_pack_shape_ids()


def supports_shape(kind: str, item_id: str, shape: str) -> bool:
    """Capacidad real de un miembro para una forma concreta.

    Es la única tabla que deben usar fusions/UI; evita que un `pill` genérico
    se rechace para una alerta o que una escena reciba una forma genérica.
    """
    shape = str(shape or "").strip()
    if shape.lower() in RESET_VALUES:
        return True
    if kind == "widget":
        return is_valid_component("widget", item_id) and shape in widget_shape_set(item_id)
    if kind == "alert":
        return is_valid_component("alert", item_id) and shape in get_alert_shapes()
    if kind == "scene":
        return is_valid_scene_key(item_id) and is_valid_shape_id(shape)
    return False


def _widget_dirs():
    if not WIDGETS_DIR.is_dir():
        return []
    seen, out = set(), []
    for p in sorted(WIDGETS_DIR.iterdir()):
        if not p.is_dir() or p.is_symlink():
            continue  # `promo` es un enlace a `shoutout`: se lista el directorio real
        out.append(p)
    return out


def widget_ids() -> list[str]:
    return [p.name for p in _widget_dirs()]


def alert_ids() -> list[str]:
    return list(ALERT_IDS)


def parse_key(key: str):
    """Devuelve (kind, id) si la clave es `widget:<id>` / `alert:<id>`."""
    if not key or ":" not in str(key):
        return None
    kind, cid = str(key).split(":", 1)
    kind, cid = kind.strip().lower(), cid.strip()
    if kind in ("widget", "alert") and cid:
        return kind, cid
    return None


def is_valid_component(kind: str, cid: str) -> bool:
    return cid in (widget_ids() if kind == "widget" else alert_ids())


def shape_ids_for(kind: str, cid: str) -> set:
    if kind == "widget":
        return widget_shape_set(cid) if cid in widget_ids() else set()
    if kind == "alert":
        return get_alert_shapes() if cid in alert_ids() else set()
    return set()


def supports_shapes(kind: str, cid: str) -> bool:
    return bool(shape_ids_for(kind, cid))


def is_valid_component_shape(kind: str, cid: str, shape: str) -> bool:
    return supports_shape(kind, cid, shape)


def catalog() -> dict:
    """Catálogo serializable para el panel (listas de miembros disponibles)."""
    return {
        "widgets": [{"id": w, "shapes": sorted(shape_ids_for("widget", w))} for w in widget_ids()],
        "alerts": [{"id": a, "shapes": sorted(shape_ids_for("alert", a))} for a in alert_ids()],
    }
