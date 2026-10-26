# Pendientes no bloqueantes — estado 2026-10-26

| Tema | Estado | Evidencia |
|---|---|---|
| T4-seguimiento: recolocación tras primer pintado | **Aplicado estructuralmente** | 27/27 escenas cargan `icons.js`, `dom-injector.js` e `interactive-features.js` como scripts estáticos antes de `overlay.js`; 3 escenas representativas con los tres módulos disponibles; 62 URLs sin excepciones JS ni fallos HTTP. Falta la medición fina 27/27 con fuentes bloqueadas y la prueba visual en OBS. |
| Anexo visual de 16 capturas | **Cerrado** | `docs/ANEXO_VISUAL_16.md` + `docs/audit-visual/` (16 PNG + contact sheet). Sin defectos críticos; D3/D4 quedan como mejoras de contraste. |
| Política de traducciones EN | **Cerrada** | `docs/I18N_POLICY.md` y `docs/I18N_POLICY.en.md`; guías largas marcadas como *abridged* y enlazadas al español. |
| Cinzel no empaquetada | **Cerrado** | `common/fonts/cinzel_variable.ttf` + `@font-face` local + licencia OFL. |
| FPS contradictorio en `gameplay_hud` | **Cerrado** | Telemetría y footer a 60 FPS. |
| `favicon.ico` 404 | **Cerrado** | Responde 200 `image/png`. |
| `?lang=` inerte | **Reservado** | Solo lo aplica `/api/overlays/texts`; documentado en las guías. |
| `?lock=1` sin `?theme=` | **Documentado** | Conserva el comportamiento actual; no se cambia sin decisión de producto. |
| Cambios Git | **Pendiente: push** | El árbol ya está commiteado por bloques (ronda legal + 16 commits de la auditoría V3 / WIP acumulado) y `git status` está limpio. Falta **hacer push**: la rama `main` **no tiene upstream** (`git push -u origin main`). Revisar también la rama `dev`, que quedó desactualizada. |

## Regla

Ninguno de estos puntos bloquea el uso de la app ni el backlog V2. El único que
puede afectar a la percepción visual es T4-seguimiento; su prueba definitiva es
abrir las 27 escenas en OBS a 1920×1080 y comprobar que no hay saltos visibles.
