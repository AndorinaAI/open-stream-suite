"""Generador unico del CSS de un tema: `theme.json` -> `style.css`.

Un tema vivia en dos sitios que no se hablaban: `theme.json` (los colores que
edita el panel) y `style.css` (los `--color-*` que se pintan). El editor del
panel regeneraba el CSS con valores fijos, asi que editar un tema cozy lo
pintaba con los grises del maker; editar uno dejaba el otro mintiendo.

Aqui la verdad es **un solo fichero**: `theme.json`, con

  * `tokens`  : mapa exacto de tokens CSS (`--color-*`, `--frame-*`,
                `--panel-*`, `--badge-*`, `--header-*`, `--theme-glow`...);
  * `cssExtra`: CSS libre (animaciones o reglas propias) que se concatena.

y de aqui se generan, siempre:

  * `style.css`          -> `sync_common_themes_css` -> `common/themes.css`
  * `style.default.css`  -> generado desde `theme.default.json` (fabrica)

Determinista: dos renders del mismo spec dan el mismo texto.
"""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[2]
STREAMTHEMES_DIR = APP_DIR / "streamthemes"

# Tokens que TODO tema debe declarar (los consumen components.css, oss-skin.css
# y los widgets).
REQUIRED_TOKENS = (
    "--color-bg-dark",
    "--color-text-light",
    "--color-accent-cyan",
    "--color-accent-orange",
    "--color-panel-bg",
    "--color-text-dim",
    "--color-border-cyan",
    "--color-border-cyan-bright",
    "--theme-glow",
    "--frame-radius",
    "--frame-border-width",
    "--frame-border-style",
    "--frame-clip-path",
    "--panel-radius",
    "--panel-clip-path",
    "--badge-radius",
    "--badge-clip-path",
    "--header-radius",
    "--header-clip-path",
)

# Orden canonico de emision (identico al de los style.css historicos).
TOKEN_ORDER = (
    "--color-bg-dark",
    "--color-text-light",
    "--color-accent-cyan",
    "--color-accent-orange",
    "--color-panel-bg",
    "--color-text-dim",
    "--color-border-cyan",
    "--color-border-cyan-bright",
    "--theme-glow",
    "--frame-radius",
    "--frame-border-width",
    "--frame-border-style",
    "--frame-clip-path",
    "--frame-shadow",
    "--frame-corner-display",
    "--panel-radius",
    "--panel-clip-path",
    "--panel-backdrop",
    "--panel-shadow",
    "--badge-radius",
    "--badge-clip-path",
    "--header-radius",
    "--header-clip-path",
)

# Campo del `theme.json` (camelCase) -> token CSS.
FIELD_TO_TOKEN = {
    "bgDark": "--color-bg-dark",
    "textLight": "--color-text-light",
    "accentCyan": "--color-accent-cyan",
    "accentOrange": "--color-accent-orange",
    "panelBg": "--color-panel-bg",
    "textDim": "--color-text-dim",
}

# Geometria por defecto para temas NUEVOS que no declaren `tokens` (los
# existentes conservan sus valores exactos, que son los que ya se ven).
BORDER_STYLES = {
    "rounded":   {"frame": "4px", "panel": "8px", "badge": "4px", "style": "solid", "width": "2px", "clip": "none"},
    "pill":      {"frame": "28px", "panel": "24px", "badge": "50px", "style": "solid", "width": "2px", "clip": "none"},
    "square":    {"frame": "0px", "panel": "0px", "badge": "0px", "style": "solid", "width": "2px", "clip": "none"},
    "chamfer":   {"frame": "0px", "panel": "0px", "badge": "0px", "style": "solid", "width": "2px",
                  "clip": "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"},
    "double":    {"frame": "6px", "panel": "8px", "badge": "4px", "style": "double", "width": "3px", "clip": "none"},
    "blueprint": {"frame": "2px", "panel": "4px", "badge": "2px", "style": "dashed", "width": "1.5px", "clip": "none"},
    "comic":     {"frame": "4px", "panel": "8px", "badge": "4px", "style": "solid", "width": "3px", "clip": "none"},
}

