# Auditoría completa de la webapp — Open Stream Suite

> **Estado posterior (2026-10-24):** se aplicaron correcciones nativas para los 32 hallazgos.
> El registro de cambios, archivos y verificaciones está en
> `docs/AUDITORIA_WEBAPP_CORRECCIONES.md`. Este documento conserva la evidencia original
> de la auditoría; los estados de la tabla de abajo son los encontrados antes de corregir.

> Fecha: 2026-10-24 · Alcance: **toda la webapp** (`app/`): servidor aiohttp, rutas API,
> servicios, panel, escenas, widgets, alertas, fusions, launcher, datos persistidos, tests y
> documentación operativa.
>
> Método: inventario desde disco + análisis estático + **pruebas reales contra el servidor**
> (`localhost:8080`) + navegador Chrome headless/CDP sobre **62 URLs** + HTTP/curl +
> WebSocket + lectura de logs. No se ha corregido código en esta ronda: este documento es el
> registro de hallazgos y evidencia.
>
> Estado del usuario restaurado al terminar: `themes_state.json` `bee077d0…`,
> `fusions.json` `7886325…`, `config.js` `d05eff7b…`,
> `overlay_texts_config.json` `c71e1f43…`, `alerts_config.json` `510b8c61…`.
> El servidor se dejó en `200` en `:8080`.

---

## 0. Resumen ejecutivo

**Encontrados 32 hallazgos**: **4 críticos**, **10 altos**, **10 medios** y **8 bajos**.

Lo más grave no es visual: hay **toma de control local** por tres vías independientes
(CORS/token, WebSocket sin autenticación y escritura arbitraria por path traversal),
además de **XSS persistente en el panel de chat**. Cualquiera de ellas permite a una página
externa o a un mensaje de chat ejecutar acciones en el OBS del usuario.

También hay una **regresión funcional clara** en las acciones de widgets: los endpoints
`/api/widgets/action` para `timer`, `chat spotlight`, `ticker simulate` y `goal` devuelven
**500** por nombres/imports no definidos. Los tests actuales no cubren esas rutas, por eso
pasaron 16/16.

### Lo que sí está sano (verificado, no asumido)

- Las **62 URLs** de la app (panel, alertas, 27 escenas, 5 widgets y alias legacy) responden
  **200**.
- **0 excepciones JS no capturadas** en el barrido de las 62 páginas. Solo aparecen:
  un `favicon.ico` 404 y avisos de `AudioContext` por política de autoplay de Chrome.
- **0 IDs HTML duplicados** en las 35 páginas.
- Las **16 suites** de `app/tests/` terminan con código 0.
- Los endpoints GET principales (`/api/status`, `/api/themes/packs`, `/api/fusions`,
  `/api/widgets/config`, `/api/alerts/config`, `/api/components/catalog`, etc.) responden 200.
- Los archivos `.env`, `token.json`, `.local_token`, `donations_config.json` y el código del
  servidor **no se sirven** por HTTP.
- Los flujos de temas H1–H10 y el E2E de backlog siguen pasando (ver §9).

---

## 1. Críticos

### W01 — CORS acepta `http://localhost.evil.com` y filtra el token local

**Severidad:** crítica · **Evidencia:** `server/app.py:69-91`, `server/app.py:142-147`,
`server/app.py:174-190` (token endpoints).

`is_origin_allowed()` usa `origin.startswith("http://localhost")`. Eso acepta cualquier
host que empiece por ese texto, por ejemplo `http://localhost.evil.com` o
`http://127.0.0.1.evil.com`. La comprobación del túnel tiene el mismo defecto con
`origin.startswith(t_url)`.

Consecuencia: una página web maliciosa abierta en el mismo equipo puede pedir
`GET /api/local-token`, recibir `Access-Control-Allow-Origin` con su propio origen y leer el
token. Después puede hacer POST autenticados contra toda la API. La comprobación
`is_local_request()` no protege: la petición del navegador llega desde `127.0.0.1`.

**Reproducción real (token redactado):**

```bash
curl -i -H 'Origin: http://localhost.evil.com' \
  http://localhost:8080/api/local-token
# HTTP/1.1 200
# Access-Control-Allow-Origin: http://localhost.evil.com
# {"status":"ok","token":"[REDACTED]"}
```

También se confirmó el reflejo del origen en `/api/themes/packs` y en `OPTIONS`.

