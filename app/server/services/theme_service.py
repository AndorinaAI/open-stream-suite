"""
server/services/theme_service.py — Lógica de negocio para packs de temas y estilos visuales
Encapsula la creación, guardado, restauración y aplicación de temas y anclaje de chat.
"""

import json
import re
from pathlib import Path
from server.config import BASE_DIR, logger
from server.state import system
from server.services.fs_utils import atomic_write_json, atomic_write_text
from . import components_catalog
from .validation_utils import (
    is_valid_pack_id,
    is_valid_theme_id,
    is_valid_scene_key,
    is_valid_shape_id,
    normalize_scene_key,
    sanitize_metadata_text,
    METADATA_NAME_MAX,
    METADATA_BADGE_MAX,
    METADATA_DESC_MAX,
    METADATA_ICON_MAX,
    METADATA_AUTHOR_MAX,
)
from server.services.theme_defaults import (
    DEFAULT_PACK_TALLER,
    DEFAULT_THEMES_DATA,
    DEFAULT_OVERLAY_THEMES
)
from server.services import theme_render
from server.services.theme_manager import (
    STREAMTHEMES_DIR,
    derive_explicit_theme_map,
    get_pack_styles_dir,
    get_theme_dir,
    load_theme_state,
    save_theme_state,
    sync_common_themes_css,
    sync_chat_with_theme,
    infer_archetype
)

def _archetype_of_pack(pack_id: str) -> str:
    """Arquetipo declarado por el pack.

    Fuente de verdad cuando el `theme.json` (o su copia de fabrica) no lo trae:
    restaurar un tema no puede dejarlo sin arquetipo, porque entonces deja de
    recibir la familia `--skin-*`.
    """
    pack_json = STREAMTHEMES_DIR / str(pack_id or "") / "pack.json"
    try:
        return str(json.loads(pack_json.read_text(encoding="utf-8")).get("archetype") or "")
    except (OSError, ValueError):
        return ""


def _with_structural_tokens(css: str, theme_id: str) -> str:
    """Garantiza el contrato visual mínimo también en CSS enviado por la UI."""
    required = ("--frame-radius", "--panel-radius", "--badge-radius", "--header-radius")
    if css and all(token in css for token in required):
        return css
    return (css or "") + f"\nbody[data-theme=\"{theme_id}\"] {{\n{STRUCTURAL_THEME_TOKENS}}}\n"


def _validate_theme_css(css) -> str:
    """CSS de tema acotado y sin imports externos/bytes nulos."""
    text = str(css or "")
    if len(text) > 512 * 1024:
        raise ValueError("El CSS del tema supera el límite de 512 KB")
    if "\x00" in text:
        raise ValueError("El CSS contiene bytes nulos")
    if re.search(r"@import\b", text, re.IGNORECASE):
        raise ValueError("El CSS del tema no puede usar @import externos")
    return text


_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _valid_theme_color(value, field: str, default: str) -> str:
    """Colores solo en #RRGGBB: el frontend los concatena y los inyecta en CSS."""
    text = str(value if value is not None else default).strip()
    if not _HEX_COLOR_RE.fullmatch(text):
        raise ValueError(f"Color {field} inválido: usa el formato #RRGGBB")
    return text


def _valid_glow(value, default: int = 50) -> int:
    try:
        glow = int(value if value is not None else default)
    except (TypeError, ValueError):
        raise ValueError("glowIntensity debe ser un número entre 0 y 100")
    if not 0 <= glow <= 100:
        raise ValueError("glowIntensity debe estar entre 0 y 100")
    return glow


def _normalize_theme_colors(meta: dict) -> dict:
    """Valida las claves visuales que acaban en style/HTML del panel."""
    for field, default in (
        ("accentCyan", "#57D6C4"),
        ("accentOrange", "#FF783F"),
        ("bgDark", "#191D21"),
        ("textLight", "#F2EEE5"),
        ("panelBg", "#2E363B"),
        ("textDim", "#8B969C"),
    ):
        meta[field] = _valid_theme_color(meta.get(field), field, default)
    meta["glowIntensity"] = _valid_glow(meta.get("glowIntensity", 50))
    derivative = meta.get("chatDerivative")
    if isinstance(derivative, dict):
        for field in ("borderColor", "bgColor"):
            if field in derivative:
                derivative[field] = _valid_theme_color(derivative[field], f"chatDerivative.{field}", "#57D6C4")
    return meta


