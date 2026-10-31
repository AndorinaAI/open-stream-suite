#!/usr/bin/env python3
"""Esquema único del sistema de apariencia de Open Stream Suite (schema 2).

Cinco capas, cada una con SU familia de tokens. Ninguna escribe fuera de ella:

    OVERLAY   estructura y hooks `data-oss-*`        (no escribe tokens)
    PACK      geometría, decoración, tipografía      --skin-*
    SHAPE     la forma concreta, incluida su pintura --shape-*
    THEME     SOLO color                             --color-*
    OVERRIDE  ajuste por componente                  --widget-*

Este módulo es la ÚNICA fuente de verdad: lo usan la migración, el generador,
el motor del servidor y los tests. Si algo no valida aquí, no llega a disco.
"""
from __future__ import annotations

import re

SCHEMA_VERSION = 2

# --- THEME: color, y nada más ------------------------------------------------
# camelCase del manifiesto -> token CSS. El orden manda en la salida generada.
COLOR_KEYS = {
    "bgDark": "--color-bg-dark",
    "textLight": "--color-text-light",
    "textDim": "--color-text-dim",
    "panelBg": "--color-panel-bg",
    "accentCyan": "--color-accent-cyan",
    "accentOrange": "--color-accent-orange",
    "borderCyan": "--color-border-cyan",
    "borderCyanBright": "--color-border-cyan-bright",
    "accentCyanText": "--color-accent-cyan-text",
    "accentOrangeText": "--color-accent-orange-text",
    "onAccentCyan": "--color-on-accent-cyan",
    "onAccentOrange": "--color-on-accent-orange",
    "glow": "--color-glow",
}

# Tokens que NUNCA pueden aparecer en un tema. Si aparecen, es geometría
# colándose en la capa de color: exactamente el defecto que rompía las formas.
FORBIDDEN_THEME_PREFIXES = (
    "--frame-", "--panel-", "--badge-", "--header-", "--pill-", "--bar-",
    "--skin-", "--shape-", "--widget-",
)
FORBIDDEN_THEME_STRINGS = ("--theme-glow",)

# --- PACK: familias de skin --------------------------------------------------
SKIN_GROUPS = ("panel", "frame", "badge", "header", "pill", "bar", "decor",
               "scenePattern", "content", "ornaments", "glowRadius")
SKIN_PROPS = {
    "panel":  {"radius", "clip", "backdrop", "shadow", "padding"},
    "frame":  {"radius", "clip", "border", "borderWidth", "borderStyle",
               "shadow", "cornerDisplay"},
    "badge":  {"radius", "clip"},
    "header": {"radius", "clip"},
    "pill":   {"radius"},
    "bar":    {"radius"},
    "decor":  {"image", "size", "position", "repeat"},
    "scenePattern": {"image", "size", "position"},
    "content": {"radius", "padding", "background"},
    "ornaments": set(),   # mapa libre {nombre: display}
}
TYPOGRAPHY_KEYS = ("display", "ui", "digits", "scale")

# --- SHAPE -------------------------------------------------------------------
SHAPE_GEOMETRY_KEYS = {"panelRadius", "panelClipPath", "frameRadius",
                       "frameClipPath", "badgeRadius", "headerRadius",
                       "pillRadius", "barRadius"}
SHAPE_PAINT_KEYS = {"background", "backgroundSize", "backgroundPosition",
                    "backgroundRepeat", "boxShadow", "borderColor"}
ORNAMENT_NAMES = ("tape", "brackets", "reticle")


def kebab(name: str) -> str:
    """camelCase -> kebab-case (accentCyanText -> accent-cyan-text)."""
    return re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower()


def color_tokens(theme: dict) -> dict:
    """{token: valor} de la capa THEME, en orden canónico."""
    colors = theme.get("colors") or {}
    return {tok: colors[key] for key, tok in COLOR_KEYS.items() if key in colors}


def is_geometry_token(token: str) -> bool:
    return token.startswith(FORBIDDEN_THEME_PREFIXES) or token in FORBIDDEN_THEME_STRINGS


def validate_theme(theme: dict) -> list:
    """Errores de un tema. Vacío = válido."""
    errs = []
    if theme.get("schema") != SCHEMA_VERSION:
        errs.append(f"{theme.get('id')}: schema != {SCHEMA_VERSION}")
    if not theme.get("id"):
        errs.append("tema sin id")
    for key in ("tokens", "archetype", "fontPrimary", "fontTech", "borderStyle",
                "glowIntensity", "accentCyan", "bgDark", "panelBg", "textLight",
                "textDim", "accentOrange"):
        if key in theme:
            errs.append(f"{theme.get('id')}: '{key}' no pertenece a la capa THEME")
    colors = theme.get("colors")
    if not isinstance(colors, dict) or not colors:
        errs.append(f"{theme.get('id')}: falta 'colors'")
        return errs
    for key in colors:
        if key not in COLOR_KEYS:
            errs.append(f"{theme.get('id')}: color desconocido '{key}'")
    for key in ("bgDark", "panelBg", "accentCyan", "textLight"):
        if key not in colors:
            errs.append(f"{theme.get('id')}: falta el color obligatorio '{key}'")
    return errs


