# T4 — Integración escenas ⇄ temas: diagnóstico y correcciones

**Fecha:** 2026-10-23 · **Repo:** `/home/andorina/Imágenes/twitchoverlay` (Open Stream Suite)
**Ámbito:** claves de escena, sincronización de estado escena↔tema, aplicación de temas, fusiones,
rótulos y recolocación de elementos al cambiar de escena.
**Método:** reproducción real (servidor :8080 + Chrome headless/CDP), corrección de causa raíz y
verificación A/B con mediciones, más suite de tests.

---

## 1. Defectos confirmados con evidencia (antes)

| # | Defecto | Evidencia medida |
|---|---|---|
| D1 | **Aplicación de temas rota**: `POST /api/themes/apply` → **400 "Pack ID inválido"**. La validación añadida antes usaba `STREAMTHEMES_DIR = Path("app/streamthemes")` (relativo al cwd); al arrancar el servidor desde `app/` nunca existía. | `curl -X POST /api/themes/apply` → 400. `is_valid_pack_id("Maker_Theme_Pack") = False` |
| D2 | **Vista previa de escenas: 404 en 21 de 27 escenas**. `SCENE_COMPAT_MAP` escrito a mano con 9 claves kebab; `/scenes/oss_starting/index.html`, `/scenes/gamer_victory/…`, `/scenes/startingSoon/…` → 404. | 21/36 URLs probadas → 404 (`probe_before.json`) |
| D3 | **Lista de escenas válidas inventada**: `is_valid_scene_key` aceptaba `maker_desk`, `starting-soon`, `screens`… y rechazaba las reales (`maker-desk`, `startingSoon`, `oss_chatting`). | `is_valid_scene_key('maker-desk') = False` |
| D4 | **Estado contaminado**: `themes_state.json` con claves que no son escenas → `overlayThemes: {maker, print, starting:"ambient"}`, `overlayShapes: {starting:"fantasy_parchment"}`. El endpoint aceptaba cualquier clave basura (`no-existe-esta-escena` → 200). | 30 claves, 4 huérfanas; POST basura → 200 |
| D5 | **Vista de Fusión sin renderizar**: `ReferenceError: packId is not defined` en `13-fusions.js` (variable inexistente dentro del template) → el grid de escenas de la fusión quedaba vacío (0 botones). | `fusion_detalle → {"err": "ReferenceError: packId is not defined"}`, `html_len: 54` |
| D6 | **Botones de la fusión rotos**: "👁️ Probar" abría `undefined?theme=…`; "📋 Copiar OBS" copiaba `origin + "undefined"` (faltaba el 2.º argumento). | `urls_abiertas: []` y `portapapeles: []` |
| D7 | **Estado global invisible**: `cachedThemePacks` / `cachedOverlayThemes` / `cachedFusions` se declaran con `let` → **no** son propiedades de `window`, pero `13-fusions.js` las leía como `window.cachedThemePacks`: siempre `undefined` → el selector de formas caía a una lista hardcoded. | `typeof window.cachedThemePacks === "undefined"` |
| D8 | **27 `obsSource` fijas a `http://localhost:8080`** en `05-scenes-data.js`, mientras el resto del panel usa `location.origin` → URLs de OBS erróneas en cualquier otro host/puerto/túnel. | `obs_localhost: 27` |
| D9 | **Elementos que se recolocan al cambiar de escena**: `syncThemeFromServer()` re-aplicaba el tema **después del primer pintado** y ejecutaba de nuevo todo el pipeline (`adaptAtmosphereForArchetype` + `tagSemanticElements()` + `recalculateApertures()`), que reescribe rótulos y recalcula recortes → reflow visible en cada carga de escena. | 2 ejecuciones del pipeline por carga (8 mutaciones de atributos, 27 reescrituras de rótulos en `maker_desk`) |
| D10 | **Textos cortados en rótulos de ventana**: `adaptAtmosphereForArchetype` sustituía rótulos cortos por otros largos sin comprobar el ancho (`'CAM 01 // OVERVIEW'` → `'CÁMARA CENITAL · BANCO DE TRABAJO'`), en contenedores de ancho fijo con `overflow` recortando el texto. | Código + 27 reescrituras sin validación de encaje |
| D11 | **Fusiones con claves no canónicas**: `create_or_update_fusion` guardaba cualquier cadena (`maker/desk`, `osss_chatting`…) y el batch aplicaba tema con clave sin normalizar. | `fusions.json` con claves arbitrarias; escenas "desaparecidas" en la vista |