**Corrección recomendada:** comparar `urlparse(origin).scheme + "://" + hostname + port`
contra una lista exacta (`localhost`, `127.0.0.1`, `[::1]` y el túnel exacto), nunca
`startswith` sobre la cadena completa. Para el túnel, comparar hostname y puerto exactos.

---

### W02 — El WebSocket `/ws` no tiene autenticación ni comprobación de origen

**Severidad:** crítica · **Evidencia:** `server/routes/ws_routes.py:7-12`, `:21-70`;
registro en `server/app.py:187`.

`handle_ws` acepta cualquier conexión y procesa `test`, `trigger`, `theme`, `timer`,
`explode` y `alert`. No comprueba `Origin`, `X-Local-Token`, `Sec-Fetch-Site` ni un token
de handshake. Los navegadores permiten WebSocket cross-origin sin CORS, así que una página
externa puede abrir `ws://localhost:8080/ws` y lanzar acciones.

**Reproducción real:** se abrió `ws://localhost:8080/ws` desde Python sin token; el servidor
envió `system_status` y aceptó `{"action":"theme","id":"maker"}`. El mismo camino permite
`{"action":"test","payload":…}` y `{"action":"trigger",...}`.

**Corrección recomendada:** autenticar el handshake (token en query/header/subprotocolo),
validar origen exacto y aplicar la misma política de token que los POST.

---

### W03 — Path traversal con escritura arbitraria en `POST /api/themes/chat-anchor`

**Severidad:** crítica · **Evidencia:** `server/routes/themes_routes.py:122-137`;
`server/services/theme_service.py:276-300`; `get_theme_dir()` de
`server/services/theme_manager.py:307-318`.

`toggle_chat_anchor_service()` recibe `packId` y `themeId` del body y llama directamente a
`get_theme_dir(pack_id, theme_id)`. No usa `is_valid_pack_id()` ni
`is_valid_theme_id()`. `get_theme_dir()` tampoco valida el resultado contra
`STREAMTHEMES_DIR` (la versión segura vive en `validation_utils.py`).

Con `themeId` con `../` se puede leer y **escribir** un `theme.json` fuera del pack. Se
comprobó con un directorio temporal: el POST devolvió 200 y modificó el JSON externo.

**Reproducción (archivo temporal, ya limpiado):**

```
POST /api/themes/chat-anchor
{"packId":"Maker_Theme_Pack",
 "themeId":"../../../../../../../tmp/oss_audit_evil",
 "anchored":false}
→ 200 {"status":"ok","anchored":false,...}
```

**Corrección recomendada:** validar pack/tema en la ruta **y** en el servicio, y hacer que
`get_theme_dir()` sea la versión de `validation_utils` (resolución + `is_relative_to`).

---

### W04 — Path traversal con escritura arbitraria en la configuración de widgets

**Severidad:** crítica · **Evidencia:** `server/services/widgets_service.py:60-89`
(especialmente `:66-74`); `server/routes/widgets_routes.py:34-48,167`.

`save_widgets_config(cfg)` itera las claves del objeto recibido y, si la clave no está en
`WIDGET_CONFIG_MAPPING`, construye `WIDGETS_DIR / widget_key / "config.json"` sin
sanitizar. Un POST autenticado con una clave `../.audit_widget` crea y escribe fuera de
`widgets/`.

**Reproducción real (archivo temporal, ya eliminado):**

```
POST /api/widgets/config
{"config":{"../.audit_widget":{"pwned":true}}}
→ 200
# se creó app/.audit_widget/config.json con {"pwned":true}
```

Con el token filtrado por W01, esto es una cadena de escritura arbitraria. La ruta
`POST /api/widgets/{widget}/config` también acepta `widget` sin validar contra el catálogo.

**Corrección recomendada:** permitir solo claves del catálogo (`widget_ids()`), validar el
nombre con el mismo criterio que `create_media_folder` y rechazar `..`, `/`, `\` y vacíos.

---

## 2. Altos

### W05 — XSS persistente en el panel mediante mensajes de chat

**Severidad:** alta · **Evidencia:** `widgets/chat/panel/04-preview-feed.js:75-95`
(`row.innerHTML` con `m.user`/`m.message`), `:108-126`
(`triggerSpotlightFromFeed`), `server/irc.py:70-72` (mensaje crudo), y
`server/state.py:52-70` (buffer de chat).

`refreshChatLiveFeed()` construye HTML con el texto del mensaje sin escapar (solo sustituye
`"` para el atributo `title`; no escapa `<`, `>` ni `&`). `triggerSpotlightFromFeed()` repite
el patrón. Un mensaje de chat que llegue con HTML se ejecuta en el origen del panel
(`http://localhost:8080`), donde puede leer `/api/local-token` y controlar la app.

