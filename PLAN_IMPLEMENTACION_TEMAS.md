# Plan de implementación — Sistema de temas y formas por pack

> **Documento maestro autocontenido para cualquier modelo de IA.**
> Principio rector: **En caso de duda NO se asume nada; se lee el código o se mide, y se anota el resultado.**
> Todas las verificaciones previas (V1–V10) han sido comprobadas directamente en el código fuente.

---

## 0. Reglas de trabajo y desarrollo

1. **Rama y control de versiones**: Trabajar sobre la rama `dev`. Un commit por fase (o sub-fase), con mensajes convencionales (`feat(...)`, `refactor(...)`, `test(...)`). **NUNCA usar `git add -A` ni `git add .`**: añadir archivos explícitamente por nombre.
2. **Archivos protegidos del usuario (NO TOCAR NI COMMITEAR)**:
   - `app/config.js`
   - `app/overlay_texts_config.json`
   - `app/themes_state.json`
   - `app/widgets/goal/config.json`
   - `app/widgets/shoutout/config.json`
   - `app/widgets/ticker/config.json`
   - `app/widgets/timer/config.json`
3. **Tests automatizados**:
   - Línea base de partida: 426 tests en `cd app && ./venv/bin/python -m pytest tests -q` (~6 segundos).
   - La suite debe quedar 100% verde al final de cada fase. Si algún test obsoleto acoplado a arquetipos se reescribe o elimina, debe justificarse explícitamente en el commit.
4. **Entorno de pruebas y servidor**:
   - Usar siempre `SERVER_PORT=8099` para tests o ejecuciones del servidor de prueba.
   - No usar el puerto 8080 (pertenece a la sesión activa del usuario). Configurable en `app/server/config.py:55`.
5. **Búsquedas de código**:
   - Al buscar con `grep` o herramientas de inspección, excluir siempre `app/.backups`, `venv` y `__pycache__`.
6. **Línea base visual (Regresión visual obligatoria)**:
   - Script existente: `app/scripts/visual_baseline.py` (34 superficies, umbral 2 %, soporta `--base-url http://localhost:8099`, `--out` y `--compare`).
   - Capturar antes de tocar código de producto y comparar tras cada fase. Diferencias > 2 % solo se permiten si corresponden a cambios explícitos de la fase.

---

## 1. Estado verificado en código fuente

### 1.1 Las tres capas coexistentes
1. **Capa A (Temas de Pack)** (`app/streamthemes/<pack>/...`, `theme_engine.py`): Gobernaba colores `--color-*` pero también incluía geometría (`clip-path`, `border-radius`) acoplada por tema.
2. **Capa B (Formas genéricas)**: 9 formas (`rounded, box, bubble, scifi, pill, arcade, tag, slant, soft_card`) implementadas en `app/common/oss-shape.js` con CSS inline cargado de `!important`, `app/widgets/chat/js/styles.js:132-152` (que añade padding extra arbitrario) y `app/server/components_catalog.py:WIDGET_SHAPE_SET`.
3. **Capa C (Personalización de widgets)**: `app/common/widget-overrides.js` (`--widget-*`), `ThemePicker`, `app/tests/test_widget_style_overrides.py`. Mecanismo moderno y correcto que debe primar sobre cualquier valor de fábrica.

### 1.2 Hallazgos técnicos confirmados (H1–H18)
- **H1**: El motor en Python (`theme_engine._shape_from_raw`, `_shape_token_rule`) ya dispone de soporte para `paint`, `tokens` y `ornaments`, pero ningún `pack.json` los utilizaba.
- **H2**: El descubrimiento dinámico de escenas era inexistente: `app/scenes.json` se genera estáticamente desde `app/alerts/js/themes/05-scenes-data.js` (`scripts/build_scenes_json.py`). Claves de escena desconocidas eran ignoradas silenciosamente en `theme_manager._normalize_scene_state_map` y rechazadas en `validation_utils.is_valid_scene_key`.
- **H3**: El panel de administración (`OSS_SCENES` en `05-scenes-data.js` y `OVERLAY_FOLDERS` en `07-overlay-folders-data.js`) está consumido por ~12 archivos JS del panel. i18n se basa en claves `folder_catalog.<id>.*` mediante `getFolderLocalized` (`08-overlay-folders.js:115`).
- **H4**: `app/common/overlay.js` contenía constantes hardcodeadas: `detectCurrentSceneKey` (líneas 91–131), `detectCurrentPack` (por defecto `'maker'`), `getThemeArchetype`, `SHAPE_ARCHETYPE_MAP` (~300), `ARCHETYPE_DEFAULT_SHAPE_MAP`.
- **H5**: `resolveArchetypeAndShape` (332–372): en modo automático, un tema de otro pack alteraba la geometría de la escena, violando el principio de independencia estética.
- **H6**: `adaptAtmosphereForArchetype` (401): mutaba textos visibles en pantalla según un arquetipo hardcodeado (ej. "STREAM STARTING" -> "SYSTEM INITIALIZING"), sobrescribiendo textos del usuario.
- **H7**: `overlay.js` emite el evento vital `oss:themechange` (consumido por `common/overlay/backdrop-aperture.js:439`) y llama a `OSSAperture.recalculateApertures()`. **Debe conservarse intacto.**
- **H8**: La geometría de los temas variaba dentro de cada pack (ej. Gamer: 5 `clip-path` distintos en 5 temas; Cozy: 1 uniforme; Maker: hasta 6; Open: hasta 5). En modo original se consumían vía `components.css:20,49,165`. Las sombras contenían colores de acento embebidos (21 combinaciones).
- **H9**: Alertas: `card` y `banner` comparten el mismo `<body>`, pero cada una requiere su propio tema y forma independientes (`AlertShapes` en `02b-alert-shapes.js`). El simulador del panel inyectaba `data-theme-shape` en un `<div>` (`06-preview-test.js:105`) mientras las reglas CSS exigían `body[...]`.
- **H10**: `alerts_themes_config.json` y `alerts/css/alerts-themes.css` son residuos legacy de un sistema previo de 9 temas.
- **H11**: Editor de alertas en Studio: NO era código muerto. Claves como `bannerBorderColor`, `bannerTextColor`, `bannerFontFamily`, `bannerAccentColor`, `bannerAnimation`, `borderColor` y `fontFamily` son leídas activamente por `app/alerts/js/overlay/03-alert-queue.js`.
- **H12**: Fusiones (`app/server/services/fusions_service.py`): actúan como presets globales por lotes (`scenes[]`, `widgets[]`, `alerts[]`, `defaultTheme`, `defaultShape`).
- **H13**: `skin_schema.py` y `migrate_skin_v2.py`: herramientas obsoletas de 5 capas contradictorias con el modelo de 2 ejes.
- **H14**: `scripts/normalize_view_links.py` gestiona las etiquetas `<link>` del HTML. Su lista `COMMON_SLOTS` contiene referencias a arquetipos y `oss-skin`.
- **H15**: En widgets coexistían tres scripts de inyección: `widget-theme.js` (`OSSTheme`), `theme-bootstrap.js` y `oss-skin.js`.
- **H16**: Las plantillas HTML de las 27 escenas ya tienen integrados los hooks `data-oss-*` y cargan los scripts estándar.
- **H17**: 12 archivos de tests en `app/tests/` tienen dependencias explícitas de arquetipos y `oss-skin`.
- **H18**: Existe `scripts/build_theme_engine.py` para regeneración del motor.

