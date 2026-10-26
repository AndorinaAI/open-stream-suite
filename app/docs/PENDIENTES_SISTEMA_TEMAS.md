# Auditoría completa — Sistema de temas, packs, formas, widgets, alertas y fusiones

> Fecha: 2026-10-23 · Alcance: sistema de temas y todo lo que consume su estado (packs/estilos,
> formas físicas, escenas, widgets, alertas de panel, fusiones, API, panel y persistencia).
> Método: inventario desde disco + llamadas reales a la API + medición en navegador (CDP,
> `getComputedStyle`, WebSocket) + lectura de código. No se ha modificado código ni datos:
> `themes_state.json`, `fusions.json`, `config.js` y `overlay_texts_config.json` conservan su
> `sha256` inicial tras todas las pruebas.

## 0. Resumen ejecutivo

**Estado base verificado**

| Elemento | Valor real |
|---|---|
| Packs | 4 |
| Escenas | 27 |
| Estilos | 21 (Cozy 5, Gamer 5, Maker 6, OpenStream 5) |
| Formas físicas de pack | 20 |
| Formas de widget | 9 genéricas |
| Formas de alerta | 29 (9 genéricas + 20 de pack) |
| Suites | 7/7 OK (19 tests de contrato incluidos) |
| JS | 163 archivos, 0 errores de sintaxis |
| `style.default.css` | 21/21 idénticos al `style.css` actual (0 divergencias) |

**Lo que está bien y se ha medido**

- Las 27 escenas ofrecen **21 estilos y 22 valores de forma** (20 + auto/original), en 4 optgroups.
- El modal de fusión ofrece **21 estilos, 22 formas, 27 escenas, 5 widgets y 2 alertas** con nombres legibles.
- Panel: **5 filas de widgets + 2 de alertas**, con tema/forma/reset/añadir a fusión; sin errores de consola.
- Las 20 formas de pack tienen regla de panel (`[data-oss-panel]`); las 3 cozy que solo tenían cámara ya la tienen.
- El chat embebido de escena muestra mensajes reales y sincroniza el tema; el interruptor conserva marco, tamaño y cámara.
- El guardado de textos hace merge profundo y no borra secciones no enviadas.

**Riesgo global:** hay **10 fallos altos** de contrato (persistencia/precedencia de tema global, formas que se
pierden, temas por alerta que no se aplican) y **4 huecos de validación/seguridad** en la API. Los tests
actuales no cubren ninguno de ellos.

---

## 1. Hallazgos — severidad alta

