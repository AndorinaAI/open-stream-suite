# Plan de corrección del backlog de temas (M1–M4, M7–M13, L1–L8)

> **Para Hermes:** ejecutar por fases con la skill `subagent-driven-development` o directamente.
> Cada tarea es un commit atómico. No usar el perfil `default`.
> **Este documento es solo el plan: no se ha modificado código.**

**Goal:** cerrar los 18 hallazgos abiertos (11 medios + 7 bajos) y automatizar la cobertura E2E,
sin romper H1–H10 ni el estado del usuario.

**Arquitectura:** mantener el contrato nativo de temas (`body[data-theme]` + tokens + `config.js`),
una sola fuente de verdad por concepto y validación en la capa que posee el invariante:
catálogo → servicios → API → UI. Nada de scripts inyectados ni parches en `panel.html`.

**Tech stack:** Python 3.12 + FastAPI, JS vanilla, CSS nativo, Chrome CDP/WebSocket para E2E,
`unittest` para regresión, `node --check` para sintaxis.

---

## 0. Línea base y reglas de ejecución

### Estado de partida (verificado)

- H1–H10 corregidos; informe en `app/docs/PENDIENTES_SISTEMA_TEMAS.md`.
- Suites actuales: 8/8 (incluye `test_theme_contract_h1_h10.py`, 11 tests).
- `themes_state.json` = `a259a19e…`; `fusions.json` = `88ac29ff…`;
  `overlay_texts_config.json` = `c71e1f43…`; `config.js` incluye
  `globalThemeActive`, `overlayThemeExplicit`, `overlayThemes` y `overlayShapes`.
- Apariencia por defecto: `chill → chill`; widgets/alertas sin tema si
  `globalThemeActive=false`.
- Servidor del usuario en `localhost:8080`; no matarlo salvo para cargar módulos Python nuevos.
- Backup de la ronda anterior: `app/.backups/2026-10-23_audit_h1_h10/`.

### Reglas de la ejecución

1. **Nativo, sin parches:** si un comportamiento no encaja, se corrige en el módulo que posee el
   invariante (catálogo, servicio, estado o UI), no con un listener o script extra.
2. **Preservar funcionalidad:** H1–H10 son regresión obligatoria; cada fase termina con las 8 suites
   verdes y los E2E de H1–H5 verdes.
3. **Estado del usuario:** antes de cada fase, snapshot de `themes_state.json`, `fusions.json`,
   `config.js`, `overlay_texts_config.json` y de los packs que se toquen. Al terminar, restaurar y
   comparar hashes.
4. **Datos reales:** no dejar fusiones, packs, temas ni asignaciones de prueba. Limpiar y restaurar.
5. **Textos ES/EN** para toda etiqueta nueva; los tests de cobertura i18n deben quedar en 0 claves
   ausentes.
6. **Nada de `default`:** si se delega, usar `yuki`, `sandy`, `bugy`, `cady` o `weby`.
7. **Un commit por tarea**, mensajes `fix(theme): …`, `feat(theme): …`, `test(theme): …`.

### Snapshot reproducible

```bash
cd /home/andorina/Imágenes/twitchoverlay/app
BK=".backups/2026-10-23_backlog_$(date +%H%M%S)"
mkdir -p "$BK"
cp themes_state.json fusions.json config.js overlay_texts_config.json "$BK"/
sha256sum themes_state.json fusions.json config.js overlay_texts_config.json | tee "$BK/hashes.txt"
```

Restauración:

```bash
cp "$BK"/{themes_state.json,fusions.json,config.js,overlay_texts_config.json} .
PYTHONPATH=. venv/bin/python -c "from server.services.overlay_service import write_config_js; write_config_js()"
```

---

## 1. Mapa de puntos → fase

