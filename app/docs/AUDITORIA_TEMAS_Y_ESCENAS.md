# AUDITORÍA — Packs de Temas, Escenas y Sistema

> **Fecha:** 2026-10-23 · **Proyecto:** Open Stream Suite (`twitchoverlay`)
> **Alcance:** sistema de temas/packs/escenas (backend + panel + datos), fallos visuales de escenas, compatibilidad Windows/macOS y documentación.
> **Método:** revisión estática dirigida + análisis de datos (pack.json / theme.json / themes_state.json / style.css), git forense, renderizado runtime de las 27 escenas (Chrome headless vía CDP, simulando OBS), verificación de red, auditoría cruzada con agentes auxiliares (weby: estático+visual · bugy: runtime) y **verificación manual de cada hallazgo crítico** contra código/HTTP real.
> **Estado de este informe:** v1.1 — anexo visual completo (16 capturas revisadas); C5 (Cinzel) y C8 (FPS) corregidos. Seguimiento operativo: [`PENDIENTES_NO_BLOQUEANTES.md`](PENDIENTES_NO_BLOQUEANTES.md).

---

## Resumen ejecutivo

| Área | Altos | Medios | Bajos |
|---|---|---|---|
| Sistema de temas (backend) | 3 | 7 | 5 |
| Panel (frontend) | 1 | 3 | 4 |
| Packs/escenas (datos) | 2 | 2 | 4 |
| Windows/macOS | 1 | 4 | 5 |
| Runtime de escenas | 0 (limpio) | — | 1 |
| Documentación | — | — | — (corregida) |

**Top 10 (por impacto):**
1. **`style.default.css` obsoletos en 15/21 estilos** → "Restaurar" degrada el tema (elimina los tokens de formas físicas). [A1]
2. **Crash silencioso del servidor en Windows** por emojis + tubería cp1252 en el launcher. [E1]
3. **Arquetipos de tema duplicados 4×** (py/js/pack.json) con heurísticas divergentes → estilado cruzado inconsistente. [A7-A9]
4. **Sin validación de theme/shape/scene ids** en los endpoints → estado con claves basura (`"starting":"ambient"`) y escenas sin estilo. [A10-A12]
5. **URLs de escenas con separadores del SO** (`str(Path)`) → 404 en Windows. [A4]
6. **404 de vista previa** de pantallas (`/scenes/startingSoon/` camelCase vs mapa kebab). [H1]
7. **Symlink de tema** en Windows falla en silencio (permisos). [A5/E3]
8. **Botón "👁️ Probar" de Fusión roto** (`openOverlayFullscreen` con 1 argumento). [B1]
9. **Fuente `Cinzel` no empaquetada** → formas fantasía/gótico pierden tipografía. [C5]
10. **FPS contradictorio (240 vs 60)** en la misma escena gameplay_hud. [C8]

**Lo que está bien (verificado):** las 27 escenas cargan sin errores JS ni excepciones (0 en 32 barridos); las fuentes woff2 responden 200; pack.json/theme.json coherentes (packId/id correctos, 20 formas únicas); overlay_texts ES/EN con paridad de claves (134/134); sin XSS por innerHTML en los módulos auditados; API↔rutas 1:1.

---

## 1. Sistema de temas — backend

- **[A1][ALTA] `.default.css` obsoletos en 15/21 estilos.** Maker (5), Gamer (5) y Open (5) perdieron la actualización del sistema de formas: el `style.css` actual define `--frame-*`, `--panel-*`, `--badge-*`, `--header-*`, pero su `style.default.css` es la versión antigua (sin ellos). Git lo confirma: los tokens llegaron en `5280eb6` sin regenerar los `.default`. **"Restaurar" elimina los tokens → degradación visual.** (Maker/`maker` y Cozy están correctos.)
  *Fix limpio:* regenerar los 15 `.default.*` desde los `style.css` actuales de fábrica + regla de proceso: cualquier cambio de tokens se acompaña de regenerar `.default`.