### 1.3 Verificaciones exhaustivas del código fuente (V1–V10)
- **V1 (Inyección CSS en Goal y Ticker)**:
  - `app/widgets/goal/js/render.js`: inyecta estilos inline directamente en `card.style` (`--goal-accent`, `--goal-bar-start`, `--goal-bar-end`, background, borders, boxShadow, font).
  - `app/widgets/ticker/js/render.js`: define variables CSS `--tk-*` en `:root` e inyecta CSS personalizado en `<style id="ticker-custom-injected-css">`.
  - *Solución*: Goal debe usar variables CSS con fallback: `var(--widget-accent, var(--color-accent-primary, #57D6C4))`.
- **V2 (Comportamiento de `oss-skin.js`)**:
  - `adoptThemeColors`: comprobaba si el valor inline `--goal-accent` era igual al color de fábrica (`#57D6C4`); si era así, lo pisaba con `--color-accent-cyan`.
  - `adoptWidgetContentStyles`: busca selectores de contenido (`.chat-msg`, `.prompter-item`, `.goal-item`, `.shoutout-card-body`, `.timer-card`) y les coloca el atributo `data-oss-content-theme`. Requiere simplificarse bajo el nuevo motor.
- **V3 (Semántica de `activeShape` global)**:
  - En `app/server/services/theme_service.py:449` y `themes_state.json`: `activeShape` almacena la forma física global.
  - Orden de precedencia verificado en `overlay.js:590-595`:
    1. Parámetro URL (`?shape=...`)
    2. Forma explícita por escena (`overlayShapes[currentSceneKey]`)
    3. Forma global activa (`activeShape`)
    4. Forma de fábrica de la escena (`pack.json -> overlays[].defaultShape` o "original").
- **V4 (Persistencia de temas)**:
  - `save_theme_service`: `theme.json` es la fuente única de verdad. Convierte CSS entrante en tokens y `cssExtra`. `theme_render.regenerate_theme_css` compila `style.css`.
  - `regenerate_factory_copy`: compila `theme.default.json` hacia `style.default.css`.
- **V5 (Escaneo de carpetas en `streamthemes`)**:
  - `theme_manager.py:632` actualmente NO salta carpetas que comienzan por `_` o `.`. **Debe añadirse `pack_dir.name.startswith(('_', '.'))` y para temas `theme_dir.name.startswith(('_', '.'))`**.
- **V6 (Consumidores de `data-pack`)**:
  - Presente en el `<body>` de las 27 escenas y asignado en `overlay.js:440`. En CSS antiguo se usaba como selector de fallback: `body[data-pack="..."]:not([data-theme-archetype])`. Pasa a ser puramente un atributo informativo del origen de la escena.
- **V7 (Comportamiento de `sync_chat_with_theme`)**:
  - `theme_manager.py:718`: solo sincroniza `borderColor` (`accentCyan`), `bgColor` (`bgDark`) y `glowIntensity`. **NO toca tipografías ni geometría.**
- **V8 (Soporte `--base-url` en el harness)**:
  - `app/scripts/visual_baseline.py:105` soporta `--base-url` (por defecto `http://localhost:8080`). Verificado.
- **V9 (UI de alertas en Alerts Studio)**:
  - Donaciones tiene subpestañas por pasarela (`kofi`, `paypal`, `bmc`, `streamlabs`).
  - Las alertas estándar comparten el modo Card vs Banner. Los campos del editor de banner corresponden a las claves leídas por `03-alert-queue.js`.
- **V10 (Comportamiento de Python 3.12 con symlinks)**:
  - Verificado experimentalmente: `Path.rglob()` en Python 3.12 **NO sigue symlinks a directorios**. `os.walk(followlinks=True)` y `Path.glob('*/*')` sí los siguen.
  - Para evitar recursión infinita y escenas duplicadas en el descubrimiento de escenas, se debe usar `path.resolve()` y un conjunto de rutas canónicas (`set()`).

---

## 2. Decisiones arquitectónicas fundamentales

Para garantizar la máxima **robustez, mantenibilidad y personalización**, se fijan las siguientes decisiones:

- **D1 (Escena sin forma explícita)**: Conserva su aspecto nativo original de fábrica (`original`). Ninguna escena cambia de aspecto espontáneamente si el usuario no lo pide.
- **D2 (Catálogo `core` de formas)**: Las 9 formas genéricas pasan al catálogo `core`. Se empaquetan en el mismo formato estándar de los packs, **sin `!important`**, y se listan en todos los selectores de forma.
- **D3 (Descubrimiento automático de escenas)**: Las escenas se descubren dinámicamente escaneando las carpetas de `streamthemes/`. Metadatos opcionales van en `pack.json -> overlays[]`. Se conservan íntegras las 27 claves de escena existentes.
- **D4 (Extracción de formas nativas por pack)**: La geometría de los temas actuales se extrae como formas nativas por pack (deduplicadas por tupla idéntica de propiedades). En `pack.json -> overlays[]`, cada escena declara su `defaultShape` nativa. Cambiar de tema dentro de un pack solo cambia colores; cambiar de forma solo cambia geometría.
- **D5 (Separación de sombras y resplandores)**:
  - **Tema (`theme.json`)**: define el color y halo de luz (`--color-shadow-frame`, `--color-shadow-panel`, `--color-glow`).
  - **Forma (`shape.json`) / Componente**: define la elevación física (offset X/Y, blur, spread).
  - Al cambiar de tema, la sombra adopta el color/tinte del nuevo tema; al cambiar de forma, adopta el corte o radio geométrico.
