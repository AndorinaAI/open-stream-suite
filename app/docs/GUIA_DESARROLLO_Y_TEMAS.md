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
| **Peso y Memoria** | Archivos pesados (10 a 80 MB por escena). | Menos de **50 KB** en total. Carga instantánea. |
| **Consumo de CPU en OBS** | OBS decodifica bucles de vídeo continuos (5-15% CPU). | Menos de **0.5% CPU**. El renderizado es vectorial GPU nativo. |
| **Nitidez y Resolución** | Si escalas un PNG pierde nitidez o se pixela. | Vectores SVG y CSS que se ven ultra nítidos a 1080p, 2K o 4K. |
| **Dinamismo e Interactividad** | Estático. Para cambiar un texto hay que abrir Photoshop. | **100% dinámico**: cambia el proyecto en `config.js` y se actualiza en todas las escenas sin tocar imágenes. |
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
├── scenes/                    # Overlays completos 1920×1080 para OBS Studio
│   ├── game/, maker-desk/, maker-pc/, print-machine/, print-design/, chill/, starting-soon/, be-right-back/, ending/
│
├── common/                    # Recursos compartidos y tokens del sistema de diseño
│   ├── overlay/               # Submódulos de overlay: editor/, dom-injector.js, icons.js
│   ├── catalog.css, catalog.js, components.css, editor.js, i18n.js, overlay.js, styles.css, themes.css
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

### Variables Principales de Color
| Variable CSS | Propósito | Ejemplo Maker |
| :--- | :--- | :--- |
| `--color-bg-dark` | Fondo general de escenas y paneles | `#191D21` (Grafito oscuro) |
| `--color-text-light` | Texto principal de títulos | `#F2EEE5` (Blanco hueso) |
| `--color-accent-cyan` | Color de acento primario (marcos activos, bordes) | `#57D6C4` (Turquesa electrónico) |
| `--color-accent-orange` | Color de acento secundario (alertas, alertas secundarias) | `#FF783F` (Naranja de acento) |
| `--color-panel-bg` | Fondo opaco de tarjetas | `#2E363B` |
| `--color-text-dim` | Texto secundario o etiquetas técnicas | `#8B969C` |
| `--color-border-cyan` | Color del borde de tarjetas con transparencia | `rgba(87, 214, 196, 0.35)` |

## 4. Arquitectura de Temas Modulares, Restauración y Asignación por Overlay

A partir de la versión modular, los temas **ya no se editan a mano en un único archivo estático**, sino que se gestionan como carpetas independientes dentro de `themes/<pack_id>/<theme_id>/` con compilación automática en `common/themes.css`.

### Estructura en Disco de un Tema
```
themes/<pack_id>/<theme_id>/
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
  "activePack": "pack_open_stream_suite",
  "activeTheme": "maker",
  "overlayThemes": {
    "game": "arcade_8bit",
    "maker-desk": "maker",
    "maker-pc": "terminal",
    "print-machine": "print",
    "print-design": "print",
    "chill": "chill",
    "startingSoon": "synthwave",
    "beRightBack": "vapor_sunset",
    "ending": "synthwave"
  }
}
```
* Cada overlay carga su tema asignado mediante `common/overlay.js`:
  1. Detecta su escena automáticamente a partir de la ruta URL (`/game/`, `/chill/`, `/maker/desk/...`).
  2. Comprueba en primer lugar si la URL tiene un parámetro prioritario `?theme=...`. Si existe, lo aplica síncronamente al `<body>` para evitar cualquier parpadeo en OBS.
  3. Si no hay parámetro en la URL, consulta su estilo en `overlayThemes` desde el servidor local o `themes_state.json`.
  4. Si no tiene asignación, recurre al tema global activo o a su tema nativo de fábrica (`DEFAULT_OVERLAY_THEMES`).
  5. Escucha eventos WebSocket dedicados `overlay_theme_change` para actualizarse en caliente si el streamer cambia el selector de esa escena en el panel.

---

### Mapeo Canónico de Estilos de Fábrica (`DEFAULT_OVERLAY_THEMES`)
Tanto en el backend (`server/routes/themes_routes.py`) como en el frontend (`alerts/js/themes.js`):

```javascript
const DEFAULT_OVERLAY_THEMES = {
  'game': 'arcade_8bit',          // Gameplay: 8-Bit Arcade Cabinet
  'maker': 'maker',               // Escena Principal: tema Maker
  'maker-desk': 'maker',          // Escena Principal (cámara + webcam)
  'maker-pc': 'terminal',         // Pantalla PC (captura + webcam)
  'print': 'print',               // Impresión 3D Plotter: Print & Vinilo
  'print-machine': 'print',       // Cámara Secundaria (proceso/acción)
  'print-design': 'print',        // Pantalla Diseño (app full screen)
  'chill': 'chill',               // Charla / Just Chatting: Chill Lavender
  'startingSoon': 'synthwave',    // Pantalla Inicio: Synthwave Retro
  'beRightBack': 'vapor_sunset',  // Pausa Técnica: Vapor Sunset Glitch
  'ending': 'synthwave'           // Pantalla Despedida: Synthwave Retro
};
```
Permite que el panel detecte modificaciones con `(assignedThemeId !== defaultThemeId)`, muestre insignias de fábrica (`⭐ Original de fábrica`) o advertencias (`⚠️ Personalizado`), y ofrezca botones de restauración individual y global.

---

