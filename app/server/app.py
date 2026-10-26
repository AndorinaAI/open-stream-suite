import asyncio
from aiohttp import web
from server.state import system
from server.eventsub import run_eventsub
from server.irc import run_twitch_irc, run_chat_bot_timers
from server.routes.auth_routes import handle_auth, handle_callback, handle_logout
from server.routes.ws_routes import handle_ws
from server.routes.triggers_routes import handle_get_triggers, handle_save_triggers
from server.routes.roles_routes import handle_get_roles, handle_save_roles, handle_get_twitch_mods_and_vips
from server.routes.rewards_routes import (
    handle_get_twitch_rewards, handle_create_twitch_reward,
    handle_update_twitch_reward, handle_delete_twitch_reward
)
from server.routes.media_routes import (
    handle_list_media, handle_upload_media, handle_delete_media,
    handle_mkdir_media, handle_rename_media, handle_move_media, handle_copy_media
)
from server.routes.actions_routes import (
    handle_status, handle_test_alert, handle_explode_emotes,
    handle_timer_control, handle_shoutout, handle_theme_switch, handle_play_sound,
    handle_system_shutdown
)
from server.routes.widgets_routes import register_widgets_routes
from server.routes.webhooks_routes import register_webhooks_routes
from server.routes.alerts_routes import register_alerts_routes
from server.routes.themes_routes import register_themes_routes
from server.routes.fusions_routes import register_fusions_routes
from server.routes.overlay_routes import register_overlay_routes
from server.routes.deck_routes import register_deck_routes
from server.routes.updates_routes import register_updates_routes
from server.routes.static_routes import register_static_routes


async def start_background_tasks(app):
    system.eventsub_task = asyncio.create_task(run_eventsub(system))
    system.irc_task = asyncio.create_task(run_twitch_irc(system))
    system.bot_timers_task = asyncio.create_task(run_chat_bot_timers(system))

async def cleanup_background_tasks(app):
    system.running = False
    if system.eventsub_task:
        system.eventsub_task.cancel()
    if system.irc_task:
        system.irc_task.cancel()
    if system.bot_timers_task:
        system.bot_timers_task.cancel()

from server.config import HOST, LOCAL_AUTH_TOKEN, DECK_TOKEN, PORT, logger
from server.security import is_local_request, is_loopback_host, is_origin_allowed

PUBLIC_POST_PATHS = {
    "/api/webhooks/kofi",
    "/api/webhooks/buymeacoffee",
    "/api/webhooks/paypal",
    "/api/deck/trigger",
    "/api/deck/theme",
    "/api/deck/timer",
    "/api/deck/alert",
    "/api/deck/explode",
}

# Webhooks que pueden venir de un proveedor externo. `/api/webhooks/tip` no
# está aquí: es una simulación local y exige X-Local-Token.
PUBLIC_WEBHOOK_PATHS = {
    "/api/webhooks/kofi",
    "/api/webhooks/buymeacoffee",
    "/api/webhooks/paypal",
}