**Reproducción real:** se envió un mensaje simulado
`<img src=x onerror="window.__xss=1">`; al abrir el feed del panel,
`window.__xss` valía **1** y el `<img>` aparecía sin escapar en el DOM. El mensaje de prueba
se limpió al reiniciar el servidor.

**Corrección recomendada:** usar `textContent` para usuario/mensaje y `escapeHtml()` para
cualquier interpolación en atributos; no construir `onclick` con datos del chat. Lo mismo
aplica a `triggerSpotlightFromFeed` y a los demás paneles que interpolan datos externos.

---

### W06 — Cuatro acciones de widgets devuelven 500 por nombres/imports no definidos

**Severidad:** alta · **Evidencia:**

- `server/services/actions/timer_actions.py:15`: usa `widget`, que no existe en el ámbito.
- `server/services/actions/chat_actions.py:49-57`: usa `load_widgets_config` y
  `save_widgets_config` sin importarlos; afecta a `chat spotlight`.
- `server/services/actions/chat_actions.py:1-79`: las acciones desconocidas no retornan
  respuesta (el handler devuelve `None`).
- `server/services/actions/ticker_actions.py:47-49`: `amount` no está definido en
  `ticker simulate`; `flash` no tiene rama y también termina en `None`.
- `server/services/actions/goal_actions.py:129`: usa `time.time()` sin `import time`;
  **todas** las acciones de goal terminan en 500 después de guardar configuración.

**Pruebas reales contra `GET /api/widgets/action`:**

| Acción | Resultado |
|---|---|
| `widget=timer&action=start` | **500** `NameError: widget` |
| `widget=chat&action=spotlight` | **500** `NameError: load_widgets_config` |
| `widget=chat&action=nope` | **500** (handler devuelve `None`) |
| `widget=ticker&action=simulate` | **500** `NameError: amount` |
| `widget=ticker&action=flash` | **500** (sin rama) |
| `widget=goal&action=toggle_goal&goal_id=__none__` | **500** `NameError: time` |
| `widget=promo&action=get_history` | 200 (control) |

Los botones del panel que llaman `API.triggerWidgetAction('timer', …)` y
`API.triggerWidgetAction('chat','spotlight',…)` no comprueban `res.ok`; además de fallar en
servidor, el `res.json()` sobre una respuesta 500 en texto produce un error JS no controlado.

**Corrección recomendada:** imports explícitos, `widget` en el payload, `amount` en ticker,
rama por defecto `400` con JSON, y tests de cada acción.

---

### W07 — `GET /api/widgets/action` ejecuta acciones sin token ni protección CSRF

**Severidad:** alta · **Evidencia:** `server/routes/widgets_routes.py:170`;
`server/services/widgets_actions.py:16-43`; middleware `server/app.py:123-147`
solo protege POST.

El endpoint acepta GET con `widget`/`action` y ejecuta efectos (por ejemplo
`widget=chat&action=clear`). No exige `X-Local-Token` en GET y no comprueba
`Origin`/`Sec-Fetch-Site`. Una página externa puede usar una imagen/iframe
`<img src="http://localhost:8080/api/widgets/action?widget=chat&action=clear">` para
limpiar el chat, lanzar un timer o cambiar una meta.

**Reproducción real:** `GET /api/widgets/action?widget=chat&action=clear` devolvió 200
incluso con `Origin: http://evil.example` y `Sec-Fetch-Site: cross-site`.

**Corrección recomendada:** separar lectura y escritura: GET solo para lecturas
(`get_history`, `get_recent`) y POST autenticado para acciones; o exigir token también en
GET y validar origen.

---

### W08 — Webhooks de donaciones sin firma, y `/api/webhooks/tip` público

**Severidad:** alta · **Evidencia:** `server/routes/webhooks_routes.py:20-65` (Ko-fi),
`:68-95` (BMC), `:98-147` (PayPal), `:150-178` (`tip`), `:222-225`;
`server/app.py:55-66` y `:130-134`.

