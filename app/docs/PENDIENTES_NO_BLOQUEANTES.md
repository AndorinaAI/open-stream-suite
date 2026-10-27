# Pendientes no bloqueantes — estado 2026-10-26

| Tema | Estado | Evidencia |
|---|---|---|
| T4-seguimiento: recolocación tras primer pintado | **Aplicado estructuralmente** | 27/27 escenas cargan `icons.js`, `dom-injector.js` e `interactive-features.js` como scripts estáticos antes de `overlay.js`; 3 escenas representativas con los tres módulos disponibles; 62 URLs sin excepciones JS ni fallos HTTP. Falta la medición fina 27/27 con fuentes bloqueadas y la prueba visual en OBS. |
| Anexo visual de 16 capturas | **Cerrado** | `docs/ANEXO_VISUAL_16.md` + `docs/audit-visual/` (16 PNG + contact sheet). Sin defectos críticos; D3/D4 quedan como mejoras de contraste. |
| Política de traducciones EN | **Cerrada** | `docs/I18N_POLICY.md` y `docs/I18N_POLICY.en.md`; guías largas marcadas como *abridged* y enlazadas al español. |
| Cinzel no empaquetada | **Cerrado** | `common/fonts/cinzel_variable.ttf` + `@font-face` local + licencia OFL. |
| FPS contradictorio en `gameplay_hud` | **Cerrado** | Telemetría y footer a 60 FPS. |
| `favicon.ico` 404 | **Cerrado** | Responde 200 `image/png`. |
| `?lang=` inerte | **Arreglado** (2026-10-26) | `common/overlay.js` ya envía el idioma a `/api/overlays/texts?lang=…` (antes lo pedía **sin** él, así que la escena seguía en español) y lo toma de `?lang=` o de `oss-lang`; el evento `overlay_texts_update` en vivo no revierte una escena en inglés. Suite `tests/test_overlay_lang_param.py`. |
| `?lock=1` sin `?theme=` | **Documentado** | Conserva el comportamiento actual; no se cambia sin decisión de producto. |
| Cambios Git | **Pendiente: push** | El árbol ya está commiteado por bloques (ronda legal + 16 commits de la auditoría V3 / WIP acumulado) y `git status` está limpio. Falta **hacer push**: la rama `main` **no tiene upstream** (`git push -u origin main`). Revisar también la rama `dev`, que quedó desactualizada. |

## Contraste: estado tras los arreglos (auditoría visual 1.0.2)

Medido con Chrome headless a 1920×1080 **simulando OBS** (`window.obsstudio`), 132
cargas = 27 escenas + 5 widgets + alertas × 4 packs (uno por pack). Resuelto en la
1.0.2 con tokens derivados en el compilador de `common/themes.css`:

- `--color-accent-cyan-text` / `--color-accent-orange-text`: acento aclarado lo justo
  para usarse como **texto** sobre el panel (los packs con acento oscuro, como el
  `#7928CA` de `neon_streamer`, ya no caen a 2:1). Se aplica en 33 usos de escenas,
  widgets y panel.
- `--color-on-accent-cyan` / `--color-on-accent-orange`: **tinta** correcta sobre una
  placa maciza del acento (badges `.ticker-tag`, `.timeout-badge`, `.match-badge`),
  derivada por tema según la luminancia del acento.
- `common/oss-contrast.js`: los **colores configurables** de los widgets (paletas de
  metas, azul de PayPal, Ko-fi…) se aclaran lo justo para llegar a 4,5:1 conservando
  el tono elegido. Medido: metas 4,28→4,60 y PayPal 3,93→5,01.
- Tagline (`[data-text-key="channel.tagline"]`): token atenuado del tema sobre fondo
  oscuro y tinta sobre el papel marfil del polaroid (4,2:1, correcto).

**Único resto documentado** (no bloqueante): las etiquetas que caen sobre **placas
anidadas tintadas** (p. ej. `// HASTA LA PRÓXIMA` en las escenas Gamer) quedan en
**3,3:1**, por encima del umbral AA de texto grande y con sombra de seguridad añadida.
Para subirlas a 4,5:1 habría que cambiar el diseño de esa placa concreta (decisión de
diseño, no un fallo).

Reproducir: Chrome headless (o Playwright) sirviendo `app/` **en el puerto de la app**
(el WebSocket valida el origen), con `window.obsstudio` simulado y `?theme=<id>&lock=1`,
midiendo color de texto, fondo compuesto y ratio WCAG.

---



Ninguno de estos puntos bloquea el uso de la app ni el backlog V2. El único que
puede afectar a la percepción visual es T4-seguimiento; su prueba definitiva es
abrir las 27 escenas en OBS a 1920×1080 y comprobar que no hay saltos visibles.
