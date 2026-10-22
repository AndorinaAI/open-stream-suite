# Directorio de Packs de Temas (streamthemes)

Este directorio alberga los packs de temas y overlays modulares de Open Stream Suite.

## Estructura por Pack

Cada pack se organiza de manera autónoma e independiente:

```
streamthemes/
└── <NombreDelPack>/
    ├── pack.json         # Metadatos del pack (id, nombre, versión, autor, etc.)
    ├── styles/           # Conjuntos de estilos / temas CSS y JSON
    │   ├── <tema_id>/
    │   │   ├── style.css
    │   │   ├── style.default.css
    │   │   ├── theme.json
    │   │   └── theme.default.json
    └── overlays/         # Vistas HTML, componentes visuales y escenas
        ├── <escena_id>/
        │   └── index.html
        └── ...
```

## Catálogo de Packs Oficiales Disponibles

1. **`Maker_Theme_Pack/`** (6 estilos):
   - Especializado en creadores, talleres, electrónica, CAD e impresión 3D.
   - Escenas: 9 escenas completas de taller (`maker-desk`, `maker-pc`, `print-machine`, `print-design`, `chill`, `game`, `screens/`).
   - Estilos: Maker Electrónico, Print & Vinilo, Retro Terminal, Chill Lavender, Cyberpunk Industrial y Synthwave Retro.

2. **`Open_stream_Pack/`** (5 estilos):
   - Especializado en streamers generales, variedad, charlas, podcasts y multitarea.
   - Escenas: `just_chatting`, `desktop_share`, `podcast_talk` y pantallas (`starting-soon`, `be-right-back`, `ending`).
   - Estilos: Neon Streamer, Sunset Glow, Clean Minimal, Emerald Flow y Crimson Pulse.

3. **`Gamer_Pro_Pack/`** (5 estilos):
   - Especializado en juegos competitivos, esports, speedruns y shooters tácticos con diseño HUD angulado.
   - Escenas: `gameplay_hud`, `speedrun_split`, `victory_clutch` y pantallas (`starting-soon`, `be-right-back`, `ending`).
   - Estilos: Crimson Esport, Toxic Radiation, Cyber Glitch, Golden Glory y Stealth Titanium.

4. **`Cozy_LoFi_Pack/`** (5 estilos):
   - Especializado en sesiones de relax, estudio ("Study With Me"), arte, música Lo-Fi y café con curvas suaves.
   - Escenas: `study_pomodoro`, `art_dual_cam`, `cafe_chat` y pantallas (`starting-soon`, `coffee-break`, `ending`).
   - Estilos: Latte Caramel, Lavender Dream, Matcha Bamboo, Sakura Bloom y Nordic Twilight.