- Ko-fi no valida el `verification_token` que envía el servicio.
- PayPal no verifica la firma/IPN ni el `receiver_email`/`business`.
- BMC no verifica ninguna firma.
- `/api/webhooks/tip` está registrado como público y ejecuta `handle_tip_simulate`, que
  acepta usuario/importe/mensaje arbitrarios y emite `tip` + alerta.

Cualquier cliente que alcance el puerto puede inyectar donaciones y alertas. Si el servidor
se abre a la red o al túnel, el riesgo deja de ser local.

**Corrección recomendada:** verificar firma/secreto de cada proveedor, comparar la cuenta
destino, y exigir token local o firma a `/api/webhooks/tip` (o eliminar esa ruta pública).

---

### W09 — OAuth de Twitch sin parámetro `state`

**Severidad:** alta · **Evidencia:** `server/routes/auth_routes.py:7-18` (authorize) y
`:20-43` (callback).

`/auth` construye la URL de autorización sin `state`; `/callback` canjea cualquier `code`.
Un atacante puede iniciar un flujo OAuth y hacer que la víctima abra el callback con su
código, vinculando la cuenta de Twitch del atacante al servidor local (CSRF de login).

**Corrección recomendada:** generar un `state` criptográfico por sesión, guardarlo con
caducidad y compararlo en el callback; usar `secrets.compare_digest`.

---

### W10 — SSRF en `/api/rss/feed`

**Severidad:** alta · **Evidencia:** `server/routes/widgets_routes.py:100-118`.

`handle_get_rss_feed` acepta cualquier URL `http://`/`https://` y hace `session.get(url)`
sin allowlist, sin bloquear loopback/red privada y sin limitar redirecciones. Se puede usar
para consultar servicios internos y devolver su contenido parseado.

**Reproducción real:** se levantó un servidor XML local en `127.0.0.1:8099`; el endpoint
devolvió `{"feed_title":"INTERNAL","items":[{"title":"secreto interno"}]}`. La petición
llegó al servidor interno.

**Corrección recomendada:** allowlist de dominios o proxy con resolución DNS segura,
bloqueo de rangos privados/loopback, límite de tamaño y de redirecciones.

---

### W11 — `/api/deck/theme` acepta path traversal y no activa el tema global

**Severidad:** alta · **Evidencia:** `server/routes/deck_routes.py:60-125`,
especialmente `:82-88` y `:109-112`; `server/app.py:55-66`.

`pack_id`/`theme_id` se pasan sin validar a `get_theme_dir()` y luego se abre el
`theme.json` resultante. Además, el handler guarda `activePack`/`activeTheme` pero **no**
pone `globalThemeActive=True`; con el contrato H1/H2, las escenas no aplican `activeTheme`
si `globalThemeActive` es falso. Se comprobó: `GET /api/deck/theme?id=cyberpunk` devolvió
200, dejó `activeTheme=cyberpunk`, pero `globalThemeActive` siguió en `false`.

**Corrección recomendada:** usar validación de pack/tema, reutilizar
`apply_theme_service()` (que sí activa el flag) y no leer archivos por rutas no validadas.

---

### W12 — El botón «Sync Twitch» del objetivo llama a un endpoint inexistente

**Severidad:** alta (funcional) · **Evidencia:** `alerts/js/api.js:509-520`;
botón en `alerts/panel.html:1324`; no existe ninguna ruta `/api/twitch/channel` en
`server/app.py` ni en `server/routes/`.

`window.syncGoalWithTwitch()` hace `fetch('/api/twitch/channel')`, que devuelve **404**.
El código muestra el toast «Conecta Twitch en Ajustes» y nunca sincroniza. No hay tests de
este flujo.

**Corrección recomendada:** implementar el endpoint (o llamar a
`/api/widgets/goal/config`/servicio de sync existente) y añadir un test de contrato.

---

### W13 — Los temas creados desde la UI no incluyen los 14 tokens estructurales

**Severidad:** alta (visual/regresión) · **Evidencia:** `server/services/theme_service.py:154-164`.

El CSS por defecto de `create_theme_service` solo define los 9 tokens de color
(`--color-*`, `--theme-glow`). No define `--frame-*`, `--panel-*`, `--badge-*` ni
`--header-*`; un tema nuevo por tanto no responde a formas de panel, y `Restore` tampoco
los recupera.

