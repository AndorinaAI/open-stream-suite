# CONVENCIONES DE CÓDIGO, ARQUITECTURA Y ESTRUCTURA
## Open Stream Suite — Suite Modular de Overlays, Widgets y Triggers

<p align="center">
  <b>Español</b> | <a href="CONVENTIONS.en.md">English</a>
</p>

Este documento define la arquitectura oficial, convenciones de estructura de directorios y estándares de código del proyecto para permitir **Vibe Coding Autónomo con Inteligencia Artificial** de forma fluida, modular y sin regresiones.

---

## 1. Principios Fundamentales para IA Autónoma (Vibe Coding)

1. **Archivos Pequeños y Modulares**:
   - Ningún archivo debe convertirse en un monolito inmanejable. 
   - Tamaño objetivo: **100 - 400 líneas por módulo**.
   - Cada fichero tiene una única responsabilidad bien definida (Separation of Concerns).
2. **Cero Dependencias Pesadas en Frontend**:
   - Todo el frontend funciona con **Vanilla JavaScript (ES6+), HTML5 semántico y CSS3 nativo** (variables CSS y diseño responsivo/glassmorphism).
   - No utilizar bundlers complejos (Webpack, Vite, Tailwind CLI) a menos que se solicite explícitamente: las fuentes de OBS Studio y el panel se cargan instantáneamente en el navegador sin proceso de build.
3. **Desacoplamiento Backend / Frontend**:
   - El backend en Python expone endpoints REST (`/api/...`) y canales en tiempo real mediante WebSockets (`/ws`).
   - El frontend consume el backend a través del cliente unificado `alerts/js/api.js`.
4. **Respeto a OBS Studio**:
   - Los overlays (`index.html`) deben tener fondo transparente por defecto (`background: transparent`), resolución estándar 1920x1080 (o la del widget específico) y cero desbordamientos con barras de scroll (`overflow: hidden`).
5. **Cero Regresiones**:
   - Antes de dar por finalizada cualquier modificación, se debe validar:
     - El servidor Python inicia sin errores de importación ni conflictos de puerto.
     - Los endpoints REST clave responden `200 OK`.
     - La consola del navegador en `panel.html` y en los widgets se mantiene con **0 errores de JavaScript**.

---

## 2. Mapa y Estructura del Proyecto

