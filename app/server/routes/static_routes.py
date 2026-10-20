from aiohttp import web
from server.config import BASE_DIR, MEDIA_DIR

# plugins/ vive junto a app/ (fuera de la carpeta del proyecto) para que los usuarios lo encuentren fácil
PLUGINS_DIR = BASE_DIR.parent / "plugins"

# Únicos archivos sueltos de la raíz de app/ que se sirven por HTTP.
# NUNCA servir la raíz completa: contiene .env, token.json y .local_token.
ROOT_PUBLIC_FILES = ("config.js", "index.html")

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

def _make_file_handler(filename):
    async def handler(request):
        return web.FileResponse(BASE_DIR / filename)
    return handler

def register_static_routes(app):
    """Registra las rutas de ficheros estáticos de overlays, escenas, widgets, alertas y media"""
    app.router.add_get("/", handle_index)
    app.router.add_get("/scenes/{scene}", handle_legacy_scene_redirect)
    app.router.add_get("/scenes/{scene}/", handle_legacy_scene_redirect)
    app.router.add_get("/scenes/{scene}/index.html", handle_legacy_scene_redirect)

    maker_overlays = BASE_DIR / "streamthemes" / "Maker_Theme_Pack" / "overlays"
    if maker_overlays.is_dir():
        app.router.add_static("/overlays/", path=str(maker_overlays), name="overlays", follow_symlinks=True)
    else:
        app.router.add_static("/overlays/", path=str(BASE_DIR / "streamthemes" / "Open_stream_Pack" / "overlays"), name="overlays", follow_symlinks=True)
    app.router.add_static("/themes/", path=str(BASE_DIR / "streamthemes"), name="themes", follow_symlinks=True)
    app.router.add_static("/alerts/", path=str(BASE_DIR / "alerts"), name="alerts")
    app.router.add_static("/widgets/", path=str(BASE_DIR / "widgets"), name="widgets")
    app.router.add_static("/common/", path=str(BASE_DIR / "common"), name="common")
    if (BASE_DIR / "scenes").is_dir():
        app.router.add_static("/scenes/", path=str(BASE_DIR / "scenes"), name="scenes")
    app.router.add_static("/media/", path=str(MEDIA_DIR), name="media")

    # Idiomas (servir tanto desde app/languages como desde la raíz languages/)
    async def handle_language(request):
        lang = request.match_info.get("lang", "es").replace(".json", "")
        for base in (BASE_DIR / "languages", BASE_DIR.parent / "languages"):
            file_p = base / f"{lang}.json"
            if file_p.is_file():
                return web.FileResponse(file_p, headers={"Access-Control-Allow-Origin": "*"})
        raise web.HTTPNotFound()

    app.router.add_get("/languages/{lang}.json", handle_language)
    app.router.add_get("/languages/{lang}", handle_language)
    app.router.add_get("/api/languages/{lang}", handle_language)

    # Documentación, iconos y archivos de idioma de la app
    for folder in ("docs", "assets", "languages"):
        if (BASE_DIR / folder).is_dir():
            app.router.add_static(f"/{folder}/", path=str(BASE_DIR / folder), name=folder)

    # Plugins para decks y su guía de instalación (carpeta hermana de app/)
    if PLUGINS_DIR.is_dir():
        app.router.add_static("/plugins/", path=str(PLUGINS_DIR), name="plugins")

    # Archivos sueltos permitidos de la raíz (lista blanca)
    for filename in ROOT_PUBLIC_FILES:
        if (BASE_DIR / filename).is_file():
            app.router.add_get(f"/{filename}", _make_file_handler(filename))

