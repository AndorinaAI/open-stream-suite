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

### T3.03 — “9 escenas” en una app de 27 (V3-03) [ ]

- **Archivos:** `alerts/panel.html:1762`, `languages/es.json`, `languages/en.json`,
  `languages/es.alerts.json`, `languages/en.alerts.json`.
- **Criterio:** ningún texto de UI dice “9 escenas/9 pantallas”; donde aplique se
  interpola `OSS_SCENES.length`; test de que no queda el literal.
- **Evidencia de partida:** el panel muestra literalmente “cada una de tus 9 pantallas”.

### T3.04 — Selects sin etiqueta ni `aria-label` (V3-02) [ ]

- **Archivos:** `alerts/js/component-themes.js`.
- **Criterio:** cabecera de columnas o `label` por fila (`Tema`, `Forma`, `Fusión`)
  y `aria-label`/`aria-labelledby`; el botón `➕` con texto visible o `aria-label`.
- **Medición objetivo:** 15 selects de widgets y 6 de alertas con nombre accesible.

## P1 — API

### T3.05 — `GET /api/themes/packs` reescribe `common/themes.css` (V3-04) [ ]

- **Archivos:** `server/routes/themes_routes.py`, `server/services/theme_manager.py`.
- **Problema:** un GET con efecto lateral (recompila el CSS compartido en cada
  petición): coste innecesario y riesgo de escritura concurrente.
- **Criterio:** el GET no escribe; la recompilación solo ocurre en `create`,
  `save`, `restore` y cambios de pack/tema. Test: el hash de `common/themes.css`
  no cambia tras N GET.

### T3.06 — Fugas de error en respuestas 500 (V3-05) [ ]

- **Archivos:** rutas que devuelven `str(e)` (revisar `themes_routes.py`,
  `webhooks_routes.py`, `rewards_routes.py`, `deck_routes.py`).
- **Criterio:** log interno + `{"error": "..."} `genérico; solo se mantienen los
  mensajes de validación controlados (400).

### T3.07 — JSON malformado devuelve 500 (V3-08) [ ]

- **Archivos:** `server/routes/rewards_routes.py:53,161`,
  `server/routes/webhooks_routes.py:209-211`.
- **Criterio:** `await request.json()` envuelto en `try`; `tips/simulate` con
  cuerpo inválido → 400 genérico.

## P2 — Limpieza

### T3.08 — Código muerto del botón “Volver a Carpetas” (V3-07) [ ]

- **Archivos:** `alerts/js/themes/09-overlay-folders-render.js:8`.
- **Criterio:** eliminar la referencia a `overlays-btn-back-folders` (o añadir el
  id al botón real). El botón visible ya funciona por su `onclick` inline.

---

## Reglas de la ronda

1. Un commit por tarea: `fix(theme|webapp): …`, `test(theme): …`.
2. Snapshot previo y posterior de `themes_state.json`, `fusions.json`,
   `config.js`, `overlay_texts_config.json` y `common/themes.css`; hashes idénticos.
3. Textos ES/EN para toda etiqueta nueva.
4. Fin de ronda: suites verdes + `node --check` de los ficheros tocados.
5. **Pendiente operativo:** el árbol de trabajo sigue **sin commit ni push**
   (ver `PENDIENTES_NO_BLOQUEANTES.md`).