```
app/                           # Carpeta principal del proyecto
├── server.py                  # Entrypoint raíz (~35 líneas) para iniciar_alertas.sh
├── server/                    # Backend modular en Python (aiohttp + WebSockets)
│   ├── config.py              # Constantes, rutas (BASE_DIR, MEDIA_DIR, DONATIONS_CONFIG_FILE)
│   ├── state.py               # Singleton TwitchAlertSystem y coordinador de estado (~127 líneas)
│   ├── eventsub.py            # Twitch EventSub WebSocket (Follows, Subs, Bits, Puntos de Canal)
│   ├── irc.py                 # Twitch IRC WebSocket (Comandos chat, artistas, moderación)
│   ├── app.py                 # Factory create_app() y configuración del servidor
│   ├── routes/                # Controladores REST y WS desacoplados por dominio
│   │   ├── deck_routes.py     # /api/deck/* (control de Stream Deck, Ajazz, Loupedeck)
│   │   ├── media_routes.py    # /api/media, /api/upload, /api/media/delete
│   │   ├── overlay_routes.py  # /api/overlays/texts (GET, POST, reset)
│   │   ├── rewards_routes.py  # /api/twitch/rewards (Twitch Helix CRUD)
│   │   ├── themes_routes.py   # /api/themes/* (packs, creación, restauración, chat-anchor)
│   │   ├── webhooks_routes.py # /api/webhooks/* (Ko-fi, PayPal, Buy Me a Coffee, Streamlabs)
│   │   └── widgets_routes.py  # /api/widgets/config (GET, POST, reset)
│   └── services/              # Capa de servicios y lógica de negocio
│       ├── actions/           # Submódulos de acciones para Stream Deck y comandos
│       │   ├── alert_actions.py, deck_actions.py, game_actions.py, media_actions.py...
│       │   └── promo_actions.py (promoción de creadores y shoutouts por chat)
│       ├── alerts_service.py      # Motor de alertas y disparadores
│       ├── bot_timers_service.py  # Mensajes periódicos automáticos del bot en IRC
│       ├── deck_service.py        # Orquestador de hardware macro pads
│       ├── donations_service.py   # Procesamiento unificado de propinas y donaciones
│       ├── media_service.py       # Gestión física de archivos multimedia
│       ├── overlay_service.py     # Persistencia y sincronización de textos de escenas
│       ├── theme_manager.py       # Gestión física de temas y carpetas
│       ├── theme_service.py       # Lógica de packs, herencia y anclaje
│       ├── triggers_service.py    # Búsqueda de triggers, roles y payloads OBS
│       ├── twitch_service.py      # Operaciones con la API Helix de Twitch
│       └── widgets_service.py     # Configuración y presets de widgets
│
├── alerts/                    # Panel de control del streamer y overlay de alertas
│   ├── panel.html             # Dashboard de control para el streamer
│   ├── index.html             # Overlay transparente para OBS Studio (~60 líneas)
│   ├── css/
│   │   ├── panel/             # Estilos del panel modularizados por componente (01-08)
│   │   ├── alerts-widget.css  # Estilos para el overlay de alertas en OBS
│   │   ├── alerts-themes.css  # Temas procedurales de alertas (cyberpunk, neon, etc.)
│   │   └── panel.css          # Importador unificado de css/panel/*.css
│   └── js/                    # Módulos frontend desacoplados
│       ├── alerts-studio/     # Estudio de edición de alertas (01-06)
│       ├── media/             # Explorador multimedia (01-06)
│       ├── overlay/           # Motor de alertas para OBS Studio (01-04)
│       ├── overlay-texts/     # Editor de textos de escenas (01-03)
│       ├── rewards/           # Gestor de recompensas Twitch (01-03)
│       ├── roles/             # Gestor de funciones y VIPs (01-04)
│       ├── themes/            # Gestor de temas y escenas (01-12)
│       ├── triggers/          # Editor de triggers y memes (01-03)
│       ├── widgets-core/      # Núcleo de Mini-Apps y modales de donaciones (01-06)
│       ├── api.js             # Cliente REST API unificado con X-Local-Token
│       ├── audio.js           # Reproductor y generador de audio
│       ├── monitor.js         # Monitor interactivo 16:9 con drag-and-drop
│       ├── overlay-widget.js  # Coordinador autocargable del overlay de alertas
│       └── main.js            # Inicialización, navegación entre tabs y polling
│
├── widgets/                   # Widgets modulares desacoplados (Mini-App + OBS Overlay)
│   ├── timer/                 # Temporizador (cuenta atrás, cronómetro, pomodoro)
│   │   ├── panel/             # Submódulos de Mini-App (01-06)
│   │   ├── js/                # Submódulos de renderizado OBS (render.js, etc.)
│   │   ├── index.html, style.css, widget.js, panel.html
│   ├── chat/                  # Overlay de chat interactivo con emotes y partículas
│   │   ├── panel/             # Submódulos de Mini-App (01-08)
│   │   ├── js/                # Submódulos de chat (feed, particles, timers)
│   │   ├── index.html, style.css, widget.js, panel.html
│   ├── shoutout/              # Tarjeta de shoutout y reconocimiento a creadores
│   │   ├── panel/             # Submódulos de Mini-App (01-08)
│   │   ├── index.html, style.css, widget.js, panel.html
│   ├── goal/                  # Barra de metas de seguidores, subs o donaciones
│   │   ├── panel/             # Submódulos de Mini-App (01-05)
│   │   ├── index.html, style.css, widget.js, panel.html
│   └── ticker/                # Marquesina de noticias, eventos y redes
│       ├── panel/             # Submódulos de Mini-App (01-04)
│       ├── index.html, style.css, widget.js, panel.html
│
├── scenes/                    # Overlays completos para OBS Studio (1920×1080)
│   ├── game/                  # Gameplay con HUD de cámara y estadísticas
│   ├── maker/                 # Taller con cámara cenital y proyecto activo
│   ├── podcast/               # Podcast / Charla con rótulos de invitados
│   ├── coffee-break/          # Pausa relajada
│   ├── starting-soon/         # Pantalla de inicio con cuenta atrás
│   ├── be-right-back/         # Pausa técnica
│   ├── ending/                # Despedida y créditos
│   └── study_pomodoro/        # Sesión Pomodoro de estudio
│
├── common/                    # Recursos compartidos y tokens del sistema de diseño
│   ├── overlay/
│   │   ├── editor/            # Submódulos del editor flotante HUD (01-05a)
│   │   ├── dom-injector.js    # Inyector de configuración visual al DOM de escenas
│   │   └── icons.js           # Iconografía SVG compartida
│   ├── catalog.css            # Estilos del catálogo de overlays
│   ├── catalog.js             # Lógica responsiva del catálogo
│   ├── components.css         # Componentes comunes de UI
│   ├── editor.js              # Editor interactivo in-situ para escenas
│   ├── i18n.js                # Sistema de traducción internacional ES / EN
│   ├── overlay.js             # Runtime base para OBS Studio
│   ├── styles.css             # Variables CSS globales, tipografías y reset
│   └── themes.css             # Estilos de temas sincronizados en tiempo real
│
├── launcher/                  # Lanzador de escritorio multiplataforma (Tkinter)
│   ├── gui.py, server_ctl.py, twitch_ctl.py, updater.py, i18n.py
│   └── tabs/                  # Pestañas desacopladas (server, twitch, logs, guide)
│
├── assets/                    # Identidad de marca y recursos gráficos
│   └── imagencorp/            # Logos (SVG/PNG), favicon y capturas de pantalla
│
├── languages/                 # Diccionarios de internacionalización (i18n)
│   ├── es.json, en.json       # Diccionarios unificados principales
│   └── *.alerts.json, *.widgets.json, *.overlays.json # Subdiccionarios modulares
│
├── scripts/                   # Asistentes de despliegue y scripts de arranque
│   ├── iniciar_stream.sh/.bat # Arranque directo del launcher
│   ├── iniciar_alertas.sh     # Servidor backend directo
│   ├── iniciar_preview.sh     # Previsualizador local ligero
│   └── setup_cloudflare.sh, setup_vps_tunnel.sh # Automatización de túneles
│
├── tests/                     # Suite de pruebas unitarias automatizadas (unittest)
├── docs/                      # Guías completas de arquitectura, instalación y OBS
├── index.html                 # Catálogo interactivo de escenas (~320 líneas)
└── iniciar_stream.sh/.bat     # Wrappers de compatibilidad en la raíz de app/
```