- **D6 (Eliminación de `adaptAtmosphereForArchetype`)**:
  - Se elimina totalmente la mutación automática de textos por código en `overlay.js`. Los textos visibles pertenecen estrictamente a la configuración del usuario (`overlay_texts_config.json`).
- **D7 (Tipografía ligada a la Forma)**:
  - Las fuentes display y body (`--shape-font-display`, `--shape-font-body`) pertenecen a la **Forma**, ya que la tipografía es parte intrínseca de la identidad visual estructural (retro/pixel, sci-fi/angular, cozy/redondeada, minimal).
  - El usuario puede sobrescribir cualquier fuente en cualquier widget mediante `--widget-font-family`.
- **D8 (Jerarquía estricta de personalización de widgets)**:
  1. `--widget-*` (personalización manual en el panel guardada en `styleOverrides`) -> **MÁXIMA PRIORIDAD**.
  2. `--shape-*` y `--color-*` del pack/tema/forma asignado.
  3. Estilos legacy (`styles.*` de `config.json`) -> solo aplican si no hay piel activa (`body:not([data-oss-skinned])`).
- **D9 (Fusiones como Presets de Setup Global Multi-Pack)**:
  - Una Fusión es un preset de configuración que permite guardar combinaciones arbitrarias de múltiples packs (ej: Escena 1 de Pack Gamer con Tema Cyberpunk y Forma Box; Chat de Pack Cozy; Alerta de Pack Open).
  - Se elimina el campo `archetype`.
  - La exportación (`export_fusion_as_pack`) empaqueta una copia limpia de metadatos sin generar symlinks problemáticos.

---

## 3. Contratos de datos objetivo

### 3.1 Estructura estándar de un Pack en disco
```
app/streamthemes/<Pack_Name>/
├── pack.json                      # Manifiesto v3 del pack
├── styles/                        # Temas de color
│   └── <theme_id>/
│       ├── theme.json             # Tokens de color v3
│       ├── theme.default.json     # Valores de fábrica
│       └── style.css              # CSS generado automáticamente
├── shapes/                        # Formas nativas del pack (opcional si están en pack.json)
│   └── <shape_id>/
│       └── shape.json
└── overlays/                      # Escenas pertenecientes al pack
    └── <scene_folder>/
        ├── index.html
        ├── css/
        └── js/
```

### 3.2 Contrato `theme.json` v3 (Solo Color y Luz)
```json
{
  "id": "cyber_glitch",
  "name": "Cyber Glitch",
  "packId": "Gamer_Pro_Pack",
  "tokens": {
    "--color-accent-primary": "#00FFCC",
    "--color-accent-secondary": "#FF0055",
    "--color-bg-base": "#0A0A12",
    "--color-bg-surface": "#121220",
    "--color-bg-elevated": "#1A1A2E",
    "--color-text-main": "#FFFFFF",
    "--color-text-dim": "#8A8AA0",
    "--color-border": "rgba(0, 255, 204, 0.3)",
    "--color-shadow-frame": "rgba(0, 255, 204, 0.4)",
    "--color-shadow-panel": "rgba(0, 0, 0, 0.7)",
    "--color-glow": "#00FFCC"
  },
  "glowIntensity": 60
}
```
*Prohibido en `theme.json`*: propiedades de geometría (`border-radius`, `clip-path`, `padding`, grosores de borde) y familias tipográficas.

### 3.3 Contrato `pack.json` v3
```json
{
  "id": "Gamer_Pro_Pack",
  "name": "Gamer Pro Pack",
  "version": "3.0.0",
  "shapes": [
    {
      "id": "gamer_cut",
      "name": "Gamer Angular Cut",
      "tokens": {
        "--shape-radius": "0px",
        "--shape-clip-path": "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))",
        "--shape-border-width": "2px",
        "--shape-padding": "16px",
        "--shape-font-display": "'Orbitron', sans-serif",
        "--shape-font-body": "'Inter', sans-serif"
      }
    }
  ],
  "overlays": [
    {
      "key": "gamer_gameplay",
      "folder": "gameplay_hud",
      "name": "Gameplay HUD",
      "defaultShape": "gamer_cut",
      "defaultTheme": "cyber_glitch"
    }
  ]
}
```

### 3.4 Contrato de Formas `core` (Embebidas)
Ubicación: `app/common/core-shapes.json` o expuestas por el servicio de catálogo:
- IDs estables: `rounded`, `box`, `bubble`, `scifi`, `pill`, `arcade`, `tag`, `slant`, `soft_card`.
- Mismo esquema de tokens que las formas de pack.
- Cero directivas `!important`.

### 3.5 Claves de Escena (27 oficiales)
Se mantienen exactamente las 27 claves existentes:
1. `print-machine`
2. `print-design`
3. `maker-pc`
4. `maker-desk`
5. `game`
6. `chill`
7. `ending`
8. `beRightBack`
9. `startingSoon`
10. `gamer_gameplay`
11. `gamer_speedrun`
12. `gamer_victory`
13. `gamer_ending`
14. `gamer_brb`
15. `gamer_starting`
16. `oss_desktop`
17. `oss_podcast`
18. `oss_ending`
19. `oss_brb`
20. `oss_starting`
21. `oss_chatting`
22. `cozy_cafe`
23. `cozy_pomodoro`
24. `cozy_art`
25. `cozy_brb`
26. `cozy_ending`
27. `cozy_starting`

