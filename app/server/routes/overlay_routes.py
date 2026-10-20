import json
from pathlib import Path
from aiohttp import web
from server.config import BASE_DIR, logger
from server.state import system

OVERLAY_TEXTS_FILE = BASE_DIR / "overlay_texts_config.json"
CONFIG_JS_FILE = BASE_DIR / "config.js"

DEFAULT_OVERLAY_TEXTS = {
    "channel": {
        "name": "ANDORINA",
        "tagline": "JUGAR · CREAR · TRASTEAR",
        "visible": True,
        "showLiveIndicator": True,
        "liveText": "EN DIRECTO",
        "socials": {
            "visible": False,
            "twitch": "andorina",
            "youtube": "andorina",
            "twitter": "andorina",
            "instagram": "andorina",
            "github": "andorina"
        }
    },
    "game": {
        "badgeText": "GAME MODE",
        "tagline": "MODO JUEGO / GAMEPLAY"
    },
    "maker": {
        "projectName": "NAS CON RASPBERRY PI",
        "currentPhase": "02 MONTAJE",
        "detail": "Armbian OS · PCB v1.2 · Caja a medida",
        "panelTitle": "ESTADO DEL PROYECTO",
        "projectPrefix": "PROYECTO:",
        "frames": {
            "main": "CÁMARA CENITAL · BANCO DE TRABAJO",
            "face": "STREAMER",
            "aux": "PC / TERMINAL"
        },
        "phases": [
            "01 PLAN",
            "02 MONTAJE",
            "03 SOFTWARE",
            "04 PRUEBAS"
        ],
        "showAuxView": True
    },
    "print": {
        "projectName": "PEGATINAS PERSONALIZADAS",
        "material": "Vinilo Holográfico Adhesivo",
        "currentPhase": "CORTE DE VINILO",
        "panelTitle": "TRABAJO DE CORTE / IMPRESIÓN",
        "projectPrefix": "TRABAJO:",
        "frames": {
            "main": "CÁMARA PLOTTER / MÁQUINA",
            "face": "STREAMER",
            "aux": "SOFTWARE & CORTE"
        },
        "phases": [
            "01 DISEÑO",
            "02 CORTE",
            "03 PELADO",
            "04 APLICACIÓN"
        ],
        "showAuxView": True
    },
    "chill": {
        "subtitle": "CHARLA / DUDAS / IDEAS / COMUNIDAD",
        "showChatPanel": True,
        "chatTitle": "CHAT EN DIRECTO",
        "topic": "Cacharreo, proyectos de la semana y preguntas del chat",
        "chatPrompt": "¡Escribe en el chat para participar!",
        "frames": {
            "face": "STREAMER"
        }
    },
    "startingSoon": {
        "heroTag": "// STREAM EN DIRECTO",
        "title": "ENSEGUIDA",
        "highlight": "ESTAMOS EN DIRECTO",
        "subtitle": "PREPARANDO EL DIRECTO...",
        "countdownMinutes": 5,
        "footerNote": "ANDORINA · OPEN STREAM SUITE",
        "liveStatusText": "TRANSMISIÓN INICIANDO",
        "showModesOverview": True
    },
    "beRightBack": {
        "title": "AHORA VUELVO",
        "subtitle": "UN MOMENTO...",
        "statusPhrases": [
            "TOMANDO UN CAFÉ...",
            "PREPARANDO TODO...",
            "PROBANDO COSAS...",
            "VOLVEMOS ENSEGUIDA"
        ],
        "phraseIntervalSeconds": 6,
        "footerNote": "EL DIRECTO CONTINÚA EN BREVES INSTANTES",
        "liveStatusText": "PAUSA TÉCNICA"
    },
    "ending": {
        "title": "GRACIAS POR PASARTE",
        "subtitle": "NOS VEMOS EN EL PRÓXIMO DIRECTO",
        "farewellMessage": "¡Gracias por acompañar el stream! Recuerda seguir el canal para no perderte el próximo directo.",
        "farewellTag": "// HASTA LA PRÓXIMA",
        "footerNote": "ANDORINA · OPEN STREAM SUITE · TRANSMISIÓN FINALIZADA",
        "liveStatusText": "FIN DE TRANSMISIÓN"
    },
    "performance": {
        "enableAnimations": True
    }
}

