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

## Ajuste fino de contraste (auditoría visual 1.0.2)

Medido con Chrome headless a 1920×1080 **simulando OBS** (`window.obsstudio`), 132
cargas = 27 escenas + 5 widgets + alertas × 4 packs (uno por pack). Tras los arreglos
de la 1.0.2 quedan **8 selectores** entre 2,0:1 y 4,3:1. No bloquean nada —el resto de
etiquetas quedaron por encima de 4,5:1— pero conviene revisarlos en la pasada de
diseño, porque el valor depende del fondo concreto de cada escena.

| Selector | Peor ratio | Escena / tema | Nota |
|---|---|---|---|
| `[data-text-key="channel.tagline"]` | 2,04:1 | varias escenas con `chill` | Sobre el papel marfil del polaroid da 4,2:1 (correcto); sobre fondo oscuro cae. Decidir tono por escena o añadir placa. |
| etiqueta con estilo en línea `var(--color-accent-orange)` | 1,97:1 | `Gamer_Pro_Pack/overlays/screens/ending`, `victory_clutch` con `neon_streamer` | Ese pack define `--color-accent-orange: #7928CA`; usar `--color-accent-cyan` o el token de texto claro. |
| `.corner-reticle` («[+]») | 2,71:1 | `ending` con `neon_streamer` | Decorativo (mira de esquina); solo si se quiere legible. |
| `.goal-item-title`, `.goal-pct` | 4,28:1 | widget `goal` con `chill` | Justo por debajo del umbral AA; subir un punto el token de texto. |
| `.metric-chip-icon.color-paypal`, `.metric-chip-value.color-paypal` | 3,93:1 | widget `ticker` con `chill` | El azul de PayPal está fijado por marca; aclarar el tono conservando el color. |

Reproducir: Chrome headless (o Playwright) sirviendo `app/` en local, con
`window.obsstudio` simulado y `?theme=<id>&lock=1`, midiendo color de texto, fondo
compuesto y ratio WCAG.

---



Ninguno de estos puntos bloquea el uso de la app ni el backlog V2. El único que
puede afectar a la percepción visual es T4-seguimiento; su prueba definitiva es
abrir las 27 escenas en OBS a 1920×1080 y comprobar que no hay saltos visibles.
