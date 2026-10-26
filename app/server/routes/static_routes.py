from aiohttp import web
from server.config import BASE_DIR, MEDIA_DIR
from server.security import is_local_request
from server.services import scenes_catalog

# plugins/ vive junto a app/ (fuera de la carpeta del proyecto) para que los usuarios lo encuentren fácil
PLUGINS_DIR = BASE_DIR.parent / "plugins"

# Únicos archivos sueltos de la raíz de app/ que se sirven por HTTP.
# NUNCA servir la raíz completa: contiene .env, token.json y .local_token.
ROOT_PUBLIC_FILES = ("config.js", "CONVENTIONS.md", "CONVENTIONS.en.md")

# Rutas heredadas /scenes/<clave>/index.html -> ruta real de la escena.
# Se resuelven contra el catálogo único (app/scenes.json, generado desde
# 05-scenes-data.js): antes solo existían 9 claves escritas a mano con
# convención kebab, así que 21 de las 27 escenas (oss_starting, gamer_victory,
# cozy_brb, startingSoon…) daban 404 en la vista previa del editor de temas.
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


def build_scene_redirect_map() -> dict:
    """Mapa clave/alias canónico -> ruta estática real, generado del catálogo."""
    mapping = {}
    for scene in scenes_catalog.get_scenes():
        target = scenes_catalog.legacy_scene_target(scene["key"])
        if not target:
            continue
        mapping[scene["key"]] = target
        for alias in scene.get("aliases", []) or []:
            mapping.setdefault(alias, target)
    # El mapa histórico manda para las formas ya publicadas en documentación/OBS
    mapping.update(SCENE_COMPAT_MAP)
    return mapping


def resolve_legacy_scene(raw_scene: str):
    """Ruta destino para /scenes/<raw_scene>[/index.html] (catálogo primero)."""
    if raw_scene is None:
        return None
    raw = str(raw_scene).strip().strip("/")
    if raw.endswith("/index.html"):
        raw = raw[: -len("/index.html")]
    if not raw:
        return None
    mapping = build_scene_redirect_map()
    if raw in mapping:
        return mapping[raw]
    return scenes_catalog.legacy_scene_target(raw)


async def handle_index(request):
    """Redirige la raíz al panel de control"""
    raise web.HTTPFound("/alerts/panel.html")

async def handle_legacy_scene_redirect(request):
    """Redirige rutas antiguas /scenes/... hacia la estructura modular real."""
    scene = request.match_info.get("scene", "")
    target = resolve_legacy_scene(scene)
    if target:
        qs = request.query_string
        url = f"{target}?{qs}" if qs else target
        raise web.HTTPFound(url)
    raise web.HTTPNotFound()

def _make_file_handler(filename):
    async def handler(request):
        return web.FileResponse(BASE_DIR / filename)
    return handler

async def handle_docs(request):
    """Sirve documentación solo a peticiones locales y solo desde app/docs/."""
    if not is_local_request(request):
        raise web.HTTPNotFound()
    rel = str(request.match_info.get("path", "") or "").strip().strip("/")
    docs_root = (BASE_DIR / "docs").resolve()
    if not rel or ".." in rel or "\\" in rel:
        raise web.HTTPNotFound()
    target = (docs_root / rel).resolve()
    try:
        inside = target.is_relative_to(docs_root)
    except AttributeError:
        inside = str(target).startswith(str(docs_root) + "/")
    if not inside or not target.is_file() or target.suffix.lower() != ".md":
        raise web.HTTPNotFound()
    return web.FileResponse(target)


async def handle_favicon(request):
    """Favicon estable para todas las páginas (evita 404 en overlays y escenas)."""
    return web.FileResponse(BASE_DIR / "assets" / "favicon.png")


def register_static_routes(app):
    """Registra las rutas de ficheros estáticos de overlays, escenas, widgets, alertas y media"""
    app.router.add_get("/", handle_index)
    app.router.add_get("/favicon.ico", handle_favicon)
    app.router.add_get("/index.html", handle_index)
    app.router.add_get("/scenes/{scene}", handle_legacy_scene_redirect)
    app.router.add_get("/scenes/{scene}/", handle_legacy_scene_redirect)
    app.router.add_get("/scenes/{scene}/index.html", handle_legacy_scene_redirect)
    # Rutas con subcarpeta ("screens/starting-soon", "maker/desk", …: {scene} no
    # cruza '/' y antes quedaban sin resolver → 404 en la vista previa.
    app.router.add_get("/scenes/{scene:.*}", handle_legacy_scene_redirect)

    maker_overlays = BASE_DIR / "streamthemes" / "Maker_Theme_Pack" / "overlays"
    if maker_overlays.is_dir():
        app.router.add_static("/overlays/", path=str(maker_overlays), name="overlays")
    else:
        app.router.add_static("/overlays/", path=str(BASE_DIR / "streamthemes" / "Open_stream_Pack" / "overlays"), name="overlays")
    app.router.add_static("/themes/", path=str(BASE_DIR / "streamthemes"), name="themes")
    app.router.add_static("/streamthemes/", path=str(BASE_DIR / "streamthemes"), name="streamthemes")
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

    # Documentación: solo local y solo .md; nunca se publica por el túnel.
    app.router.add_get("/docs/{path:.*}", handle_docs, name="docs")
    # Iconos y archivos de idioma de la app
    for folder in ("assets", "languages"):
        if (BASE_DIR / folder).is_dir():
            app.router.add_static(f"/{folder}/", path=str(BASE_DIR / folder), name=folder)

    # Plugins para decks y su guía de instalación (carpeta hermana de app/)
    if PLUGINS_DIR.is_dir():
        app.router.add_static("/plugins/", path=str(PLUGINS_DIR), name="plugins")

    # Archivos sueltos permitidos de la raíz (lista blanca)
    for filename in ROOT_PUBLIC_FILES:
        if (BASE_DIR / filename).is_file():
            app.router.add_get(f"/{filename}", _make_file_handler(filename))