- **[A2][MEDIA] Plantilla de CSS de tema nuevo sin tokens.** `create_theme_service()` (theme_service.py ~143) y `init_themes_directory()` generan CSS solo con 9 variables de color → temas nuevos "planos" vs los de fábrica.
  *Fix:* una única plantilla CSS (colores + tokens) compartida por create/init/restore.
- **[A3][MEDIA] Defaults inconsistentes:** `load_theme_state()` → `"Maker_Theme_Pack"` (l.25) vs `get_all_packs_and_themes()` → `"Open_stream_Pack"` (l.192). *Fix:* una sola constante.
- **[A4][ALTA][Win/Mac] URLs con separadores del SO:** `theme_manager.py:248` usa `f".../overlays/{rel_path}"` (Path) → backslashes en Windows en `/api/themes/packs`. *Fix:* `rel_path.as_posix()` (+ test anti-backslash).
- **[A5][MEDIA][Win/Mac] Symlink de compatibilidad** en `create_theme_service()` (l.112-116): en Windows requiere privilegios y falla en silencio. *Fix:* eliminar el symlink; `get_theme_dir()` ya resuelve `styles/`.
- **[A6][MEDIA] `sync_common_themes_css()` se ejecuta en cada GET** de packs (vía `init_themes_directory()` dentro de `get_all_packs_and_themes()`) → reescribe `common/themes.css` en cada petición (visible en el log del servidor). *Fix:* sincronizar solo en escrituras y al arranque.
- **[A7][MEDIA] Heurística de arquetipo duplicada y divergente:** `infer_archetype()` (py) vs `getThemeArchetype()` (js) con listas distintas (js añade `warm`; py añade `taller`, `workbench`; js tiene lista positiva `openstream`). *Fix:* fuente única servida por API.
- **[A8][MEDIA] `apply_theme_service()` usa la heurística por nombre:** `emerald_matrix`→gamer (por "matrix"), `chill`→cozy (aunque es de Maker), `synthwave`→openstream. El broadcast puede llevar un arquetipo contrario al del pack. *Fix:* usar el `archetype` del pack/tema (dato), no el nombre.
- **[A9][MEDIA] Mapeo forma→arquetipo triplicado:** `SHAPE_TO_ARCHETYPE` (theme_service.py), `SHAPE_ARCHETYPE_MAP` (overlay.js) y `shapes[].archetype` (pack.json). *Fix:* un único `shapes.json` servido por API.
- **[A10][ALTA] Sin validación de ids** en `set_overlay_theme_service`, `apply_theme_service` y batch de fusiones: cualquier string se persiste; una escena con `data-theme` inexistente queda sin estilo. Origen de las claves basura del estado.
- **[A11][MEDIA] Estado con claves huérfanas:** `themes_state.json` contiene `overlayThemes["starting"]="ambient"` (tema y escena inexistentes), `overlayShapes["starting"]="fantasy_parchment"`, y claves `maker`/`print` (sin escena asociada) en los mapas por defecto (py y js). *Fix:* migración de limpieza + no persistir claves desconocidas.
- **[A12][MEDIA] Sin migración de estado** al renombrar/eliminar escenas o temas.
- **[A13][MEDIA] Token local solo protege POST:** `DELETE /api/fusions/{id}` (único DELETE) queda sin `X-Local-Token`. *Fix:* cubrir POST/PUT/DELETE/PATCH en el middleware.
- **[A14][BAJA] Restaurar tema no re-sincroniza el chat anclado** (`restore_theme_service`).
- **[A15][BAJA] Fallback de restore** solo funciona para el pack Maker (packId fijo en DEFAULT_THEMES_DATA).
- **[A16][BAJA] Semántica de chat inconsistente:** derivado usa `accentOrange` para borde; `sync_chat_with_theme` usa `accentCyan`.
- **[A17][MEDIA] Fusiones sin validación:** `create_or_update_fusion` no valida escenas; los batch no validan tema/forma. `fusions.json` contiene una fusión de prueba (`test_audit_fusion_shape`).
- **[A18][BAJA] `DEFAULT_PACK_TALLER` desincronizado** (v1.0.0, badge "PACK MAKER") vs pack.json real (v2.0.0, "CAD & WORKBENCH").