---

## 3. Hoja de Ruta y Guía para Futuras Extensiones

### A. Widgets como "Mini-Apps" Bidireccionales
Cada widget dentro de `widgets/<nombre>/` es un componente de dos capas (Overlays OBS + Mini-App de Control):
- **Capa 1: Modo Overlay (OBS Studio)**:
  - Lo que se renderiza en directo: ligero, sin dependencias, fondo 100% transparente y diseñado con dimensiones fijas o responsivas.
  - Escucha eventos WebSocket (`ws://localhost:8080/ws`) para reaccionar en tiempo real a acciones del panel o disparos de hardware.
  - Escucha el evento `widgets_config_updated` para actualizar dinámicamente estilos CSS, tipografías y comportamientos sin recargar la página.
- **Capa 2: Mini-App de Control en el Dashboard (`panel.html`)**:
  - Se accede directamente pulsando el botón `⚙️ Mini-App` en cada tarjeta de widget de la cuadrícula o a través de `openWidgetMiniApp('<widget_id>', '<tab>')`.
  - Incorpora un **Live PiP Preview** (`<iframe id="miniapp-live-iframe">`) para observar el comportamiento en caliente.
  - Implementa el **Principio de Edición Dual**:
    1. **Controles Sencillos (Visual)**: Sliders, selectores de colores neón, números, inputs de texto y toggles accesibles para cualquier usuario sin conocimientos técnicos.
    2. **Edición por Código (JSON / CSS)**: Pestaña `💻 Código / JSON & Estilos` con un textarea reactivo que valida la sintaxis, actualiza `widgets_config.json` y emite la actualización a través de WebSockets.
  - **Personalización de Atajos desde el Exterior**:
    - Cada tarjeta exterior en la cuadrícula incluye su propio deck de acciones rápidas (`.widget-actions-deck`) con botones coloreados.
    - Desde la misma tarjeta exterior se puede ejecutar un atajo con 1 solo clic, o pulsar `➕ Añadir Atajo` para crearlo instantáneamente mediante prompts guiados o modales, así como `✏️ Gestionar Atajos` para entrar directamente al gestor.

