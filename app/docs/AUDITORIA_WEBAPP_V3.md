# AUDITORÍA WEBAPP V3 — temas, estilos, formas, widgets y alertas

> **Fecha:** 2026-10-25 · **Proyecto:** Open Stream Suite (`twitchoverlay`)
> **Alcance:** proyecto completo, con foco en el sistema de temas/estilos/formas,
> catálogo de widgets y alertas, controles del panel e interacciones reales.
> **Tipo:** auditoría de solo lectura. No se aplicó ningún fix.
> **Servidor:** estaba caído al empezar (`/api/status` devolvió `000`); se levantó
> en `:8080` para las sondas y se dejó en marcha. No se reinició durante el
> trabajo posterior.

## Veredicto

**No faltan los desplegables principales ni los botones de tema/forma en los
componentes auditados.** El catálogo, los selects, las acciones de aplicar y
resetear y la persistencia funcionan en las rutas probadas:

- widgets: 5 filas, 5 temas, 5 formas y 5 fusiones;
- alertas: 2 filas (`card`/`banner`), 22 opciones de tema (21 + sin asignar) y
  30 de forma (29 + sin forma);
- escenas: 21 estilos y 22 formas (20 + auto/original);
- fusiones: 21 estilos y 22 formas en detalle y modal.

Pero la auditoría encontró **un XSS real y reproducible en metadatos de temas**,
varios defectos de consistencia de UI y dos comportamientos de API que deben
corregirse antes de dar el sistema de temas por cerrado.

## Resumen de severidad

| ID | Severidad | Hallazgo |
|---|---|---|
| V3-01 | **Alta** | XSS en el panel mediante `name`/`badge`/`desc` de temas y packs |
| V3-02 | **Media** | Los tres selects de cada componente no tienen etiqueta ni `aria-label` |
| V3-03 | **Media** | La UI/i18n sigue diciendo “9 escenas” cuando hay 27 |
| V3-04 | **Media** | `GET /api/themes/packs` reescribe `common/themes.css` en cada petición |
| V3-05 | **Media** | Varias rutas devuelven `str(e)` en 500 (rutas internas) |
| V3-06 | **Media (por verificar)** | `fusion.id` se interpola sin escapar en `onclick`/ids |
| V3-07 | **Baja** | Código muerto: `overlays-btn-back-folders` no existe, aunque el botón visible sí funciona |
| V3-08 | **Baja** | `rewards`/`tips/simulate` no protegen JSON malformado y devuelven 500 |

---

## 1. Evidencia de que los controles existen y funcionan

### Catálogo de datos

Comprobado desde `/api/themes/packs` y `/api/components/catalog`:

```text
4 packs: Cozy 5 temas/5 formas · Gamer 5/8 · Maker 6/3 · Open 5/4
21 temas únicos · 20 formas únicas de pack
widgets: chat, goal, shoutout, ticker, timer — 9 formas cada uno
alerts: card, banner — 29 formas cada uno
```

También se comprobó:

- los 27 `scenes.json` apuntan a un `index.html` existente;
- los 21 `style.css` y `style.default.css` existen y declaran los 14 tokens
  estructurales;
- no hay diferencias de tokens estructurales entre live y default;
- las 20 formas tienen alguna regla CSS;
- `fusions.json` referencia escenas/widgets/alertas existentes.

### Panel real (CDP, 1920×1080, sin errores JS)

| Superficie | Resultado medido |
|---|---|
| Widgets | 5 filas; 5 selects de tema, 5 de forma, 5 de fusión; 22/10/2 opciones; 15 botones Aplicar/Reset/➕ |
| Alertas | 2 filas; 2 selects de tema, 2 de forma, 2 de fusión; 22/30/2 opciones; 6 botones |
| Escena (`maker-desk`) | 21 opciones de tema, 22 de forma; cambio de tema y forma persiste |
| Fusiones | lista con 1 fusión; “Abrir” muestra 21 temas, 22 formas, 4 escenas miembros |
| Modal de fusión | 21 temas, 22 formas, 4 escenas, 5 widgets, 2 alertas |
| Carpetas | 4 packs, 9 escenas en Maker; selectores de tema 21/21; botón Volver visible |

### Aplicar/reset real (no solo leer el HTML)

Se probaron los botones reales del panel:

```text
widget:chat  tema=cyberpunk + forma=pill  -> API state OK
reset                                     -> ambos null
alert:card   tema=synthwave + forma=cozy_polaroid -> API state OK
reset                                     -> ambos null
scene maker-desk tema=cyberpunk + forma=cozy_polaroid -> API state OK
restore                                   -> tema maker, forma null
```

Además, al cargar el widget `chat` se observó `data-theme="cyberpunk"`,
`data-theme-shape="pill"` y el color computado cambiado; la alerta `card` se
aplicó con `AlertShapes.applyAll('card')` y `border-radius` cambiado.

### Barrido de páginas

- **62 URLs**: 0 excepciones JS, 0 respuestas HTTP ≥ 400.
- Los únicos avisos de consola son de **autoplay de Chrome** en panel,
  `index.html` y `widgets/goal` (política del navegador, no excepción).