## 2. Panel — frontend

- **[B1][ALTA] `openOverlayFullscreen('key')` con 1 argumento** en `13-fusions.js:241` vs definición `(sceneKey, scenePath)` en `10-overlay-actions.js:102` → el botón "👁️ Probar" de la vista de Fusión abre `undefined?theme=…`.
- **[B2][MEDIA] `obsSource` hardcodeado `http://localhost:8080` ×27** en `05-scenes-data.js` (mientras `copySceneUrl` usa `location.origin`) → inconsistente y frágil ante cambio de puerto.
- **[B3][BAJA] Contadores hardcodeados:** "todas las 9 escenas" (06-scene-helpers.js:167), "27" (02-packs.js:369,400; 09-overlay-folders-render.js:280) sin i18n.
- **[B4][MEDIA] Cuádruple fuente de verdad de escenas:** `data-scene` (HTML) + `detectCurrentSceneKey()` (overlay.js, cadena de ifs) + `OSS_SCENES` (panel) + `DEFAULT_OVERLAY_THEMES` (py+js).
- **[B5][BAJA] `getThemeObjectById()` devuelve datos de 'maker'** para cualquier id desconocido (silencioso).
- **[B6][BAJA] Editor de tema no expone `panelBg/textDim`** (solo editables por CSS) — coherente con el payload de guardado; documentar.
- **[B7][BAJA] `adaptAtmosphereForArchetype`** reescribe textos por coincidencia de strings (frágil).
- **[B8][BAJA] `overlays-btn-back-folders` referenciado pero no existe en panel.html** (botón "atrás" inoperante). [T2]

## 3. Packs y escenas — datos y convenciones

- **[C1][MEDIA] Convención `data-scene` inconsistente:** Maker usa `camelCase`/kebab sin prefijo (`startingSoon`, `beRightBack`, `maker-desk`); Gamer/Open/Cozy usan `snake_case` con prefijo (`gamer_starting`, `oss_starting`, `cozy_starting`).
- **[C2][BAJA] Maker anida escenas** (`maker/desk`, `print/machine`) y el resto son planas; el panel muestra el nombre de carpeta (`desk`) mientras los docs usan la clave (`maker-desk`).
- **[C3][MEDIA] `components.css` solo lo cargan las 9 escenas Maker** (0 del resto) — decidir: común a todos o exclusivo Maker (y limpiar duplicaciones).
- **[C4][MEDIA] Contrato `data-oss-*` incompleto estáticamente** en 18/27 escenas (los screens Cozy, 1/6). El auto-tagging runtime mitiga para clases conocidas; verificar caso a caso.
- **[C5][MEDIA] Fuente `Cinzel` no empaquetada** (usada por `fantasy_parchment`, `fantasy_runic_stone`, `gothic_vampire`) → cae a Georgia en equipos sin ella. *Fix:* añadir woff2 o cambiar a una fuente bundled.
- **[C6][BAJA] Estilo `maker` sin tokens** (0/9) — decidir si es la base intencional y documentarlo.
- **[C7][BAJA] 46 claves de texto definidas sin uso.**
- **[C8][ALTA] FPS contradictorio en `gameplay_hud`:** "FPS: 240" vs "FPS: 60 · 1920×1080" y "1080p 60FPS". **Resuelto:** telemetría a 60 FPS.
- **[C9][BAJA] `data-theme` hardcodeado por escena** (flash antes de aplicar estado del servidor).
- **[C10][BAJA] Categoría `screen` vs `screens`** inconsistente en `07-overlay-folders-data.js`. [T2]

## 4. Visual (renderizado real, 1920×1080, HUD de editor desactivado)


#


