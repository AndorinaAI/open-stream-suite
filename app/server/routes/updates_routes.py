"""
Open Stream Suite — Rutas de la API de Actualizaciones
Permite comprobar si hay nuevas versiones y aplicarlas de forma segura.
"""

import asyncio
from aiohttp import web
from server.security import is_local_request
from server.routes.errors import read_json_object
from launcher.updater import UpdateManager

updater = UpdateManager()


async def handle_check_updates(request):
    """Comprueba si hay actualizaciones disponibles en la rama indicada."""
    if not is_local_request(request):
        return web.json_response({"status": "error", "error": "Solo disponible en local"}, status=403)
    branch = request.query.get("branch", "main").strip()
    if branch not in ("main", "dev", "master"):
        branch = "main"

    res = await asyncio.to_thread(updater.check_updates, branch)
    return web.json_response(res)


async def handle_apply_update(request):
    """Aplica la actualización mediante Git si el origen es local y autenticado.

    Doble guarda: el middleware de `server/app.py` ya exige `X-Local-Token` en
    todo POST no público, pero además se comprueba el ORIGEN, igual que en
    `/api/updates/check`. Aplicar una actualización ejecuta `git reset --hard`:
    nunca debe poder dispararlo una petición que llega por un túnel o un proxy.
    """
    if not is_local_request(request):
        return web.json_response(
            {"status": "error", "error": "Solo disponible en local"}, status=403)

    body = await read_json_object(request)
    if body is None:
        body = {}

    branch = body.get("branch", "main").strip()
    if branch not in ("main", "dev", "master"):
        branch = "main"

    res = await asyncio.to_thread(updater.apply_update, branch)
    status_code = 200 if res.get("status") == "ok" else 400
    return web.json_response(res, status=status_code)


def register_updates_routes(app):
    app.router.add_get("/api/updates/check", handle_check_updates)
    app.router.add_post("/api/updates/apply", handle_apply_update)
