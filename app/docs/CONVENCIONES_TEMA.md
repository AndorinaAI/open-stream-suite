
---

## Un tema = un `theme.json` (2026-10-30)

`theme.json` es la **unica fuente** de un tema. Todo lo demas es derivado y lo
genera `server/services/theme_render.py`:

```
theme.json ──theme_render──► style.css ──sync_common_themes_css──► common/themes.css
```

| Fichero | Lo edita | Se genera |
|---|---|---|
| `theme.json` | persona / panel / API | — |
| `style.css` | **nadie** | desde `theme.json` |
| `theme.default.json` | **nadie** (snapshot de fabrica) | al crear el tema |
| `style.default.css` | **nadie** | desde `theme.default.json` |

### Campos

- `tokens`: mapa exacto de tokens CSS (`--color-*`, `--frame-*`, `--panel-*`,
  `--badge-*`, `--header-*`, `--theme-glow`). Es lo que se emite.
- `colors` / campos planos (`accentCyan`, `bgDark`...): vista del mismo dato para
  el editor; `apply_color_fields` los vuelca en `tokens`.
- `cssExtra`: CSS libre (animaciones, reglas propias). Se concatena al final.
- `archetype`: obligatorio.

### Herramientas

```bash
python scripts/regenerate_themes.py            # theme.json -> style.css
python scripts/regenerate_themes.py --check    # CI: falla si hay diferencias
python scripts/normalize_view_links.py --check # CI: bloque <link> de las 35 vistas
python scripts/build_theme_engine.py           # manifiesto de formas/arquetipos
```

### Precedencia

`forma fisica > arquetipo > tema > base > override del usuario`

- CSS: `var(--skin-*, var(--tema-*, base))`. El token del arquetipo es el
  **primer** fallback, asi que gana sin `!important`.
- Cliente: `config.js.themeCatalog` publica packs, defaults, arquetipo de cada
  forma y textos de atmosfera. `overlay.js` no tiene listas propias: un pack o
  un tema nuevos aparecen solos.
