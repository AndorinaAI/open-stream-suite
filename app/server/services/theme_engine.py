"""Motor declarativo de apariencia: carga, valida y genera el CSS del tema.

Este módulo es la **fuente de verdad** del motor de apariencia. Antes de el,
la apariencia vivia en tres sitios a la vez:

  * 4 bloques de arquetipo hardcodeados en `common/styles.css`;
  * 264 reglas de forma escritas a mano en el mismo fichero;
  * el tema, que solo aportaba colores.

Eso hacia que "un pack nuevo = se anade solo" fuera falso: cada forma nueva
exigia editar el CSS comun, y las formas fijaban colores literales que no
pertenecian al tema.

Aqui la verdad son los **manifiestos en disco**:

  * `common/archetypes.json`      -> los arquetipos y su skin (`--skin-*`);
  * `streamthemes/<Pack>/pack.json` -> las formas del pack, con su `geometry`
    (geometria) y sus `tokens` (que color usan);
  * `streamthemes/<Pack>/shapes.css` -> la decoracion de escena de las formas
    (opcional): lo que no se puede expresar como dato (marcos de camara,
    chinchetas, HUD...). Vive en el pack, no en el motor.

Y de aqui salen, generados y deterministas:

  * `common/generated/archetypes.css`   -> los bloques `--skin-*` por arquetipo;
  * `common/generated/shapes.css`       -> las reglas de forma (componentes
    generadas desde los datos + decoracion de los packs);
  * `common/generated/shape-catalog.json` -> el catalogo que consumen backend
    y panel, para que nadie duplique listas.

Reglas de diseno:
  * Sin dependencias nuevas: solo `json`, `pathlib` y `dataclasses`.
  * Determinista: dos ejecuciones seguidas producen ficheros identicos (hash).
  * Escritura atomica: nunca se deja un generado a medias.
  * Ningun color literal en lo generado: todo se apoya en `var(--color-*)` o
    `var(--skin-*)`, que es lo que hace que la forma herede la paleta del tema.
"""
from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any, Optional

from server.config import BASE_DIR

logger = logging.getLogger("oss.theme_engine")

STREAMTHEMES_DIR = BASE_DIR / "streamthemes"
COMMON_DIR = BASE_DIR / "common"
GENERATED_DIR = COMMON_DIR / "generated"
ARCHETYPES_FILE = COMMON_DIR / "archetypes.json"
ARCHETYPES_CSS = GENERATED_DIR / "archetypes.css"
SHAPES_CSS = GENERATED_DIR / "shapes.css"
SHAPE_CATALOG = GENERATED_DIR / "shape-catalog.json"

# Tokens de skin que TODO arquetipo debe declarar. Si falta uno, el arquetipo
# se considera incompleto: es preferible avisar a omitir un token que dejar
# un componente con la geometria de otro arquetipo a medias.
REQUIRED_ARCHETYPE_TOKENS = (
    "--skin-font-display",
    "--skin-font-body",
    "--skin-frame-radius",
    "--skin-frame-clip",
    "--skin-header-radius",
    "--skin-header-clip",
    "--skin-panel-radius",
    "--skin-panel-clip",
    "--skin-badge-radius",
    "--skin-pill-radius",
    "--skin-ornament-tape",
    "--skin-ornament-reticle",
    "--skin-ornament-brackets",
)

# Selectores universales de componente: una forma fisica se pinta aqui.
COMPONENT_TARGETS = ("#alert-card", "#banner-alert-root", "[data-oss-shape-target]")

# Vocabulario de adornos fisicos: `ornaments` de un shape -> token del skin.
ORNAMENT_TOKENS = {
    "tape": "--skin-ornament-tape",
    "brackets": "--skin-ornament-brackets",
    "reticle": "--skin-ornament-reticle",
}

# Propiedades de `geometry` que el motor sabe traducir a CSS.
GEOMETRY_PROPERTIES = (
    "frameRadius",
    "frameClipPath",
    "panelRadius",
    "panelClipPath",
    "borderWidth",
    "borderStyle",
    "shadow",
    "glow",
    "inset",
)