STRUCTURAL_THEME_TOKENS = """  --frame-radius: 4px;
  --frame-border-width: 2px;
  --frame-border-style: solid;
  --frame-clip-path: none;
  --frame-shadow: 0 0 18px rgba(87, 214, 196, 0.18), inset 0 0 12px rgba(87, 214, 196, 0.06);
  --frame-corner-display: block;
  --panel-radius: 8px;
  --panel-clip-path: none;
  --panel-backdrop: blur(10px);
  --panel-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  --badge-radius: 4px;
  --badge-clip-path: none;
  --header-radius: 6px;
  --header-clip-path: none;
"""

SHAPE_TO_ARCHETYPE = {
    "cozy_polaroid": "cozy",
    "cozy_canvas": "cozy",
    "cozy_soft": "cozy",
    "cozy": "cozy",
    "gamer_mecha": "gamer",
    "gamer_tactical_hud": "gamer",
    "gamer_stealth": "gamer",
    "gamer_hex_shield": "gamer",
    "gamer_cyber_glitch": "gamer",
    "gamer_arcade_retro": "gamer",
    "gamer": "gamer",
    "maker_blueprint": "maker",
    "maker_workbench": "maker",
    "maker_circuit_pcb": "maker",
    "maker": "maker",
    "openstream_glass": "openstream",
    "openstream_studio": "openstream",
    "openstream": "openstream",
    "fantasy_parchment": "cozy",
    "fantasy_runic_stone": "gamer",
    "gothic_vampire": "gamer",
    "comic_manga_action": "openstream",
    "pop_synth_neon": "openstream",
    "vintage_crt_monitor": "cozy",
}



def create_pack_service(name: str, icon: str = "🎨", badge: str = "PACK PERSONALIZADO",
                        description: str = "Colección modular de temas y estilos personalizados.",
                        author: str = "Usuario") -> dict:
    """Crea una nueva carpeta de pack en streamthemes/<pack_id>/ con sus subcarpetas styles/ y overlays/"""
    # V3-01: los metadatos se pintan con innerHTML en el panel → se sanean ANTES
    # de crear nada en disco (si no son válidos, la API responde 400 y no hay
    # pack a medias).
    name = sanitize_metadata_text(name, "Nombre del pack", max_length=METADATA_NAME_MAX, required=True)
    icon = sanitize_metadata_text(icon, "Icono del pack", max_length=METADATA_ICON_MAX, default="🎨") or "🎨"
    badge = sanitize_metadata_text(
        badge, "Badge del pack", max_length=METADATA_BADGE_MAX, default="PACK PERSONALIZADO"
    ) or "PACK PERSONALIZADO"
    description = sanitize_metadata_text(
        description, "Descripción del pack", max_length=METADATA_DESC_MAX,
        default="Colección modular de temas y estilos personalizados."
    ) or "Colección modular de temas y estilos personalizados."
    author = sanitize_metadata_text(
        author, "Autor del pack", max_length=METADATA_AUTHOR_MAX, default="Usuario"
    ) or "Usuario"

    pack_id = re.sub(r'[^a-zA-Z0-9_-]', '_', name.lower().replace(' ', '_'))
    if not pack_id.startswith("pack_"):
        pack_id = f"pack_{pack_id}"

    pack_dir = STREAMTHEMES_DIR / pack_id
    if pack_dir.exists():
        raise FileExistsError("Ya existe un pack con ese identificador")

    pack_dir.mkdir(parents=True, exist_ok=True)
    (pack_dir / "styles").mkdir(parents=True, exist_ok=True)
    (pack_dir / "overlays").mkdir(parents=True, exist_ok=True)

    meta = {
        "id": pack_id,
        "name": name,
        "icon": icon,
        "badge": badge,
        "description": description,
        "version": "1.0.0",
        "author": author
    }

    atomic_write_json(pack_dir / "pack.json", meta)

    logger.info(f"📁 Nuevo pack de temas creado: {pack_id}")
    return meta


