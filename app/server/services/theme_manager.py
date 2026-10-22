"""
server/theme_manager.py — Gestor de sistema de archivos y sincronización CSS para temas
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

STREAMTHEMES_DIR = BASE_DIR / "streamthemes"
THEMES_DIR = STREAMTHEMES_DIR
COMMON_THEMES_CSS = BASE_DIR / "common" / "themes.css"
CHAT_CONFIG_FILE = BASE_DIR / "widgets" / "chat" / "config.json"
THEMES_STATE_FILE = BASE_DIR / "themes_state.json"
RESERVED_PACK_DIRS = {"overlays", "common", "config.js", "__pycache__"}

def load_theme_state():
    state = {
        "activePack": "Maker_Theme_Pack",
        "activeTheme": "maker",
        "overlayThemes": dict(DEFAULT_OVERLAY_THEMES)
    }
    if THEMES_STATE_FILE.exists():
        try:
            with open(THEMES_STATE_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                state.update(loaded)
                current_ov = state.get("overlayThemes", {})
                for k, v in DEFAULT_OVERLAY_THEMES.items():
                    if k not in current_ov:
                        current_ov[k] = v
                state["overlayThemes"] = current_ov
                return state
        except Exception as e:
            logger.warning(f"Error leyendo themes_state.json: {e}")
    return state

def save_theme_state(state):
    try:
        with open(THEMES_STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"Error guardando themes_state.json: {e}")

def get_pack_styles_dir(pack_dir: Path) -> Path:
    """Devuelve el directorio que contiene los estilos de un pack (styles/ o el propio pack_dir)"""
    if (pack_dir / "styles").is_dir():
        return pack_dir / "styles"
    if (pack_dir / "themes").is_dir():
        return pack_dir / "themes"
    return pack_dir

def get_pack_overlays_dir(pack_dir: Path) -> Path:
    """Devuelve el directorio que contiene los overlays de un pack (overlays/)"""
    return pack_dir / "overlays"

def find_pack_dir(pack_id: str) -> Path:
    """Busca la carpeta física del pack admitiendo mayúsculas/minúsculas y alias históricos"""
    exact = STREAMTHEMES_DIR / pack_id
    if exact.exists():
        return exact
    clean_id = pack_id.lower().replace("pack_", "").replace("_suite", "").replace("_pack", "")
    for d in STREAMTHEMES_DIR.iterdir():
        if not d.is_dir():
            continue
        d_clean = d.name.lower().replace("pack_", "").replace("_suite", "").replace("_pack", "")
        if d.name.lower() == pack_id.lower() or d_clean == clean_id:
            return d
    return exact

def get_theme_dir(pack_id: str, theme_id: str) -> Path:
    """Resuelve la ruta física del tema dentro de un pack, buscando en styles/ o en la raíz del pack"""
    pack_dir = find_pack_dir(pack_id)
    if (pack_dir / "styles" / theme_id).exists():
        return pack_dir / "styles" / theme_id
    if (pack_dir / "themes" / theme_id).exists():
        return pack_dir / "themes" / theme_id
    if (pack_dir / theme_id).exists() and theme_id not in RESERVED_PACK_DIRS:
        return pack_dir / theme_id
    if (pack_dir / "styles").is_dir() or not pack_dir.exists():
        return pack_dir / "styles" / theme_id
    return pack_dir / theme_id

def init_themes_directory():
    """Inicializa la estructura modular de streamthemes/Open_stream_pack/ si no existe"""
    STREAMTHEMES_DIR.mkdir(parents=True, exist_ok=True)

    # Pack Maker & Taller oficial
    pack_taller_dir = find_pack_dir("Maker_Theme_Pack")
    pack_taller_dir.mkdir(parents=True, exist_ok=True)
    styles_dir = pack_taller_dir / "styles"
    overlays_dir = pack_taller_dir / "overlays"
    styles_dir.mkdir(parents=True, exist_ok=True)
    overlays_dir.mkdir(parents=True, exist_ok=True)

    if not (pack_taller_dir / "pack.json").exists():
        with open(pack_taller_dir / "pack.json", "w", encoding="utf-8") as f:
            json.dump(DEFAULT_PACK_TALLER, f, indent=2, ensure_ascii=False)

    for t in DEFAULT_THEMES_DATA:
        t_id = t["id"]
        t_dir = styles_dir / t_id
        t_dir.mkdir(parents=True, exist_ok=True)

        t_json = t_dir / "theme.json"
        t_css = t_dir / "style.css"
        def_json = t_dir / "theme.default.json"
        def_css = t_dir / "style.default.css"

        payload_meta = {k: v for k, v in t.items() if k != "css"}
        if not t_json.exists():
            with open(t_json, "w", encoding="utf-8") as f:
                json.dump(payload_meta, f, indent=2, ensure_ascii=False)
        if not t_css.exists():
            with open(t_css, "w", encoding="utf-8") as f:
                f.write(t["css"])
        if not def_json.exists():
            with open(def_json, "w", encoding="utf-8") as f:
                json.dump(payload_meta, f, indent=2, ensure_ascii=False)
        if not def_css.exists():
            with open(def_css, "w", encoding="utf-8") as f:
                f.write(t["css"])

    # Sincronizar common/themes.css
    sync_common_themes_css()

def sync_common_themes_css():
    """Compila y sincroniza todos los style.css de todos los packs en common/themes.css"""
    try:
        css_blocks = [
            "/* ====================================================================",
            "   OPEN STREAM SUITE — CSS UNIFICADO DE TEMAS Y PACKS MODULARES",
            "   Generado automáticamente a partir de streamthemes/<pack>/styles/<theme>/style.css",
            "   ==================================================================== */\n"
        ]

        for pack_dir in sorted(STREAMTHEMES_DIR.iterdir()):
            if not pack_dir.is_dir():
                continue
            styles_dir = get_pack_styles_dir(pack_dir)
            if not styles_dir.is_dir():
                continue
            for theme_dir in sorted(styles_dir.iterdir()):
                if not theme_dir.is_dir() or theme_dir.name in RESERVED_PACK_DIRS:
                    continue
                css_file = theme_dir / "style.css"
                if css_file.exists():
                    raw_css = css_file.read_text(encoding="utf-8").strip()
                    clean_css = re.sub(r':root\s*,\s*', '', raw_css)
                    css_blocks.append(f"/* Pack: {pack_dir.name} | Tema: {theme_dir.name} */")
                    css_blocks.append(clean_css)
                    css_blocks.append("")

        COMMON_THEMES_CSS.parent.mkdir(parents=True, exist_ok=True)
        COMMON_THEMES_CSS.write_text("\n".join(css_blocks), encoding="utf-8")
        logger.info("✓ common/themes.css sincronizado correctamente")
    except Exception as e:
        logger.warning(f"Error sincronizando common/themes.css: {e}")

def get_all_packs_and_themes():
    """Escanea el directorio streamthemes/ y devuelve los packs con sus temas, overlays y metadatos"""
    init_themes_directory()
    packs = []
    state = load_theme_state()
    active_theme = state.get("activeTheme", "maker")
    active_pack = state.get("activePack", "Open_stream_Pack")

    def infer_archetype(pack_id: str, theme_id: str = "") -> str:
        combined = f"{pack_id} {theme_id}".lower()
        if any(k in combined for k in ["cozy", "lofi", "chill", "latte", "matcha", "sakura", "lavender", "nordic", "kawaii"]):
            return "cozy"
        if any(k in combined for k in ["gamer", "esport", "cyber", "toxic", "glory", "stealth", "arcade", "matrix"]):
            return "gamer"
        if any(k in combined for k in ["maker", "terminal", "print", "blueprint", "circuit", "taller", "workbench"]):
            return "maker"
        return "openstream"

    for pack_dir in sorted(STREAMTHEMES_DIR.iterdir()):
        if not pack_dir.is_dir():
            continue

        pack_json_file = pack_dir / "pack.json"
        if pack_json_file.exists():
            try:
                with open(pack_json_file, "r", encoding="utf-8") as f:
                    pack_meta = json.load(f)
            except Exception:
                pack_meta = {"id": pack_dir.name, "name": pack_dir.name}
        else:
            pack_meta = {"id": pack_dir.name, "name": pack_dir.name}

        pack_archetype = pack_meta.get("archetype") or infer_archetype(pack_dir.name)
        pack_meta["archetype"] = pack_archetype

        # 1. Escanear estilos/temas del pack
        styles_dir = get_pack_styles_dir(pack_dir)
        themes = []
        if styles_dir.is_dir():
            for theme_dir in sorted(styles_dir.iterdir()):
                if not theme_dir.is_dir() or theme_dir.name in RESERVED_PACK_DIRS:
                    continue
                t_json_file = theme_dir / "theme.json"
                t_css_file = theme_dir / "style.css"

                theme_data = {
                    "id": theme_dir.name,
                    "name": theme_dir.name,
                    "packId": pack_dir.name,
                    "archetype": pack_archetype
                }
                if t_json_file.exists():
                    try:
                        with open(t_json_file, "r", encoding="utf-8") as f:
                            theme_data.update(json.load(f))
                    except Exception:
                        pass

                if not theme_data.get("archetype"):
                    theme_data["archetype"] = infer_archetype(pack_dir.name, theme_dir.name)

                theme_data["css"] = t_css_file.read_text(encoding="utf-8") if t_css_file.exists() else ""
                theme_data["isActive"] = (theme_data["id"] == active_theme)
                themes.append(theme_data)

        # 2. Escanear overlays del pack
        overlays = []
        overlays_dir = get_pack_overlays_dir(pack_dir)
        if overlays_dir.is_dir():
            for ov_entry in sorted(overlays_dir.rglob("index.html")):
                rel_path = ov_entry.relative_to(overlays_dir)
                overlays.append({
                    "path": f"/streamthemes/{pack_dir.name}/overlays/{rel_path}",
                    "relPath": str(rel_path),
                    "name": rel_path.parent.name if rel_path.parent != Path(".") else rel_path.stem
                })

        pack_meta["themes"] = themes
        pack_meta["themesCount"] = len(themes)
        pack_meta["overlays"] = overlays
        pack_meta["overlaysCount"] = len(overlays)
        pack_meta["isActivePack"] = (pack_meta.get("id") == active_pack)
        packs.append(pack_meta)

    return {
        "packs": packs,
        "activePack": active_pack,
        "activeTheme": active_theme,
        "overlayThemes": state.get("overlayThemes", dict(DEFAULT_OVERLAY_THEMES)),
        "overlayShapes": state.get("overlayShapes", {})
    }

# ====================================================================
# CONTROLADORES DE RUTA (API)
# ====================================================================



def sync_chat_with_theme(theme_data):
    """Sincroniza el widget de chat con las variables del tema cuando está anclado"""
    if not CHAT_CONFIG_FILE.exists():
        return
    try:
        with open(CHAT_CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        styles = cfg.setdefault("styles", {})
        styles["borderColor"] = theme_data.get("accentCyan", "#57D6C4")
        styles["bgColor"] = theme_data.get("bgDark", "#191D21")
        styles["glowIntensity"] = theme_data.get("glowIntensity", 50)

        with open(CHAT_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)
        logger.info(f"🔗 Estilo de chat anclado sincronizado con tema: {theme_data.get('id')}")
    except Exception as e:
        logger.warning(f"Error en sync_chat_with_theme: {e}")


