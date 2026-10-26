# Tareas V3 — orden de ejecución

> Basado en `docs/AUDITORIA_WEBAPP_V3.md` (auditoría de solo lectura, 2026-10-25).
> Misma metodología que `TAREAS_PRIORIZADAS.md` (V2): una tarea por ronda, cada
> una termina con pruebas, hashes de estado idénticos y un `OK`.
> Cerradas: `[HECHO]`. Pendientes: `[ ]`.

## P0 — Seguridad de metadatos

### T3.01 — XSS en metadatos de temas, packs y fusiones (V3-01) [HECHO]

- **Archivos:** `server/services/validation_utils.py`, `server/services/theme_service.py`,
  `server/services/fusions_service.py`, `alerts/js/component-themes.js`,
  `alerts/js/themes/10-overlay-actions.js`, `alerts/js/themes/11-scene-editor.js`,
  `alerts/js/themes/13-fusions.js`, `tests/test_metadata_sanitization.py` (nuevo).
- **Problema:** un tema/pack/fusión con `name = '<img src=x onerror=...>'` se
  guardaba por API y el panel lo ejecutaba (`ComponentThemes`, tarjeta de escena,
  hint del modal) en el mismo origen que `/api/local-token`.
- **Arreglo:** nuevo `sanitize_metadata_text()` (rechaza `<` y `>`, elimina
  caracteres de control, colapsa espacios y limita longitud) aplicado en
  `create_pack_service`, `create_theme_service`, `save_theme_service` y
  `create_or_update_fusion` **antes de escribir en disco**; y escapado de todos
  los sinks del panel (`esc`, `themeEscapeHtml`, `themeJsArg`, `escapeHtml`).
- **Límites:** name/badge 80, descripción 300, icono 8 (máximos reales del
  catálogo: 31 / 28 / 104 / 2 → ningún dato de fábrica se rechaza).
- **Criterio:** `POST` con HTML en `name`/`badge`/`desc`/`icon` → 400 y **nada
  creado**; catálogo de fábrica intacto; 0 sinks sin escapar.
- **Verificación:** `test_metadata_sanitization.py` 16/16 OK; 84 tests de las 6
  suites relacionadas OK; `themes_state.json`, `fusions.json`, `config.js`,
  `overlay_texts_config.json` y `common/themes.css` con hashes idénticos;
  `node --check` OK en los 4 módulos JS tocados.

### T3.02 — `fusion.id` sin validar ni serializar (V3-06) [HECHO en T3.01]

