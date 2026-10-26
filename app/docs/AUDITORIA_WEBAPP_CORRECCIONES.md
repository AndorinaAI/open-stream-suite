# Correcciones de la auditoría de la webapp — 2026-10-24

> **Revisión posterior (V2, 2026-10-24):** la verificación independiente encontró
> regresiones y cierres parciales; el plan `docs/TAREAS_PRIORIZADAS.md` los cerró
> (T01–T17) y `docs/AUDITORIA_WEBAPP_V2.md` conserva la tabla final y la evidencia.

> Este documento es el registro de ejecución de las correcciones de
> `AUDITORIA_WEBAPP_COMPLETA.md`. No sustituye a la evidencia original: cada
> cambio se ha probado contra el servidor real, los tests y el navegador.
>
> Estado final de la suite: **181 tests en 17 suites, todos OK**. Los archivos
> de estado del usuario se restauran byte a byte al terminar los tests
> (`themes_state.json`, `fusions.json`, `config.js`, `overlay_texts_config.json`,
> `alerts_config.json`, `alerts_themes_config.json`, `widgets_config.json`).

## Resumen

| ID | Estado | Corrección nativa | Verificación |
|---|---|---|---|
| W01 | Corregido | `server/security.py`: origen exacto (host/puerto), no `startswith` | `curl` `localhost.evil.com` → 403; origen local → 200 |
| W02 | Corregido | `ws_routes.py` + `security.is_websocket_allowed`: Origin exacto o token local | WS sin token/origen → 403; origen local y token → 101 |
| W03 | Corregido | Validación pack/tema en ruta y `get_theme_dir()` con containment | `chat-anchor` traversal → 400; sin escritura fuera |
| W04 | Corregido | `is_valid_widget_key()` y prevalidación antes de escribir | `/api/widgets/config` traversal → 400; archivo externo no creado |
| W05 | Corregido | `04-preview-feed.js` usa `textContent` y listeners, no `innerHTML` | `<img onerror>` simulado: `window.__xss` ausente |
| W06 | Corregido | imports/valores en `timer/chat/ticker/goal`; fallback 400 | timer/chat spotlight/ticker/goal → 200; desconocida → 400 |
| W07 | Corregido | GET solo lecturas; mutaciones exigen POST con token | GET `chat/clear` → 403; `chat/get_recent` → 200 |
| W08 | Corregido | Firmas/secrets Ko-fi/BMC/PayPal; `/api/webhooks/tip` exige token | tip sin token → 403; remoto sin secret → 403; tests |
| W09 | Corregido | OAuth `state` criptográfico, TTL, consumo único y limpieza | `/auth` 302 con `state=`; callback sin state → 400 |
| W10 | Corregido | `url_safety.py`: resolución DNS, bloqueo de privados, redirects y 2 MB | `127.0.0.1:8099` → 400; no SSRF |
| W11 | Corregido | Deck usa `apply_theme_service()` y validación; activa `globalThemeActive` | deck válido → 200/global true; traversal → 404 |
| W12 | Corregido | `GET /api/twitch/channel` + sync explícito | endpoint ya no es 404; sin Twitch → 400 JSON |
| W13 | Corregido | `STRUCTURAL_THEME_TOKENS` en CSS por defecto y en CSS guardado | tema creado: 4/4 grupos de tokens |
| W14 | Corregido | Snapshots de estado/config en suites que escriben | suite completa deja hashes idénticos al baseline |
| W15 | Corregido | Token/túnel enmascarados en GET; `0600`; escritura atómica | test de máscara; `.env`/`donations_config.json` 600 |
| W16 | Corregido | `sidebar-obs-active` dinámico desde `OSS_SCENES`; i18n sin “9” | panel: `OBS STUDIO · 27 ESCENAS ACTIVAS` |
| W17 | Corregido | Claves `fusions.*`, `goal_btn_*` y `rewards.selected` en ES/EN | comprobación de diccionarios: 7/7 presentes |
| W18 | Corregido | `atomic_write_json` + locks en widgets, alertas, roles, donaciones, temas | tests y escrituras concurrentes; sin JSON truncado |
| W19 | Corregido | Parseo JSON con 400 JSON en widgets/acciones/roles/alertas | payload `{bad` → 400 JSON en 5 endpoints |
| W20 | Corregido | Límite `MAX_UPLOAD_MB`, `.part` + rename, validación de carpeta | test de límite → 413; sin archivo parcial |
| W21 | Corregido | Escrituras atómicas + validación de CSS (tamaño, NUL, `@import`) | tema creado/guardado con CSS válido |
| W22 | Corregido | `/api/theme` valida y aplica; `/api/sound` valida URL/volumen | tema desconocido → 400; sonido inválido → 400 |
| W23 | Corregido | `escapeHtml`/`textContent` en chat, rewards, roles, triggers, DOM y media | `node --check`; payload HTML no ejecuta |
| W24 | Corregido | `tests/test_webapp_audit_fixes.py` (25 tests) + cobertura CORS/WS/SSRF/acciones | suite nueva OK |
| W25 | Corregido | Ruta `/favicon.ico` nativa a `assets/favicon.png` | 200 `image/png`; sin 404 en 62 páginas |
| W26 | Limitación del navegador | Chrome exige gesto para `AudioContext`; no se fuerza autoplay; OBS mantiene su política | barrido: solo avisos de autoplay, 0 excepciones |
| W27 | Corregido (parcial) | Eliminado duplicado `widgets-core/07-shortcuts.js`; forwarders se conservan como API compatible | `node --check`; sin referencias al duplicado |
| W28 | Corregido (parcial) | Eliminadas entradas públicas muertas; `/api/sound` y `/api/tips/recent` se mantienen como API externa | `test_smoke` OK |
| W29 | Corregido | URLs de panel/widgets/WS y launcher derivadas de `location`/`SERVER_PORT` | panel y launcher usan host real |
| W30 | Corregido | `GET /api/widgets/config` ya no hace sync ni red; sync va a `/api/twitch/channel` | test y lectura de endpoint |
| W31 | Corregido | `updates/check` en `asyncio.to_thread` y solo local | test_updater/smoke OK |
| W32 | Corregido | `add_static` sin `follow_symlinks`; 62 páginas OK | barrido de páginas sin 404 |