**Prueba real:** se creó un tema temporal `audit_custom`; su `style.css` tenía **0** de los
4 grupos de tokens estructurales. Se eliminó el tema y se regeneró `themes.css` sin dejar
restos.

**Corrección recomendada:** generar el bloque de 14 tokens en el CSS por defecto y en
`style.default.css`, con los valores del pack/arquetipo; extender el test H9 para contarlos.

---

### W14 — Los tests dejan `config.js` desincronizado al restaurar el estado

**Severidad:** alta (calidad/estado) · **Evidencia:** `tests/test_audit_fixes.py:27-43`
(snapshot solo de `themes_state.json`/`fusions.json`), `tests/test_fusions.py:17-42`
(idem) y `tests/test_theme_packs.py` (sin restauración de `config.js`).

Al ejecutar la suite, los tests llaman a `save_theme_state()`, que regenera `config.js` con
asignaciones de prueba. Al restaurar solo el estado, `config.js` queda con
`overlayThemeExplicit` de prueba. Se observó exactamente eso: el estado tenía `{}` y el
`config.js` servido tenía `{"game":true,"cozy_art":true,"gamer_victory":true}`. Se restauró
la copia buena manualmente.

**Corrección recomendada:** que cada test que toque estado/fusions haga snapshot y restore
también de `config.js` (o que un fixture global restaure los cinco archivos), y verificar
`sha256` al final.

---

## 3. Medios

### W15 — `/api/donations/config` expone el token de Streamlabs y el túnel

**Evidencia:** `server/routes/webhooks_routes.py:202-214`;
`server/services/donations_service.py:42-45`.

`handle_get_donations_config()` devuelve `streamlabsToken` completo en JSON sin autenticación
GET. Ahora está vacío, pero cuando el usuario lo configure quedará visible para cualquier
petición que alcance el puerto/túnel. El POST sí exige token, pero el GET no. Además
`donations_config.json` se guarda con escritura directa y permisos `644`; `token.json`
tampoco se crea con `0600` (`server/state.py:32-36`).

**Recomendación:** devolver el token enmascarado (`••••`), guardar archivos con `0600`,
usar escritura atómica y exigir token local también para GET sensible.

---

### W16 — Contadores y textos hardcodeados «9 escenas»

**Evidencia:** `alerts/panel.html:88` (`OBS STUDIO · 9 ESCENAS ACTIVAS`);
`languages/es.json:24`, `es.alerts.json:23`, `es.widgets.json:22`, `es.overlays.json:22`
y sus pares ingleses; `alerts/panel.html:1915` (badge inicial).

La app tiene 27 escenas. El badge de carpeta se actualiza dinámicamente en
`09-overlay-folders-render.js:34`, pero el pie del sidebar nunca se actualiza y las
traducciones siguen diciendo 9. Es una inconsistencia visible en todas las lenguas.

**Recomendación:** renderizar el contador desde `OSS_SCENES.length` y actualizar las seis
traducciones; eliminar el valor inicial hardcodeado.

---

### W17 — Claves i18n reales ausentes

**Evidencia:** `alerts/js/themes/13-fusions.js:293,295`;
`widgets/goal/panel/01a-target-tab.js:17,20,23,47`;
`alerts/js/rewards/02-drawer-render.js:129`.

Faltan en los diccionarios ES/EN:

- `fusions.warn_unknown_scenes` y `fusions.warn_unknown_scenes_fix` (solo fallback español).
- `widgets.goal_btn_stacked`, `goal_btn_rotative`, `goal_btn_single`, `goal_btn_new`.
- El literal `✓ Seleccionada recompensa` se pasa a `i18n.tr()` como si fuera una clave.

Las claves dinámicas `widgets.goal_<id>` y `widgets.shortcuts.<id>` están protegidas con
`i18n.has()` y no son un fallo. El recuento del extractor: 822 claves usadas, 9 ausentes
reales.

---

### W18 — Escrituras no atómicas y sin lock en widgets, alertas, roles, donaciones y temas

**Evidencia:** `server/services/widgets_service.py:70-82`;
`server/services/alerts_service.py:26-34,48-56`;
`server/routes/roles_routes.py:72-80`;
`server/services/donations_service.py:42-45`;
`server/services/theme_service.py:154-215` (crear/guardar CSS/tema).

`fs_utils.atomic_write_*` se aplicó al estado de temas, fusions, config y `themes.css`,
pero no a estos archivos. Un fallo de disco o dos POST concurrentes pueden dejar JSON
truncado o perder la última escritura. `widgets_config.json` se escribe además en dos
capas (modular + copia unificada) sin transacción.

