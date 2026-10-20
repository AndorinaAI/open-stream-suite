import json
from aiohttp import web
from server.config import TRIGGERS_FILE, logger

async def handle_get_triggers(request):
    """Devuelve la configuración de triggers en triggers.json"""
    if TRIGGERS_FILE.exists():
        with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
            return web.json_response(json.load(f))
    return web.json_response({"triggers": []})

async def handle_save_triggers(request):
    """Guarda nuevos triggers en triggers.json"""
    data = await request.json()
    with open(TRIGGERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info("✓ Triggers actualizados en triggers.json")
    return web.json_response({"status": "ok", "saved": True})