- **[D1] Escenas runtime-limpio:** con el servidor en marcha, las 27 cargan sin errores JS, sin excepciones y sin fallos de red (probe CDP + barrido bugy). Fuentes woff2 200 OK.
- **[D2] gamer_gameplay:** FPS 240 vs 60 (C8) — detectado visualmente y confirmado en código.
- **[D3] maker_desk:** contraste bajo del subtítulo; texto `SUPER ESTACION MAKER 2026` pegado al borde del contenedor; brackets de esquinas inferiores menos definidos que los superiores. (El supuesto "02 MONTAGE" fue un error de OCR de la revisión visual: el código dice "02 MONTAJE" en todas partes.)
- **[D4] cozy_art_dual_cam:** la "barra truncada" reportada por el análisis visual es **por diseño** (la paleta vive dentro de la columna de lienzo, `.tools-palette-bar`); no requiere acción. Contraste bajo en la insignia "LIENZO CREATIVO · ILUSTRACIÓN" (mejorable).
- **[D5] /favicon.ico → 404** en el servidor real (navegadores lo piden siempre). *Fix trivial:* ruta favicon o `<link rel="icon">`.
- **Anexo:** capturas en `docs/audit-visual/` (16 PNG) y análisis en [`ANEXO_VISUAL_16.md`](ANEXO_VISUAL_16.md).

## 5. Windows / macOS

**Windows**
- **[E1][CRÍTICO] Crash silencioso al arrancar:** `server.py` imprime emojis y el launcher lo lanza con `stdout=PIPE` sin encoding (`server_ctl.py:88-97`) → en Windows (≤3.14, tubería cp1252) `UnicodeEncodeError` al arrancar; con `pythonw` el usuario no ve nada. *Fix:* `sys.stdout.reconfigure(encoding='utf-8', errors='replace')` + `PYTHONIOENCODING=utf-8` en el env del Popen.
- **[E2][ALTO] Log del launcher muerto:** `Popen(text=True)` sin encoding + `except: pass` en `_read_output` → UnicodeDecodeError silenciado. *Fix:* `encoding='utf-8', errors='replace'` + log del fallo.
- **[E3][ALTO]** Symlink de tema (ver A5). **[E4][ALTO]** URLs con `str(Path)` (ver A4).
- **[E7][MEDIO] Contención de rutas con `/`** en `media_routes.py:82` nunca coincide en Windows (rechaza subidas legítimas); `media_service.py:44` sin separador acepta hermanos. *Fix:* usar solo `Path.is_relative_to`.
- **[E8][MEDIO] Nombres de archivo sin sanear** (caracteres prohibidos/reservados, puntos finales) + `open()` fuera del try → 500 crudo. *Fix:* `sanitize_filename()` + 400.
- **[E11][MEDIO] `Windows/install.bat` sin comprobación de errores** → "INSTALACION COMPLETADA" falso. *Fix:* `py -3` + checks + pause/exit.
- **[E12][MEDIO] Lanzador `.bat` con `pythonw` sin log** → fallos invisibles. *Fix:* log + errorlevel + comillas.
- **[E18-E21][BAJO]** git sin encoding (rutas con acentos), `.bat` con no-ASCII, sin accesos directos, SIGTERM no entregable (usar SIGBREAK/GracefulExit).
- **[E13][MEDIO][Todas] `:8080` hardcodeado ~95 veces** (JS, decks, launcher, i18n). *Fix:* fuente única + preflight de puerto.

