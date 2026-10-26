#!/usr/bin/env python3
"""Genera app/scenes.json (catálogo único de escenas) a partir del panel.

Fuente de verdad: `app/alerts/js/themes/05-scenes-data.js` (OSS_SCENES) y
`app/alerts/js/themes/01-state.js` (DEFAULT_OVERLAY_THEMES).

El catálogo lo consume el backend para:
  * resolver /scenes/<clave>/index.html (incluidos alias heredados)
  * validar claves de escena antes de escribir estado
  * saber cuál es la clave canónica de cada escena (la única que se persiste)

Uso:  python3 scripts/build_scenes_json.py [--check]
      --check  → no escribe; falla si scenes.json está desincronizado (para CI/tests)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCENES_JS = REPO / "app" / "alerts" / "js" / "themes" / "05-scenes-data.js"
STATE_JS = REPO / "app" / "alerts" / "js" / "themes" / "01-state.js"
OUT = REPO / "app" / "scenes.json"

# Alias heredados explícitos (mismos criterios que el registro JS del panel).
# En caso de colisión gana el primer paquete en el orden de OSS_SCENES (Maker
# primero), que es el comportamiento histórico del mapa /scenes/ -> /overlays/.
ALIAS_OVERRIDES = {
    "starting-soon": "startingSoon",
    "starting_soon": "startingSoon",
    "screens/starting-soon": "startingSoon",
    "maker-starting-soon": "startingSoon",
    "brb": "beRightBack",
    "be-right-back": "beRightBack",
    "be_right_back": "beRightBack",
    "screens/be-right-back": "beRightBack",
    "screens/ending": "ending",
    "desk": "maker-desk",
    "maker/desk": "maker-desk",
    "maker_desk": "maker-desk",
    "pc": "maker-pc",
    "maker/pc": "maker-pc",
    "maker_pc": "maker-pc",
    "machine": "print-machine",
    "print/machine": "print-machine",
    "print_machine": "print-machine",
    "design": "print-design",
    "print/design": "print-design",
    "print_design": "print-design",
    "just_chatting": "oss_chatting",
    "just-chatting": "oss_chatting",
    "desktop_share": "oss_desktop",
    "desktop-share": "oss_desktop",
    "podcast_talk": "oss_podcast",
    "podcast-talk": "oss_podcast",
    "gameplay_hud": "gamer_gameplay",
    "speedrun_split": "gamer_speedrun",
    "victory_clutch": "gamer_victory",
    "study_pomodoro": "cozy_pomodoro",
    "art_dual_cam": "cozy_art",
    "cafe_chat": "cozy_cafe",
    "coffee-break": "cozy_brb",
    "coffee_break": "cozy_brb",
}


def parse_scenes() -> list[dict]:
    src = SCENES_JS.read_text(encoding="utf-8")
    # cada escena es un bloque { ... } con key/packId/category/path
    scenes = []
    for block in re.findall(r"\{\s*key:\s*'[^']+'.*?\n  \}", src, flags=re.S):
        def field(name):
            m = re.search(rf"{name}:\s*'([^']*)'", block)
            return m.group(1) if m else None
        key = field("key")
        if not key:
            continue
        scenes.append({
            "key": key,
            "packId": field("packId"),
            "category": field("category"),
            "name": field("name"),
            "icon": field("icon"),
            "path": field("path"),
            "badge": field("badge"),
        })
    return scenes


def parse_default_themes() -> dict:
    """Los defaults canónicos viven en theme_defaults.py (fuente única)."""
    sys.path.insert(0, str(REPO / "app"))
    from server.services.theme_defaults import DEFAULT_OVERLAY_THEMES
    return dict(DEFAULT_OVERLAY_THEMES)


def build() -> dict:
    scenes = parse_scenes()
    keys = {s["key"] for s in scenes}

    aliases: dict[str, str] = {}
    # 1. overrides explícitos (solo si la clave destino existe de verdad)
    for alias, target in ALIAS_OVERRIDES.items():
        if target in keys:
            aliases.setdefault(alias, target)
    # 2. alias automáticos por escena (sin pisar los existentes → gana el primero)
    for scene in scenes:
        key = scene["key"]
        aliases.setdefault(key, key)
        aliases.setdefault(key.replace("_", "-"), key)
        aliases.setdefault(key.replace("-", "_"), key)
        rel = re.match(r".*/overlays/(.+)/index\.html$", scene["path"] or "")
        if rel:
            aliases.setdefault(rel.group(1), key)
        folder = (scene["path"] or "").rstrip("/").split("/")[-2] if scene["path"] else ""
        if folder:
            aliases.setdefault(folder, key)

    for scene in scenes:
        scene["aliases"] = sorted(a for a, t in aliases.items() if t == scene["key"])

    defaults = parse_default_themes()
    # Solo claves canónicas de escena (ni 'maker' ni 'print', que son secciones de textos)
    defaults = {k: v for k, v in defaults.items() if k in keys}

    return {
        "_comment": "GENERADO por scripts/build_scenes_json.py — no editar a mano. Fuente: 05-scenes-data.js + 01-state.js",
        "_canonical_convention": "key = clave de OSS_SCENES; es la ÚNICA que se persiste en themes_state.json/fusions.json",
        "scene_count": len(scenes),
        "scenes": scenes,
        "alias_map": dict(sorted(aliases.items())),
        "default_themes": dict(sorted(defaults.items())),
    }


def main() -> int:
    # En Windows la consola no usa UTF-8 por defecto: imprimir los ✓/✗ lanzaba
    # UnicodeEncodeError y el script terminaba con returncode 1 (rompía el test
    # de sincronización del catálogo en CI).
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except (OSError, ValueError):
                pass
    data = build()
    payload = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    check = "--check" in sys.argv
    if check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != payload:
            print("✗ app/scenes.json está DESINCRONIZADO con 05-scenes-data.js", file=sys.stderr)
            return 1
        print(f"✓ app/scenes.json sincronizado ({data['scene_count']} escenas, {len(data['alias_map'])} alias)")
        return 0
    # newline="\n" explícito: en Windows el modo texto escribiría CRLF y el
    # fichero dejaría de coincidir con el versionado (LF).
    try:
        OUT.write_text(payload, encoding="utf-8", newline="\n")
    except TypeError:  # Python < 3.10
        OUT.write_text(payload, encoding="utf-8")
    print(f"✓ escrito {OUT.relative_to(REPO)}: {data['scene_count']} escenas, {len(data['alias_map'])} alias, "
          f"{len(data['default_themes'])} temas por defecto")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