| Punto | Fase | Resultado esperado |
|---|---|---|
| M1 | 1 | Defaults de fusión validados (tema/forma) |
| M2 | 1 | Miembros desconocidos reportados, no silenciados |
| M3 | 1 | Formas por capacidad de cada miembro; sin `partial` engañoso |
| M4 | 1 | Catálogo de formas dinámico (packs nuevos sin reinicio) |
| M7 | 2 | Toast con 27 escenas reales |
| M8 | 2 | Resumen de lote incluye escenas/widgets/alertas |
| M9 | 2 | Caché local solo tras confirmación de API |
| M10 | 2 | 0 claves i18n ausentes |
| L6 | 2 | Aplicar sin selección no muestra falso éxito |
| M12 | 3 | Estado normalizado: sin temas/formas huérfanos |
| M13 | 3 | Escrituras atómicas + lock de mutaciones |
| L1 | 3 | Una sola fuente de defaults (27, sin legacy) |
| L2 | 3 | `activeShape` normalizado a `original` |
| L3 | 3 | `fusions.json` con esquema completo persistido |
| M11 | 4 | `maker` con tokens estructurales |
| L4 | 4 | `gameplay_hud` con destino de formas de panel |
| L5 | 4 | Etiquetas de formas unificadas ES/EN |
| L7 | 5 | Test del bloque de alertas en runtime |
| L8 | 5 | E2E de navegador automatizado en el repo |

**Dependencias:** Fase 1 antes de Fase 2/3 (catálogo y contrato de fusión). Fase 2 antes de L5
(i18n). Fase 3 después de Fase 1 (normalización usa catálogo dinámico). Fase 5 al final.

---

## Fase 1 — Fusiones y catálogo (M1, M2, M3, M4)

### T1.1 — Catálogo dinámico y matriz de capacidad (M4 + base de M3)

**Objetivo:** que `components_catalog` calcule las formas de alerta desde los packs en cada consulta
(o con caché invalidable), y exponer una única función `supports_shape(kind, id, shape)`.

**Archivos:**
- Modificar: `app/server/services/components_catalog.py`
- Test: `app/tests/test_theme_backlog_contract.py`

**Pasos:**

1. Sustituir:
   ```python
   PACK_SHAPE_SET = _pack_shape_ids()
   ALERT_SHAPES = set(WIDGET_SHAPE_SET) | PACK_SHAPE_SET
   ```
   por:
   ```python
   _PACK_SHAPE_CACHE = {"stamp": None, "ids": set()}

   def get_pack_shape_ids() -> set:
       """Lee streamthemes/*/pack.json; cache por mtime del árbol de packs."""
       stamp = tuple(sorted(
           (p.stat().st_mtime_ns, str(p)) for p in STREAMTHEMES_DIR.glob("*/pack.json")
       ))
       if _PACK_SHAPE_CACHE["stamp"] != stamp:
           _PACK_SHAPE_CACHE["ids"] = _pack_shape_ids()
           _PACK_SHAPE_CACHE["stamp"] = stamp
       return set(_PACK_SHAPE_CACHE["ids"])

   def get_alert_shapes() -> set:
       return set(WIDGET_SHAPE_SET) | get_pack_shape_ids()

   def supports_shape(kind: str, item_id: str, shape: str) -> bool:
       shape = str(shape or "").strip()
       if shape.lower() in ("auto", "original", "", "none", "null", "__clear__"):
           return True
       if kind == "widget":
           return shape in WIDGET_SHAPE_SET
       if kind == "alert":
           return shape in get_alert_shapes()
       if kind == "scene":
           return is_valid_shape_id(shape)  # 20 físicas + auto/original
       return False
   ```
2. `catalog()` usa `get_alert_shapes()` y devuelve las formas ordenadas.
3. `is_valid_component_shape()` para `alert` usa `get_alert_shapes()`; para `widget`,
   `WIDGET_SHAPE_SET`; conservar `original` como alias de reset solo donde corresponda.
4. Invalidar caché no es necesario si se compara mtime, pero añadir
   `invalidate_shape_cache()` para llamarlo desde `create_pack_service`/`create_theme_service` si se
   prefiere caché explícita.
5. Corregir comentarios obsoletos que digan que las alertas no tienen formas.

**Test (falla primero):**
```python
def test_alert_shapes_are_dynamic(self):
    from server.services import components_catalog as cc
    before = cc.get_alert_shapes()
    self.assertIn("gamer_mecha", before)
    # crear pack temporal con un shape declarado y comprobar que aparece sin reiniciar
```
**Verificación:**
```bash
cd app && PYTHONPATH=. python3 -m unittest tests.test_theme_backlog_contract -v
python3 -c "import sys;sys.path.insert(0,'.');from server.services.components_catalog import catalog;print(len(catalog()['alerts'][0]['shapes']))"
```
**Criterio:** catálogo con 29 formas; pack temporal aparece en caliente; 0 regresiones.

---

### T1.2 — Validar defaults de fusión (M1)