**macOS**
- **[E5][ALTO] Bandeja en hilo secundario:** `tray.py:174` usa `icon.run` en thread; pystray requiere `run_detached()` en macOS. *Fix:* `run_detached` en darwin o `is_available()=False`.
- **[E6][ALTO] `pystray` sin `pyobjc`** en `requirements.txt` → la bandeja nunca existe en macOS. *Fix:* marcadores `sys_platform` + `pyobjc-framework-Cocoa/Quartz`.
- **[E9][MEDIO] `fuser -k` y `/proc/{pid}` no existen en macOS** (`server_ctl.py:201,179`) → puerto huérfano. *Fix:* `lsof -ti` + `os.kill(pid, 0)`.
- **[E10][MEDIO] Gatekeeper + preflight ausente** en `Mac/install.command` (cuarentena de `.command`, falta check de `tkinter`/Python ≥3.10).
- **[E14][MEDIO][Todas] `webbrowser.open` devuelve `False` (no lanza)** → el fallback `os.startfile`/`open`/`xdg-open` nunca corre. *Fix:* helper `open_url()` que comprueba el retorno.
- **[E15][MEDIO] Menú de bandeja "Overlay de Chat" → `/chat/` 404** (real: `/widgets/chat/index.html`).
- **[E17][MEDIO] CI verde engañoso:** no instala `requirements.txt` ni arranca el servidor. *Fix:* job de arranque por SO + checks de `.command`/URLs de docs.
- **[E22-E23][BAJO]** `OVERLAYS_DIR` inexistente en gui.py; scripts cloudflare/vps solo-Linux sin aviso.

## 6. Documentación (corregida en esta auditoría)

Se corrigieron **24 archivos** (diff `+90/-91` aprox.). Errores principales corregidos:
- URLs con guiones bajos que daban 404 (`maker_desk`, `maker_pc`, `print_machine`, `print_design`) en READMEs y OBS_SETUP (ES/EN) → rutas anidadas reales.
- Filas "Coffee Break" para Maker/Open/Gamer en OBS_SETUP → "Be Right Back" (`screens/be-right-back/`).
- `themes/<pack>/<theme>/` → `app/streamthemes/<pack>/styles/<tema>/` (READMEs, CONVENTIONS, GUÍA CREAR, GUÍA DESARROLLO, SPECIFICATIONS).
- `pack_open_stream_suite` (ID fantasma) → IDs reales; tutorial de escenas nuevas (`scenes/entrevista/` → `streamthemes/<Pack>/overlays/…`); "Archivo local" eliminado como opción recomendada.
- `alerts/js/themes.js` (no existe) → `alerts/js/themes/01-state.js`; "9 escenas" → 29 asignaciones; IDs de decks (`maker_electronico`, `cyberpunk_neon`) → `maker`, `cyberpunk`; "20 temas" → 21; preset `theme-scifi` inexistente → lista real (15 presets); iconos 72×72 → 144×144; badge v1.0.0 → v1.0.1-alpha; catálogo `/index.html` → panel; contrato `data-oss-badge` añadido; `?lang=` marcado como "reservado (solo API)"; Fusiones añadidas al mapa de arquitectura; notas de clave-de-escena vs ruta-de-carpeta.
- **Resuelto:** política en [`I18N_POLICY.md`](I18N_POLICY.md); las guías largas están marcadas como *abridged* y enlazan al original español.

## 7. Runtime (barrido de las 27 escenas)


La tarea indicaba que el servidor del usuario estaba corriendo en `http://localhost:8080`. **Al empezar el barrido ese servidor ya estaba caído**, y no lo maté yo:

- `curl http://localhost:8080/` → exit 7 (connection refused) ya en la primera prueba.
- `/tmp/oss_server.log` (log del launcher) muestra un arranque fallido a las **06:59** con `OSError: [Errno 98] error while attempting to bind on address ('127.0.0.1', 8080): address already in use` → hubo dos intentos de arranque simultáneos; el proceso original desapareció después y no hay ningún `server.py` vivo (`ps aux` sin resultados, `ss -ltnp` sin :8080).
- `app/server.log` (log antiguo del propio servidor) también está congelado en `oct 20 20:52`.

Para no interferir con el servidor del usuario ni con el repo, levanté una **réplica READ-ONLY propia en `127.0.0.1:8099`** (`readonly_server.py`) que:
- sirve los mismos estáticos (`/streamthemes/`, `/common/`, `/overlays/`, `/languages/`, `/config.js`, `/assets/`),
- expone `/api/themes/packs` y `/api/overlays/texts` con los mismos módulos del repo (`server/services/theme_manager.py`, `server/services/overlay_service.py`),
- **neutraliza toda escritura**: `init_themes_directory()` y `sync_common_themes_css()` están monkey-patcheados a no-op (el original escribe `pack.json`, `theme.json`, `style.css` y `common/themes.css`).

