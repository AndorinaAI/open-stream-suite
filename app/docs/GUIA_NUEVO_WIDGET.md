# Guía: programar un widget nuevo

> **La idea:** un widget **no declara** qué temas, formas ni colores existen.
> El servidor los descubre de disco y los publica; la UI los pinta. Tú solo
> cumples el contrato de abajo.

## Los 5 pasos

```
app/widgets/miwidget/
├── index.html          ← vista para OBS
├── style.css           ← aspecto base, consumiendo tokens
├── config.json         ← estado por defecto ({} vale)
├── widget.js           ← arranque del overlay
└── panel/
    └── 08-save.js      ← controles del panel + registro del módulo
```

### 1. `index.html`

```html
<div id="miwidget-card" data-oss-panel data-oss-shape-target>
  <!-- tu contenido -->
</div>
```

| Atributo | Para qué |
|---|---|
| `data-oss-panel` | El tema pinta el contenedor (fondo, borde, sombra) |
| `data-oss-shape-target` | Las **formas físicas** de los packs se dibujan aquí (clip-path, radios) |

Sin ellos, el widget funciona pero **el tema y las formas no se ven**.

### 2. `style.css`

No pongas colores fijos: usa la cadena de tokens.

```css
.miwidget-card {
  background-color: var(--color-panel-bg, var(--color-bg-dark, #191D21));
  border: 1px solid var(--color-border-cyan, rgba(255,255,255,.16));
  border-radius: var(--skin-panel-radius, var(--panel-radius, 8px));
  font-family: var(--widget-font, var(--skin-font-body, inherit));
}
```

Orden real: **override del usuario → tema del pack → arquetipo → base**.
Sin tema asignado nada cambia, así que tu aspecto base se respeta.

> **Nunca uses el shorthand `background:`** para el fondo del contenedor: resetea
> `background-color` y anula el color del tema. Usa `background-color`.

### 3. `config.json`

```json
{
  "styleOverrides": {}
}
```

`styleOverrides` es opcional; si lo dejas vacío, manda el tema. Las claves
posibles están en `common/widget-overrides.js` (`accentColor`, `bgColor`,
`borderColor`, `fontFamily`…).

### 4. `widget.js`

```js
window.OSSTheme.init('miwidget');
```

Con eso ya recibes tema, forma, tipografía y cambios en vivo
(`theme_change`, `?theme=` en la URL y `postMessage` desde el panel).

### 5. `panel/08-save.js`

```js
window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['miwidget'] = {
  renderControls(container) { /* tus controles */ },
  saveControls()            { /* persistir */ }
};
```

**Sin este registro el panel muestra «Cargando módulo…» para siempre.**
Si dos widgets comparten código (como `promo` y `shoutout`), registra los dos
ids apuntando al mismo objeto.

## Lo que NO tienes que hacer

| Cosa | Por qué |
|---|---|
| Listar los temas | Los publica `/api/themes/packs` desde `streamthemes/` |
| Listar las formas | Salen de `pack.json → shapes[]` |
| Listar los colores | Salen de `theme.json → tokens` |
| Añadir tu widget a una lista | El catálogo lo detecta por directorio |
| Registrar atajos | Opcional: `ShortcutActions.register('miwidget', {...})` |

## Comprobación

```bash
cd app && python scripts/check_widget_contract.py
```

Dice exactamente qué falta. También corre en CI.

## Y un pack nuevo

```
streamthemes/Mi_Pack/
├── pack.json                     { "archetype": "...", "shapes": [ ... ] }
└── styles/mi_tema/
    ├── theme.json                { "archetype": "...", "tokens": { ... } }
    └── style.css                 generado por scripts/regenerate_themes.py
```

Sin tocar código: aparece en el selector de tema, en la paleta y en el catálogo
de formas de **todos** los widgets y alertas.