- **204 tests / 17 suites OK**.
- `themes_state.json`, `fusions.json`, `config.js`, `overlay_texts_config.json`,
  `alerts_config.json`, `alerts_themes_config.json` y `widgets_config.json`
  conservaron su hash.
- `recent_tips=[]`; no se creó `token.json`.

---

## 2. Hallazgos

### V3-01 — [ALTA] XSS real en metadatos de temas y packs

**Dónde**

- `server/services/theme_service.py:182-220` (`create_theme_service`): guarda
  `name`, `badge` y `desc` sin sanear.
- `server/services/theme_service.py:283-308` (`save_theme_service`): el `name`
  y `badge` actualizados tampoco se validan.
- `server/services/theme_service.py:143-173` (`create_pack_service`): mismo
  problema para packs.
- `alerts/js/component-themes.js:34-38`: concatena `pack.name`, `t.name` e
  `id` directamente en `<optgroup>`/`<option>`.
- `alerts/js/themes/10-overlay-actions.js:21-22,74`: `defaultName` se inserta
  en el HTML de la tarjeta de escena.
- `alerts/js/themes/11-scene-editor.js:133-135,286`: `defaultInfo.name` se
  inserta en `defaultHintEl.innerHTML`.

**Reproducción real**

1. Se creó un tema temporal en `Maker_Theme_Pack` con:
   `name = audit_xss_<img src=x onerror=window.__auditXss=1>`.
   La API respondió **200** y guardó el nombre literal.
2. Al abrir el panel y cargar `ComponentThemes`, el HTML del panel contenía
   **5 elementos `<img src=x>`** y `window.__auditXss` terminó en **1**.
3. El tema temporal, su symlink y su CSS se eliminaron; `common/themes.css` se
   restauró desde el snapshot y el catálogo volvió a 21 temas.
4. `themes_state.json`, etc. quedaron con sus hashes originales.

**Impacto**

El panel comparte origen con `/api/local-token`; un nombre de tema o pack
malicioso puede ejecutar JavaScript en el contexto del panel. El vector realista
es un pack/tema importado o creado con metadatos no confiables. La API exige
token local, pero eso no convierte el nombre en dato seguro para `innerHTML`.

**Arreglo recomendado**

- Validar `name`, `badge`, `desc` e `icon` en el servicio (longitud, caracteres
  de control, sin HTML) y rechazar/limpiar en `create`/`save`/pack.
- Escapar **todos** los sinks con `themeEscapeHtml`/`esc`; serializar ids de
  handlers con `themeJsArg`.
- Test de regresión: crear un tema con `<img ...>`, recargar el panel, exigir
  0 ejecuciones y 0 `<img>` reales; borrar el tema temporal.

---

### V3-02 — [MEDIA/UX] Selects de componentes sin etiqueta ni accesibilidad

**Dónde:** `alerts/js/component-themes.js:68-78`.

Cada fila contiene tres `<select>` (tema, forma y fusión), pero:

- no hay `<label>`, texto de columna ni `aria-label`;
- la única pista es el placeholder (`sin asignar`, `sin forma`, `fusión`);
- el botón `➕` solo tiene `title`, no texto visible.

Medido en el DOM real:

```text
Widgets: 15 selects, 0 labels, 0 aria-label/aria-labelledby, 5 filas
Alertas:  6 selects, 0 labels, 0 aria-label/aria-labelledby, 2 filas
```

No faltan los controles: el usuario puede interactuar y el flujo funciona. El
problema es que no sabe con certeza qué select es tema y cuál forma, y un lector
de pantalla no tiene nombre accesible.

**Arreglo recomendado:** cabecera de columnas o `label` por fila (`Tema`,
`Forma`, `Fusión`) y `aria-label`/`aria-labelledby`; texto visible para `➕` o
un `title` acompañado de `aria-label`.

---

### V3-03 — [MEDIA] “9 escenas” en una app de 27

**Dónde**

- `alerts/panel.html:1762` — texto literal “9 pantallas”.
- `languages/es.json:538-539` y `languages/en.json:538-539` — subtítulo/tab
  con 9.
- `languages/es.alerts.json:566-567`, `929`, `937-938` — subtítulo, tab y
  confirmaciones con 9.
- `languages/en.alerts.json:566-567`, `929`, `937-938` — equivalente EN.

**Estado real:** 27 escenas. El texto visible del panel dice literalmente
“cada una de tus 9 pantallas” y el tab “Tus 9 Escenas en OBS”. La acción de
aplicar a todas sí itera `OSS_SCENES` (27), pero la confirmación puede mostrar 9
porque el runtime carga `es.alerts.json`.

**Arreglo recomendado:** sustituir 9 por 27 o, mejor, interpolar
`OSS_SCENES.length`; sincronizar `es.json`, `es.alerts.json`, `en.json` y
`en.alerts.json`; test de que ningún texto de la UI contiene “9 escenas”.

---

### V3-04 — [MEDIA] `GET /api/themes/packs` escribe CSS en cada lectura

**Dónde**

- `server/routes/themes_routes.py:46` llama a `get_all_packs_and_themes()`.
- `server/services/theme_manager.py:448-450` llama a `init_themes_directory()`.
- `theme_manager.py:362-403` ejecuta `sync_common_themes_css()`.