**Objetivo:** `create_or_update_fusion` rechaza `defaultTheme`/`defaultShape` inválidos y el panel
muestra el error.

**Archivos:**
- Modificar: `app/server/services/fusions_service.py`
- Modificar: `app/alerts/js/themes/13-fusions.js`
- Test: `app/tests/test_fusions_service.py` (nuevo o ampliar `test_fusions.py`)

**Pasos:**

1. Añadir helper:
   ```python
   def _valid_fusion_defaults(default_theme, default_shape):
       theme = str(default_theme or "").strip()
       if theme and not is_valid_theme_id("", theme):
           raise ValueError(f"Tema predeterminado desconocido: {theme}")
       shape = str(default_shape or "").strip() or "original"
       if shape not in ("auto", "original") and not is_valid_shape_id(shape):
           raise ValueError(f"Forma predeterminada desconocida: {shape}")
       return theme or None, shape
   ```
   Usar `is_valid_theme_id` con `pack_id=""` (acepta cualquier pack) o el helper existente que
   corresponda.
2. En `create_or_update_fusion`, antes de construir `fusion_obj`:
   ```python
   default_theme, default_shape = _valid_fusion_defaults(
       data.get("defaultTheme"), data.get("defaultShape")
   )
   ```
   y guardar esos valores.
3. La ruta `POST /api/fusions` ya convierte `ValueError` en 400; verificar.
4. En `13-fusions.js`, el `catch` de guardado debe mostrar el mensaje del servidor y no cerrar el
   modal si hay error.
5. No romper fusiones existentes con `defaultTheme` vacío: se normaliza a `None`/`original`.

**Test:**
```python
def test_fusion_rejects_invalid_defaults(self):
    with self.assertRaises(ValueError):
        create_or_update_fusion({"name":"X","defaultTheme":"no-theme","defaultShape":"no-shape"})
```
**Verificación UI:** abrir modal, guardar con defaults válidos; inyectar `no-theme` por API y ver 400.

**Criterio:** 400 con mensaje; el select del detalle siempre tiene un valor válido o “sin asignar”.

---

### T1.3 — Reportar miembros desconocidos (M2)

**Objetivo:** no guardar una fusión con miembros inválidos sin decírselo al usuario.

**Archivos:**
- Modificar: `app/server/services/fusions_service.py`
- Modificar: `app/alerts/js/themes/13-fusions.js`
- i18n: `app/languages/es.fusions.json`, `app/languages/en.fusions.json`
- Test: `app/tests/test_fusions.py`

**Pasos:**

1. Mantener los arrays `unknownScenes/Widgets/Alerts` en la respuesta, pero añadir:
   ```python
   warnings = []
   if unknown_scenes: warnings.append(f"Escenas ignoradas: {', '.join(unknown_scenes)}")
   ...
   return {"fusion": fusion_obj, "unknownScenes": ..., "warnings": warnings}
   ```
2. Si **todos** los miembros enviados eran desconocidos y no queda ninguno válido:
   `raise ValueError("La fusión no tiene miembros válidos: ...")` (400).
3. En `saveFusion` (UI), después de la respuesta:
   ```js
   const warnings = res.warnings || [];
   if (warnings.length) OverlayTexts.showToast('⚠️ ' + warnings.join(' · '), 'warning');
   ```
   No cerrar el modal si el servidor devolvió 400.
4. Añadir textos ES/EN `fusions.members_ignored` con placeholders.

**Test:** crear con `["chill","no-existe"]` → 200, `unknownScenes=["no-existe"]`, `warnings` no vacío;
crear solo con `no-existe` → 400.

**Criterio:** el usuario ve exactamente qué miembros se descartaron.

---

### T1.4 — Formas por capacidad en lote (M3)

**Objetivo:** aplicar una forma a cada miembro según lo que soporta, sin fallar el lote entero ni
mentir con `partial`.

**Archivos:**
- Modificar: `app/server/services/fusions_service.py`
- Modificar: `app/alerts/js/themes/13-fusions.js`
- Test: `app/tests/test_fusions.py`

**Pasos:**