def create_theme_service(body: dict) -> dict:
    """Crea un nuevo tema dentro de un pack específico"""
    pack_id = str(body.get("packId", "Maker_Theme_Pack")).strip()
    # V3-01: nombre/badge/descripción se renderizan con innerHTML en el panel.
    theme_name = sanitize_metadata_text(
        body.get("name", ""), "Nombre del tema", max_length=METADATA_NAME_MAX, required=True
    )

    theme_id = re.sub(r'[^a-zA-Z0-9_-]', '_', theme_name.lower().replace(' ', '_'))
    if not theme_id:
        raise ValueError("Nombre de tema inválido")
    if not is_valid_pack_id(pack_id):
        raise ValueError(f"Pack ID inválido: {pack_id}")
    pack_dir = STREAMTHEMES_DIR / pack_id

    accent_cyan = _valid_theme_color(body.get("accentCyan"), "accentCyan", "#57D6C4")
    accent_orange = _valid_theme_color(body.get("accentOrange"), "accentOrange", "#FF783F")
    bg_dark = _valid_theme_color(body.get("bgDark"), "bgDark", "#191D21")
    text_light = _valid_theme_color(body.get("textLight"), "textLight", "#F2EEE5")
    panel_bg = _valid_theme_color(body.get("panelBg"), "panelBg", "#2E363B")
    text_dim = _valid_theme_color(body.get("textDim"), "textDim", "#8B969C")
    glow = _valid_glow(body.get("glowIntensity", 50))

    theme_badge = sanitize_metadata_text(
        body.get("badge") or theme_name.upper(), "Badge del tema",
        max_length=METADATA_BADGE_MAX, default=theme_name.upper()
    ) or theme_name.upper()
    theme_desc = sanitize_metadata_text(
        body.get("desc") or f"Tema {theme_name} en pack {pack_id}.", "Descripción del tema",
        max_length=METADATA_DESC_MAX, default=f"Tema {theme_name} en pack {pack_id}."
    ) or f"Tema {theme_name} en pack {pack_id}."

    theme_meta = {
        "id": theme_id,
        "packId": pack_id,
        "name": theme_name,
        "badge": theme_badge,
        "accentCyan": accent_cyan,
        "accentOrange": accent_orange,
        "bgDark": bg_dark,
        "textLight": text_light,
        "panelBg": panel_bg,
        "textDim": text_dim,
        "fontPrimary": body.get("fontPrimary", "var(--font-primary)"),
        "fontTech": body.get("fontTech", "var(--font-tech)"),
        "glowIntensity": glow,
        "borderStyle": body.get("borderStyle", "rounded"),
        "desc": theme_desc,
        "chatAnchored": True,
        "chatDerivative": None
    }
    _normalize_theme_colors(theme_meta)

    # El tema se define con datos: `theme_render` deriva la geometria desde
    # `borderStyle`/`glowIntensity` y emite el CSS. Un `css` explicito se
    # descompone en tokens + `cssExtra` (misma unica fuente).
    if body.get("css"):
        incoming = _validate_theme_css(body["css"])
        tokens, extra = theme_render.tokens_from_css(incoming, theme_id)
        theme_meta["tokens"] = tokens
        if extra.strip():
            theme_meta["cssExtra"] = extra.strip()
    theme_meta["tokens"] = dict(theme_meta.get("tokens") or {})
    theme_meta["tokens"].setdefault("--theme-glow", f"0 0 16px {accent_cyan}88")
    theme_meta["tokens"].setdefault("--color-border-cyan", f"{accent_cyan}66")
    theme_meta["tokens"].setdefault("--color-border-cyan-bright", accent_cyan)
    theme_render.apply_color_fields(theme_meta)
    spec = theme_render.spec_from_meta(theme_meta, pack_id=pack_id, theme_id=theme_id)
    css_content = theme_render.render_theme_css(spec)

    styles_dir = get_pack_styles_dir(pack_dir)
    styles_dir.mkdir(parents=True, exist_ok=True)
    theme_dir = styles_dir / theme_id
    if theme_dir.exists() or (pack_dir / theme_id).exists():
        raise FileExistsError("Ya existe un tema con ese nombre en este pack")

    theme_dir.mkdir(parents=True, exist_ok=True)
    if styles_dir != pack_dir and not (pack_dir / theme_id).exists():
        try:
            (pack_dir / theme_id).symlink_to(Path("styles") / theme_id)
        except Exception:
            pass

    atomic_write_json(theme_dir / "theme.json", theme_meta)
    atomic_write_text(theme_dir / "style.css", css_content)
    # Copia de fábrica: permite que "Restaurar" funcione también en temas nuevos.
    atomic_write_json(theme_dir / "theme.default.json", theme_meta)
    atomic_write_text(theme_dir / "style.default.css", css_content)

    sync_common_themes_css()
    logger.info(f"🎨 Nuevo tema creado: {pack_id}/{theme_id}")
    return theme_meta


