# Brief — Sistema de apariencia de Open Stream Suite

Documento autónomo para que otra IA (con acceso a este repositorio) entienda **qué se quiere conseguir**, **qué está roto** y **qué decisiones ya están tomadas**. No es un plan incremental: es una reconstrucción.

---

## 0. Qué es el proyecto

`/home/andorina/Imágenes/twitchoverlay/app` — suite local en Python (aiohttp) + JS vanilla para streamers. Sirve overlays a OBS desde el navegador. No hay frameworks de frontend, ni build step, ni npm: CSS y JS planos servidos desde disco.

Cuatro conceptos del producto:

- **Escena**: overlay HTML a 1920×1080 para OBS. Hay **27**, en `app/streamthemes/<Pack>/overlays/**/index.html`.
- **Widget**: overlay independiente en pantalla. Hay **6**: `chat`, `ticker`, `timer`, `goal`, `promo` (con `shoutout` como symlink del mismo código) en `app/widgets/<id>/`.
- **Alerta**: overlay de eventos de Twitch (follow, sub, cheer, raid, donación… **11 tipos**). Un solo documento, `app/alerts/index.html`, con **dos renderers**: `#alert-card.alert-box` y `#banner-alert-root.banner-alert-root`.
- **Pack**: carpeta en `app/streamthemes/<Pack>/` con `pack.json`, `styles/<tema>/` y `overlays/`. Hay **4 packs**, **21 temas** y **20 formas**.

Panel de control: `app/alerts/panel.html` (una sola página con todas las secciones).

---

## 1. El objetivo (criterios de aceptación)

El usuario quiere que **tres ejes sean independientes entre sí** y **portables** a cualquier superficie:

1. **Forma** (`shape`): la geometría (radio, recorte) **y su pintura** (textura de placa, papel, cristal…). Ejemplo real: `maker_circuit_pcb` debe verse como una **placa de circuito**: placa esmeralda, pistas de cobre ortogonales con algún giro a 45°, pads/vías, serigrafía. **No** una retícula genérica de líneas y puntos.
2. **Tema** (`theme`): **solo color**. Nunca geometría.
3. **Pack**: la familia de apariencia base (geometría por defecto, decoración, ornamentos, tipografía).

Y que se puedan combinar libremente:

| Combinación | Resultado esperado |
|---|---|
| Forma PCB + tema `terminal` | placa con pistas doradas, paleta verde |
| Forma PCB + tema `sakura_sunset` | **la misma placa**, paleta rosa |
| Cambiar de pack con la forma puesta | cambia la apariencia base, **la forma no se pierde** |
| Elegir forma | **no** debe cambiar el tema automáticamente |
| Escena de un pack con tema de otro | se re-viste sin tocar el HTML |

**Criterio de aceptación global:** cualquiera de los 6 widgets, las 2 alertas y las 27 escenas debe reaccionar igual a los tres ejes, y lo mismo en la **previsualización del panel** que en OBS.

---

## 2. El modelo que hay que implementar

Cinco capas. Cada una escribe **solo su familia de tokens**:

```
OVERLAY   estructura y hooks data-oss-*        (no escribe tokens)
PACK      geometría, decoración, tipografía    --skin-*
SHAPE     forma concreta + su pintura          --shape-*
THEME     SOLO color                           --color-*
OVERRIDE  ajuste del usuario por componente    --widget-*
```

**La prioridad se expresa en la cadena de `var()`, no con `!important`.** Una sola declaración por propiedad:

```css
[data-oss-panel] {
  border-radius: var(--widget-radius, var(--shape-radius, var(--skin-panel-radius, 8px)));
  clip-path:     var(--widget-clip,   var(--shape-clip,   var(--skin-panel-clip, none)));
  background-color: var(--widget-bg,  var(--color-panel-bg, var(--color-bg-dark, #191D21)));
  background-image: var(--shape-paint, var(--shape-paint, none));
  box-shadow:    var(--widget-shadow, var(--shape-shadow, var(--skin-panel-shadow, none)));
}
```

Regla de reparto de la pintura: **la forma va a `background-image` y `box-shadow`; nunca a `background-color`**. Así una forma funciona con todas las paletas. Y **nunca** usar el shorthand `background` en capas de skin: resetea `background-image`.

Atributos en `<body>`, independientes: `data-pack`, `data-shape`, `data-theme`. (`data-theme-archetype` y `data-theme-shape` son legado y deben desaparecer.)

---

## 3. Inventario de superficies y sus contratos