**Verificado**: al terminar el barrido, `git status --porcelain` **no muestra ningún cambio en `.js`, `.css`, `.json` ni `.html`** — la réplica no escribió nada en el repo. (Aparecen ficheros `.md` modificados a las 07:14–07:20, p. ej. `app/CONVENTIONS.md`, `app/docs/*`, `plugins/README.md`: son **documentación de arquitectura escrita por otro agente en paralelo**, no por esta tarea. El `git status` estaba vacío al iniciar esta tarea a las 07:04.)

> ⚠️ **Por verificar**: los resultados de red (404) provienen de la réplica :8099. Las rutas y el contenido servido son los mismos que en :8080, pero el `favicon.ico` (bug B5) podría diferir si el servidor real lo sirve por otra vía — no lo sirve: no hay ruta ni fichero `favicon.ico` en el repo (`app/assets/favicon.{svg,png}` sí existen, pero las escenas no los declaran).

#


- 0 excepciones JS · 0 errores/warnings de consola · 0 fallos de red relevantes (favicon aparte) en el barrido contra réplica read-only.
- `ids_report.json`: ninguna referencia `getElementById` inline rota en las escenas revisadas.
- Los "failed_requests" de un primer barrido provinieron del servidor :8080 caído (causa no determinada; el log no lo cubre). El servidor fue restaurado durante la auditoría (200 OK).

## 8. Plan de arreglo recomendado (sin parches superpuestos)

**Fase 1 — Datos y estado (bajo riesgo, alto valor)**
1. Regenerar los 15 `style.default.css` (A1) y unificar la plantilla CSS de create/init/restore (A2).
2. Limpiar `themes_state.json` (A11) + migración de claves al cargar (A12).
3. Quitar la fusión de prueba de `fusions.json` (A17).
4. Corregir FPS de `gameplay_hud` (C8) y añadir `Cinzel` o sustituto (C5).

**Fase 2 — Fuente única de verdad (refactor limpio)**
5. `scenes.json` + `shapes.json` + `themes.json` servidos por API (A7-A9, B4, B2, C1): el panel, `overlay.js` y el backend consumen lo mismo. Normalizar claves de escena (C1).
6. Migrar `detectCurrentSceneKey`/`OSS_SCENES`/`DEFAULT_OVERLAY_THEMES` a esa fuente.

**Fase 3 — Validación y seguridad**
7. Validar ids contra catálogo en todos los endpoints (A10, A17) y token en todos los métodos mutantes (A13).
8. `handle_language` con regex (H8); contención de rutas con `is_relative_to` (E7); `sanitize_filename` (E8).

**Fase 4 — Cross-platform**
9. Encoding UTF-8 en fronteras (E1, E2, E18) y `as_posix()` en URLs (A4); eliminar symlink (A5/E3).
10. Bandeja macOS (`run_detached` + pyobjc) (E5, E6); `_free_port` multiplataforma (E9); `open_url` único (E14).
11. Instaladores con checks de error/versión + Gatekeeper (E10, E11); CI que arranque el servidor (E17).

**Fase 5 — Pulido de panel/UX**
12. `openOverlayFullscreen` 2 args (B1); restaurar textos de carpeta (H2); contadores dinámicos (B3); escritura atómica de textos (H4).

**Fase 6 — Proceso**
13. Regla de mantenimiento: cambios de tokens → regenerar `.default.*`; cambios de escenas/temas → actualizar `scenes.json` y docs (y tests de URLs de docs).

---

*Informe generado durante la auditoría del 2026-10-23. Cada hallazgo crítico fue verificado contra el código o el servidor real; los no verificables quedaron marcados. Capturas y evidencias: `docs/audit-visual/` (16 PNG 1920×1080) y [`ANEXO_VISUAL_16.md`](ANEXO_VISUAL_16.md).*