Para escenas nuevas añadidas en packs externos: la clave descubierta por defecto es `<packId>/<overlayFolder>`. `validation_utils.is_valid_scene_key` validará tanto las 27 tradicionales como las descubiertas válidas.

---

## 4. Fases de ejecución paso a paso

### Fase 0 — Línea base y auditoría de geometría
- **Objetivo**: Establecer la captura de regresión visual de las 34 superficies y extraer el mapa exacto de geometrías actuales por pack.
- **Acciones**:
  1. Ejecutar el servidor de pruebas en puerto 8099: `SERVER_PORT=8099 ./venv/bin/python -m server.main`.
  2. Ejecutar captura visual base: `./venv/bin/python app/scripts/visual_baseline.py --base-url http://localhost:8099 --out baseline_before`.
  3. Crear script `app/scripts/audit_pack_geometry.py` para parsear los `style.css` y `components.css` actuales de los 4 packs existentes, extrayendo las tuplas de geometría (`clip-path`, `border-radius`, bordes) y deduplicándolas para crear las formas nativas de la Fase 2.
- **Criterio de Aceptación (CA)**:
  - Directorio `baseline_before` contiene las 34 capturas PNG.
  - El script genera el reporte JSON con los IDs de forma nativa a crear por pack.
  - `pytest tests -q` pasa al 100% (426 tests).

### Fase 1 — Descubrimiento dinámico de escenas desde disco
- **Objetivo**: Eliminar las listas fijas de escenas en el backend y permitir que soltar un pack en `streamthemes/` lo haga visible de inmediato.
- **Acciones**:
  1. En `app/server/services/theme_manager.py`:
     - Crear función `discover_pack_overlays(pack_dir: Path) -> list[dict]`.
     - Validar que ignore carpetas que comiencen por `.` o `_`.
     - Descartar symlinks circulares o duplicados usando `path.resolve()`.
     - Leer `overlays/` en el pack. Si existe `pack.json -> overlays[]`, complementar metadatos (nombre, defaultShape, defaultTheme). Si no, inferir nombre del directorio.
  2. Actualizar `app/server/services/validation_utils.py`:
     - `is_valid_scene_key(key)` debe aceptar las 27 claves tradicionales y cualquier clave de escena descubierta en los packs activos.
  3. Actualizar generación/servicio de catálogo de escenas:
     - El endpoint `/api/themes/packs` (o `/api/scenes`) expone la lista viva de escenas.
  4. Refactorizar el panel de administración (`app/alerts/js/themes/05-scenes-data.js` y consumidores):
     - `OSS_SCENES` y `OVERLAY_FOLDERS` se inicializan a partir de la respuesta del endpoint, manteniendo las constantes históricas como fallback estático para offline.
- **Criterio de Aceptación (CA)**:
  - Añadir una carpeta dummy en `streamthemes/Test_Pack/overlays/test_scene/index.html` hace que el backend y el panel la reconozcan sin editar ningún archivo fuera de `streamthemes/Test_Pack/`.
  - Las 27 escenas oficiales mantienen exactamente sus nombres y rutas en el panel.
  - Tests unitarios de descubrimiento añadidos y verdes.

### Fase 2 — Desacoplamiento: Temas solo color y Formas nativas
- **Objetivo**: Separar el eje de color del eje de forma en los packs existentes.
- **Acciones**:
  1. Crear las formas nativas identificadas en la Fase 0 en `pack.json` de cada uno de los 4 packs (`Maker_Theme_Pack`, `Gamer_Pro_Pack`, `Open_stream_Pack`, `Cozy_LoFi_Pack`).
  2. En `pack.json -> overlays[]`, asignar el `defaultShape` correspondiente a cada una de las 27 escenas para que su geometría por defecto sea idéntica a la actual.
  3. Limpiar `theme.json` de cada tema: retirar `clip-path`, `border-radius`, etc. Mover sombras con color a `--color-shadow-frame`, `--color-shadow-panel` y `--color-glow` (D5).
  4. Actualizar `theme_render.py` y `components.css`:
     - La geometría de los componentes se vincula a `var(--shape-clip-path)`, `var(--shape-radius)`, etc.
     - El color se vincula a `var(--color-*)`.
- **Criterio de Aceptación (CA)**:
  - Comparación visual contra `baseline_before` con umbral ≤ 2%.
  - Cambiar de tema dentro de Gamer o Maker cambia el color del overlay sin alterar su corte geométrico.

### Fase 3 — Catálogo `core` de formas y eliminación de `!important`
- **Objetivo**: Unificar las 9 formas genéricas en un catálogo compartido de primer nivel.
- **Acciones**:
  1. Crear archivo de definición `app/common/core-shapes.json` (o módulo equivalente) con las 9 formas (`rounded, box, bubble, scifi, pill, arcade, tag, slant, soft_card`).
  2. Eliminar las reglas CSS con `!important` de `app/common/oss-shape.js`.
  3. Extraer el padding que inyectaba `app/widgets/chat/js/styles.js:132-152` y convertirlo en el token `--shape-padding` de cada forma correspondiente.
  4. Exponer las formas `core` en el selector de formas del panel (`ThemePicker` y selectores de escenas/alertas/widgets) junto con las formas nativas de los packs.
- **Criterio de Aceptación (CA)**:
  - Las formas `core` se aplican correctamente en chat, goal, ticker, overlays y alertas sin `!important`.
  - Cero incidencias de `!important` en el catálogo de formas.

### Fase 4 — Motor de aplicación unificado en cliente (`overlay-theme-engine.js`)
- **Objetivo**: Reemplazar la dispersión de scripts (`overlay.js` hardcodeado, `widget-theme.js`, `theme-bootstrap.js`, `oss-skin.js`) por un flujo unificado y transparente.
- **Acciones**:
  1. En `app/common/overlay.js`:
     - Eliminar funciones hardcodeadas: `getThemeArchetype`, `SHAPE_ARCHETYPE_MAP`, `ARCHETYPE_DEFAULT_SHAPE_MAP`.
     - Eliminar `resolveArchetypeAndShape`: aplicar un tema de otro pack ya NO muta la forma en modo auto.
     - Eliminar `adaptAtmosphereForArchetype` (D6).
     - Conservar intacto el despacho del evento `oss:themechange` y la invocación de `OSSAperture.recalculateApertures()` (H7).
  2. Implementar la resolución jerárquica unificada de forma (V3):
     - `URL param` > `overlayShapes[sceneKey]` > `activeShape` > `defaultShape`.
  3. Unificar la lógica de bootstrapping para widgets y overlays, asegurando que `data-oss-skinned` y las variables CSS se inyecten de manera síncrona sin parpadeos (FOUC).
