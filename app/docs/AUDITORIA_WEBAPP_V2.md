# Auditoría webapp V2 — verificación de cierre y hallazgos nuevos

> **Fecha:** 2026-10-24
> **Alcance:** `app/` completo (35 HTML fuente, 62 URLs servidas, 162 JS, 98 PY).
> **Modo:** auditoría de solo lectura. Las sondas que escriben estado se hicieron
> con copia previa y se restauraron al terminar.
> **Servidor:** `http://localhost:8080` (no se reinició durante la auditoría).

> **Plan de ejecución:** `docs/TAREAS_PRIORIZADAS.md` (T01 ya cerrado).

## 0. Veredicto rápido

La suite de tests pasa (**204/204**, 17 suites), los 62 URLs responden y no hay
excepciones JS en el barrido. Los 32 hallazgos anteriores están cerrados o
aceptados; los únicos matices son la nota de puerto de T15 y la política de
autoplay de T17. El Ticker volvió a responder 200 con 24 items tras T07.

## 1. Verificación de los 32 hallazgos anteriores

| ID | Estado real | Evidencia / motivo |
|---|---|---|
| W01 | **Resuelto T01** | El puerto se compara con `PORT`; `localhost:9999` ahora 403 y `localhost:8080` 200. |
| W02 | **Resuelto T01** | `/ws` rechaza `localhost:9999` y acepta el puerto real; probado con cliente WebSocket. |
| W03 | Cerrado | Validación de pack/tema y containment; tests y sondas de traversal. |
| W04 | Cerrado | `is_valid_widget_key` + prevalidación; traversal devuelve 400. |
| W05 | Cerrado | Feed de chat con `textContent`; payload `<img onerror>` no ejecuta. |
| W06 | Cerrado | Acciones timer/chat/ticker/goal y fallback 400. |
| W07 | Cerrado | GET de acciones mutantes devuelve 403; solo lecturas permitidas. |
| W08 | Cerrado | Firma/secreto por proveedor; `/api/webhooks/tip` exige token. |
| W09 | **Resuelto T05** | `state` ligado a un nonce en cookie HttpOnly/SameSite=Lax; callback exige ambos y consume el state. |
| W10 | Cerrado (SSRF) | `url_safety.py` bloquea privados y valida redirects; el fallo RSS de §2 es distinto. |
| W11 | Cerrado | Deck valida y usa `apply_theme_service`; traversal 404. |
| W12 | Cerrado | `GET /api/twitch/channel` existe y devuelve 400 sin Twitch. |
| W13 | Cerrado | Tema nuevo incluye los 14 tokens estructurales; comprobado con creación real. |
| W14 | **Resuelto T11** | Smoke sin logout real ni tip ficticio; snapshot de token; suite 204 OK y `tips=[]`. |
| W15 | **Resuelto T10** | GET solo local, token/secrets enmascarados; POST falla con 500 genérico; `tunnelUrl` solo local. |
| W16 | Cerrado | Panel muestra `OBS STUDIO · 27 ESCENAS ACTIVAS`. |
| W17 | Cerrado | Paridad ES/EN y claves nuevas presentes. |
| W18 | **Resuelto T09** | `triggers.json` y `roles.json` usan lock + atomic; artista nuevo conserva miembros; modo 600. |
| W19 | **Resuelto T08** | Los endpoints de temas/overlays/alertas/donaciones/triggers devuelven 400 JSON; sin resets destructivos. |
| W20 | **Resuelto T02** | SVG rechazado en upload y bloqueado en `/media/`; límite y `.part` siguen funcionando. |
| W21 | Cerrado | Escrituras atómicas y validación de CSS. |
| W22 | Cerrado | `/api/theme` valida; `/api/sound` rechaza `javascript:`. |
| W23 | **Resuelto T03/T12** | Packs/temas, galería de alertas, triggers y preview escapan metadatos/colores; CDP 0 XSS. |
| W24 | Cerrado (cobertura) | 25 tests nuevos pasan; la suite total pasa. Faltan casos para los defectos nuevos. |
| W25 | Cerrado | `/favicon.ico` → 200 `image/png`. |
| W26 | **Resuelto T17** | Política de autoplay documentada en `AUDIO_AUTOPLAY`; sin hacks. |
| W27 | **Resuelto T16** | Política de compatibilidad documentada; shims/forwarders se conservan como contrato. |
| W28 | **Resuelto T16** | API externa conservada y documentada; sin nuevos alias ni endpoints duplicados. |
| W29 | **Resuelto T15 (nota)** | `index.html` a 27 escenas/20 formas; guías con nota de `SERVER_PORT`; ejemplos usan 8080 por defecto. |
| W30 | **Resuelto T11** | Smoke ya no envía tip autenticado; `tips=[]` después de la suite. |
| W31 | Cerrado | `asyncio.to_thread` y comprobación local en `check`. |
| W32 | Cerrado | Sin `follow_symlinks`; el barrido no muestra 404 de estáticos. |