---

## 2. Correcciones aplicadas (causa raíz, sin parches superpuestos)

### Fuente única de verdad de escenas
- **`app/scenes.json`** (nuevo) + **`scripts/build_scenes_json.py`**: catálogo generado desde
  `05-scenes-data.js` + `01-state.js` con las **27 claves canónicas**, **81 alias**
  (camelCase, kebab-case, snake_case, ruta `maker/desk`, carpeta `just_chatting`, `brb`, …) y los
  temas de fábrica. `--check` falla si se desincroniza.
- **`app/server/services/scenes_catalog.py`** (nuevo): `normalize_scene_key()`, `is_known_scene()`,
  `legacy_scene_target()`, `default_themes()`.

### Claves de escena (camelCase vs kebab vs snake)
- `05-scenes-data.js`: registro con **`window.normalizeSceneKey()` / `getSceneByKey()` /
  `OSS_SCENE_ALIASES`**; los `obsSource` se calculan desde `location.origin`.
- `01-state.js`: quita de `DEFAULT_OVERLAY_THEMES` las claves que **no son escenas** (`maker`,
  `print`), publica el estado en `window` y añade `sanitizeOverlayState()`,
  `getAssignedThemeForScene()`, `getAssignedShapeForScene()`.
- Decisión de diseño: **no se renombran** las claves canónicas (renombrarlas migraría estado en vivo
  del usuario en OBS); se instala una capa de normalización que acepta *cualquier* forma y persiste
  **siempre la canónica**, y un test que detecta futuras desviaciones.

### Sincronización de estado escenas⇄temas
- `theme_manager.py`: `migrate_theme_state()` normaliza alias y **descarta claves huérfanas** al
  cargar **y al guardar** (persiste la limpieza); `theme_defaults.DEFAULT_OVERLAY_THEMES` pasa a
  derivarse del catálogo.
- `validation_utils.py` reescrito: rutas **absolutas** (`BASE_DIR`), validación real de pack/tema
  contra `streamthemes/`, formas contra los `pack.json` y escenas contra el catálogo.
- `theme_service.set_overlay_theme_service()`: normaliza la clave y valida escena/tema/forma →
  400 en vez de escribir basura; `static_routes` sirve `/scenes/<clave|alias>[/index.html]` con
  ruta anidada (`/scenes/{scene:.*}`) resuelta por catálogo (27/27 + alias).
- `fusions_service.py`: normaliza y deduplica claves al guardar (informa de las desconocidas vía
  `unknownScenes`) y los batch aplican la clave canónica.

### Frontend (panel)
- `13-fusions.js`: eliminado el `ReferenceError` (usa `scene.path`), los dos botones pasan los
  argumentos correctos, las fusiones con claves no resueltas **avisan** en vez de ocultarse,
  el estado sincronizado se normaliza y las tarjetas de carpeta se refrescan tras un batch.
- `10-overlay-actions.js`: claves normalizadas en tarjeta/select/acciones, `restoreAllOverlays…`
  itera el catálogo de escenas (no el diccionario con claves basura), cabecera de tarjeta
  *wrap-safe* (`flex-wrap`, `min-width:0`, `overflow-wrap`) y el botón que anunciaba
  "✏️ Editar Textos" pero abría pantalla completa ahora abre el editor de textos.
- `02-packs.js`: al cargar packs, el estado mezclado se sanea (`sanitizeOverlayState`) y se publica.

### Runtime de escenas (overlay)
- `app/common/overlay.js`:
  * **Guarda de idempotencia** en `updateOverlayThemeAndShape()`: si tema+forma+arquetipo no cambian,
    no se re-ejecuta el pipeline pesado → desaparece la recolocación posterior al primer pintado.
  * **`setFittedText()`**: los rótulos adaptados por arquetipo solo se escriben si **caben**; si no,
    se conserva el texto original → no más títulos cortados en ventanas/badges.

