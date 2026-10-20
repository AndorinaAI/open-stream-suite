import json
import re
from pathlib import Path
from aiohttp import web
from server.config import BASE_DIR, logger
from server.state import system

STREAMTHEMES_DIR = BASE_DIR / "streamthemes"
THEMES_DIR = STREAMTHEMES_DIR  # Compatibilidad con imports existentes
COMMON_THEMES_CSS = BASE_DIR / "common" / "themes.css"
CHAT_CONFIG_FILE = BASE_DIR / "widgets" / "chat" / "config.json"
THEMES_STATE_FILE = BASE_DIR / "themes_state.json"
RESERVED_PACK_DIRS = {"overlays", "common", "config.js", "__pycache__"}

DEFAULT_PACK_TALLER = {
    "id": "Open_stream_Pack",
    "name": "Pack Open Stream Suite",
    "icon": "🛠️",
    "badge": "PACK OFICIAL (6 TEMAS)",
    "description": "El pack oficial modular de Open Stream Suite con los 6 estilos base: Maker, Print, Terminal, Chill, Cyberpunk y Synthwave.",
    "version": "1.0.0",
    "author": "Open Stream Suite"
}

DEFAULT_THEMES_DATA = [
    {
        "id": "maker",
        "packId": "Open_stream_Pack",
        "name": "Maker Electrónico",
        "badge": "01 // MAKER",
        "accentCyan": "#57D6C4",
        "accentOrange": "#FF783F",
        "bgDark": "#191D21",
        "textLight": "#F2EEE5",
        "panelBg": "#2E363B",
        "textDim": "#8B969C",
        "fontPrimary": "var(--font-primary)",
        "fontTech": "var(--font-tech)",
        "glowIntensity": 60,
        "borderStyle": "rounded",
        "desc": "Turquesa electrónico sobre grafito oscuro. El tono insignia del banco de pruebas y circuitos.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="maker"] {
  --color-bg-dark: #191D21;
  --color-text-light: #F2EEE5;
  --color-accent-cyan: #57D6C4;
  --color-accent-orange: #FF783F;
  --color-panel-bg: #2E363B;
  --color-text-dim: #8B969C;
  --color-border-cyan: rgba(87, 214, 196, 0.35);
  --color-border-cyan-bright: #57D6C4;
  --theme-glow: 0 0 16px rgba(87, 214, 196, 0.5);
}"""
    },
    {
        "id": "print",
        "packId": "Open_stream_Pack",
        "name": "Print & Vinilo",
        "badge": "02 // PRINT",
        "accentCyan": "#FF783F",
        "accentOrange": "#FF9B42",
        "bgDark": "#1E1B18",
        "textLight": "#F7EFE6",
        "panelBg": "#332B25",
        "textDim": "#9E9289",
        "fontPrimary": "var(--font-primary)",
        "fontTech": "var(--font-tech)",
        "glowIntensity": 50,
        "borderStyle": "chamfer",
        "desc": "Naranja de taller sobre carbón. Inspirado en corte, sublimación e impresión.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="print"] {
  --color-bg-dark: #1E1B18;
  --color-text-light: #F7EFE6;
  --color-accent-cyan: #FF783F;
  --color-accent-orange: #FF9B42;
  --color-panel-bg: #332B25;
  --color-text-dim: #9E9289;
  --color-border-cyan: rgba(255, 120, 63, 0.4);
  --color-border-cyan-bright: #FF783F;
  --theme-glow: 0 0 16px rgba(255, 120, 63, 0.5);
}"""
    },
    {
        "id": "terminal",
        "packId": "Open_stream_Pack",
        "name": "Retro Terminal",
        "badge": "03 // TERMINAL",
        "accentCyan": "#22C55E",
        "accentOrange": "#EAB308",
        "bgDark": "#0A0C0E",
        "textLight": "#4ADE80",
        "panelBg": "#141A16",
        "textDim": "#166534",
        "fontPrimary": "var(--font-tech)",
        "fontTech": "var(--font-tech)",
        "glowIntensity": 70,
        "borderStyle": "square",
        "desc": "Verde fósforo CRT Matrix sobre negro puro para programación y Linux.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="terminal"] {
  --color-bg-dark: #0A0C0E;
  --color-text-light: #4ADE80;
  --color-accent-cyan: #22C55E;
  --color-accent-orange: #EAB308;
  --color-panel-bg: #141A16;
  --color-text-dim: #166534;
  --color-border-cyan: rgba(34, 197, 94, 0.4);
  --color-border-cyan-bright: #22C55E;
  --font-primary: var(--font-tech);
  --theme-glow: 0 0 18px rgba(34, 197, 94, 0.6);
}"""
    },
    {
        "id": "chill",
        "packId": "Open_stream_Pack",
        "name": "Chill Lavender",
        "badge": "04 // CHILL",
        "accentCyan": "#89B4FA",
        "accentOrange": "#CBA6F7",
        "bgDark": "#181825",
        "textLight": "#CDD6F4",
        "panelBg": "#313244",
        "textDim": "#A6ADC8",
        "fontPrimary": "var(--font-primary)",
        "fontTech": "var(--font-tech)",
        "glowIntensity": 40,
        "borderStyle": "rounded",
        "desc": "Azul noche pastel y acentos violetas suaves. Ideal para charla y relax.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="chill"] {
  --color-bg-dark: #181825;
  --color-text-light: #CDD6F4;
  --color-accent-cyan: #89B4FA;
  --color-accent-orange: #CBA6F7;
  --color-panel-bg: #313244;
  --color-text-dim: #A6ADC8;
  --color-border-cyan: rgba(137, 180, 250, 0.4);
  --color-border-cyan-bright: #89B4FA;
  --theme-glow: 0 0 14px rgba(137, 180, 250, 0.4);
}"""
    },
    {
        "id": "cyberpunk",
        "packId": "Open_stream_Pack",
        "name": "Cyberpunk Industrial",
        "badge": "05 // CYBERPUNK",
        "accentCyan": "#FFE600",
        "accentOrange": "#FF0055",
        "bgDark": "#0F0F14",
        "textLight": "#F8F9FA",
        "panelBg": "#1B1A24",
        "textDim": "#928DA3",
        "fontPrimary": "var(--font-tech)",
        "fontTech": "var(--font-tech)",
        "glowIntensity": 85,
        "borderStyle": "chamfer",
        "desc": "Amarillo neón industrial y fucsia eléctrico. Alto contraste y máxima energía.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="cyberpunk"] {
  --color-bg-dark: #0F0F14;
  --color-text-light: #F8F9FA;
  --color-accent-cyan: #FFE600;
  --color-accent-orange: #FF0055;
  --color-panel-bg: #1B1A24;
  --color-text-dim: #928DA3;
  --color-border-cyan: rgba(255, 230, 0, 0.45);
  --color-border-cyan-bright: #FFE600;
  --theme-glow: 0 0 20px rgba(255, 230, 0, 0.7);
}"""
    },
    {
        "id": "synthwave",
        "packId": "Open_stream_Pack",
        "name": "Synthwave Retro",
        "badge": "06 // SYNTHWAVE",
        "accentCyan": "#00F9FF",
        "accentOrange": "#FF2A85",
        "bgDark": "#1A1028",
        "textLight": "#FCE7F3",
        "panelBg": "#2B1A42",
        "textDim": "#C084FC",
        "fontPrimary": "var(--font-primary)",
        "fontTech": "var(--font-tech)",
        "glowIntensity": 80,
        "borderStyle": "rounded",
        "desc": "Rosa neón 80s con cian láser sobre fondo purpúreo. Atmósfera arcade.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="synthwave"] {
  --color-bg-dark: #1A1028;
  --color-text-light: #FCE7F3;
  --color-accent-cyan: #00F9FF;
  --color-accent-orange: #FF2A85;
  --color-panel-bg: #2B1A42;
  --color-text-dim: #C084FC;
  --color-border-cyan: rgba(0, 249, 255, 0.45);
  --color-border-cyan-bright: #00F9FF;
  --theme-glow: 0 0 18px rgba(255, 42, 133, 0.6);
}"""
    }
]

