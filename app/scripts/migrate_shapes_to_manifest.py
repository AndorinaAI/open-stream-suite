#!/usr/bin/env python3
"""Migracion one-shot: `common/styles.css` -> manifiesto + CSS por pack.

Script de mantenimiento (no forma parte del runtime). Su trabajo es dejar el
CSS de formas donde corresponde:

  * las 20 reglas de COMPONENTE (alerta / banner / widget) se convierten en
    datos: `geometry` de cada forma en `pack.json`;
  * los bloques de ORNAMENTOS que afectan a formas de varios packs se
    convierten en dato (`geometry.ornaments`): es una decision de la forma,
    no de la escena;
  * las reglas de ESCENA (marcos de camara, chinchetas, HUD...) se mueven al
    `shapes.css` de su pack, porque son CSS del pack y no del motor comun.

Se ejecuta una vez; despues el motor (`theme_engine.py`) mantiene todo al dia.

Garantia del script: **no se pierde ninguna regla**. Toda regla con
`data-theme-shape="<forma de un pack>"` acaba en un unico sitio (el
manifiesto o el `shapes.css` de su pack), y el resto se queda en
`styles.css` sin tocar. La decoracion de escena conserva sus literales: un
marco negro de camara es del pack, no del tema (tokenizarlo cambiaria el
aspecto por defecto de las escenas).
"""
from __future__ import annotations

import bisect
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]
STYLES = APP_DIR / "common" / "styles.css"
PACKS_DIR = APP_DIR / "streamthemes"

# Donde se pinta una forma fisica: alertas y widgets.
COMPONENT_TARGETS = ("#alert-card", "#banner-alert-root", "[data-oss-shape-target]")

# Propiedades de `geometry` que el motor sabe traducir a CSS.
GEOMETRY_DECLARATIONS = {
    "border-radius": "panelRadius",
    "clip-path": "panelClipPath",
}

# Vocabulario de adornos: propiedad del skin -> nombre en el manifiesto.
ORNAMENT_PROPERTIES = {
    "--skin-ornament-tape": "tape",
    "--skin-ornament-brackets": "brackets",
    "--skin-ornament-reticle": "reticle",
}

SHAPE_ATTR_RE = re.compile(r'data-theme-shape="([a-z_0-9]+)"')


# =============================================================================
# Utilidades de CSS
# =============================================================================

