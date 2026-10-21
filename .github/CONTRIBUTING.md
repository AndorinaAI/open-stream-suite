# Contribuir a Open Stream Suite

<p align="center">
  <b>Español</b> | <a href="CONTRIBUTING.en.md">English</a>
</p>

¡Gracias por querer mejorar el proyecto! Las contribuciones son muy bienvenidas.

## Licencia

El proyecto usa la licencia [Creative Commons Atribución-NoComercial-CompartirIgual 4.0 Internacional (CC BY-NC-SA 4.0)](../LICENSE) con efecto retroactivo a todos los commits: uso, modificación y distribución libres **para fines no comerciales**. No se permite venderlo ni lucrarse con él sin permiso del autor.

Por la cláusula **CompartirIgual (ShareAlike)**, cualquier fork, modificación o nueva función que desarrolles y publiques **debe estar bajo esta misma licencia exacta (CC BY-NC-SA 4.0)**, asegurando que todas las mejoras permanezcan libres y puedan ser incorporadas legalmente al proyecto original. Te invitamos y animamos a enviar tus mejoras mediante un *Pull Request*.

Al enviar una contribución aceptas que se distribuya bajo esta misma licencia.

## Plataformas y Testeo
El desarrollo y pruebas se realizan **exclusivamente en Linux**. No utilizamos sistemas privativos (Windows ni macOS). Si desarrollas en Windows o macOS, agradecemos enormemente tu feedback, reporte de fallos y *Pull Requests* para que esos sistemas puedan avanzar.

## Cómo contribuir

1. Abre un *issue* describiendo el error o la mejora antes de empezar un cambio grande.
2. Haz un fork y crea una rama (`feature/mi-mejora` o `fix/mi-arreglo`).
3. Sigue las convenciones de [`app/CONVENTIONS.md`](../app/CONVENTIONS.md) ([English](../app/CONVENTIONS.en.md)).
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

Si cambias una funcionalidad, actualiza también las guías de `app/docs/` y, si afecta a los decks, [`plugins/README.md`](../plugins/README.md) ([English](../plugins/README.en.md)).