1. En `apply_fusion_shape_batch`:
   - Validar contra la **unión** de capacidades de los miembros:
     ```python
     supported = any(
         components_catalog.supports_shape("scene", sc, shape_id)
         for sc in fusion.get("scenes", [])
     ) or any(
         components_catalog.supports_shape("widget", w, shape_id)
         for w in fusion.get("widgets", [])
     ) or any(
         components_catalog.supports_shape("alert", a, shape_id)
         for a in fusion.get("alerts", [])
     )
     if not supported:
         raise ValueError(f"Forma no soportada por ningún miembro: {shape_id}")
     ```
   - En cada bucle, si `not supports_shape(...)`, añadir a `skippedScenes/Widgets/Alerts` con
     `{"id": ..., "reason": "unsupported_shape"}` y continuar.
   - Aplicar `set_overlay_theme_service` solo a los que soportan.
   - Actualizar `defaultShape` solo si `any_applied` (no en un lote 100% omitido).
   - Devolver `skippedScenes`, `skippedWidgets`, `skippedAlerts`.
2. Corregir el comentario de `:339-340` (“alertas no tienen formas”).
3. UI `13-fusions.js`: usar un helper `formatBatchSummary(res)` que incluya:
   `appliedScenes`, `appliedWidgets`, `appliedAlerts`, `skipped*`, `failed*`; toast acorde.
4. Casos:
   - Escena+alerta con `pill`: escena omitida, alerta aplicada, `status:"partial"` (no 400).
   - Solo alertas con `pill`: 200, alerta aplicada.
   - Forma `bogus`: 400.
   - `original` en widget/alerta: se normaliza a sin forma (H6) y se informa.

**Test:** tres casos anteriores en `test_fusions.py`; UI con fusión mixta.

**Criterio:** ningún miembro recibe una forma que no soporta; el resumen refleja todos los tipos.

---

## Fase 2 — UI e i18n (M7, M8, M9, M10, L6)

### T2.1 — Contador real de escenas (M7)

**Archivos:** `app/alerts/js/themes/06-scene-helpers.js`, i18n `themes.*`.
**Pasos:**
1. En `applyThemeToAllScenesFromBar`, sustituir el literal `9` por:
   ```js
   const sceneCount = (window.OSS_SCENES && Object.keys(window.OSS_SCENES).length) || 0;
   ```
2. Texto con placeholder `{count}` en ES/EN; no concatenar números hardcodeados.
**Test:** inspección estática + abrir panel y comprobar que el toast dice 27.
**Criterio:** cualquier pack/escena nueva no obliga a editar el toast.

### T2.2 — Resumen de lote completo (M8)

**Archivos:** `app/alerts/js/themes/13-fusions.js`, `app/alerts/js/component-themes.js` (si hay helper).
**Pasos:**
1. Extraer `formatBatchSummary(res)` reutilizable:
   ```js
   function formatBatchSummary(res) {
     const parts = [];
     if (res.appliedScenes?.length) parts.push(`${res.appliedScenes.length} escena(s)`);
     if (res.appliedWidgets?.length) parts.push(`${res.appliedWidgets.length} widget(s)`);
     if (res.appliedAlerts?.length) parts.push(`${res.appliedAlerts.length} alerta(s)`);
     if (res.skippedScenes?.length || res.skippedWidgets?.length || res.skippedAlerts?.length) ...
     if (res.failedScenes?.length || ...) ...
     return parts.join(' · ') || 'sin cambios';
   }
   ```
2. Usarlo en tema y forma; no mostrar “0 escenas” si hay widgets/alertas.
**Test:** fusión solo widgets/alertas; toast correcto.

### T2.3 — Caché solo tras confirmación (M9)

**Archivos:** `app/alerts/js/themes/10-overlay-actions.js`, `app/alerts/js/themes/11-scene-editor.js`.
**Pasos:**
1. Guardar `previousTheme = cachedOverlayThemes[sceneKey]` / `previousShape`.
2. Actualizar la vista previa (miniatura/select) sin tocar la caché global.
3. `await API...`; en éxito, asignar caché y refrescar; en `catch`, restaurar previous, refrescar y
   toast de error.
4. No actualizar `window.cachedOverlayThemes` antes del `await`.
**Test E2E:** stub `window.API.applyTheme` que rechaza; comprobar que la caché y el select no cambian.

### T2.4 — Aplicar sin selección (L6)

**Archivos:** `app/alerts/js/component-themes.js`.
**Pasos:**
1. En `apply`, si no hay `theme` ni `shape` seleccionados:
   ```js
   OverlayTexts.showToast(tr('widgets.select_theme_or_shape', 'Selecciona un tema o una forma'), 'info');
   return;
   ```