def strip_css_comments(text: str) -> str:
    """Quita los comentarios `/* ... */` (respetando cadenas)."""
    out = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in "\"'":
            quote = ch
            out.append(ch)
            i += 1
            while i < n:
                out.append(text[i])
                if text[i] == "\\":
                    if i + 1 < n:
                        out.append(text[i + 1])
                    i += 2
                    continue
                if text[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            out.append(" ")
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def split_decls(body: str):
    """Cuerpo -> [(propiedad, valor)] (respeta `;` dentro de funciones).

    Los comentarios se eliminan ANTES de analizar: si no, una declaracion
    documentada con un comentario inline se tomaria por dos declaraciones.
    """
    out = []
    buf = ""
    depth = 0
    for ch in strip_css_comments(body):
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == ";" and depth == 0:
            if ":" in buf:
                prop, value = buf.split(":", 1)
                out.append((prop.strip(), value.strip()))
            buf = ""
        else:
            buf += ch
    if ":" in buf:
        prop, value = buf.split(":", 1)
        out.append((prop.strip(), value.strip()))
    return out


def split_selector_list(selector: str):
    """Divide una lista de selectores por comas de nivel superior.

    Respeta las comas dentro de `:is(...)`, `:not(...)` y `:where(...)`.
    """
    parts = []
    depth = 0
    current = ""
    for ch in selector:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            if current.strip():
                parts.append(current.strip())
            current = ""
        else:
            current += ch
    if current.strip():
        parts.append(current.strip())
    return parts


def block_ornaments(body: str):
    """Si el bloque SOLO declara `--skin-ornament-*`, devuelve {nombre: valor}.

    Devuelve `None` cuando la regla hace algo mas (entonces es decoracion de
    escena normal y viaja al pack tal cual).
    """
    decls = split_decls(body)
    if not decls:
        return None
    out = {}
    for prop, value in decls:
        name = ORNAMENT_PROPERTIES.get(prop)
        if name is None:
            return None
        out[name] = value.replace("!important", "").strip()
    return out

# =============================================================================
# Parseo del CSS
# =============================================================================

def parse_blocks(css: str):
    """CSS -> (bloques, lineas).

    Escaner por caracteres, no por lineas: un comentario puede terminar en la
    MISMA linea en la que empieza la regla (`/* ... */ body[...] {`), y un
    parser por lineas se comeria esa regla sin avisar.

    Cada bloque es un dict con:
      * `start`, `end`: indices de linea (1-based) de la regla;
      * `selector`, `body`: la regla (el cuerpo conserva su indentacion
        interna, para reemitirlo tal cual en el `shapes.css` del pack);
      * `comment`: lineas del comentario que la precede;
      * `comment_lines`: indices de esas lineas (para borrarlas con precision).
    """
    lines = css.split("\n")
    line_starts = [0]
    for line in lines[:-1]:
        line_starts.append(line_starts[-1] + len(line) + 1)

    def line_of(offset: int) -> int:
        return bisect.bisect_right(line_starts, offset)

    blocks = []
    pending_comment = ""
    pending_comment_lines = []
    i = 0
    n = len(css)
    while i < n:
        if css[i].isspace():
            i += 1
            continue
        if css.startswith("/*", i):
            end = css.find("*/", i + 2)
            end = n if end < 0 else end + 2
            pending_comment = css[i:end]
            pending_comment_lines = list(range(line_of(i), line_of(end - 1) + 1))
            i = end
            continue

        # Selector: hasta la llave de apertura (respetando cadenas).
        sel_start = i
        quote = None
        while i < n:
            ch = css[i]
            if quote:
                if ch == "\\":
                    i += 2
                    continue
                if ch == quote:
                    quote = None
            elif ch in "\"'":
                quote = ch
            elif ch == "{":
                break
            i += 1
        if i >= n:
            break
        selector = css[sel_start:i].strip()

        # Cuerpo: hasta la llave de cierre que equilibra (respetando cadenas).
        body_start = i + 1
        depth = 1
        quote = None
        j = body_start
        while j < n and depth:
            ch = css[j]
            if quote:
                if ch == "\\":
                    j += 2
                    continue
                if ch == quote:
                    quote = None
            elif ch in "\"'":
                quote = ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
            j += 1

        blocks.append({
            "start": line_of(sel_start),
            "end": line_of(max(j - 1, sel_start)),
            "selector": selector,
            "body": css[body_start:j - 1].strip(),
            "comment": pending_comment.strip(),
            "comment_lines": list(pending_comment_lines),
        })
        pending_comment = ""
        pending_comment_lines = []
        i = j
    return blocks, lines

# =============================================================================
# Migracion
# =============================================================================

def _load_packs():
    owner = {}
    pack_files = {}
    for pack_json in sorted(PACKS_DIR.glob("*/pack.json")):
        data = json.loads(pack_json.read_text(encoding="utf-8"))
        pack_id = data.get("id") or pack_json.parent.name
        pack_files[pack_id] = pack_json
        for shape in data.get("shapes", []):
            owner[shape["id"]] = pack_id
    return owner, pack_files


def _split_by_pack(selector: str, owner: dict):
    """Reparte una lista de selectores entre los packs de sus formas.

    Las formas son excluyentes (solo una `data-theme-shape` esta activa a la
    vez), asi que partir la regla por pack es equivalente.
    """
    out = defaultdict(list)
    for parte in split_selector_list(selector):
        parte_ids = [i for i in SHAPE_ATTR_RE.findall(parte) if i in owner]
        if not parte_ids:
            continue
        packs = {owner[i] for i in parte_ids}
        if len(packs) != 1:
            continue
        out[packs.pop()].append(parte)
    return out


def main() -> int:
    css = STYLES.read_text(encoding="utf-8")
    blocks, lines = parse_blocks(css)
    owner, pack_files = _load_packs()

    component_geometry = defaultdict(dict)
    scene_by_pack = defaultdict(list)
    remove = set()
    migrated = 0
    warnings = []

    for block in blocks:
        start, end = block["start"], block["end"]
        selector, body = block["selector"], block["body"]
        ids = [i for i in SHAPE_ATTR_RE.findall(selector) if i in owner]
        if not ids:
            continue
        packs = {owner[i] for i in ids}

        # 1) Componente: geometria que el motor traduce a CSS.
        if (any(t in selector for t in COMPONENT_TARGETS)
                and ':not([data-theme-shape="original"])' not in selector):
            shape_id = ids[0]
            for prop, value in split_decls(body):
                key = GEOMETRY_DECLARATIONS.get(prop)
                if key:
                    component_geometry[shape_id][key] = value
                else:
                    warnings.append(
                        f"{shape_id}: declaracion de componente no soportada ({prop})")
            remove.update(range(start, end + 1))
            migrated += 1
            continue

        # 2) Adornos que comparten formas de varios packs: es una decision de
        #    la forma, no de la escena -> viaja como dato (`geometry.ornaments`).
        ornaments = block_ornaments(body)
        if ornaments is not None and len(packs) > 1:
            disabled = [name for name, value in ornaments.items() if value != "block"]
            for shape_id in ids:
                if disabled:
                    component_geometry[shape_id]["ornaments"] = list(disabled)
            remove.update(range(start, end + 1))
            migrated += 1
            continue

        # 3) Escena: viaja al pack que declara la forma, tal cual.
        if len(packs) == 1:
            scene_by_pack[packs.pop()].append((selector, body, block["comment"]))
        else:
            for pack_id, parts in _split_by_pack(selector, owner).items():
                scene_by_pack[pack_id].append((",\n".join(parts), body, block["comment"]))
        remove.update(range(start, end + 1))
        migrated += 1

    if not migrated:
        print("Nada que migrar: styles.css ya no tiene reglas de forma.")
        return 0

    # Los comentarios que documentaban una regla migrada se van con ella (por
    # indice, no por texto: si no, se llevarian cabeceras ajenas).
    for block in blocks:
        if not block["comment_lines"]:
            continue
        if any(idx in remove for idx in range(block["start"], block["end"] + 1)):
            remove.update(block["comment_lines"])

    # --- pack.json: geometria de componente y adornos -------------------
    for pack_id, pack_json in pack_files.items():
        data = json.loads(pack_json.read_text(encoding="utf-8"))
        changed = False
        for shape in data.get("shapes", []):
            geom = component_geometry.get(shape["id"])
            if geom:
                shape["geometry"] = geom
                changed = True
        if changed:
            pack_json.write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8")
            print(f"  pack.json actualizado: {pack_id}")

    # --- shapes.css por pack: decoracion de escena ----------------------
    for pack_id, rules in scene_by_pack.items():
        pack_dir = PACKS_DIR / pack_id
        out = [f"/* Decoracion de escena de las formas del pack {pack_id}.",
               "   CSS del pack: lo consume el motor desde common/generated/shapes.css.",
               "   Aqui si puede haber color literal propio del pack (no del tema).", "*/", ""]
        for selector, body, comment in rules:
            if comment:
                out.append(comment)
            out.append(f"{selector} {{")
            out.append(body)
            out.append("}")
            out.append("")
        (pack_dir / "shapes.css").write_text("\n".join(out), encoding="utf-8")
        print(f"  shapes.css escrito: {pack_id} ({len(rules)} reglas)")

    # --- styles.css limpio ----------------------------------------------
    kept = [line for idx, line in enumerate(lines, start=1) if idx not in remove]
    # Las reglas migradas dejan huecos: se colapsan (maximo una linea en
    # blanco seguida) para que el fichero quede legible.
    collapsed = []
    for line in kept:
        if not line.strip() and collapsed and not collapsed[-1].strip():
            continue
        collapsed.append(line)
    while collapsed and not collapsed[-1].strip():
        collapsed.pop()
    STYLES.write_text("\n".join(collapsed) + "\n", encoding="utf-8")

    print(f"  reglas migradas: {migrated}")
    print(f"  lineas retiradas de styles.css: {len(remove)}")
    for warning in warnings:
        print(f"  AVISO: {warning}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
