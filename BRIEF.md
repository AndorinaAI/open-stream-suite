# Brief — Apariencia en Open Stream Suite

Documento autónomo para que otra IA (con acceso a este repositorio) entienda qué se quiere, qué está roto y por dónde ir. Léelo entero antes de tocar nada.

---

## 0. El producto, en dos líneas

`/home/andorina/Imágenes/twitchoverlay/app` — suite local en Python (aiohttp) + JS vanilla que sirve overlays a OBS. CSS y JS planos, sin build, sin npm.

Cuatro cosas:

- **Escena**: overlay a 1920×1080. Hay **27**, en `app/streamthemes/<Pack>/overlays/**/index.html`.
- **Widget**: overlay independiente. Hay **6**: `chat`, `ticker`, `timer`, `goal`, `promo` (`shoutout` es un symlink del mismo código) en `app/widgets/<id>/`.
- **Alerta**: overlay de eventos de Twitch (**11 tipos**). Un documento, `app/alerts/index.html`, con **dos renderers**: `#alert-card` y `#banner-alert-root`.
- **Pack**: carpeta `app/streamthemes/<Pack>/` con `pack.json`, `styles/<tema>/` y `overlays/`. Hay **4 packs**, **21 temas** y **20 formas**.

Panel de control: `app/alerts/panel.html`.

---

## 1. El modelo correcto (esto es lo que hay que implementar)

**Un pack es un catálogo: sus colores y sus formas.** Nada más.

```
PACK  =  { temas[], formas[] }
```

- **Tema** = colores. Nada de geometría. (`--color-*`)
- **Forma** = la forma: radio, recorte **y su decoración/pintura**. (`--shape-*`)

**La apariencia es el par `(tema, forma)`.** No hay tercera capa, ni arquetipos, ni "skin de pack". Si algo necesita una geometría por defecto, es porque tiene una forma asignada; si no, usa la de por defecto del pack.

### Cómo se asigna

| Caso | Qué se hace |
|---|---|
| Un overlay de un pack | se le asigna un **tema** y/o una **forma**, que pueden ser de **ese pack o de otro** |
| Un widget | igual: `(tema, forma)` |
| Una alerta | igual, por renderer: `alert:card`, `alert:banner` |
| Una **fusión** | es **un pack nuevo hecho con overlays de otros packs**. Se le aplican tema y forma exactamente como a cualquier pack |

**Una fusión no es un mecanismo de apariencia.** Es un **contenedor**: coges overlays de aquí y de allá, los juntas y eso pasa a ser un pack más. A partir de ahí, las reglas son las mismas que para cualquier pack: se le asigna un tema, una forma, o las dos, y se aplican de forma normal. No hay operaciones especiales de "aplicar a los miembros de la fusión": es aplicar a un pack.

Si hace falta materializarla, `export_fusion_as_pack` la convierte en una carpeta real de `streamthemes/` con su `pack.json` y sus overlays.

Un overlay suelto puede coger la apariencia de otro pack sin pertenecer a él: eso sí es una asignación normal, sin contenedor de por medio.

### Qué implica técnicamente

- Dos familias de tokens: `--color-*` (tema) y `--shape-*` (forma). Más `--widget-*` para el ajuste manual del usuario.
- **Un** binding CSS que las consume en cadena de prioridad: `--widget-*` > `--shape-*` > `--color-*` > base.
- **Cero `!important`** en propiedades de apariencia.
- El color y la forma **no se tocan entre sí**: la forma nunca escribe color de fondo, y el tema nunca escribe geometría.

### Regla de reparto (la clave para que sea portable)

| Propiedad | La escribe |
|---|---|
| `background-color`, `color`, `border-color` base | el **tema** |
| `border-radius`, `clip-path` | la **forma** |
| `background-image`, `box-shadow` de la decoración | la **forma** |
| lo que el usuario toque a mano | `--widget-*` |

Así «PCB + tema terminal» y «PCB + tema sakura» funcionan los dos: la placa se queda, el color cambia.

### Lo que hay que eliminar conceptualmente

Todo lo que hoy funciona como una **tercera** capa de estilo y no es ni tema ni forma:

- `common/archetypes.json` y `generated/archetypes.css` (arquetipos: `cozy`, `gamer`, `maker`, `openstream`).
- La familia `--skin-*` completa.
- El atributo `data-theme-archetype`.
- `common/oss-skin.css` como capa aparte: su contenido se reduce a las dos familias + la cadena de prioridad.

Si un pack necesita una geometría por defecto, se expresa con su **forma por defecto** (`defaultShape`), no con un arquetipo.

---

