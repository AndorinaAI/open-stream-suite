---
name: overlay-system-architecture
description: >-
  Memoria técnica y guía del sistema central de Open Stream Suite (Twitch Overlay).
  Define la arquitectura base del motor de estilos, formas físicas, HUD editor,
  persistencia y contratos que deben cumplir todas las escenas.
---

# Sistema Central de Overlays de Twitch — Arquitectura y Contratos

Este skill documenta el sistema base agnóstico de packs para el desarrollo, auditoría y ejecución de overlays.

---

## 1. Principio Fundamental
El sistema está desacoplado de las escenas:
- El **motor base** (`styles.css`, `themes.css`, `overlay.js`, `editor/`) proporciona toda la inteligencia (10 formas físicas, paletas de colores, reactividad WebSocket, HUD editor flotante, guardado y restauración).
- Las **escenas** son plantillas HTML semánticas que consumen las variables y clases del motor sin inventar lógica paralela ni forzar estilos rígidos incompatibles.

---

## 2. Contrato Semántico para Escenas (HTML)

Cualquier escena compatible debe usar esta nomenclatura estándar:

Elemento | Atributo / Clase Estándar | Función en el Motor
:--- | :--- | :---
Marco de Cámara | `class="camera-frame"` o `data-oss-cam="true"` | Recibe bordes, chamfers, sombras, chinchetas, retículas o remaches según la forma activa.
Visor de Cámara | `class="cam-viewport"` o `data-oss-viewport="true"` | Área transparente interior para recortar webcam en OBS.
Etiqueta de Cámara | `class="cam-label"` o `data-oss-cam-label="true|bar|bottom"` | Título de cámara (se adapta a chincheta polaroid, pill neón, tag de cota o barra inferior chin bar).
Tarjeta / Panel | `class="panel-card"` o `data-oss-panel="true"` | Chat, pomodoro, alertas, stats. Recibe curvatura y desenfoque glassmorphism.
Barras de Marco | `class="header-bar" / "footer-bar"` o `data-oss-bar="top|bottom|left|right"` | Encabezados, cintillos o columnas laterales.
Orientación | `data-oss-orientation="horizontal|vertical"` | Autodetectado por relación de aspecto o tipo de barra, o manual para adaptar geometría.
Badges / Chips | `class="mode-badge"` o `data-oss-badge="true"` | Indicadores de estado (LIVE, REC, etc.).
Textos Editables | `data-text-key="seccion.campo"` | Textos que el streamer puede editar directamente con un clic en el navegador y guardar.

---

## 3. Motor de 20 Formas Físicas Universales (`data-theme-shape`)

El motor cuenta con 20 arquetipos físicos organizados en 6 familias temáticas:

### ☕ Cozy Lo-Fi & Arte:
1. `cozy_polaroid`: Borde blanco crema ancho inferior, washi tape superior decorativa y pie manuscrito.
2. `cozy_canvas`: Textura suave de lienzo de arte, borde de madera cálido y chinchetas metálicas doradas.
3. `cozy_soft`: Curvatura suave de 28px, frosted glass cálido y cabeceras en píldora minimalista.

### 🎮 Gamer Pro & Esports:
4. `gamer_mecha`: Chamfer 45° octogonal con clip-path, retículas de esquina blancas y brillo láser neón.
5. `gamer_tactical_hud`: Borde técnico biselado, telemetría militar superior, scanlines y badge ● LIVE REC.
6. `gamer_stealth`: Negro carbón mate puro, corte angular de 8px, borde hairline 1px sin brillos reflectantes.
7. `gamer_hex_shield`: Blindaje Sci-Fi hexagonal perimetral, visor en octógono y estado ⬡ SHIELD: ACTIVE.
8. `gamer_cyber_glitch`: Geometría asimétrica neón, aberración cromática cian/magenta (-3px/3px) y glitch visual.
9. `gamer_arcade_retro`: Gabinete Arcade 8-Bit Pixel con bordes stepped, marquesina 1UP y badge INSERT COIN.

### 🛠️ Maker & Taller Tecnológico:
10. `maker_blueprint`: Marco técnico blueprint, esquinas de escuadra CAD y marca de calibración ⌖ CALIB: 1:1.
11. `maker_workbench`: Marco de taller industrial, remaches ⨁ en esquinas, acento naranja y barra de fases.
12. `maker_circuit_pcb`: Placa electrónica PCB verde esmeralda con pistas doradas, vías GND y chip SMD.