## Archivos principales tocados

- `server/security.py` (nuevo): origen exacto, túnel, token WS.
- `server/routes/ws_routes.py`, `server/app.py`: autenticación WS y CORS.
- `server/services/theme_manager.py`, `theme_service.py`: containment, tokens, atomicidad, CSS.
- `server/services/widgets_service.py`, `widgets_actions.py`, `actions/*`: validación y acciones.
- `server/routes/webhooks_routes.py`, `auth_routes.py`, `deck_routes.py`,
  `widgets_routes.py`, `media_routes.py`, `actions_routes.py`, `updates_routes.py`.
- `server/services/url_safety.py` (nuevo): antí-SSRF.
- `widgets/chat/panel/04-preview-feed.js`, `alerts/js/rewards`, `roles`, `triggers`,
  `media`, `common/overlay/dom-injector.js`: XSS.
- `alerts/panel.html`, `alerts/js/main.js`, `languages/*.json`: contadores/i18n.
- `tests/test_webapp_audit_fixes.py` y snapshots de aislamiento.

## Comandos de verificación

```bash
# 181 tests
cd app && for t in tests/test_*.py; do venv/bin/python -m unittest "$t" || exit 1; done

# sintaxis
venv/bin/python -m py_compile server/*.py server/services/*.py server/routes/*.py \
  server/services/actions/*.py tests/*.py
find common alerts widgets launcher -name '*.js' -type f -exec node --check {} \;

# API/seguridad
curl -H 'Origin: http://localhost.evil.com' -i localhost:8080/api/local-token   # 403
curl -H 'Origin: http://localhost:8080'  -i localhost:8080/api/local-token      # 200
curl -X POST localhost:8080/api/widgets/action -d '...'                         # 403 sin token
curl 'localhost:8080/api/rss/feed?url=http://127.0.0.1:8099/x'                 # 400
```

## Estado del usuario

Al finalizar se restauraron los archivos de estado desde el baseline previo a
las pruebas. Cualquier test nuevo que escriba estado debe restaurarlo en su
`tearDown`; la suite actual lo verifica comparando hashes.
