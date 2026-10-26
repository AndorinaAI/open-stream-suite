# Contribuir a Open Stream Suite

<p align="center">
  <b>Español</b> | <a href="CONTRIBUTING.en.md">English</a>
</p>

¡Gracias por querer mejorar el proyecto! Las contribuciones son muy bienvenidas.

## Licencia y CLA

El proyecto usa **doble licencia**:

- **Licencia pública: [GNU AGPL v3.0 o posterior](../LICENSE)** — software libre: puedes usar, estudiar, modificar y redistribuir el proyecto gratis, **siempre que cumplas la AGPL** (publicar el código de tus modificaciones y no imponer restricciones adicionales).
- **Licencia comercial de pago:** si eres una **empresa** y quieres usarlo sin publicar tu código (integrarlo en un producto, servicio alojado, marca blanca, redistribución), necesitas la [licencia comercial](../LICENSE-COMMERCIAL.md). Contacto: **admin@andorina.dev**.
- **Marcas:** el nombre, el logo y la identidad visual **no** están cubiertos por ninguna de las dos licencias → [`TRADEMARK.md`](../TRADEMARK.md).
- **Recursos de terceros** (tipografías, iconos, dependencias de Python): tampoco los cubre la licencia del proyecto → [`NOTICE.md`](../NOTICE.md).

> [!IMPORTANT]
> Las versiones publicadas **antes del 2026-10-26** se distribuyeron bajo **CC BY-NC-SA 4.0**. Las copias ya entregadas a terceros conservan esos términos; **las versiones nuevas se rigen por la AGPL-3.0-or-later**.

### Firmar el CLA (obligatorio)

Para mantener el modelo de doble licencia, **toda contribución requiere aceptar el [Acuerdo de Licencia de Contribuciones (CLA)](CLA.md)** ([English](CLA.en.md)), que cede al titular derechos suficientes para **relicenciar** el proyecto (incluida su explotación comercial).

1. Escribe en tu Pull Request este comentario **exacto**:
   `I have read the CLA Document and I hereby sign the CLA`
2. Si actúas en nombre de una entidad, añade además: `on behalf of <Entidad>, representing <nombre y cargo>`.

Los Pull Requests **sin firma no se revisan ni se fusionan** (se cerrarán con un enlace al CLA). No se acepta código de terceros sin declararlo ni aportaciones con copyleft adicional incompatible con la AGPL y con la licencia comercial del proyecto.

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
5. Abre el Pull Request explicando qué cambia y por qué. **Incluye la firma del CLA**: escribe en el PR el comentario exacto `I have read the CLA Document and I hereby sign the CLA` (ver [CLA.md](CLA.md)). Sin firma, el PR no se revisa.

## Reglas de seguridad

- **Nunca** subas `.env`, `token.json` ni `.local_token`. Están en `.gitignore`.
- No añadas rutas estáticas que sirvan la raíz de `app/`: contiene credenciales. Usa siempre la lista blanca de `server/routes/static_routes.py`.
- Los endpoints nuevos que modifican estado deben exigir el token local (`X-Local-Token`) salvo que estén pensados para decks (`/api/deck/`).

## Documentación

Si cambias una funcionalidad, actualiza también las guías de `app/docs/` y, si afecta a los decks, [`plugins/README.md`](../plugins/README.md) ([English](../plugins/README.en.md)).
