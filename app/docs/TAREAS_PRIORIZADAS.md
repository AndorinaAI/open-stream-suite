# Tareas de corrección — orden de ejecución

> Basado en `docs/AUDITORIA_WEBAPP_V2.md`. Una tarea por ronda; cada una
> termina con pruebas y un `OK` antes de pasar a la siguiente.
> Las tareas cerradas se marcan `[HECHO]`; las pendientes `[ ]`.

## P0 — Seguridad de borde

### T01 — Origen exacto para CORS, token local y WebSocket (W01/W02/F01) [HECHO]

- **Archivos:** `server/security.py`, `tests/test_webapp_audit_fixes.py`.
- **Problema:** cualquier puerto de loopback (`localhost:9999`) recibía el token
  y abría `/ws`.
- **Criterio de aceptación:** solo `http://localhost:PORT`,
  `http://127.0.0.1:PORT`, `http://[::1]:PORT` y el `tunnelUrl` exacto.
  Otros puertos, `localhost` sin puerto, lookalikes y `null` → 403.
- **Verificación:** 27 tests de `test_webapp_audit_fixes` + 7 de
  `test_security`; probe real:
  `localhost:9999` 403, `localhost:8080` 200; WS 9999 bloqueado, 8080 aceptado.
- **Estado:** cerrado.

### T02 — SVG y nombres de medios (W20/F02/F12) [HECHO]

- **Archivos:** `server/services/media_service.py`,
  `server/routes/media_routes.py`, `alerts/js/media/02-render.js`,
  `alerts/js/media/05-preview-assign.js`.
- **Criterio:** SVG no ejecutable en el origen de la app; nombres/URLs escapados
  y construidos con DOM, no `innerHTML`; test de SVG y de nombre con caracteres
  especiales.
- **Verificación:** `test_webapp_audit_fixes` 29 OK, `test_media_explorer` +
  `test_security` 39 OK; SVG upload 400, SVG existente 404; payload de nombre
  malicioso renderizado como texto (0 ejecución); `node --check` OK.
- **Dependencias:** T01 (para probar uploads autenticados con origen correcto).

### T03 — XSS en metadatos de packs/temas (F03/W23) [HECHO]

- **Archivos:** `alerts/js/themes/02-packs.js`,
  `alerts/js/themes/06-scene-helpers.js`, `alerts/js/alerts-studio/02b-gallery-toast.js`,
  `server/services/theme_service.py`.
- **Criterio:** nombre/badge/descripción/colores escapados; colores validados;
  test con `<svg onload>` en pack/theme y en `buildThemeOptionsHtml`.
- **Verificación:** 68 tests OK (theme packs/contracts/backlog + webapp);
  inyección real en panel: 0 ejecuciones, 0 `<img>` crudos; API rechaza
  colores no `#RRGGBB` con 400; `node --check` en 5 módulos.
- **Dependencias:** T01.

### T04 — Exposición de docs, media y APIs de lectura por túnel (F04) [HECHO]

- **Archivos:** `server/routes/static_routes.py`, `server/app.py`.
- **Criterio:** `AUDITORIA_*` y documentación interna no servidas por
  `/docs/` (o solo local); `/api/media`, `/api/tips/recent` y `/media/` con
  política explícita para túnel; probar desde origen externo.
- **Verificación:** docs local 200 / proxy 404; `/api/media` local 200 / proxy
  403; `/api/tips/recent` local 200 / proxy 403; `/media/...png` local 200 /
  proxy 404; 38 tests OK; servidor 200.
- **Dependencias:** T01.

## P1 — Autenticación, integridad y funcionalidad

### T05 — `state` OAuth ligado a sesión (W09/F10) [HECHO]

- **Archivos:** `server/routes/auth_routes.py`.
- **Criterio:** nonce en cookie `HttpOnly`/`SameSite`; callback exige cookie y
  `state`; test de state robado/otra sesión.
- **Verificación:** `/auth` devuelve `Set-Cookie` HttpOnly/SameSite=Lax; callback
  sin cookie 400; state de otra sesión rechazado; state de un solo uso;
  36 tests de webapp OK; servidor 200.
- **Dependencias:** T01.

### T06 — Decks sin token por defecto (F11) [HECHO]

- **Archivos:** `server/config.py`, `server/app.py`, docs de decks.
- **Criterio:** si `SERVER_HOST` no es loopback o hay proxy, `DECK_TOKEN`
  obligatorio; `/api/deck/*` no mutante sin credencial; test de arranque.
- **Verificación:** local 200; proxy 403; cross-site 403; token configurado
  exige `X-Deck-Token`; 60 tests OK; servidor 200.
- **Dependencias:** T01.

### T07 — RSS del Ticker truncado (F05) [HECHO]

- **Archivo:** `server/routes/widgets_routes.py`.
- **Criterio:** leer hasta EOF antes de parsear; BBC/Ticker 200; test de feed
  chunked y límite de 2 MB.
- **Verificación:** BBC `/api/rss/feed` 200 con 24 items; helper lee múltiples
  chunks y rechaza >2 MB; 42 tests de webapp OK; servidor 200.
- **Dependencias:** ninguna.

### T08 — JSON malformado y errores 500 (W19/F06/F08) [HECHO]