DEFAULT_OVERLAY_THEMES = {
    "game": "cyberpunk",
    "maker": "maker",
    "maker-desk": "maker",
    "maker-pc": "terminal",
    "print": "print",
    "print-machine": "print",
    "print-design": "print",
    "chill": "chill",
    "startingSoon": "synthwave",
    "beRightBack": "synthwave",
    "ending": "synthwave"
}

def load_theme_state():
    state = {
        "activePack": "Open_stream_Pack",
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

    # Pack Open Stream Suite oficial
    pack_taller_dir = find_pack_dir("Open_stream_Pack")
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

        # 1. Escanear estilos/temas del pack
        styles_dir = get_pack_styles_dir(pack_dir)
        themes = []
        if styles_dir.is_dir():
            for theme_dir in sorted(styles_dir.iterdir()):
                if not theme_dir.is_dir() or theme_dir.name in RESERVED_PACK_DIRS:
                    continue
                t_json_file = theme_dir / "theme.json"
                t_css_file = theme_dir / "style.css"

                theme_data = {"id": theme_dir.name, "name": theme_dir.name, "packId": pack_dir.name}
                if t_json_file.exists():
                    try:
                        with open(t_json_file, "r", encoding="utf-8") as f:
                            theme_data.update(json.load(f))
                    except Exception:
                        pass

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
        "overlayThemes": state.get("overlayThemes", dict(DEFAULT_OVERLAY_THEMES))
    }