2. No mostrar “✓ Tema aplicado”.
3. Para limpiar, el usuario usa “Reset” (ya existe).
**Test:** clic con ambos selects vacíos; no hay llamada API y el toast es informativo.

### T2.5 — i18n completo (M10)

**Archivos:** `app/languages/es.common.json`, `en.common.json`, `es.fusions.json`, `en.fusions.json`,
`es.themes.json`, `en.themes.json` (o los módulos donde vivan las claves).
**Pasos:**
1. Añadir:
   - `common.refresh`: “Actualizar” / “Refresh”.
   - `fusions.label_default_shape`: “Forma predeterminada” / “Default shape”.
   - `themes.shape_label`: “Forma” / “Shape”.
2. Añadir las claves nuevas de T2.2/T2.4 (`fusions.members_ignored`,
   `widgets.select_theme_or_shape`, etc.).
3. Script de cobertura (temporal, no commit) que extraiga `data-i18n` y `tr('...')` del panel y
   compare con los módulos.
**Verificación:**
```bash
python3 - <<'PY'
# mismo extractor usado en la auditoría; debe imprimir 0 claves ausentes
PY
```
**Criterio:** 0 claves sin traducción en ES/EN; no quedan fallbacks visibles.

---

## Fase 3 — Estado y persistencia (M12, M13, L1, L2, L3)

### T3.1 — Escrituras atómicas y lock (M13)

**Archivos:**
- Crear: `app/server/services/fs_utils.py`
- Modificar: `theme_manager.py`, `fusions_service.py`, `overlay_service.py`
- Test: `app/tests/test_theme_backlog_contract.py`

**Pasos:**
1. Crear:
   ```python
   import json, os, tempfile, threading
   from pathlib import Path

   _LOCKS = {}
   _LOCKS_GUARD = threading.Lock()

   def _lock_for(path):
       with _LOCKS_GUARD:
           return _LOCKS.setdefault(str(Path(path).resolve()), threading.RLock())

   def atomic_write_text(path, text):
       path = Path(path)
       path.parent.mkdir(parents=True, exist_ok=True)
       with _lock_for(path):
           fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.tmp.")
           try:
               with os.fdopen(fd, "w", encoding="utf-8") as f:
                   f.write(text)
               os.replace(tmp, path)
           finally:
               if os.path.exists(tmp):
                   os.unlink(tmp)

   def atomic_write_json(path, data):
       atomic_write_text(path, json.dumps(data, indent=2, ensure_ascii=False))
   ```
2. Usar `atomic_write_json`/`atomic_write_text` en `save_theme_state`, `save_fusions`,
   `write_config_js`, `sync_common_themes_css` y guardado de `overlay_texts_config.json`.
3. Añadir `STATE_MUTATION_LOCK = asyncio.Lock()` compartido en `theme_service` y
   `fusions_service` o un módulo `state_lock.py`; envolver las secciones load→modify→save de las
   mutaciones async (asignaciones, reset, aplicar tema/forma, crear/editar fusión) para evitar
   lost updates. No mantener el lock durante broadcasts largos.
4. Test de concurrencia: 20 `asyncio.gather` de asignaciones distintas; al final las 20 están en el
   JSON. Test de fallo de `os.replace` deja el archivo anterior intacto.
**Criterio:** no hay JSON truncado ni asignaciones perdidas; `config.js` siempre válido.

### T3.2 — Normalizar estado huérfano (M12)

**Archivos:** `app/server/services/theme_manager.py`, `app/tests/test_theme_backlog_contract.py`.
**Pasos:**
1. Añadir `normalize_theme_assignments(state)` puro, con imports lazy para evitar ciclos:
   - Para cada `overlayThemes[key]`:
     - componente: si el tema no existe (`is_valid_theme_id("", theme)`), eliminar clave y su
       `overlayThemeExplicit`.
     - escena: si el tema no existe, restaurar `DEFAULT_OVERLAY_THEMES[key]` o quitar.
   - Para cada `overlayShapes[key]`:
     - componente: si `not is_valid_component_shape(...)`, eliminar (incluye `original`, H6).
     - escena: si no es `original/auto` y no `is_valid_shape_id`, eliminar/restaurar.
   - Devolver `report` con `droppedThemes`, `droppedShapes`.
2. Llamarlo en `load_theme_state` tras `migrate_theme_state`; loggear el reporte; no escribir el
   archivo solo por cargar salvo que cambie algo (o dejar que el próximo save lo haga).