| Superficie | Documento(s) | Hooks disponibles hoy |
|---|---|---|
| Widgets (6) | `app/widgets/<id>/index.html` | `data-oss-panel`, `data-oss-shape-target`, 3 `.oss-ornament` |
| Alertas | `app/alerts/index.html` | `#alert-card`, `#banner-alert-root`, ambos con `data-oss-panel` |
| Panel | `app/alerts/panel.html` | el simulador construye su propio `.banner-alert-root` |
| Escenas (27) | `app/streamthemes/*/overlays/**/index.html` | 44 `data-oss-panel`, 36 `data-oss-bar`, 26 `data-oss-cam`, 24 `data-oss-cam-label`, 22 `data-oss-badge` |

**Las 27 escenas ya llevan los hooks**: no hay que tocar su HTML para que sean portables. Eso está hecho y verificado.

Los widgets se identifican por `data-oss-widget` y su clave de estado es `widget:<id>`. Las alertas por `alert:card` y `alert:banner`.

---

## 4. Estado actual y defectos medidos

Commit de partida: `6f3b14d` en la rama `dev`. **426 tests en verde**. Hay un arnés visual funcionando.

### 4.1 Lo que SÍ funciona hoy

- Los 6 widgets **conservan** tema y forma al arrancar (antes los borraban).
- El **simulador de alertas del panel** tiene fondo (antes era transparente).
- El widget `shoutout` recibe su tema (antes leía una clave inexistente).
- La forma `maker_circuit_pcb` **gana la geometría** en los 5 widgets: `border-radius: 0` y `clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), …)`.
- Existe `app/scripts/visual_baseline.py`: captura 34 superficies y compara por píxel con Pillow.

### 4.2 Lo que NO funciona (y por qué)

**(a) La pintura de la forma no existe para 19 de las 20 formas.** `pack.json → shapes[].geometry` solo admite `panelRadius`/`panelClipPath`. No hay campo de pintura en los datos. El motor ya sabe emitir `--shape-paint*` (`theme_engine._shape_token_rule`) y el binding ya lo consume, pero **solo el PCB lo tiene declarado a medias** y su receta es mala: dos `repeating-linear-gradient` a 45° + puntos → parece tela, no placa. Se retiró antes de commitear.

**(b) Los temas siguen llevando geometría.** Cada `app/streamthemes/*/styles/<tema>/style.css` declara `--frame-*`, `--panel-*`, `--badge-*`, `--header-*`. Y `app/common/themes.css` se genera **desde esos `style.css`** (no desde `theme.json`), así que los temas pisan la geometría del pack y de la forma. **Este es el defecto central y sigue vivo.**

**(c) `common/styles.css` tiene 100 `!important`** y cuatro bloques hardcodeados por arquetipo (`body[data-theme-archetype="gamer|cozy|maker|openstream"]`). Se des-forzaron 24; quedan 76 en bloques que no son de skin. Con `!important` vivo, ninguna capa nueva puede ganar: **`!important` gana siempre a cualquier especificidad**.

**(d) Cada widget inyecta CSS en runtime** desde `app/widgets/<id>/js/styles.js` (p. ej. `chat/js/styles.js:132-152` construye `shapeCss` con `border-radius: … !important`). Ese CSS se aplica al final y gana a todo. Además el chat tiene su propio sistema de forma (`ChatStyles.config.shape` → `applyChatConfig()`), que corre **después** de `OSSShape.clear()` y vuelve a escribir la forma genérica.

**(e) La decoración de pack contradice a su propio manifiesto.** En `app/streamthemes/Maker_Theme_Pack/shapes.css` había `border-radius: 4px !important; clip-path: none !important` mientras `pack.json` declaraba `panelRadius: 0`. Ganaba la decoración. Ya se corrigió para el PCB, **pero el patrón se repite en los 4 packs** (`streamthemes/*/shapes.css` está lleno de `!important` de geometría y `background`).

**(f) El editor de tema de alertas es UI zombi.** `app/alerts/js/alerts-studio/01-state-data.js:70` tiene `BASE_STYLES: []` y `02a-layout-dom.js:185-187` pinta un `<select>` con ese array vacío, más un `<input>` de texto libre para el nombre del tema. Escribe 12 claves en `alerts_config.json` (`bannerStyle`, `bgColor`, `bgOpacity`, `accentColor`, `borderColor`, `fontFamily`, `glowIntensity`, `bannerBorderColor`, `bannerAccentColor`, `bannerTextColor`, `bannerFontFamily`, `bannerAnimation`) que **nadie lee**: solo `bannerAccentColor` se usa en `03-alert-queue.js:126`.

**(g) Superficies con contratos CSS distintos.** `app/alerts/panel.html` cargaba `themes.css` **dos veces** y **no** cargaba `alerts-widget.css` (único fichero con `background` para `.alert-box`/`.banner-alert-root`). Corregido, pero el patrón sigue: panel, widgets y escenas enlazan listas distintas.