# ====================================================================
# CONTROLADORES DE RUTA (API)
# ====================================================================

async def handle_get_theme_packs(request):
    """Devuelve todos los packs de temas y sus contenidos modularizados"""
    data = get_all_packs_and_themes()
    return web.json_response({"status": "ok", **data})

async def handle_create_pack(request):
    """Crea una nueva carpeta de pack en streamthemes/<pack_id>/ con sus subcarpetas styles/ y overlays/"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    name = str(body.get("name", "")).strip()
    if not name:
        return web.json_response({"error": "Nombre del pack requerido"}, status=400)

    # Generar ID seguro
    pack_id = re.sub(r'[^a-zA-Z0-9_-]', '_', name.lower().replace(' ', '_'))
    if not pack_id.startswith("pack_"):
        pack_id = f"pack_{pack_id}"

    pack_dir = STREAMTHEMES_DIR / pack_id
    if pack_dir.exists():
        return web.json_response({"error": "Ya existe un pack con ese identificador"}, status=409)

    pack_dir.mkdir(parents=True, exist_ok=True)
    (pack_dir / "styles").mkdir(parents=True, exist_ok=True)
    (pack_dir / "overlays").mkdir(parents=True, exist_ok=True)

    meta = {
        "id": pack_id,
        "name": name,
        "icon": body.get("icon", "🎨"),
        "badge": body.get("badge", "PACK PERSONALIZADO"),
        "description": body.get("description", "Colección modular de temas y estilos personalizados."),
        "version": "1.0.0",
        "author": body.get("author", "Usuario")
    }

    with open(pack_dir / "pack.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    logger.info(f"📁 Nuevo pack de temas creado: {pack_id}")
    return web.json_response({"status": "ok", "pack": meta})

async def handle_create_theme(request):
    """Crea un nuevo tema dentro de un pack específico"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    pack_id = str(body.get("packId", "pack_open_stream_suite")).strip()
    theme_name = str(body.get("name", "")).strip()
    if not theme_name:
        return web.json_response({"error": "Nombre del tema requerido"}, status=400)

    theme_id = re.sub(r'[^a-zA-Z0-9_-]', '_', theme_name.lower().replace(' ', '_'))
    pack_dir = STREAMTHEMES_DIR / pack_id
    if not pack_dir.exists():
        return web.json_response({"error": "Pack de temas no encontrado"}, status=404)

    styles_dir = get_pack_styles_dir(pack_dir)
    styles_dir.mkdir(parents=True, exist_ok=True)
    theme_dir = styles_dir / theme_id
    if theme_dir.exists() or (pack_dir / theme_id).exists():
        return web.json_response({"error": "Ya existe un tema con ese nombre en este pack"}, status=409)

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
    return web.json_response({"status": "ok", "theme": theme_meta})

async def handle_save_theme(request):
    """Guarda las configuraciones y el código CSS modificado de un tema en disco"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    pack_id = str(body.get("packId", "pack_open_stream_suite")).strip()
    theme_id = str(body.get("id", "")).strip()
    if not pack_id or not theme_id:
        return web.json_response({"error": "packId e id de tema requeridos"}, status=400)

    theme_dir = get_theme_dir(pack_id, theme_id)
    if not theme_dir.exists():
        return web.json_response({"error": "Directorio de tema no encontrado"}, status=404)

    # Actualizar theme.json
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

    # Actualizar style.css si viene en el payload
    if "css" in body:
        with open(theme_dir / "style.css", "w", encoding="utf-8") as f:
            f.write(str(body["css"]))

    sync_common_themes_css()

    # Si es el tema activo, emitir actualización a OBS
    state = load_theme_state()
    if state.get("activeTheme") == theme_id:
        await system.broadcast({"type": "theme_change", "theme": theme_id})

    logger.info(f"✓ Tema guardado con éxito: {pack_id}/{theme_id}")
    return web.json_response({"status": "ok", "theme": current_meta})

async def handle_apply_theme(request):
    """Aplica y activa un tema en vivo para todas las escenas de OBS y el panel"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    theme_id = str(body.get("theme", "")).strip()
    pack_id = str(body.get("pack", "pack_open_stream_suite")).strip()

    if not theme_id:
        return web.json_response({"error": "Tema requerido"}, status=400)

    save_theme_state({"activePack": pack_id, "activeTheme": theme_id})

    # Si el chat está anclado a este tema, sincronizar estilos de chat
    theme_file = get_theme_dir(pack_id, theme_id) / "theme.json"
    if theme_file.exists():
        try:
            with open(theme_file, "r", encoding="utf-8") as f:
                t_data = json.load(f)
            if t_data.get("chatAnchored", True):
                sync_chat_with_theme(t_data)
        except Exception as e:
            logger.warning(f"Error sincronizando chat con tema: {e}")

    await system.broadcast({"type": "theme_change", "theme": theme_id, "pack": pack_id})
    logger.info(f"🎨 Tema activado en vivo: {pack_id}/{theme_id}")
    return web.json_response({"status": "ok", "theme": theme_id, "pack": pack_id})

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