3. Test sintético: estado con `widget:chat: no-theme`, `alert:card: original`,
   `maker-desk: no-shape`; tras normalizar no quedan inválidos y las escenas conservan su default.
**Criterio:** `config.js` nunca publica IDs que ya no existen.

### T3.3 — Una sola fuente de defaults (L1)

**Archivos:** `overlay_service.py`, `common/overlay.js`, `alerts/js/themes/01-state.js`,
`theme_defaults.py`, tests.
**Pasos:**
1. `build_config_payload` publica `defaultOverlayThemes` desde
   `theme_manager.DEFAULT_OVERLAY_THEMES` (dict de 27).
2. Actualizar `sync_config_js_state()` para que también exija `defaultOverlayThemes` y regenere
   `config.js` si falta (igual que `globalThemeActive`/`overlayThemeExplicit`).
3. `common/overlay.js` elimina el mapa hardcodeado de 29 (incluidos `maker`/`print` legacy); usa:
   ```js
   const defaults = config.defaultOverlayThemes || config.overlayThemes || {};
   ```
   y sólo cae a un pack map mínimo si `defaults` está vacío.
4. `01-state.js` usa `window.OSS_CONFIG.defaultOverlayThemes` cuando exista; si no, mantiene su
   fallback actual (sin duplicar 29).
5. Test: `defaultOverlayThemes` tiene 27 claves y coincide con Python; no hay `maker`/`print` en
   `common/overlay.js`.
**Criterio:** una sola definición; H1/H2 siguen verdes.

### T3.4 — Normalizar `activeShape` (L2)

**Archivos:** `theme_manager.py`, `theme_service.py`, `overlay_service.py`.
**Pasos:**
1. En `load_theme_state`: `state["activeShape"] = state.get("activeShape") or "original"`.
2. En `save_theme_state` y en la respuesta de assignments, normalizar `None` a `"original"`.
3. Test: estado sin `activeShape` → `/config.js` y `/api/themes/packs` devuelven `"original"`.
**Criterio:** no queda `null` ambiguo; `auto` sigue siendo válido como reset explícito.

### T3.5 — Persistir esquema de fusiones (L3)

**Archivos:** `fusions_service.py`, `app/tests/test_fusions.py`.
**Pasos:**
1. `_normalize_loaded_fusions` ya rellena `widgets/alerts/defaults`; hacer que `load_fusions`
   detecte cambios y reescriba una sola vez con `atomic_write_json` (o migración al arrancar).
2. Garantizar que toda fusión guardada tiene `scenes`, `widgets`, `alerts`, `defaultTheme`,
   `defaultShape`; `null` → `[]`/`original`.
3. Test: fixture `fusion_starter_mix` sin `widgets/alerts` → tras load/save el JSON tiene las claves.
**Criterio:** API y archivo muestran el mismo esquema.

---

## Fase 4 — Visual y etiquetas (M11, L4, L5)

### T4.1 — Tokens estructurales de `maker` (M11)

**Archivos:**
- `app/streamthemes/Maker_Theme_Pack/styles/maker/style.css`
- `.../style.default.css`
- `app/common/themes.css` (regenerado)
- Test: `app/tests/test_theme_backlog_contract.py`

**Pasos:**
1. Copiar los 14 tokens estructurales (`--frame-*`, `--panel-*`, `--badge-*`, `--header-*`) del
   tema de referencia `cyberpunk` o de los valores base de `common/styles.css`, adaptando color y
   radios a la paleta maker (no copiar colores ajenos: usar los `--color-*` maker).
2. Añadirlos a `style.css` y `style.default.css`.
3. Regenerar `common/themes.css` con `sync_common_themes_css()` y comprobar que el bloque maker tiene
   las mismas claves que los otros 20.
4. Test CSS: `maker` contiene los 14 nombres; aplicar forma `cozy_polaroid` y comprobar que el marco
   usa `--frame-*` sin `!important` roto.
**Criterio:** 21/21 temas con tokens estructurales; sin cambios visuales fuera de maker.

### T4.2 — Destino de formas en `gameplay_hud` (L4)

**Archivos:** `app/streamthemes/Gamer_Pro_Pack/overlays/gameplay_hud/index.html`.
**Pasos:**
1. Inspeccionar el HUD: no hay panel, solo `header[data-oss-bar]`, `.camera-frame[data-oss-cam]`,
   `footer[data-oss-bar]` y badge.