### Endpoints REST de la API de Temas
| Método | Ruta | Descripción | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/themes/packs` | Devuelve todos los packs, temas modulares y el mapeo `overlayThemes`. | — |
| `POST` | `/api/themes/packs/create` | Crea una nueva carpeta de pack en `themes/<pack_id>/`. | `{"name", "icon", "badge", "description"}` |
| `POST` | `/api/themes/create` | Crea un nuevo tema dentro de un pack. | `{"packId", "name", "accentCyan", ...}` |
| `POST` | `/api/themes/save` | Guarda cambios visuales y CSS en disco y recompila `common/themes.css`. | `{"packId", "id", "css", ...}` |
| `POST` | `/api/themes/restore` | ↺ Restaura el tema a su copia original de fábrica (`theme.default.json`). | `{"packId", "themeId"}` |
| `POST` | `/api/themes/overlay-assignment` | Asigna un estilo visual específico a una overlay. | `{"overlayKey", "themeId"}` |
| `POST` | `/api/themes/apply` | Activa un estilo visual global para todas las fuentes de OBS. | `{"theme", "pack"}` |
| `POST` | `/api/themes/chat-anchor` | Alterna el anclaje de chat o activa un tema derivado para chat. | `{"packId", "themeId", "anchored"}` |

---

### Endpoints REST para Stream Deck / Ajazz / OpenDeck (`/api/deck/*`)
| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/deck/status` | Estado del sistema (tema activo, escenas, overlays, timer). | — |
| `POST` | `/api/deck/trigger` | Dispara un meme o sonido por ID en OBS. | `{"id": "trigger_id"}` |
| `POST` | `/api/deck/theme` | Cambia el tema visual global o asigna a una escena. | `{"theme": "cyberpunk", "scene": "game"}` |
| `POST` | `/api/deck/timer/start` | Inicia o reanuda el temporizador del stream. | `{"duration": 1500}` |
| `POST` | `/api/deck/timer/pause` | Pausa el temporizador activo. | — |
| `POST` | `/api/deck/timer/reset` | Reinicia el temporizador. | — |

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
  "theme": "golden"
}
```
*Todas las fuentes de OBS que incluyan `common/overlay.js` actualizan el atributo `data-theme="golden"` en vivo y reciben las variables CSS compiladas en `common/themes.css`.*

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
| **Gamer Pro (`speedrun_splits`)** | Cronómetro con milisegundos, tiempos de vuelta (Splits), registro dinámico de tramo, cálculo de deltas (`+` / `-`) y atajo `Espacio`. | `#oss-speedrun-control` flotante con `[▶/⏸ Iniciar]`, `[⚡ Split]`, `[⏮ Prev]`, `[🔄 Reset]`. |
| **Lo-Fi / Synthwave (`starting_soon`, `countdown`)** | Temporizador regresivo sincronizado milisegundo a milisegundo con barra SVG/CSS (`.tech-progress-fill`). Pausa con clic en el reloj gigante. | `#oss-countdown-control` con presets (25m Pomodoro, 50m, 5m descanso, 10m) y micro-ajustes `+1m` / `-1m`. |
| **Maker Desk (`fases_proyecto`)** | Selector de fase de taller interactivo. Al hacer clic sobre cualquier fase (`01 PLAN`, `02 MONTAJE`, etc.) se activa en el lienzo y actualiza la ficha técnica. | HUD con conmutación dinámica de fase, botón `➕ Añadir Fase` y `🗑️ Eliminar Fase`. |
| **Open Stream (`podcast_talk`)** | Conmutador dinámico de rejilla multicámara (2, 3 o 4 invitados) con re-distribución CSS Grid automática y rótulos editables. | Botones de distribución en HUD: `[👥 2 Cams]`, `[👥 3 Cams]`, `[👥 4 Cams]`. |
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
   - El backend actualiza `overlay_texts_config.json` y emite el evento WebSocket `overlay_texts_updated` a todas las ventanas abiertas en OBS Studio en tiempo real.

---

### 8.5. Paso a Paso: Cómo Crear un Nuevo Overlay con Lógica Interactiva

1. **Estructura HTML básica**:
   Añade tu contenedor principal y las etiquetas semánticas con identificadores o clases descriptivas.
   ```html
   <link rel="stylesheet" href="../../../common/themes.css">
   <link rel="stylesheet" href="style.css">
   ...
   <div class="interactive-card" id="my-custom-widget">
     <div class="widget-header">
       <span class="widget-title">ESTADO DE SESIÓN</span>
       <span class="badge" id="session-badge">EN CURSO</span>
     </div>
     <div class="counter-display" id="session-counter">00:00</div>
   </div>
   <script src="../../../common/overlay.js"></script>
   ```

2. **Registro de Selectores Editables**:
   En `common/overlay.js`, añade las clases de tu nuevo overlay al array `editableSelectors`:
   ```javascript
   '.widget-title', '#session-badge', '#session-counter'
   ```

3. **Inclusión de Menú Draggable (si procede)**:
   Si tu overlay requiere un panel de configuración o control flotante, constrúyelo con una cabecera `.hud-drag-handle` y llama a:
   ```javascript
   makeDraggable(document.getElementById('my-custom-control'), '.hud-drag-handle');
   ```

4. **Sincronización de Estado en `overlay_texts_config.json`**:
   Define la clave de tu escena en `overlay_texts_config.json` para que guarde y restaure tanto los textos como los estados funcionales (índice activo, contadores, flags).