async def save_theme_service(body: dict) -> dict:
    """Guarda las configuraciones y el código CSS modificado de un tema en disco"""
    pack_id = str(body.get("packId", "Maker_Theme_Pack")).strip()
    theme_id = str(body.get("id", "")).strip()
    if not pack_id or not theme_id:
        raise ValueError("packId e id de tema requeridos")
    if not is_valid_pack_id(pack_id):
        raise ValueError(f"Pack ID inválido: {pack_id}")
    if not is_valid_theme_id(pack_id, theme_id):
        raise ValueError(f"Theme ID inválido: {theme_id}")

    theme_dir = get_theme_dir(pack_id, theme_id)
    if not theme_dir.exists():
        raise FileNotFoundError("Directorio de tema no encontrado")

    t_json_file = theme_dir / "theme.json"
    current_meta = {}
    if t_json_file.exists():
        try:
            with open(t_json_file, "r", encoding="utf-8") as f:
                current_meta = json.load(f)
        except Exception:
            pass

    updates = {}
    for k in ("name", "badge", "accentCyan", "accentOrange", "bgDark", "textLight",
              "panelBg", "textDim", "fontPrimary", "fontTech", "glowIntensity",
              "borderStyle", "desc", "chatAnchored", "chatDerivative"):
        if k in body:
            updates[k] = body[k]

    # V3-01: saneado de textos antes de persistir (mismo vector que en create).
    # Si llega vacío se conserva el valor anterior en vez de romper el guardado.
    for field, label, max_len in (
        ("name", "Nombre del tema", METADATA_NAME_MAX),
        ("badge", "Badge del tema", METADATA_BADGE_MAX),
        ("desc", "Descripción del tema", METADATA_DESC_MAX),
    ):
        if field in updates:
            fallback = str(current_meta.get(field) or "")
            updates[field] = sanitize_metadata_text(
                updates[field], label, max_length=max_len, default=fallback
            ) or fallback

    for field, fallback in (
        ("accentCyan", "#57D6C4"),
        ("accentOrange", "#FF783F"),
        ("bgDark", "#191D21"),
        ("textLight", "#F2EEE5"),
        ("panelBg", "#2E363B"),
        ("textDim", "#8B969C"),
    ):
        if field in updates:
            updates[field] = _valid_theme_color(updates[field], field, current_meta.get(field, fallback))
    if "glowIntensity" in updates:
        updates["glowIntensity"] = _valid_glow(updates["glowIntensity"])
    if isinstance(updates.get("chatDerivative"), dict):
        for field in ("borderColor", "bgColor"):
            if field in updates["chatDerivative"]:
                updates["chatDerivative"][field] = _valid_theme_color(
                    updates["chatDerivative"][field], f"chatDerivative.{field}", "#57D6C4"
                )

    current_meta.update(updates)
    _normalize_theme_colors(current_meta)

    # El CSS deja de ser un segundo estado: se descompone en tokens y se
    # fusiona en `theme.json` (la unica fuente). Lo que no sea un token va a
    # `cssExtra`, que el generador concatena al final.
    if "css" in body:
        incoming = _validate_theme_css(body["css"])
        tokens, extra = theme_render.tokens_from_css(incoming, theme_id)
        if tokens:
            current_meta["tokens"] = tokens
        if extra.strip():
            current_meta["cssExtra"] = extra.strip()
        else:
            current_meta.pop("cssExtra", None)

    # Los campos de color del formulario mandan sobre los tokens del JSON.
    theme_render.apply_color_fields(current_meta)
    # Un tema sin arquetipo deja de recibir `--skin-*`: se rellena desde el pack.
    if not current_meta.get("archetype"):
        current_meta["archetype"] = _archetype_of_pack(pack_id)

    atomic_write_json(t_json_file, current_meta)

    # `style.css` es SIEMPRE derivado: nunca se escribe a mano.
    spec = theme_render.spec_from_meta(
        current_meta, pack_id=pack_id, theme_id=theme_id)
    theme_render.atomic_write(theme_dir / "style.css", theme_render.render_theme_css(spec))

    sync_common_themes_css()

    state = load_theme_state()
    if state.get("activeTheme") == theme_id:
        await system.broadcast({"type": "theme_change", "theme": theme_id})

    logger.info(f"✓ Tema guardado con éxito: {pack_id}/{theme_id}")
    return current_meta


