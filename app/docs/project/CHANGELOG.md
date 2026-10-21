# Historial de cambios

<p align="center">
  <b>Español</b> | <a href="CHANGELOG.en.md">English</a>
</p>

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [Sin versión] — 2026-10-21

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
