import json
import re
from pathlib import Path
from aiohttp import web
from server.config import BASE_DIR, logger
from server.state import system

THEMES_DIR = BASE_DIR / "themes"
COMMON_THEMES_CSS = BASE_DIR / "common" / "themes.css"
CHAT_CONFIG_FILE = BASE_DIR / "widgets" / "chat" / "config.json"
THEMES_STATE_FILE = BASE_DIR / "themes_state.json"

DEFAULT_PACK_TALLER = {
    "id": "pack_open_stream_suite",
    "name": "Pack Open Stream Suite & Streamer",
    "icon": "🛠️",
    "badge": "PACK OFICIAL (6 TEMAS)",
    "description": "El pack oficial modular de Open Stream Suite con los 6 estilos base: Maker, Print, Terminal, Chill, Cyberpunk y Synthwave.",
    "version": "1.0.0",
    "author": "Open Stream Suite"
}

DEFAULT_THEMES_DATA = [
    {
        "id": "maker",
        "packId": "pack_open_stream_suite",
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
        "css": """:root,
body[data-theme="maker"] {
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
        "packId": "pack_open_stream_suite",
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
        "packId": "pack_open_stream_suite",
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
        "packId": "pack_open_stream_suite",
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
        "packId": "pack_open_stream_suite",
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
        "packId": "pack_open_stream_suite",
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

DEFAULT_PACK_ARCADE = {
    "id": "pack_retro_arcade",
    "name": "Pack Retro Arcade & Neon Vibe",
    "icon": "🕹️",
    "badge": "PACK COMUNIDAD",
    "description": "Pack con estética de salones recreativos clásicos, scanlines CRT y luces de neón nocturnas.",
    "version": "1.0.0",
    "author": "Open Stream Suite"
}

DEFAULT_ARCADE_THEMES = [
    {
        "id": "arcade_8bit",
        "packId": "pack_retro_arcade",
        "name": "8-Bit Arcade Cabinet",
        "badge": "01 // ARCADE",
        "accentCyan": "#38BDF8",
        "accentOrange": "#F43F5E",
        "bgDark": "#0B0E14",
        "textLight": "#FFFFFF",
        "panelBg": "#161B22",
        "textDim": "#64748B",
        "fontPrimary": "monospace",
        "fontTech": "monospace",
        "glowIntensity": 35,
        "borderStyle": "square",
        "desc": "Bordes gruesos pixelados y paleta de recreativa clásica de monedas.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="arcade_8bit"] {
  --color-bg-dark: #0B0E14;
  --color-text-light: #FFFFFF;
  --color-accent-cyan: #38BDF8;
  --color-accent-orange: #F43F5E;
  --color-panel-bg: #161B22;
  --color-text-dim: #64748B;
  --color-border-cyan: rgba(56, 189, 248, 0.4);
  --color-border-cyan-bright: #38BDF8;
  --theme-glow: 0 0 10px rgba(56, 189, 248, 0.5);
}"""
    },
    {
        "id": "vapor_sunset",
        "packId": "pack_retro_arcade",
        "name": "Vapor Sunset Glitch",
        "badge": "02 // VAPOR",
        "accentCyan": "#A855F7",
        "accentOrange": "#EC4899",
        "bgDark": "#0D0B18",
        "textLight": "#FAF5FF",
        "panelBg": "#1E1833",
        "textDim": "#9333EA",
        "fontPrimary": "var(--font-primary)",
        "fontTech": "var(--font-tech)",
        "glowIntensity": 75,
        "borderStyle": "rounded",
        "desc": "Degradados magenta y violeta atardecer con resplandor neón difuso.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="vapor_sunset"] {
  --color-bg-dark: #0D0B18;
  --color-text-light: #FAF5FF;
  --color-accent-cyan: #A855F7;
  --color-accent-orange: #EC4899;
  --color-panel-bg: #1E1833;
  --color-text-dim: #9333EA;
  --color-border-cyan: rgba(168, 85, 247, 0.45);
  --color-border-cyan-bright: #A855F7;
  --theme-glow: 0 0 18px rgba(236, 72, 153, 0.6);
}"""
    }
]

DEFAULT_PACK_MANGA = {
    "id": "pack_manga_ink",
    "name": "Pack Manga & Tinta Japonesa",
    "icon": "🖋️",
    "badge": "PACK MANGA & CÓMIC",
    "description": "Estilo cómic shōnen y novela gráfica: alto contraste blanco/negro, tinta china, viñetas y acento carmesí de sello hanko.",
    "version": "1.0.0",
    "author": "Open Stream Suite"
}

DEFAULT_MANGA_THEMES = [
    {
        "id": "manga_shonen",
        "packId": "pack_manga_ink",
        "name": "Manga Shōnen (Tinta & Papel)",
        "badge": "01 // SHONEN",
        "accentCyan": "#111116",
        "accentOrange": "#E6282B",
        "bgDark": "#F4EFEA",
        "textLight": "#111116",
        "panelBg": "rgba(255, 255, 255, 0.95)",
        "textDim": "#555562",
        "fontPrimary": "'Impact', 'Inter', sans-serif",
        "fontTech": "'Courier New', monospace",
        "glowIntensity": 15,
        "borderStyle": "square",
        "desc": "Estilo viñeta de manga impreso: papel marfil, trazos de tinta china pura y sello hanko rojo cinético.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="manga_shonen"] {
  --color-bg-dark: #F4EFEA;
  --color-text-light: #111116;
  --color-accent-cyan: #111116;
  --color-accent-orange: #E6282B;
  --color-panel-bg: rgba(255, 255, 255, 0.95);
  --color-text-dim: #555562;
  --color-border-cyan: rgba(17, 17, 22, 0.85);
  --color-border-cyan-bright: #111116;
  --theme-glow: 0 0 0 rgba(0, 0, 0, 0);
}"""
    },
    {
        "id": "manga_dark_ink",
        "packId": "pack_manga_ink",
        "name": "Manga Dark Ink (Seinen Noir)",
        "badge": "02 // NOIR",
        "accentCyan": "#FFFFFF",
        "accentOrange": "#FF3344",
        "bgDark": "#0D0D11",
        "textLight": "#F5F5FA",
        "panelBg": "#181820",
        "textDim": "#8E8EA0",
        "fontPrimary": "'Impact', 'Inter', sans-serif",
        "fontTech": "'Courier New', monospace",
        "glowIntensity": 25,
        "borderStyle": "square",
        "desc": "Novela gráfica y seinen oscuro: fondo tinta profunda, marcos blancos de alto contraste y carmesí.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="manga_dark_ink"] {
  --color-bg-dark: #0D0D11;
  --color-text-light: #F5F5FA;
  --color-accent-cyan: #FFFFFF;
  --color-accent-orange: #FF3344;
  --color-panel-bg: #181820;
  --color-text-dim: #8E8EA0;
  --color-border-cyan: rgba(255, 255, 255, 0.7);
  --color-border-cyan-bright: #FFFFFF;
  --theme-glow: 0 0 10px rgba(255, 255, 255, 0.3);
}"""
    }
]

DEFAULT_PACK_COZY = {
    "id": "pack_cozy_lofi",
    "name": "Pack Bosque Nórdico & Cozy Lo-Fi",
    "icon": "☕",
    "badge": "PACK COZY & NATURE",
    "description": "Estilo cálido, relajado y artesanal: terracota, madera, café moca, verde salvia y beige suave para directos de creación y charla.",
    "version": "1.0.0",
    "author": "Open Stream Suite"
}

DEFAULT_COZY_THEMES = [
    {
        "id": "cozy_terracotta",
        "packId": "pack_cozy_lofi",
        "name": "Cozy Terracotta (Café & Barro)",
        "badge": "01 // COZY",
        "accentCyan": "#D97443",
        "accentOrange": "#E5A93C",
        "bgDark": "#1F1A17",
        "textLight": "#F5EBE1",
        "panelBg": "#2C2420",
        "textDim": "#A89A90",
        "fontPrimary": "'Inter', sans-serif",
        "fontTech": "'JetBrains Mono', monospace",
        "glowIntensity": 30,
        "borderStyle": "rounded",
        "desc": "Terracota cálido, ámbar miel y café moca. Acogedor, artesanal y perfecto para directos chill y manualidades.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="cozy_terracotta"] {
  --color-bg-dark: #1F1A17;
  --color-text-light: #F5EBE1;
  --color-accent-cyan: #D97443;
  --color-accent-orange: #E5A93C;
  --color-panel-bg: #2C2420;
  --color-text-dim: #A89A90;
  --color-border-cyan: rgba(217, 116, 67, 0.4);
  --color-border-cyan-bright: #D97443;
  --theme-glow: 0 0 12px rgba(229, 169, 60, 0.4);
}"""
    },
    {
        "id": "nordic_forest",
        "packId": "pack_cozy_lofi",
        "name": "Nordic Forest (Musgo & Salvia)",
        "badge": "02 // FOREST",
        "accentCyan": "#73A985",
        "accentOrange": "#C89F65",
        "bgDark": "#131C16",
        "textLight": "#EDF4EE",
        "panelBg": "#1E2B22",
        "textDim": "#8BA090",
        "fontPrimary": "'Inter', sans-serif",
        "fontTech": "'JetBrains Mono', monospace",
        "glowIntensity": 25,
        "borderStyle": "rounded",
        "desc": "Verde musgo, pino escandinavo y madera clara de abedul. Natural, sobrio y relajante para stream.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="nordic_forest"] {
  --color-bg-dark: #131C16;
  --color-text-light: #EDF4EE;
  --color-accent-cyan: #73A985;
  --color-accent-orange: #C89F65;
  --color-panel-bg: #1E2B22;
  --color-text-dim: #8BA090;
  --color-border-cyan: rgba(115, 169, 133, 0.45);
  --color-border-cyan-bright: #73A985;
  --theme-glow: 0 0 14px rgba(115, 169, 133, 0.4);
}"""
    }
]

DEFAULT_PACK_SCIFI = {
    "id": "pack_sci_fi_blueprint",
    "name": "Pack Sci-Fi & Blueprint CAD",
    "icon": "📐",
    "badge": "PACK TÉCNICO & CAD",
    "description": "Estética técnica de cianotipia de ingeniería, esquemas milimétricos, cuadrícula blueprint y holopantallas Matrix para creadores técnicos.",
    "version": "1.0.0",
    "author": "Open Stream Suite"
}

DEFAULT_SCIFI_THEMES = [
    {
        "id": "blueprint_cad",
        "packId": "pack_sci_fi_blueprint",
        "name": "Blueprint CAD (Plano de Ingeniería)",
        "badge": "01 // BLUEPRINT",
        "accentCyan": "#00D2FF",
        "accentOrange": "#FFB800",
        "bgDark": "#0B1B2B",
        "textLight": "#E0F4FF",
        "panelBg": "#102A45",
        "textDim": "#6B93B8",
        "fontPrimary": "'Courier New', monospace",
        "fontTech": "'Courier New', monospace",
        "glowIntensity": 45,
        "borderStyle": "blueprint",
        "desc": "Cianotipia técnica azul cian sobre fondo de plano de taller. Cuadrícula de cotas milimétricas y esquinas de mira técnica.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="blueprint_cad"] {
  --color-bg-dark: #0B1B2B;
  --color-text-light: #E0F4FF;
  --color-accent-cyan: #00D2FF;
  --color-accent-orange: #FFB800;
  --color-panel-bg: #102A45;
  --color-text-dim: #6B93B8;
  --color-border-cyan: rgba(0, 210, 255, 0.5);
  --color-border-cyan-bright: #00D2FF;
  --theme-glow: 0 0 14px rgba(0, 210, 255, 0.4);
}"""
    },
    {
        "id": "neon_matrix",
        "packId": "pack_sci_fi_blueprint",
        "name": "Neon Matrix (Holo Cyber Tech)",
        "badge": "02 // MATRIX",
        "accentCyan": "#00FF7F",
        "accentOrange": "#FFB800",
        "bgDark": "#050B07",
        "textLight": "#E8FFE8",
        "panelBg": "#0C1810",
        "textDim": "#387548",
        "fontPrimary": "'JetBrains Mono', monospace",
        "fontTech": "'JetBrains Mono', monospace",
        "glowIntensity": 75,
        "borderStyle": "chamfer",
        "desc": "Verde fósforo cibernético de alta densidad, bordes biselados con esquinas cortadas 45º y escaneo holográfico.",
        "chatAnchored": True,
        "chatDerivative": None,
        "css": """body[data-theme="neon_matrix"] {
  --color-bg-dark: #050B07;
  --color-text-light: #E8FFE8;
  --color-accent-cyan: #00FF7F;
  --color-accent-orange: #FFB800;
  --color-panel-bg: #0C1810;
  --color-text-dim: #387548;
  --color-border-cyan: rgba(0, 255, 127, 0.55);
  --color-border-cyan-bright: #00FF7F;
  --theme-glow: 0 0 18px rgba(0, 255, 127, 0.6);
}"""
    }
]

