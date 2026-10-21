"""
server/theme_defaults.py — Definiciones canónicas y datos por defecto de temas y estilos
"""

DEFAULT_PACK_TALLER = {
    "id": "Maker_Theme_Pack",
    "name": "Pack Maker & Taller",
    "icon": "🛠️",
    "badge": "PACK MAKER (6 TEMAS)",
    "description": "El pack insignia para creadores, talleres, electrónica, programación CAD e impresión 3D con 6 estilos visuales.",
    "version": "1.0.0",
    "author": "Open Stream Suite"
}

DEFAULT_THEMES_DATA = [
    {
        "id": "maker",
        "packId": "Maker_Theme_Pack",
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
        "packId": "Maker_Theme_Pack",
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
        "packId": "Maker_Theme_Pack",
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
        "packId": "Maker_Theme_Pack",
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
        "packId": "Maker_Theme_Pack",
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
        "packId": "Maker_Theme_Pack",
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