---

## 3. Verificación (después)

**Suite de tests: 85/85 OK** (incluye 18 nuevos en `app/tests/test_scenes_themes_integration.py`:
catálogo vs panel, 27 escenas + 81 alias resolviendo 200, validación/migración de estado, API de
asignación, regresión de `/api/themes/apply`, normalización de fusiones).

| Medición | Antes | Después |
|---|---|---|
| `/scenes/<clave>/index.html` resueltas | 15/36 (21 → 404) | **36/36 → 302 → 200** |
| Claves huérfanas en `themes_state.json` | 4 (`maker`, `print`, `starting`, basura) | **0** (27 claves canónicas) |
| POST con escena inexistente | 200 (se guardaba) | **400** `Escena desconocida: …` |
| `POST /api/themes/apply` | **400 Pack ID inválido** | **200** |
| Vista de Fusión | `ReferenceError`, 0 botones | **4 tarjetas / 12 botones**, 0 errores JS |
| `Probar` / `Copiar OBS` en fusión | `undefined` | ruta real + URL correcta |
| `obsSource` con `localhost:8080` fijo | 27/27 | **0/27** (derivadas de `location.origin`) |
| `window.cachedThemePacks` | `undefined` | `object` (4 packs) → formas reales de pack (22 opciones, 4 grupos) |
| Normalización de claves | — | `maker_desk`/`maker/desk`→`maker-desk`; `screens/starting-soon`→`startingSoon`; `just_chatting`→`oss_chatting`; basura → `null` |
| Pipeline de tema por carga (tema = HTML) | 2 ejecuciones (8 mutaciones, 27 reescrituras de rótulos) | **1 ejecución** (5 mutaciones, 0 reescrituras) |
| Pipeline con tema personalizado distinto | 2 ejecuciones | 2 (correcto: hay cambio real) |
| Rótulos de ventana recortados | (reescritura sin control de encaje) | **0** medidos en 3 escenas |

Artefactos de evidencia: `probe_before.json`, `probe_after.txt`, `probe_overlay_out.txt`,
`probe_guard.json`, `panel_check_out.json`, `verify_antes.txt`, `reporte_antes.json`.

---

## 4. Notas operativas y pendientes (no bloqueantes)

- **Servidor**: durante la verificación se levantó el servidor real en `:8080` (estaba caído al
  empezar) ejecutando el código corregido; al cerrar la sesión quedó en marcha con los cambios.
  Otro agente (T5) creó fusiones de prueba en `fusions.json` (`fusion_t5_fusión_prueba_fun_…`,
  `test_audit_fusion_shape`): conviene limpiarlas antes de publicar.
- **No reproducido** en el panel (medido y descartado): recortes de texto en las tarjetas de escena
  a 1920/1440/1280/1100 px (0 recortes); aun así se dejó la cabecera *wrap-safe*.
- **Pendiente fuera de este encargo** (documentado en la auditoría de temas): `?lang=` inerte,
  `?lock=1` sin `?theme=`, `favicon.ico` 404, `Cinzel` no empaquetada, FPS contradictorio en
  `gameplay_hud`.

---

## 5. Revisión 2 (T4, 09:35–09:55) — cierre de los puntos que dejó abiertos la revisión de T6

La revisión de T6 (`t_500c2b67/INFORME_T6.md`) validó la solución base (89/89 formas de clave,
`apply`/`restore`/`overlay-assignment` OK, 0 textos cortados) y dejó **5 puntos abiertos**. Estado
de cada uno:

| # | Punto abierto por T6 | Estado | Evidencia |
|---|---|---|---|
| 1 | `<polygon>` con `NaN` en 4 escenas (bisel de cámara no se dibuja) | **CORREGIDO** | `NaN: 9 → 0` en 27 escenas (Chrome/CDP) |
| 2 | Desplazamiento de elementos por `font-display: swap` sin `preload` | **CORREGIDO (parcial, medido)** | elementos que se mueven ≥5 px: **482 → 430**; atribuibles a fuentes: **79 → 26** |
| 3 | `apply_fusion_theme_batch` devolvía 200 con `appliedScenes: []` ante `themeId` inexistente | **CORREGIDO** | antes `200 {"appliedScenes":[]}` → ahora **400** `{"error":"Tema desconocido: …"}` |
| 4 | `app/scenes.json` untracked: el backend degrada si falta | **CORREGIDO** | `scenes_catalog.try_autobuild()` (genera el catálogo la primera vez que se necesita; reproduce byte a byte el fichero generado) |
| 5 | Claves canónicas no normalizadas a kebab-case | **NO CAMBIA (decisión de diseño)** | ver §4: renombrar migraría el estado en vivo del usuario; la capa de alias/validación lo hace inocuo |

### Correcciones añadidas en esta revisión

**a) Parser de `polygon()` (`app/common/overlay/backdrop-aperture.js`).**
`pair.split(/\s+/)` partía dentro de `calc(100% - 22px)` → `parseFloat('calc(100%')` = `NaN` y la rama
`px.includes('calc(')` era inalcanzable (el `%` la sombreaba). Se sustituye por un tokenizador de
primer nivel (`splitTopLevel`) + evaluador de longitudes (`resolveLength`/`evaluateCalc`) que soporta
`%`, `px`, `calc(<long> <op> <long>)`, separadores por coma o espacio, modificador `evenodd` y
devuelve `null` (nunca `NaN`) si no puede resolver con certeza — en ese caso la máscara cae al
rectángulo, así que el fallo es degradación, no geometría corrupta.

**b) Fuentes: preload de los `.woff2` reales de cada página.**
`common/fonts.css` usa `font-display: swap` y ninguna página declaraba `preload`, de modo que las
fuentes se descubrían **después** del primer pintado (`document.fonts` `loadingdone` a 45–166 ms).
`scripts/apply_font_preloads.py` inserta un bloque de `<link rel="preload" as="font" … crossorigin>`
en las **30 páginas** (27 escenas + panel + catálogo + índice) usando la lista **medida** en Chrome
(no adivinada): entre 3 y 9 fuentes por escena, 20 distintas en total. Es idempotente y tiene
`--check` para CI.

**c) Contrato de las operaciones en lote sobre fusiones (`fusions_service.py` + `fusions_routes.py` + panel).**
El servicio valida tema/forma **antes** de escribir, devuelve `ok`, `status`
(`ok`/`partial`/`error`), `appliedScenes`, `failedScenes` y `skippedScenes`, y sólo persiste
`defaultTheme`/`defaultShape` si realmente se aplicó a algo. La ruta distingue 404 (fusión
inexistente) de 400 (tema/forma inválidos). `api.js` propaga el mensaje real del servidor y
`13-fusions.js` muestra un toast de error/parcial en vez de un "aplicado a 0 escenas" silencioso.
Se mantiene el caso legítimo "fusión vacía" (200, 0 escenas) que fija `test_fusions.py`.

**d) Sincronización de estado: `config.js` lleva el estado de escenas/temas.**
`overlay.js` decide tema/forma **de forma síncrona** desde `config.overlayThemes` /
`config.overlayShapes` / `config.activeTheme`, pero `config.js` sólo llevaba textos, así que el
estado real llegaba por `/api/themes/packs` después del primer pintado. Ahora
`overlay_service.write_config_js()` incrusta `activePack/activeTheme/activeShape/overlayThemes/
overlayShapes/backdrops`; `theme_manager.save_theme_state()` regenera `config.js` en la misma
operación (sin ciclo de imports) y `create_app()` lo regenera al arrancar si falta.

**e) Tests de validación.**
`tests/test_validation_utils.py` (raíz) no podía ejecutarse (`ImportError: No module named 'server'`)
y afirmaba un contrato inventado (claves `maker`/`print`/`screens`/`gamer`, formas `rounded`/
`hexagon`/… que ningún `pack.json` declara) — nunca llegó a ejecutarse. Se sustituye por
`app/tests/test_validation_utils.py`: packs/temas/formas reales, las tres familias de alias,
`alias_map` sin huérfanos, `default_themes` == claves canónicas y `scenes.json --check` sincronizado.

