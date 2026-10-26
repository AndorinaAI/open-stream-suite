# Anexo visual — 16 capturas de escenas (1920×1080)

> **Fecha de revisión:** 2026-10-24 · **Fuente:** capturas CDP de la auditoría
> de temas/escenas (`oss_shots/`, 16 PNG). **Contact sheet:**
> [`audit-visual/contact_sheet.png`](audit-visual/contact_sheet.png).

## Resultado

Revisión visual asistida de las 16 capturas: **sin solapamientos, recortes
críticos, elementos fuera de marco ni fondos opacos que oculten información**.
No se detectaron defectos visuales nuevos que bloqueen OBS.

Se mantienen como mejoras de acabado, no como fallos:

- **D3 — `maker_desk`:** el subtítulo y el texto `SUPER ESTACION MAKER 2026`
  tienen contraste mejorable y están cerca del borde; no hay recorte medido.
- **D4 — `cozy_art_dual_cam`:** la barra lateral es parte del diseño (paleta
  dentro de la columna de lienzo); el contraste de la insignia es mejorable.
- **C8 — `gameplay_hud`:** se corrigió el FPS contradictorio; ahora muestra
  `60` de forma coherente.
- **C5 — `Cinzel`:** se empaquetó la fuente local en `common/fonts/` para que
  las formas fantasía/gótico no dependan de una fuente instalada en el sistema.

## Capturas

| # | Archivo | Escena | Estado |
|---|---|---|---|
| 01 | [`01_maker_desk_native.png`](audit-visual/01_maker_desk_native.png) | Maker Desk, tema nativo | Correcta |
| 02 | [`02_maker_desk_fusion.png`](audit-visual/02_maker_desk_fusion.png) | Maker Desk, fusión | Correcta |
| 03 | [`03_maker_game_cyber.png`](audit-visual/03_maker_game_cyber.png) | Maker Game, estilo cyber | Correcta |
| 04 | [`04_maker_chill.png`](audit-visual/04_maker_chill.png) | Maker Chill | Correcta |
| 05 | [`05_oss_just_chatting.png`](audit-visual/05_oss_just_chatting.png) | Open Stream, Just Chatting | Correcta |
| 06 | [`06_oss_podcast.png`](audit-visual/06_oss_podcast.png) | Open Stream, Podcast | Correcta |
| 07 | [`07_gamer_gameplay.png`](audit-visual/07_gamer_gameplay.png) | Gamer Gameplay HUD | Correcta; FPS corregido |
| 08 | [`08_gamer_speedrun.png`](audit-visual/08_gamer_speedrun.png) | Gamer Speedrun | Correcta |
| 09 | [`09_gamer_victory.png`](audit-visual/09_gamer_victory.png) | Gamer Victory & Clutch | Correcta |
| 10 | [`10_cozy_art_dual.png`](audit-visual/10_cozy_art_dual.png) | Cozy Art Dual Cam | Correcta; contraste de insignia mejorable |
| 11 | [`11_cozy_pomodoro.png`](audit-visual/11_cozy_pomodoro.png) | Cozy Pomodoro | Correcta |
| 12 | [`12_cozy_cafe.png`](audit-visual/12_cozy_cafe.png) | Cozy Café Chat | Correcta |
| 13 | [`13_gamer_starting.png`](audit-visual/13_gamer_starting.png) | Gamer Starting Soon | Correcta |
| 14 | [`14_cozy_coffee_break.png`](audit-visual/14_cozy_coffee_break.png) | Cozy Coffee Break | Correcta |
| 15 | [`15_oss_brb.png`](audit-visual/15_oss_brb.png) | Open Stream Be Right Back | Correcta |
| 16 | [`16_maker_print_machine.png`](audit-visual/16_maker_print_machine.png) | Maker Print Machine | Correcta |

## Límites de esta revisión

- Las capturas son de la sesión de auditoría, no una grabación continua de OBS.
- No se afirma que todos los textos tengan el contraste WCAG AAA; las
  observaciones D3/D4 quedan como mejoras de acabado.
- La prueba definitiva sigue siendo abrir cada escena en OBS Browser Source a
  1920×1080 con la cámara real.