DEFAULT_OVERLAY_THEMES = {
    "game": "arcade_8bit",
    "maker": "maker",
    "maker-desk": "maker",
    "maker-pc": "terminal",
    "print": "print",
    "print-machine": "print",
    "print-design": "print",
    "chill": "chill",
    "startingSoon": "synthwave",
    "beRightBack": "vapor_sunset",
    "ending": "synthwave"
}

def load_theme_state():
    state = {
        "activePack": "pack_open_stream_suite",
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

def init_themes_directory():
    """Inicializa la estructura modular de temas en carpetas y subcarpetas si no existen"""
    THEMES_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Pack Open Stream Suite
    pack_taller_dir = THEMES_DIR / "pack_open_stream_suite"
    if not pack_taller_dir.exists():
        pack_taller_dir.mkdir(parents=True, exist_ok=True)
        with open(pack_taller_dir / "pack.json", "w", encoding="utf-8") as f:
            json.dump(DEFAULT_PACK_TALLER, f, indent=2, ensure_ascii=False)

    for t in DEFAULT_THEMES_DATA:
        t_dir = pack_taller_dir / t["id"]
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

    # 2. Pack Retro Arcade
    pack_arcade_dir = THEMES_DIR / "pack_retro_arcade"
    if not pack_arcade_dir.exists():
        pack_arcade_dir.mkdir(parents=True, exist_ok=True)
        with open(pack_arcade_dir / "pack.json", "w", encoding="utf-8") as f:
            json.dump(DEFAULT_PACK_ARCADE, f, indent=2, ensure_ascii=False)

    for t in DEFAULT_ARCADE_THEMES:
        t_dir = pack_arcade_dir / t["id"]
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

    # 3. Pack Manga & Tinta Japonesa
    pack_manga_dir = THEMES_DIR / "pack_manga_ink"
    if not pack_manga_dir.exists():
        pack_manga_dir.mkdir(parents=True, exist_ok=True)
        with open(pack_manga_dir / "pack.json", "w", encoding="utf-8") as f:
            json.dump(DEFAULT_PACK_MANGA, f, indent=2, ensure_ascii=False)

    for t in DEFAULT_MANGA_THEMES:
        t_dir = pack_manga_dir / t["id"]
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

    # 4. Pack Bosque Nórdico & Cozy Lo-Fi
    pack_cozy_dir = THEMES_DIR / "pack_cozy_lofi"
    if not pack_cozy_dir.exists():
        pack_cozy_dir.mkdir(parents=True, exist_ok=True)
        with open(pack_cozy_dir / "pack.json", "w", encoding="utf-8") as f:
            json.dump(DEFAULT_PACK_COZY, f, indent=2, ensure_ascii=False)

    for t in DEFAULT_COZY_THEMES:
        t_dir = pack_cozy_dir / t["id"]
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

    # 5. Pack Sci-Fi & Blueprint CAD
    pack_scifi_dir = THEMES_DIR / "pack_sci_fi_blueprint"
    if not pack_scifi_dir.exists():
        pack_scifi_dir.mkdir(parents=True, exist_ok=True)
        with open(pack_scifi_dir / "pack.json", "w", encoding="utf-8") as f:
            json.dump(DEFAULT_PACK_SCIFI, f, indent=2, ensure_ascii=False)

    for t in DEFAULT_SCIFI_THEMES:
        t_dir = pack_scifi_dir / t["id"]
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
    """Compila y sincroniza todos los styles.css de todos los packs en common/themes.css"""
    try:
        css_blocks = [
            "/* ====================================================================",
            "   OPEN STREAM SUITE — CSS UNIFICADO DE TEMAS Y PACKS MODULARES",
            "   Generado automáticamente a partir de themes/<pack>/<theme>/style.css",
            "   ==================================================================== */\n"
        ]

        for pack_dir in sorted(THEMES_DIR.iterdir()):
            if not pack_dir.is_dir():
                continue
            for theme_dir in sorted(pack_dir.iterdir()):
                if not theme_dir.is_dir():
                    continue
                css_file = theme_dir / "style.css"
                if css_file.exists():
                    css_blocks.append(f"/* Pack: {pack_dir.name} | Tema: {theme_dir.name} */")
                    css_blocks.append(css_file.read_text(encoding="utf-8").strip())
                    css_blocks.append("")

        COMMON_THEMES_CSS.parent.mkdir(parents=True, exist_ok=True)
        COMMON_THEMES_CSS.write_text("\n".join(css_blocks), encoding="utf-8")
        logger.info("✓ common/themes.css sincronizado correctamente")
    except Exception as e:
        logger.warning(f"Error sincronizando common/themes.css: {e}")

def get_all_packs_and_themes():
    """Escanea el directorio themes/ y devuelve los packs con sus temas y metadatos"""
    init_themes_directory()
    packs = []
    state = load_theme_state()
    active_theme = state.get("activeTheme", "maker")
    active_pack = state.get("activePack", "pack_open_stream_suite")

    for pack_dir in sorted(THEMES_DIR.iterdir()):
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

        themes = []
        for theme_dir in sorted(pack_dir.iterdir()):
            if not theme_dir.is_dir():
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

        pack_meta["themes"] = themes
        pack_meta["themesCount"] = len(themes)
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
    """Crea una nueva carpeta de pack en themes/<pack_id>/"""
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

    pack_dir = THEMES_DIR / pack_id
    if pack_dir.exists():
        return web.json_response({"error": "Ya existe un pack con ese identificador"}, status=409)

    pack_dir.mkdir(parents=True, exist_ok=True)
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
    pack_dir = THEMES_DIR / pack_id
    if not pack_dir.exists():
        return web.json_response({"error": "Pack de temas no encontrado"}, status=404)

    theme_dir = pack_dir / theme_id
    if theme_dir.exists():
        return web.json_response({"error": "Ya existe un tema con ese nombre en este pack"}, status=409)

    theme_dir.mkdir(parents=True, exist_ok=True)
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

    theme_dir = THEMES_DIR / pack_id / theme_id
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
    theme_file = THEMES_DIR / pack_id / theme_id / "theme.json"
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

    theme_file = THEMES_DIR / pack_id / theme_id / "theme.json"
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

    theme_dir = THEMES_DIR / pack_id / theme_id
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
