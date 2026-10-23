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

---

## Contrato Universal de Compatibilidad Semántica (`data-oss-*`)

Todas las escenas de los packs implementan el estándar semántico universal:
- `data-oss-cam="true"`: Marco contenedor de cámara. Recibe las 20 formas físicas (chaflanes 45°, polaroids, blindajes hex, pergaminos, arcade pixel, blueprint, etc.).
- `data-oss-viewport="true"`: Área transparente interior para recortar la webcam o captura en OBS.
- `data-oss-cam-label="true|bar|bottom"`: Rótulo identificativo de la cámara. Usar `"bar"` o `.cam-bottom-bar` para barras inferiores de ancho completo.
- `data-oss-panel="true"`: Tarjetas, bloques de chat, podios o listas de tareas.
- `data-oss-bar="top|bottom|left|right"`: Barras de cabecera superior, noticias/fases inferiores o columnas laterales.
- `data-oss-orientation="horizontal|vertical"`: Orientación del elemento (autodetectada por relación de aspecto o tipo de barra, o manual).
- `data-text-key="seccion.campo"`: Aislamiento estricto de textos para edición en caliente y sincronización WebSocket con OBS.

### Parámetros URL de Control
- `?theme=<id>`: Fuerza un tema de color específico.
- `?shape=<id>`: Fuerza una de las 20 formas físicas universales (`maker_blueprint`, `openstream_glass`, `gamer_mecha`, etc.).
- `?lock=1` / `?lockTheme=1`: Bloquea permanentemente la escena a los parámetros URL en OBS Studio, ignorando cambios globales de WebSocket.
- `?lang=en` / `?lang=es`: Carga los textos traducidos del idioma especificado.

### Fluidez con Relaciones de Aspecto
Gracias al uso de coordenadas relativas (`calc(100% - 24px)`), las formas se adaptan automáticamente a cámaras **16:9** (widescreen), **4:3** (retro), **21:9** (ultra-panorámicas) y **9:16** (vertical móvil / TikTok / Shorts) sin deformaciones.