## 2. Hallazgos nuevos

### F01 — CORS/WS aceptan cualquier puerto de loopback (Alta) — **Resuelto T01**

**Archivos:** `server/security.py:59-70`, `server/app.py:70-124`,
`server/security.py:90-102`.

`is_origin_allowed()` devuelve `True` para cualquier `host` de
`localhost/127.0.0.1/::1` sin comparar el puerto. Por tanto una página servida
por otro proceso local en `http://localhost:9999` puede leer `/api/local-token`
y abrir el WebSocket.

**Evidencia original (antes de T01):**

```text
Origin: http://localhost:9999      -> 200 {"status":"ok","token":"..."}
Origin: http://127.0.0.1:9999      -> 200 {"status":"ok","token":"..."}
WS Origin http://localhost:9999    -> 101 / aceptado
WS Origin http://localhost:8080    -> 101 / aceptado
Origin: http://localhost.evil.com  -> 403
```

**Evidencia posterior (T01):** `localhost:9999`, `127.0.0.1:9999` y
`localhost` → 403; `localhost:8080`/`127.0.0.1:8080` → 200; WS 9999 → 403.

**Impacto:** una página/instancia local no confiable puede obtener el token y
controlar overlays. El arreglo nativo es comparar también el puerto efectivo
con el del servidor (o con el origen del túnel) y no aceptar cualquier loopback.

### F02 — SVG subido se sirve como recurso del mismo origen (Alta) — **Resuelto T02**

**Archivos:** `server/services/media_service.py:5-13`,
`server/routes/media_routes.py:59-65`, `server/routes/static_routes.py:108`.

`.svg` está en `ALLOWED_MEDIA_EXTENSIONS` y `/media/` lo sirve con
`Content-Type: image/svg+xml`. Un SVG con `<script>` se ejecuta al abrirse
directamente y puede leer `/api/local-token` en el mismo origen.

**Evidencia original (antes de T02):**

```text
POST /api/upload (audit_probe.svg) -> 200
GET /media/images/audit_probe.svg  -> 200 image/svg+xml
<body><svg ...><script>alert(1)</script></svg>
```

**Evidencia T02:** upload SVG -> 400; SVG existente -> 404; `/api/media` no
lista `.svg`; el nombre malicioso se renderiza como texto.

El archivo de prueba se eliminó después. **Arreglo:** SVG rechazado en la lista de extensiones y bloqueado en `/media/`; los nombres se construyen con `textContent`/atributos escapados.

### F03 — XSS almacenado en metadatos de packs/temas (Alta) — **Resuelto T03**

**Archivos:** `alerts/js/themes/02-packs.js:116-136,260-277`,
`alerts/js/themes/06-scene-helpers.js:53-61`,
`alerts/js/alerts-studio/02b-gallery-toast.js:15-25`,
`server/services/theme_service.py:165-200`.

Los nombres, badges, descripciones y colores vienen de `pack.json`/`theme.json`
o del body de `POST /api/themes/create` y se interpolan directamente en
`innerHTML` y en atributos `style`/`onclick`. `accentCyan` no se valida.

**Evidencia:** se inyectó un pack falso en el panel y el HTML renderizado
contenía literalmente:

```html
<div><img src="x" onerror="window.__packxss=1"></div>
```