### B. Convención Universal para OpenDeck / Stream Deck y Hardware Externo
Para garantizar que **cualquier hardware o software externo** (Elgato Stream Deck, OpenDeck, Loupedeck, Touch Portal, macros de teclado, llamadas curl o atajos de móvil) pueda controlar los widgets sin acoplamiento al frontend:
1. **Endpoint REST Universal**:
   - `POST /api/widgets/action`
   - Content-Type: `application/json`
   - Payload:
     ```json
     {
       "widget": "timer | promo | chat | goal | ticker",
       "action": "start | pause | reset | promote | explode | increment | set | message",
       "params": { ... }
     }
     ```
2. **Despacho Automático vía WebSocket**:
   - El backend (`server/routes/widgets_routes.py`) valida los parámetros y difunde inmediatamente el evento correspondiente a todos los clientes WebSocket conectados (incluyendo overlays en OBS Studio y paneles abiertos).
3. **Persistencia Modular y Descentralizada por Widget**:
   - Cada widget cuenta con su propio archivo de configuración aislado: `widgets/<widget>/config.json` (ej: `widgets/chat/config.json`, `widgets/goal/config.json`, `widgets/timer/config.json`, `widgets/shoutout/config.json`, `widgets/ticker/config.json`).
   - El backend (`server/routes/widgets_routes.py`) carga y guarda modularmente en cada carpeta individual. Además, mantiene un snapshot unificado en `widgets_config.json` como respaldo y compatibilidad retroactiva.
   - **Endpoints REST**:
     - `GET /api/widgets/config` y `POST /api/widgets/config`: Diccionario completo unificado para el panel general y sockets.
     - `GET /api/widgets/{widget}/config` y `POST /api/widgets/{widget}/config`: Configuración exclusiva del widget consultado.
     - Acceso estático directo: `http://localhost:8080/widgets/{widget}/config.json`.
   - Cualquier nuevo widget que se añada a la suite debe crearse en su carpeta `widgets/<nombre>/` con su `index.html` y su `config.json`.

### C. Gestor de Medios como Explorador de Archivos Completo
El gestor en `alerts/` evolucionará hacia un explorador visual potente:
- **Navegación en Árbol**: Vista jerárquica de carpetas (`tree-view`) y navegación por rutas.
- **Filtros por Tipo de Archivo**: Clasificación rápida por pestañas o selector: Todos, Vídeos (`mp4`, `webm`), Audios (`mp3`, `wav`, `ogg`), Imágenes/GIFs (`png`, `gif`, `webp`).
- **Operaciones de Archivo**: Copiar enlace, cortar, pegar, renombrar, eliminar con confirmación y vista previa flotante.
- **Drag & Drop Avanzado**: Arrastrar archivos locales a carpetas específicas de la vista de árbol.

### D. Temas y Overlays con Live View en Tiempo Real
- Cada overlay en `overlays/<pack>/` cuenta con soporte para `data-theme` y carga `common/themes.css`.
- En el panel de control (`alerts/js/themes.js`), el streamer podrá:
  - Seleccionar cualquier tema predefinido (Maker, Print, Terminal, Chill, Cyberpunk, Synthwave). Los nombres de tema se mantienen por compatibilidad.
  - Entrar en un overlay específico para tener una previsualización en vivo (Live View) y editar en caliente colores, marcos y textos (nombre del canal, proyecto actual, frases rotativas de pausa).
  - Guardar y exportar presets personalizados de overlays y temas.

### E. Organización de Overlays y Escenas
- La carpeta canónica de overlays de stream es `overlays/`, estructurada por carpetas temáticas o de propósito (ej. `maker/`, `print/`, `game/`, `chill/`, `screens/`).
- El servidor mantiene en `server/routes/static_routes.py` redirecciones automáticas y transparentes desde las rutas históricas `/scenes/...` hacia `/overlays/...` para que cualquier fuente previamente configurada en OBS Studio continúe funcionando sin interrupciones.