**Recomendación:** reutilizar `atomic_write_json`/`lock_for` en todos.

---

### W19 — Varios POST devuelven 500 HTML ante JSON malformado

**Evidencia:** `server/routes/widgets_routes.py:34-36`;
`server/routes/actions_routes.py:16-18,92-100`;
`server/routes/roles_routes.py:72-80`;
`server/routes/alerts_routes.py:27-54` (devuelve JSON con detalle del parser).

Prueba real con `Content-Type: application/json` y body `{bad`:

| Endpoint | Respuesta |
|---|---|
| `/api/widgets/config` | 500 HTML |
| `/api/test` | 500 HTML |
| `/api/theme` | 500 HTML |
| `/api/roles` | 500 HTML |
| `/api/alerts/config` | 500 JSON con detalle del parser |

El cliente recibe HTML donde espera JSON y el log expone detalles internos. Es una
inconsistencia de contrato, no solo estética.

---

### W20 — Subida de medios sin límite de tamaño ni limpieza transaccional

**Evidencia:** `server/routes/media_routes.py:30-96`.

`handle_upload_media` escribe chunks a disco sin límite de tamaño, sin cuota y sin borrar el
archivo parcial si falla una escritura posterior. Un archivo enorme puede llenar el disco;
un corte deja basura. Tampoco valida que `target_folder_param` sea una carpeta (si es un
archivo, `mkdir` lanza 500).

**Recomendación:** límite por archivo/total, escritura a `.part` + rename, y
`target_dir.is_dir()` con 400.

---

### W21 — `save_theme_service` y `create_theme_service` escriben CSS/JSON directamente

**Evidencia:** `server/services/theme_service.py:154-215`.

`create_theme_service` y `save_theme_service` abren `theme.json`, `style.css`,
`theme.default.json` y `style.default.css` con `open(..., "w")` sin `fs_utils`. La
regeneración de `themes.css` sí es atómica, pero un fallo entre las cuatro escrituras deja
un tema a medias. Además, el CSS enviado por el usuario no se valida (puede romper el
aspecto o incluir `@import` externos).

**Recomendación:** escritura atómica por archivo y validación mínima del CSS (o sandbox).

---

### W22 — `/api/theme` (legacy) y `/api/sound` no validan ni están cubiertos

**Evidencia:** `server/routes/actions_routes.py:92-108`.

`handle_theme_switch` acepta cualquier `theme` y solo hace broadcast; no actualiza estado
ni valida contra el catálogo. `handle_play_sound` acepta cualquier `sound_url` y volumen sin
validación. Están protegidos por token POST, pero siguen siendo una superficie legacy
inconsistente con `/api/themes/apply`. `/api/sound` no tiene ningún consumidor en el repo.

---

### W23 — Interpolación HTML sin escapar en varios paneles (defensa en profundidad)

**Evidencia:** `alerts/js/rewards/02-drawer-render.js:91` (`r.title`, `r.prompt`);
`alerts/js/roles/02-render.js:56` (`role.name`, miembros);
`alerts/js/triggers/02-editor-data.js:162` (`trig.title`);
`common/overlay/dom-injector.js:111` (`socials[net]`), `:151` (`sp.name`, `sp.delta`).

No se ha demostrado una entrada externa no autenticada para todos ellos, pero los datos
proceden de Twitch/configuración local y se insertan con `innerHTML`. El mismo patrón que
W05, en menor exposición. Los nombres de archivos de medios también se interpolan sin
escapar (`alerts/js/media/02-render.js`).

**Recomendación:** helper único `escapeHtml()` y `textContent` para valores; revisar todos
los `innerHTML` con datos de API.

---

### W24 — Los tests de seguridad no cubren los vectores encontrados

**Evidencia:** `app/tests/test_security.py:20-72`.

Solo se prueban archivos secretos, traversal de estáticos y `/api/deck/status`. No hay
tests para:

- origen `localhost.evil.com` y token CORS (W01),
- WebSocket sin token (W02),
- `chat-anchor`/widgets config traversal (W03/W04),
- XSS del feed de chat (W05),
- acciones 500 (W06),
- SSRF RSS (W10),
- webhooks sin firma (W08),
- OAuth state (W09).