| ID | Área | Hallazgo | Evidencia | Estado |
|---|---|---|---|---|
| H1 | Persistencia | El **tema global** no se aplica al arrancar escenas/widgets/alertas; solo actúa en vivo. | Global `synthwave` → recargar `chill` da `{"theme":"chill"}`; `ticker` y `alerts` dan `theme:null`. | ✅ Resuelto |
| H2 | Precedencia | Una escena con asignación explícita **sí** es pisada por `theme_change` en vivo, al contrario que widgets/alertas; al recargar vuelve a su asignación. | `chill` asignada a `chill` → global `synthwave` en vivo da `synthwave`; recarga → `chill`. | ✅ Resuelto |
| H3 | Formas | Un `theme_change` global **borra la forma** de un widget que no tiene tema explícito. | `ticker` con `pill` → global `cyberpunk` → `{"theme":"cyberpunk","shape":null}`. | ✅ Resuelto |
| H4 | Reset | Tras resetear un widget/alerta, el **tema global queda bloqueado** porque `config.js` sigue teniendo la asignación antigua. | Widget `terminal` → reset → global `maker` → sigue `theme:null`. Alerta igual. | ✅ Resuelto |
| H5 | Alertas | `card` y `banner` guardan temas distintos en estado/UI, pero comparten un único `body[data-theme]`: el banner nunca aplica su tema. | `card=synthwave`, `banner=toxic_rad`; boot y banner visible muestran `#00F9FF` (synthwave), no `#22C55E`. | ✅ Resuelto |
| H6 | Formas | `original` se acepta y persiste como forma de widgets/alertas, aunque no es una forma de componente. La UI lo muestra como “sin forma” y el estado queda sucio. | API 200; `overlayShapes['widget:chat']='original'`; el select del panel queda en `""` (“sin forma”). | ✅ Resuelto |
| H7 | API | Una **escena desconocida + forma** devuelve 200 y dice `ok`, pero no se persiste (el estado se sanea al guardar). Fallo silencioso. | `overlayKey:"no-existe", shapeId:"gamer_mecha"` → 200; hash de estado sin cambios; respuesta `shapeId:"gamer_mecha"`. | ✅ Resuelto |
| H8 | API | La **forma global** no se valida: acepta `bogus`, `pill` o `original`; queda en `activeShape` y las escenas no tienen CSS para ella. | `/api/themes/apply-shape {"shape":"bogus"}` → 200 `{"shape":"bogus"}`; `pill` → 200. | ✅ Resuelto |
| H9 | Temas | Un **tema creado desde la UI no se puede restaurar**: no se generan `theme.default.json` ni `style.default.css` y no está en `DEFAULT_THEMES_DATA`. | Crear pack/tema temporal → `/api/themes/restore` → 404 “No se encontraron valores originales”. | ✅ Resuelto |
| H10 | Seguridad | `create_theme_service`/`save_theme_service` no validan `packId`; `STREAMTHEMES_DIR / pack_id` permite traversal y escritura fuera del pack si el directorio existe. | `theme_service.py:103-115` y `:175-180`; `find_pack_dir` devuelve el join sin comprobar `resolve()`. No se ha explotado. | ✅ Resuelto |

### H1/H2 — Detalle del contrato de tema global

`load_theme_state()` rellena **todas** las escenas con `DEFAULT_OVERLAY_THEMES`
(`theme_manager.py:98-102`); por eso `overlayThemes[currentSceneKey]` siempre existe y
`syncThemeFromServer()` elige esa asignación antes que `data.activeTheme`
(`common/overlay.js:562-569`). `apply_theme_service()` solo guarda `activeTheme` y difunde
`theme_change`, sin tocar `overlayThemes` (`theme_service.py:216-244`).

Consecuencias:
- Escena: el tema global se ve en vivo, pero al recargar/OBS reiniciar vuelve al tema de fábrica.
- Widget/alerta: `OSSTheme.init` y `04-ws-client` solo leen `overlayThemes['widget:...']` /
  `alert:...`; si no hay asignación, no aplican `config.activeTheme`.
- Contradice `GUIA_CREAR_TEMAS_Y_ESCENAS_DESDE_CERO.md:281-289` (“activeTheme” como fallback) y
  la promesa de “aplicar globalmente a todas las fuentes” de `GUIA_DESARROLLO_Y_TEMAS.md`.

**Criterio de aceptación:** aplicar un tema global debe persistir una intención global (o actualizar
las asignaciones de todas las escenas/widgets/alertas) y sobrevivir a recarga; las asignaciones
explícitas deben ganar de forma consistente en escena, widget y alerta, o documentarse lo contrario.

### H3/H4 — Formas y reset

`widgets/*/js/network.js:80-82` envía `d.shape || null` también para `theme_change`; `OSSTheme.apply`
interpreta `shape=null` como “quitar forma” (`widget-theme.js:42-53`). Un cambio de tema global no
debería tocar la forma.

Tras un reset, `OSSTheme.apply(null,null)` pone `liveAssignedTheme=null`, pero `assignedTheme()`
vuelve a leer `cfg().overlayThemes` estático (`widget-theme.js:16-19`), que aún contiene la
asignación antigua; el guard de `theme_change` (`:35`) bloquea el tema global. En alertas pasa lo
mismo con `OSS_CONFIG.overlayThemes` (`04-ws-client.js:60-65`).

**Criterio:** `theme_change` debe preservar la forma activa; tras reset, el estado “sin asignación”
debe ser explícito y no depender de `config.js` hasta la recarga.

### H5 — Temas independientes de alerta