## 2. Criterios de aceptación

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Elegir **forma PCB** en un widget | placa de circuito: pistas de cobre **ortogonales** con algún giro a 45°, pads en los extremos, serigrafía, esquina cortada. No una retícula genérica |
| 2 | Cambiar el **tema** con el PCB puesto | cambia el color; **la placa sigue** |
| 3 | Elegir una forma | **no** cambia el tema |
| 4 | Asignar a una escena de `Cozy` un **tema** de `Gamer` | cambia el color, la geometría no se mueve |
| 5 | Asignar a una escena de `Cozy` una **forma** de `Gamer` | cambia la forma, el color no se mueve |
| 6 | **Fusión** de miembros de 3 packs | todos con la **misma** apariencia, y se puede cambiar en un solo sitio |
| 7 | **Previsualización** en el panel | idéntica a lo que sale en OBS |
| 8 | Alerta (card y banner) | reacciona a tema y forma igual que un widget |

---

## 3. Inventario de superficies y hooks

| Superficie | Documento(s) | Hooks que ya existen |
|---|---|---|
| Widgets (6) | `app/widgets/<id>/index.html` | `data-oss-panel`, `data-oss-shape-target`, 3 `.oss-ornament` |
| Alertas | `app/alerts/index.html` | `#alert-card`, `#banner-alert-root`, ambos `data-oss-panel` |
| Panel | `app/alerts/panel.html` | el simulador construye su propio `.banner-alert-root` |
| Escenas (27) | `app/streamthemes/*/overlays/**/index.html` | 44 `data-oss-panel`, 36 `data-oss-bar`, 26 `data-oss-cam`, 24 `data-oss-cam-label`, 22 `data-oss-badge` |

**Las 27 escenas ya llevan los hooks**: no hay que tocar su HTML para que sean portables. Eso está verificado.

Claves de estado: `widget:<id>`, `alert:card`, `alert:banner`, y las claves de escena de `themes_state.json → overlayThemes` / `overlayShapes`.

---

## 4. Qué está roto hoy (medido, no supuesto)

Punto de partida: rama `dev`, commit `6f3b14d`. **426 tests en verde.** Hay arnés visual.

### 4.1 Lo que ya funciona

- Los 6 widgets **conservan** tema y forma al arrancar (antes los borraban en cada carga).
- El **simulador de alertas del panel** tiene fondo (antes era transparente: `panel.html` no cargaba `alerts-widget.css`).
- `shoutout` recibe su tema (antes leía `widget:shoutout`, una clave que no existe).
- El PCB **gana la geometría** en los 5 widgets: `border-radius: 0`, `clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), …)`.

### 4.2 Lo que no funciona, y por qué

**(a) La forma casi no tiene contenido.** `pack.json → shapes[]` solo admite `panelRadius`, `panelClipPath` y una lista de ornamentos vetados. **No hay campo de decoración/pintura.** 19 de las 20 formas no pintan nada. El PCB es solo una esquina cortada.

**(b) Los temas llevan geometría dentro.** Cada `styles/<tema>/style.css` declara `--frame-*`, `--panel-*`, `--badge-*`, `--header-*`. Y `common/themes.css` se genera **desde esos `style.css`** (`theme_manager.sync_common_themes_css`), no desde `theme.json`. Por eso el tema pisa a la forma. **Es el defecto central.**

**(c) Existe una tercera capa de estilo que no debería existir**: arquetipos (`archetypes.json`, `--skin-*`, `data-theme-archetype`). Es justo lo que hay que quitar. Convive con `styles.css`, que además tiene **100 `!important`** y cuatro bloques hardcodeados por arquetipo.

**(d) Cada widget inyecta CSS en runtime** desde `app/widgets/<id>/js/styles.js` (p. ej. `chat/js/styles.js:132-152` escribe `border-radius: … !important`). Se aplica al final y gana a todo. El chat además tiene su propio sistema de forma (`ChatStyles.applyChatConfig()`) que se ejecuta **después** y reescribe la forma.

**(e) La decoración de los packs contradice a sus manifiestos.** En `Maker_Theme_Pack/shapes.css` había `border-radius: 4px !important; clip-path: none !important` mientras `pack.json` decía `panelRadius: 0`. Ganaba la decoración. Corregido para el PCB; **el patrón se repite en los 4 packs**.

**(f) El editor de tema de alertas es UI zombi.** `alerts-studio/01-state-data.js:70` tiene `BASE_STYLES: []`; `02a-layout-dom.js:185-187` pinta un `<select>` con ese array vacío y un `<input>` de texto libre. Escribe 12 claves en `alerts_config.json` que **nadie lee** (solo `bannerAccentColor`, en `03-alert-queue.js:126`).

**(g) Cada superficie carga un conjunto distinto de CSS.** El panel cargaba `themes.css` dos veces y no cargaba `alerts-widget.css`. Corregido, pero no hay contrato único.

