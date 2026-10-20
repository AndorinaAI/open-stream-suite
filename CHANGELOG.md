# Historial de cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

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
- Probado en Linux. Windows y macOS son **experimentales**.
- La licencia (PolyForm Noncommercial) restringe el uso comercial; no es una licencia de la OSI.
