# Historial de cambios

<p align="center">
  <a href="CHANGELOG.en.md"><b>English</b></a> | <b>Español</b>
</p>

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

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
