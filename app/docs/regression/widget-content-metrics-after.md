# Evidencia de regresión — Fase 5 (contenido de widgets)

Comparación del snapshot **antes** (baseline) y **después** de añadir las reglas de contenido en `common/oss-skin.css`.

## Estados SIN tema (deben ser idénticos → 0 diffs = sin regresión)

Ninguno de los 6 widgets aparece en el diff de los estados `none`: **0 cambios**.

## Estados CON tema (cambio intencionado)

| Widget | Antes (cozy) | Después (cozy) |
|---|---|---|
| chat | `6px` · `rgba(25,29,33,.88)` | **`24px`** · `rgba(48,38,30,.88)` |
| goal | `0px` · transparente | `24px` · `rgba(48,38,30,.88)` |
| ticker | `0px` · transparente | `24px` · `rgba(48,38,30,.88)` |
| shoutout | `0px` · transparente | `24px` · `rgba(48,38,30,.88)` |
| promo | `0px` · transparente | `24px` · `rgba(48,38,30,.88)` |
| timer | (contenedor ya seguía al tema) | sin cambios |

Salida literal de `snapshot_widget_metrics.py --check` con el cambio aplicado:

```
DIF chat/maker:
  esperado {'radius': '6px', 'bg': 'rgba(25, 29, 33, 0.88)', 'borderWidth': '1px', 'font': 'Inter'}
  obtenido {'radius': '4px', 'bg': 'rgb(46, 54, 59)', 'borderWidth': '1px', 'font': 'Inter'}
DIF chat/cozy:
  esperado {'radius': '6px', 'bg': 'rgba(25, 29, 33, 0.88)', 'borderWidth': '1px', 'font': 'Outfit'}
  obtenido {'radius': '24px', 'bg': 'rgba(48, 38, 30, 0.88)', 'borderWidth': '1px', 'font': 'Outfit'}
DIF goal/maker:
  esperado {'radius': '0px', 'bg': 'rgba(0, 0, 0, 0)', 'borderWidth': '0px', 'font': 'Inter'}
  obtenido {'radius': '4px', 'bg': 'rgb(46, 54, 59)', 'borderWidth': '1px', 'font': 'Inter'}
DIF goal/cozy:
  esperado {'radius': '0px', 'bg': 'rgba(0, 0, 0, 0)', 'borderWidth': '0px', 'font': 'Outfit'}
  obtenido {'radius': '24px', 'bg': 'rgba(48, 38, 30, 0.88)', 'borderWidth': '1px', 'font': 'Outfit'}
DIF ticker/maker:
  esperado {'radius': '0px', 'bg': 'rgba(0, 0, 0, 0)', 'borderWidth': '0px', 'font': 'Inter'}
  obtenido {'radius': '4px', 'bg': 'rgb(46, 54, 59)', 'borderWidth': '1px', 'font': 'Inter'}
DIF ticker/cozy:
  esperado {'radius': '0px', 'bg': 'rgba(0, 0, 0, 0)', 'borderWidth': '0px', 'font': 'Outfit'}
  obtenido {'radius': '24px', 'bg': 'rgba(48, 38, 30, 0.88)', 'borderWidth': '1px', 'font': 'Outfit'}
DIF shoutout/maker:
  esperado {'radius': '0px', 'bg': 'rgba(0, 0, 0, 0)', 'borderWidth': '0px', 'font': 'Inter'}
  obtenido {'radius': '4px', 'bg': 'rgb(46, 54, 59)', 'borderWidth': '1px', 'font': 'Inter'}
DIF shoutout/cozy:
  esperado {'radius': '0px', 'bg': 'rgba(0, 0, 0, 0)', 'borderWidth': '0px', 'font': 'Outfit'}
  obtenido {'radius': '24px', 'bg': 'rgba(48, 38, 30, 0.88)', 'borderWidth': '1px', 'font': 'Outfit'}
DIF promo/maker:
  esperado {'radius': '0px', 'bg': 'rgba(0, 0, 0, 0)', 'borderWidth': '0px', 'font': 'Inter'}
  obtenido {'radius': '4px', 'bg': 'rgb(46, 54, 59)', 'borderWidth': '1px', 'font': 'Inter'}
DIF promo/cozy:
  esperado {'radius': '0px', 'bg': 'rgba(0, 0, 0, 0)', 'borderWidth': '0px', 'font': 'Outfit'}
  obtenido {'radius': '24px', 'bg': 'rgba(48, 38, 30, 0.88)', 'borderWidth': '1px', 'font': 'Outfit'}

10 diferencias frente a la evidencia versionada
```