# =============================================================================
# Modelos de datos
# =============================================================================

@dataclass(frozen=True)
class ArchetypeDefinition:
    """Un arquetipo: la familia de tokens `--skin-*` que da su geometria."""

    id: str
    label: str
    tokens: dict
    skin: dict
    atmosphere: dict = field(default_factory=dict)

    @property
    def missing_tokens(self) -> tuple:
        return tuple(t for t in REQUIRED_ARCHETYPE_TOKENS if t not in self.tokens)


@dataclass(frozen=True)
class ShapeDefinition:
    """Una forma fisica declarada por un pack."""

    id: str
    name: str
    icon: str
    archetype: str
    description: str
    geometry: dict = field(default_factory=dict)
    tokens: dict = field(default_factory=dict)
    applies_to: tuple = ("scene", "component")
    pack_id: str = ""
    pack_default: bool = False

    @property
    def panel_radius(self) -> Optional[str]:
        value = self.geometry.get("panelRadius")
        return None if value in (None, "") else str(value)

    @property
    def panel_clip_path(self) -> Optional[str]:
        value = self.geometry.get("panelClipPath")
        return None if value in (None, "") else str(value)


@dataclass(frozen=True)
class ThemeDefinition:
    """Un tema de un pack."""

    id: str
    pack_id: str
    name: str
    archetype: str
    skin: dict
    css_path: Path


@dataclass(frozen=True)
class PackDefinition:
    """Un pack: su arquetipo, sus formas y sus temas."""

    id: str
    name: str
    archetype: str
    version: str
    shapes: tuple
    themes: tuple
    dir: Path
    default_theme: str = ""
    default_shape: str = ""


# =============================================================================
# Carga
# =============================================================================