La UI y el estado permiten `alert:card` y `alert:banner` con temas distintos, pero
`04-ws-client.js:25` hace `card || banner` al arrancar y `03-alert-queue.js:117-118` / `:293` solo
aplican la **forma** al mostrar cada tipo; el `body[data-theme]` es único. Medición:
`card=synthwave`, `banner=toxic_rad` → banner visible conserva `#00F9FF`.

**Criterio:** al mostrar `card`/`banner`, aplicar el tema de ese tipo (o declarar un único tema de
alertas y retirar la selección por tipo). Lo mismo aplica a la forma física compartida.

### H6 — `original` en componentes

`RESET_VALUES` incluye `"original"` (`components_catalog.py:47`) y
`is_valid_component_shape()` lo acepta para cualquier componente (`:96-99`);
`set_overlay_theme_service()` salta la validación de formas especiales (`:382-389`) y solo elimina
`auto/__clear__/null/none` al guardar (`:397-402`). Resultado: estado `original`, select vacío,
`OSSShape.apply(el,'original')` no aplica nada y el reset no es equivalente.

Es alcanzable desde la fusión: `defaultShape:"original"` (`fusions_service.py:165`) y el selector de
forma de la fusión ofrecen “Forma Original”; `apply-shape` la propaga a widgets/alertas.

**Criterio:** para `widget:`/`alert:`, `original` debe rechazarse o convertirse en borrado; el estado
nunca debe contener un valor que la UI no pueda representar.

---

## 2. Hallazgos — severidad media

| ID | Área | Hallazgo | Evidencia |
|---|---|---|---|
| M1 | Fusiones | Crear/editar fusión **no valida** `defaultTheme` ni `defaultShape`; acepta `no-theme`/`no-shape` y los persiste. El select del detalle queda sin opción seleccionada. | `POST /api/fusions` con defaults inválidos → 200; GET devuelve los valores inválidos.  — ✅ Resuelto Fase 1: 400 con `Tema/Forma predeterminada desconocida`; defaults válidos y genéricos aceptados. |
| M2 | Fusiones | Miembros inválidos se **descartan en silencio** (200 + `unknownScenes/Widgets/Alerts`), pero el panel no muestra ese aviso. | Crear con `no-existe`, `no-widget`, `no-alert` → 200; respuesta contiene los `unknown*`; UI los ignora.  — ✅ Resuelto Fase 1: la respuesta añade `warnings`, la UI los muestra y todos-inválidos → 400. |
| M3 | Fusiones | `apply-shape` mezcla dos validaciones: un `pill` genérico con escenas produce `partial` y actualiza `defaultShape`; una fusión solo de alertas con `pill` se rechaza aunque las alertas lo soportan. | `apply-shape` `pill` con escena+alerta → `status:partial`; alerta sola + `pill` → 400.  — ✅ Resuelto Fase 1: matriz `supports_shape` por miembro; alertas-only `pill` 200, mixto `partial` con `skipped*`, inválida 400. |
| M4 | Catálogo | `ALERT_SHAPES` se calcula al **importar** `components_catalog` (`:43-44`). Un pack/tema creado en caliente no aparece en el catálogo de alertas ni pasa su validación hasta reiniciar; `is_valid_shape_id()` sí lo ve. | Lectura de código; el catálogo devuelve 29 formas fijas.  — ✅ Resuelto Fase 1: `get_alert_shapes()`/`get_pack_shape_ids()` con caché por mtime; pack nuevo visible sin reinicio. |
| M5 | Documentación | `PENDIENTES_TEMAS_WIDGETS_ALERTAS.md` estaba obsoleto (9 formas en alertas, selector “solo donde aplica”, precedencia global). | ✅ Mitigado: documento actualizado y enlazado a este informe. |
| M6 | Documentación | `CONVENCIONES`/`GUIA` describían una precedencia que el código no aplicaba en escenas. | ✅ Mitigado: guías actualizadas con `overlayThemeExplicit`/`globalThemeActive`; H1/H2 resueltos. |
| M7 | UI | Toast de “aplicar a todas” dice **“9 escenas”** cuando hay 27. | `06-scene-helpers.js:167`.  — ✅ Resuelto Fase 2: `sceneCount` dinámico; probe 27. |
| M8 | UI | Los contadores del lote de forma solo miran `appliedScenes/failedScenes`; si la fusión solo tiene widgets/alertas, el toast dice “0 escena(s)” y no refleja el resultado real. | `13-fusions.js:471-501`.  — ✅ Resuelto Fase 2: `formatBatchSummary` incluye escenas/widgets/alertas/omitidos/fallos. |
| M9 | UI | El estado local se actualiza **antes** de que la API confirme; si falla, la tarjeta/selector queda mostrando un tema/forma que no se guardó. | `10-overlay-actions.js:210`, `11-scene-editor.js:248-255`.  — ✅ Resuelto Fase 2: caché/preview sólo tras API; rollback probado con fallo simulado. |
| M10 | i18n | Faltan claves usadas por la UI: `common.refresh`, `fusions.label_default_shape`, `themes.shape_label`. Se muestran los fallbacks. | `panel.html` + módulos `languages/*.json`.  — ✅ Resuelto Fase 2: 0 claves reales ausentes (sólo placeholder dinámico). |
| M11 | CSS | El tema `maker` es el único de 21 sin tokens estructurales (`--frame-*`, `--panel-*`, `--badge-*`, `--header-*`); los otros 20 tienen 14. | `common/themes.css` bloque maker (9 vars) vs cyberpunk (23).  — ✅ Resuelto Fase 4: 14 tokens añadidos; computados 14/14 en runtime. |
| M12 | Estado | `migrate_theme_state()` normaliza claves de escena pero **no valida** que el tema/forma guardados existan; un estilo o pack eliminado deja asignaciones huérfanas que se publican en `config.js`. | `theme_manager.py:44-84`; no hay poda por catálogo.  — ✅ Resuelto Fase 3: `normalize_theme_assignments()` poda/restaura y persiste; prueba real con estado inválido. |
| M13 | Persistencia | Escrituras directas sin lock/atomic write en `themes_state.json`, `fusions.json`, `config.js` y `themes.css`; dos POST concurrentes pueden perder una asignación o dejar un JSON truncado. | `save_theme_state`, `save_fusions`, `sync_common_themes_css`.  — ✅ Resuelto Fase 3: `fs_utils.atomic_write_*` + locks por ruta; test de fallo de `os.replace`. |

