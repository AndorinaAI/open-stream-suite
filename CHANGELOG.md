# Historial de cambios

<p align="center">
  <a href="CHANGELOG.en.md"><b>English</b></a> | <b>Español</b>
</p>

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.2-alpha] — 2026-10-26

Ronda completa de auditoría (**V2 + V3**), motor de formas físicas para widgets y alertas, integración nativa de temas, licencia dual AGPL/comercial, arranque sin CDN de Google Fonts e i18n al día. Detalle de los hallazgos cerrados: `app/docs/AUDITORIA_WEBAPP_V3.md` y `app/docs/TAREAS_PRIORIZADAS_V3.md`.

### Corregido — Escenas en inglés (`?lang=`)

- El parámetro `?lang=en` de una escena ya llega de verdad a los textos: `common/overlay.js` pide `/api/overlays/texts?lang=…` (antes lo pedía sin idioma, así que la escena seguía en español) y toma el idioma de `?lang=` o del elegido en el panel (`oss-lang`). Un evento `overlay_texts_update` en vivo ya no revierte una escena en inglés (vuelve a pedir sus textos en su idioma).
- **Regresión**: nueva suite `tests/test_overlay_lang_param.py` (4 tests: ES/EN por API, idioma desconocido → por defecto, y contrato del cliente).

### Limpieza — Referencia muerta del panel (V3-07)

- Eliminada la consulta a `overlays-btn-back-folders` en `09-overlay-folders-render.js`: el id no existe y el botón real («⬅️ Volver a Carpetas») vive dentro de `overlays-folder-details-view`, por lo que se oculta con el contenedor sin lógica extra.
- **Regresión**: nueva suite `tests/test_panel_dead_refs.py` (2 tests: ninguna referencia **de código** al id muerto —ignora comentarios— y el botón dentro del contenedor de detalles).

### Corregido — Errores internos sin filtrar y JSON malformado (V3-05, V3-08)

- **V3-05 (sin filtrar detalles internos)**: nuevo módulo `server/routes/errors.py` con `internal_error_response()` / `internal_error_text()` / `invalid_json_response()`. Las **12 respuestas 500** que devolvían `str(e)` (fusions ×4, rewards ×3, webhooks ×4, themes ×1) registran ahora el detalle en el log y responden **“Error interno del servidor”**; en los webhooks públicos el mensaje ya no sale de la máquina. La consulta de recompensas sin Twitch también devuelve un mensaje genérico.
- **V3-08 (payload inválido)**: `await request.json()` protegido en recompensas (crear/actualizar/borrar), simulación de donaciones y webhooks de Ko-fi/BMC/PayPal → **400 “Payload JSON inválido”** en lugar de 500; el `cost` de una recompensa se valida (no numérico o `< 1` → 400). Se mantienen los patrones **tolerantes** legítimos de los endpoints de decks y updates (fallback a query params), que el test distingue explícitamente.
- **Regresión**: nuevas suites `tests/test_error_disclosure_contract.py` (3 tests, con análisis **AST** que exige que ninguna lectura de `request.json()` pueda acabar en 500) y `tests/test_json_payload_errors.py` (6 tests de runtime). Batería completa: **20 suites en verde**.

### Corregido — Accesibilidad de componentes y catálogo de temas de solo lectura (V3-02, V3-04)

- **V3-02 (accesibilidad)**: los tres `<select>` de cada componente (tema, forma y fusión) llevan `aria-label` con el nombre del componente, los botones Aplicar/Reset/➕ también, y se añade una **cabecera de columnas** visible (Componente · Tema · Forma · Aplicar · Reset · Fusión) con las nuevas claves i18n `widgets.col_*` en ES y EN.
- **V3-04 (lecturas sin escritura)**: `GET /api/themes/packs` ya **no reescribe** `common/themes.css`. El bootstrap de `streamthemes/` es idempotente (una vez por proceso) y la recompilación del CSS se decide por frescura (`themes_css_is_stale()`), así que añadir un tema a mano se sigue detectando sin escribir en cada petición. Medido: **3 GET → 0 recompilaciones** y `mtime` intacto (antes: 3 recompilaciones).
- **Regresión**: nuevas suites `tests/test_component_a11y.py` (4 tests) y `tests/test_themes_read_only.py` (5 tests).