_THEME_BLOCK_RE = re.compile(
    r'^[ \t]*(?:body\[data-theme="(?P<id>[^"]+)"\]\s*,?\s*)?'
    r'(?:\[data-theme="(?P<id2>[^"]+)"\]\s*,?\s*)?\{',
    re.MULTILINE,
)
_DECL_RE = re.compile(r"(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);", re.DOTALL)


@dataclass(frozen=True)
class ThemeSpec:
    """Todo lo que define el CSS de un tema."""

    id: str
    pack_id: str = ""
    name: str = ""
    archetype: str = ""
    tokens: dict = field(default_factory=dict)
    css_extra: str = ""

    def tokens_in_order(self) -> list:
        out = [(k, self.tokens[k]) for k in TOKEN_ORDER if k in self.tokens]
        known = {k for k, _ in out}
        out += [(k, v) for k, v in self.tokens.items() if k not in known]
        return out

def tokens_from_css(css: str, theme_id: str = "") -> tuple:
    """Divide un `style.css` en (tokens del bloque del tema, resto).

    El resto (animaciones, selectores propios) viaja a `cssExtra` sin tocar.
    """
    text = str(css or "")
    match = None
    for m in _THEME_BLOCK_RE.finditer(text):
        found = m.group("id") or m.group("id2")
        if theme_id and found and found != theme_id:
            continue
        match = m
        break
    if match is None:
        return {}, text.strip()

    start = text.find("{", match.start()) + 1
    depth = 1
    i = start
    while i < len(text) and depth:
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
        i += 1
    body = text[start:i - 1]
    rest = (text[:match.start()] + text[i:]).strip()

    tokens = {}
    for decl in _DECL_RE.finditer(body):
        value = re.sub(r"[ \t]*\n[ \t]*", "\n    ", decl.group(2)).strip()
        tokens[decl.group(1)] = value
    return tokens, rest


def spec_from_meta(meta: dict, *, pack_id: str = "", theme_id: str = "") -> ThemeSpec:
    """`theme.json` -> ThemeSpec. Acepta el esquema plano y el de `tokens`."""
    if not isinstance(meta, dict):
        meta = {}
    tid = str(meta.get("id") or theme_id or "").strip()
    tokens = {}
    colors = meta.get("colors")
    if isinstance(colors, dict):
        for key, value in colors.items():
            token = FIELD_TO_TOKEN.get(key) or str(key)
            tokens[token] = str(value)
    for key, token in FIELD_TO_TOKEN.items():
        if meta.get(key):
            tokens.setdefault(token, str(meta[key]))
    if isinstance(meta.get("tokens"), dict):
        tokens.update({str(k): str(v) for k, v in meta["tokens"].items()})
    return ThemeSpec(
        id=tid,
        pack_id=str(meta.get("packId") or pack_id or ""),
        name=str(meta.get("name") or tid),
        archetype=str(meta.get("archetype") or ""),
        tokens=tokens,
        css_extra=str(meta.get("cssExtra") or ""),
    )