El mismo patrón existe en `buildThemeOptionsHtml`:
`<optgroup label="${p.name}">...${t.name}...`.

**Impacto:** un pack/tema importado o creado con nombre/color malicioso
ejecuta HTML/JS en el panel. **Arreglo:** `themeEscapeHtml`/`themeJsArg` en los renders, `themeColor` para swatches y validación `#RRGGBB` + glow 0–100 en `theme_service`. Verificado con inyección en panel y API 400.

### F04 — Documentación interna y datos estáticos quedan públicos si se usa túnel (Alta) — **Resuelto T04**

**Archivos:** `server/routes/static_routes.py:108,123-126`.

`/docs/` sirve `AUDITORIA_WEBAPP_COMPLETA.md` (200, 30.9 KB) y
`AUDITORIA_WEBAPP_CORRECCIONES.md`; `/media/` es público; `/api/media` lista la
biblioteca sin token. Todo el servidor, no solo los webhooks, queda expuesto si
se publica con el mismo túnel.

**Evidencia:**

```text
GET /docs/AUDITORIA_WEBAPP_COMPLETA.md -> 200
GET /api/media                         -> 200 JSON
GET /api/tips/recent                   -> 200 JSON
```

**Arreglo:** `/docs/` tiene handler local-only y sirve solo `.md`; `/media/`,
`/api/media` y `/api/tips/recent` exigen petición local. Probado con
`X-Forwarded-For` externo: 404/403.

### F05 — El RSS del Ticker falla con respuestas chunked/gzip (Alta funcional) — **Resuelto T07**

**Archivo:** `server/routes/widgets_routes.py:138`.

El código hace una sola lectura:

```python
raw = await resp.content.read(2_000_001)
```

`StreamReader.read(n)` puede devolver solo el primer chunk. En el feed de BBC
(16.7 KB comprimido/descomprimido) se obtuvieron 3.4 KB y el parser falló con
`unclosed CDATA section`; el endpoint respondió **422** y la página mostró un
error de red.

**Evidencia del barrido:**

```text
/widgets/ticker/index.html -> 422 /api/rss/feed?url=...bbc.co.uk...
```

**Arreglo:** `_read_rss_body()` consume `iter_chunked()` hasta EOF y corta en 2 MB; BBC devuelve 200 con 24 items.

### F06 — JSON malformado puede destruir estado (Alta integridad) — **Resuelto T08**

**Archivos:** `server/routes/themes_routes.py:187-196`,
`server/routes/overlay_routes.py:51-63`.

`handle_apply_shape()` convierte un JSON inválido en `body = {}` y aplica
`shape="original"`. `handle_reset_overlay_texts()` ignora el error de parseo y
ejecuta un reset global.

**Evidencia:**

```text
POST /api/themes/apply-shape   body "{bad" -> 200 {"shape":"original"}
POST /api/overlays/texts/reset body "{bad" -> 200; overlay_texts_config.json cambia
```

El segundo probe se restauró desde copia. **Arreglo:** devolver 400 y no
ejecutar ninguna acción cuando el body no es un objeto JSON válido.

### F07 — `triggers.json` no es atómico ni tolerante a errores (Alta integridad) — **Resuelto T09**

**Archivo:** `server/routes/triggers_routes.py:5-18`.

`handle_save_triggers()` hace `json.dump` directo sobre `triggers.json`, sin
lock ni escritura atómica; `handle_get_triggers()` no captura un archivo
corrupto. Un JSON malformado devuelve **500 HTML**.

**Evidencia:**

```text
POST /api/triggers  body "{bad" -> 500 text/plain "Internal Server Error"
```

**Arreglo:** validar el esquema, usar `lock_for` + `atomic_write_json` y
devolver 400 JSON.

### F08 — Varios endpoints siguen devolviendo 500 y filtran errores (Media) — **Resuelto T08**

**Archivos:** `server/routes/alerts_routes.py:56-105`,
`server/routes/webhooks_routes.py:233-258`.

Con `{bad`:

```text
POST /api/alerts/themes      -> 500, incluye el error del parser
POST /api/alerts/apply-theme -> 400, incluye el error del parser
POST /api/alerts/test        -> 500, incluye el error del parser
POST /api/donations/config   -> 500, incluye el error del parser
```

