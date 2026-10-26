# Compatibilidad y shims (W27/W28)

> Estado: **decisión cerrada**. No se elimina ningún contrato público sin un
> consumidor verificado; los shims internos se mantienen para no romper imports
> de terceros ni enlaces ya publicados.

## Se mantiene

- `server/<servicio>.py` → re-exportaciones de `server/services/<servicio>.py`
  para scripts y plugins que importaban la ruta antigua.
- `/scenes/<clave>` y `/scenes/<clave>/index.html` → redirects a la escena real.
- `common/editor.js` → redirect a `common/overlay/editor.js`.
- `window.TALLER_CONFIG` → alias de `window.OSS_CONFIG`.
- `/api/sound` y `/api/tips/recent`: API externa documentada; siguen existiendo,
  con sus controles de seguridad actuales.

## Se elimina

- No se añaden nuevos alias ni endpoints duplicados.
- Los wrappers que solo reenviaban a un módulo sin consumidores se consideran
  deuda: antes de borrar uno hay que comprobar imports, tests, docs y plugins.

## Regla para futuras limpiezas

1. Buscar el nombre en `app/`, `plugins/`, `tests/` y documentación.
2. Si no hay consumidor ni contrato publicado, borrar el wrapper y actualizar
   la documentación.
3. Si es un contrato público, mantenerlo y añadir una fecha de deprecación.