**(h) El simulador del panel no recibe forma ni skin.** `06-preview-test.js` inyecta `data-theme` y `data-theme-shape` **en el `<div>`**, mientras las reglas exigen `body[...]`. Se añadió `data-oss-shape-target`, pero la forma sigue sin llegar al preview.

---

## 5. Trampas conocidas (esto ya costó horas — no repetirlas)

1. **Un `!important` en una propiedad de apariencia no se compensa con especificidad.** Se elimina. Es la única salida.
2. **`background` (shorthand) resetea `background-image`.** Cualquier capa de skin debe usar `background-color`, `background-image`, etc. por separado. Si no, borra la pintura de la forma.
3. **El navegador descarta una regla entera si un comentario CSS está mal cerrado**, sin error visible. Ya pasó dos veces en este proyecto (`oss-skin.css`): dos reglas estuvieron muertas durante días. Valida siempre con un chequeo de balance de `/* */`.
4. **`common/themes.css` NO se genera desde `theme.json`**, sino desde `style.css` de cada tema (`theme_manager.sync_common_themes_css`). Si solo migras los JSON, no cambias nada visible.
5. **Los `style.css` de los temas son la fuente real**, y `theme.json.tokens` es una copia paralela. Hay que tratar ambos.
6. **`theme_service.save_theme` reescribe `theme.json`** con `tokens` y `archetype`. Si migras los manifiestos sin tocar ese camino, el editor los revierte al primer guardado.
7. **Playwright 1.64.1 y Chrome están instalados** en `app/venv`. Úsalos para medir estilos computados y capturas; no adivines.
8. **`CSS.getMatchedStylesForNode` (CDP) dice qué regla gana.** Es la herramienta que localizó el defecto (e) después de varias hipótesis falsas.
9. **`app/themes_state.json`, `app/config.js` y `app/widgets/*/config.json` son estado del usuario**: no commitearlos a la ligera ni asumir que sus valores son de fábrica.
10. **`widgets/promo` es un symlink de `widgets/shoutout`.** El id canónico para el estado es `promo`; derivarlo de la URL rompe el tema de uno de los dos.

---

## 6. Mapa de ficheros

### Hay que crear

| Ruta | Para qué |
|---|---|
| `app/common/skin.css` | **el binding único**: una declaración por propiedad con la cadena de prioridad. 0 `!important`. Sustituye a `oss-skin.css` |
| `app/common/skin.js` | **el runtime único**: `boot({surface,id})`, `setPack`, `setShape`, `setTheme`, `setOverrides`, `state()`, `previewAttrs(kind)`, `onMessage`. Sustituye a `oss-skin.js` + `widget-theme.js` + `theme-bootstrap.js` + `oss-shape.js` |
| `app/server/services/skin_engine.py` | motor: `load_packs`, `load_themes`, `build_packs_css`, `build_themes_css`, `build_shapes_css`, `build_catalog`, `build_all`, `is_stale`, `sync_if_stale`, `validate` |
| `app/common/generated/packs.css` | `body[data-pack="X"] { --skin-* }` |
| `app/scripts/design_shapes.py` | genera/valida la **pintura** de las 20 formas (no a mano una por una) |

Ya existen y sirven: `app/scripts/skin_schema.py` (contrato de las 5 capas, validadores y `pack_skin_from_archetype`), `app/scripts/migrate_skin_v2.py` (migración idempotente, `--check`), `app/scripts/visual_baseline.py` (arnés visual).

### Hay que modificar

- `app/common/styles.css`: **vaciar** los 4 bloques por arquetipo y sus `!important` de apariencia. Es el desbloqueo real.
- `app/common/oss-skin.css` → pasa a ser `skin.css` (renombrar y actualizar los `<link>` de 35 vistas; el normalizador `app/scripts/normalize_view_links.py` lo hace en bloque).
- Los 21 `app/streamthemes/*/styles/*/style.css`: dejar **solo** `--color-*` y `--theme-glow` → `--color-glow`. La geometría se mueve al pack.
- Los 4 `app/streamthemes/*/pack.json`: `archetype` → `skin` + `typography`; formas con `paint` y `ornaments` como mapa.
- Los 4 `app/streamthemes/*/shapes.css`: quitar toda geometría y todo `background` shorthand. Solo borde, sombra y detalles decorativos.
- Los 6 `app/widgets/*/js/styles.js` y `style.css`: dejar de escribir `border-radius`/`clip-path`/`background` sobre la raíz; usar los tokens.
- `app/alerts/js/alerts-studio/02a-layout-dom.js` y `01-state-data.js`: **borrar el editor de tema legacy** (nombre libre + `BASE_STYLES` vacío + 4 campos de color).
- `app/alerts/js/alerts-studio/06-preview-test.js`: construir el preview con `OSSkin.previewAttrs(kind)`, para que el simulador sea **el mismo** que el real.
- `app/streamthemes/*/overlays/**/index.html` (27): cambiar los 4 `<script>` de tema por el único `skin.js`.
- `app/server/services/{theme_service,theme_manager,components_catalog,overlay_service,fusions_service}.py`: leer el modelo nuevo. Ojo: `theme_service.save_theme` debe escribir `colors`, no `tokens`.