- **Criterio de Aceptación (CA)**:
  - Un overlay del pack Gamer puede recibir un tema del pack Cozy (cambia su paleta a tonos pastel/lo-fi manteniendo su corte angular) o una forma del pack Cozy (adopta bordes redondeados manteniendo su paleta gamer).
  - Aperturas de cámara (`OSSAperture`) se recalculan sin fallos en cada cambio.

### Fase 5 — Estandarización de Widgets
- **Objetivo**: Garantizar que todos los widgets acepten tema y forma de cualquier pack preservando la personalización del usuario y todas sus funcionalidades.
- **Acciones**:
  1. En `app/widgets/goal/js/render.js`:
     - Sustituir la inyección inline forzada de `--goal-accent` (V1) por variables CSS estándar:
       `var(--widget-accent, var(--color-accent-primary, #57D6C4))`.
     - Respetar `styles.*` legacy solo si el elemento no está bajo `data-oss-skinned` (D8).
  2. En `app/widgets/ticker/js/render.js`:
     - Mapear variables `--tk-accent`, `--tk-bg`, etc. hacia `var(--widget-*, var(--color-*))`.
     - Mantener colores semánticos de plataforma (`--tk-sub`, `--tk-bits`, `--tk-tip`) intactos.
  3. En `app/widgets/chat/js/styles.js`:
     - Asegurar que la tipografía responda a `var(--widget-font-family, var(--shape-font-body))`.
  4. Revisar widgets `shoutout`, `timer`, `promo`:
     - Asegurar selectores consistentes con `data-oss-content-theme`.
- **Criterio de Aceptación (CA)**:
  - Todos los widgets pasan la checklist del §6.
  - Personalizaciones manuales en el panel (`styleOverrides`) tienen prioridad sobre el pack.
  - Si no hay personalización manual, el widget adopta impecablemente el tema y la forma seleccionados.

### Fase 6 — Desacoplamiento de Alertas (Card vs Banner independientes)
- **Objetivo**: Permitir que la tarjeta de alerta y el banner de alerta tengan tema y forma propios, y alinear el simulador del panel con el overlay real.
- **Acciones**:
  1. Modificar `app/alerts/js/overlay/03-alert-queue.js`:
     - Mover los atributos `data-theme` y `data-theme-shape` desde `document.body` a los contenedores específicos `#alert-card` y `#alert-banner`.
  2. En las reglas CSS de alertas:
     - Ajustar los selectores para que operen sobre el contenedor (`.alert-card[data-theme-shape="..."]`, `.alert-banner[...]`) en lugar de `body[...]`.
  3. En `app/alerts/js/alerts-studio/06-preview-test.js:105`:
     - Alinear el simulador del panel para que aplique los atributos directamente en el elemento de prueba.
  4. Limpieza del editor de alertas:
     - Mantener las claves funcionales auditadas (V9, H11: `bannerBorderColor`, `bannerTextColor`, `bannerFontFamily`, `bannerAccentColor`, `bannerAnimation`, `borderColor`, `fontFamily`).
     - Retirar del HTML y de los scripts únicamente las claves y selectores 100% huérfanos.
  5. Retirar referencias a `alerts_themes_config.json` y `alerts-themes.css` (H10).
- **Criterio de Aceptación (CA)**:
  - Se puede configurar `card` con Tema Cyber Glitch + Forma Box, y simultáneamente `banner` con Tema Matcha Bamboo + Forma Bubble.
  - El simulador de prueba en vivo refleja con 100% de fidelidad lo que se ve en OBS.

### Fase 7 — Limpieza de tooling obsoleto y actualización de tests
- **Objetivo**: Eliminar deuda técnica y sincronizar la suite de pruebas con la arquitectura de 2 ejes.
- **Acciones**:
  1. Eliminar archivos muertos: `app/server/skin_schema.py` y `app/server/migrate_skin_v2.py`.
  2. Actualizar `scripts/normalize_view_links.py`:
     - Limpiar `COMMON_SLOTS` retirando hojas de estilo de arquetipos inexistentes.
     - Ejecutar el script para normalizar todos los HTML del proyecto.
  3. Actualizar la suite de tests en `app/tests/` (H17):
     - Refactorizar tests que verificaban cadenas de arquetipos hacia la verificación del contrato de formas y temas.
     - Asegurar que `test_theme_engine_contract`, `test_component_skin_contract`, `test_theme_catalog_auto`, etc., validen el nuevo esquema.
- **Criterio de Aceptación (CA)**:
  - `git grep -i "archetype"` en código de producto no devuelve lógica viva de negocio.
  - Suite de tests `pytest` 100% verde.

### Fase 8 — Fusiones (Presets Globales Multi-Pack)
- **Objetivo**: Limpiar el servicio de fusiones para que opere como gestor de presets multi-pack de 2 ejes.
- **Acciones**:
  1. En `app/server/services/fusions_service.py`:
     - Eliminar cualquier referencia a `archetype` en la creación, carga y aplicación de fusiones.
     - Mantener `apply_fusion_theme_batch` y `apply_fusion_shape_batch` para aplicar configuraciones por lotes a escenas, widgets y alertas.
  2. En `export_fusion_as_pack`:
     - Generar el pack exportado como una carpeta autocontenida sin symlinks que puedan romper `Path.rglob()` o generar duplicados (V10).
- **Criterio de Aceptación (CA)**:
  - Guardar y aplicar una fusión restaura temas y formas en todas las escenas y widgets sin errores de validación.
  - Exportar una fusión como pack no genera escenas duplicadas en el descubrimiento de escenas.

