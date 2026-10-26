import json
from aiohttp import web
from server.config import TRIGGERS_FILE, logger
from server.services.triggers_service import load_triggers_data, save_triggers_data

async def handle_get_triggers(request):
    """Devuelve la configuración de triggers en triggers.json"""
    if not TRIGGERS_FILE.exists():
        return web.json_response({"triggers": []})
    try:
        return web.json_response(load_triggers_data())
    except Exception:
        return web.json_response({"error": "triggers.json no se pudo leer o está corrupto"}, status=500)

async def handle_save_triggers(request):
    """Guarda nuevos triggers en triggers.json"""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Payload JSON inválido"}, status=400)
    if not isinstance(data, dict) or not isinstance(data.get("triggers"), list):
        return web.json_response({"error": "Se esperaba {triggers: []}"}, status=400)
    if not save_triggers_data(data):
        return web.json_response({"error": "No se pudo guardar triggers.json"}, status=500)
    logger.info("✓ Triggers actualizados en triggers.json")
    return web.json_response({"status": "ok", "saved": True})