### F. Temas Modulares, Restauración de Fábrica y Estilos por Overlay
- Los temas residen en `themes/<pack_id>/<theme_id>/` con 4 archivos:
  - `theme.json`: Metadatos y configuración activa.
  - `style.css`: Reglas CSS activas aplicadas a `body[data-theme="..."]`.
  - `theme.default.json`: Copia de respaldo original de fábrica.
  - `style.default.css`: CSS original de fábrica para restauración.
- **Restauración (`POST /api/themes/restore`)**: Permite restaurar cualquier tema a sus valores de fábrica con un clic desde el editor visual.
- **Estilos por Overlay (`themes_state.json`)**: Cada overlay de OBS Studio tiene asignado su propio estilo visual en `overlayThemes` (ej: `game` -> `arcade_8bit`, `maker-desk` -> `maker`, etc.), sincronizándose dinámicamente con OBS vía WebSocket.

### G. Overlays con Funciones Programadas, Elementos Draggables y Edición en Caliente

Los overlays en Open Stream Suite no son meras plantillas visuales estáticas; son **aplicaciones web de emisión dinámicas** que combinan estética de alta gama con lógica programada nativa:

1. **Capacidades Funcionales Nativas en Overlays**:
   - **Cronómetros & Speedrun (`Gamer_Pro_Pack`)**:
     - Cronómetro interactivo con tiempos de vuelta y splits (`⚡ Split`, `⏮ Prev`, `🔄 Reset`).
     - Almacenamiento y captura de tiempos por tramo (`.split-time`), cálculo/alternancia de deltas (`+` retraso / `-` adelanto) y edición directa de títulos y PB (Personal Best).
     - Acceso rápido vía teclado (tecla `Espacio` para registrar split o pausar sin interferir con inputs de texto).
   - **Pomodoro y Cuenta Atrás (`Cozy_LoFi_Pack` y pantallas Starting Soon)**:
     - Temporizadores regresivos sincronizados milisegundo a milisegundo con la barra de carga tecnológica (`.tech-progress-fill`).
     - Presets rápidos de concentración y café (25m, 50m, 5m, 10m) y micro-ajustes (`+1m` / `-1m`).
     - Pausa y reanudación con clic directo sobre el tiempo gigante en pantalla.
   - **Gestor Dinámico de Fases (`Maker_Theme_Pack`)**:
     - Conmutación directa de fase haciendo clic sobre cualquier tramo inferior (`01 PLAN`, `02 MONTAJE`, etc.).
     - Sincronización automática de `FASE ACTUAL` en la ficha técnica y en los botones del HUD.
     - Botones `➕` y `🗑️` en el HUD para añadir o eliminar fases del proyecto en caliente.
   - **Distribución Dinámica de Cámaras (`Open_stream_Pack` Podcast)**:
     - Conmutador multi-cámara en el HUD (`[2 Cams] [3 Cams] [4 Cams]`) que reorganiza el CSS Grid y genera rótulos editables para cada invitado.
   - **Interacciones Directas en Lienzo**:
     - Clic en banners de victoria (`victory_clutch`) para ciclar estados (`VICTORY`, `DEFEAT`, `ACE`, `MATCH POINT`).
     - Clic en estadísticas (`gameplay_hud`) para alternar modos (`COMPETITIVE`, `RANKED`) y FPS (`240`, `144`, etc.).
     - Clic en webcam flotante (`desktop_share`) para rotar entre las 4 esquinas del viewport.

2. **Regla de Oro: Todo Panel o Menú Flotante DEBE ser Draggable (`makeDraggable`)**:
   - **Principio de No Invasión**: El contenido de la emisión, cámaras o textos nunca deben quedar tapados por un menú flotante estático.
   - Todo menú flotante (`#open-stream-suite-screen-hud`, `#oss-countdown-control`, `#oss-speedrun-control`, `#oss-brb-phrases-control`) debe inicializarse con la función helper universal `makeDraggable(panel, handleSelector)`.
   - **Tirador de Arrastre**: Cada ventana flotante debe disponer de una cabecera con tirador visual (`.hud-drag-handle`) que contenga el glifo `⋮⋮` y `cursor: grab / grabbing`.
   - **Pointer Events**: Debe implementarse usando la API estándar de puntero (`pointerdown`, `pointermove`, `pointerup`) con `setPointerCapture`, asegurando compatibilidad fluida con ratón, trackpads y pantallas táctiles (`touch-action: none`).
   - Las coordenadas deben acotarse para evitar que los controles se pierdan fuera de los límites de la pantalla.