### Fase 9 — Verificación final y validación E2E
- **Objetivo**: Validación integral visual, funcional y de extensibilidad.
- **Acciones**:
  1. Ejecución completa del harness visual:
     `./venv/bin/python app/scripts/visual_baseline.py --base-url http://localhost:8099 --compare baseline_before baseline_final`
     Verificar que cualquier desviación visual esté perfectamente justificada por el nuevo sistema.
  2. Prueba del caso de uso principal del usuario:
     - Crear un pack nuevo de prueba `Custom_Test_Pack` con 1 overlay y 1 forma propia.
     - Asignar a un overlay de `Gamer_Pro_Pack` la forma de `Custom_Test_Pack`.
     - Asignar al overlay de `Custom_Test_Pack` el tema de `Cozy_LoFi_Pack`.
     - Comprobar funcionamiento en vivo.
     - Eliminar el pack de prueba al concluir.
- **Criterio de Aceptación (CA)**:
  - Todos los criterios de aceptación del BRIEF cumplidos al 100%.
  - Archivos de configuración del usuario intactos.

---

## 5. Checklist de funciones por widget

Antes y después de tocar código de widgets, verificar que se preservan todas estas capacidades:

| Widget | Capacidades a conservar | Verificación de skinning |
| :--- | :--- | :--- |
| **Chat** (`widgets/chat`) | Badges de Twitch, emotes (Twitch, BTTV, 7TV), animación de entrada, scroll suave, eliminación de mensajes borrados por moderación. | Respeta `--shape-font-body`, `--shape-radius`, `--shape-clip-path`. Padding viene de la forma sin desbordar el contenedor. |
| **Goal** (`widgets/goal`) | Metas múltiples, cálculo de porcentaje en tiempo real, barra de progreso con gradiente, persistencia de estado de meta. | Acento responde a `var(--widget-accent, var(--color-accent-primary))`. Borde y brillo responden a forma y tema sin pisar con inline styles. |
| **Ticker** (`widgets/ticker`) | Modo carrusel continuo / prompter, eventos de follow, sub, raid, bits, donaciones (Ko-fi, PayPal, BMC), Top Tier bar superior. | Colores de plataforma fijos se respetan. Fondo, bordes y acento general adoptan tema y forma. CSS personalizado del usuario se preserva en `#ticker-custom-injected-css`. |
| **Shoutout** (`widgets/shoutout`) | Avatar del streamer, clips en vídeo/audio, etiquetas de categoría y juego, animaciones de apertura. | Tarjeta adopta tema y forma. Contenido interior legible con contraste asegurado. |
| **Timer** (`widgets/timer`) | Cuenta atrás / cronómetro, avisos de sonido, pausas, visualización digital. | Contenedor responde a la forma del pack activo. Tipografía numérica legible. |
| **Alertas** (`alerts`) | Cola de alertas con prioridad, reproducción de sonido/chimes, soporte multimedia (GIF, WebM, audio), sustitución de variables `{user}`, `{amount}`. | Card y Banner independientes con su propio tema y forma. Simulador del panel idéntico a salida de OBS. |

---

## 6. Mapa completo de archivos a intervenir

- **Backend (Python)**:
  - `app/server/services/theme_manager.py`: descubrimiento de escenas de disco, escaneo de packs ignorando `_` y `.`.
  - `app/server/services/theme_engine.py`: soporte nativo de formas sin arquetipos, tokens `--color-*` y `--shape-*`.
  - `app/server/services/theme_service.py`: endpoints de guardado y aplicación de forma/tema.
  - `app/server/services/theme_render.py`: regeneración de CSS a partir de `theme.json` v3.
  - `app/server/services/validation_utils.py`: validación de claves de escena descubiertas y formas.
  - `app/server/services/fusions_service.py`: presets sin arquetipos, exportación limpia.
  - `app/server/components_catalog.py`: catálogo dinámico de componentes y formas compatibles.
- **Frontend común (JS / CSS)**:
  - `app/common/overlay.js`: desmantelamiento de hardcodes, eliminación de `adaptAtmosphereForArchetype`, mantenimiento de `oss:themechange`.
  - `app/common/oss-shape.js`: retiro de reglas `!important`.
  - `app/common/widget-overrides.js`: consolidación de prioridad máxima `--widget-*`.
  - `app/common/core-shapes.json`: definición unificada de las 9 formas genéricas.
  - `app/common/generated/`: regeneración de hojas de estilo compartidas.
- **Panel de administración (JS)**:
  - `app/alerts/js/themes/05-scenes-data.js`: transición de lista hardcodeada a consumo dinámico del catálogo.
  - `app/alerts/js/themes/07-overlay-folders-data.js` y `08-overlay-folders.js`: soporte de carpetas de escenas dinámicas.
  - `app/alerts/js/alerts-studio/02a-layout-dom.js` y `06-preview-test.js`: alineación del simulador y saneado del editor de alertas.
- **Overlays y Widgets**:
  - `app/alerts/js/overlay/03-alert-queue.js`: aislamiento de atributos en `#alert-card` y `#alert-banner`.
  - `app/widgets/goal/js/render.js`: uso de variables CSS para acentos y bordes en lugar de estilos inline absolutos.
  - `app/widgets/ticker/js/render.js`: vinculación limpia de variables de tema.
- **Scripts de mantenimiento**:
  - `app/scripts/audit_pack_geometry.py` (nuevo): auditoría y extracción de formas.
  - `scripts/normalize_view_links.py`: saneado de ranuras de scripts y hojas de estilo.
  - `app/scripts/visual_baseline.py`: arnés de verificación.

---

## 7. Matriz de riesgos y mitigaciones

| Riesgo | Impacto | Mitigación rigurosa |
| :--- | :--- | :--- |
| **Regresión visual silenciosa al separar colores de formas** | Alto | Ejecutar `visual_baseline.py` antes de comenzar y al final de cada fase con umbral del 2%. |
| **Claves de escena no reconocidas por el backend** | Crítico | Modificar `validation_utils.is_valid_scene_key` en la Fase 1 antes de modificar el catálogo del frontend. |
| **Sobrescritura accidental del estado del usuario** | Crítico | Lista explícita de archivos protegidos (§0); prohibido usar `git add -A`. |
| **Colisiones de estilos en widgets con configuraciones previas** | Medio | Jerarquía D8: `styleOverrides` (`--widget-*`) gana; `styles.*` legacy solo aplica como fallback sin skin. |
| **Recursión infinita o duplicación por symlinks en packs** | Medio | Uso de `path.resolve()` y un `set()` de rutas canónicas en el servicio de descubrimiento (V10). |

