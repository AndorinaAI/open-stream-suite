# Convenciones — Temas de pack en Widgets y Alertas

> Contrato **nativo** (CSS + atributo `data-theme`). No requiere scripts propios:
> los widgets y alertas consumen los tokens que ya define `app/common/themes.css`.

## 1. Contrato

`app/common/themes.css` define, por tema de pack:

```css
body[data-theme="<themeId>"] {
  --color-bg-dark; --color-text-light; --color-accent-cyan; --color-accent-orange;
  --color-panel-bg; --color-text-dim; --color-border-cyan; --color-border-cyan-bright;
  --theme-glow;
}
```

Un widget/alerta "soporta temas" cuando:

1. Carga `/common/themes.css` en su `index.html`.
2. Recibe `data-theme` en `<body>` por:
   - `?theme=<themeId>` en la URL (boot del propio widget), o
   - mensaje WebSocket `{ type: "theme_change", theme }` (actualización en vivo).
3. Su CSS resuelve colores con `var(--color-…, <fallback>)`, **nunca** solo literales.
4. Su apariencia por defecto (sin `data-theme`) queda intacta: las capas de tema
   se declaran bajo `body[data-theme]` o con el fallback del `var()`.

## 2. Plantilla para un widget nuevo

```html
<link rel="stylesheet" href="../../common/themes.css">
```

```js
// en el entrypoint del widget
(function () {
  var t = new URLSearchParams(location.search).get('theme');
  if (t) document.body.setAttribute('data-theme', t);
})();
// en el handler WS existente:
if (d.type === 'theme_change' && d.theme) document.body.setAttribute('data-theme', d.theme);
```

```css
/* valores por defecto actuales */
:root { --mi-accent: #57D6C4; }

/* capa de tema (solo activa con data-theme) */
body[data-theme] {
  --mi-accent: var(--color-accent-cyan, #57D6C4);
  --mi-bg: var(--color-panel-bg, rgba(25,29,33,0.92));
}
```

## 3. Plantilla para una alerta de panel

- El overlay `app/alerts/index.html` ya carga `themes.css`.
- `alerts/js/overlay/04-ws-client.js` aplica `theme_change` → `data-theme`.
- Los banners usan `--banner-accent`, `--banner-border`, `--banner-text`; la capa
  `body[data-theme]` de `alerts-themes.css` los enlaza a los tokens del pack.
- Las alertas multimedia propias quedan fuera de este contrato (no usan paneles).

## 4. Reglas

- No añadir hojas de estilo nuevas por widget: usar los tokens compartidos.
- No usar `!important` para forzar temas: si un preset gana, se resuelve por especificidad.
- Todo color nuevo debe declararse como variable con fallback.
- Los textos nuevos de UI van en los **módulos** que carga `common/i18n.js`:
  `app/languages/es.alerts.json` / `en.alerts.json` (sección `fusions`), o el módulo
  correspondiente (`widgets`, `overlays`, `common`). El monolito `es.json`/`en.json`
  NO lo lee el runtime.
- Validación automática: `tests/test_native_theming_contract.py`.

## 5. Fusión de miembros mixtos (escenas + widgets + alertas)

Una fusión puede agrupar tres tipos de miembro; todos comparten la MISMA fuente de
verdad (`themes_state.json`):

| Miembro | Clave de asignación | Tema | Forma |
|---|---|---|---|
| Escena de pack | `maker-desk` (canónica) | sí | sí (formas del pack) |
| Widget | `widget:chat` | sí | sí, sólo si el widget la soporta (`chat`) |
| Alerta de panel | `alert:card`, `alert:banner` | sí | no (los banners usan presets propios) |

API:

- `GET /api/components/catalog` — miembros disponibles y formas por widget.
- `POST /api/fusions` con `{scenes:[], widgets:[], alerts:[]}` — guarda la fusión.
- `POST /api/fusions/{id}/apply-theme|apply-shape` — aplica a todos los miembros y
  devuelve `appliedScenes/Widgets/Alerts`, `failed…` y `skipped…`.
- `POST /api/fusions/{id}/reset` — restaura tema y forma de fábrica en todos.
- `POST /api/themes/overlay-assignment` — asignación individual (acepta claves
  `widget:<id>` / `alert:<id>`).

Consumo nativo: `config.js` incluye `overlayThemes`/`overlayShapes`; el widget lee
su clave `widget:<id>` al arrancar y escucha `widget_theme_change` en su WebSocket.
El overlay de alertas lee `alert:card` y escucha `alert_theme_change`.

Los **resets** eliminan la clave del componente (recupera su aspecto propio) y
devuelven la escena a `DEFAULT_OVERLAY_THEMES` sin forma asignada.

## 6. Integración nativa: reglas y estado actual