**(h) El simulador del panel no recibe la forma.** `06-preview-test.js` inyecta `data-theme` y `data-theme-shape` **en el `<div>`**, y las reglas exigen `body[...]`.

---

## 5. Trampas que ya costaron horas

1. **`!important` gana siempre a cualquier especificidad.** No se compensa: se elimina.
2. **El shorthand `background` resetea `background-image`.** Usa `background-color`, `background-image`, `background-size`… por separado, o borras la decoración de la forma.
3. **Un comentario CSS mal cerrado hace que el navegador descarte la regla entera, en silencio.** Pasó dos veces en `oss-skin.css`. Valida el balance de `/* */`.
4. **`common/themes.css` se genera desde `style.css`, no desde `theme.json`.** Si solo migras los JSON no cambia nada visible.
5. **`theme.json.tokens` es una copia paralela** de `style.css`. Hay que tratar los dos.
6. **`theme_service.save_theme` reescribe `theme.json` con `tokens`/`archetype`**: revierte cualquier migración al primer guardado del panel.
7. **Playwright 1.64.1 + Chrome están instalados** en `app/venv`. Mide estilos computados; no adivines.
8. **`CSS.getMatchedStylesForNode` (CDP) dice qué regla gana.** Es lo que localizó el defecto (e) tras varias hipótesis falsas.
9. **`themes_state.json`, `config.js` y `widgets/*/config.json` son estado del usuario.** No commitear a la ligera.
10. **`widgets/promo` es un symlink de `widgets/shoutout`.** El id canónico es `promo`; derivarlo de la URL rompe uno de los dos.
11. **Dibujar una PCB**: nada de `repeating-linear-gradient` a 45° + puntos (parece tela). Pistas ortogonales, algún giro, pads en los extremos, serigrafía.
12. **No pintar `[data-oss-panel]` sin excluir `[data-oss-bar]`**: las barras de estado de las escenas se llenan de textura. Ya pasó.

---

## 6. Mapa de ficheros

### Crear

| Ruta | Para qué |
|---|---|
| `app/common/skin.css` | **el binding único**. Una declaración por propiedad, con la cadena `--widget-* > --shape-* > --color-* > base`. Cero `!important`. Sustituye a `oss-skin.css` |
| `app/common/skin.js` | **el runtime único**: `boot({surface,id})`, `setShape(id)`, `setTheme(id)`, `setOverrides(map)`, `state()`, `previewAttrs(kind)`, `onMessage`. Sustituye a `oss-skin.js` + `widget-theme.js` + `theme-bootstrap.js` + `oss-shape.js`. **`setShape` no puede tocar el tema, ni al revés** |
| `app/server/services/skin_engine.py` | generador: `build_themes_css()` (solo `--color-*`), `build_shapes_css()` (geometría + `--shape-paint*` + ornamentos), `build_catalog()`, `build_all()`, `is_stale()`, `sync_if_stale()`, `validate()` |
| `app/scripts/design_shapes.py` | genera/valida la **decoración** de las 20 formas desde los datos del pack |

Ya existen y sirven: `app/scripts/visual_baseline.py` (arnés de 34 superficies).

### Modificar

- `app/common/styles.css`: **quitar** los 4 bloques `body[data-theme-archetype=…]` y sus `!important` de apariencia.
- Los **21** `app/streamthemes/*/styles/*/style.css`: dejar **solo** `--color-*` (y el glow como color). La geometría se va.
- Los **4** `app/streamthemes/*/pack.json`: quitar `archetype`; las formas ganan `paint` y `ornaments` como mapa `{nombre: display}`; conservar `defaultTheme`/`defaultShape`.
- Los **4** `app/streamthemes/*/shapes.css`: quitar **toda** geometría y todo `background` shorthand. Solo detalles decorativos que no sean forma.
- Los **6** `app/widgets/*/js/styles.js` y `style.css`: no escribir `border-radius`/`clip-path` sobre la raíz; usar `--shape-*`.
- `app/alerts/js/alerts-studio/{02a-layout-dom,01-state-data}.js`: **borrar el editor de tema legacy** (nombre libre + `BASE_STYLES` + 4 campos de color) y las 12 claves muertas de `alerts_config.json`.
- `app/alerts/js/alerts-studio/06-preview-test.js`: construir el preview con `OSSkin.previewAttrs(kind)`, para que el simulador sea el mismo que el real.
- Los **27** `app/streamthemes/*/overlays/**/index.html`: los 4 `<script>` de tema → el único `skin.js`. Los `<link>` los pone `app/scripts/normalize_view_links.py`.
- `app/server/services/theme_service.py` (y `theme_manager`, `components_catalog`, `overlay_service`, `fusions_service`): leer el modelo nuevo. `save_theme` debe escribir **colores**, no `tokens`/`archetype`.
- `app/server/services/fusions_service.py`: una fusión **es un pack** cuyos overlays vienen de otros packs. No necesita operaciones de apariencia propias: aplicar tema o forma a una fusión es aplicar a un pack. `export_fusion_as_pack` debe materializarla como carpeta real de `streamthemes/` con su `pack.json` (sus `shapes[]` y su `defaultTheme`/`defaultShape`) y los overlays enlazados o copiados.