---

## 3. Hallazgos — severidad baja / deuda

| ID | Hallazgo | Evidencia |
|---|---|---|
| L1 | `DEFAULT_OVERLAY_THEMES` está triplicado (Python, `01-state.js`, `overlay.js`) y la copia de `overlay.js` tiene 29 claves (incluye `maker`/`print` legacy) frente a 27 reales. | `theme_defaults.py`, `01-state.js:27`, `overlay.js:443`.  — ✅ Resuelto Fase 3: fuente única Python + `config.defaultOverlayThemes`; panel carga `config.js`. |
| L2 | `activeShape` puede quedar `null` en estado aunque el valor de fábrica sea `original`; la API lo devuelve como `null`. | `themes_state.json` actual.  — ✅ Resuelto Fase 3: normalizado y persistido a `original`; API/config lo devuelven así. |
| L3 | `fusions.json` puede guardar `widgets/alerts` ausentes; la API los normaliza en memoria pero no reescribe el archivo, así que herramientas externas ven otro esquema. | `fusion_starter_mix` actual.  — ✅ Resuelto Fase 3: `load_fusions()` normaliza y persiste `widgets/alerts/defaultTheme/defaultShape`. |
| L4 | El catálogo de escenas no usa `[data-oss-panel]` en `gamer_gameplay` (solo cámara/barra); las formas de panel no tienen destino ahí por atributo, aunque `.panel-card` podría cubrirlo en otras escenas. | Inventario de atributos.  — ✅ Resuelto Fase 4: `.camera-frame` marcado `data-oss-panel`; `cozy_polaroid` cambia radio/borde. |
| L5 | Selectores de forma con cuatro vocabularios/etiquetas: escenas 20+auto/original; widgets 9; alertas 29; fusiones 20+auto/original. Los genéricos se muestran con id crudo (`pill`) y los de pack con nombre. | Panel/medición.  — ✅ Resuelto Fase 4: etiquetas genéricas legibles ES/EN; `shapeLabel()` en componentes. |
| L6 | `ComponentThemes.apply()` con tema y forma vacíos no llama a la API pero muestra “✓ Tema aplicado”. | `component-themes.js:91-103`.  — ✅ Resuelto Fase 2: toast informativo y sin llamada API. |
| L7 | El bloque de alertas se reconstruye con `AlertsStudio.renderStudio()`; cualquier control añadido solo a `panel.html` se pierde (ya documentado, pero conviene un test). | `02a-layout-dom.js:9`.  — ✅ Resuelto Fase 5: test estático + E2E 2 filas/30 formas. |
| L8 | Cobertura de tests: H1–H10 ya tienen regresión estática/servicio (`test_theme_contract_h1_h10.py`); los E2E de navegador siguen fuera de CI. | `app/tests/`.  — ✅ Resuelto Fase 5: `tests/e2e_theme_backlog.py` + `scripts/run_theme_e2e.sh`, 1 comando. |

