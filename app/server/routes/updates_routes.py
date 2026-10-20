"""
Open Stream Suite — Rutas de la API de Actualizaciones
Permite comprobar si hay nuevas versiones y aplicarlas de forma segura.
"""

from aiohttp import web
from launcher.updater import UpdateManager

updater = UpdateManager()


async def handle_check_updates(request):
    """Comprueba si hay actualizaciones disponibles en la rama indicada"""
    branch = request.query.get("branch", "main").strip()
    if branch not in ("main", "dev", "master"):
        branch = "main"

    res = updater.check_updates(branch=branch)
    return web.json_response(res)


async def handle_apply_update(request):
    """Aplica la actualización mediante Git si el origen es local y autenticado"""
    try:
        body = await request.json()
    except Exception:
        body = {}

    branch = body.get("branch", "main").strip()
    if branch not in ("main", "dev", "master"):
        branch = "main"

    res = updater.apply_update(branch=branch)
    status_code = 200 if res.get("status") == "ok" else 400
    return web.json_response(res, status=status_code)


def register_updates_routes(app):
    app.router.add_get("/api/updates/check", handle_check_updates)
    app.router.add_post("/api/updates/apply", handle_apply_update)