### Corregido — Contadores de escenas reales (V3-03)

- Los textos del panel y las confirmaciones de lote ya no fijan un número de escenas: el subtítulo de la sección **pierde el “9”** (“cada una de tus pantallas de transmisión”) y las confirmaciones (`confirm_apply_all`, `confirm_restore_all_scenes_texts`, `confirm_restore_all_scenes_themes`) usan el parámetro **`{count}`** en los 4 diccionarios ES/EN.
- Los tres llamadores JS pasan `count: window.OSS_SCENES.length`, y el badge de escenas por carpeta ya no arranca con un “9” fijo. Se conservan (correctamente) las descripciones del pack Maker (“…con 9 pantallas listas”), que describen sus 9 escenas reales.
- **Regresión:** nueva suite `tests/test_i18n_scene_count.py` (4 tests).

### Cambiado — Licencia dual (AGPL-3.0 + comercial) y CLA obligatorio

- **La licencia pública pasa de CC BY-NC-SA 4.0 a GNU AGPL v3.0 o posterior**: el proyecto es ahora **software libre** (reconocido por OSI/FSF), por lo que puede distribuirse en repositorios y distribuciones que exigen licencias libres, sin ambigüedad sobre uso interno, SaaS o embebido.
- **Nueva licencia comercial de pago** (`LICENSE-COMMERCIAL.md`, ES/EN): permite a empresas y agencias usar, integrar o embeber el software **sin publicar su código** (marca blanca, servicio alojado, redistribución, soporte). Contacto: **admin@andorina.dev**.
- **CLA obligatorio para contribuciones** (`.github/CLA.md`, ES/EN): toda aportación cede al titular derechos suficientes para **relicenciar** el proyecto (base legal del modelo de doble licencia). Plantilla añadida a la plantilla de PR; un PR sin firma no se fusiona.
- **Política de marcas** (`TRADEMARK.md`): el nombre, el logo y la identidad visual no están cubiertos por ninguna de las dos licencias; la marca blanca requiere autorización.
- **Avisos de terceros** (`NOTICE.md`): las **15 familias tipográficas OFL** con su copyright y sus nombres reservados (Comfortaa, Orbitron, Press Start 2P, Quicksand, Share Tech Mono), los textos íntegros en `app/common/fonts/LICENSES/`, y las licencias de las dependencias de Python (incluidas `pystray` y `python-xlib`, LGPL).
- **Nota histórica:** las versiones publicadas antes del **2026-10-26** se distribuyeron bajo CC BY-NC-SA 4.0; las copias ya entregadas a terceros conservan esos términos.

### Corregido — Auditoría WebApp V3 (V3-01, V3-06)

- **XSS real en metadatos de temas, packs y fusiones (V3-01)**: `name`, `badge`, `desc` e `icon` se guardaban sin validar y se renderizaban con `innerHTML`, permitiendo ejecutar JavaScript en el mismo origen que `/api/local-token` (reproducido en la auditoría). Nuevo saneador `sanitize_metadata_text()` en `server/services/validation_utils.py` (rechaza `<`/`>`, elimina caracteres de control, colapsa espacios y limita longitud) aplicado en `create_pack_service`, `create_theme_service`, `save_theme_service` y `create_or_update_fusion` **antes** de escribir en disco; más escapado de todos los sinks del panel (`esc`, `themeEscapeHtml`, `themeJsArg`, `escapeHtml`).
- **Ids de fusión saneados (V3-06)**: el `id` recibido se valida con `_is_safe_fusion_id()` (bloquea comillas, paréntesis, `;`, `<`, `>` y espacios), los ids nuevos se generan como slug ASCII (antes podían contener acentos) y se serializan en el panel con `themeJsArg`/`themeEscapeHtml` (cinco `onclick` y un `id`).
- **Regresión**: nueva suite `tests/test_metadata_sanitization.py` (16 tests: saneador, integridad del catálogo de fábrica, rechazo en los tres servicios y contrato estático de escapado). Las 6 suites relacionadas (84 tests) en verde y hashes de `themes_state.json`, `fusions.json`, `config.js`, `overlay_texts_config.json` y `common/themes.css` idénticos.