**Arreglo:** parseo común que devuelva 400 JSON y no exponga `str(e)`.

### F09 — Guardar donaciones puede fallar en silencio y devuelve secretos (Media) — **Resuelto T10**

**Archivos:** `server/services/donations_service.py:65-76`,
`server/routes/webhooks_routes.py:233-258`.

`save_donations_config()` captura cualquier excepción y no devuelve estado; la
ruta responde `{"status":"ok"}` aunque el disco haya fallado. Además el POST
devuelve `cfg` completo, incluido `streamlabsToken` sin enmascarar.

**Arreglo:** devolver `bool`, comprobar el resultado y enmascarar secretos en
la respuesta.

### F10 — El `state` de OAuth no está ligado a la sesión (Media) — **Resuelto T05**

**Archivo:** `server/routes/auth_routes.py:10-30,44-51`.

`_OAUTH_STATES` es global y no se asocia a una cookie de sesión. Un `state`
válido obtenido por un atacante puede usarse en el callback de la víctima;
el control evita CSRF accidental, no un login-CSRF dirigido.

**Arreglo:** `oss_oauth_session` HttpOnly/SameSite=Lax, `state` guardado con su
nonce y consumo único; cookie eliminada al terminar.

### F11 — Los decks no exigen token por defecto (Media, condicional a exposición) — **Resuelto T06**

**Archivos:** `server/config.py:64-66`, `server/app.py:88-98`.

`DECK_TOKEN` es vacío por defecto y `/api/deck/*` queda sin autenticación más
allá del `Origin`/`Sec-Fetch-Site`. `GET /api/deck/status` y
`/api/deck/actions` responden 200 sin token. Si el servidor se abre a la red o
se publica por un túnel, un cliente HTTP sin `Origin` puede disparar acciones.

**Arreglo:** sin `DECK_TOKEN`, solo loopback; con `SERVER_HOST` no loopback o
proxy/túnel se rechaza `/api/deck/*` con 403; aviso al arrancar; probado local,
proxy y cross-site.

### F12 — Nombres/URLs de medios se interpolan sin escapar (Media) — **Resuelto T02**

**Archivos:** `alerts/js/media/02-render.js:40-48,209-212`,
`alerts/js/media/05-preview-assign.js:30-39`.

`fPath`, `sf`, `f.url` y `item.name` se insertan en atributos y `innerHTML`.
El servidor no normaliza todos los nombres de archivo y el listado devuelve
`name`/`url` tal cual. Un nombre con comillas o entidades puede romper el
atributo; un SVG subido completa la cadena.

**Arreglo:** construir con `createElement`/`setAttribute` y escapar `url`/`name`.

### F13 — La galería de temas de alertas también interpola datos sin escapar (Media) — **Resuelto T12**

**Archivo:** `alerts/js/alerts-studio/02b-gallery-toast.js:15-25`.

`t.name`, `t.desc` y `t.accentColor` van a `innerHTML`/`style` sin escape; el
editor permite editar nombre/descripción y guardarlos en
`alerts_themes_config.json`.

**Arreglo:** escapar textos y validar colores, igual que F03.

### F14 — La suite de tests puede cerrar la sesión de Twitch del usuario (Alta test) — **Resuelto T11**

**Archivo:** `tests/test_smoke.py:91-120`.

`test_09_auth_logout` llama a `POST /api/auth/logout` con el token local; eso
ejecuta `system.clear_token()` y borra `token.json`. La suite no hace snapshot
del token ni de la sesión. En un equipo con Twitch conectado, ejecutar los tests
desconecta al streamer.

**Arreglo:** no usar el endpoint destructivo en smoke tests, o snapshot/restaurar
`token.json` y `system.token_data` en `setUpClass`/`tearDownClass`.

### F15 — `recent_tips` conserva datos de prueba (Baja/Media) — **Resuelto T11**

**Archivos:** `tests/test_smoke.py:91-108`,
`server/routes/webhooks_routes.py:214-216`.