---

## 8. Checklist de entrega final

- [ ] Cero referencias a lógica de `archetype` en código activo de Python o JS.
- [ ] Archivos obsoletos `skin_schema.py` y `migrate_skin_v2.py` eliminados.
- [ ] Directivas `!important` erradicadas del catálogo de formas.
- [ ] `normalize_view_links.py` ejecutado y todos los enlaces `<link>` al día.
- [ ] Los 426 tests originales (o sus versiones migradas sin arquetipos) pasan al 100%.
- [ ] Nuevos tests unitarios y de integración cubren el descubrimiento de escenas y cruce de temas/formas.
- [ ] Comparación de regresión visual validada.
- [ ] Archivos de configuración de usuario (`config.js`, `themes_state.json`, etc.) intactos.

---

## 9. Nota de corrección — revisión contra el repositorio

> Añadida tras contrastar el plan con el código real: rama `dev`, commit `6f3b14d`, 426 tests verdes.
> **No cambia el modelo ni las fases.** Son cuatro correcciones, dos datos erróneos y una reordenación.
> Cada afirmación se puede comprobar con el comando que se indica al lado.

### 9.1 BLOQUEANTE — el renombrado de la paleta tumba las 34 superficies

El §3.2 propone estrenar nombres nuevos de token (`--color-accent-primary`, `--color-bg-base`, `--color-bg-surface`, `--color-bg-elevated`, `--color-text-main`, `--color-border`, `--color-shadow-frame`…).

Los tokens que existen HOY son otros doce:

```bash
grep -o '\-\-color-[a-z-]*' app/common/themes.css | sort -u
# --color-accent-cyan  --color-accent-cyan-text  --color-accent-orange
# --color-accent-orange-text  --color-bg-dark  --color-border-cyan
# --color-border-cyan-bright  --color-on-accent-cyan  --color-on-accent-orange
# --color-panel-bg  --color-text-dim  --color-text-light
```

Esos nombres los consumen **27 escenas + 6 widgets + `alerts/css/*.css` + `panel.css` + los 21 `style.css` de tema**. Un renombrado sin red de seguridad no deja el arnés en ≤2 %: lo deja en rojo en todas las superficies.

**Regla obligatoria:** durante toda la migración, cada nombre nuevo se declara como **alias** del viejo, en un único bloque:

```css
:root {
  --color-accent-primary:   var(--color-accent-cyan);
  --color-accent-secondary: var(--color-accent-orange);
  --color-bg-base:          var(--color-bg-dark);
  --color-bg-surface:       var(--color-panel-bg);
  --color-text-main:        var(--color-text-light);
  --color-border:           var(--color-border-cyan);
}
```

Y **solo al final**, cuando el arnés siga en ≤2 % con los alias puestos, se renombra en los consumidores y se retiran los alias en un commit aparte. Si se hace al revés, cualquier fallo visual será indistinguible de la migración.

### 9.2 BLOQUEANTE — la fusión del §D9 no es la que pidió el usuario

El plan define la fusión como *"preset de configuración que permite guardar combinaciones arbitrarias de múltiples packs"*, con cada miembro conservando **su** tema y **su** forma.

El usuario la definió así, literalmente:

> «Una fusión sería simplemente como hacer un pack nuevo a partir de overlays de otros. O sea no tiene complicación, luego los estilos y formas se le aplican de forma normal.»

Son dos cosas distintas:

| | Plan (§D9) | Usuario |
|---|---|---|
| Qué es | lista de asignaciones por miembro | **un pack** cuyos overlays vienen de otros packs |
| Apariencia | una por miembro | **una** para el conjunto, aplicada como a cualquier pack |
| `export_fusion_as_pack` | empaqueta metadatos | **materializa la carpeta** real en `streamthemes/` |
| Operaciones extra | `apply_fusion_theme_batch`, `apply_fusion_shape_batch` | **ninguna**: aplicar a la fusión = aplicar a un pack |

**Acción:** decidir antes de la Fase 8. Si se adopta la definición del usuario, la Fase 8 **se reduce**: no hay operaciones por capa ni `defaultPack`; solo materializar la carpeta y reutilizar el flujo normal de pack.

### 9.3 BLOQUEANTE — la Fase 1 es el mayor riesgo y está la primera

El descubrimiento dinámico de escenas toca: `server/services/scenes_catalog.py`, `validation_utils.is_valid_scene_key`, `alerts/js/themes/05-scenes-data.js`, `07-overlay-folders-data.js`, `08-overlay-folders.js`, las claves i18n `folder_catalog.*` y ~12 ficheros JS del panel.

Es el cambio más grande del plan y **no es necesario para el objetivo**, que es la apariencia. Además, al ir en primera posición, cualquier problema ahí bloquea las fases 2–8.

**Acción:** moverla al final (ver §9.6) o dejarla fuera del alcance de esta entrega. El requisito «un pack nuevo funciona sin tocar los demás» se cumple igual: un pack nuevo trae sus `overlays/`, y su apariencia se resuelve desde su `pack.json`, sin necesidad de que el panel lo registre dinámicamente.

### 9.4 Faltan los dos caminos del runtime que ya han costado horas

Ninguno de los dos aparece en las fases, y sin ellos la migración «funciona en los ficheros» pero no cambia nada en pantalla:

**(a) `common/themes.css` NO se genera desde `theme.json`.** Se compila desde cada `styles/<tema>/style.css`:

```bash
grep -n "def sync_common_themes_css" -A 32 app/server/services/theme_manager.py
```

Si la Fase 2 limpia los `theme.json` y no limpia los `style.css`, la geometría **sigue viva** en `themes.css`, que es lo que carga el navegador.
**Acción:** la limpieza de geometría se hace en los **21 `style.css`** (y en `theme.json` a la vez), y se regenera `themes.css` en el mismo commit.