### Corregido — Backlog de temas M1–M13 / L1–L8 (fases 1–5)
- **Fase 1:** catálogo de formas dinámico por pack; defaults de fusión validados; miembros desconocidos devuelven `warnings`/`unknown*`; `apply-shape` aplica por capacidad y reporta `skipped*`.
- **Fase 2:** contador real de 27 escenas, resumen de lote completo, caché solo tras confirmación de API, i18n de avisos y «selecciona tema o forma» sin llamada vacía.
- **Fase 3:** escrituras atómicas con locks, normalización persistente de estado huérfano, fuente única de `defaultOverlayThemes`, `activeShape: original` y esquema completo de fusiones.
- **Fase 4:** 14 tokens estructurales para `maker`, destino de formas en `gameplay_hud` y etiquetas legibles de las 9 formas genéricas.
- **Fase 5:** test del bloque de alertas en `renderStudio()` y E2E de un comando (`tests/e2e_theme_backlog.py` + `scripts/run_theme_e2e.sh`) con snapshot/restauración.

### Corregido — Auditoría de temas H1–H10
- Tema global persistente y coherente: `globalThemeActive` + `overlayThemeExplicit`; se aplica al arrancar en escenas/widgets/alertas sin asignación explícita.
- Las escenas explícitas ya no son pisadas por el tema global; el reset libera el global.
- El cambio global conserva la forma de los widgets; ya no la borra.
- Alertas `card`/`banner` aplican su propio tema al mostrarse (antes compartían el primero).
- `original` en widgets/alertas se normaliza a “sin forma”; API estricta para escenas desconocidas y formas globales.
- Temas nuevos generan `theme.default.json`/`style.default.css`; create/save validan pack y tema contra path traversal.

### Añadido — Alertas con formas físicas de todos los packs
- Las alertas `card`/`banner` aceptan las **20 formas físicas** de los packs además de las 9 genéricas (29 opciones en el panel).
- Se aplican de forma nativa reutilizando el CSS de escenas (`[data-oss-panel]` + `body[data-theme-shape]`), con reglas de panel añadidas para `cozy_polaroid`, `cozy_canvas` y `cozy_soft`.
- Funciona también desde fusiones (`apply-shape` aplica la forma física a las alertas miembro).

### Corregido — Chat integrado en escenas
- El chat de escena ahora embebe el widget real (`?embed=1`) dentro del panel y sincroniza su tema con el de la escena por `postMessage`.
- El interruptor **solo oculta los mensajes**: el marco, su tamaño y la cámara se mantienen; el hueco queda libre para el widget de OBS.

### Mejorado — Opciones de tema/forma en Alertas y Fusiones
- Pestaña **Alertas**: nuevo bloque «Temas de alertas» (card y banner) con tema, forma, aplicar, reset y añadir a fusión, dentro del layout real del Estudio de Alertas.
- Pestaña **Widgets**: el bloque queda como «Temas de widgets» (5 filas), separado del de alertas.
- **Fusiones**: modal con 21 estilos, 22 formas, 27 escenas, 5 widgets y 2 alertas; nombres legibles en los selectores de miembros.

### Corregido — Chat de escena y guardado de textos
- Interruptor de marco de chat ampliado a `cozy_cafe` y `oss_chatting` (ya existía en `chill`), con layout propio por escena y guardado en vivo.
- **Bug crítico**: guardar textos reemplazaba el archivo y borraba las secciones `cozy`, `oss`, `pomodoro`, `victory`, `art` y `speedrun`; ahora se hace merge profundo.

### Añadido — Formas para todos los widgets/alertas y banners tematizados
- Motor nativo `common/oss-shape.js`: 9 formas aplicables a cualquier widget y a `alert:card`/`alert:banner`, en vivo y con reset exacto.
- Catálogo y fusiones: `widgets/*` y `alerts/*` declaran las 9 formas; `apply-shape` en lote las aplica a escenas, widgets y alertas.
- Banners: con tema de pack se gobiernan por tokens (degradado, borde, sombra y textos); sin tema se mantienen los presets.

