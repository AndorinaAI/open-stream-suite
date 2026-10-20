# Contribuir a Open Stream Suite

¡Gracias por querer mejorar el proyecto! Las contribuciones son muy bienvenidas.

## Licencia

El proyecto usa la licencia [PolyForm Noncommercial 1.0.0](LICENSE): uso, modificación y distribución libres **para fines no comerciales**. No se permite venderlo ni lucrarse con él sin permiso del autor.

Si haces un fork y añades funciones, **te pedimos que las propongas al proyecto original** mediante un *Pull Request* para que todos se beneficien. Es una petición de la comunidad: la licencia no puede obligar a ello.

Al enviar una contribución aceptas que se distribuya bajo esta misma licencia.

## Cómo contribuir

1. Abre un *issue* describiendo el error o la mejora antes de empezar un cambio grande.
2. Haz un fork y crea una rama (`feature/mi-mejora` o `fix/mi-arreglo`).
3. Sigue las convenciones de [`app/CONVENTIONS.md`](app/CONVENTIONS.md).
4. Ejecuta los tests desde `app/` con el servidor en marcha:
   ```bash
   ./venv/bin/python3 -m unittest discover tests -v
   ```
5. Abre el Pull Request explicando qué cambia y por qué.

## Reglas de seguridad

- **Nunca** subas `.env`, `token.json` ni `.local_token`. Están en `.gitignore`.
- No añadas rutas estáticas que sirvan la raíz de `app/`: contiene credenciales. Usa siempre la lista blanca de `server/routes/static_routes.py`.
- Los endpoints nuevos que modifican estado deben exigir el token local (`X-Local-Token`) salvo que estén pensados para decks (`/api/deck/`).

## Documentación

Si cambias una funcionalidad, actualiza también las guías de `app/docs/` y, si afecta a los decks, [`plugins/README.md`](plugins/README.md).