async def apply_theme_service(pack_id: str, theme_id: str) -> dict:
    """Aplica y activa un tema en vivo para todas las escenas de OBS y el panel"""
    # Validar que el pack_id sea válido
    if not is_valid_pack_id(pack_id):
        raise ValueError(f"Pack ID inválido: {pack_id}")

    # Validar que el theme_id sea válido
    if not is_valid_theme_id(pack_id, theme_id):
        raise ValueError(f"Theme ID inválido: {theme_id}")

    state = load_theme_state()
    state["activePack"] = pack_id
    state["activeTheme"] = theme_id
    state["globalThemeActive"] = True
    save_theme_state(state)

    theme_file = get_theme_dir(pack_id, theme_id) / "theme.json"
    if theme_file.exists():
        try:
            with open(theme_file, "r", encoding="utf-8") as f:
                t_data = json.load(f)
            if t_data.get("chatAnchored", True):
                sync_chat_with_theme(t_data)
        except Exception as e:
            logger.warning(f"Error sincronizando chat con tema: {e}")

    archetype = infer_archetype(pack_id, theme_id)
    await system.broadcast({"type": "theme_change", "theme": theme_id, "pack": pack_id, "archetype": archetype})
    logger.info(f"🎨 Tema activado en vivo: {pack_id}/{theme_id} (arquetipo: {archetype})")
    return {"theme": theme_id, "pack": pack_id, "archetype": archetype}


async def apply_shape_service(shape_id: str) -> dict:
    """Aplica una forma física globalmente a todas las escenas de OBS y panel"""
    if not shape_id:
        shape_id = "original"
    clean = str(shape_id).strip()
    if not is_valid_shape_id(clean):
        raise ValueError(f"Forma física desconocida: {shape_id}")
    shape_id = clean
    state = load_theme_state()
    state["activeShape"] = shape_id
    save_theme_state(state)
    await system.broadcast({"type": "global_shape_change", "shape": shape_id})
    logger.info(f"📐 Forma física aplicada globalmente a todo el stream: {shape_id}")
    return {"shape": shape_id}