### Corregido — Integración nativa de temas en widgets y alertas
- **Forma en vivo**: `widget_theme_change` aplica tema y forma sin recargar; el reset limpia `data-theme-shape`.
- **Precedencia**: la asignación explícita de un widget/alerta ya no es pisada por el tema global.
- **UI**: bloque «Temas de componentes» (tema/forma/reset/añadir a fusión) y miembros de fusión con quitado.
- **Reset individual**: nuevo `POST /api/themes/reset-assignment`.
- **Convenciones**: boot único en `common/widget-theme.js`; presets de chat ceden ante temas de pack; más colores de texto/fondo tokenizados.

### Añadido — Fusiones con widgets y alertas de panel (integral nativo)
- Las fusiones agrupan **escenas + widgets + alertas**: `widgets[]` y `alerts[]` en `fusions.json`, validados contra `GET /api/components/catalog`.
- **Tema y forma** se aplican en lote a todos los miembros; las formas sólo van a widgets que las soportan (`chat`) y a escenas de pack.
- **Resets**: `POST /api/fusions/{id}/reset` (fusión completa) y `reset_overlay_assignment_service` (miembro suelto).
- **Consumo nativo**: `config.js` publica `overlayThemes`/`overlayShapes`; widgets y alertas los leen al arrancar y escuchan eventos dirigidos (`widget_theme_change` / `alert_theme_change`).
- **UI**: selección de widgets/alertas en el modal de fusión, contador de miembros y botón «Restaurar fusión».

### Añadido — Integración nativa de temas de pack en widgets y alertas
- **Widgets (6/6)**: aceptan `?theme=<id>` y `theme_change` por WebSocket; aplican `data-theme` en `<body>` y sus CSS consumen los tokens de `common/themes.css` con *fallback*, sin alterar el aspecto por defecto.
- **Alertas de panel**: el overlay aplica `?theme=`/`theme_change`; banners y `.alert-box` heredan `--color-accent-cyan`, `--color-panel-bg`, `--color-text-light` de forma nativa.
- **Convenciones** documentadas (ES/EN) para que nuevos widgets y alertas se integren sin conocer los existentes.
- **Tests** de contrato nativo: `tests/test_native_theming_contract.py` (12 pruebas; incluye verificación de que el CSS/JS base no cambió).

## [1.0.1-alpha] — 2026-10-23