---

## 4. Límites que sí son intencionales (no tratar como bugs)

- Una sola forma física de pack activa por página: el CSS es `body[data-theme-shape]`; `card` y
  `banner` comparten ese atributo y cada uno activa la suya al mostrarse. Los temas sí deberían ser
  independientes (H5), pero la forma física compartida es una limitación del contrato actual.
- Los colores de rol (error/éxito/Twitch) y las sombras decorativas no se tokenizan.
- Las formas físicas de pack son skins completas: su fondo/borde mandan sobre el fondo del tema
  cuando están activas.
- Las fusiones guardan `defaultTheme/defaultShape` como valores de referencia del editor; no se
  aplican automáticamente al guardar (solo con los botones de lote). Si se desea otra cosa, es un
  cambio de producto, no un bug de integración.
- El chat de escena es un iframe del widget real; el interruptor oculta solo el iframe, no el marco.

---

## 5. Criterios de aceptación para cerrar la auditoría

1. Un tema global aplicado se ve tras recargar en escena, widget y alerta (o el contrato se redefine
   explícitamente y la UI deja de prometerlo).
2. Una asignación explícita gana al tema global de forma uniforme en escena/widget/alerta; tras reset,
   el global vuelve a aplicar.
3. `theme_change` no altera `data-theme-shape` ni la forma inline.
4. `card` y `banner` aplican su tema propio al mostrarse, o la UI ofrece un único tema de alertas.
5. `original` no puede persistirse en `widget:`/`alert:`; el estado y el select siempre coinciden.
6. `POST /api/themes/overlay-assignment` rechaza cualquier clave de escena desconocida, incluso con
   `shapeId`.
7. `/api/themes/apply-shape` valida contra las 20 formas físicas (o contra el catálogo que corresponda).
8. Crear un tema genera sus ficheros `*.default.*` o `restore` funciona mediante una copia de fábrica;
   `packId` se valida con `is_valid_pack_id` en create/save.
9. Fusiones: defaults y miembros se validan o se reportan al usuario; `apply-shape` acepta/rechaza
   formas de forma coherente para escenas/widgets/alertas.
10. Catálogo de alertas dinámico (o reinicio explícito documentado) para packs/formas nuevos.
11. Docs y CHANGELOG sin conteos obsoletos; claves i18n completas.
12. Tests de regresión para H1–H10 y los bordes de API; `themes_state.json`, `fusions.json`,
    `config.js` y `overlay_texts_config.json` con `sha256` idéntico antes/después de la suite.

---

## 6. Reproducciones rápidas

