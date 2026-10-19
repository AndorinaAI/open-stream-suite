from aiohttp import web
from server.config import BASE_DIR, MEDIA_DIR

SCENE_COMPAT_MAP = {
    "maker-desk": "/overlays/maker/desk/index.html",
    "maker-pc": "/overlays/maker/pc/index.html",
    "print-machine": "/overlays/print/machine/index.html",
    "print-design": "/overlays/print/design/index.html",
    "game": "/overlays/game/index.html",
    "chill": "/overlays/chill/index.html",
    "starting-soon": "/overlays/screens/starting-soon/index.html",
    "be-right-back": "/overlays/screens/be-right-back/index.html",
    "ending": "/overlays/screens/ending/index.html",
}

async def handle_index(request):
    """Redirige la raíz al panel de control"""
    raise web.HTTPFound("/alerts/panel.html")

async def handle_legacy_scene_redirect(request):
    """Redirige rutas antiguas /scenes/... hacia la estructura modular /overlays/..."""
    scene = request.match_info.get("scene", "")
    target = SCENE_COMPAT_MAP.get(scene)
    if target:
        qs = request.query_string
        url = f"{target}?{qs}" if qs else target
        raise web.HTTPFound(url)
    raise web.HTTPNotFound()

def register_static_routes(app):
    """Registra las rutas de ficheros estáticos de overlays, escenas, widgets, alertas y media"""
    app.router.add_get("/", handle_index)
    app.router.add_get("/scenes/{scene}", handle_legacy_scene_redirect)
    app.router.add_get("/scenes/{scene}/", handle_legacy_scene_redirect)
    app.router.add_get("/scenes/{scene}/index.html", handle_legacy_scene_redirect)

    app.router.add_static("/overlays/", path=str(BASE_DIR / "overlays"), name="overlays")
    app.router.add_static("/alerts/", path=str(BASE_DIR / "alerts"), name="alerts")
    app.router.add_static("/widgets/", path=str(BASE_DIR / "widgets"), name="widgets")
    app.router.add_static("/common/", path=str(BASE_DIR / "common"), name="common")
    app.router.add_static("/scenes/", path=str(BASE_DIR / "scenes"), name="scenes")
    app.router.add_static("/media/", path=str(MEDIA_DIR), name="media")
    app.router.add_static("/", path=str(BASE_DIR), name="root")