### ⚡ Open Stream Suite Oficial:
13. `openstream_glass`: Neo-glassmorphism suizo, cristal glaseado de 16px con desenfoque de 24px y borde sutil.
14. `openstream_studio`: Marco broadcast pro de televisión con luz roja parpadeante ● ON AIR y cintillo ticker.

### 📜 Fantasía, Rol & Terror:
15. `fantasy_parchment`: Pergamino antiguo de rol D&D con bordes orgánicos asimétricos, sello de lacre carmesí ⚜ y oro viejo.
16. `fantasy_runic_stone`: Piedra rúnica de obsidiana con runas nórdicas ancestrales luminosas talladas en bordes.
17. `gothic_vampire`: Estilo victoriano oscuro / gótico con arcos ojivales, borde carmesí y emblema de murciélago 🦇.

### 💥 Cómic, Pop Art & Retro TV:
18. `comic_manga_action`: Tinta negra gruesa de 5px, sombras duras tipo cómic shonen y badge de impacto 💥 GO!!.
19. `pop_synth_neon`: Synthwave flúor de los 80s con rejilla horizonte en alambre, sol retro ☀ y bisel rosa/cian.
20. `vintage_crt_monitor`: Monitor de tubo analógico noventero con pantalla curva bulbosa, carcasa gris y LED ● POWER.

Modos especiales:
- `original`: No sobreescribe marcos ni bordes; preserva la estructura nativa original de la escena.
- `auto`: Resuelve dinámicamente a la forma insignia del arquetipo del tema activo (Cozy -> polaroid, Gamer -> mecha, Maker -> blueprint, OpenStream -> glass).

---

## 4. Contrato de Restauración

1. **Restaurar Estilo (`↺ Restaurar Estilo`)**:
   - Reestablece la paleta de color al tema por defecto de la escena.
   - Reestablece la forma física a `'auto'`.
   - Limpia query params `theme` y `shape` de la URL.
   - Persiste en backend: `POST /api/themes/overlay-assignment` con `{ overlayKey, themeId, shapeId: 'auto' }`.
   - Emite WebSocket `overlay_theme_change` para actualizar en vivo OBS Studio y el Panel.
2. **Restaurar Textos (`↺ Restaurar Textos`)**:
   - Reestablece únicamente los campos de texto editables a su contenido de fábrica sin alterar el estilo ni la forma.
3. **Bloqueo de Escena en OBS (`?lock=1` o `?lockTheme=1`)**:
   - Congela permanentemente la escena a los valores `theme` y `shape` pasados por URL, ignorando cambios globales de WebSocket. Ideal para Browser Sources fijas.

---

## 5. Reglas de Interoperabilidad Universal y Geometría

1. **Desacoplamiento Absoluto (`data-oss-*`)**:
   - Ningún pack debe depender de las clases CSS de otro pack.
   - Las 10 formas físicas se adhieren automáticamente a los selectores universales `[data-oss-cam="true"]`, `[data-oss-viewport="true"]`, `[data-oss-cam-label="true"]`, `[data-oss-panel="true"]`, `[data-oss-bar="top|bottom"]`.

2. **Adaptabilidad a Relaciones de Aspecto (16:9, 4:3, 21:9, 9:16)**:
   - Toda forma física debe calcularse con dimensiones relativas (`calc(100% - 24px)`) y pseudo-elementos anclados (`top: 6px; left: 6px;`).
   - Soportan de forma nativa cámaras 16:9 widescreen, 4:3 retro, 21:9 ultra-panorámicas y 9:16 verticales (móvil / TikTok Live) sin descolocar remaches ni deformar biseles.

3. **Aislamiento de Claves de Texto (`data-text-key`)**:
   - Toda escena debe utilizar prefijos de clave únicos (ej. `victory.title`, `cozy.cafeCamLabel`, `speedrun.game`).
   - Evita solapamiento de textos entre escenas (ej. victoria mostrando modo juego).
   - Inyección y guardado automáticos vía `dom-injector.js` y `05a-extract-texts.js`.

4. **Regla de Insets Positivos contra `clip-path`**:
   - En marcos con recortes poliédricos (`clip-path`), nunca usar coordenadas negativas (`top: -12px`).
   - Usar coordenadas interiores positivas (`top: 10px; left: 14px;`) para evitar que las etiquetas se corten.

5. **Paneles Flotantes Bajo Demanda (No Invasivos)**:
   - Paneles como temporizador Pomodoro, splits o frases BRB arrancan ocultos (`display: none;`).
   - Se activan con los botones contextuales de la barra superior HUD y se cierran con `✕`.