def _with_default_geometry(spec: ThemeSpec) -> ThemeSpec:
    """Completa la geometria que falte (temas nuevos creados desde el panel)."""
    if all(t in spec.tokens for t in REQUIRED_TOKENS):
        return spec
    geo = BORDER_STYLES.get(str(spec.tokens.get("borderStyle", "rounded")), BORDER_STYLES["rounded"])
    tokens = dict(spec.tokens)
    cyan = tokens.get("--color-accent-cyan", "#57D6C4")
    tokens.setdefault("--color-bg-dark", "#191D21")
    tokens.setdefault("--color-text-light", "#F2EEE5")
    tokens.setdefault("--color-accent-cyan", "#57D6C4")
    tokens.setdefault("--color-accent-orange", "#FF783F")
    tokens.setdefault("--color-panel-bg", "#2E363B")
    tokens.setdefault("--color-text-dim", "#8B969C")
    tokens.setdefault("--color-border-cyan", cyan + "66")
    tokens.setdefault("--color-border-cyan-bright", cyan)
    tokens.setdefault("--theme-glow", "none")
    tokens.setdefault("--frame-radius", geo["frame"])
    tokens.setdefault("--frame-border-width", geo["width"])
    tokens.setdefault("--frame-border-style", geo["style"])
    tokens.setdefault("--frame-clip-path", geo["clip"])
    tokens.setdefault("--frame-shadow", "none")
    tokens.setdefault("--frame-corner-display", "none")
    tokens.setdefault("--panel-radius", geo["panel"])
    tokens.setdefault("--panel-clip-path", "none")
    tokens.setdefault("--panel-backdrop", "blur(10px)")
    tokens.setdefault("--panel-shadow", "none")
    tokens.setdefault("--badge-radius", geo["badge"])
    tokens.setdefault("--badge-clip-path", "none")
    tokens.setdefault("--header-radius", geo["panel"])
    tokens.setdefault("--header-clip-path", "none")
    return ThemeSpec(id=spec.id, pack_id=spec.pack_id, name=spec.name,
                     archetype=spec.archetype, tokens=tokens, css_extra=spec.css_extra)

def render_theme_css(spec: ThemeSpec) -> str:
    """CSS determinista del tema (un bloque de tokens + `cssExtra`).

    El selector es doble (`body[data-theme]` + `[data-theme]`) igual que en
    `generated/archetypes.css`: asi el tema alcanza tambien a los elementos
    que no son el `<body>` (previsualizaciones, iframes) sin duplicar reglas.
    """
    spec = _with_default_geometry(spec)
    lines = [
        f'body[data-theme="{spec.id}"],',
        f'[data-theme="{spec.id}"] {{',
    ]
    for token, value in spec.tokens_in_order():
        if token == "borderStyle":
            continue
        lines.append(f"  {token}: {value};")
    lines.append("}")
    css = "\n".join(lines) + "\n"
    if spec.css_extra.strip():
        css += "\n" + spec.css_extra.strip() + "\n"
    return css


def validate_rendered_css(css: str, spec: ThemeSpec) -> list:
    """Problemas del CSS generado (vacio = ok)."""
    problems = []
    missing = [t for t in REQUIRED_TOKENS if f"{t}:" not in css]
    if missing:
        problems.append(f"{spec.id}: faltan tokens {missing}")
    if "@import" in css.lower():
        problems.append(f"{spec.id}: el CSS no puede usar @import")
    if len(css) > 512 * 1024:
        problems.append(f"{spec.id}: el CSS supera 512 KB")
    if "\x00" in css:
        problems.append(f"{spec.id}: el CSS contiene bytes nulos")
    return problems


def atomic_write(path: Path, text: str) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    tmp.replace(path)