**Evidencia**

Se tomó el mtime de `common/themes.css`, se hizo un único
`GET /api/themes/packs` y el mtime cambió:

```text
antes:  1792894530
después: 1792894549
```

El contenido puede ser equivalente, pero un GET no debe escribir en disco. Es
el residuo de A6: sincronización en cada lectura, no solo al arrancar o tras
una escritura. Con varias pestañas/health checks se generan escrituras
innecesarias y una ventana de carrera.

**Arreglo recomendado:** sincronizar en el arranque y en las rutas de escritura
(create/save/restore), no en `GET`; test de mtime/hash estable tras dos GET.

---

### V3-05 — [MEDIA] Rutas que filtran `str(e)` en respuestas 500

**Dónde**

- `server/routes/fusions_routes.py:44-46`, `90-92`, `108-111`, `132-134`.
- `server/routes/rewards_routes.py:44-46`, `93-95`, `146-148`, `178-179`.
- `server/routes/webhooks_routes.py:128-130`, `174-176`, `209-211`.

**Impacto:** errores internos (paths, detalles de aiohttp/Twitch) llegan al
cliente. En webhooks externos el mensaje puede ser visible fuera de la máquina.
No se observó una fuga de token en las pruebas, pero la política de errores
genéricos que ya se aplicó en T08 no está completa.

**Arreglo recomendado:** log interno + `{"error": "..."} `genérico; mantener
solo mensajes de validación controlados.

---

### V3-06 — [MEDIA, por verificar] `fusion.id` sin sanear en DOM/onclick

**Dónde**

- `server/services/fusions_service.py:144-150`: acepta el `id` recibido sin
  validar formato/slug.
- `alerts/js/themes/13-fusions.js:104-107`, `123`, `127`, `130`, `1033`:
  `fusion.id` se interpola en `onclick="..."` y en `id="..."`.

**Estado:** es un sink estático claro; no se ejecutó una prueba runtime con un
id malicioso para no alterar `fusions.json` más allá del snapshot. Se marca
“por verificar” en cuanto a ejecución, no en cuanto al código.

**Arreglo recomendado:** validar ids como `^[A-Za-z0-9_-]+$` en el servicio y
escapar/serializar en el render.

---

### V3-07 — [BAJA] Código muerto del botón Volver de carpetas

`alerts/js/themes/09-overlay-folders-render.js:8` busca
`overlays-btn-back-folders`, que no existe en `panel.html`; el botón visible
“⬅️ Volver a Carpetas” funciona por su `onclick` inline. No es un fallo de
interacción, pero la referencia es engañosa y debe eliminarse o añadirse el id.

---

### V3-08 — [BAJA] JSON malformado en recompensas y simulación

- `rewards_routes.py:53`, `:161` hacen `await request.json()` sin `try`.
- `webhooks_routes.py:209-211` convierte cualquier error de `tips/simulate` en
  500 con `str(e)`.

No afecta al núcleo de temas, pero contradice el contrato 400/generic-500 que
se aplicó en el resto de rutas.

---

## 3. Lo que se verificó como correcto

- **No faltan selectores**: 21 estilos, 22 valores de forma de escena, 9 formas
  genéricas de widget, 29 formas de alerta.
- **Los controles existen y funcionan**: tema/forma/Aplicar/Reset/➕ en widgets;
  tema/forma/Aplicar/Reset/➕ en alertas; tema/forma en escenas; tema/forma en
  fusiones (lista, detalle y modal).
- **Persistencia**: aplicar tema+forma a widget, alerta y escena actualiza
  `themes_state.json`/`config.js`; reset vuelve a `null`/default.
- **Runtime**: el widget `chat` y la alerta `card` reflejaron el tema y la forma
  en `data-theme`/`data-theme-shape` y en estilos computados.
- **Sin errores de carga**: 62 URLs sin excepciones ni HTTP ≥400; solo avisos
  de autoplay.
- **Tests**: 204/204, 17 suites, estado y tips limpios después.

## 4. Archivos y estado de la auditoría

- Informe: este archivo.
- Snapshot usado: `/tmp/oss_audit_v3_state/` (no forma parte del repo).
- El tema temporal de la prueba XSS fue eliminado; el catálogo volvió a
  **21 temas** y `common/themes.css` recuperó su hash.
- No se modificó código de la app durante la auditoría.

## 5. Prioridad sugerida (sin aplicar)

1. **V3-01** XSS de metadatos: bloquear creación/guardado con HTML y escapar
   los tres sinks; es el único hallazgo de ejecución real.
2. **V3-02/V3-03** etiquetas y contadores: impacto directo en la percepción de
   “faltan controles” y en la confianza del panel.
3. **V3-04/V3-05** side effect en GET y fugas de error.
4. **V3-06** ids de fusión y **V3-08** validación de JSON de recompensas.
5. **V3-07** limpieza de código muerto.

Cuando decidas cómo proceder, puedo convertir estos hallazgos en tareas
priorizadas con criterios de aceptación y pruebas, o aplicar primero V3-01.