@web.middleware
async def cors_and_auth_middleware(request, handler):
    # La biblioteca de medios no puede servir documentos activos. Aunque un SVG
    # antiguo siga en disco, /media/...svg responde 404; la subida ya lo rechaza.
    media_path = request.path.lower()
    if (request.path == "/media" or media_path.startswith("/media/")):
        # La biblioteca solo se sirve a OBS/panel locales. El túnel se reserva
        # para webhooks externos, no para listar ni descargar medios.
        if not is_local_request(request):
            return web.Response(status=404, text="Not Found")
        if media_path.rstrip("/").endswith(".svg"):
            return web.Response(status=404, text="Not Found")

    origin = request.headers.get("Origin", "")
    allowed = is_origin_allowed(origin)

    if request.method == "OPTIONS":
        if origin and not allowed:
            return web.Response(status=403)
        resp = web.Response()
        if allowed and origin:
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Local-Token"
        return resp

    # Endpoints de Decks/macros (Elgato, Ajazz, OpenDeck, Companion): no usan navegador, así que
    # se bloquea cualquier petición originada por una página web externa (CSRF) y, si hay
    # DECK_TOKEN configurado, se exige.
    if request.path.startswith("/api/deck/"):
        if (origin and not allowed) or request.headers.get("Sec-Fetch-Site", "").lower() == "cross-site":
            logger.warning(f"🚫 Rechazada petición cross-site a {request.path} (Origin: {origin})")
            return web.json_response({"status": "error", "error": "Origen no permitido"}, status=403)
        if DECK_TOKEN:
            supplied = request.headers.get("X-Deck-Token") or request.query.get("deck_token")
            if supplied != DECK_TOKEN and request.headers.get("X-Local-Token") != LOCAL_AUTH_TOKEN:
                return web.json_response({
                    "status": "error",
                    "error": "Acceso denegado: falta X-Deck-Token (o ?deck_token=) válido"
                }, status=401)
        elif not is_loopback_host(HOST) or not is_local_request(request):
            # Sin token, los decks solo pueden operar desde loopback. Si el
            # servidor escucha en 0.0.0.0 o la petición viene por proxy/túnel,
            # se exige DECK_TOKEN explícitamente.
            return web.json_response({
                "status": "error",
                "error": "DECK_TOKEN no configurado: los decks requieren token cuando el servidor no es solo local"
            }, status=403)

    # Protección de endpoints POST contra llamadas externas maliciosas (CSRF / Cross-Site Scripting)
    if request.method == "POST":
        # Apagado directo local permitido desde loopback (Launcher / scripts locales)
        if request.path == "/api/system/shutdown" and is_local_request(request):
            pass
        else:
            # Los webhooks públicos de donaciones y las peticiones de Decks (Elgato, Ajazz, OpenDeck)
            is_public_webhook = (
                request.path in PUBLIC_POST_PATHS
                or request.path in PUBLIC_WEBHOOK_PATHS
                or request.path.startswith("/api/deck/")
            )
            if not is_public_webhook:
                client_token = request.headers.get("X-Local-Token") or request.query.get("token")
                if not client_token and request.headers.get("Authorization"):
                    parts = request.headers.get("Authorization").split()
                    if len(parts) == 2 and parts[0].lower() == "bearer":
                        client_token = parts[1]

                if not client_token or client_token != LOCAL_AUTH_TOKEN:
                    logger.warning(f"🚫 Rechazada petición POST sin token local válido a {request.path} (Origin: {origin})")
                    return web.json_response({
                        "status": "error",
                        "error": "Acceso denegado: falta cabecera 'X-Local-Token' válida en la petición POST"
                    }, status=403)

    resp = await handler(request)
    if request.path.endswith(".md") and resp.status == 200:
        resp.content_type = "text/plain"
        resp.charset = "utf-8"
    if allowed and origin:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Local-Token"
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return resp

async def handle_get_local_token(request):
    """Devuelve el token local sólo a orígenes autorizados locales"""
    origin = request.headers.get("Origin", "")
    if (origin and not is_origin_allowed(origin)) or not is_local_request(request):
        return web.json_response({"error": "Forbidden origin"}, status=403)
    return web.json_response({"status": "ok", "token": LOCAL_AUTH_TOKEN})

async def handle_local_token_script(request):
    """Proporciona window.__LOCAL_AUTH_TOKEN__ para el panel y widgets locales"""
    origin = request.headers.get("Origin", "")
    if (origin and not is_origin_allowed(origin)) or not is_local_request(request):
        return web.Response(text="/* Forbidden */", content_type="application/javascript", status=403)
    content = f"window.__LOCAL_AUTH_TOKEN__ = '{LOCAL_AUTH_TOKEN}';\n"
    return web.Response(text=content, content_type="application/javascript")

