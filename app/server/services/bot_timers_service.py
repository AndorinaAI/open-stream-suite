"""
Servicio para ejecución periódica de mensajes programados en el chat de Twitch.
"""

import asyncio
import time
import json
from server.config import logger, WIDGETS_CONFIG_FILE


async def run_chat_bot_timers(system):
    """Ejecuta los mensajes periódicos automáticos configurados para el chat de Twitch."""
    timer_states = {}  # timer_id -> {"last_sent": float, "last_counter": int}

    # Esperar unos segundos iniciales para estabilizar conexión
    await asyncio.sleep(15)

    while system.running:
        await asyncio.sleep(20)
        if not system.user_info or not WIDGETS_CONFIG_FILE.exists():
            continue

        try:
            with open(WIDGETS_CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)

            chat_cfg = data.get("chat", {})
            timers = chat_cfg.get("botTimers", [])
            now = time.time()

            for t in timers:
                if not t.get("enabled", True):
                    continue

                t_id = t.get("id", "")
                interval_min = int(t.get("intervalMinutes", 15))
                min_lines = int(t.get("minChatLines", 5))
                message = t.get("message", "").strip()

                if not message:
                    continue

                st = timer_states.setdefault(t_id, {"last_sent": now, "last_counter": system.chat_message_counter})
                time_elapsed = (now - st["last_sent"]) >= (interval_min * 60)
                lines_elapsed = (system.chat_message_counter - st["last_counter"]) >= min_lines

                if time_elapsed and lines_elapsed:
                    logger.info(f"🤖 Ejecutando mensaje programado de chat: [{t.get('name', t_id)}]")
                    await system.send_chat_message(message)
                    st["last_sent"] = now
                    st["last_counter"] = system.chat_message_counter

        except Exception as e:
            logger.debug(f"Aviso en loop de timers de chat: {e}")
