> **Puerto:** las URLs de ejemplo usan `8080`; sustitúyelo si cambias `SERVER_PORT`.

# 🛠️ GUÍA DE DESARROLLO, TEMAS Y WIDGETS
### Open Stream Suite — Overlays, Alertas y Triggers Modulares con Código

<p align="center">
  <b>Español</b> | <a href="GUIA_DESARROLLO_Y_TEMAS.en.md">English</a>
</p>

Bienvenido a la guía técnica oficial del sistema de overlays para **Andorina**. Aquí aprenderás **cómo funciona la arquitectura**, **cómo se crean los overlays con código web frente a Photoshop**, **cómo crear tus propios widgets**, y **cómo diseñar e instalar nuevos temas visuales** en cuestión de minutos.

---

## 📑 ÍNDICE
1. [¿Cómo se Crean Overlays con Código vs Photoshop?](#1-cómo-se-crean-overlays-con-código-vs-photoshop)
2. [Arquitectura del Proyecto y Convenciones](#2-arquitectura-del-proyecto-y-convenciones)
3. [Cómo Crear un Nuevo Widget desde Cero (Paso a Paso)](#3-cómo-crear-un-nuevo-widget-desde-cero)
4. [Cómo Crear un Nuevo Tema Visual e Instalarlo](#4-cómo-crear-un-nuevo-tema-visual)
5. [Comunicación en Tiempo Real: WebSocket y Eventos](#5-comunicación-en-tiempo-real)
6. [TriggerFyre Local: Vídeos, Memes y Puntos de Canal](#6-triggerfyre-local)
7. [Buenas Prácticas para OBS Studio y Directos](#7-buenas-prácticas-para-obs-studio)
8. [Funciones Programadas en Overlays y Menús Flotantes Draggables](#8-funciones-programadas-en-overlays-y-menús-flotantes-draggables)

---

## 1. ¿Cómo se Crean Overlays con Código vs Photoshop?

Históricamente, los streamers diseñaban sus overlays en programas como Photoshop o Illustrator exportando archivos PNG transparentes o vídeos con bucles pesados.

### ¿Por qué hacerlo con código (HTML + CSS + JS) es infinitamente mejor?

| Característica | Con Photoshop / PNG / Vídeo | Con Nuestro Sistema (HTML5/CSS3/JS) |
| :--- | :--- | :--- |
| **Peso y Memoria** | Archivos pesados (10 a 80 MB por bucles de vídeo MP4 o capas PNG). | Paquete común ultraligero (~200 KB cacheados para toda la suite). Carga instantánea. |
| **Consumo de CPU en OBS** | OBS decodifica bucles de vídeo continuos de fondo. | Cero decodificación de vídeo constante. Renderizado vectorial directo por GPU en Chromium. |
| **Nitidez y Resolución** | Si escalas un PNG pierde nitidez o se pixela. | Vectores SVG y CSS que se ven ultra nítidos a 1080p, 2K o 4K. |
| **Dinamismo e Interactividad** | Estático. Para cambiar un texto hay que abrir Photoshop. | **100% dinámico**: cambia el proyecto en `config.js` o en el HUD y se actualiza en todas las escenas sin tocar imágenes. |
| **Reacción a Twitch** | No puede reaccionar a nada. | Reacciona en tiempo real a follows, subs, bits, chat y puntos de canal mediante WebSockets. |
| **Transparencia Nativa** | Fácil que queden halos blancos o recortes sucios. | Transparencia alfa perfecta (`background: transparent !important`). |

### ¿Cómo funciona la transparencia en OBS?
En OBS Studio, cuando agregas una fuente de tipo **Navegador** (*Browser Source*):
1. OBS ejecuta internamente una instancia ultraligera de Chromium.
2. Si el documento HTML tiene `background: transparent;`, todo lo que no tenga un color o caja explícita **se vuelve invisible**, permitiendo que tus cámaras, capturas de pantalla o juegos se vean por debajo con cero retardo.
3. Para facilitar las pruebas fuera de OBS, nuestro script `common/overlay.js` detecta automáticamente si estás dentro de OBS (`window.obsstudio`). Si estás en un navegador normal, activa un fondo de prueba para que no veas un fondo blanco plano.

---

## 2. Arquitectura del Proyecto y Convenciones

```
app/                           # Carpeta principal del proyecto
├── server.py                  # Entrypoint raíz (~35 líneas) para iniciar_alertas.sh
├── server/                    # Backend modular en Python (aiohttp + WebSockets)
│   ├── config.py, state.py, eventsub.py, irc.py, app.py
│   ├── routes/                # Controladores REST y WS desacoplados por dominio
│   │   ├── deck_routes.py, media_routes.py, overlay_routes.py, rewards_routes.py...
│   │   └── themes_routes.py, webhooks_routes.py, widgets_routes.py, static_routes.py
│   └── services/              # Capa de servicios y lógica de negocio
│       ├── alerts_service.py, deck_service.py, donations_service.py, media_service.py...
│       ├── overlay_service.py, theme_manager.py, theme_service.py, widgets_service.py
│       └── actions/           # Submódulos de acciones para Stream Deck y comandos
│
├── alerts/                    # Panel de control del streamer y overlay de alertas
│   ├── panel.html             # Dashboard de control para el streamer
│   ├── index.html             # Overlay transparente para OBS Studio (~60 líneas)
│   ├── css/
│   │   ├── panel/             # Estilos del panel modularizados por componente (01-08)
│   │   ├── alerts-widget.css  # Estilos para el overlay de alertas en OBS
│   │   └── panel.css          # Importador unificado de css/panel/*.css
│   └── js/                    # Módulos frontend desacoplados
│       ├── alerts-studio/, media/, overlay/, overlay-texts/, rewards/, roles/, themes/, triggers/, widgets-core/
│       ├── api.js, audio.js, monitor.js, overlay-widget.js, main.js
│       └── forwarders: media.js, triggers.js, widgets-core.js, overlay-texts.js, rewards.js, roles.js
│
├── widgets/                   # Widgets modulares independientes (Mini-App + Overlay OBS)
│   ├── chat/                  # Chat en pantalla con emotes, roles y partículas
│   │   ├── panel/             # Submódulos de control Mini-App (01-08)
│   │   ├── js/                # Submódulos OBS (styles.js, parser.js, render.js, network.js, particles.js)
│   │   ├── index.html, style.css, widget.js, panel.js, config.json
│   ├── goal/                  # Barra de objetivos y metas múltiples
│   │   ├── panel/             # Submódulos de control Mini-App (01-05)
│   │   ├── js/                # Submódulos OBS (confetti.js, render.js, network.js)
│   │   ├── index.html, style.css, widget.js, panel.js, config.json
│   ├── shoutout/              # Tarjeta holográfica de recomendación y QR
│   │   ├── panel/             # Submódulos de control Mini-App (01-08)
│   │   ├── js/                # Submódulos OBS (styles.js, render.js, network.js)
│   │   ├── index.html, style.css, widget.js, panel.js, config.json
│   ├── ticker/                # Marquesina de noticias, eventos y RSS
│   │   ├── panel/             # Submódulos de control Mini-App (01-04)
│   │   ├── js/                # Submódulos OBS (state-data.js, render.js, network.js)
│   │   ├── index.html, style.css, widget.js, panel.js, config.json
│   └── timer/                 # Temporizador modular (cuenta atrás, cronómetro, bloques)
│       ├── panel/             # Submódulos de control Mini-App (01-06)
│       ├── js/                # Submódulos OBS (state-data.js, render.js, engine.js, network.js)
│       └── index.html, style.css, widget.js, panel.js, config.json
│
├── streamthemes/              # Packs temáticos modulares de overlays y estilos
│   ├── Cozy_LoFi_Pack/        # Escenas Lo-Fi, Pomodoro, Art Dual Cam y estilos
│   ├── Gamer_Pro_Pack/        # Escenas Gameplay HUD, Speedrun, Victory Clutch y estilos
│   ├── Maker_Theme_Pack/      # Escenas de taller (desk, pc, print, chill, game) y estilos
│   └── Open_stream_Pack/      # Escenas Just Chatting, Desktop Share, Podcast y estilos
│
├── common/                    # Recursos compartidos y tokens del sistema de diseño
│   ├── overlay/               # Submódulos: editor/ (01-05a), dom-injector.js, backdrop-aperture.js, icons.js
│   ├── fonts/                 # Tipografías locales offline (WOFF2)
│   ├── components.css, fonts.css, i18n.js, overlay.js, styles.css, themes.css
│
├── launcher/                  # Lanzador de escritorio multiplataforma (Tkinter)
│   ├── gui.py, server_ctl.py, twitch_ctl.py, updater.py, i18n.py
│   └── tabs/                  # Pestañas desacopladas (server, twitch, logs, guide)
│
├── assets/                    # Identidad de marca y recursos gráficos
│   └── imagencorp/            # Logos (SVG/PNG), favicon y capturas de pantalla
├── languages/                 # Diccionarios de internacionalización (i18n)
├── scripts/                   # Asistentes de despliegue y scripts de arranque
└── docs/                      # Guías completas de arquitectura, instalación y OBS
```

---

## 3. Cómo Crear un Nuevo Widget desde Cero

Todos los widgets del sistema siguen 4 reglas de oro:
1. **Fondo 100% transparente**: `html, body { background: transparent !important; margin: 0; overflow: hidden; }`.
2. **Uso de tokens CSS globales**: Vincular `../../common/styles.css` y `../../common/themes.css`.
3. **Escuchar el WebSocket local**: Para reaccionar a alertas o cambios de tema.
4. **Dimensiones específicas**: Diseñar pensando en el tamaño que tendrá en OBS (ej. 400×120 para barras, 1920×1080 si abarca toda la pantalla).

### Plantilla Base (Boilerplate) para tu Nuevo Widget
Crea una carpeta `widgets/mi-widget/` y un archivo `index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Nuevo Widget — Open Stream Suite</title>
  <link rel="stylesheet" href="../../common/styles.css">
  <link rel="stylesheet" href="../../common/themes.css">
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: transparent !important;
      overflow: hidden;
      font-family: var(--font-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Tarjeta o contenedor visual del widget */
    .mi-widget-card {
      width: 380px;
      background: rgba(25, 29, 33, 0.92);
      border: 1px solid var(--color-border-dim);
      border-left: 3px solid var(--color-accent-cyan);
      border-radius: var(--radius-sm);
      padding: 14px 18px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: var(--transition-smooth);
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .widget-title {
      font-family: var(--font-tech);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: var(--color-accent-cyan);
      text-transform: uppercase;
    }

    .widget-value {
      font-family: var(--font-tech);
      font-size: 22px;
      font-weight: 800;
      color: var(--color-text-light);
    }
  </style>
</head>
<body>

  <div class="mi-widget-card">
    <div class="widget-header">
      <span class="widget-title">MI WIDGET PERSONALIZADO</span>
      <span style="font-size: 14px;">🛠️</span>
    </div>
    <div id="valor-dinamico" class="widget-value">Esperando datos...</div>
  </div>

  <script src="../../config.js"></script>
  <script>
    const valorEl = document.getElementById('valor-dinamico');

    // Conectar al WebSocket local (ws://localhost:8080/ws)
    function connectWS() {
      const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 1. Escuchar cambio de tema
          if (data.type === 'theme_change' && data.theme) {
            document.body.setAttribute('data-theme', data.theme);
          }

          // 2. Escuchar follow o suscripción
          if (data.type === 'follow') {
            valorEl.textContent = `¡Nuevo seguidor: ${data.user}!`;
          } else if (data.type === 'sub') {
            valorEl.textContent = `¡Nueva sub: ${data.user}!`;
          }
        } catch (e) {
          console.error(e);
        }
      };

      // Reconexión automática si el servidor se reinicia
      ws.onclose = () => setTimeout(connectWS, 3000);
    }

    connectWS();
  </script>
</body>
</html>
```

---

## 4. Cómo Crear un Nuevo Tema Visual

Los temas del sistema se basan en **variables CSS personalizadas**. Cambiar el tema altera instantáneamente la paleta de colores de todos los marcos, paneles, badges y barras.

### 4.1. Variables Principales de Color
| Variable CSS | Propósito | Ejemplo Maker |
| :--- | :--- | :--- |
| `--color-bg-dark` | Fondo general de escenas y paneles | `#191D21` (Grafito oscuro) |
| `--color-text-light` | Texto principal de títulos | `#F2EEE5` (Blanco hueso) |
| `--color-accent-cyan` | Color de acento primario (marcos activos, bordes) | `#57D6C4` (Turquesa electrónico) |
| `--color-accent-orange` | Color de acento secundario (alertas, alertas secundarias) | `#FF783F` (Naranja de acento) |
| `--color-panel-bg` | Fondo opaco de tarjetas | `#2E363B` |
| `--color-text-dim` | Texto secundario o etiquetas técnicas | `#8B969C` |
| `--color-border-cyan` | Color del borde de tarjetas con transparencia | `rgba(87, 214, 196, 0.35)` |

### 4.2. Arquitectura de Temas Modulares, Restauración y Asignación por Overlay

A partir de la versión modular, los temas **ya no se editan a mano en un único archivo estático**, sino que se gestionan como carpetas independientes dentro de `app/streamthemes/<pack_id>/styles/<theme_id>/` con compilación automática en `common/themes.css`.

### Estructura en Disco de un Tema
```
app/streamthemes/<pack_id>/styles/<theme_id>/
├── theme.json           # Ajustes activos (nombre, badge, colores hex, tipografías, anclaje de chat)
├── style.css            # Código CSS activo aplicado a body[data-theme="..."]
├── theme.default.json   # 🛡️ Copia de seguridad original de fábrica (ajustes iniciales)
└── style.default.css    # 🛡️ Código CSS original de fábrica para restauración
```

---

### Mecanismo de Restauración de Fábrica (`POST /api/themes/restore`)
Para garantizar que cualquier modificación errónea de color o CSS pueda revertirse con un clic:
1. Al crear o inicializar un tema, el backend genera `theme.default.json` y `style.default.css`.
2. Si el usuario modifica el CSS o los colores en el panel web y luego pulsa **`🔄 Restablecer Original`**:
   * El cliente ejecuta `API.restoreTheme(packId, themeId)`.
   * El endpoint `POST /api/themes/restore` lee la copia `.default` y sobrescribe `theme.json` y `style.css`.
   * Llama a `sync_common_themes_css()`, re-compilando `common/themes.css`.
   * Emite el evento WebSocket `theme_change` para actualizar OBS en vivo.

---

### Asignación de Temas Independientes por Overlay (`POST /api/themes/overlay-assignment`)
Cada overlay de OBS Studio tiene elementos gráficos y finalidades distintas:
* El estado global se almacena en `themes_state.json`:
```json
{
  "activePack": "Maker_Theme_Pack",
  "activeTheme": "maker",
  "overlayThemes": {
    "game": "cyberpunk",
    "maker-desk": "maker",
    "maker-pc": "terminal",
    "print-machine": "print",
    "print-design": "print",
    "chill": "chill",
    "startingSoon": "synthwave",
    "beRightBack": "synthwave",
    "ending": "synthwave"
  }
}
```
* Cada overlay carga su tema asignado mediante `common/overlay.js`:
  1. Detecta su escena automáticamente a partir de la ruta URL (`/game/`, `/chill/`, `/maker/desk/...`).
  2. Comprueba en primer lugar si la URL tiene un parámetro prioritario `?theme=...`. Si existe, lo aplica síncronamente al `<body>` para evitar cualquier parpadeo en OBS.
  3. Si no hay parámetro en la URL, consulta su estilo en `overlayThemes` **sólo si `overlayThemeExplicit`** lo marca como asignación explícita.
  4. Si no tiene asignación explícita y `globalThemeActive` está activo, usa `activeTheme`; si no, su tema nativo de fábrica (`DEFAULT_OVERLAY_THEMES`).
  5. Escucha eventos WebSocket dedicados `overlay_theme_change` para actualizarse en caliente si el streamer cambia el selector de esa escena en el panel.

---

### Mapeo Canónico de Estilos de Fábrica (`DEFAULT_OVERLAY_THEMES`)
Tanto en el backend (`server/services/theme_defaults.py`) como en el frontend (`alerts/js/themes/01-state.js`):

```javascript
const DEFAULT_OVERLAY_THEMES = {
  'game': 'cyberpunk',            // Gameplay: Cyberpunk Neon
  'maker': 'maker',               // Escena Principal: tema Maker
  'maker-desk': 'maker',          // Escena Principal (cámara + webcam)
  'maker-pc': 'terminal',         // Pantalla PC (captura + webcam)
  'print': 'print',               // Impresión 3D Plotter: Print & Vinilo
  'print-machine': 'print',       // Cámara Secundaria (proceso/acción)
  'print-design': 'print',        // Pantalla Diseño (app full screen)
  'chill': 'chill',               // Charla / Just Chatting: Chill Lavender
  'startingSoon': 'synthwave',    // Pantalla Inicio: Synthwave Retro
  'beRightBack': 'synthwave',     // Pausa Técnica: Synthwave Retro
  'ending': 'synthwave'           // Pantalla Despedida: Synthwave Retro
};
```
Permite que el panel detecte modificaciones con `(assignedThemeId !== defaultThemeId)`, muestre insignias de fábrica (`⭐ Original de fábrica`) o advertencias (`⚠️ Personalizado`), y ofrezca botones de restauración individual y global.

---

### Endpoints REST de la API de Temas
| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/themes/packs` | Devuelve todos los packs, temas modulares y el mapeo `overlayThemes`. | — |
| `POST` | `/api/themes/packs/create` | Crea una nueva carpeta de pack en `streamthemes/<pack_id>/`. | `{"name", "icon", "badge", "description"}` |
| `POST` | `/api/themes/create` | Crea un nuevo tema dentro de un pack. | `{"packId", "name", "accentCyan", ...}` |
| `POST` | `/api/themes/save` | Guarda cambios visuales y CSS en disco y recompila `common/themes.css`. | `{"packId", "id", "css", ...}` |
| `POST` | `/api/themes/restore` | ↺ Restaura el tema a su copia original de fábrica (`theme.default.json`). | `{"packId", "themeId"}` |
| `POST` | `/api/themes/overlay-assignment` | Asigna un estilo visual o forma física a una escena específica. | `{"overlayKey", "themeId", "shapeId"}` |
| `POST` | `/api/themes/apply` | Activa un estilo visual global para todas las fuentes de OBS. | `{"theme", "pack"}` |
| `POST` | `/api/themes/apply-shape` | Aplica una de las 20 formas físicas globalmente a todas las escenas. | `{"shape": "maker_blueprint"}` |
| `POST` | `/api/themes/backdrop` | Guarda y sincroniza el fondo/apertura decorativo para una escena. | `{"overlayKey", "backdrop"}` |
| `POST` | `/api/themes/chat-anchor` | Alterna el anclaje de chat o activa un tema derivado para chat. | `{"packId", "themeId", "anchored"}` |

---

### Endpoints REST de Fusiones (Fusions API)
| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fusions` | Lista todas las fusiones configuradas con sus overlays asignados. | — |
| `POST` | `/api/fusions` | Crea o actualiza una fusión de overlays híbrida. | `{"id", "name", "icon", "description", "scenes", "defaultTheme", "defaultShape"}` |
| `GET` | `/api/fusions/{id}` | Obtiene los detalles de una fusión concreta. | — |
| `DELETE` | `/api/fusions/{id}` | Elimina una fusión por su identificador. | — |
| `POST` | `/api/fusions/{id}/apply-theme` | Aplica en lote un tema visual a todos los overlays de la fusión. | `{"themeId": "cyberpunk"}` |
| `POST` | `/api/fusions/{id}/apply-shape` | Aplica en lote una forma física a todos los overlays de la fusión. | `{"shapeId": "gamer_mecha"}` |

> Los datos de fusiones se persisten en `app/fusions.json` (lista con `scenes`, `defaultTheme` y `defaultShape` por fusión).

---

### Endpoints REST de Widgets y Feeds RSS
| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/widgets/config` | Diccionario completo unificado de configuración de widgets. | — |
| `POST` | `/api/widgets/config` | Guarda la configuración global de widgets. | Objeto JSON con ajustes por widget |
| `GET` | `/api/widgets/{widget}/config` | Obtiene la configuración de un widget específico (chat, goal, timer, promo, ticker). | — |
| `POST` | `/api/widgets/{widget}/config` | Guarda la configuración del widget consultado. | Ajustes del widget |
| `GET/POST` | `/api/widgets/action` | Ejecuta acciones de widget (chat, goal, timer, shoutout/promo, ticker). | `?widget=...&action=...` |
| `GET` | `/api/rss/feed` | Parsea feeds RSS y Atom para el cintillo de noticias (Ticker). | `?url=https%3A%2F%2F...` |

---

### Endpoints REST para Stream Deck / Ajazz / OpenDeck (`/api/deck/*`)
| Método | Ruta | Descripción | Parámetros (Query o JSON) |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/deck/status` | Estado del sistema (tema activo, escenas, overlays, timer). | — |
| `GET/POST` | `/api/deck/trigger` | Dispara un meme o sonido por ID en OBS. | `?id=trigger_id` (`&user=Nombre`) |
| `GET/POST` | `/api/deck/theme` | Cambia el tema visual global o asigna a una escena. | `?id=cyberpunk` (`&pack=Gamer_Pro_Pack`) |
| `GET/POST` | `/api/deck/timer` | Controla el cronómetro / temporizador del stream. | `?action=start\|pause\|reset` (`&seconds=300`) |
| `GET/POST` | `/api/deck/alert` | Dispara una alerta de prueba simulada en OBS. | `?type=follow\|sub\|raid\|cheer` (`&user=Nombre&amount=...`) |
| `GET/POST` | `/api/deck/explode` | Lanza lluvia de confeti y emoticonos en pantalla. | `?emoji=🎉&count=40` |
| `GET/POST` | `/api/deck/widget` | Ejecuta acciones directas sobre widgets. | `?widget=promo\|goal\|ticker\|chat&action=...` |
| `GET/POST` | `/api/deck/knob` | Mandos giratorios, diales y encoders de hardware. | `?knob=timer\|theme\|goal\|fx&action=rotate\|next\|prev&ticks=1` |
| `GET` | `/api/deck/actions` | Catálogo autodescriptivo con todos los triggers y acciones en JSON. | — |

---

### 4.3. Skin de componentes: una convención, todos los componentes

**Objetivo:** un widget o una alerta se programa **una sola vez**, con su aspecto base, y después adopta **la apariencia que se le asigne** sin escribir CSS nuevo. Un tema nuevo **solo declara tokens**, y su estilo llega automáticamente a escenas, widgets y alertas y aparece solo en los menús del panel (el catálogo y el mapa de arquetipos se derivan de disco).

Lo hacen posible `common/oss-skin.css` (capa compartida) y `common/oss-skin.js` (resuelve el arquetipo del tema con el mapa `themeArchetypes` que el servidor publica en `config.js`).

| Token | Se declara en | Qué controla en los componentes |
| :--- | :--- | :--- |
| `--skin-panel-radius`, `--skin-panel-clip` | `common/styles.css` (por arquetipo) | Radio y recorte del panel mientras no haya forma física elegida |
| `--skin-panel-decor` (+ `-position`, `-size`, `-repeat`) | `common/styles.css` (por arquetipo) | Decoración de esquinas y marcas técnicas, pintada con `background` |
| `--skin-panel-pattern` (+ `-position`, `-size`) | `streamthemes/<Pack>/styles/<tema>/style.css` | Textura del pack (ej. cuadrícula blueprint del pack Maker) |
| `--frame-border-width`, `--frame-border-style`, `--color-border-cyan`, `--panel-shadow`, `--theme-glow` | tema | Marco, halo y sombra de la tarjeta |
| `--skin-font-display`, `--skin-badge-radius` | `common/styles.css` (por arquetipo) | Tipografía de insignias y títulos marcados con `data-oss-badge` / `data-oss-panel-title` |

**Contrato del componente** (lo único que debe cumplir quien lo programa):
1. Marcar su raíz con `data-oss-shape-target` o `data-oss-panel="true"`.
2. Enlazar `common/oss-skin.css` y `common/oss-skin.js`.
3. Nada más: no necesita conocer ningún pack ni tema.

**Prioridad** (de mayor a menor): forma física (`body[data-theme-shape]`) → skin de arquetipo → aspecto base del componente. **Sin tema asignado no se aplica ni una regla**, así que cada componente conserva su look original.

> **Nota sobre `!important`**: `common/oss-skin.css` solo lo usa en marco y decoración, porque varios widgets aplican su aspecto con CSS inyectado o estilos en línea y, sin ello, la apariencia asignada se quedaba por el camino. El radio (`--skin-panel-radius`) **nunca** lo lleva: la forma física siempre manda. Hay test que lo verifica (`tests/test_component_skin_contract.py`).

**Añadir una apariencia nueva (checklist)**
1. Crea `streamthemes/<Pack>/styles/<tema>/theme.json` y `style.css` con sus tokens.
2. Declara el arquetipo del pack (`pack.json → "archetype"`) o deja que se infiera del nombre.
3. Nada más: aparece en los menús (escenas, widgets y alertas) y su apariencia se aplica a todos los componentes **a la vez**. No hay listas que editar.

---


## 5. Comunicación en Tiempo Real

El sistema utiliza un WebSocket bidireccional servido por `server.py` en el puerto `8080` en la ruta `/ws`.

### Tipos de Mensajes Transmitidos

#### 1. Nuevo Seguidor
```json
{
  "type": "follow",
  "user": "NombreDeUsuario",
  "title": "¡NUEVO SEGUIDOR!",
  "message": "Se une a la comunidad del stream",
  "accent": "#57D6C4"
}
```

#### 2. Nueva Suscripción
```json
{
  "type": "sub",
  "user": "NombreDeUsuario",
  "title": "¡NUEVA SUSCRIPCIÓN!",
  "message": "Suscrito con Nivel 1",
  "accent": "#FF783F"
}
```

#### 3. Bits / Cheers
```json
{
  "type": "bits",
  "user": "NombreDeUsuario",
  "bits": 100,
  "title": "¡100 BITS!",
  "message": "Para financiar nuevos proyectos",
  "accent": "#F59E0B"
}
```

#### 4. Canje de Puntos de Canal (TriggerFyre)
```json
{
  "type": "trigger",
  "user": "NombreDeUsuario",
  "reward_title": "Alerta Raspberry",
  "title": "¡Cacharreo con Raspberry Pi!",
  "message": "Conectado al stream",
  "video_url": "/media/videos/raspberry.webm",
  "sound_url": "/media/sounds/alerta.mp3",
  "duration": 5000,
  "accent": "#89B4FA"
}
```

#### 5. Explosión de Emoticonos
```json
{
  "type": "explode_emotes",
  "emoji": "🎉",
  "count": 45
}
```

#### 6. Control de Temporizador
```json
{
  "type": "timer_control",
  "action": "start",
  "seconds": 300,
  "title": "DESCANSO (5 MIN)"
}
```

#### 7. Cambio de Tema en Vivo (`theme_change`)
Disparado cuando pulsas **`🎨 Aplicar Estilo en OBS`** en cualquier tema del panel:
```json
{
  "type": "theme_change",
  "theme": "golden_glory"
}
```
*Todas las fuentes de OBS que incluyan `common/overlay.js` actualizan el atributo `data-theme="golden_glory"` en vivo y reciben las variables CSS compiladas en `common/themes.css`.*

#### 8. Actualización de Textos de Escena (`overlay_texts_update`)
Disparado cuando guardas cambios en los textos de cualquier escena desde el modal del panel:
```json
{
  "type": "overlay_texts_update",
  "texts": {
    "maker": { "projectName": "NAS CON RASPBERRY PI", "currentPhase": "02 MONTAJE" },
    "chill": { "subtitle": "CHARLA / COMUNIDAD", "topic": "Proyectos de la semana" }
  }
}
```
*Las escenas actualizan sus selectores (`.project-name-value`, `.brand-name`, etc.) al instante sin recargar la página en OBS.*

---

## 6. TriggerFyre Local: Vídeos, Memes, Audio Mixer y Puntos de Canal

A diferencia de TriggerFyre en la nube, donde tienes límites de almacenamiento y dependes de servidores externos, aquí **todo se ejecuta en tu propio ordenador con tus archivos locales**:

### 1. Creación de Recompensas de Twitch Directamente desde el Panel
Ya no necesitas ir a la web de Twitch para configurar recompensas:
- Pulsa el botón **✨ Crear Recompensa en Twitch** en la cabecera.
- Escribe el **Título**, el **Precio en Puntos de Canal** (ej: 250 pts), el color del icono y la descripción.
- Pulsa **🚀 Crear Recompensa en Twitch**: el panel llamará a la API Helix de Twitch, la creará en tu canal al instante y la dejará seleccionada para asociarle el meme o sonido.

### 2. Modos de Activación y Permisos de Chat ("Sí o Sí Puntos")
- **🪙 Solo Puntos (Sí o sí puntos)**: Bloquea el comando de chat. Ningún espectador podrá activarlo gratis; solo quienes canjeen sus puntos de canal en Twitch podrán dispararlo.
- **💬 Solo Comando de Chat**: Activación libre mediante comando en el chat (ej. `!susto`).
- **⚡ Ambos (Puntos y Comando)**: Se activa tanto por canje de puntos como por comando.
- **Permisos de Comando**: Configura quién tiene autorización para ejecutar el comando:
  - 👥 Todos los espectadores
  - ⭐ Solo Suscriptores del canal
  - 💎 Suscriptores, VIPs y Moderadores
  - 🛡️ Solo Moderadores y Streamer
  - 👑 Solo el Streamer (Tú)
- **Cooldown**: Tiempo de espera entre usos (0 a 120 segundos) para evitar saturación del stream.

### 3. Mezclador Multimedia Multi-Capa (Vídeo / GIF + Audio Independiente + Rótulo)
Puedes combinar libremente:
- **Capa Visual**: Vídeo WebM con canal alfa / MP4, GIF animado / PNG, o modo Solo Audio. Con ajuste de escala (Pequeño, Estándar, Grande o Pantalla Completa).
- **Capa de Audio Independiente**: Puedes usar el audio del propio vídeo, un archivo MP3/WAV externo, o efectos sintéticos integrados (😱 Susto, 💥 Boom, 🪙 Moneda, 🎺 Fanfarria, 🔔 Campana), con control de volumen independiente (0-100%).
- **Capa de Rótulo / Banner Flotante**: Muestra un banner con texto personalizado (soporta `{user}` para sustituirlo por el nombre de quien lo activó) y duración en segundos.

### 4. Cuadro Interactivo 16:9 (Arrastrar para Posicionar & Modo Aleatorio)
- **Arrastrar libremente**: Haz clic o arrastra el recuadro interactivo sobre el monitor 16:9 para ubicar el meme en las coordenadas exactas de la pantalla (`custom_x`, `custom_y`).
- **Preajustes rápidos**: Botones para encajar en el Centro, Abajo Derecha, Abajo Izquierda, Arriba Derecha y Arriba Izquierda.
- **🎲 Modo Aleatorio (Random)**: Cada vez que un espectador active el trigger, el meme aparecerá en una coordenada aleatoria diferente por toda la pantalla.

### 5. Monitor de Previsualización en Vivo (16:9)
- El panel integra su propia pantalla de streaming 16:9. Al pulsar **▶️ Probar** en cualquier trigger o **▶️ Previsualizar Aquí** en el editor, verás la animación, escucharás el audio y verás el banner en tiempo real en tu pantalla sin necesidad de cambiar de pestaña. Al mismo tiempo, se emite a OBS Studio para sincronización perfecta.

---

## 7. Buenas Prácticas para OBS Studio

1. **Resolución de Lienzo**: Configura la resolución base de tu lienzo en OBS a **1920 × 1080**.
2. **Orden de Capas**:
   - 🔝 **Capa Superior**: Alertas y Triggers (`http://localhost:8080/alerts/index.html` - 1920×1080).
   - 🔼 **Capa Media**: Chat o Widgets específicos (`/widgets/chat/index.html`).
   - 🔲 **Capa Base de Escena**: Tu escena (por ej. `/scenes/maker-desk/index.html` - 1920×1080).
   - 📷 **Capas Inferiores**: Tus cámaras web, capturas de ventana (Inkscape, VS Code, etc.) alineadas detrás de los marcos.
3. **Propiedades de la Fuente Navegador en OBS**:
   - Activar: *Controlar audio vía OBS* (si quieres ajustar el volumen individual de la fuente en el mezclador).
   - Activar: *Apagar fuente cuando no esté visible* (ahorra recursos cuando cambias a otra escena).
   - Frecuencia de actualización: 60 FPS (para animaciones super suaves).

---

## 8. Funciones Programadas en Overlays y Menús Flotantes Draggables

### 8.1. Filosofía: Overlays como Aplicaciones Interactivas de Emisión
En **Open Stream Suite**, los overlays no son simples plantillas estáticas con texto fijo; son **aplicaciones web de emisión vivas** ejecutadas en el navegador integrado de OBS Studio o en pantalla completa en el navegador de control.

Los overlays pueden incorporar:
- Cronómetros con registro de vueltas y deltas en tiempo real.
- Temporizadores regresivos sincronizados con barras de progreso SVG/CSS.
- Gestores de fases de proyecto con selección activa.
- Conmutadores de rejilla de cámaras para podcast y entrevistas.
- Banners de estado de partida clicables.

---

### 8.2. Regla de Oro: Todo Menú Flotante DEBE ser Draggable (`makeDraggable`)
> [!IMPORTANT]
> **Principio de No Obstrucción**: Un menú flotante, HUD o panel de control **nunca debe tapar** permanentemente la cámara, el chat, el gameplay o un texto editable que el streamer necesite visualizar o editar.

Por ello, todo panel flotante (`#open-stream-suite-screen-hud`, `#oss-countdown-control`, `#oss-speedrun-control`, `#oss-brb-phrases-control`) debe implementarse como **draggable**:

1. **Helper Universal `makeDraggable(panel, handleSelector)`**:
   Disponible de forma global en `common/overlay.js`:
   ```javascript
   function makeDraggable(panel, handleSelector) {
     if (!panel) return;
     const handle = handleSelector ? (panel.querySelector(handleSelector) || panel) : panel;
     handle.style.cursor = 'grab';
     handle.style.touchAction = 'none';

     let isDragging = false;
     let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

     handle.addEventListener('pointerdown', (e) => {
       if (e.target.closest('button, input, select, textarea, [contenteditable="true"]')) return;
       isDragging = true;
       handle.style.cursor = 'grabbing';
       handle.setPointerCapture(e.pointerId);

       const rect = panel.getBoundingClientRect();
       startX = e.clientX;
       startY = e.clientY;
       initialLeft = rect.left;
       initialTop = rect.top;

       panel.style.bottom = 'auto';
       panel.style.right = 'auto';
       panel.style.left = initialLeft + 'px';
       panel.style.top = initialTop + 'px';
       e.preventDefault();
     });

     handle.addEventListener('pointermove', (e) => {
       if (!isDragging) return;
       const dx = e.clientX - startX;
       const dy = e.clientY - startY;
       let nextX = initialLeft + dx;
       let nextY = initialTop + dy;

       // Mantener dentro del viewport
       const pWidth = panel.offsetWidth;
       const pHeight = panel.offsetHeight;
       nextX = Math.max(10, Math.min(window.innerWidth - pWidth - 10, nextX));
       nextY = Math.max(10, Math.min(window.innerHeight - pHeight - 10, nextY));

       panel.style.left = nextX + 'px';
       panel.style.top = nextY + 'px';
     });

     const stopDrag = (e) => {
       if (!isDragging) return;
       isDragging = false;
       handle.style.cursor = 'grab';
       try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
     };

     handle.addEventListener('pointerup', stopDrag);
     handle.addEventListener('pointercancel', stopDrag);
   }
   ```

2. **Tirador Visual Obligatorio**:
   - Cada ventana o HUD debe incluir en su cabecera un tirador visual (`.hud-drag-handle`) con el icono `⋮⋮` o título de arrastre y estilo CSS:
   ```css
   .hud-drag-handle {
     cursor: grab;
     user-select: none;
     touch-action: none;
     display: flex;
     align-items: center;
     gap: 6px;
   }
   .hud-drag-handle:active {
     cursor: grabbing;
   }
   ```

---

### 8.3. Catálogo de Funciones Programadas Nativas

| Pack / Escena | Función Programada | Controles / HUD Interactivo |
|---|---|---|
| **Gamer Pro (`gamer_speedrun`, dir `speedrun_split/`)** | Cronómetro con milisegundos, tiempos de vuelta (Splits), registro dinámico de tramo, cálculo de deltas (`+` / `-`) y atajo `Espacio`. | `#oss-speedrun-control` flotante con `[▶/⏸ Iniciar]`, `[⚡ Split]`, `[⏮ Prev]`, `[🔄 Reset]`. |
| **Lo-Fi / Synthwave (`cozy_starting`, `oss_starting`, `gamer_starting`)** | Temporizador regresivo sincronizado milisegundo a milisegundo con barra SVG/CSS (`.tech-progress-fill`). Pausa con clic en el reloj gigante. | `#oss-countdown-control` con presets (25m Pomodoro, 50m, 5m descanso, 10m) y micro-ajustes `+1m` / `-1m`. |
| **Maker Desk (`maker-desk`)** | Selector de fase de taller interactivo. Al hacer clic sobre cualquier fase (`01 PLAN`, `02 MONTAJE`, etc.) se activa en el lienzo y actualiza la ficha técnica. | HUD con conmutación dinámica de fase, botón `➕ Añadir Fase` y `🗑️ Eliminar Fase`. |
| **Open Stream (`oss_podcast`, dir `podcast_talk/`)** | Conmutador dinámico de rejilla multicámara (2, 3 o 4 invitados) con re-distribución CSS Grid automática y rótulos editables. | Botones de distribución en HUD: `[👥 2 Cams]`, `[👥 3 Cams]`, `[👥 4 Cams]`. |
| **Gameplay HUD & Victory Clutch** | Clic directo en el banner para alternar estados (`VICTORY`, `DEFEAT`, `ACE`, `MATCH POINT`) y en badges de estadísticas (`COMPETITIVE`, `RANKED`, FPS). | Eventos clic directos sobre los elementos en pantalla con persistencia de estado. |

---

### 8.4. Arquitectura de Edición en Caliente (`common/overlay.js`)

1. **Pausa Reactiva de Intervalos (`window.__OSS_IS_EDITING__`)**:
   - Cuando el usuario hace clic o escribe dentro de un campo editable (`contenteditable="true"`), se activa el flag global `window.__OSS_IS_EDITING__ = true`.
   - Las funciones periódicas (como la rotación de frases de "Ahora Vuelvo") comprueban este flag y suspenden cualquier alteración del DOM para no perturbar al streamer mientras teclea.
2. **Delegación de Eventos en `document`**:
   - Las filas generadas dinámicamente (`.split-row`, `.phase-item`, etc.) usan escuchas de eventos delegadas:
   ```javascript
   document.addEventListener('click', (e) => {
     const splitRow = e.target.closest('.split-row');
     if (splitRow) {
       // Activar split o editar tramo sin romper escuchas tras re-renders
     }
   });
   ```
3. **Persistencia y Difusión WebSocket**:
   - Al pulsar `💾 Guardar` en el HUD, se extraen los valores modificados del DOM y se envían a:
     `POST /api/overlays/texts`
   - El backend actualiza `overlay_texts_config.json` y emite el evento WebSocket `overlay_texts_update` a todas las ventanas abiertas en OBS Studio en tiempo real.

---

### 8.5. Paso a Paso: Cómo Crear un Nuevo Overlay con Lógica Interactiva

1. **Estructura HTML con Contrato Semántico Universal**:
   Añade tu contenedor principal y los atributos semánticos `data-oss-*` para que el motor aplique automáticamente bordes, formas y áreas de transparencia:
   ```html
   <link rel="stylesheet" href="../../../common/themes.css">
   <link rel="stylesheet" href="style.css">
   ...
   <!-- Marco de cámara compatible con cualquier forma -->
   <div class="camera-frame" data-oss-cam="true">
     <div class="cam-viewport" data-oss-viewport="true"></div>
     <div class="cam-label" data-oss-cam-label="true">
       <span data-text-key="my_scene.camLabel">CÁMARA PRINCIPAL</span>
     </div>
   </div>

   <!-- Tarjeta interactiva con texto editable aislado -->
   <div class="interactive-card" data-oss-panel="true" id="my-custom-widget">
     <div class="widget-header">
       <span class="widget-title" data-text-key="my_scene.title">ESTADO DE SESIÓN</span>
       <span class="badge" data-text-key="my_scene.badge">EN CURSO</span>
     </div>
     <div class="counter-display" id="session-counter">00:00</div>
   </div>
   <script src="../../../config.js"></script>
   <script src="../../../common/overlay.js"></script>
   ```

2. **Aislamiento de Claves de Texto (`data-text-key`)**:
   - Asigna siempre un prefijo único a las claves de tu escena (ej. `my_scene.title`, `my_scene.camLabel`).
   - El motor `dom-injector.js` y `05a-extract-texts.js` detecta automáticamente cualquier elemento con `[data-text-key]` para inyección, edición en caliente y guardado en `POST /api/overlays/texts`.

3. **Inclusión de Menú Draggable (si procede)**:
   Si tu overlay requiere un panel de configuración o control flotante, constrúyelo con una cabecera `.hud-drag-handle`, arráncalo oculto (`display: none;`) y llama a:
   ```javascript
   makeDraggable(document.getElementById('my-custom-control'), '.hud-drag-handle');
   ```

4. **Sincronización de Estado en `overlay_texts_config.json`**:
   Define la clave de tu escena en `overlay_texts_config.json` y `overlay_texts_config.en.json` para que guarde y restaure tanto los textos como los estados funcionales (índice activo, contadores, flags).

---

### 8.6. Contrato Universal de Compatibilidad Semántica (`data-oss-*`) y Adaptabilidad de Relación de Aspecto

Para garantizar el desacoplamiento total entre escenas y estilos:

1. **Tabla de Atributos Semánticos Obligatorios**:
   - `data-oss-cam="true"`: Contenedor principal de la cámara o captura.
   - `data-oss-viewport="true"`: Ventana interior transparente para la fuente de OBS y el motor de aperturas SVG.
   - `data-oss-cam-label="true|bar|bottom"`: Rótulo identificador de la cámara. Usar `"bar"` o clase `.cam-bottom-bar` para barras inferiores de ancho completo (chin bars).
   - `data-oss-panel="true"`: Paneles de chat, stats, podios o listas.
   - `data-oss-bar="top|bottom|left|right"`: Barras de cabecera superior, cintillos/noticias inferiores o columnas laterales.
   - `data-oss-orientation="horizontal|vertical"`: Orientación del elemento. Se autodetecta dinámicamente mediante el aspect-ratio (`height > width * 1.05` -> `vertical`, caso contrario `horizontal`) y el tipo de barra (`top|bottom` -> `horizontal`, `left|right` -> `vertical`), o puede declararse explícitamente en el HTML para orientar adornos y VU meters.
   - `data-text-key="seccion.campo"`: Clave de texto aislada para edición interactiva y persistencia.

2. **Parámetros URL de Control para OBS Studio**:
   - `?theme=<id>`: Fuerza un estilo cromático específico (ej. `?theme=cyberpunk`).
   - `?shape=<id>`: Fuerza una de las 20 formas físicas (ej. `?shape=gamer_mecha`).
   - `?lock=1` o `?lockTheme=1`: Bloquea permanentemente la escena en OBS Studio a los parámetros de la URL, ignorando cualquier cambio global recibido por WebSocket.
   - `?lang=en` o `?lang=es`: Reservado — solo lo honra el endpoint `/api/overlays/texts`; las escenas aún no lo aplican.

3. **Fluidez en Cualquier Relación de Aspecto y Catálogo de 20 Formas Físicas**:
   - El motor soporta 20 formas físicas universales (`data-theme-shape`), agrupadas en 6 familias:
     - **☕ Cozy Lo-Fi & Arte**: `cozy_polaroid`, `cozy_canvas`, `cozy_soft`.
     - **🎮 Gamer Pro & Esports**: `gamer_mecha`, `gamer_tactical_hud`, `gamer_stealth`, `gamer_hex_shield`, `gamer_cyber_glitch`, `gamer_arcade_retro`.
     - **🛠️ Maker & Taller**: `maker_blueprint`, `maker_workbench`, `maker_circuit_pcb`.
     - **⚡ Open Stream Suite**: `openstream_glass`, `openstream_studio`.
     - **📜 Fantasía, Rol & Terror**: `fantasy_parchment`, `fantasy_runic_stone`, `gothic_vampire`.
     - **💥 Cómic, Pop Art & Retro TV**: `comic_manga_action`, `pop_synth_neon`, `vintage_crt_monitor`.
   - Las formas físicas operan mediante dimensiones relativas (`calc(100% - 24px)`) y pseudo-elementos anclados (`top: 6px; left: 6px;`).
   - Soportan de manera fluida cámaras panorámicas 16:9, formatos clásicos 4:3, monitores ultra-panorámicos 21:9 y transmisiones verticales 9:16 (TikTok / YouTube Shorts) sin distorsionar chaflanes ni desplazar los brackets de esquina.

4. **Regla de Geometría Segura contra `clip-path`**:
   - Cuando un marco usa recortes poliédricos (`gamer_mecha`, `gamer_tactical_hud`), los elementos hijos nunca deben colocarse en coordenadas negativas (`top: -12px;`, `bottom: -36px;`).
   - Se deben usar siempre insets interiores positivos (`top: 10px; left: 14px;`) o padding para garantizar visibilidad total.

5. **Paneles Flotantes Bajo Demanda (No Invasivos)**:
   - Los paneles interactivos flotantes (`oss-countdown-control`, `oss-speedrun-control`, `oss-brb-phrases-control`) arrancan ocultos (`display: none;`) para no tapar componentes laterales (splits, notas, tareas).
   - Se activan y cierran desde los botones contextuales de la barra HUD (`⏱️ Temporizador`, `⚡ Splits`, `🔄 Frases BRB`) o con el botón `✕` de la ventana flotante.

---

## 9. Unificación de Escenas de Packs con Arquetipos Físicos y Fusiones Híbridas

### 9.1. Desacoplamiento entre Arquetipo Geométrico y Paleta de Color
Para permitir que las escenas de diferentes packs convivan en armonía y puedan combinarse en **Fusiones (Fusions)** sin perder su identidad visual, la arquitectura separa estrictamente la **geometría física del marco** de la **paleta cromática**:

1. **Arquetipos Geométricos Físicos (`data-pack`)**:
   Inyectados automáticamente en `document.body.dataset.pack` por `common/overlay.js`:
   - `body[data-pack="cozy"]`: Enmarca las cámaras y paneles con esquinas redondeadas suaves (`--cozy-frame-radius: 28px`), polaroids y cápsulas píldora (`50px`).
   - `body[data-pack="gamer"]`: Aplica chaflanes y cortes poliédricos a 45° (`clip-path: polygon(...)`), estética sci-fi HUD y biseles esports.
   - `body[data-pack="maker"]`: Aplica soportes y corchetes angulares de esquina técnica, cotas métricas y tipografía mono/tech.
   - `body[data-pack="oss"]`: Diseños rectos pulidos y translúcidos.

2. **Paletas de Color de Tema (`.theme-<id>`)**:
   Definidas en `common/themes.css`. Gobiernan exclusivamente los tokens cromáticos (`--color-bg`, `--color-accent`, `--color-border`, etc.).
   Esto permite que una escena de taller Maker o una escena Cozy adopten colores como `synthwave`, `neon_glow`, `matrix` o `candy` sin romper sus esquinas ni sus siluetas físicas.

### 9.2. Armonía con las Fusiones Híbridas (Fusions)
Las **Fusiones** (pestaña `⚡ Fusiones de Overlays`) permiten agrupar escenas procedentes de packs completamente distintos (ej. charla Cozy + cámara cenital Maker + victoria Gamer) en una única colección:
- Al aplicar un tema en lote a una Fusión (`POST /api/fusions/{id}/apply-theme`), todas las escenas comparten el mismo esquema cromático.
- Sin embargo, cada escena mantiene su forma física original correspondiente a su pack de procedencia gracias a `data-pack`.
- El resultado es una suite de stream visualmente cohesiva y elegante con **cero conflictos entre packs**.

### 9.3. Copia de Seguridad Preventiva de Packs
Todos los packs originales en su estado previo a la unificación geométrica se encuentran respaldados íntegramente en:
`backups/packs_backup/`
Contiene copias recursivas de `Cozy_LoFi_Pack`, `Gamer_Pro_Pack`, `Maker_Theme_Pack`, `Open_stream_Pack` y `themes_state.json`.

### 9.4. Enlaces de Chat OBS por Perfil de Escena
Para complementar la unificación visual de escenas, el widget de chat dispone de su propio gestor de perfiles en la pestaña **🔗 Enlaces OBS por Estilo**:
- Cada escena en OBS puede llevar su propia fuente de navegador de chat con el parámetro `?profile=<id>` (ej. `?profile=cozy_lofi`, `?profile=gamer_pro`, `?profile=maker_glass`).
- Cualquier ajuste realizado en el editor visual se sincroniza de forma reactiva a OBS sin necesidad de recargar la fuente.

### 9.5. Motor Universal de Apertura de Fondos y Recortes (Backdrop Aperture)
El archivo `common/overlay/backdrop-aperture.js` (`window.OSSAperture`) permite vestir las escenas de OBS con fondos decorativos ricos (patrones textiles, mallas tácticas, degradados o imágenes personalizadas) **sin tapar el contenido de las capturas de OBS** que se sitúan detrás de la capa del navegador:
- **Máscara SVG Dinámica**: Mediante un `<mask id="oss-aperture-mask">`, el motor calcula en tiempo real las coordenadas exactas (`getBoundingClientRect`), radios de borde (`border-radius`) y recortes poligonales (`clip-path`) de todos los contenedores de cámara y juego (`[data-cutout="true"]`, `[data-oss-cam]`).
- **Persistencia por Escena**: La selección de fondo se guarda a través de `POST /api/themes/backdrop` y se persiste en `themes_state.json` bajo la clave `"backdrops"`.
- **Sincronización en Caliente**: Al cambiar o restaurar un fondo desde el HUD flotante, el backend emite el evento WebSocket `overlay_backdrop_change`, actualizando instantáneamente la vista en OBS Studio.

### 9.6. Modo Auto Inteligente y Aislamiento de Textos (`customScenes`)
1. **Modo `auto` en Formas Físicas**:
   - **Escena Nativa**: Si el tema seleccionado pertenece al pack nativo de la escena (ej. tema Maker en escena Maker Desk), el modo `auto` respeta la geometría original (`effectiveShape = 'original'`) diseñada específicamente a mano para esa escena.
   - **Crossover Cross-Pack**: Si se aplica un tema de un pack diferente (ej. tema Gamer Pro sobre escena Maker Desk), el modo `auto` adopta la insignia física emblemática del nuevo arquetipo (`cozy_polaroid`, `gamer_mecha`, `maker_blueprint`, `openstream_glass`).
2. **Aislamiento Quirúrgico de Textos (`customScenes`)**:
   - Para evitar que la edición de rótulos con claves comunes (como `beRightBack.title` o `startingSoon.title`) sobrescriba las pantallas de otros packs, el editor en caliente guarda los cambios de escenas personalizadas dentro de `texts.customScenes[sceneKey][key]` en `overlay_texts_config.json`.
   - `dom-injector.js` resuelve con prioridad los textos específicos de la escena activa, garantizando aislamiento total y permitiendo restaurar los textos de una única escena sin reiniciar el stream completo.