### Corregido — Auditoría Arquitectónica y Correcciones Críticas
- **WebSocket del Servidor (NameError)**: Solucionado error crítico por variable `data` no inicializada en `app/server/routes/ws_routes.py`. Los mensajes recibidos vía WebSocket ahora se parsean de forma segura sin romper la conexión.
- **Persistencia de Temas y Asignaciones de Escenas**: `save_theme_state()` ahora fusiona de forma segura el estado persistido en `themes_state.json`, evitando el borrado accidental de asignaciones (`overlayThemes`, `overlayShapes` y `backdrops`) al aplicar packs o formas globales.
- **Autenticación en HUD de Overlays**: Añadida cabecera `X-Local-Token` en todas las peticiones POST de asignación de temas, formas y reseteo de textos desde el HUD (`04-phrases-theme.js` y `05-inline-editor.js`), resolviendo los errores 403 Forbidden silenciosos.
- **Acciones Rápidas en Panel de Control**: Implementadas y expuestas globalmente en `api.js` las funciones `sendAlertTest`, `sendCustomAlertTest` y `syncGoalWithTwitch`, evitando errores `ReferenceError` en consola.
- **Formas Físicas en Fusiones**: Guardado y persistencia en backend (`fusions_service.py`) de la forma física `defaultShape`, e incorporación del selector de forma en el modal de creación/edición de fusiones en `panel.html` y `13-fusions.js`.
- **Preservación de Forma en Vivo**: `overlay.js` preserva la forma física activa (`activeShape`) al recibir eventos WebSocket `theme_change` y `overlay_theme_change`, evitando que un cambio de color devuelva los marcos a `original`.
- **Apertura de Fondos y Recortes Persistentes (Backdrop)**: Creado endpoint `POST /api/themes/backdrop` y servicio de persistencia para el motor de fondos con apertura SVG `window.OSSAperture`, con sincronización en tiempo real vía WebSocket `overlay_backdrop_change`.
- **Aislamiento de Textos por Escena**: `collectSceneTexts` y `dom-injector.js` aíslan los textos personalizados no pertenecientes al pack base Maker bajo `customScenes[sceneKey]`, evitando colisiones cross-pack en claves compartidas (`beRightBack.title`, etc.).
- **Restauración Quirúrgica de Textos**: Corregido `restoreSceneTexts` y `OverlayTexts.reset` para enviar `sceneKey`, limpiando únicamente los textos de la escena elegida sin resetear todo el stream.
- **Activación de Tokens de Diseño**: Conectados los tokens `--theme-glow`, `--panel-radius` y `--panel-clip-path` en `common/styles.css` para su renderizado activo en cámaras y paneles en OBS.
- **Sincronización de overlay_texts_config.en.json**: Completadas las 18 claves en inglés ausentes y añadido soporte para servir textos en inglés según el parámetro `?lang=en`.
- **Corrección de Paletas en Cozy Lo-Fi Pack**: Sincronizados los valores de color (`accentCyan`, `accentOrange`, `bgDark`, `panelBg`, `textDim`, `textLight`) en `theme.json` y `theme.default.json` de los 5 temas de Cozy para reflejar su CSS real.
- **Limpieza de Defaults Legacy y Entradas Huérfanas**: Reemplazados defaults fantasma (`pack_open_stream_suite`, `maker_electronico`) por los identificadores oficiales (`Maker_Theme_Pack`, `maker`), y eliminadas claves huérfanas en `themes_state.json`.
- **Selector de Forma en Modal de Escena**: Incorporado selector de forma física en el modal individual de escenas en `panel.html` y enlazado con `11-scene-editor.js`.
- **Comprobación de Actualizaciones al Iniciar Servidor**: Al tener activa la opción de abrir el panel en el navegador al iniciar, el launcher consulta si existe una versión más reciente y ofrece un diálogo para actualizar en el acto o continuar abriendo el servidor y actualizar más tarde.
- **Iconos con Transparencia RGBA Nativa**: Re-renderizados todos los iconos PNG (32, 64, 128, 256 y 512px) con canal alfa completo (`RGBA`), eliminando las esquinas y bordes blancos que causaban apariencia de imagen JPG opaca en la bandeja y el sistema.
- **Integración con Barra de Tareas de Linux (Solución a Icono de Engranaje)**: Configurada la clase de ventana `StartupWMClass=openstreamsuite`, inicialización de Tkinter con `className="openstreamsuite"` y carga de iconos multirresolución persistentes en memoria, permitiendo a GNOME Shell, Ubuntu Dock y KDE mostrar el icono oficial de la app en la barra de tareas en lugar del icono genérico de engranaje.
- **Actualizador Resiliente (Git Reset & Config Preservation)**: Reescrito `apply_update()` en `updater.py` para respaldar y fusionar automáticamente configuraciones de usuario (`themes_state.json`, `fusions.json`, textos, widgets) y realizar una sincronización limpia con Git sin colisiones por archivos modificados o sin seguimiento.
- **Soporte Python 3.12**: Reemplazado `datetime.utcnow()` por `datetime.now(timezone.utc)`.

## [1.0.0-alpha] — 2026-10-21

### Cambiado — Refactorización Completa y Modularización por Dominios
- **Backend Modular (`app/server/`)**: Rutas desacopladas en `server/routes/` y lógica de negocio en `server/services/`, con shims transparentes de compatibilidad hacia atrás en `server/*.py`.
- **Overlay de Alertas (`app/alerts/`)**: `alerts/index.html` reducido a ~60 líneas con extracción de estilos a `css/alerts-widget.css` y motores dedicados en `js/overlay/` (audio, partículas, cola de alertas, WebSocket).
- **Widgets Desacoplados (`app/widgets/`)**: Cada widget ahora sigue una arquitectura limpia de dos capas con submódulos en `widgets/<widget>/panel/` (controles Mini-App) y `widgets/<widget>/js/` (runtime de OBS), manteniendo `panel.js` como forwarder autocargable.
- **Catálogo de Escenas (`app/index.html`)**: Separación limpia de `common/catalog.css` y `common/catalog.js` con observador reactivo de dimensiones.
- **Estructura y Scripts**: Scripts de despliegue y túneles centralizados en `app/scripts/` con wrappers automáticos en la raíz de `app/`.
- **Cero roturas**: 100% compatibilidad hacia atrás garantizada para OBS Studio, Stream Deck, Companion y navegadores.