def toggle_chat_anchor_service(pack_id: str, theme_id: str, anchored: bool) -> dict:
    """Alterna el anclaje del chat al tema activo o activa un derivado personalizado."""
    if not is_valid_pack_id(pack_id) or not is_valid_theme_id(pack_id, theme_id):
        raise FileNotFoundError("Tema no encontrado")
    theme_file = get_theme_dir(pack_id, theme_id) / "theme.json"
    if not theme_file.exists():
        raise FileNotFoundError("Tema no encontrado")

    with open(theme_file, "r", encoding="utf-8") as f:
        t_data = json.load(f)

    t_data["chatAnchored"] = anchored

    if not anchored and not t_data.get("chatDerivative"):
        t_data["chatDerivative"] = {
            "name": f"Derivado de Chat ({t_data.get('name')})",
            "shape": "rounded",
            "bgOpacity": 92,
            "borderColor": t_data.get("accentOrange", "#FF783F"),
            "bgColor": t_data.get("bgDark", "#191D21"),
            "fontFamily": "outfit",
            "fontSize": 14,
            "customCSS": "/* CSS exclusivo para el chat de este tema */\n.chat-message-bubble {\n  border-left: 3px solid var(--color-accent-orange);\n}"
        }

    atomic_write_json(theme_file, t_data)

    if anchored:
        sync_chat_with_theme(t_data)

    logger.info(f"🔗 Estado de anclaje de chat para {theme_id}: {'Anclado' if anchored else 'Derivado'}")
    return {
        "anchored": anchored,
        "chatDerivative": t_data.get("chatDerivative")
    }


async def restore_theme_service(pack_id: str, theme_id: str) -> dict:
    """Restaura un tema modificado a su configuración y CSS original de fábrica"""
    # Validar que el pack_id sea válido
    if not is_valid_pack_id(pack_id):
        raise ValueError(f"Pack ID inválido: {pack_id}")

    # Validar que el theme_id sea válido
    if not is_valid_theme_id(pack_id, theme_id):
        raise ValueError(f"Theme ID inválido: {theme_id}")

    theme_dir = get_theme_dir(pack_id, theme_id)
    if not theme_dir.exists():
        raise FileNotFoundError("Tema no encontrado")

    default_meta = None
    default_css = None

    def_json = theme_dir / "theme.default.json"
    def_css = theme_dir / "style.default.css"
    if def_json.exists():
        try:
            with open(def_json, "r", encoding="utf-8") as f:
                default_meta = json.load(f)
        except Exception:
            pass
    if def_css.exists():
        try:
            default_css = def_css.read_text(encoding="utf-8")
        except Exception:
            pass

    if not default_meta or not default_css:
        for t in DEFAULT_THEMES_DATA:
            if t["id"] == theme_id and t.get("packId") == pack_id:
                default_meta = {k: v for k, v in t.items() if k != "css"}
                default_css = t.get("css", "")
                break

    if not default_meta:
        raise ValueError("No se encontraron valores originales para este tema")
    if not default_meta.get("archetype"):
        default_meta["archetype"] = _archetype_of_pack(pack_id)

    # Restaurar = regenerar desde la configuracion de fabrica. El CSS nunca se
    # copia a mano: `theme.default.json` es la fuente y `theme_render` lo emite.
    atomic_write_json(theme_dir / "theme.json", default_meta)
    restored_spec = theme_render.spec_from_meta(
        default_meta, pack_id=pack_id, theme_id=theme_id)
    restored_css = theme_render.render_theme_css(restored_spec)
    theme_render.atomic_write(theme_dir / "style.css", restored_css)
    default_css = restored_css

    sync_common_themes_css()

    state = load_theme_state()
    if state.get("activeTheme") == theme_id or theme_id in state.get("overlayThemes", {}).values():
        await system.broadcast({"type": "theme_change", "theme": theme_id, "pack": pack_id})

    logger.info(f"↺ Tema restaurado a su configuración original de fábrica: {pack_id}/{theme_id}")
    return {"theme": default_meta, "css": default_css}