2. Añadir `data-oss-panel="true"` al contenedor con marco propio (`.camera-frame hud-cam-box`) o, si
   el diseño no lo admite, crear un `.hud-panel` mínimo para telemetría. La opción preferida es
   marcar el camera-frame como panel para que las formas de panel tengan destino sin duplicar CSS.
3. Verificar que `cozy_polaroid`/`gamer_mecha` modifican borde/radio/fondo y que la cámara sigue
   visible y sin desplazamiento.
**Test E2E:** abrir escena, aplicar `cozy_polaroid`, medir `border-radius`/`border-width`; reset.
**Criterio:** todas las escenas tienen al menos un `[data-oss-panel]` o una limitación documentada.

### T4.3 — Etiquetas unificadas de formas (L5)

**Archivos:** `app/common/oss-shape.js`, `app/alerts/js/component-themes.js`,
`app/alerts/js/themes/06-scene-helpers.js`, `13-fusions.js`, `languages/*`.
**Pasos:**
1. Añadir a `OSSShape` un mapa:
   ```js
   const LABELS = {
     rounded: 'shapes.rounded', box: 'shapes.box', bubble: 'shapes.bubble',
     scifi: 'shapes.scifi', pill: 'shapes.pill', arcade: 'shapes.arcade',
     tag: 'shapes.tag', slant: 'shapes.slant', soft_card: 'shapes.soft_card'
   };
   function label(id) { return tr(LABELS[id] || '', id); }
   ```
2. Los builders de opciones usan `shapeLabel(id)` para genéricos y `shape.name` para packs.
3. Añadir textos ES/EN.
**Test:** el select de escena/fusión muestra “Píldora” en español y “Pill” en inglés, no `pill`.
**Criterio:** un solo vocabulario visible; los ids siguen siendo estables en API/estado.

---

## Fase 5 — Tests y cierre (L7, L8)

### T5.1 — Test del bloque de alertas (L7)

**Archivos:** `app/tests/test_alerts_studio.py`, `app/tests/test_native_theming_contract.py`.
**Pasos:**
1. Test que lea `alerts/js/alerts-studio/02a-layout-dom.js` y verifique que la plantilla incluye
   `alert-themes-panel` y la llamada a `ComponentThemes.load`.
2. Test E2E: abrir pestaña Alertas, contar 2 filas y 30 opciones de forma, aplicar/reset.
**Criterio:** una regresión de `renderStudio()` rompe el test.

### T5.2 — E2E automatizado (L8)

**Archivos:**
- Crear: `app/tests/e2e_theme_backlog.py`
- Crear: `scripts/run_theme_e2e.sh`
- Documentar en `app/docs/PENDIENTES_SISTEMA_TEMAS.md`.

**Pasos:**
1. Portar los scripts scratch `verify_h1_h5.py` y `verify_h6_h10.py` a un solo runner con
   `unittest`/funciones, usando Chrome CDP y `websockets`.
2. Cubrir:
   - H1–H5 (global, precedencia, formas, reset, alertas por tipo).
   - M1–M3 (defaults, warnings, lote de formas).
   - M7/M8 (toasts).
   - M9 (fallo de API no contamina caché).
   - M11/L4/L5 (tokens, panel, etiquetas).
3. Snapshot/restore de estado/config al inicio y `finally`; `sha256` de los 4 JSON.
4. El runner debe fallar si el servidor no está en `localhost:8080` o si el estado cambia.
**Verificación:**
```bash
cd app && venv/bin/python tests/e2e_theme_backlog.py
```
**Criterio:** un comando, 0 fallos, estado restaurado.

### T5.3 — Documentación y cierre

**Archivos:**
- `app/docs/PENDIENTES_SISTEMA_TEMAS.md`
- `app/docs/PENDIENTES_TEMAS_WIDGETS_ALERTAS.md`
- `app/docs/CONVENCIONES_TEMAS_WIDGETS_ALERTAS.md` / `.en.md`
- `CHANGELOG.md` / `CHANGELOG.en.md`

**Pasos:**
1. Marcar M1–M4, M7–M13, L1–L7 como resueltos; L8 como automatizado.
2. Añadir una sección “Backlog cerrado” con evidencia (comando, resultado, hashes).
3. Actualizar CHANGELOG ES/EN con una entrada por fase (o una entrada agregada).
4. Revisar que no queden conteos obsoletos (`9 escenas`, 9 formas de alerta, etc.).
5. Ejecutar la verificación final completa.