def validate_shape(shape: dict) -> list:
    errs = []
    sid = shape.get("id") or "<sin id>"
    if not shape.get("id"):
        errs.append("forma sin id")
    geom = shape.get("geometry") or {}
    for key in geom:
        if key not in SHAPE_GEOMETRY_KEYS:
            errs.append(f"{sid}: geometría desconocida '{key}'")
    paint = shape.get("paint") or {}
    for key in paint:
        if key not in SHAPE_PAINT_KEYS:
            errs.append(f"{sid}: pintura desconocida '{key}'")
    ornaments = shape.get("ornaments")
    if ornaments is not None:
        if not isinstance(ornaments, dict):
            errs.append(f"{sid}: 'ornaments' debe ser mapa {{nombre: display}}")
        else:
            for name in ornaments:
                if name not in ORNAMENT_NAMES:
                    errs.append(f"{sid}: ornamento desconocido '{name}'")
    return errs


def missing_paint(pack: dict) -> list:
    """Formas sin `paint.background`: se listan aparte para poder migrar por
    fases sin bloquear. La capa de forma está completa cuando esta lista es
    vacía (paso 8 del plan)."""
    return [s.get("id") for s in (pack.get("shapes") or [])
            if not ((s.get("paint") or {}).get("background"))]


def validate_pack(pack: dict) -> list:
    errs = []
    pid = pack.get("id") or "<sin id>"
    if pack.get("schema") != SCHEMA_VERSION:
        errs.append(f"{pid}: schema != {SCHEMA_VERSION}")
    if "archetype" in pack:
        errs.append(f"{pid}: 'archetype' ya no existe; usa 'skin'")
    skin = pack.get("skin")
    if not isinstance(skin, dict) or not skin:
        errs.append(f"{pid}: falta 'skin'")
    else:
        for group in skin:
            if group not in SKIN_GROUPS:
                errs.append(f"{pid}: grupo de skin desconocido '{group}'")
            elif isinstance(skin[group], dict) and SKIN_PROPS.get(group):
                for prop in skin[group]:
                    if prop not in SKIN_PROPS[group]:
                        errs.append(f"{pid}: skin.{group}.{prop} no existe")
    typo = pack.get("typography")
    if not isinstance(typo, dict) or not typo.get("ui"):
        errs.append(f"{pid}: falta 'typography.ui'")
    seen = set()
    for shape in pack.get("shapes") or []:
        errs.extend(validate_shape(shape))
        if shape.get("id") in seen:
            errs.append(f"{pid}: forma duplicada '{shape.get('id')}'")
        seen.add(shape.get("id"))
    for key in ("defaultTheme", "defaultShape"):
        if not pack.get(key):
            errs.append(f"{pid}: falta '{key}'")
    return errs


def pack_skin_from_archetype(arch: dict) -> tuple:
    """Convierte una entrada de `archetypes.json` en (skin, typography).

    `archetypes.json` es el origen histórico de la geometría por familia; aquí
    se traduce UNA vez al esquema nuevo. `atmosphere` se conserva aparte: son
    TEXTOS de escena, no apariencia.
    """
    tok = arch.get("tokens") or {}
    extra = arch.get("skin") or {}

    def get(name, default=""):
        return tok.get(name) or default

    skin = {
        "panel": {
            "radius": get("--skin-panel-radius", "8px"),
            "clip": get("--skin-panel-clip", "none"),
        },
        "frame": {
            "radius": get("--skin-frame-radius", "3px"),
            "clip": get("--skin-frame-clip", "none"),
        },
        "badge": {"radius": get("--skin-badge-radius", "4px")},
        "header": {
            "radius": get("--skin-header-radius", "6px"),
            "clip": get("--skin-header-clip", "none"),
        },
        "pill": {"radius": get("--skin-pill-radius", "9999px")},
        "bar": {"radius": get("--skin-bar-radius", "4px")},
        "decor": {
            "image": extra.get("--skin-panel-decor") or "none",
            "position": extra.get("--skin-panel-decor-position") or "0 0",
            "size": extra.get("--skin-panel-decor-size") or "auto",
            "repeat": extra.get("--skin-panel-decor-repeat") or "no-repeat",
        },
        "ornaments": {name: get(f"--skin-ornament-{name}", "block")
                      for name in ORNAMENT_NAMES},
    }
    typography = {
        "display": get("--skin-font-display", "var(--font-tech)"),
        "ui": get("--skin-font-body", "var(--font-primary)"),
        "digits": get("--skin-font-display", "var(--font-tech)"),
        "scale": "1",
    }
    return skin, typography