async def set_overlay_theme_service(overlay_key: str, theme_id: str = None, shape_id: str = None) -> dict:
    """Asigna un tema visual (color) o forma física a una overlay o escena determinada"""
    if not overlay_key:
        raise ValueError("overlayKey requerido")
    if theme_id is None and shape_id is None:
        raise ValueError("themeId o shapeId requerido")

    # Normalizar/validar la clave de escena contra el catálogo único: se acepta
    # cualquier forma conocida (camelCase, kebab, snake o ruta de carpeta) y se
    # persiste SIEMPRE la clave canónica. Antes entraba cualquier cadena, lo que
    # dejó claves huérfanas en themes_state.json ("starting", "maker", "print")
    # que rompían la sincronización escena<->tema.
    raw_key = str(overlay_key).strip()
    comp = components_catalog.parse_key(raw_key)
    if comp:
        kind, comp_id = comp
        if not components_catalog.is_valid_component(kind, comp_id):
            raise ValueError(f"Componente desconocido: {raw_key}")
        overlay_key = f"{kind}:{comp_id}"
    else:
        canonical_key = is_valid_scene_key(raw_key) and normalize_scene_key(raw_key)
        if canonical_key:
            overlay_key = canonical_key
        else:
            # Nunca aceptar claves que no son escena ni componente: antes una
            # asignación sólo de forma devolvía 200 y se descartaba al guardar.
            raise ValueError(f"Escena desconocida: {overlay_key}")

    if theme_id and theme_id != "__clear__":
        if not is_valid_theme_id(None, theme_id):
            raise ValueError(f"Tema desconocido: {theme_id}")
    if shape_id is not None:
        clean = str(shape_id).strip()
        if clean and clean.lower() not in ("auto", "original", "__clear__", "none", "null"):
            if comp:
                if not components_catalog.is_valid_component_shape(comp[0], comp[1], clean):
                    raise ValueError(f"Forma no soportada por {overlay_key}: {shape_id}")
            elif not is_valid_shape_id(clean):
                raise ValueError(f"Forma física desconocida: {shape_id}")

    state = load_theme_state()
    overlay_themes = state.setdefault("overlayThemes", dict(DEFAULT_OVERLAY_THEMES))
    overlay_shapes = state.setdefault("overlayShapes", {})

    overlay_explicit = state.setdefault(
        "overlayThemeExplicit", derive_explicit_theme_map(state)
    )

    if theme_id == "__clear__":
        # «Heredar tema global»: se quita la asignación explícita para que el
        # componente vuelva a caer en el tema global (o en su aspecto base).
        overlay_themes.pop(overlay_key, None)
        overlay_explicit.pop(overlay_key, None)
    elif theme_id:
        overlay_themes[overlay_key] = theme_id
        overlay_explicit[overlay_key] = True
    if shape_id is not None:
        clean_shape = str(shape_id).strip()
        if comp:
            # En componentes "original" no es una forma física: equivale a quitar la forma.
            reset_shape = clean_shape.lower() in ("auto", "original", "__clear__", "", "null", "none")
        else:
            # En escenas "original" es una forma válida del pack; sólo "auto"/clear la quitan.
            reset_shape = clean_shape.lower() in ("auto", "__clear__", "", "null", "none")
        if reset_shape:
            overlay_shapes.pop(overlay_key, None)
        else:
            overlay_shapes[overlay_key] = clean_shape

    save_theme_state(state)

    assigned_theme = overlay_themes.get(overlay_key)
    assigned_shape = overlay_shapes.get(overlay_key)

    if assigned_shape and assigned_shape in SHAPE_TO_ARCHETYPE:
        archetype = SHAPE_TO_ARCHETYPE[assigned_shape]
    elif assigned_shape == "original":
        archetype = "original"
    else:
        archetype = infer_archetype("", assigned_theme or "")

    is_explicit = bool(overlay_explicit.get(overlay_key))
    await system.broadcast({
        "type": "overlay_theme_change",
        "overlayKey": overlay_key,
        "theme": assigned_theme,
        "shape": assigned_shape,
        "archetype": archetype,
        "explicit": is_explicit
    })

    # Evento dirigido para widgets/alertas: se aplican a sí mismos y no a todos.
    if comp:
        await system.broadcast({
            "type": "widget_theme_change" if comp[0] == "widget" else "alert_theme_change",
            "id": comp[1],
            "key": overlay_key,
            "theme": assigned_theme,
            "shape": assigned_shape,
            "archetype": archetype,
            "explicit": is_explicit,
        })

    logger.info(f"🎨 Asignación para '{overlay_key}': tema='{assigned_theme}', forma='{assigned_shape}', arquetipo='{archetype}'")
    return {
        "overlayKey": overlay_key,
        "themeId": overlay_themes.get(overlay_key),
        "shapeId": overlay_shapes.get(overlay_key),
        "overlayThemes": overlay_themes,
        "overlayShapes": overlay_shapes,
        "overlayThemeExplicit": overlay_explicit
    }