```bash
# Estado base
cd app
sha256sum themes_state.json fusions.json config.js overlay_texts_config.json

# H1/H2: global en vivo vs recarga
curl -s -X POST localhost:8080/api/themes/apply \
  -H "Content-Type: application/json" -H "X-Local-Token: $TOKEN" \
  -d '{"pack":"Maker_Theme_Pack","theme":"synthwave"}'
# abrir /streamthemes/Maker_Theme_Pack/overlays/chill/index.html
# body[data-theme] = synthwave en vivo; tras recargar = chill

# H3: forma + global
curl -s -X POST localhost:8080/api/themes/overlay-assignment ... \
  -d '{"overlayKey":"widget:ticker","shapeId":"pill"}'
# abrir ticker; luego aplicar tema global; data-theme-shape pasa a null

# H6: original
curl -s -X POST localhost:8080/api/themes/overlay-assignment ... \
  -d '{"overlayKey":"alert:card","shapeId":"original"}'
# 200; overlayShapes['alert:card'] = original; el select del panel queda vacío

# H7: escena desconocida + forma
curl -s -X POST localhost:8080/api/themes/overlay-assignment ... \
  -d '{"overlayKey":"no-existe","shapeId":"gamer_mecha"}'
# 200 ok; el archivo no cambia (el estado se sanea al guardar)

# H8: forma global inválida
curl -s -X POST localhost:8080/api/themes/apply-shape ... -d '{"shape":"bogus"}'
# 200 {"shape":"bogus"}

# H9: tema custom no restaurable
# crear pack/tema desde la UI y pulsar Restaurar -> 404 "No se encontraron valores originales"
```

---

## 7. Archivos clave revisados

- Backend: `server/services/{theme_manager,theme_service,fusions_service,components_catalog,overlay_service,validation_utils}.py`,
  `server/routes/{themes_routes,fusions_routes,widgets_routes,static_routes}.py`.
- Frontend: `common/{widget-theme,oss-shape,overlay}.js`, `common/overlay/{dom-injector,scene-chat-embed}.js`,
  `alerts/js/{component-themes,api}.js`, `alerts/js/overlay/{02b-alert-shapes,03-alert-queue,04-ws-client}.js`,
  `alerts/js/themes/{01-state,02-packs,06-scene-helpers,10-overlay-actions,11-scene-editor,13-fusions}.js`,
  `alerts/js/alerts-studio/02a-layout-dom.js`.
- CSS: `common/styles.css`, `common/themes.css`, `alerts/css/{alerts-themes,alerts-widget}.css`,
  `widgets/*/style.css`.
- Datos/config: `themes_state.json`, `fusions.json`, `config.js`, `overlay_texts_config.json`,
  `streamthemes/*/{pack.json,styles/*,overlays/*}`.
- Pruebas: `app/tests/test_*.py` (7 suites, 19 tests de contrato).

---

**Conclusión:** el sistema de temas está bien encaminado en cobertura de UI y CSS. Los fallos de
persistencia/precedencia del tema global y de formas por componente (H1–H10) se corrigieron el
2026-10-23 y tienen regresiones en `test_theme_contract_h1_h10.py`; los E2E H1–H5 se ejecutaron en
navegador. Quedan los hallazgos medios/bajos de este informe como deuda siguiente.


---

## 8. Corrección aplicada (2026-10-23)

Los diez hallazgos altos H1–H10 se han corregido de forma nativa, sin scripts externos:

| ID | Corrección |
|---|---|
| H1 | `activeTheme` se persiste con `globalThemeActive`; escenas, widgets y alertas lo usan al arrancar cuando no hay asignación explícita. `config.js` publica el flag. |
| H2 | `overlayThemeExplicit` distingue asignaciones explícitas; `overlay.js` ignora `theme_change` para escenas explícitas (igual que widgets/alertas) y lo recupera tras reset. |
| H3 | El cambio global ya no pasa `shape:null`: `handleMessage` usa `undefined` para “no tocar” y `null` sólo para limpiar; la forma inline y `data-theme-shape` se conservan. |
| H4 | Widgets y alertas recuerdan la asignación **en vivo** (`liveExplicitTheme` / `AlertShapes.explicit`); tras reset el tema global vuelve a aplicar sin depender de `config.js` estático. |
| H5 | `AlertShapes` guarda tema y flag por tipo; `playCardAlert`/`playBannerAlert` aplican `applyAll(type)` antes de mostrar. `card` y `banner` pueden tener temas distintos. |
| H6 | Para `widget:`/`alert:`, `original` se normaliza a “sin forma” y nunca se persiste; `migrate_theme_state` limpia estados antiguos. En escenas `original` sigue siendo válido. |
| H7 | `set_overlay_theme_service` rechaza cualquier clave de escena desconocida, incluso con `shapeId` (400). |
| H8 | `apply_shape_service` valida contra `is_valid_shape_id`; `bogus`/`pill` → 400, formas de pack válidas → 200. |
| H9 | `create_theme_service` escribe `theme.default.json` y `style.default.css`; “Restaurar” funciona en temas nuevos. |
| H10 | `create/save` validan `is_valid_pack_id`/`is_valid_theme_id`; `get_theme_dir` resuelve y comprueba que el tema queda dentro del pack. |