def deep_merge(base: dict, override: dict) -> dict:
    """Combina dos dicts de forma profunda: los valores de override sobreescriben base,
    para sub-dicts se combina recursivamente, los arrays se reemplazan (no se concatenan)."""
    import copy
    result = copy.deepcopy(base)
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge(result[k], v)
        else:
            result[k] = copy.deepcopy(v)
    return result

def load_overlay_texts() -> dict:
    """Carga los textos configurados desde overlay_texts_config.json o devuelve valores por defecto"""
    if OVERLAY_TEXTS_FILE.exists():
        try:
            with open(OVERLAY_TEXTS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return deep_merge(DEFAULT_OVERLAY_TEXTS, data)
        except Exception as e:
            logger.warning(f"Error leyendo overlay_texts_config.json: {e}")

    return json.loads(json.dumps(DEFAULT_OVERLAY_TEXTS))

def save_overlay_texts_to_disk(texts: dict):
    """Guarda la configuración en overlay_texts_config.json y actualiza config.js para soporte offline"""
    # 1. Guardar JSON
    with open(OVERLAY_TEXTS_FILE, "w", encoding="utf-8") as f:
        json.dump(texts, f, indent=2, ensure_ascii=False)

    # 2. Generar config.js para overlays sin servidor o modo offline
    json_str = json.dumps(texts, indent=2, ensure_ascii=False)
    js_content = f"""/**
 * ====================================================================
 * OPEN STREAM SUITE — CONFIGURACIÓN CENTRALIZADA DE OVERLAYS Y ESCENAS
 * ====================================================================
 * Generado automáticamente por el panel de control Open Stream Suite.
 * Modifica desde el panel web o directamente en este archivo.
 */

window.OSS_CONFIG = {json_str};
window.TALLER_CONFIG = window.OSS_CONFIG;  // alias de compatibilidad hacia atrás
"""
    try:
        with open(CONFIG_JS_FILE, "w", encoding="utf-8") as f:
            f.write(js_content)
        logger.info("✓ config.js regenerado con los textos actualizados")
    except Exception as e:
        logger.warning(f"Error actualizando config.js: {e}")

async def handle_get_overlay_texts(request):
    """Devuelve todos los textos de las escenas y overlays en JSON"""
    data = load_overlay_texts()
    return web.json_response({"status": "ok", "texts": data})

async def handle_save_overlay_texts(request):
    """Guarda los textos modificados y emite evento WebSocket a todas las escenas conectadas en OBS"""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)

    texts = body.get("texts", body)
    if not isinstance(texts, dict):
        return web.json_response({"error": "Estructura de textos no válida"}, status=400)

    save_overlay_texts_to_disk(texts)

    # Emitir evento en caliente a OBS Studio para actualizar textos al instante
    await system.broadcast({
        "type": "overlay_texts_update",
        "texts": texts
    })

    logger.info("📢 Textos de escenas y overlays actualizados en vivo")
    return web.json_response({"status": "ok", "texts": texts})

async def handle_reset_overlay_texts(request):
    """Restaura todos los textos de overlays o una sección específica a los valores originales de fábrica"""
    section = "all"
    if request.can_read_body:
        try:
            body = await request.json()
            section = body.get("section", "all")
        except Exception:
            pass

    current_texts = load_overlay_texts_from_disk()
    import copy
    if section == "all":
        current_texts = copy.deepcopy(DEFAULT_OVERLAY_TEXTS)
    elif section in DEFAULT_OVERLAY_TEXTS:
        current_texts[section] = copy.deepcopy(DEFAULT_OVERLAY_TEXTS[section])

    save_overlay_texts_to_disk(current_texts)
    await system.broadcast({
        "type": "overlay_texts_update",
        "texts": current_texts
    })
    logger.info(f"↺ Textos de overlays restaurados (sección: {section})")
    return web.json_response({"status": "ok", "texts": current_texts, "reset_section": section})

def register_overlay_routes(app):
    """Registra los endpoints para gestión de textos de overlays y escenas"""
    # Inicializar archivo si no existe
    if not OVERLAY_TEXTS_FILE.exists():
        save_overlay_texts_to_disk(DEFAULT_OVERLAY_TEXTS)

    app.router.add_get("/api/overlays/texts", handle_get_overlay_texts)
    app.router.add_post("/api/overlays/texts", handle_save_overlay_texts)
    app.router.add_post("/api/overlays/texts/reset", handle_reset_overlay_texts)