`test_smoke.py` y `test_deck_integration.py` sí usan el servidor, pero no cubren estos
caminos.

---

## 4. Bajos

| ID | Hallazgo | Evidencia |
|---|---|---|
| W25 | `favicon.ico` 404 en `/alerts/index.html` (y cacheado en el resto). | barrido CDP |
| W26 | Avisos de `AudioContext` en panel/index/goal: el audio se crea antes de un gesto del usuario. No rompe la app, pero ensucia consola. | barrido CDP |
| W27 | Código duplicado/muerto: `alerts/js/widgets-core/07-shortcuts.js` es idéntico a `alerts/js/widgets-shortcuts.js` y no se carga; varios forwarders (`alerts-studio.js`, `media.js`, …) y shims `server/*.py` no tienen consumidor actual. | inventario de referencias |
| W28 | `PUBLIC_POST_PATHS` contiene `/api/donations/kofi`, `/api/donations/buymeacoffee` y `/api/donations/paypal`, que no están registrados; `/api/sound` y `/api/tips/recent` no tienen consumidor. | `server/app.py:55-66` |
| W29 | URLs `http://localhost:8080` hardcodeadas en panel, guías y launcher pese a que `SERVER_PORT` es configurable. | 35 ocurrencias |
| W30 | `/api/tips/recent` conserva en memoria los datos del smoke test (`SmokeTestUser`) hasta reiniciar; `/api/widgets/config` dispara `auto_sync_twitch_goals` en cada GET (efecto lateral/red). | `server/routes/webhooks_routes.py:227`; `widgets_routes.py:25-31` |
| W31 | `updates/check` ejecuta `git fetch` síncrono (bloquea el event loop hasta 15 s) y no exige token; se puede invocar repetidamente. | `server/routes/updates_routes.py:12-19`; `launcher/updater.py:93-166` |
| W32 | `/streamthemes/` y `/themes/` se sirven con `follow_symlinks=True`; un symlink dentro de un pack podría exponer fuera del árbol. Los packs actuales no lo explotan. | `server/routes/static_routes.py:90-95` |

---

## 5. Tabla resumen

| ID | Sev. | Área | Estado |
|---|---|---|---|
| W01 | Crítica | CORS/token | Confirmado con curl |
| W02 | Crítica | WebSocket | Confirmado con cliente WS |
| W03 | Crítica | Path traversal estado | Confirmado con archivo temporal |
| W04 | Crítica | Path traversal widgets | Confirmado con archivo temporal |
| W05 | Alta | XSS chat → panel | Confirmado con `window.__xss=1` |
| W06 | Alta | Acciones widgets | 6 endpoints 500 |
| W07 | Alta | CSRF GET | Confirmado con Origin externo |
| W08 | Alta | Webhooks | Código + rutas públicas |
| W09 | Alta | OAuth CSRF | Código |
| W10 | Alta | SSRF RSS | Confirmado con XML interno |
| W11 | Alta | Deck theme | 200 + `globalThemeActive=false` |
| W12 | Alta | Sync Twitch | 404 |
| W13 | Alta | Temas nuevos | 0/4 grupos de tokens |
| W14 | Alta | Tests/estado | `config.js` quedó desincronizado |
| W15 | Media | Datos sensibles | GET devuelve token/túnel; permisos 644 |
| W16 | Media | UI/i18n | «9 escenas» × 6 traducciones |
| W17 | Media | i18n | 9 claves ausentes |
| W18 | Media | Persistencia | Sin atomic/lock |
| W19 | Media | API | 500 HTML con JSON inválido |
| W20 | Media | Media | Sin límite de subida |
| W21 | Media | Temas | Escrituras directas |
| W22 | Media | Legacy | `/api/theme`, `/api/sound` |
| W23 | Media | XSS secundario | Interpolaciones sin escape |
| W24 | Media | Tests | Cobertura de seguridad incompleta |
| W25–W32 | Baja | Varios | Ver §4 |

---

## 6. Metodología y evidencia

### 6.1 Barrido de páginas

Se navegaron **62 URLs** con Chrome headless/CDP: panel, overlay de alertas, 27 escenas por
su ruta `streamthemes/...`, 27 alias legacy `/scenes/...` y 5 widgets. Todas respondieron
200. Se capturaron `Runtime.exceptionThrown`, `Runtime.consoleAPICalled`, `Log.entryAdded`,
`Network.responseReceived ≥400` y `Network.loadingFailed`.