def write_theme_files(theme_dir: Path, spec: ThemeSpec) -> None:
    """Escribe `theme.json` (con `tokens`) y el `style.css` generado."""
    theme_dir = Path(theme_dir)
    meta = {}
    meta_path = theme_dir / "theme.json"
    if meta_path.is_file():
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except ValueError:
            meta = {}
    meta.setdefault("id", spec.id)
    meta.setdefault("packId", spec.pack_id)
    meta.setdefault("name", spec.name)
    if spec.archetype:
        meta["archetype"] = spec.archetype
    meta["tokens"] = dict(spec.tokens_in_order())
    if spec.css_extra.strip():
        meta["cssExtra"] = spec.css_extra.strip()
    else:
        meta.pop("cssExtra", None)
    atomic_write(meta_path, json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    atomic_write(theme_dir / "style.css", render_theme_css(spec))


def theme_dirs() -> list:
    return sorted(p for p in STREAMTHEMES_DIR.glob("*/styles/*") if p.is_dir())


def regenerate_all_themes(*, check: bool = False) -> dict:
    """Regenera cada `style.css` desde su `theme.json`.

    `check=True` no escribe: devuelve `{tema: "desactualizado"}` para que el CI
    (y una persona) revise el diff antes de aplicar nada.
    """
    pending = {}
    for theme_dir in theme_dirs():
        meta_path = theme_dir / "theme.json"
        if not meta_path.is_file():
            continue
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except ValueError:
            pending[theme_dir.name] = "theme.json ilegible"
            continue
        spec = spec_from_meta(meta, pack_id=theme_dir.parent.parent.name,
                              theme_id=theme_dir.name)
        css = render_theme_css(spec)
        css_path = theme_dir / "style.css"
        current = css_path.read_text(encoding="utf-8") if css_path.is_file() else ""
        if current != css:
            pending[theme_dir.name] = "desactualizado"
            if not check:
                atomic_write(css_path, css)
    return pending


def css_hash(css: str) -> str:
    return hashlib.sha256(css.encode("utf-8")).hexdigest()

def apply_color_fields(meta: dict) -> dict:
    """Vuelca los campos de color del formulario (camelCase) en `meta['tokens']`.

    El editor del panel trabaja con `accentCyan`, `bgDark`...; el CSS se emite
    desde `tokens`. Esta funcion mantiene las dos vistas del MISMO dato dentro
    del mismo fichero, sin que puedan divergir.
    """
    if not isinstance(meta, dict):
        return meta
    tokens = meta.get("tokens")
    if not isinstance(tokens, dict):
        tokens = {}
    for key, token in FIELD_TO_TOKEN.items():
        value = meta.get(key)
        if isinstance(value, str) and value.strip():
            tokens[token] = value.strip()
    meta["tokens"] = tokens
    return meta

def regenerate_factory_copy(theme_dir: Path) -> bool:
    """Regenera `style.default.css` desde `theme.default.json`.

    La copia de fabrica ya no se mantiene a mano: es otro derivado. Si falta el
    `theme.default.json` no se inventa nada (el tema no tiene fabrica).
    """
    theme_dir = Path(theme_dir)
    meta_path = theme_dir / "theme.default.json"
    if not meta_path.is_file():
        return False
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except ValueError:
        return False
    spec = spec_from_meta(meta, pack_id=theme_dir.parent.parent.name,
                          theme_id=theme_dir.name)
    css = render_theme_css(spec)
    target = theme_dir / "style.default.css"
    if target.is_file() and target.read_text(encoding="utf-8") == css:
        return False
    atomic_write(target, css)
    return True


def regenerate_all_factory_copies(*, check: bool = False) -> dict:
    """Recorre los temas y deja las copias de fabrica al dia."""
    pending = {}
    for theme_dir in theme_dirs():
        meta_path = theme_dir / "theme.default.json"
        if not meta_path.is_file():
            continue
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        spec = spec_from_meta(meta, pack_id=theme_dir.parent.parent.name,
                              theme_id=theme_dir.name)
        expected = render_theme_css(spec)
        target = theme_dir / "style.default.css"
        current = target.read_text(encoding="utf-8") if target.is_file() else ""
        if current != expected:
            pending[theme_dir.name] = "copia de fabrica desactualizada"
            if not check:
                atomic_write(target, expected)
    return pending

def preview_css(meta: dict) -> str:
    """CSS que producira un `theme.json` SIN escribir nada en disco.

    Lo usa el editor del panel: la vista previa deja de ser un CSS inventado
    con literales y pasa a ser exactamente lo que se va a guardar.
    """
    meta = dict(meta) if isinstance(meta, dict) else {}
    apply_color_fields(meta)
    spec = spec_from_meta(meta, pack_id=str(meta.get("packId") or ""),
                          theme_id=str(meta.get("id") or ""))
    css = render_theme_css(spec)
    problems = validate_rendered_css(css, spec)
    if problems:
        raise ValueError("; ".join(problems))
    return css