- **Arranque del widget**: `common/widget-theme.js` (`OSSTheme.init(id)`) lee `?theme` → `OSS_CONFIG.overlayThemes['widget:<id>']`.
- **Cambio en vivo**: `widget_theme_change` / `alert_theme_change` aplican **tema y forma** sin recargar
  (el chat reutiliza `ChatStyles.applyChatConfig()`).
- **Precedencia**: una asignación explícita gana al tema global (`theme_change`) en escena, widget y
  alerta. `overlayThemeExplicit` marca las asignaciones explícitas y `globalThemeActive` indica si el
  usuario activó un tema global; ambos viajan en `config.js`. El módulo recuerda la asignación viva
  por WS porque `config.js` es estático hasta recargar, y el reset libera el global de inmediato.
- **Reset individual**: `POST /api/themes/reset-assignment {overlayKey}` restaura tema y forma de fábrica.
- **UI**:
  - Pestaña **Widgets → «Temas de widgets»**: 5 filas (chat, goal, promo/shoutout, ticker, timer) con
    desplegable de tema (21 estilos + «sin asignar»), forma (9 + «sin forma»), **Aplicar**, **↺ Reset**
    y selector de fusión + **➕**.
  - Pestaña **Alertas → «Temas de alertas»**: para `card` y `banner`, tema (21 + «sin asignar») y
    **29 formas**: las 9 genéricas + las 20 físicas de todos los packs (bloque generado por
    `AlertsStudio.renderStudio`, se refresca al abrir la pestaña). El overlay aplica el tema del
    tipo que se está mostrando (`playCardAlert`/`playBannerAlert`); la forma física sigue siendo
    única por página (`body[data-theme-shape]`).
  - **Fusiones**: el modal ofrece tema (21), forma (22 opciones), 27 escenas, 5 widgets y 2 alertas con
    nombres legibles; el detalle aplica tema/forma en lote y permite **↺ Restaurar fusión**.
- **Formas**:
  - Widgets: las 9 genéricas (`rounded, box, bubble, scifi, pill, arcade, tag, slant, soft_card`)
    mediante `common/oss-shape.js`, por elemento y en vivo.
  - Alertas: esas 9 genéricas **más las 20 formas físicas de los packs** (`cozy_polaroid`,
    `gamer_mecha`, `comic_manga_action`, …). Las físicas se aplican marcando la alerta como
    `[data-oss-panel]` y poniendo `body[data-theme-shape="<id>"]`, reutilizando el CSS nativo de
    escenas (incluidas las reglas de panel añadidas para las 3 formas cozy).
  - En `widget:`/`alert:`, `original` se normaliza a “sin forma” y no se persiste; en escenas
    `original` sí es una forma válida.
  - Las formas genéricas muestran etiqueta legible ES/EN (`Píldora`, `Caja`, `Sci-Fi bisel`…);
    `gameplay_hud` marca `.camera-frame` como `[data-oss-panel]` para que las formas de panel
    tengan destino en esa escena.
  - `card` y `banner` guardan su forma por separado; al mostrarse cada una se activa la suya
    (solo una forma física puede estar activa a la vez en la página de alertas).
- **Banners**: con un tema de pack activo, fondo (degradado), borde, sombra y textos salen de los
  tokens (`--color-panel-bg`, `--color-bg-dark`, `--color-accent-cyan`, `--color-text-*`).
  Sin tema se conservan los presets `banner-theme-*`.
- **Colores de rol y sombras decorativas** no se tokenizan (deben permanecer estables).

## 7. Chat en escenas (widget embebido y modo OBS)

Las escenas con panel de chat (`chill`, `cozy_cafe`, `oss_chatting`) embeben el widget real en un
iframe (`/widgets/chat/index.html?embed=1`) dentro del marco. El marco **nunca desaparece** ni mueve
la cámara: solo se ocultan los mensajes cuando se desactiva el interruptor.

- **Activado** (`showChatPanel: true`): el iframe muestra el chat en vivo dentro del panel, con el
  tema de la escena (se sincroniza por `postMessage` y se actualiza en vivo al cambiar de tema).
- **Desactivado** (`showChatPanel: false`): el panel, su cabecera, fondo y medidas se mantienen; solo
  se oculta el iframe. Ese hueco queda libre para colocar el widget de chat como fuente de navegador
  en OBS con su enlace.
- Modo embebido: `?embed=1` adapta el contenedor del widget al 100% del panel (sin posición absoluta
  ni ancho fijo de 440px) y oculta el spotlight.
- El estado se guarda en `overlay_texts_config.json` (`chill/cozy/oss.showChatPanel`) y se aplica en vivo.
- El guardado de textos hace **merge profundo**: enviar solo una sección ya no borra `cozy`, `oss`,
  `pomodoro`, `victory`, `art` ni `speedrun`.
