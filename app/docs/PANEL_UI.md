# Mapa de la interfaz del panel

## Widgets (`#sec-widgets`)

| Dónde | Qué hace |
|---|---|
| Acordeón **Guía (3 pasos)** | Cómo poner un widget en OBS. Cerrado por defecto. |
| Cuadrícula de tarjetas | Una por widget. Cada una muestra `Tema: … · Forma: …` y un botón **🎨 Tema**. |
| Botón **🎨 Tema** | Abre el acordeón **Tema del pack** y resalta la fila de ese widget. |
| Acordeón **Tema del pack** (debajo de la cuadrícula) | Asigna tema del pack + forma física a cada widget. **Manda** sobre el «estilo base». |
| Botón **📋 Copiar URL** | Copia la URL para OBS (toast, no `alert`). |
| Mini-app | Controles del widget. Dentro, «Estilo base del widget» y «Forma del mensaje» solo se aplican **si no hay tema del pack**. |

### Precedencia

```
forma física > arquetipo > tema del pack > estilo base del widget > overrides del usuario
```

## Alertas (`#sec-alerts`, montado por `AlertsStudio`)

| Dónde | Qué hace |
|---|---|
| Tarjeta **«Alerta de «X» activa»** | Activa/desactiva **ese** tipo. Si se desactiva, deja de dispararse en OBS y en el panel; **no** borra la configuración. |
| Acordeón **Tema del pack** | Tema + forma de la tarjeta y el banner. Manda sobre el estilo de la alerta. |
| **Estilo de la alerta** | Aspecto propio (presets + editor). Solo se usa si **no** hay tema del pack. |
| **Probar en OBS** | Lanza una prueba del tipo activo (deshabilitado si la alerta está desactivada). |
| **Guardar configuración** | Envía **todas** las alertas y limpia el aviso de cambios sin guardar. |

## Feedback y estado

- `alerts/js/ui-feedback.js` expone `window.UI`: `showToast`, `confirmAction`
  (un solo diálogo; doble clic no duplica), `markDirty`/`clearDirty`/
  `clearDirtyScope`, `renderStatusChip`, `bindLabel`, `setPressed`.
- El punto naranja de una pestaña significa **cambios sin guardar**.
- Las confirmaciones destructivas usan `UI.confirmAction` con el nombre del objeto.

## Deuda conocida

- **Botones que solo llevan un emoji y no tienen `title`**: se les puede poner
  `aria-label` (el test solo exige que los que tienen `title` lo expongan).
- **5 `<label>` sin asociar**: no tienen un control con `id` cerca; requieren
  revisión manual para saber a qué campo pertenecen.