`test_08` envía `SmokeTestUser` y `/api/tips/recent` lo devuelve hasta reiniciar
el servidor. Es el W30 original, todavía reproducible.

**Arreglo:** limpiar `recent_tips` en `tearDownClass` o añadir un endpoint de
reset de test detrás de token.

### F16 — `tunnelUrl` no se enmascara (Baja/Media) — **Resuelto T10 (solo local)**

**Archivo:** `server/routes/webhooks_routes.py:219-230`.

`GET /api/donations/config` devuelve `https://stream.midominio.com` completo.
No es un secreto criptográfico, pero el hallazgo W15 pedía ocultar túnel y token;
solo se cerró el token.

**Arreglo:** devolver `tunnelUrl` solo a peticiones locales autenticadas o
enmascarar el host si la UI no lo necesita.

### F17 — `index.html` y documentación tienen datos obsoletos (Baja) — **Resuelto T15 (nota)**

**Archivos:** `index.html:47`, `docs/*.md` (múltiples `localhost:8080`).

El catálogo raíz sigue diciendo `Todas (9)` y enlaza rutas antiguas, aunque
`/` redirige al panel. La documentación conserva URLs con puerto fijo; W29 no
está completamente cerrado.

### F18 — Permisos de estado y backups (Baja) — **Resuelto T14**

`roles.json` es **664** y `triggers.json` **644**; `roles.private.bak.json`
(ignorado por Git) es **644** y contiene nombres de moderadores/VIPs.
`server.log` también es 664. En un equipo multiusuario son datos legibles por
otros usuarios. No hay secretos de API en esos archivos, pero sí datos de canal.

**Arreglo:** `chmod 600` y crear los archivos con `0o600` desde el código.

## 3. Qué sigue sano

- **181/181 tests** en 17 suites, todos con exit 0.
- **62/62 URLs** responden; 0 excepciones JS y 0 IDs duplicados; 0 errores de
  recursos salvo el RSS del Ticker.
- **162 JS** pasan `node --check`; **98 PY** pasan `py_compile`.
- Path traversal de temas/widgets, SSRF básico, CORS externo `localhost.evil.com`,
  webhooks sin secreto remoto, OAuth `state`, favicon y symlinks estáticos.
- Estado de usuario restaurado (`themes_state`, `config.js`, `widgets_config`,
  `fusions`, `overlay_texts`, `alerts*`): hashes idénticos al baseline.

## 4. Prioridad de corrección sugerida

1. **F01/F02/F03/F04**: seguridad de origen exacto, SVG, XSS de metadatos y
   exposición de docs/media.
2. **F05**: RSS/Ticker (feature roto).
3. **F06/F07/F08/F09**: errores JSON, resets destructivos y persistencia.
4. **F10/F11/F12/F13**: OAuth, decks, medios y galería.
5. **F14/F15**: aislamiento de la suite (token y tips).
6. **F16/F17/F18**: cierre de W15/W29 y permisos.

## 5. Evidencia de ejecución

```text
Tests:       181/181 OK (17 suites)
Páginas:     62 URLs; 4 con aviso -> 3 AudioContext + 1 RSS 422
JS syntax:   162/162 OK
Python:      98/98 py_compile OK
CORS:        localhost:8080 200 / localhost:9999 200 / localhost.evil.com 403
WS:          localhost:8080 y localhost:9999 aceptados; sin token 403
RSS BBC:     422 "El contenido no es XML/RSS válido" (feed directo 200)
API bad JSON: alerts/themes 500; alerts/test 500; donations/config 500;
              triggers 500; apply-shape 200 destructivo
Media SVG:   upload 200; GET /media/... 200 image/svg+xml
Docs:        /docs/AUDITORIA_WEBAPP_COMPLETA.md 200
```

## 6. Sondas que se restauraron

- `overlay_texts_config.json` y `config.js`: reset de prueba restaurado desde
  `/tmp/oss_fix_state/`.
- SVG de prueba y sus archivos asociados: eliminados.
- `themes_state.json`, `fusions.json`, `widgets_config.json`, `alerts*`: hashes
  idénticos al baseline al terminar.
- No se reinició el servidor.