**Verificación ejecutada**

- H1–H5 en navegador (CDP + WebSocket): 11/11 PASS.
  - global `synthwave` persiste en escena/widget/alerta;
  - escena explícita `terminal` no cambia con global `cyberpunk`;
  - `pill` sobrevive a global `maker`;
  - reset + global aplica `cyberpunk`;
  - `card=synthwave` / `banner=toxic_rad` muestran cada uno su tema.
- H6–H10 por API: 16/16 PASS (original, escena desconocida, forma global, defaults de tema nuevo, traversal).
- Apariencia por defecto: `chill` → `chill`, `ticker`/alertas sin tema, sin `globalThemeActive`.
- Suites: 8/8 (incluye `test_theme_contract_h1_h10.py`, 11 tests nuevos); E2E de chat, formas de alerta y panel: TODO PASS.
- Estado del usuario restaurado: `themes_state.json`, `fusions.json` y `overlay_texts_config.json` con sus hashes originales.


---

## 9. Fase 1 aplicada (2026-10-23)

Cerrados **M1–M4** de forma nativa:

- `components_catalog.get_alert_shapes()` / `supports_shape()` con caché invalidable por mtime.
- Defaults de fusión validados (tema y forma, incluidas genéricas).
- Miembros desconocidos reportados en `warnings`; todos inválidos → 400; UI muestra el aviso.
- `apply_fusion_shape_batch` aplica por capacidad y devuelve `applied*/skipped*/failed*`; alertas-only
  con forma genérica ya no se rechaza; el comentario obsoleto se eliminó.

**Evidencia:** `test_theme_backlog_contract.py` (11 tests) OK; 9 suites OK; API real 16/16 PASS
(defaults, unknown, lote mixto, alerts-only, inválida); `ui_fusions.py` TODO PASS; estado/fusiones
restaurados (`themes_state` `a259a19e…`, `fusions` `88ac29ff…`, `config` `738426d0…`).


---

## 10. Fase 2 aplicada (2026-10-23)

Cerrados **M7–M10 y L6**:

- **M7:** toast con `OSS_SCENES.length`; probe real: “aplicado a las 27 escenas”.
- **M8:** `formatBatchSummary()` reutilizable; tema y forma informan escenas/widgets/alertas/omitidos/fallos.
- **M9:** `onOverlayThemeChange` y `onSceneModalShapeChange` sólo actualizan caché tras confirmar la API;
  si falla, restauran el valor anterior y repintan.
- **M10:** añadidas `common.refresh`, `fusions.label_default_shape`, `themes.shape_label` + claves nuevas
  de resumen/sin-selección en ES/EN. El extractor de `data-i18n` no encuentra claves reales ausentes.
- **L6:** aplicar sin tema ni forma muestra “Selecciona un tema o una forma” y no llama a la API.

**Evidencia:** probe UI Fase 2 6/6 PASS; `test_theme_backlog_contract.py` 13 tests OK; 9 suites OK;
`ui_fusions.py` TODO PASS; estado restaurado (`a259a19e…`, `88ac29ff…`, `738426d0…`).


---

## 11. Fase 3 aplicada (2026-10-23)

Cerrados **M12, M13 y L1–L3**:

- **M13:** `fs_utils.atomic_write_text/json` con `os.replace` y locks reentrantes por ruta;
  `save_theme_state`, `save_fusions`, `write_config_js`, `sync_common_themes_css` y textos usan
  escritura atómica. `create/update/delete` de fusiones y la normalización de estado usan lock.
- **M12:** `normalize_theme_assignments()` valida temas/formas contra el catálogo, restaura defaults
  de escena y elimina componentes huérfanos; el estado normalizado se persiste.
- **L1:** `theme_defaults.DEFAULT_OVERLAY_THEMES` es la única fuente (27 claves); `config.js` publica
  `defaultOverlayThemes`; `overlay.js`/`01-state.js` lo consumen; `panel.html` carga `config.js`.
- **L2:** `activeShape` nulo/ inválido se normaliza a `original` y se persiste; API/config lo devuelven.
- **L3:** `load_fusions()` completa `widgets`, `alerts`, `defaultTheme` y `defaultShape`, y reescribe
  el archivo una sola vez.

**Evidencia:** test Fase 3 (normalización, atomicidad, esquema y defaults) OK; 9 suites OK; prueba real
M12 con estado inválido corregida y persistida; H1–H5 11/11 PASS tras L1/L2. Estado estructural:
`themes_state` añade `activeShape: "original"`/`overlayThemeExplicit`; `fusions.json` añade arrays vacíos;
valores de usuario intactos (27 escenas, 2 formas).


---

## 12. Fase 4 aplicada (2026-10-23)

Cerrados **M11, L4 y L5**:

- **M11:** `maker` recibe los 14 tokens estructurales (`--frame-*`, `--panel-*`, `--badge-*`, `--header-*`)
  en `style.css` y `style.default.css`; `common/themes.css` regenerado. Probe: 14/14 valores computados.
- **L4:** `.camera-frame` de `gameplay_hud` lleva `data-oss-panel="true"`; `cozy_polaroid` modifica
  radio/borde de la cámara sin tocar el viewport.
- **L5:** las 9 formas genéricas tienen etiqueta legible ES/EN (`Píldora`, `Caja`, `Sci-Fi bisel`…)
  mediante `shapeLabel()`; las de pack siguen usando icon+name.

**Evidencia:** probe UI Fase 4 6/6 PASS; `test_theme_backlog_contract.py` 21 tests OK; 9 suites OK;
estado restaurado (`bee077d0…`, `7886325…`, `d05eff7b…`). **Pendientes:** ninguno; cierre en §13.


---

## 13. Backlog cerrado (Fase 5)

**L7 — bloque de alertas:** `tests/test_alerts_studio.py::test_alert_themes_block_is_in_render_template`
falla si `02a-layout-dom.js` pierde `alert-themes-panel`, `ComponentThemes.load()` o el rótulo.
El E2E abre el panel, ejecuta `AlertsStudio.renderStudio()` y exige **2 filas × 30 opciones** (29 formas + «sin forma»).

**L8 — E2E automatizado:** `tests/e2e_theme_backlog.py` + `scripts/run_theme_e2e.sh`.

```bash
cd /home/andorina/Imágenes/twitchoverlay
./scripts/run_theme_e2e.sh
```

Cubre API y navegador: H1–H5, M1–M3, M7–M9, M11, L4, L5 y L7. Hace snapshot/restauración de
`themes_state.json`, `fusions.json`, `config.js` y `overlay_texts_config.json`, y falla si un hash final
no coincide. Resultado de la ejecución: **TODO PASS**, estado restaurado. Verificación final además:
**10/10 suites OK**, **163 archivos JS sin errores de sintaxis**, `py_compile` OK.

**Cierre:** H1–H10, M1–M4, M7–M13 y L1–L8 resueltos; M5/M6 eran documentación ya mitigada. Conteos vigentes:
4 packs, 21 estilos, 27 escenas, 20 formas físicas, 9 genéricas, 29 formas de alerta, 30 opciones
en el panel de alertas. Estado de usuario intacto: 27 temas de escena y 2 formas.