- **Archivos:** `server/routes/themes_routes.py`,
  `server/routes/overlay_routes.py`, `server/routes/alerts_routes.py`,
  `server/routes/webhooks_routes.py`, `server/routes/triggers_routes.py`.
- **Criterio:** todo body inválido → 400 JSON; ningún default destructivo
  (`apply-shape`, `overlay reset`); no filtrar `str(e)`; tests de hash antes/después.
- **Verificación:** 7 endpoints devuelven 400 JSON; hashes de `themes_state`,
  `overlay_texts`, `triggers` y `donations_config` sin cambios; 44 tests OK.
- **Dependencias:** T01.

### T09 — Persistencia atómica de triggers y roles automáticos (W18/F07/F18) [HECHO]

- **Archivos:** `server/routes/triggers_routes.py`,
  `server/services/triggers_service.py`.
- **Criterio:** `lock_for` + `atomic_write_json`; esquema validado; GET robusto
  ante JSON corrupto; concurrent artist registration sin perder miembros.
- **Verificación:** `triggers.json` y `roles.json` se escriben con lock/atomic;
  modo 600; artista nuevo conserva miembros; suite completa 204 tests OK.
- **Dependencias:** T08.

### T10 — Configuración de donaciones: fallo silencioso y secretos (W15/F09/F16) [HECHO]

- **Archivos:** `server/services/donations_service.py`,
  `server/routes/webhooks_routes.py`.
- **Criterio:** `save_donations_config()` devuelve éxito/fallo; la ruta responde
  500 si falla; nunca devuelve token/secreto crudo; `tunnelUrl` enmascarado o
  solo local autenticado.
- **Verificación:** fallo de escritura → 500 genérico; GET solo local; token
  enmascarado; `tunnelUrl` solo local; 204 tests OK.
- **Dependencias:** T01.

### T11 — Aislamiento de la suite de tests (W14/W30/F14/F15) [HECHO]

- **Archivos:** `tests/test_smoke.py`, `tests/test_deck_integration.py`,
  utilidades de snapshot.
- **Criterio:** ningún test llama a `/api/auth/logout` real; snapshot/restore de
  `token.json` y `system.token_data`; `recent_tips` limpio en teardown; suite
  completa con hashes idénticos y servidor sin datos de prueba.
- **Verificación:** smoke 10 tests OK; `tips=[]`; no `token.json`; suite completa
  204 tests; hashes de estado idénticos.
- **Dependencias:** T10 (para el estado de donaciones).

## P2 — XSS restantes, permisos y documentación

### T12 — Interpolaciones de alertas y triggers (F13/W23) [HECHO]

- **Archivos:** `alerts/js/alerts-studio/02b-gallery-toast.js`,
  `alerts/js/triggers/02-editor-data.js`,
  `alerts/js/alerts-studio/06-preview-test.js`.
- **Criterio:** escapar nombre/descripción/color/posición; tests de payload.
- **Verificación:** CDP con packs/triggers/preview maliciosos: 0 ejecuciones,
  0 `<img>` crudos; `node --check`; 204 tests OK.
- **Dependencias:** T03.

### T13 — Medios: nombres y URLs en el DOM (F12/W23) [HECHO en T02]

- **Archivos:** `alerts/js/media/02-render.js`,
  `alerts/js/media/05-preview-assign.js`.
- **Criterio:** `createElement`/`setAttribute`; nombres escapados; test con
  comillas/entidades.
- **Estado:** absorbido por T02 (mismo archivo y misma verificación).

### T14 — Permisos de estado y logs (F18) [HECHO]

- **Archivos:** `roles.json`, `triggers.json`, `server.log`, creación de estado.
- **Criterio:** `0600` para datos de usuario y logs; test de modo.
- **Verificación:** `roles.json`, `triggers.json`, `donations_config.json`,
  `roles.private.bak.json`, `server.log` y `.local_token` en 600; 204 tests OK.
- **Dependencias:** T09.

### T15 — Documentación obsoleta y URL fija (W29/F17) [HECHO — nota de puerto]

- **Archivos:** `index.html`, `docs/*.md`, `README*`.
- **Criterio:** sin “9 escenas” ni puertos fijos en documentación activa; catálogo
  raíz o redirección sin enlaces muertos.
- **Estado:** raíz corregida a 27 escenas/20 formas; guías principales llevan
  nota de sustitución de `8080` por `SERVER_PORT`. Las URLs de ejemplo conservan
  el puerto por defecto de forma explícita.
- **Dependencias:** ninguna.

### T16 — Cierre de compatibilidad W27/W28 (baja) [HECHO]

- **Archivos:** forwarders JS, shims `server/*.py`, endpoints externos.
- **Criterio:** decidir y documentar qué se conserva como API pública; eliminar
  solo lo que no tenga consumidor ni contrato.
- **Estado:** política en `docs/COMPATIBILIDAD.md` y `.en.md`; shims y redirects
  se conservan como contrato, sin nuevos alias.
- **Dependencias:** ninguna.

### T17 — W26 audio (política del navegador) [HECHO]

- **Criterio:** no forzar autoplay; documentar la limitación y el
  comportamiento esperado en OBS; no añadir código que rompa audio.
- **Estado:** `docs/AUDIO_AUTOPLAY.md` y `.en.md`; sin hacks de autoplay.
- **Dependencias:** ninguna.
