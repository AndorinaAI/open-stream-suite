"""
server/services/theme_service.py — Lógica de negocio para packs de temas y estilos visuales
Encapsula la creación, guardado, restauración y aplicación de temas y anclaje de chat.
"""

import json
import re
from pathlib import Path
from server.config import BASE_DIR, logger
from server.state import system
from server.services.theme_defaults import (
    DEFAULT_PACK_TALLER,
    DEFAULT_THEMES_DATA,
    DEFAULT_OVERLAY_THEMES
)
from server.services.theme_manager import (
    STREAMTHEMES_DIR,
    get_pack_styles_dir,
    get_theme_dir,
    load_theme_state,
    save_theme_state,
    sync_common_themes_css,
    sync_chat_with_theme,
    infer_archetype
)


def create_pack_service(name: str, icon: str = "🎨", badge: str = "PACK PERSONALIZADO",
                        description: str = "Colección modular de temas y estilos personalizados.",
                        author: str = "Usuario") -> dict:
    """Crea una nueva carpeta de pack en streamthemes/<pack_id>/ con sus subcarpetas styles/ y overlays/"""
    name = str(name).strip()
    if not name:
        raise ValueError("Nombre del pack requerido")

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

    with open(pack_dir / "pack.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    logger.info(f"📁 Nuevo pack de temas creado: {pack_id}")
    return meta


def create_theme_service(body: dict) -> dict:
    """Crea un nuevo tema dentro de un pack específico"""
    pack_id = str(body.get("packId", "pack_open_stream_suite")).strip()
    theme_name = str(body.get("name", "")).strip()
    if not theme_name:
        raise ValueError("Nombre del tema requerido")

    theme_id = re.sub(r'[^a-zA-Z0-9_-]', '_', theme_name.lower().replace(' ', '_'))
    pack_dir = STREAMTHEMES_DIR / pack_id
    if not pack_dir.exists():
        raise FileNotFoundError("Pack de temas no encontrado")

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

    accent_cyan = body.get("accentCyan", "#57D6C4")
    accent_orange = body.get("accentOrange", "#FF783F")
    bg_dark = body.get("bgDark", "#191D21")
    text_light = body.get("textLight", "#F2EEE5")

    theme_meta = {
        "id": theme_id,
        "packId": pack_id,
        "name": theme_name,
        "badge": body.get("badge", theme_name.upper()),
        "accentCyan": accent_cyan,
        "accentOrange": accent_orange,
        "bgDark": bg_dark,
        "textLight": text_light,
        "panelBg": body.get("panelBg", "#2E363B"),
        "textDim": body.get("textDim", "#8B969C"),
        "fontPrimary": body.get("fontPrimary", "var(--font-primary)"),
        "fontTech": body.get("fontTech", "var(--font-tech)"),
        "glowIntensity": body.get("glowIntensity", 50),
        "borderStyle": body.get("borderStyle", "rounded"),
        "desc": body.get("desc", f"Tema {theme_name} en pack {pack_id}."),
        "chatAnchored": True,
        "chatDerivative": None
    }

    css_content = body.get("css", f"""body[data-theme="{theme_id}"] {{
  --color-bg-dark: {bg_dark};
  --color-text-light: {text_light};
  --color-accent-cyan: {accent_cyan};
  --color-accent-orange: {accent_orange};
  --color-panel-bg: {theme_meta['panelBg']};
  --color-text-dim: {theme_meta['textDim']};
  --color-border-cyan: {accent_cyan}66;
  --color-border-cyan-bright: {accent_cyan};
  --theme-glow: 0 0 16px {accent_cyan}88;
}}""")

    with open(theme_dir / "theme.json", "w", encoding="utf-8") as f:
        json.dump(theme_meta, f, indent=2, ensure_ascii=False)
    with open(theme_dir / "style.css", "w", encoding="utf-8") as f:
        f.write(css_content)

    sync_common_themes_css()
    logger.info(f"🎨 Nuevo tema creado: {pack_id}/{theme_id}")
    return theme_meta


async def save_theme_service(body: dict) -> dict:
    """Guarda las configuraciones y el código CSS modificado de un tema en disco"""
    pack_id = str(body.get("packId", "pack_open_stream_suite")).strip()
    theme_id = str(body.get("id", "")).strip()
    if not pack_id or not theme_id:
        raise ValueError("packId e id de tema requeridos")

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

    for k in ("name", "badge", "accentCyan", "accentOrange", "bgDark", "textLight",
              "panelBg", "textDim", "fontPrimary", "fontTech", "glowIntensity",
              "borderStyle", "desc", "chatAnchored", "chatDerivative"):
        if k in body:
            current_meta[k] = body[k]

    with open(t_json_file, "w", encoding="utf-8") as f:
        json.dump(current_meta, f, indent=2, ensure_ascii=False)

    if "css" in body:
        with open(theme_dir / "style.css", "w", encoding="utf-8") as f:
            f.write(str(body["css"]))

    sync_common_themes_css()

    state = load_theme_state()
    if state.get("activeTheme") == theme_id:
        await system.broadcast({"type": "theme_change", "theme": theme_id})

    logger.info(f"✓ Tema guardado con éxito: {pack_id}/{theme_id}")
    return current_meta


async def apply_theme_service(pack_id: str, theme_id: str) -> dict:
    """Aplica y activa un tema en vivo para todas las escenas de OBS y el panel"""
    if not theme_id:
        raise ValueError("Tema requerido")

    save_theme_state({"activePack": pack_id, "activeTheme": theme_id})

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
    save_theme_state({"activeShape": shape_id})
    await system.broadcast({"type": "global_shape_change", "shape": shape_id})
    logger.info(f"📐 Forma física aplicada globalmente a todo el stream: {shape_id}")
    return {"shape": shape_id}


def toggle_chat_anchor_service(pack_id: str, theme_id: str, anchored: bool) -> dict:
    """Alterna el anclaje del chat al tema activo o activa un derivado personalizado"""
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

    with open(theme_file, "w", encoding="utf-8") as f:
        json.dump(t_data, f, indent=2, ensure_ascii=False)

    if anchored:
        sync_chat_with_theme(t_data)

    logger.info(f"🔗 Estado de anclaje de chat para {theme_id}: {'Anclado' if anchored else 'Derivado'}")
    return {
        "anchored": anchored,
        "chatDerivative": t_data.get("chatDerivative")
    }


async def restore_theme_service(pack_id: str, theme_id: str) -> dict:
    """Restaura un tema modificado a su configuración y CSS original de fábrica"""
    if not pack_id or not theme_id:
        raise ValueError("packId y themeId requeridos")

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

    with open(theme_dir / "theme.json", "w", encoding="utf-8") as f:
        json.dump(default_meta, f, indent=2, ensure_ascii=False)

    with open(theme_dir / "style.css", "w", encoding="utf-8") as f:
        f.write(default_css or "")

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
    if not theme_id and not shape_id:
        raise ValueError("themeId o shapeId requerido")

    state = load_theme_state()
    overlay_themes = state.setdefault("overlayThemes", dict(DEFAULT_OVERLAY_THEMES))
    overlay_shapes = state.setdefault("overlayShapes", {})

    if theme_id:
        overlay_themes[overlay_key] = theme_id
    if shape_id is not None:
        if shape_id in ("auto", "__clear__", "", "null"):
            overlay_shapes.pop(overlay_key, None)
        else:
            overlay_shapes[overlay_key] = shape_id

    save_theme_state(state)

    assigned_theme = overlay_themes.get(overlay_key, theme_id)
    assigned_shape = overlay_shapes.get(overlay_key)
    archetype = assigned_shape if (assigned_shape and assigned_shape not in ("original", "auto")) else infer_archetype("", assigned_theme or "")

    await system.broadcast({
        "type": "overlay_theme_change",
        "overlayKey": overlay_key,
        "theme": assigned_theme,
        "shape": assigned_shape,
        "archetype": archetype
    })

    logger.info(f"🎨 Asignación para '{overlay_key}': tema='{assigned_theme}', forma='{assigned_shape}', arquetipo='{archetype}'")
    return {
        "overlayKey": overlay_key,
        "themeId": overlay_themes.get(overlay_key),
        "shapeId": overlay_shapes.get(overlay_key),
        "overlayThemes": overlay_themes,
        "overlayShapes": overlay_shapes
    }