async def set_overlay_backdrop_service(overlay_key: str, backdrop: dict = None) -> dict:
    """Guarda y sincroniza la configuración de fondo con apertura/recortes para una escena"""
    if not overlay_key:
        raise ValueError("overlayKey requerido")

    state = load_theme_state()
    backdrops = state.setdefault("backdrops", {})

    if backdrop is None or (isinstance(backdrop, dict) and backdrop.get("mode") == "none"):
        backdrops.pop(overlay_key, None)
    else:
        backdrops[overlay_key] = backdrop

    save_theme_state(state)

    await system.broadcast({
        "type": "overlay_backdrop_change",
        "overlayKey": overlay_key,
        "backdrop": backdrop
    })

    logger.info(f"🖼️ Fondo/apertura actualizado para '{overlay_key}': {backdrop}")
    return {
        "overlayKey": overlay_key,
        "backdrop": backdrop,
        "backdrops": backdrops
    }



async def reset_overlay_assignment_service(overlay_key: str) -> dict:
    """Restaura la asignación de fábrica de una escena, widget o alerta.

    - Escena: vuelve al tema de `DEFAULT_OVERLAY_THEMES` y sin forma propia.
    - Widget/alerta: se elimina la clave y el componente recupera su aspecto propio.
    """
    raw_key = str(overlay_key or "").strip()
    if not raw_key:
        raise ValueError("overlayKey requerido")

    comp = components_catalog.parse_key(raw_key)
    if comp:
        if not components_catalog.is_valid_component(comp[0], comp[1]):
            raise ValueError(f"Componente desconocido: {raw_key}")
        key = f"{comp[0]}:{comp[1]}"
    else:
        key = (is_valid_scene_key(raw_key) and normalize_scene_key(raw_key)) or ""
        if not key:
            raise ValueError(f"Escena desconocida: {raw_key}")

    state = load_theme_state()
    overlay_themes = state.setdefault("overlayThemes", dict(DEFAULT_OVERLAY_THEMES))
    overlay_shapes = state.setdefault("overlayShapes", {})

    if comp:
        overlay_themes.pop(key, None)
        theme_value = None
    else:
        factory_theme = DEFAULT_OVERLAY_THEMES.get(key)
        if factory_theme:
            overlay_themes[key] = factory_theme
        else:
            overlay_themes.pop(key, None)
        theme_value = factory_theme
    overlay_shapes.pop(key, None)
    overlay_explicit = state.setdefault("overlayThemeExplicit", {})
    overlay_explicit.pop(key, None)

    save_theme_state(state)

    await system.broadcast({
        "type": "overlay_theme_change",
        "overlayKey": key,
        "theme": theme_value,
        "shape": None,
        "archetype": "original" if not comp else infer_archetype("", theme_value or ""),
        "explicit": False,
    })
    if comp:
        await system.broadcast({
            "type": "widget_theme_change" if comp[0] == "widget" else "alert_theme_change",
            "id": comp[1], "key": key, "theme": None, "shape": None,
            "explicit": False, "reset": True,
        })

    logger.info(f"↺ Asignación restaurada: {key}")
    return {"overlayKey": key, "themeId": theme_value, "shapeId": None,
            "overlayThemes": overlay_themes, "overlayShapes": overlay_shapes}