async def handle_chat_anchor_toggle(request):
    """Alterna el anclaje del chat al tema activo o activa un derivado personalizado"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    pack_id = str(body.get("packId", "pack_open_stream_suite")).strip()
    theme_id = str(body.get("themeId", "")).strip()
    anchored = bool(body.get("anchored", True))

    theme_file = get_theme_dir(pack_id, theme_id) / "theme.json"
    if not theme_file.exists():
        return web.json_response({"error": "Tema no encontrado"}, status=404)

    with open(theme_file, "r", encoding="utf-8") as f:
        t_data = json.load(f)

    t_data["chatAnchored"] = anchored

    # Si se desancla para hacer un derivado y no tiene derivado previo, inicializarlo
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
    return web.json_response({
        "status": "ok",
        "anchored": anchored,
        "chatDerivative": t_data.get("chatDerivative")
    })

async def handle_restore_theme(request):
    """Restaura un tema modificado a su configuración y CSS original de fábrica"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    pack_id = str(body.get("packId", "pack_open_stream_suite")).strip()
    theme_id = str(body.get("themeId", "")).strip()

    if not pack_id or not theme_id:
        return web.json_response({"error": "packId y themeId requeridos"}, status=400)

    theme_dir = get_theme_dir(pack_id, theme_id)
    if not theme_dir.exists():
        return web.json_response({"error": "Tema no encontrado"}, status=404)

    default_meta = None
    default_css = None

    # 1. Comprobar copia default guardada en disco
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

    # 2. Fallback con presets integrados si no hubiera archivos default
    if not default_meta or not default_css:
        for t in DEFAULT_THEMES_DATA + DEFAULT_ARCADE_THEMES:
            if t["id"] == theme_id and t.get("packId") == pack_id:
                default_meta = {k: v for k, v in t.items() if k != "css"}
                default_css = t.get("css", "")
                break

    if not default_meta:
        return web.json_response({"error": "No se encontraron valores originales para este tema"}, status=404)

    # Sobrescribir theme.json y style.css con los valores de fábrica
    with open(theme_dir / "theme.json", "w", encoding="utf-8") as f:
        json.dump(default_meta, f, indent=2, ensure_ascii=False)

    with open(theme_dir / "style.css", "w", encoding="utf-8") as f:
        f.write(default_css or "")

    sync_common_themes_css()

    state = load_theme_state()
    if state.get("activeTheme") == theme_id or theme_id in state.get("overlayThemes", {}).values():
        await system.broadcast({"type": "theme_change", "theme": theme_id, "pack": pack_id})

    logger.info(f"↺ Tema restaurado a su configuración original de fábrica: {pack_id}/{theme_id}")
    return web.json_response({"status": "ok", "theme": default_meta, "css": default_css})

async def handle_set_overlay_theme(request):
    """Asigna un tema visual específico a una overlay o escena de OBS determinada"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    overlay_key = str(body.get("overlayKey", "")).strip()
    theme_id = str(body.get("themeId", "")).strip()

    if not overlay_key or not theme_id:
        return web.json_response({"error": "overlayKey y themeId requeridos"}, status=400)

    state = load_theme_state()
    overlay_themes = state.setdefault("overlayThemes", dict(DEFAULT_OVERLAY_THEMES))
    overlay_themes[overlay_key] = theme_id
    save_theme_state(state)

    await system.broadcast({
        "type": "overlay_theme_change",
        "overlayKey": overlay_key,
        "theme": theme_id
    })

    logger.info(f"🎨 Estilo '{theme_id}' asignado específicamente a overlay '{overlay_key}'")
    return web.json_response({
        "status": "ok",
        "overlayKey": overlay_key,
        "themeId": theme_id,
        "overlayThemes": overlay_themes
    })

def register_themes_routes(app):
    """Registra todas las rutas para la gestión modular de temas y packs"""
    init_themes_directory()
    app.router.add_get("/api/themes/packs", handle_get_theme_packs)
    app.router.add_post("/api/themes/packs/create", handle_create_pack)
    app.router.add_post("/api/themes/create", handle_create_theme)
    app.router.add_post("/api/themes/save", handle_save_theme)
    app.router.add_post("/api/themes/restore", handle_restore_theme)
    app.router.add_post("/api/themes/overlay-assignment", handle_set_overlay_theme)
    app.router.add_post("/api/themes/apply", handle_apply_theme)
    app.router.add_post("/api/themes/chat-anchor", handle_chat_anchor_toggle)