3. **Arquitectura del Motor de Edición en Caliente (`common/overlay.js`)**:
   - **Catálogo Exhaustivo `editableSelectors`**: Todos los elementos con texto en las 27 escenas deben estar indexados para activarse con `contenteditable="true"` y aparecer en el menú desplegable flotante `"🎯 Ir a Texto..."`.
   - **Pausa Reactiva de Animaciones e Intervalos (`window.__OSS_IS_EDITING__`)**:
     - Mientras el usuario tenga el cursor dentro de un elemento editable o esté escribiendo, `window.__OSS_IS_EDITING__` se activa automáticamente.
     - Todos los bucles (rotación de frases de pausa, refresco de listas) pausan sus transiciones para que el texto no cambie ni se mueva bajo el cursor del usuario.
   - **Delegación de Eventos en `document`**:
     - Las escuchas de clics para selección activa (`.split-row`, `.phase-item`, `.split-delta`, etc.) deben adjuntarse a nivel de `document` mediante delegación (`e.target.closest(...)`).
     - Esto garantiza que sigan funcionando sin romperse aunque el DOM se regenere dinámicamente con `innerHTML = ''` tras cargar datos del servidor.
   - **Persistencia Bidireccional y Sincronización OBS**:
     - Al pulsar `💾 Guardar` en el HUD, `saveTexts()` recopila los textos y estados activos específicos del pack (vía detección de `sceneKey` y rutas pathname).
     - Se envían a `POST /api/overlays/texts` (protegido con `X-Local-Token`) y el servidor emite el evento WebSocket `overlay_texts_updated` a todas las instancias conectadas en OBS Studio.

---

## 4. Convenciones de Código y Nomenclatura

### Backend (Python):
- **Funciones asíncronas**: Todos los endpoints de rutas y eventos Twitch deben ser `async def`.
- **Rutas a archivos**: Utilizar siempre `pathlib.Path` referenciadas a través de `server.config.BASE_DIR`.
- **Respuestas JSON**:
  - Éxito: `web.json_response({"status": "ok", ...})`
  - Error: `web.json_response({"status": "error", "error": "..."}, status=400)`
- **Nombres**: Snake_case para funciones y variables (`handle_irc_command`, `auto_register_artist`), CamelCase para clases (`TwitchAlertSystem`).

### Frontend (JavaScript):
- **Modularidad**: Usar objetos o funciones globales claras añadidas secuencialmente en `panel.html` o con ES modules si se migra en el futuro.
- **Peticiones HTTP**: Utilizar siempre el cliente `API.<método>()` definido en `alerts/js/api.js`.
- **Nombres**: CamelCase para funciones y variables (`syncLockedRewardColor`, `twitchRewardsList`), UPPER_SNAKE_CASE para constantes de configuración.
- **Manejo de Errores**: Usar `try...catch` con retroalimentación visual al usuario (toasts o alertas explicativas).

### CSS:
- **Tokens y Variables**: Utilizar siempre las variables de diseño existentes en `common/styles.css`:
  - Acentos: `var(--color-accent-cyan)`, `var(--color-accent-orange)`, `var(--color-accent-purple)`
  - Fondos: `var(--color-bg-dark)`, `rgba(20, 24, 28, 0.85)`
  - Bordes: `var(--color-border-dim)`, `var(--color-border-cyan)`
  - Fuentes: `var(--font-primary)`, `var(--font-tech)`
- **Efectos**: Transiciones suaves (`var(--transition-smooth)`), desenfoque de cristal (`backdrop-filter: blur(...)`) y sombras glow (`box-shadow: 0 0 12px <color>`).

---

*Documento creado para garantizar la estabilidad y evolución continua del proyecto con Antigravity & Vibe Coding.*