### Añadido — Internacionalización (i18n) completa
- Traducción completa al inglés de todo el panel de control: encabezados, pestañas, botones, etiquetas, modales, desplegables, paneles emergentes (mini-apps de widgets), toasts y diálogos `alert()` / `confirm()`.
- Traducción dinámica en vivo: el DOM insertado por JavaScript (modales, listas renderizadas, opciones de select) se vuelve a traducir automáticamente al cambiar de idioma.
- Toasts y mensajes de error traducidos incluso cuando contienen variables (`${user}`, `{branch}`), mediante segmentación por marcadores.
- Los enlaces a las guías `.md` del panel apuntan automáticamente a su versión `.en.md` cuando el idioma activo es inglés (pares con nombres distintos incluidos: `INSTALACION_E_INICIO.md` ↔ `INSTALLATION_AND_STARTUP.md`).
- Documentación bilingüe: cada enlace a otro `.md` incluye su versión en inglés (`[English](….en.md)`) y cada `.en.md` su versión española.
- Lanzador de escritorio: guía de inicio, diálogos y mensajes de estado conectados al diccionario (`languages/es.json` / `languages/en.json`), con refresco al cambiar de idioma en caliente.
- Diccionario de traducción del panel ampliado de 378 a más de 1.650 pares español→inglés, verificado contra el DOM real (panel, mini-apps, modales, desplegables, toasts y diálogos).
- Los textos propios del usuario (títulos de triggers, descripciones de temas guardadas, presets) se respetan sin traducir: solo se traduce la interfaz.

## [1.0.0-alpha] — 2026-10-20

Primera versión alpha pública.

### Incluye
- Overlays y escenas para OBS Studio con temas modulares y packs (restauración de fábrica por tema).
- Widgets modulares: chat, metas, shoutout/promo, ticker y temporizador.
- Suite de alertas, triggers y recompensas con servidor local (aiohttp + WebSocket, Twitch EventSub e IRC).
- Panel de control web con guías de desarrollo y temas integradas.
- Integración con decks físicos: Ajazz AKP05 (10 teclas, pantalla táctil y 4 diales) y AKP153/03/846, Elgato Stream Deck, OpenDeck y Bitfocus Companion, con la API `/api/deck/*`.
- Aplicación de escritorio multiplataforma con bandeja del sistema (*tray*), dashboard, logs en vivo y gestión de Twitch.
- Instaladores automáticos (`installers/`) y lanzadores de un clic en la raíz para Linux, Windows y macOS.
- Sistema de comprobación de actualizaciones con selector de ramas (`main` o `dev`), avisos visuales en lanzador y panel web, y scripts `actualizar.sh` / `actualizar.bat`.
- Estructura del repositorio: `app/` (proyecto), `plugins/` (decks) e `imagencorp/` (identidad visual y capturas).

### Seguridad
- El servidor escucha por defecto solo en `127.0.0.1`. Abrirlo a la red requiere `SERVER_HOST` y se recomienda `DECK_TOKEN`.
- Los ficheros estáticos se sirven con lista blanca; la raíz de `app/` (con `.env`, `token.json` y `.local_token`) ya no es accesible por HTTP.
- `/api/deck/*` rechaza peticiones originadas por páginas web externas y admite `DECK_TOKEN` opcional.
- El token local del panel solo se entrega a peticiones desde el propio equipo (no a túneles ni a la red).

### Limitaciones conocidas
- Probado en Linux. Windows y macOS son **experimentales** (desarrollo según feedback comunitario).
- La licencia (CC BY-NC-SA 4.0) restringe el uso comercial y exige reciprocidad (ShareAlike); aplica con carácter retroactivo.