def _read_json(path: Path) -> Optional[Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def load_archetypes() -> dict:
    """Lee `common/archetypes.json` -> `{id: ArchetypeDefinition}`.

    Devuelve un dict vacio si el fichero falta o esta corrupto (el backend
    sigue funcionando con los valores por defecto del CSS base).
    """
    data = _read_json(ARCHETYPES_FILE)
    if not isinstance(data, dict):
        return {}
    raw_list = data.get("archetypes")
    if not isinstance(raw_list, list):
        return {}
    out: dict = {}
    for raw in raw_list:
        if not isinstance(raw, dict):
            continue
        arch_id = str(raw.get("id") or "").strip()
        if not arch_id:
            continue
        tokens = raw.get("tokens")
        skin = raw.get("skin")
        out[arch_id] = ArchetypeDefinition(
            id=arch_id,
            label=str(raw.get("label") or arch_id),
            tokens=dict(tokens) if isinstance(tokens, dict) else {},
            skin=dict(skin) if isinstance(skin, dict) else {},
            atmosphere=dict(raw.get("atmosphere")) if isinstance(raw.get("atmosphere"), dict) else {},
        )
    return out


def _shape_from_raw(raw: Any, pack_id: str, pack_archetype: str) -> Optional[ShapeDefinition]:
    if not isinstance(raw, dict):
        return None
    shape_id = str(raw.get("id") or "").strip()
    if not shape_id:
        return None
    geometry = raw.get("geometry")
    tokens = raw.get("tokens")
    applies = raw.get("appliesTo") or raw.get("applies_to")
    if not isinstance(applies, list) or not applies:
        applies = ["scene", "component"]
    return ShapeDefinition(
        id=shape_id,
        name=str(raw.get("name") or shape_id),
        icon=str(raw.get("icon") or ""),
        archetype=str(raw.get("archetype") or pack_archetype or ""),
        description=str(raw.get("description") or ""),
        geometry=dict(geometry) if isinstance(geometry, dict) else {},
        tokens=dict(tokens) if isinstance(tokens, dict) else {},
        applies_to=tuple(str(a) for a in applies),
        pack_id=pack_id,
    )


def load_packs() -> list:
    """Lee `streamthemes/*/pack.json` + sus `styles/*/theme.json`."""
    packs = []
    if not STREAMTHEMES_DIR.is_dir():
        return packs
    for pack_dir in sorted(p for p in STREAMTHEMES_DIR.iterdir() if p.is_dir()):
        raw = _read_json(pack_dir / "pack.json")
        if not isinstance(raw, dict):
            continue
        pack_id = str(raw.get("id") or pack_dir.name)
        pack_archetype = str(raw.get("archetype") or "")
        default_theme = str(raw.get("defaultTheme") or "")
        default_shape = str(raw.get("defaultShape") or "")

        shapes = []
        for shape_raw in raw.get("shapes") or []:
            shape = _shape_from_raw(shape_raw, pack_id, pack_archetype)
            if shape is not None:
                if default_shape and shape.id == default_shape:
                    shape = replace(shape, pack_default=True)
                shapes.append(shape)

        themes = []
        styles_dir = pack_dir / "styles"
        if styles_dir.is_dir():
            for theme_dir in sorted(p for p in styles_dir.iterdir() if p.is_dir()):
                theme_raw = _read_json(theme_dir / "theme.json")
                theme_raw = theme_raw if isinstance(theme_raw, dict) else {}
                theme_skin = theme_raw.get("skin")
                themes.append(ThemeDefinition(
                    id=str(theme_raw.get("id") or theme_dir.name),
                    pack_id=pack_id,
                    name=str(theme_raw.get("name") or theme_dir.name),
                    archetype=str(theme_raw.get("archetype") or pack_archetype or ""),
                    skin=dict(theme_skin) if isinstance(theme_skin, dict) else {},
                    css_path=theme_dir / "style.css",
                ))

        packs.append(PackDefinition(
            id=pack_id,
            name=str(raw.get("name") or pack_id),
            archetype=pack_archetype,
            version=str(raw.get("version") or ""),
            shapes=tuple(shapes),
            themes=tuple(themes),
            dir=pack_dir,
            default_theme=default_theme,
            default_shape=default_shape,
        ))
    return packs


# =============================================================================
# Validacion
# =============================================================================

def validate_manifest() -> list:
    """Devuelve la lista de problemas del manifiesto (vacia = todo correcto)."""
    problems: list = []

    archetypes = load_archetypes()
    if not archetypes:
        problems.append("common/archetypes.json no existe o no declara arquetipos")
    for arch_id, arch in sorted(archetypes.items()):
        for token in arch.missing_tokens:
            problems.append(f"arquetipo '{arch_id}': falta el token {token}")

    packs = load_packs()
    if not packs:
        problems.append("no hay packs en streamthemes/")

    seen_shapes: dict = {}
    for pack in packs:
        if not pack.archetype:
            problems.append(f"pack '{pack.id}': no declara 'archetype'")
        elif archetypes and pack.archetype not in archetypes:
            problems.append(f"pack '{pack.id}': arquetipo '{pack.archetype}' no existe en archetypes.json")

        for theme in pack.themes:
            if not theme.archetype:
                problems.append(f"tema '{pack.id}/{theme.id}': no declara 'archetype'")
            elif archetypes and theme.archetype not in archetypes:
                problems.append(f"tema '{pack.id}/{theme.id}': arquetipo '{theme.archetype}' no existe")
            elif theme.archetype and pack.archetype and theme.archetype != pack.archetype:
                problems.append(
                    f"tema '{pack.id}/{theme.id}': archetype '{theme.archetype}' "
                    f"contradice el del pack '{pack.archetype}'")

        for shape in pack.shapes:
            if shape.id in seen_shapes:
                problems.append(
                    f"forma '{shape.id}': id duplicado (ya lo declara '{seen_shapes[shape.id]}')")
            else:
                seen_shapes[shape.id] = pack.id
            if not shape.archetype:
                problems.append(f"forma '{shape.id}': no declara 'archetype'")
            elif archetypes and shape.archetype not in archetypes:
                problems.append(f"forma '{shape.id}': arquetipo '{shape.archetype}' no existe")
            if not shape.geometry:
                problems.append(f"forma '{shape.id}': no declara 'geometry'")
            for key in shape.geometry:
                if key not in GEOMETRY_PROPERTIES and key != "ornaments":
                    problems.append(f"forma '{shape.id}': propiedad de geometry desconocida '{key}'")
            if shape.applies_to and not set(shape.applies_to) <= {"scene", "component"}:
                problems.append(f"forma '{shape.id}': appliesTo invalido {list(shape.applies_to)}")
    return problems


# =============================================================================
# Generadores
# =============================================================================

def _banner(text: str) -> str:
    return (
        "/* ====================================================================\n"
        f"   {text}\n"
        "   Generado por app/server/services/theme_engine.py - NO EDITAR A MANO.\n"
        "   Regenerar: python app/scripts/build_theme_engine.py\n"
        "   ==================================================================== */\n"
    )


def build_archetypes_css() -> str:
    """Genera `common/generated/archetypes.css` desde `common/archetypes.json`."""
    archetypes = load_archetypes()
    parts = [_banner("OPEN STREAM SUITE - TOKENS DE SKIN POR ARQUETIPO")]
    for arch_id, arch in sorted(archetypes.items()):
        parts.append(
            f"/* {arch.label} */\n"
            f'[data-theme-archetype="{arch_id}"],\n'
            f'body[data-theme-archetype="{arch_id}"],\n'
            f'body[data-pack="{arch_id}"]:not([data-theme-archetype]) {{\n'
        )
        for token, value in arch.tokens.items():
            parts.append(f"  {token}: {value};\n")
        for token, value in arch.skin.items():
            parts.append(f"  {token}: {value};\n")
        parts.append("}\n\n")
    return "".join(parts)


def _kebab(name: str) -> str:
    out = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", str(name))
    return out.replace("_", "-").lower()


def _shape_component_rule(shape: ShapeDefinition) -> str:
    """Regla de la forma para los componentes (alerta, banner, widget)."""
    declarations = []
    if shape.panel_radius is not None:
        declarations.append(f"  border-radius: {shape.panel_radius};\n")
    if shape.panel_clip_path is not None:
        declarations.append(f"  clip-path: {shape.panel_clip_path};\n")
    if not declarations:
        return ""
    selectors = ",\n".join(
        f'body[data-theme-shape="{shape.id}"] {target}' for target in COMPONENT_TARGETS)
    return f"{selectors} {{\n{''.join(declarations)}}}\n\n"


def _shape_token_rule(shape: ShapeDefinition) -> str:
    """Publica los tokens de la forma para que su decoracion los use.

    Asi la decoracion de escena (que vive en el pack) no necesita conocer
    colores literales: escribe `var(--shape-accent)` y hereda la paleta.

    `geometry.ornaments` lista los adornos que la forma DESACTIVA (cinta
    washi, marcas de esquina, reticula): son adornos del arquetipo que
    ciertas formas no admiten. Se emite como `none !important` para que la
    forma mande sobre el arquetipo.
    """
    tokens = shape.tokens
    ornaments = [str(o) for o in (shape.geometry.get("ornaments") or [])]
    if not tokens and not ornaments:
        return ""
    lines = [f'body[data-theme-shape="{shape.id}"] {{\n']
    for name, value in tokens.items():
        lines.append(f"  --shape-{_kebab(name)}: {value};\n")
    for ornament in ornaments:
        token = ORNAMENT_TOKENS.get(ornament)
        if token:
            lines.append(f"  {token}: none !important;\n")
    lines.append("}\n\n")
    return "".join(lines)


def build_shapes_css() -> str:
    """Genera `common/generated/shapes.css`.

    Son dos capas:
      1. las reglas de COMPONENTE de cada forma, generadas desde los datos
         (`geometry` de `pack.json`), sin un solo color literal;
      2. la DECORACION de escena de cada pack (`<Pack>/shapes.css`), que es
         CSS del pack y por tanto viaja con el pack.
    """
    parts = [_banner("OPEN STREAM SUITE - FORMAS FISICAS (GENERADAS DESDE EL MANIFIESTO)")]
    packs = load_packs()

    parts.append("/* --- Capa 1: componentes (datos -> CSS) --- */\n\n")
    for pack in packs:
        for shape in pack.shapes:
            parts.append(_shape_token_rule(shape))
            parts.append(_shape_component_rule(shape))

    parts.append("/* --- Capa 2: decoracion de escena (por pack) --- */\n\n")
    for pack in packs:
        shapes_css = pack.dir / "shapes.css"
        if not shapes_css.is_file():
            continue
        try:
            body = shapes_css.read_text(encoding="utf-8").strip()
        except OSError:
            continue
        if not body:
            continue
        parts.append(f"/* Pack: {pack.id} | decoracion de formas */\n{body}\n\n")

    return "".join(parts)


def build_shape_catalog() -> dict:
    """Genera `common/generated/shape-catalog.json`."""
    archetypes = load_archetypes()
    packs = load_packs()
    shapes = []
    for pack in packs:
        for shape in pack.shapes:
            shapes.append({
                "id": shape.id,
                "name": shape.name,
                "icon": shape.icon,
                "archetype": shape.archetype,
                "description": shape.description,
                "packId": pack.id,
                "appliesTo": list(shape.applies_to),
                "geometry": dict(shape.geometry),
                "tokens": dict(shape.tokens),
                "packDefault": shape.pack_default,
            })
    shapes.sort(key=lambda s: s["id"])
    return {
        "archetypes": [
            {"id": a.id, "label": a.label} for a in sorted(archetypes.values(), key=lambda x: x.id)
        ],
        "shapes": shapes,
        "componentTargets": list(COMPONENT_TARGETS),
        # Con esto el cliente no necesita ninguna lista propia: el tema y la
        # forma por defecto de cada pack, y los textos de "atmosfera" por
        # arquetipo, salen de aqui (antes estaban hardcodeados en overlay.js).
        "packDefaults": {
            pack.id: {"theme": pack.default_theme, "shape": pack.default_shape}
            for pack in packs
        },
        "shapeArchetypes": {shape.id: shape.archetype for pack in packs for shape in pack.shapes},
        "archetypeAtmosphere": {
            arch.id: dict(arch.atmosphere)
            for arch in sorted(archetypes.values(), key=lambda x: x.id)
        },
    }


# =============================================================================
# Escritura
# =============================================================================

def _atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(content, encoding="utf-8")
    os.replace(tmp, path)


def build_all() -> dict:
    """Ejecuta los tres generadores y escribe los ficheros. Devuelve el mapa."""
    written = {
        "archetypes.css": build_archetypes_css(),
        "shapes.css": build_shapes_css(),
        "shape-catalog.json": json.dumps(
            build_shape_catalog(), ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    }
    _atomic_write(ARCHETYPES_CSS, written["archetypes.css"])
    _atomic_write(SHAPES_CSS, written["shapes.css"])
    _atomic_write(SHAPE_CATALOG, written["shape-catalog.json"])
    return written


def is_stale() -> bool:
    """True si falta algun generado o es mas antiguo que su manifiesto."""
    inputs = [ARCHETYPES_FILE]
    inputs.extend(sorted(STREAMTHEMES_DIR.glob("*/pack.json")))
    inputs.extend(sorted(STREAMTHEMES_DIR.glob("*/shapes.css")))
    inputs.extend(sorted(STREAMTHEMES_DIR.glob("*/styles/*/theme.json")))
    outputs = [ARCHETYPES_CSS, SHAPES_CSS, SHAPE_CATALOG]
    existing = [p for p in outputs if p.exists()]
    if len(existing) != len(outputs):
        return True
    try:
        oldest_output = min(p.stat().st_mtime for p in existing)
    except (OSError, ValueError):
        return True
    for path in inputs:
        try:
            if path.stat().st_mtime > oldest_output:
                return True
        except OSError:
            continue
    return False


def sync_if_stale() -> bool:
    """Regenera solo si hace falta. True si se ha regenerado."""
    if not is_stale():
        return False
    build_all()
    return True