### Borrar (cuando lo nuevo esté verde)

`app/common/archetypes.json`, `app/common/generated/archetypes.css`, `app/common/oss-skin.css`, `app/common/oss-skin.js`, `app/common/widget-theme.js`, `app/common/theme-bootstrap.js`, `app/common/oss-shape.js`, `app/common/themes.css` (se regenera), `app/server/services/theme_engine.py`.

---

## 7. Verificación (obligatoria, no opcional)

```bash
cd app
./venv/bin/python -m pytest tests -q          # 426 tests: deben seguir verdes
./venv/bin/python scripts/visual_baseline.py --out .backups/visual/antes
# ... cambios ...
./venv/bin/python scripts/visual_baseline.py --out .backups/visual/despues
./venv/bin/python scripts/visual_baseline.py --compare .backups/visual/antes .backups/visual/despues
```

Y para forma/color, **estilos computados**, no capturas a ojo:

```python
getComputedStyle(el).borderRadius      # el de la forma
getComputedStyle(el).clipPath          # polygon(...)
getComputedStyle(el).backgroundImage   # la decoración de la forma
getComputedStyle(el).backgroundColor   # el del tema
document.body.dataset                  # {shape, theme}
```

El arnés tiene 34 superficies y umbral del 2 %. El `ticker` y dos escenas se mueven por animación (0,1-0,8 %): no es regresión.

**Prueba de fuego del modelo**, en este orden:

1. Aplicar PCB a un widget → `radius 0`, `clip-path` con esquina cortada, `background-image` con la placa.
2. Cambiar solo el tema → `backgroundColor` cambia; `borderRadius`/`clipPath`/`backgroundImage` **no se mueven**.
3. Cambiar solo la forma → `backgroundImage` cambia; `backgroundColor` **no se mueve**.
4. Elegir forma → el tema del selector **no cambia**.
5. Escena de `Cozy` + tema de `Gamer` → color cambia, geometría igual.
6. El simulador del panel mide **lo mismo** que la página real.

---

## 8. Orden de ejecución

Cada paso termina en verde y verificado.

1. **Quitar la tercera capa**: borrar arquetipos (`archetypes.json`, `archetypes.css`, `--skin-*`, `data-theme-archetype`) y los 4 bloques de `styles.css`. Arnés: ~0 %.
2. **Quitar la geometría de los 21 `style.css`** y regenerar `themes.css`. Arnés: escenas ~0 %.
3. **`skin.css`** con la cadena de prioridad de dos familias. Arnés: ~0 %.
4. **Dar contenido a las formas**: `paint` en `pack.json` + emisión de `--shape-paint*`. Empezar por PCB, `cozy_polaroid`, `gamer_mecha`, `openstream_glass`.
5. **`skin.js`** (runtime único) y quitar la geometría del CSS inyectado de los 6 widgets y del `applyChatShape` del chat.
6. **Alertas y panel**: contrato CSS único, editor zombi fuera, preview por `previewAttrs`.
7. **Escenas**: scripts → `skin.js`.
8. **Fusions**: tratarlas como packs de overlays ajenos. Aplicar tema/forma es la operación normal de pack; `export_fusion_as_pack` materializa la carpeta. Quitar las operaciones especiales por capas (`apply_fusion_theme_batch`, `apply_fusion_shape_batch`, `defaultPack`) si solo duplican lo que ya hace un pack.

---

## 9. Qué NO hacer

- **No añadir capas.** Son dos ejes: tema (color) y forma (forma). El pack es el catálogo, no un estilo.
- **No usar `!important`** para ganar.
- **No "arreglar" un tema metiéndole geometría**, ni una forma metiéndole colores de fondo.
- **No parchear por encima**: los 6 commits anteriores a este brief fueron parches sucesivos y el resultado no le sirve al usuario.
- **No tocar** `themes_state.json`, `config.js`, `widgets/*/config.json`: es estado del usuario.
- **No dar por bueno un cambio visual sin medirlo.**

---

## 10. Punto de partida

- Rama `dev`, commit `6f3b14d`, **426 tests verdes**, árbol limpio.
- Servidor: `python app/main.py` → `localhost:8080`.
- Hoy, con PCB asignado, los widgets muestran **solo la esquina cortada** y borde dorado. No hay placa. La textura de líneas y puntos que apareció en las barras de estado **ya se retiró**.
- El usuario quiere el sistema rehecho con este modelo, no otro parche.



