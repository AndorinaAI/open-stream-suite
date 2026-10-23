# 🎬 GUÍA COMPLETA: CÓMO CREAR TEMAS, ESCENAS Y OVERLAYS DESDE CERO
### Open Stream Suite — Sistema Modular de Streaming para OBS Studio

<p align="center">
  <b>Español</b> | <a href="GUIA_CREAR_TEMAS_Y_ESCENAS_DESDE_CERO.en.md">English</a>
</p>

Esta guía responde de forma clara y definitiva a todas las dudas de arquitectura: **cómo funciona el flujo de trabajo**, **cómo se meten los overlays en OBS Studio**, **por qué existen temas y escenas**, y **cómo crear nuevos temas y escenas personalizadas desde cero**.

---

## 📑 ÍNDICE
1. [El Modelo Mental: Escena vs Tema vs Pack vs Widget](#1-el-modelo-mental-escena-vs-tema-vs-pack-vs-widget)
2. [¿Cómo se Meten los Overlays en OBS Studio? (Paso a Paso)](#2-cómo-se-meten-los-overlays-en-obs-studio-paso-a-paso)
3. [¿Para Qué Servía el Desplegable de "Modos" en el Editor?](#3-para-qué-servía-el-desplegable-de-modos-en-el-editor)
4. [Cómo Crear un Nuevo Tema Visual desde Cero](#4-cómo-crear-un-nuevo-tema-visual-desde-cero)
5. [Cómo Crear una Nueva Escena / Overlay desde Cero](#5-cómo-crear-una-nueva-escena--overlay-desde-cero)
6. [Cómo Personalizar Textos en Caliente y Sincronizarlos con OBS](#6-cómo-personalizar-textos-en-caliente-y-sincronizarlos-con-obs)
7. [Overlays con Funciones Programadas y Menús Flotantes Draggables](#7-overlays-con-funciones-programadas-y-menús-flotantes-draggables)
8. [Preguntas Frecuentes y Solución de Problemas](#8-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. El Modelo Mental: Escena vs Tema vs Pack vs Widget

Para no perderte nunca en la suite, ten clara esta distinción fundamental:

| Concepto | ¿Qué es? | ¿Dónde vive? | Ejemplo |
| :--- | :--- | :--- | :--- |
| **Escena (Scene)** | Una pantalla completa de 1920×1080 en OBS con sus marcos de cámara, etiquetas y distribución de capas. | En OBS Studio (lista de Escenas) y en la carpeta `/scenes/`. | Escena Game, Escena Maker Mesa, Escena Be Right Back. |
| **Tema (Theme)** | El **estilo visual** (colores neón, resplandores, fuentes y fondos) que "visten" a tus escenas y widgets. | En `/themes/<pack>/<tema>/` y compilado en `/common/themes.css`. | Maker (Turquesa), Print (Naranja), Cyberpunk (Amarillo neón). |
| **Pack de Temas** | Una **carpeta contenedora** que agrupa varios temas con un estilo o temática común. | En la carpeta `/themes/<pack_id>/`. | `pack_open_stream_suite` (los 6 temas oficiales). |
| **Widget** | Un elemento gráfico independiente superpuesto (caja de chat, ruleta, meta de subs, ticker, temporizador). | En `/widgets/<nombre>/`. | Widget de Chat, Widget de Timer Pomodoro. |

> [!TIP]
> **En resumen:** Tú diseñas las **Escenas** que quieres en tu directo (juego, charla, stream). Y con un solo clic en el panel cambias el **Tema** de todas ellas a la vez en OBS sin tener que tocar nada en OBS.

---

## 2. ¿Cómo se Meten los Overlays en OBS Studio? (Paso a Paso)

En OBS Studio **NO** se instalan plugins raros: cada escena u overlay es una fuente estándar de tipo **Navegador** (*Browser Source*).

### Paso 1: Configurar el Lienzo de OBS
1. Abre OBS Studio.
2. Ve a **Ajustes → Vídeo**.
3. Asegúrate de que tanto la **Resolución de la base (Lienzo)** como la **Resolución de salida (Escalada)** estén en:
   - **`1920 × 1080`**
   - **`60 fps`** (o 30 fps según tu equipo).

---

### Paso 2: Crear la Escena en OBS y Añadir la Fuente Navegador
1. En el panel inferior izquierdo de OBS (**Escenas**), pulsa **`+`** y dale un nombre (por ejemplo, *«01 // GAME»* o *«02 // MAKER MESA»*).
2. En el panel de **Fuentes**, pulsa **`+`** → **Navegador** (*Browser*).
3. Nómbrala, por ejemplo, `Overlay Game`.
4. En la ventana de propiedades:
   - **URL**: Introduce la URL de la escena servida por tu panel local:
     ```
     http://localhost:8080/scenes/game/index.html
     ```
     *(O marca "Archivo local" y busca el archivo `index.html` en tu disco duro).*
   - **Ancho (*Width*)**: `1920`
   - **Alto (*Height*)**: `1080`
   - **Opciones recomendadas (imprescindibles):**
     - ☑️ **Apagar la fuente cuando no sea visible** (*Shutdown source when not visible*).
     - ☑️ **Actualizar el navegador cuando la escena se active** (*Refresh browser when scene becomes active*).
5. Pulsa **Aceptar**.

---

### Paso 3: Orden de las Capas (¿Cómo se ve tu cámara y tu juego?)
El overlay tiene **transparencia total** en las zonas donde deben ir tus cámaras o capturas:
- **Capa 1 (Arriba del todo)**: `Overlay Game` (Fuente Navegador).
- **Capa 2 (Intermedia)**: `Cámara Web` (Dispositivo de captura de vídeo).
- **Capa 3 (Fondo)**: `Captura de Juego` o `Captura de Pantalla`.

Coloca tu webcam detrás del marco recortado del overlay. Si sobresale algún borde, mantén pulsada la tecla **`Alt`** en OBS y arrastra los extremos rojos de la cámara para recortarla al tamaño exacto del marco.

---

### Paso 4: Lista Completa de URLs para OBS
Puedes copiar cualquiera de estas URLs directamente desde el panel:

| Escena | URL para Fuente Navegador en OBS | Uso Principal |
| :--- | :--- | :--- |
| **Game** | `http://localhost:8080/scenes/game/index.html` | Videojuegos con webcam en esquina y badge. |
| **Escena Principal** | `http://localhost:8080/scenes/maker-desk/index.html` | Cámara principal con toma auxiliar y barra de fases. |
| **Pantalla PC** | `http://localhost:8080/scenes/maker-pc/index.html` | Captura de pantalla con cámara y barra de fases activas. |
| **Cámara Secundaria** | `http://localhost:8080/scenes/print-machine/index.html` | Cámara directa sobre proceso o acción en curso. |
| **Pantalla Diseño** | `http://localhost:8080/scenes/print-design/index.html` | App a pantalla completa: diseño, CAD, edición, IDE. |
| **Chill (Charla)** | `http://localhost:8080/scenes/chill/index.html` | Just Chatting con cámara amplia y chat lateral. |
| **Starting Soon** | `http://localhost:8080/scenes/starting-soon/index.html` | Pantalla de inicio con cuenta atrás dinámica. |
| **Be Right Back** | `http://localhost:8080/scenes/be-right-back/index.html` | Pausa con frases rotativas automáticas. |
| **Ending** | `http://localhost:8080/scenes/ending/index.html` | Fin de emisión con tarjeta de agradecimiento. |
| **Alertas Overlay**| `http://localhost:8080/alerts/index.html` | Capa transparente global para alertas y triggers. |

---

## 3. ¿Quién Cambia de Escena y Qué Hace el Botón «🎨 Aplicar Estilo en OBS»?

Una de las dudas más frecuentes es: *«Si las escenas las cambio yo en OBS, ¿para qué sirve el botón Aplicar Estilo en OBS?»*

### 1. El Cambio de Escena se Hace en OBS Studio
* **Tú eres el director en directo**: El cambio entre escenas (por ejemplo, pasar de *Charla* a *Gameplay* o a *Pausa BRB*) se hace **dentro de OBS Studio** mediante atajos de teclado, el ratón o un Stream Deck.
* **Cada escena de OBS tiene su propia URL fija**:
  * Escena *Gameplay* ➜ `http://localhost:8080/scenes/game/index.html`
  * Escena *Pantalla PC* ➜ `http://localhost:8080/scenes/maker-pc/index.html`
  * Escena *Chill* ➜ `http://localhost:8080/scenes/chill/index.html`
  * Escena *Pausa* ➜ `http://localhost:8080/scenes/be-right-back/index.html`
* Cuando tú cambias de escena en OBS, OBS simplemente muestra la fuente correspondiente. **El panel no necesita saber qué escena tienes activa en OBS ni ordenarle a OBS que cambie de escena**.

### 2. ¿Qué Hace el Botón «🎨 Aplicar Estilo en OBS»?
El botón **NO** cambia la escena de OBS. Lo que hace es:
1. Compilar la paleta cromática del tema elegido en `common/themes.css`.
2. Enviar una señal por WebSocket local (`theme_change`) a **todas las fuentes navegador de OBS**.
3. Cambiar en vivo los colores neón, marcos, brillos y fuentes de **todas tus pantallas simultáneamente** sin que tengas que reiniciar OBS.

### 3. ¿Cómo Ver Cualquier Overlay a Pantalla Completa (1920×1080)?
Tienes 3 accesos directos sin marcos pequeños ni recortes:
* **Desde la tarjeta de cada escena**: Pulsa el botón **`🖥️ Pantalla Completa ↗`** en el catálogo de escenas.
* **Desde el Editor de Escenas**: En la cabecera del modal tienes el botón **`🖥️ Ver Pantalla Completa ↗`**.
* **Desde el Editor de Temas**: En la cabecera superior tienes el botón **`🖥️ Ver a Pantalla Completa ↗`** para comprobar cómo lucen tus colores a resolución real.

---

## 4. Cómo Crear un Nuevo Tema Visual desde Cero (y Sistema de Restauración de Fábrica)

Un tema visual es un conjunto de **variables CSS, paleta de colores y ajustes de resplandor** empaquetados en un directorio modular.

### Estructura de Archivos de un Tema Modular
Dentro de cualquier pack (por ejemplo `themes/pack_open_stream_suite/` o en un pack nuevo `themes/pack_retro_arcade/`), cada tema se almacena en su propia carpeta con **4 archivos clave**:

```
themes/<pack_id>/<theme_id>/
├── theme.json           # Ajustes activos actuales (nombre, badge, colores hex, tipografías)
├── style.css            # Código CSS activo aplicado a body[data-theme="..."]
├── theme.default.json   # 🛡️ Copia de seguridad original de fábrica (ajustes base)
└── style.default.css    # 🛡️ Código CSS original de fábrica para restauración
```

---

### ¿Cómo Funciona la Restauración de Fábrica (`Restablecer Original`)?

El sistema cuenta con un mecanismo de protección para que los streamers puedan experimentar con colores, neones y CSS sin miedo a romper el tema:

1. **Creación Automática del Respaldo de Fábrica:**
   * Al inicializar el servidor o crear un tema nuevo, se generan automáticamente `theme.default.json` y `style.default.css`.
   * Si guardas cambios en el editor visual, el backend garantiza que la copia original permanezca intacta en disco.
2. **Cómo Restaurar si No te Gusta la Modificación:**
   * Abre el tema en el editor del panel (`🛠️ Editar`).
   * En la esquina inferior izquierda del editor, pulsa **`🔄 Restablecer Original`**.
   * El sistema llamará al endpoint `POST /api/themes/restore`:
     * Sobrescribe `theme.json` y `style.css` con los valores de `theme.default.json` y `style.default.css`.
     * Recompila de inmediato `common/themes.css`.
     * Envía la señal WebSocket a OBS Studio para refrescar los colores en directo sin recargar el navegador.
     * Recarga los campos del editor y el visor de previsualización.

---

### Plantilla de `style.css` (y `style.default.css`)
Copia esta plantilla básica para crear cualquier estilo nuevo:
```css
/* ====================================================================
 * TEMA: MI TEMA NUEVO
 * ==================================================================== */
body[data-theme="mi_tema_nuevo"] {
  /* 1. Colores de Fondo y Texto */
  --color-bg-dark: #0D1117;              /* Fondo de las pantallas de espera */
  --color-text-light: #F0F6FC;           /* Texto principal legible */
  --color-text-dim: #8B949E;             /* Etiquetas y leyendas secundarias */

  /* 2. Colores de Acento (Identidad Neón) */
  --color-accent-cyan: #00FFCC;          /* Acento principal (marcos, relojes, activo) */
  --color-accent-orange: #FF0055;        /* Acento secundario (avisos, tags de modo) */

  /* 3. Paneles y Bordes */
  --color-panel-bg: rgba(22, 27, 34, 0.85); /* Fondo glassmorphic de tarjetas */
  --color-border-cyan: rgba(0, 255, 204, 0.4);
  --color-border-cyan-bright: #00FFCC;

  /* 4. Resplandor (Glow) */
  --theme-glow: 0 0 15px rgba(0, 255, 204, 0.4);

  /* 5. Tipografías (Opcional) */
  --font-primary: 'Inter', sans-serif;
  --font-tech: 'JetBrains Mono', monospace;
}
```

---

### Plantilla de `theme.json` (y `theme.default.json`)
```json
{
  "id": "mi_tema_nuevo",
  "packId": "pack_personalizado",
  "name": "Mi Tema Nuevo",
  "badge": "01 // CUSTOM",
  "accentCyan": "#00FFCC",
  "accentOrange": "#FF0055",
  "bgDark": "#0D1117",
  "textLight": "#F0F6FC",
  "panelBg": "#161B22",
  "textDim": "#8B949E",
  "fontPrimary": "var(--font-primary)",
  "fontTech": "var(--font-tech)",
  "glowIntensity": 65,
  "borderStyle": "chamfer",
  "desc": "Estilo personalizado de alto contraste con turquesa y fucsia.",
  "chatAnchored": true,
  "chatDerivative": null
}
```

---

### ¿Cómo se Relacionan las Overlays con los Estilos Visuales? (Estilos Independientes)

Cada overlay de OBS Studio tiene elementos y finalidades diferentes (la pantalla de Gameplay prioriza el juego y la webcam; la de Escena Principal organiza cámaras; la de Chill resalta el chat). Por ello, **cada overlay puede tener asignado un estilo visual diferente o compartir el mismo**:

1. **Asignación en la pestaña Overlays:**
   * En cada tarjeta de overlay tienes un desplegable **`🎨 Estilo Visual Asignado`** para elegir qué tema viste esa pantalla.
   * Al cambiarlo, se guarda en `themes_state.json` (`overlayThemes`) y se envía vía WebSocket solo a esa pantalla.
   * Al lado tienes el botón **`🎨 Editar Estilo ↗`** para ir directamente a personalizar sus colores.
2. **Vinculación en la pestaña Packs de Temas:**
   * Cada tarjeta de tema muestra qué overlays lo están utilizando mediante insignias cliqueables (ej: `[🎮 Gameplay ✏️]`).
   * Al pulsar cualquier insignia o el botón `📝 Editar Textos de sus Overlays ↗`, el panel abre directamente la edición de textos de esa pantalla.
3. **Aplicar Estilo Global:**
   * Si pulsas el botón verde `🎨 Aplicar Estilo Global` en una tarjeta de tema, todas las pantallas que no tengan un estilo forzado se actualizarán en bloque en OBS Studio.

---

### ¿Cómo se Programa el Estilo de Fábrica de Cada Overlay y su Restauración?

Para que un streamer pueda cambiar estilos libremente y siempre volver con seguridad a la estética original de cada pantalla, el sistema implementa una arquitectura de **Estilos de Fábrica Predeterminados** tanto en el backend como en el frontend:

#### 1. Definición del Mapeo de Fábrica (`DEFAULT_OVERLAY_THEMES`)
En `server/routes/themes_routes.py` y en `alerts/js/themes.js` se define la constante canónica de estilos nativos:

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

#### 2. Detección Visual de Cambios en la Interfaz
En cada renderizado de tarjeta u apertura de modal, el panel compara:
```javascript
const defaultThemeId = DEFAULT_OVERLAY_THEMES[sceneKey] || 'maker';
const isModified = (assignedThemeId !== defaultThemeId);
```
- **Si no está modificado**: Se muestra la etiqueta `⭐ Original de fábrica: [Nombre]` y el borde permanece en cian relajante.
- **Si está personalizado**: El borde se tiñe de color de aviso `#FF783F` (naranja), se indica `⚠️ Personalizado (Original: [Nombre])` y aparece el botón **`🔄 Restaurar Original`**.

#### 3. Mecanismos de Restauración
Existen tres formas de restablecer los estilos:
- **Botón individual en la tarjeta del overlay**: Llama a `restoreOverlayTheme(sceneKey)` restableciendo solo ese overlay.
- **Botón individual dentro del modal de edición de textos**: Llama a `restoreOverlayThemeFromModal()`.
- **Botón global en la cabecera**: El botón **`🔄 Restaurar Todas al Original`** ejecuta `restoreAllOverlaysToDefaultThemes()` iterando las 9 escenas y sincronizándolas con el backend en lote.

#### 4. Prioridad y Parámetro URL `?theme=...` para OBS Studio
Para que una escena en OBS Studio o una previsualización a pantalla completa nunca sufra retrasos de red al cargar su estilo:
- La URL copiada con **"📋 Copiar URL OBS"** y abierta con **"🖥️ Pantalla Completa ↗"** incluye el parámetro query:
  `http://localhost:8080/scenes/game/index.html?theme=arcade_8bit`
- En `common/overlay.js`, el script lee este parámetro de inmediato al arrancar el DOM:
  ```javascript
  const urlParams = new URLSearchParams(window.location.search);
  const themeFromUrl = urlParams.get('theme');
  let activeTheme = themeFromUrl || config.overlayThemes?.[currentSceneKey] || config.activeTheme;
  if (activeTheme) {
    document.body.setAttribute('data-theme', activeTheme);
  }
  ```
- **Jerarquía de Prioridad del Tema**:
  1. `?theme=nombre` (Parámetro explícito en la URL de OBS — prioridad máxima).
  2. `overlayThemes[sceneKey]` (Asignación específica guardada en `themes_state.json`).
  3. `activeTheme` (Tema activo global seleccionado en el panel).
  4. Tema de fábrica predeterminado.

---

## 5. Cómo Crear una Nueva Escena / Overlay desde Cero

Supongamos que quieres una nueva escena especial llamada **«Modo Pizarra»** o **«Modo Entrevista»**.

### Paso 1: Crear la Carpeta y Archivo HTML
Crea la carpeta `scenes/entrevista/` y dentro el archivo `index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Open Stream Suite — ENTREVISTA</title>
  <!-- 1. Enlazar estilos base, componentes y temas dinámicos -->
  <link rel="stylesheet" href="../../common/styles.css">
  <link rel="stylesheet" href="../../common/components.css">
  <link rel="stylesheet" href="../../common/themes.css">
  <style>
    /* Estructura específica para dos webcams */
    .interview-grid {
      position: absolute;
      top: 100px;
      left: 60px;
      width: 1800px;
      height: 800px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .cam-box {
      width: 100%;
      height: 100%;
      position: relative;
    }
  </style>
</head>
<body data-mode="entrevista">
  <div class="overlay-canvas">

    <!-- Cabecera de Marca del Canal -->
    <header class="scene-header">
      <div class="brand-badge">
        <div class="brand-icon-svg" data-icon="logo"></div>
        <div class="brand-info">
          <span class="brand-name">ANDORINA</span>
          <span class="brand-tagline">JUGAR · CREAR · TRASTEAR</span>
        </div>
      </div>
      <div class="live-indicator">
        <span class="live-dot"></span>
        <span>EN DIRECTO</span>
      </div>
    </header>

    <!-- Marcos de las 2 Cámaras con Atributos Semánticos Universales -->
    <div class="interview-grid">
      <!-- Marco 1: Streamer -->
      <div class="camera-frame cam-box" data-oss-cam="true">
        <div class="cam-viewport" data-oss-viewport="true"></div>
        <div class="frame-label" data-oss-cam-label="true">
          <span data-text-key="interview.hostLabel">HOST // ANDORINA</span>
        </div>
        <div class="frame-corner-tr"></div>
        <div class="frame-corner-bl"></div>
      </div>

      <!-- Marco 2: Invitado -->
      <div class="camera-frame cam-box" data-oss-cam="true">
        <div class="cam-viewport" data-oss-viewport="true"></div>
        <div class="frame-label" data-oss-cam-label="true">
          <span data-text-key="interview.guestLabel">INVITADO ESPECIAL</span>
        </div>
        <div class="frame-corner-tr"></div>
        <div class="frame-corner-bl"></div>
      </div>
    </div>

  </div>

  <!-- 2. Scripts obligatorios para soporte offline y sincronización WebSocket -->
  <script src="../../config.js"></script>
  <script src="../../common/overlay.js"></script>
</body>
</html>
```

### ¿Por qué funciona mágicamente?
- **Iconos automáticos**: Cualquier elemento con `data-icon="logo"` o `data-icon="chat"` inyecta el SVG oficial vectorial optimizado.
- **Textos sincronizados**: Las clases `.brand-name`, `.brand-tagline` y `.live-indicator` se actualizan automáticamente desde el panel de control.
- **Temas reactivos**: Responde al tema visual seleccionado globalmente y al arquetipo del pack.
- **Detección inteligente de OBS**: En un navegador normal te muestra una marca de agua para pruebas; en OBS se vuelve **100% transparente**.

---

## 5.1. Contrato Universal de Compatibilidad Semántica (`data-oss-*`)
Para que **cualquier desarrollador o streamer pueda crear un pack desde cero sin necesidad de conocer los nombres de clases de los otros packs**, el motor de Open Stream Suite implementa el **Contrato Semántico Universal**:

| Atributo Semántico | Dónde se coloca | Función en el Motor |
|---|---|---|
| `data-oss-cam="true"` | Contenedor principal de la cámara o captura | Recibe las 20 formas físicas (biseles 45°, polaroids, blindajes hex, pergaminos, arcade pixel, etc.), sombras, bordes y recortes. |
| `data-oss-viewport="true"` | Área interior donde se ve el vídeo | Genera la ventana transparente para la webcam o captura en OBS y el motor de aperturas SVG (`backdrop-aperture.js`). |
| `data-oss-cam-label="true"` | Rótulo o tarjeta con el nombre de la cámara | Adapta automáticamente su posición y tipografía (chincheta polaroid, píldora neón, tag de cota, sello de lacre). |
| `data-oss-panel="true"` | Paneles de chat, stats, podios o listas | Recibe fondo glassmorphism, radios curvados o biseles acordes a la forma activa. |
| `data-oss-bar="top\|bottom"` | Barras de cabecera o faldones inferiores | Estiliza la barra de estado o noticias con los acentos del tema. |

> [!TIP]
> **Desacoplamiento total**: No importa si tu contenedor se llama `.my-cam`, `.webcam-box` o `.stream-window`. Al añadir `data-oss-cam="true"`, el motor de estilos lo reconoce al instante y le aplica cualquiera de las **20 formas físicas** (Cozy, Gamer, Maker, OpenStream, Fantasía/Rol/Gótico, y Cómic/Synthwave/Retro CRT) sin conflicto alguno.

---

### Catálogo de las 20 Formas Físicas Disponibles
1. **☕ Cozy Lo-Fi & Arte**: `cozy_polaroid`, `cozy_canvas`, `cozy_soft`.
2. **🎮 Gamer Pro & Esports**: `gamer_mecha`, `gamer_tactical_hud`, `gamer_stealth`, `gamer_hex_shield`, `gamer_cyber_glitch`, `gamer_arcade_retro`.
3. **🛠️ Maker & Taller**: `maker_blueprint`, `maker_workbench`, `maker_circuit_pcb`.
4. **⚡ Open Stream Suite**: `openstream_glass`, `openstream_studio`.
5. **📜 Fantasía, Rol & Terror**: `fantasy_parchment`, `fantasy_runic_stone`, `gothic_vampire`.
6. **💥 Cómic, Pop Art & Retro TV**: `comic_manga_action`, `pop_synth_neon`, `vintage_crt_monitor`.

---

## 5.2. Fluidez y Adaptabilidad a Relaciones de Aspecto de Cámara
Una de las grandes ventajas de este sistema es que **las formas físicas no están restringidas a un tamaño fijo**:

- **Cámaras Horizontales Clásicas (16:9 y 4:3)**: Se adaptan tanto a webcams modernas como a capturas de consolas retro o cámaras compactas.
- **Cámaras Ultra-Panorámicas (21:9)**: Perfectas para capturas ultrawide de simulación o streaming multi-monitor.
- **Cámaras Verticales (9:16)**: Esenciales para directos orientados a TikTok Live, YouTube Shorts o transmisiones móviles.

### ¿Cómo se logra que no se deformen los biseles ni los corchetes?
El motor utiliza coordenadas relativas en CSS combinadas con `calc`:
```css
/* Ejemplo: Chaflán octogonal relativo que no se deforma sin importar el ancho o alto */
clip-path: polygon(
  24px 0%, calc(100% - 24px) 0%,
  100% 24px, 100% calc(100% - 24px),
  calc(100% - 24px) 100%, 24px 100%,
  0% calc(100% - 24px), 0% 24px
);
```
Los elementos decorativos (cruces `+`, retículas, esquinas) se posicionan con desplazamientos anclados a esquinas (`top: 6px; left: 6px;`, `bottom: 6px; right: 6px;`). Así, tanto una cámara vertical de 400×710 como una panorámica de 1280×720 lucen exactamente con la misma precisión milimétrica.

---

## 5.3. Regla de Oro del Aislamiento de Textos Editables (`data-text-key`)
Cuando un overlay contiene textos que el streamer puede editar directamente con un clic en el lienzo (títulos, etiquetas de cámara, nombres de juego, deltas de cronómetro), se debe emplear **`data-text-key="seccion.campo"`**:

```html
<span data-text-key="speedrun.game">SUPER MARIO 64</span>
<span data-text-key="cozy.cafeCamLabel">CÁMARA CAFÉ</span>
<h1 data-text-key="victory.title">VICTORY</h1>
```

### ¿Por qué es vital usar claves únicas por escena?
- Si dos escenas usasen la misma clave genérica (por ejemplo `game.badgeText` o `cam.title`), modificar el texto en la escena de velocidad (Speedrun) sobreescribiría el podio de victoria (Victory Clutch) o la escena de charla (Chill Chat).
- Con claves aisladas (`victory.*`, `speedrun.*`, `art.*`, `pomodoro.*`, `cozy.*`, `oss.*`), cada escena conserva su propio contenido de forma 100% independiente.
- **Persistencia automática**: El motor `dom-injector.js` y `05a-extract-texts.js` escanean automáticamente cualquier elemento con `[data-text-key]`. Al pulsar `💾 Guardar`, se envían al servidor y se sincronizan vía WebSocket con OBS Studio sin necesidad de programar una sola línea de JavaScript.

---

## 5.4. Geometría Segura contra Recortes Poligonales (`clip-path`)
Al aplicar formas con cortes poliédricos (`gamer_mecha`, `gamer_tactical_hud`):

> [!CAUTION]
> Si el contenedor de la cámara utiliza `clip-path` o `overflow: hidden`, cualquier elemento hijo colocado en **coordenadas negativas** (como `top: -14px;` o `left: -20px;`) quedará cortado y desaparecerá total o parcialmente.

**La Regla de los Insets Positivos**:
- Coloca siempre los rótulos y etiquetas con coordenadas positivas hacia el interior:
  ```css
  /* CORRECTO: Seguro dentro del área visible */
  .cam-label {
    position: absolute;
    top: 10px;
    left: 14px;
  }
  ```
- O ubica los rótulos fuera del contenedor con `clip-path`, utilizando un wrapper exterior limpio.

---

## 5.5. Paneles Flotantes Bajo Demanda (No Invasivos)
Para que los overlays sean cómodos de emitir y no sobrecarguen la pantalla:
- Los paneles interactivos auxiliares (`#oss-countdown-control`, `#oss-speedrun-control`, `#oss-brb-phrases-control`) arrancan **ocultos por defecto** (`display: none;`).
- Se abren y cierran mediante los botones contextuales de la barra superior HUD (`⏱️ Temporizador`, `⚡ Splits`, `🔄 Frases BRB`) o con el botón de cierre rápido `✕`.
- Al ser draggables (`makeDraggable`), el streamer puede colocarlos en cualquier rincón libre del monitor durante las pruebas sin tapar la webcam ni el juego.

---

## 6. Cómo Personalizar Textos en Caliente y Sincronizarlos con OBS

En versiones anteriores, la edición de textos requería un modal externo que ocultaba la vista del overlay. En la versión actual de **Open Stream Suite**, los textos se editan de forma directa e interactiva en la propia escena:

1. **Botón Unificado en Cada Tarjeta**:
   - Cada tarjeta de overlay cuenta con el botón **`🖥️ Ver Pantalla Completa / ✏️ Editar Textos`**.
   - Al pulsarlo, el overlay se abre en una pestaña a resolución completa 1920×1080 con el motor de edición activado.

2. **Edición Directa en Lienzo (`contenteditable="true"`)**:
   - Todos los rótulos, nombres de fases, personal bests, titulares, subtítulos y badges son editables directamente haciendo clic sobre ellos.
   - El contorno visual cian/neón te indica de inmediato qué campo estás editando.

3. **HUD Flotante de Control (`#open-stream-suite-screen-hud`)**:
   - En la parte superior de la pantalla completa dispones de un HUD de herramientas con:
     - **`🎯 Ir a Texto...`**: Desplegable exhaustivo que localiza y enfoca instantáneamente cualquier rótulo del lienzo.
     - **`💾 Guardar Cambios`**: Envía todos los textos modificados al backend vía `POST /api/overlays/texts` y emite el evento WebSocket `overlay_texts_update` a OBS Studio.
     - **`🔄 Restablecer`**: Devuelve los textos de la escena a sus valores originales de fábrica.
     - **`❌ Cerrar HUD`**: Oculta el panel flotante para comprobar el aspecto limpio de la escena.
     - **`⋮⋮ Tirador Arrastrable`**: Permite mover el HUD a cualquier posición de la pantalla para no tapar elementos.

4. **Pausa Reactiva de Animaciones (`window.__OSS_IS_EDITING__`)**:
   - Cuando haces clic dentro de cualquier texto editable, el sistema activa automáticamente `window.__OSS_IS_EDITING__ = true`.
   - Esto congela momentáneamente las rotaciones automáticas (como las frases de pausa o refrescos periódicos) para que el texto no cambie ni se desplace bajo tu cursor mientras escribes.

---

## 7. Overlays con Funciones Programadas y Menús Flotantes Draggables

Los overlays modernos no son meros dibujos estáticos: son **aplicaciones interactivas de emisión**.

### Regla de Oro: Todo Menú Flotante DEBE ser Draggable (`makeDraggable`)
> [!IMPORTANT]
> **Principio de No Obstrucción**: Jamás coloques un menú o panel de control flotante en posición fija estática. Siempre debe implementarse con `makeDraggable(panel, handleSelector)` para que el streamer o editor pueda moverlo y no tape cámaras, chats o textos clave.

- **Pointer Events**: El helper `makeDraggable` usa `pointerdown`, `pointermove` y `pointerup` con `setPointerCapture`, garantizando compatibilidad total con ratón, trackpad y pantallas táctiles (`touch-action: none`).
- **Tirador `.hud-drag-handle`**: El glifo visual `⋮⋮` y el cursor `grab / grabbing` avisan al usuario de que el panel es arrastrable.
- **Límites de Pantalla**: La función acota las coordenadas para que ninguna ventana pueda quedar inaccesible fuera de la pantalla.

### Catálogo de Funciones Nativas Disponibles

1. **Cronómetro y Speedrun Splits (`Gamer_Pro_Pack`)**:
   - Cronómetro con centésimas de segundo y panel de vueltas (Splits).
   - Panel draggable `#oss-speedrun-control` con botones `[▶ Iniciar]`, `[⚡ Split]`, `[⏮ Prev]` y `[🔄 Reset]`.
   - Al pulsar `⚡ Split` se guarda el tiempo del tramo activo, se calcula el delta (`+` rojo o `-` verde respecto al PB) y se avanza al siguiente tramo.
   - Atajo de teclado: la tecla `Espacio` registra el split o pausa el cronómetro (ignorado automáticamente si estás escribiendo en un input o campo editable).
   - Clic directo sobre el delta (`+0.42` / `-0.18`) o el PB para editar tiempos de referencia.

2. **Pomodoro y Cuenta Atrás (`Cozy_LoFi_Pack` y pantallas Starting Soon)**:
   - Temporizador regresivo milimétrico sincronizado con barras SVG/CSS (`.tech-progress-fill`).
   - Panel draggable `#oss-countdown-control` con presets rápidos:
     - ☕ Pomodoro: 25 min concentración / 5 min descanso.
     - ☕ Sesión Larga: 50 min concentración / 10 min descanso.
     - Micro-ajustes de `+1 min` y `-1 min`.
   - Pausa y reanudación con clic directo sobre los dígitos del reloj gigante.

3. **Gestor Dinámico de Fases (`Maker_Theme_Pack`)**:
   - Conmutación directa de fase haciendo clic sobre cualquier bloque inferior (`01 PLAN`, `02 MONTAJE`, etc.).
   - Sincronización automática de `FASE ACTUAL` en la ficha técnica y en el HUD.
   - Botones `➕ Añadir Fase` y `🗑️ Eliminar Fase` en el HUD para modificar la hoja de ruta en pleno directo.

4. **Conmutador Multicámara de Podcast (`Open_stream_Pack`)**:
   - Botones en el HUD para alternar entre `[👥 2 Cams]`, `[👥 3 Cams]` y `[👥 4 Cams]`.
   - Reorganización dinámica del CSS Grid de la escena y generación de rótulos editables para cada invitado.

5. **Interacciones en Lienzo**:
   - Clic en banners de victoria (`victory_clutch`) para alternar entre `VICTORY`, `DEFEAT`, `ACE` y `MATCH POINT`.
   - Clic en tarjetas de estadísticas para cambiar de modo (`COMPETITIVE`, `RANKED`, FPS).
   - Clic en webcam flotante (`desktop_share`) para rotarla entre las 4 esquinas del monitor.

### Delegación de Eventos en `document`
Al programar nuevas funciones interactivas, vincula los eventos de clic con delegación en `document`:
```javascript
document.addEventListener('click', (e) => {
  const targetSplit = e.target.closest('.split-row');
  if (targetSplit) {
    // Lógica del split sin romperse al recargar el DOM
  }
});
```

---

## 8. Preguntas Frecuentes y Solución de Problemas

### ❓ ¿Se necesita tener abierto el servidor `server.py` siempre?
- **Para directos con alertas y triggers de Twitch**: Sí, `server.py` se encarga de escuchar los eventos de Twitch, los puntos de canal y emitirlos por WebSocket a OBS.
- **Si solo quieres los marcos de pantalla (offline)**: No es obligatorio; puedes cargar las escenas como archivo local en OBS gracias a `config.js`.

### ❓ ¿Por qué mi cámara se ve por encima de los textos del marco?
En la lista de fuentes de OBS, el orden de arriba a abajo determina qué capa tapa a cuál. **El Navegador (Overlay) debe ser la primera fuente de la lista**. Tu cámara debe estar por debajo.

### ❓ ¿Cómo abro una escena en pantalla completa sin entrar en OBS?
En el panel, haz clic en el botón **`🖥️ Ver Pantalla Completa / ✏️ Editar Textos`** de cualquier escena. Se abrirá en una pestaña de tu navegador a resolución nativa 1920×1080 con todos los controles activos.

