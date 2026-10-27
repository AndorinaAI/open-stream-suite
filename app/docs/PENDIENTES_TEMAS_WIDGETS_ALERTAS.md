# Pendientes — Sistema de temas, widgets y alertas

> Alcance: sistema de temas y su integración nativa con widgets y alertas de panel, más convenciones.
> Auditoría desde disco + runtime. Estado tras los arreglos de esta ronda.
> **Auditoría completa vigente:** `PENDIENTES_SISTEMA_TEMAS.md`. H1–H10 y el backlog M1–M13/L1–L8 están cerrados (2026-10-23); el E2E vive en `app/tests/e2e_theme_backlog.py`.

## 0. Estado

| # | Hallazgo | Estado |
|---|---|---|
| 2.1 | La forma no se aplicaba en vivo a widgets | ✅ Resuelto: `widget_theme_change` aplica tema y forma; chat usa `ChatStyles.applyChatConfig()` |
| 2.2 | El reset dejaba `data-theme-shape` obsoleto | ✅ Resuelto: reset limpia tema, forma y `OSS_WIDGET_SHAPE` |
| 2.3 | El tema global pisaba la asignación | ✅ Resuelto: `overlayThemeExplicit` + `globalThemeActive`; escena/widget/alerta respetan su asignación y el reset libera el global |
| 2.4 | Cobertura de tokens superficial | ✅ Paleta, fondos y textos tokenizados; roles/sombras permanecen estables |
| 2.5 | Presets de chat tapaban el tema de pack | ✅ Resuelto: `body:not([data-theme]).theme-*` |
| 2.6 | Rama WS del timer sin `return` | ✅ Resuelto |
| 2.7 | Boot duplicado en 6 widgets | ✅ Resuelto: `common/widget-theme.js` (`OSSTheme`) |
| 2.8 | Sin reset individual | ✅ Resuelto: `POST /api/themes/reset-assignment` + UI |
| 2.9 | Evento sin metadatos | 🟡 Enviado `archetype`; `pack` no se incluye (ningún widget lo consume) |
| 3.1 | Sin selector de tema/forma por widget | ✅ Resuelto: bloque «Temas de componentes» |
| 3.2 | Sin tema de pack por alerta | ✅ Resuelto: mismas filas para `alert:card` / `alert:banner` |
| 3.3 | Sin reset por componente | ✅ Resuelto (botón por fila) |
| 3.4 | Fusión: miembros no visibles/quitables | ✅ Resuelto: chips + quitar; ➕ añadir a fusión desde el bloque de temas |
| 3.5 | Formas: soporte no indicado | ✅ Resuelto: widgets (9) y alertas (29: 9 genéricas + 20 de pack) muestran su selector; no quedan componentes sin formas |
| 3.6 | Fallo silencioso del catálogo | ✅ Resuelto: mensaje de error visible |
| 2.10 | Solo llegaban los colores del pack, no su aspecto | ✅ Resuelto: `config.js` publica `themeArchetypes` (derivado de disco) y `common/oss-skin.js` pone `data-theme-archetype` en el body; `common/oss-skin.css` consume la familia `--skin-*` (+ marco, halo y textura) en los selectores universales |
| 2.11 | La decoración del tema se perdía en varios widgets | ✅ Resuelto: la capa usa `!important` **solo** en marco y decoración (varios widgets aplican su look con CSS inyectado o estilos en línea); el radio nunca, para no bloquear las formas físicas |
| 3.7 | Las alertas ignoraban `?theme=`/`?shape=` de la URL | ✅ Resuelto: `02b-alert-shapes.js` registra la URL como asignación explícita y respeta `?lock=1`/`?lockTheme=1`; `04-ws-client.js` no pisa una fuente bloqueada |
| 4 | Tests/documentación | ✅ 30 suites (`test_component_skin_contract.py` nueva) + E2E; guías ES/EN con la convención de skin de componentes |

## 1. Límites intencionales (no son bugs)

- **Formas**: los widgets admiten las 9 formas genéricas (`common/oss-shape.js`); las alertas
  admiten 29 (9 genéricas + 20 físicas de pack, reutilizando `[data-oss-panel]` + `body[data-theme-shape]`).
- **Banners**: con tema de pack, fondo (degradado), borde, sombra y textos salen de tokens; sin tema
  se conservan los presets.
- **Colores de rol y sombras**: error/éxito/Twitch y sombras decorativas no se tokenizan; deben
  permanecer estables.
- **`!important` heredado** en CSS de widgets: se mantiene donde protege layout; las capas de tema
  no lo usan, con **una excepción documentada**: `common/oss-skin.css` lo usa solo en marco y
  decoración, porque varios widgets aplican su aspecto con CSS inyectado o estilos en línea y sin
  ello la apariencia asignada se perdía. El radio del arquetipo nunca lo lleva (las formas ganan) y
  `tests/test_component_skin_contract.py` fija ambas reglas.
- **Previsualización del panel**: el escenario de pruebas del panel (`#preview-stage`) simula la
  alerta con sus propios colores en línea y no recibe `data-theme-archetype`, así que no muestra el
  skin del pack como OBS. Es una decisión de diseño pendiente, no un fallo del overlay real.

## 2. Deuda técnica opcional (sin impacto funcional)

- `window.OSS_WIDGET_ID` / `window.OSS_WIDGET_SHAPE` siguen existiendo por compatibilidad con chat;
  encapsulados por `OSSTheme` pero visibles.
- Los E2E son scripts locales (no están integrados en CI).
- `pack` no viaja en `widget_theme_change`; añadirlo requeriría resolver tema→pack en el servicio.

## 3. Criterios de aceptación (verificados)

- Forma aplicada desde panel/fusión se ve sin recargar y el reset deja el widget como estaba.
- Un widget/alerta con asignación no cambia al aplicar un tema global.
- Textos, fondos y bordes principales provienen de tokens con fallback.
- UI para asignar tema/forma y resetear widgets y alertas sin pasar por una fusión.
- Tests en verde y E2E de comportamiento sin fallos.