### Hay que borrar (cuando lo nuevo esté verde)

`app/common/oss-skin.css`, `oss-skin.js`, `widget-theme.js`, `theme-bootstrap.js`, `oss-shape.js`, `themes.css`, `generated/archetypes.css`, `archetypes.json`, `server/services/theme_engine.py`.

---

## 7. Verificación obligatoria

```bash
cd app
./venv/bin/python -m pytest tests -q                       # 426 tests, deben seguir verdes
./venv/bin/python scripts/visual_baseline.py --out .backups/visual/antes
# ... cambios ...
./venv/bin/python scripts/visual_baseline.py --out .backups/visual/despues
./venv/bin/python scripts/visual_baseline.py --compare .backups/visual/antes .backups/visual/despues
```

Y para geometría/pintura, medir **estilos computados**, no capturas a ojo:

```python
getComputedStyle(el).borderRadius     # debe ser el de la forma
getComputedStyle(el).clipPath         # polygon(...)
getComputedStyle(el).backgroundImage  # la pintura
document.body.dataset                 # {pack, shape, theme}
```

El arnés tiene 34 superficies (6 widgets + alertas + 27 escenas) y umbral de 2 %. Ojo: el `ticker` y dos escenas tienen animación y se mueven entre capturas (0,1-0,8 %); no es una regresión.

---

## 8. Orden de ejecución (cada paso verde antes del siguiente)

1. **Vaciar `app/common/styles.css`** (4 bloques + `!important` de apariencia). Verificar con el arnés: ~0 % en las 34.
2. **Quitar la geometría de los 21 `style.css`** y regenerar `themes.css`. La geometría pasa a `archetypes.json` / `pack.skin`. Verificar: escenas ~0 %.
3. **Generar `packs.css` + reescribir el binding** `skin.css` con la cadena de prioridad. Verificar: escenas ~0 %.
4. **Runtime único `skin.js`** que fija `data-pack` / `data-shape` / `data-theme` y `previewAttrs`. Migrar primero `timer` (3 `!important`), luego el resto.
5. **Quitar la geometría del CSS inyectado** en `widgets/*/js/styles.js` y el `applyChatShape` del chat.
6. **Alertas y panel**: contrato CSS único; borrar el editor zombi; preview por `previewAttrs`.
7. **Escenas**: los 4 `<script>` → `skin.js`; el normalizador pone los `<link>`.
8. **Diseñar la pintura de las 20 formas** (empezando por `maker_circuit_pcb`): placas, papel, cristal, HUD. Con `paint` en `pack.json`, no con CSS suelto.
9. **Borrar los 9 ficheros viejos** y actualizar los contratos de test que los referencien.
10. **Fusions**: `apply_fusion_pack_batch`, `defaultPack`, y que `export_fusion_as_pack` escriba `skin`/`typography` y un `theme.json` solo de color.

---

## 9. Qué NO hacer

- **No seguir parcheando por capas.** Es lo que se ha hecho hasta ahora: 6 commits, cada uno arreglando el anterior. El usuario lo ha dicho explícitamente: quiere que se haga **de cero**.
- **No usar `!important`** para ganar. Si algo no gana, es que hay deuda que eliminar.
- **No aplicar la migración de manifiestos sola**: `theme_render` deriva `style.css` de `tokens`/`archetype`, así que migrar sin el motor nuevo deja el editor escribiendo un esquema mezclado. Va junto con los pasos 2-4.
- **No diseñar texturas con `repeating-linear-gradient` a 45° + puntos**: parece tela. Una PCB son pistas **ortogonales** con algún giro, pads en los extremos y serigrafía.
- **No pintar en `[data-oss-panel]` sin excluir `[data-oss-bar]`**: las barras de estado de las escenas se llenan de textura. Ya pasó.
- **No tocar** `themes_state.json`, `config.js` ni `widgets/*/config.json`: es estado del usuario.
- **No dar por bueno un cambio visual sin medirlo.** Captura o estilo computado, siempre.

---

## 10. Punto de partida

- Rama `dev`, commit `6f3b14d`, **426 tests verdes**.
- Servidor: `python app/main.py` en `localhost:8080`.
- Lo que el usuario ve hoy: con `maker_circuit_pcb` asignado, los widgets muestran la **esquina cortada** y un borde dorado. No hay placa. Las líneas y puntos que aparecieron en las barras de estado **ya se retiraron**.
- El usuario está frustrado con razón: quiere el sistema rehecho, no otro parche.



