#!/usr/bin/env python3
"""Validación de identificadores de packs, temas, escenas y formas físicas.

Reglas de diseño (T4):
  * Las rutas se resuelven SIEMPRE en absoluto desde `server.config.BASE_DIR`.
    La versión anterior usaba `Path("app/streamthemes")`, relativo al cwd: al
    arrancar el servidor desde `app/` esa comprobación daba False y rompía por
    completo `/api/themes/apply` y `/api/themes/restore` ("Pack ID inválido").
  * Las claves de escena se validan contra el catálogo ÚNICO (`scenes_catalog`),
    que conoce las 27 claves canónicas y sus alias. Así se aceptan `maker-desk`,
    `startingSoon` o `screens/starting-soon` y se rechaza basura (`starting`,
    `no-existe-esta-escena`), impidiendo que el estado se contamine.
  * Los temas y formas se validan contra el contenido real de `streamthemes/`.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional

from server.config import BASE_DIR
from . import scenes_catalog

STREAMTHEMES_DIR = BASE_DIR / "streamthemes"

# Valores especiales aceptados como "forma" en el estado (no son formas de pack)
SPECIAL_SHAPE_IDS = {"auto", "original", "__clear__", "none", "null"}


def _packs_dirs() -> list[Path]:
    if not STREAMTHEMES_DIR.is_dir():
        return []
    return sorted(p for p in STREAMTHEMES_DIR.iterdir() if p.is_dir())


def is_valid_pack_id(pack_id: str) -> bool:
    """True si existe `streamthemes/<pack_id>/`."""
    if not pack_id:
        return False
    candidate = (STREAMTHEMES_DIR / str(pack_id).strip())
    try:
        return candidate.is_dir() and candidate.resolve().is_relative_to(STREAMTHEMES_DIR.resolve())
    except (OSError, ValueError):
        return False


def get_theme_dir(pack_id: str, theme_id: str) -> Optional[Path]:
    """Directorio real del tema, o None si no existe."""
    if not is_valid_pack_id(pack_id) or not theme_id:
        return None
    pack_dir = (STREAMTHEMES_DIR / str(pack_id).strip()).resolve()
    theme_dir = pack_dir / "styles" / str(theme_id).strip()
    try:
        if theme_dir.is_dir() and theme_dir.resolve().is_relative_to(pack_dir):
            return theme_dir
    except (OSError, ValueError):
        pass
    return None


def is_valid_theme_id(pack_id: "str | None" = "", theme_id: str = "") -> bool:
    """True si el tema existe dentro del pack indicado (o de cualquier pack si se omite)."""
    if not theme_id:
        # Compatibilidad con la firma antigua is_valid_theme_id(theme_id)
        theme_id, pack_id = pack_id, ""
    if not theme_id:
        return False
    theme_id = str(theme_id).strip()
    if pack_id:
        return get_theme_dir(pack_id, theme_id) is not None
    return any(get_theme_dir(p.name, theme_id) is not None for p in _packs_dirs())


def is_valid_scene_key(scene_key: str) -> bool:
    """True si la clave (o alias) corresponde a una escena conocida."""
    return scenes_catalog.is_known_scene(scene_key)


def normalize_scene_key(scene_key: str) -> Optional[str]:
    """Clave canónica de escena, o None si no existe."""
    return scenes_catalog.normalize_scene_key(scene_key)


def get_known_shape_ids() -> set:
    """Formas físicas declaradas por los pack.json + valores especiales."""
    shapes = set(SPECIAL_SHAPE_IDS)
    for pack_dir in _packs_dirs():
        pack_json = pack_dir / "pack.json"
        if not pack_json.is_file():
            continue
        try:
            data = json.loads(pack_json.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        for shape in data.get("shapes", []) or []:
            if isinstance(shape, dict) and shape.get("id"):
                shapes.add(str(shape["id"]))
            elif isinstance(shape, str):
                shapes.add(shape)
    return shapes


def is_valid_shape_id(shape_id: str) -> bool:
    """True si la forma existe en algún pack o es un valor especial (auto/original)."""
    if shape_id is None:
        return False
    shape_id = str(shape_id).strip()
    if not shape_id:
        return False
    if shape_id.lower() in SPECIAL_SHAPE_IDS:
        return True
    return shape_id in get_known_shape_ids()


# ---------------------------------------------------------------------------
# Saneado de textos de metadatos (V3-01)
# ---------------------------------------------------------------------------
# `name`, `badge`, `desc` e `icon` de packs y temas se pintan en el panel con
# `innerHTML`. Un valor del tipo `<img src=x onerror=...>` ejecutaba JavaScript
# en el mismo origen que `/api/local-token` (XSS reproducido en la auditoría V3).
# La defensa es doble y en la capa que posee el invariante:
#   * aquí (API) se RECHAZA el HTML antes de tocar el disco;
#   * la UI escapa siempre al renderizar (`themeEscapeHtml`/`themeJsArg`).
# Límites con margen amplio sobre el catálogo real (máx. medido: name 31,
# badge 28, desc 104, icon 2).

METADATA_NAME_MAX = 80
METADATA_BADGE_MAX = 80
METADATA_DESC_MAX = 300
METADATA_ICON_MAX = 8
METADATA_AUTHOR_MAX = 80

# Únicos caracteres que habilitan una etiqueta HTML. Ningún dato de fábrica los
# usa (verificado), así que rechazarlos no rompe el catálogo existente. `&`,
# comillas y acentos sí se permiten: se escapan al renderizar.
HTML_UNSAFE_CHARS = "<>"


def sanitize_metadata_text(value, field: str = "texto", *,
                           max_length: int = METADATA_NAME_MAX,
                           required: bool = False,
                           default: str = "") -> str:
    """Normaliza un texto de metadatos y rechaza cualquier intento de inyectar HTML.

    - Elimina caracteres de control (salvo tabulador y salto) y colapsa espacios.
    - Rechaza `<` y `>`: son el vector real de XSS en el panel (`innerHTML`).
    - Limita la longitud para no persistir estados absurdos.

    Devuelve el texto limpio. Si el valor no es aceptable lanza `ValueError`, que
    las rutas de temas traducen a `400`.
    """
    if value is None:
        if required:
            raise ValueError(f"{field} requerido")
        return default

    text = "".join(ch for ch in str(value) if ch in "\n\t" or ord(ch) >= 32)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        # "vacío" equivale a "no informado": el llamante decide el fallback.
        if required:
            raise ValueError(f"{field} requerido")
        return default
    if any(ch in text for ch in HTML_UNSAFE_CHARS):
        raise ValueError(f"{field} no puede contener HTML (caracteres '<' o '>')")
    if len(text) > max_length:
        raise ValueError(f"{field} supera la longitud máxima de {max_length} caracteres")
    return text