def create_app():
    if not DECK_TOKEN and not is_loopback_host(HOST):
        logger.warning(
            "🔒 DECK_TOKEN no configurado con SERVER_HOST=%s: /api/deck/* rechazará "
            "peticiones hasta definir DECK_TOKEN en .env", HOST
        )
    app = web.Application(middlewares=[cors_and_auth_middleware])

    # Endpoints de token local seguro
    app.router.add_get("/api/local-token", handle_get_local_token)
    app.router.add_get("/api/local-token.js", handle_local_token_script)

    # Rutas de autenticación
    app.router.add_get("/auth", handle_auth)
    app.router.add_get("/callback", handle_callback)
    app.router.add_post("/api/auth/logout", handle_logout)

    # WebSocket
    app.router.add_get("/ws", handle_ws)

    # API de Estado y Acciones
    app.router.add_get("/api/status", handle_status)
    app.router.add_post("/api/system/shutdown", handle_system_shutdown)
    app.router.add_post("/api/test", handle_test_alert)
    app.router.add_post("/api/explode", handle_explode_emotes)
    app.router.add_post("/api/timer", handle_timer_control)
    app.router.add_post("/api/shoutout", handle_shoutout)
    app.router.add_post("/api/theme", handle_theme_switch)
    app.router.add_post("/api/sound", handle_play_sound)

    # API de Media (Explorador Completo)
    app.router.add_get("/api/media", handle_list_media)
    app.router.add_post("/api/upload", handle_upload_media)
    app.router.add_post("/api/media/delete", handle_delete_media)
    app.router.add_post("/api/media/mkdir", handle_mkdir_media)
    app.router.add_post("/api/media/rename", handle_rename_media)
    app.router.add_post("/api/media/move", handle_move_media)
    app.router.add_post("/api/media/copy", handle_copy_media)

    # API de Triggers
    app.router.add_get("/api/triggers", handle_get_triggers)
    app.router.add_post("/api/triggers", handle_save_triggers)

    # API de Recompensas de Twitch
    app.router.add_get("/api/twitch/rewards", handle_get_twitch_rewards)
    app.router.add_post("/api/twitch/rewards/create", handle_create_twitch_reward)
    app.router.add_post("/api/twitch/rewards/update", handle_update_twitch_reward)
    app.router.add_post("/api/twitch/rewards/delete", handle_delete_twitch_reward)

    # API de Funciones y Roles
    app.router.add_get("/api/roles", handle_get_roles)
    app.router.add_post("/api/roles", handle_save_roles)
    app.router.add_get("/api/twitch/mods_and_vips", handle_get_twitch_mods_and_vips)

    # API de Widgets (configuración y acciones universales para OpenDeck / StreamDeck)
    register_widgets_routes(app)

    # API de Webhooks y Donaciones (Ko-fi, PayPal, Buy Me a Coffee)
    register_webhooks_routes(app)

    # API de Estudio y Configuración de Alertas
    register_alerts_routes(app)

    # API de Temas Modulares y Packs
    register_themes_routes(app)

    # API de Fusiones (Fusions) de Overlays
    register_fusions_routes(app)

    # API de Textos de Overlays y Escenas
    register_overlay_routes(app)

    # API de Integración con Stream Deck, Ajazz AKP y OpenDeck
    register_deck_routes(app)

    # API de Comprobación y Aplicación de Actualizaciones
    register_updates_routes(app)

    # Archivos estáticos y raíz (escenas, widgets, alertas, media)
    register_static_routes(app)

    # Tareas en segundo plano (EventSub e IRC)
    app.on_startup.append(start_background_tasks)
    app.on_cleanup.append(cleanup_background_tasks)

    # Sincronización escena↔tema (T4): `config.js` debe llevar el estado de temas
    # por escena para que la escena lo aplique en el primer pintado. Se regenera
    # aquí si falta (primer arranque o config.js antiguo).
    try:
        from server.services.overlay_service import sync_config_js_state
        sync_config_js_state()
    except Exception as e:  # nunca debe impedir el arranque del servidor
        logger.warning(f"No se pudo sincronizar config.js al arrancar: {e}")

    return app
