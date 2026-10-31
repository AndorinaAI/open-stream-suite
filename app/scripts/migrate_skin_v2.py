#!/usr/bin/env python3
"""Migra los manifiestos de apariencia al schema 2 (modelo de 5 capas).

    python scripts/migrate_skin_v2.py            # migra lo pendiente
    python scripts/migrate_skin_v2.py --check    # no escribe; exit 1 si falta

Idempotente: un fichero con `schema: 2` se deja intacto.

Qué hace
--------
`pack.json`   `archetype` -> `skin` (geometría + decoración + ornamentos) y
              `typography`. Las formas pasan de `geometry.ornaments` (lista de
              veto) a un mapa explícito `ornaments: {nombre: display}` y ganan
              un bloque `paint` (vacío aquí; se rellena en el paso 8).
`theme.json`  `tokens` + campos sueltos -> `colors` (SOLO color). El glow se
              parte: el color se queda en el tema, el radio pasa al pack.

`styles/<tema>/style.css` NO se toca todavía: sigue siendo la fuente de
`common/themes.css`. Su poda de geometría entra junto con `common/skin.css`,
para que el cambio de runtime sea atómico y no haya un estado intermedio roto.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
STREAMTHEMES_DIR = BASE_DIR / "streamthemes"
ARCHETYPES_FILE = BASE_DIR / "common" / "archetypes.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import skin_schema as S  # noqa: E402


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8")


def parse_glow(value: str) -> str:
    """`0 0 16px rgba(...)` -> `rgba(...)`; `none` -> `transparent`.

    El radio (16px) NO es del tema: es del pack (`skin.glowRadius`). El tema
    solo aporta el color; con `transparent` el brillo simplemente no se ve.
    """
    value = (value or "").strip()
    if not value or value == "none":
        return "transparent"
    match = re.match(r"^0\s+0\s+\S+\s+(.+)$", value)
    return match.group(1).strip() if match else value


def glow_radius(value: str) -> str:
    value = (value or "").strip()
    match = re.match(r"^0\s+0\s+(\S+)\s+", value)
    return match.group(1) if match else ""


def drop_empty(mapping: dict) -> dict:
    return {k: v for k, v in mapping.items() if v not in (None, "", {}, [])}


def _shape_block(shape: dict) -> dict:
    geom = dict(shape.get("geometry") or {})
    legacy_ornaments = geom.pop("ornaments", None)

    if isinstance(shape.get("ornaments"), dict):
        ornaments = dict(shape["ornaments"])
    elif isinstance(legacy_ornaments, list):
        # Lista de veto histórica -> mapa explícito. Lo vetado a `none`; el
        # resto pasa a `block` y el pack decide su estado por defecto.
        ornaments = {name: ("none" if name in legacy_ornaments else "block")
                     for name in S.ORNAMENT_NAMES}
    else:
        ornaments = None

    out = {
        "id": shape.get("id"),
        "name": shape.get("name") or shape.get("id"),
        "icon": shape.get("icon") or "",
        "description": shape.get("description") or "",
        "geometry": geom,
        "paint": dict(shape.get("paint") or {}),
    }
    if ornaments:
        out["ornaments"] = ornaments
    return out


def migrate_pack(raw: dict, archetype: dict, default_tokens: dict) -> dict:
    skin, typography = S.pack_skin_from_archetype(archetype)

    # Lo que solo existía en los temas y en realidad es del PACK: sombras,
    # desenfoque, borde del marco y patrón de escena.
    if default_tokens:
        panel, frame = skin["panel"], skin["frame"]
        for key, token in (("shadow", "--panel-shadow"),
                           ("backdrop", "--panel-backdrop")):
            if default_tokens.get(token):
                panel[key] = default_tokens[token]
        for key, token in (("shadow", "--frame-shadow"),
                           ("borderWidth", "--frame-border-width"),
                           ("borderStyle", "--frame-border-style"),
                           ("cornerDisplay", "--frame-corner-display")):
            if default_tokens.get(token):
                frame[key] = default_tokens[token]
        pattern = default_tokens.get("--skin-scene-pattern")
        if pattern:
            skin["scenePattern"] = drop_empty({
                "image": pattern,
                "position": default_tokens.get("--skin-scene-pattern-position"),
                "size": default_tokens.get("--skin-scene-pattern-size"),
            })
        radius = glow_radius(default_tokens.get("--theme-glow"))
        if radius:
            skin["glowRadius"] = radius

    out = {
        "schema": S.SCHEMA_VERSION,
        "id": raw.get("id"),
        "name": raw.get("name") or raw.get("id"),
        "icon": raw.get("icon") or "",
        "badge": raw.get("badge") or "",
        "description": raw.get("description") or "",
        "version": "2.1.0",
        "author": raw.get("author") or "",
        "skin": {group: (drop_empty(values) if isinstance(values, dict) else values)
                 for group, values in skin.items()},
        "typography": typography,
        "defaultTheme": raw.get("defaultTheme") or "",
        "defaultShape": raw.get("defaultShape") or "",
        "shapes": [_shape_block(shape) for shape in (raw.get("shapes") or [])],
    }
    atmosphere = archetype.get("atmosphere") or raw.get("atmosphere")
    if atmosphere:
        out["atmosphere"] = atmosphere
    return out


def migrate_theme(raw: dict, pack_id: str) -> dict:
    tokens = raw.get("tokens") or {}
    colors = {camel: tokens[token]
              for camel, token in S.COLOR_KEYS.items() if tokens.get(token)}

    # Respaldo: campos sueltos de la raíz (esquema anterior a `tokens`).
    for camel in ("bgDark", "textLight", "panelBg", "textDim",
                  "accentCyan", "accentOrange"):
        if not colors.get(camel) and raw.get(camel):
            colors[camel] = raw[camel]

    colors["glow"] = parse_glow(tokens.get("--theme-glow") or raw.get("themeGlow"))

    out = {
        "schema": S.SCHEMA_VERSION,
        "id": raw.get("id"),
        "packId": raw.get("packId") or pack_id,
        "name": raw.get("name") or raw.get("id"),
        "badge": raw.get("badge") or "",
        "desc": raw.get("desc") or raw.get("description") or "",
    }
    if "chatAnchored" in raw:
        out["chatAnchored"] = bool(raw.get("chatAnchored"))
    if "chatDerivative" in raw:
        out["chatDerivative"] = raw.get("chatDerivative")
    out["colors"] = colors
    return out


def default_theme_tokens(pack_dir: Path, default_theme: str) -> dict:
    """Tokens del tema por defecto: fuente de las sombras y el patrón."""
    themes_dir = pack_dir / "styles"
    if not themes_dir.is_dir():
        return {}
    candidates = ([themes_dir / default_theme] if default_theme else []) + \
                 sorted(p for p in themes_dir.iterdir() if p.is_dir())
    for theme_dir in candidates:
        raw = read_json(theme_dir / "theme.json")
        if isinstance(raw, dict) and isinstance(raw.get("tokens"), dict):
            return raw["tokens"]
    return {}



def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Migra los manifiestos a schema 2")
    parser.add_argument("--check", action="store_true",
                        help="no escribe nada; exit 1 si queda algo pendiente")
    args = parser.parse_args(argv)

    archetypes_raw = read_json(ARCHETYPES_FILE) or {}
    archetypes = {a.get("id"): a for a in (archetypes_raw.get("archetypes") or [])
                  if isinstance(a, dict)}
    if not archetypes:
        print("AVISO: no hay arquetipos en common/archetypes.json")

    pending, done, problems = [], [], []

    for pack_dir in sorted(p for p in STREAMTHEMES_DIR.iterdir() if p.is_dir()):
        pack_file = pack_dir / "pack.json"
        raw = read_json(pack_file)
        if not isinstance(raw, dict):
            continue

        if raw.get("schema") == S.SCHEMA_VERSION:
            done.append(str(pack_file.relative_to(BASE_DIR)))
        else:
            arch_id = raw.get("archetype") or ""
            arch = archetypes.get(arch_id)
            if not arch:
                problems.append(f"{pack_dir.name}: arquetipo '{arch_id}' desconocido")
                arch = None
            if arch:
                tokens = default_theme_tokens(pack_dir, raw.get("defaultTheme") or "")
                new_pack = migrate_pack(raw, arch, tokens)
                errs = S.validate_pack(new_pack)
                if errs:
                    problems.extend(errs)
                else:
                    pending.append(str(pack_file.relative_to(BASE_DIR)))
                    if not args.check:
                        write_json(pack_file, new_pack)

        themes_dir = pack_dir / "styles"
        if not themes_dir.is_dir():
            continue
        for theme_dir in sorted(p for p in themes_dir.iterdir() if p.is_dir()):
            theme_file = theme_dir / "theme.json"
            theme_raw = read_json(theme_file)
            if not isinstance(theme_raw, dict):
                continue
            rel = str(theme_file.relative_to(BASE_DIR))
            if theme_raw.get("schema") == S.SCHEMA_VERSION:
                done.append(rel)
                continue
            new_theme = migrate_theme(theme_raw, raw.get("id") or pack_dir.name)
            errs = S.validate_theme(new_theme)
            if errs:
                problems.extend(errs)
                continue
            pending.append(rel)
            if not args.check:
                write_json(theme_file, new_theme)

    for problem in problems:
        print(f"  ERROR  {problem}")
    etiqueta = "Pendientes" if args.check else "Migrados"
    print(f"{etiqueta}: {len(pending)} | ya en schema 2: {len(done)} | "
          f"errores: {len(problems)}")
    for rel in pending:
        print(f"  - {rel}")
    if problems:
        return 2
    return 1 if (args.check and pending) else 0


if __name__ == "__main__":
    raise SystemExit(main())