### Verificación (revisión 2)

| Medición | Antes | Después |
|---|---|---|
| Suite completa `app/tests` | 85 OK | **94 OK, 0 fallos** |
| `<polygon>` con `NaN` (27 escenas, Chrome) | 9 | **0** |
| Excepciones JS / errores de consola (27 escenas) | 0 | **0** |
| Elementos que se mueven ≥5 px (DCL → asentado) | 482 | **430** |
| … de los cuales atribuibles a fuentes (con `.woff2` bloqueados: 403 → 404) | **79** | **26** |
| `apply-theme` con `themeId` inexistente | `200 {"appliedScenes":[]}` | **400 `Tema desconocido: …`** |
| `apply-shape` con forma inexistente | 200 | **400** |
| Fusión válida | 200 `status:ok` | **200 `ok:true, 4/4 escenas`** |
| Panel: tarjetas de fusión / botones con ruta real | 4 / 12 | **4 / 8** (mismo dato, `onclick` real) |
| Panel: recortes en cabeceras de tarjeta (9 tarjetas) | — | **0**, 0 errores JS |
| Catálogo ausente | degradado + warning | **se autogenera (27 escenas, 81 alias)** |

Sondas: `t4_probe.py` (27 escenas; mide movimiento normalizado al lienzo —descuenta el escalado
global del `.overlay-canvas`—, `layout-shift` acumulado, `polygon` NaN, errores JS, `.woff2`
descargados) y `t4_panel_probe.py` (panel: sección/pestañas reales, ficha de fusión, toasts, recortes).
Resultados crudos en `results_probe_*.json` y `results_panel_t4.json`.

### Pendiente abierto (cuantificado, fuera del alcance de estas correcciones)

**Recolocación de elementos dirigida por JavaScript**: de los 430 elementos que cambian de sitio
≥5 px tras el primer pintado, **404** siguen moviéndose con las fuentes bloqueadas (ruido de animación
ya descontado: 3). Causa: el DOM de la escena se completa *después* del primer pintado porque
`dom-injector.js`, `icons.js` e `interactive-features.js` se cargan por `ensureScript()` (script
inyectado + espera a `onload`) y algunos módulos escriben textos/medidas en timers. Arreglo
propuesto (no aplicado, cambia 30 HTML + `overlay.js`): declarar esos tres módulos como
`<script src>` estáticos (como `/config.js`) para que la inyección ocurra antes del primer pintado.
El CLS acumulado (0,06–0,09 en las escenas OSS) es de este mismo origen, no de las fuentes:
bloquear los `.woff2` no lo reduce.

---

## 6. Cierre T4-seguimiento (2026-10-24)

- **Aplicado:** las 27 escenas cargan `icons.js`, `dom-injector.js` e
  `interactive-features.js` como `<script src>` estáticos antes de
  `/common/overlay.js`; ya no se inyectan con `ensureScript()` después del
  primer pintado.
- **Verificación estructural:** 27/27 HTML contienen los tres módulos en orden
  previo a `overlay.js`; 3 escenas representativas (Maker, Gamer y Cozy)
  confirmaron `OSSDomInjector`, `OSSIcons` y `OSSInteractive` disponibles.
- **Barrido runtime:** 62 URLs; 0 excepciones JS y 0 fallos HTTP en escenas. Los
  únicos avisos son de autoplay de Chrome (política del navegador, W26/T17).
- **Límite:** no se repitió el conteo fino de “404 elementos movidos” con las
  fuentes bloqueadas; la causa de inyección tardía queda eliminada, pero una
  validación visual 27/27 en OBS sigue siendo la prueba definitiva.
- **Otros pendientes:** `?lang=` sigue reservado (solo API); `?lock=1` sin
  `?theme=` conserva el comportamiento actual y queda documentado; `favicon.ico`
  ya responde 200; `Cinzel` está empaquetada; FPS de `gameplay_hud` corregido a 60.