**(b) `theme_service.save_theme` reescribe `theme.json`** con `tokens` y `archetype`:

```bash
grep -n "current_meta\[.tokens.\]\|current_meta\[.archetype.\]" app/server/services/theme_service.py
```

El primer guardado desde el panel **revierte** la migración del tema.
**Acción:** cambiar ese camino para que escriba el contrato v3 y añadir un test que guarde un tema y compruebe que sigue sin geometría.

### 9.5 Dos datos erróneos en el plan (corregirlos antes de ejecutarlo)

| El plan dice | La realidad | Comprobación |
|---|---|---|
| `scripts/build_scenes_json.py` genera `app/scenes.json` | Ese script **no existe**. `scenes.json` lo sirve/genera `app/server/services/scenes_catalog.py` | `grep -rln 'scenes.json' app/server app/scripts --include='*.py'` |
| Arrancar con `./venv/bin/python -m server.main` | **No existe** `main.py` ni el módulo. El entrypoint es `app/server.py` (o `app/launcher.py`) | `ls app/server.py app/launcher.py` |
| §3.1 propone `shapes/<id>/shape.json` y §3.3 `pack.json → shapes[]` | Dos fuentes para lo mismo | — |

**Acción:** un único origen por cosa. Recomendado: **las formas en `pack.json → shapes[]`**, porque el motor ya las lee de ahí (`theme_engine._shape_from_raw`) y así el pack sigue siendo autocontenido con un solo fichero de manifiesto.

### 9.6 Orden recomendado (sustituye al §4 en el orden, no en el contenido)

El criterio es: **primero lo que desbloquea el objetivo, al final lo que más superficie toca.**

```
0. Base + arnés visual + auditoría de geometría          (como el §4.0)
1. Matar la tercera capa: arquetipos, --skin-*, data-theme-archetype,
   los 4 bloques de styles.css y los mapas a mano de overlay.js:312 / config.js:413
2. Tema = solo color  →  21 style.css + 21 theme.json + save_theme + themes.css regenerado
3. Formas con contenido  →  geometry + paint + (tipografía, si se confirma D7)
4. Runtime único + erradicar !important de las formas genéricas y del CSS inyectado
5. Alertas y simulador del panel
6. Widgets: quitar la geometría inline y el applyChatShape del chat
7. Fusión (con la definición de §9.2)
8. Descubrimiento dinámico de escenas   ← opcional, al final
9. Limpieza de ficheros obsoletos, tests y documentación
```

La razón de bajar la Fase 1: si el descubrimiento dinámico falla, no debe impedir que el usuario tenga ya colores y formas separados.

### 9.7 Prueba de aceptación que falta en el checklist del §8

Añadir al `§8 Checklist de entrega final`:

- [ ] **Pack autónomo**: copiar `Maker_Theme_Pack` a `app/streamthemes/Test_Pack/`, cambiarle los colores, reiniciar, y el pack aparece en el panel y se aplica a cualquier overlay **sin haber editado un solo fichero fuera de esa carpeta**. Si hace falta tocar `archetypes.json`, `styles.css` o cualquier JS compartido, el modelo no está terminado.
- [ ] **Cruce de packs**: un overlay de `Gamer` con un tema de `Cozy` cambia de paleta y **conserva su geometría**; con una forma de `Cozy` cambia de geometría y **conserva su paleta**.
- [ ] **Independencia de los selectores**: elegir forma **no** modifica el tema seleccionado, y elegir tema **no** modifica la forma.
- [ ] **Paridad de preview**: el simulador del panel mide **los mismos** valores computados que la página real.
- [ ] **Cero `!important`** en propiedades de apariencia de `skin.css`, del catálogo de formas y del CSS inyectado por los widgets.

### 9.8 Reglas que no se negocian (las que ya costaron horas)

1. **`!important` gana siempre a cualquier especificidad.** No se compensa con selectores más largos: se elimina.
2. **El shorthand `background` resetea `background-image`.** Toda capa de piel debe usar `background-color`, `background-image`, `background-size`… por separado. Si no, borra la decoración de la forma.
3. **Un comentario CSS mal cerrado hace que el navegador descarte la regla entera, en silencio.** Ya pasó dos veces en `oss-skin.css`. Validar el balance de `/* */` tras cada edición.
4. **No pintar `[data-oss-panel]` sin excluir `[data-oss-bar]`.** Las barras de estado de las escenas se llenan de textura (pasó: líneas y puntos en el panel de estado).
5. **No diseñar texturas con `repeating-linear-gradient` a 45° + puntos.** Parece tela. Un PCB son pistas **ortogonales** con algún giro, pads en los extremos y serigrafía.
6. **La geometría la dicta el manifiesto, no la decoración.** El CSS decorativo de un pack (`streamthemes/*/shapes.css`) no puede declarar `border-radius`/`clip-path`: si contradice al `pack.json`, gana él y la forma desaparece. Ya pasó con `maker_circuit_pcb`.
7. **`app/themes_state.json`, `app/config.js` y `app/widgets/*/config.json` son estado del usuario.** No commitear ni asumir valores de fábrica.
8. **`app/widgets/promo` es un symlink de `app/widgets/shoutout`.** El id canónico de estado es `promo`; derivarlo de la URL rompe el tema de uno de los dos.
9. **Medir, no adivinar.** `getComputedStyle` y `CSS.getMatchedStylesForNode` (CDP) dicen qué regla gana; las hipótesis sobre CSS fallan mucho.

### 9.9 Nota sobre el alcance

El plan actual tiene 9 fases y toca ~40 ficheros. Eso está bien, pero conviene recordar el objetivo del usuario, porque es fácil perderlo:

> Poder coger un overlay de un pack y aplicarle los estilos de otro. Que un pack nuevo no obligue a tocar los demás. Nada más.

Todo lo que no sirva a esas dos frases (descubrimiento dinámico de escenas, renombrado de paleta, rediseño de la tipografía) es **opcional** y debe ir después, en commits separados, para que el usuario pueda ver funcionando lo esencial antes de que se toque lo accesorio.