---

## 6. Verificación final (obligatoria)

```bash
cd /home/andorina/Imágenes/twitchoverlay
# 1. Sintaxis
for f in $(find app/common app/widgets app/alerts/js -name '*.js' -type f); do node --check "$f"; done
python3 -m py_compile app/server/services/*.py app/server/routes/*.py

# 2. Suites (8 actuales + backlog)
for t in app/tests/test_theme_contract_h1_h10.py \
         app/tests/test_theme_backlog_contract.py \
         app/tests/test_native_theming_contract.py \
         app/tests/test_fusion_members.py \
         app/tests/test_audit_fixes.py \
         app/tests/test_fusions.py \
         app/tests/test_scenes_themes_integration.py \
         app/tests/test_theme_packs.py \
         app/tests/test_validation_utils.py; do
  PYTHONPATH=app python3 "$t" || exit 1
done

# 3. E2E
cd app && venv/bin/python tests/e2e_theme_backlog.py

# 4. Estado restaurado
sha256sum themes_state.json fusions.json config.js overlay_texts_config.json
```

**Definition of Done global:**

- [ ] Los 18 puntos abiertos están cerrados o, si alguno se declara límite intencional, está
      documentado y retirado del backlog con justificación.
- [ ] H1–H10 siguen pasando.
- [ ] 0 claves i18n ausentes.
- [ ] `maker` tiene los 14 tokens estructurales.
- [ ] `defaultOverlayThemes` = 27 y sin `maker`/`print` legacy.
- [ ] `activeShape` nunca `null`.
- [ ] `fusions.json` con esquema completo.
- [ ] No hay JSON truncado en prueba de concurrencia.
- [ ] E2E en un comando y estado del usuario intacto.
- [ ] Informe y CHANGELOG actualizados.

---

## 7. Riesgos y rollback

| Riesgo | Mitigación |
|---|---|
| L1 (defaults) rompe H1/H2 | Ejecutar H1–H5 E2E tras T3.3; comparar `config.js` antes/después. |
| M12 borra asignaciones válidas | Catálogo dinámico primero (T1.1); backup y reporte de claves descartadas; no borrar si el catálogo falla. |
| M13 lock produce deadlock | Usar `RLock`/`asyncio.Lock` acotado; no retener durante broadcast; test de timeout. |
| M11 cambia la estética de maker | Diff visual de las 27 escenas; tokens solo estructurales, colores desde `--color-*` maker. |
| L4 marca la cámara y rompe HUD | Medir cámara antes/después; si el diseño no lo admite, crear `.hud-panel` o documentar límite. |
| L3 reescribe `fusions.json` | Snapshot + validación de las 1 fusión real; no borrar miembros. |
| M3 cambia semántica de `partial` | Tests de los 4 casos y UI; conservar respuesta antigua para compatibilidad. |

**Rollback por fase:** restaurar el backup de la fase y regenerar `config.js`; los cambios de código
se revierten con `git checkout -- <archivos>` solo si están commiteados por tarea (por eso un commit
por tarea).

---

## 8. Orden de commits sugerido

```text
fix(theme): dynamic alert shape catalog and capability matrix        # T1.1
fix(fusions): validate fusion default theme and shape                # T1.2
fix(fusions): report ignored members and reject empty fusions        # T1.3
fix(fusions): apply shapes per member capability                     # T1.4
fix(ui): use real scene count in apply-all toast                     # T2.1
fix(ui): include widgets/alerts in batch result summary              # T2.2
fix(ui): only commit cache after API success                         # T2.3
fix(ui): no-op apply shows informative message                       # T2.4
feat(i18n): complete theme/fusion UI keys                            # T2.5
fix(state): normalize orphan theme/shape assignments                 # T3.2
fix(state): atomic writes and mutation locks                         # T3.1
refactor(theme): single source for default overlay themes            # T3.3
fix(theme): normalize activeShape to original                        # T3.4
fix(fusions): persist complete fusion schema                         # T3.5
fix(theme): add maker structural tokens                              # T4.1
fix(scene): add panel shape target to gameplay hud                   # T4.2
feat(theme): unify generic shape labels                              # T4.3
test(alerts): protect runtime alert-themes block                     # T5.1
test(theme): automated browser E2E backlog                           # T5.2
docs(theme): close backlog and update changelog                      # T5.3
```