Resultado: **0 excepciones JS**, 4 páginas con avisos (favicon 404 y AudioContext). Detalle:
`~/.hermes/profiles/yuki/cache/scratch/audit_webapp/page_errors.json`.

### 6.2 Interacciones del panel

Se abrieron las cinco secciones del sidebar, el modal de fusión, el editor de escena y el
estudio de alertas. **0 excepciones**. Detalle:
`~/.hermes/profiles/yuki/cache/scratch/audit_webapp/panel_interactions.py`.

### 6.3 Pruebas HTTP/WS

- CORS/token: `curl -H 'Origin: http://localhost.evil.com' /api/local-token`.
- Acciones: GET a `/api/widgets/action` con timer/chat/ticker/goal.
- Path traversal: POST a `chat-anchor` y `widgets/config` con directorios temporales.
- SSRF: servidor XML local en `127.0.0.1:8099` y `/api/rss/feed`.
- WS: cliente `websockets` sin token.
- Deck: `GET /api/deck/theme?id=cyberpunk` y lectura de `/api/themes/packs`.
- JSON inválido: POST `{bad` a cinco endpoints.

### 6.4 Inventario y sintaxis

- **164 archivos JS**, **95 Python**, **35 HTML**, **73 JSON**, **62 CSS** (sin `venv`,
  backups ni caché).
- `node --check` sobre todos los JS: **0 errores** (verificación final).
- `py_compile` sobre `server/services/*.py`, `server/routes/*.py` y `tests/*.py`: OK.
- IDs HTML duplicados: **0**.

### 6.5 Tests

Las 16 suites de `app/tests/` terminan con código 0. No obstante, W14 y W24 muestran que
ese verde no cubre las acciones ni los vectores de seguridad encontrados.

---

## 7. Qué está bien (para no romperlo al corregir)

- La separación `server/routes` ↔ `server/services` es consistente en la mayoría de rutas.
- `fs_utils` (atomic write + locks) ya existe y está aplicado a estado de temas, fusions,
  `config.js`, `overlay_texts_config.json` y `themes.css`.
- El catálogo de formas es dinámico por `pack.json` (mtime) y `supports_shape()` es la
  fuente de capacidad.
- La precedencia H1–H10 (`globalThemeActive`/`overlayThemeExplicit`) está cubierta por
  tests estáticos y E2E.
- Los overlays de escenas y widgets no lanzan excepciones en el barrido de 62 URLs.
- La lista blanca de archivos estáticos protege `.env`, `token.json`, `.local_token` y
  `donations_config.json`.
- El E2E de backlog (`scripts/run_theme_e2e.sh`) sigue pasando y restaura sus cuatro
  archivos.

---

## 8. Orden de corrección sugerido

1. **W01/W02**: cerrar CORS exacto y autenticar `/ws`. Sin esto, el resto de controles
   locales son decorativos.
2. **W03/W04/W11**: validar pack/tema/widget en el borde y en el servicio; usar la versión
   segura de `get_theme_dir()`.
3. **W05/W23**: escapar todo dato externo antes de `innerHTML`; tests con payloads HTML.
4. **W06/W07/W12**: reparar acciones, separar GET/POST y añadir tests de cada acción.
5. **W08/W09/W10**: firmas de webhooks, `state` OAuth y allowlist RSS.
6. **W14/W18/W19/W21**: unificar persistencia atómica y errores JSON.
7. **W13/W16/W17**: tokens de temas nuevos, contadores dinámicos y claves i18n.
8. **W15/W20/W22/W24–W32**: endurecimiento y limpieza.

---

## 9. Verificación final de esta auditoría

```text
Servidor:                    200 en http://localhost:8080/api/themes/packs
Páginas navegadas:           62/62 HTTP 200
Excepciones JS:              0
Suites ejecutadas:           16/16 exit 0
JS syntax:                   0 errores (node --check)
Python syntax:               OK (py_compile)
IDs duplicados:              0
```

**Estado restaurado:** `themes_state.json` `bee077d0…`; `fusions.json` `7886325…`;
`config.js` `d05eff7b…`; `overlay_texts_config.json` `c71e1f43…`;
`alerts_config.json` `510b8c61…`. Los archivos temporales de las pruebas de traversal,
SSRF y XSS fueron eliminados; el servidor se reinició para vaciar el buffer de chat de la
prueba.