- **Archivos:** `server/services/fusions_service.py`, `alerts/js/themes/13-fusions.js`.
- **Arreglo:** `_is_safe_fusion_id()` (bloquea `<>"'`(){}[];:,/\` y espacios,
  máx. 64) para el id recibido; **generador a slug ASCII** (`_slugify_ascii`,
  antes producía ids con acentos); `themeJsArg(fusion.id)` en los 5 `onclick` y
  `themeEscapeHtml(fusion.id)` en el `id="..."` del panel.
- **Nota:** la validación por lista negra (no por `^[A-Za-z0-9_-]+$`) es
  deliberada: los ids históricos con acentos siguen en `fusions.json` y deben
  seguir actualizándose. Un regex estricto rompía `test_fusions` (detectado y
  corregido en esta misma ronda).
- **Criterio:** id con `'); alert(1); //` → 400; ids heredados siguen aceptándose.

## P1 — UI, accesibilidad e i18n

### T3.03 — “9 escenas” en una app de 27 (V3-03) [HECHO]

- **Archivos:** `alerts/panel.html`, `languages/{es,en}.json`,
  `languages/{es,en}.alerts.json`, `alerts/js/themes/02-packs.js`,
  `alerts/js/themes/09-overlay-folders-render.js`,
  `alerts/js/themes/10-overlay-actions.js`, `tests/test_i18n_scene_count.py` (nuevo).
- **Problema:** el panel decía “cada una de tus **9** pantallas” y las
  confirmaciones fijaban 9 (parcialmente 27) escenas cuando el catálogo tiene 27.
- **Arreglo:**
  - Los **textos estáticos** (`panel.html` + `themes.section_subtitle` en los 4
    diccionarios) pierden el número: “cada una de tus pantallas de transmisión”.
  - Las **confirmaciones** (`themes.confirm_apply_all`,
    `confirm_restore_all_scenes_texts`, `confirm_restore_all_scenes_themes`) usan
    el parámetro `{count}` en los 4 diccionarios.
  - Los **tres llamadores JS** pasan `count: window.OSS_SCENES.length` y su texto
    de reserva también interpola el contador.
  - El badge `overlays-count-in-folder-badge` deja de tener un “9” fijo (lo
    rellena el JS con el contador de la carpeta).
- **No se toca (correcto):** las descripciones del pack Maker (“…con 9 pantallas
  listas”) porque ese pack tiene **9** escenas de verdad.
- **Criterio:** ningún texto de UI que hable del total fija un número; el valor
  sale del catálogo.
- **Verificación:** `test_i18n_scene_count.py` 4/4 OK (subtítulos sin dígitos,
  confirmaciones con `{count}`, estáticos de `panel.html` limpios y los 3
  llamadores usando `OSS_SCENES.length`); `node --check` OK; los 4 JSON parsean.

### T3.04 — Selects sin etiqueta ni `aria-label` (V3-02) [HECHO]

- **Archivos:** `alerts/js/component-themes.js`, `languages/{es,en}.alerts.json`,
  `tests/test_component_a11y.py` (nuevo).
- **Problema:** tres `<select>` por fila (tema, forma, fusión) sin `<label>` ni
  `aria-label`; el usuario no sabía cuál era cuál y un lector de pantalla no tenía
  nombre que anunciar.
- **Arreglo:** `aria-label` por select con el nombre del componente
  (“Tema: Chat”), `aria-label` en los botones Aplicar/Reset/➕ y **cabecera de
  columnas** visible (Componente · Tema · Forma · Aplicar · Reset · Fusión) con
  claves i18n nuevas `widgets.col_*` en ES y EN.
- **Verificación:** `test_component_a11y.py` 4/4 OK (todo `<select>` con
  `aria-label`, botones con nombre accesible, cabecera cableada y claves ES/EN
  presentes); `node --check` OK.

### T3.05 — `GET /api/themes/packs` reescribe `common/themes.css` (V3-04) [HECHO]

- **Archivos:** `server/services/theme_manager.py`, `tests/test_themes_read_only.py` (nuevo).
- **Problema:** `get_all_packs_and_themes()` → `init_themes_directory()` terminaba
  en `sync_common_themes_css()` **en cada petición**: un GET reescribía el CSS
  compartido aunque no hubiera cambios (medido: 3 GET = 3 recompilaciones).
- **Arreglo:** el bootstrap es **idempotente** (flag `_THEMES_INITIALISED`, una vez
  por proceso) y la recompilación se decide por **frescura** con
  `themes_css_is_stale()` (el CSS falta o es más antiguo que algún `style.css`).
  Así un tema añadido a mano se sigue detectando sin escribir en cada lectura.
  `init_themes_directory(force=…)` sigue disponible para forzar el bootstrap.
- **Verificación:** `test_themes_read_only.py` 5/5 OK + prueba empírica:
  **3 GET → 0 recompilaciones**, hash y `mtime` de `common/themes.css` intactos
  (antes: 3 recompilaciones); recompilar sigue siendo determinista.

### T3.06 — Fugas de error en respuestas 500 (V3-05) [HECHO]

- **Archivos:** `server/routes/errors.py` (nuevo), `fusions_routes.py`,
  `rewards_routes.py`, `webhooks_routes.py`, `themes_routes.py`,
  `tests/test_error_disclosure_contract.py` (nuevo).
- **Problema:** **12 respuestas 500** devolvían `str(e)` (fusions ×4, rewards ×3,
  webhooks ×4, themes ×1). En los webhooks públicos el mensaje es visible fuera
  de la máquina, así que filtraba trazas de aiohttp/Twitch y rutas de disco.
- **Arreglo:** helper único `internal_error_response()` / `internal_error_text()`
  (log interno con `logger.exception` + mensaje genérico
  “Error interno del servidor”, conservando `status: "error"` donde el panel lo
  consume). La lectura de recompensas sin Twitch también pasa a mensaje genérico.
- **Verificación:** `test_error_disclosure_contract.py` 3/3 OK (ninguna línea
  `status=500` con `str(e)` ni `f"Error: {e}"`, helper presente y usado en las 4
  rutas) + prueba de runtime: excepción interna → 500 con mensaje genérico y **sin**
  el texto de la excepción en el cuerpo.

### T3.07 — JSON malformado devuelve 500 (V3-08) [HECHO]

- **Archivos:** `rewards_routes.py`, `webhooks_routes.py`, `errors.py`,
  `tests/test_json_payload_errors.py` (nuevo).
- **Problema:** `await request.json()` sin protección en recompensas (crear/
  actualizar/borrar) y en los webhooks de Ko-fi/BMC/PayPal, y `webhooks/tip`
  convertía cualquier fallo en 500 con `str(e)`.
- **Arreglo:** lectura protegida → **400 “Payload JSON inválido”** (y cuerpo no
  diccionario → 400), `cost` de recompensa validado (no numérico o `< 1` → 400) y
  el resto de fallos → 500 genérico. Se conservan los patrones **tolerantes
  legítimos** de los endpoints de decks/updates (fallback a query params o
  `body = {}`), que el test AST distingue explícitamente.
- **Verificación:** `test_json_payload_errors.py` 6/6 OK (400 en `/api/fusions`,
  `/api/twitch/rewards/create`, `/api/twitch/rewards/delete` y `/api/tips/simulate`;
  `cost` no numérico → 400; error interno → 500 sin filtrar). Nueva regla AST en el
  contrato de errores: ninguna lectura de `request.json()` puede acabar en 500.

## P2 — Limpieza

### T3.08 — Código muerto del botón “Volver a Carpetas” (V3-07) [HECHO]

- **Archivos:** `alerts/js/themes/09-overlay-folders-render.js`,
  `tests/test_panel_dead_refs.py` (nuevo).
- **Problema:** se consultaba `overlays-btn-back-folders`, un id que **no existe**
  en `panel.html`; el botón visible funciona por su `onclick` inline, así que la
  referencia solo engañaba al leer el código.
- **Arreglo (opción elegida):** eliminar la referencia muerta y su uso. El botón
  real («⬅️ Volver a Carpetas», `themes.btn_back_folders`) vive **dentro** de
  `overlays-folder-details-view`, de modo que se oculta junto con el contenedor y
  no necesita lógica propia (queda comentado en el módulo). Se descartó añadir el
  id porque no aportaría comportamiento.
- **Verificación:** `test_panel_dead_refs.py` 2/2 OK — ninguna **referencia de
  código** al id muerto (el test ignora comentarios para no dar falsos positivos) y
  el botón sigue dentro del contenedor de detalles; `node --check` OK.

---

## Reglas de la ronda

1. Un commit por tarea: `fix(theme|webapp): …`, `test(theme): …`.
2. Snapshot previo y posterior de `themes_state.json`, `fusions.json`,
   `config.js`, `overlay_texts_config.json` y `common/themes.css`; hashes idénticos.
3. Textos ES/EN para toda etiqueta nueva.
4. Fin de ronda: suites verdes + `node --check` de los ficheros tocados.
5. **Pendiente operativo:** el árbol de trabajo sigue **sin commit ni push**
   (ver `PENDIENTES_NO_BLOQUEANTES.md`).
