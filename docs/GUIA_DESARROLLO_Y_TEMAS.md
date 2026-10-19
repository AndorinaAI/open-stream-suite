# 🛠️ GUÍA DE DESARROLLO, TEMAS Y WIDGETS
### Taller Live — Overlays, Alertas y Triggers Modulares con Código

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
3. Para facilitar las pruebas fuera de OBS, nuestro script `common/overlay.js` detecta automáticamente si estás dentro de OBS (`window.obsstudio`). Si estás en un navegador normal, activa un fondo de taller de prueba para que no veas un fondo blanco plano.

---

## 2. Arquitectura del Proyecto y Convenciones

```
twitchoverlay/
├── config.js              # Configuración central (textos, proyectos, fases)
├── server.py              # Backend local (EventSub Twitch, WebSocket, API REST)
├── triggers.json          # Mapeo de triggers y puntos de canal
├── .env                   # Credenciales de Twitch (NUNCA subir a GitHub)
├── common/
│   ├── styles.css         # Reset, fuentes, tokens de color base, responsive
│   ├── components.css     # Marcos de cámara, badges, paneles glassmorphic, marcas de mira
│   ├── themes.css         # Presets de color (maker, print, terminal, chill, etc.)
│   └── overlay.js         # Motor compartido (iconos SVG, auto-detección OBS, config)
├── scenes/                # Escenas completas 1920×1080 para OBS
│   ├── game/              # Modo videojuegos
│   ├── maker-desk/        # Cámara cenital de banco de trabajo electrónico
│   ├── maker-pc/          # Captura de pantalla PC Maker
│   ├── print-machine/     # Cámara de plotter de corte / sublimación
│   ├── print-design/      # Captura de diseño vectorial
│   ├── chill/             # Charla / Just Chatting con panel de chat
│   ├── starting-soon/     # Pantalla completa con cuenta atrás
│   ├── be-right-back/     # Pantalla de pausa con radar y frases rotativas
│   └── ending/            # Pantalla de cierre de emisión
├── widgets/               # Widgets modulares independientes
│   ├── chat/              # Chat en pantalla con física de emotes
│   ├── goal/              # Barra de objetivo (seguidores/subs)
│   ├── ticker/            # Tira de últimos eventos
│   ├── timer/             # Temporizador modular (cuenta atrás, cronómetro, layout de bloques y temas)
│   └── shoutout/          # Tarjeta holográfica de recomendación
└── alerts/
    ├── index.html         # Receptor de alertas y memes para OBS (1920×1080)
    ├── panel.html         # Panel de control interactivo para el streamer
    └── media/             # Carpeta local para vídeos, sonidos e imágenes
        ├── videos/        # WebM transparentes y MP4
        ├── sounds/        # MP3 y WAV
        └── images/        # GIF, PNG y JPG
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
  <title>Mi Nuevo Widget — Taller Live</title>
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

Los temas del taller se basan en **variables CSS personalizadas**. Cambiar el tema altera instantáneamente la paleta de colores de todos los marcos, paneles, badges y barras.

### Variables Principales de Color
| Variable CSS | Propósito | Ejemplo Maker |
| :--- | :--- | :--- |
| `--color-bg-dark` | Fondo general de escenas y paneles | `#191D21` (Grafito oscuro) |
| `--color-text-light` | Texto principal de títulos | `#F2EEE5` (Blanco hueso) |
| `--color-accent-cyan` | Color de acento primario (marcos activos, bordes) | `#57D6C4` (Turquesa electrónico) |
| `--color-accent-orange` | Color de acento secundario (alertas, alertas secundarias) | `#FF783F` (Naranja taller) |
| `--color-panel-bg` | Fondo opaco de tarjetas | `#2E363B` |
| `--color-text-dim` | Texto secundario o etiquetas técnicas | `#8B969C` |
| `--color-border-cyan` | Color del borde de tarjetas con transparencia | `rgba(87, 214, 196, 0.35)` |

### Paso 1: Definir tu Tema en `common/themes.css`
Abre `common/themes.css` y añade tu bloque de tema al final. Por ejemplo, un tema estilo **Ciberpunk Dorado**:

```css
/* TEMA GOLDEN MAKER (Oro Técnico + Negro Obsidiana) */
body[data-theme="golden"] {
  --color-bg-dark: #111111;
  --color-text-light: #FFF8E7;
  --color-accent-cyan: #FFD700;        /* Oro brillante */
  --color-accent-orange: #FF8C00;      /* Ámbar oscuro */
  --color-panel-bg: #1F1D1A;
  --color-text-dim: #A89F8B;
  --color-border-cyan: rgba(255, 215, 0, 0.4);
  --color-border-cyan-bright: #FFD700;
}
```

### Paso 2: Registrarlo en el Selector del Panel (`alerts/panel.html`)
En `alerts/panel.html`, añade la opción al desplegable `#global-theme-picker`:
```html
<option value="golden">Golden Maker (Oro + Negro)</option>
```

### Paso 3: Usarlo en OBS
Tienes 3 formas de activar tu nuevo tema:
1. **Desde el Panel de Control**: En la esquina superior derecha, selecciona "Golden Maker" y todas tus escenas y widgets cambiarán en tiempo real.
2. **Fijarlo en `config.js`**: Añade `activeTheme: "golden"` en `config.js`.
3. **Fijarlo en la URL de OBS**: Añade `?theme=golden` a la URL de la fuente (ejemplo: `http://localhost:8080/scenes/maker-desk/index.html?theme=golden`).

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
  "message": "Se une a la comunidad del taller",
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
  "message": "Trasteando en el taller",
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
   - 🔲 **Capa Base de Escena**: Tu escena (`/scenes/maker-desk/index.html` - 1920×1080).
   - 📷 **Capas Inferiores**: Tus cámaras web, capturas de ventana (Inkscape, VS Code, etc.) alineadas detrás de los marcos.
3. **Propiedades de la Fuente Navegador en OBS**:
   - Activar: *Controlar audio vía OBS* (si quieres ajustar el volumen individual de la fuente en el mezclador).
   - Activar: *Apagar fuente cuando no esté visible* (ahorra recursos cuando cambias a otra escena).
   - Frecuencia de actualización: 60 FPS (para animaciones super suaves).
