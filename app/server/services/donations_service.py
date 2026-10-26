"""
server/services/donations_service.py — Servicio de procesamiento de donaciones y webhooks externos
Gestiona el historial de propinas, parsers para Ko-fi, PayPal, Buy Me a Coffee y Streamlabs Socket API.
"""

import asyncio
import json
import os
import time
import aiohttp
from server.config import BASE_DIR, logger
from server.state import system
from server.services.alerts_service import format_alert_event
from server.services.fs_utils import atomic_write_json, lock_for

DONATIONS_CONFIG_FILE = BASE_DIR / "donations_config.json"

recent_tips = []
_streamlabs_task = None
_streamlabs_connected = False


def get_recent_tips():
    """Devuelve las últimas donaciones registradas en memoria"""
    return recent_tips


async def broadcast_tip_and_alert(payload: dict):
    """Guarda en historial, difunde evento 'tip' y genera alerta audiovisual 'custom_alert'."""
    recent_tips.insert(0, payload)
    if len(recent_tips) > 50:
        recent_tips.pop()
    await system.broadcast(payload)
    try:
        alert_item = format_alert_event("donation", {
            "user": payload.get("user") or "Donante",
            "amount": payload.get("amount") or "",
            "currency": payload.get("currency") or "EUR",
            "message": payload.get("message") or ""
        })
        if alert_item:
            await system.broadcast(alert_item)
    except Exception as e:
        logger.warning(f"No se pudo emitir alerta personalizada de donación: {e}")


def load_donations_config():
    """Carga configuración de donaciones (URLs de túnel, token Streamlabs)"""
    try:
        if DONATIONS_CONFIG_FILE.exists():
            with open(DONATIONS_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"No se pudo cargar {DONATIONS_CONFIG_FILE}: {e}")
    return {
        "tunnelUrl": "",
        "streamlabsToken": "",
        "streamlabsConnected": False,
        "kofiVerificationToken": "",
        "bmcWebhookSecret": "",
        "paypalWebhookSecret": "",
    }


def save_donations_config(cfg) -> bool:
    """Guarda configuración persistente de donaciones; False si no pudo."""
    try:
        with lock_for(DONATIONS_CONFIG_FILE):
            atomic_write_json(DONATIONS_CONFIG_FILE, cfg)
            try:
                os.chmod(DONATIONS_CONFIG_FILE, 0o600)
            except OSError:
                pass
        return True
    except Exception as e:
        logger.error(f"Error guardando {DONATIONS_CONFIG_FILE}: {e}")
        return False


def is_streamlabs_connected() -> bool:
    return _streamlabs_connected


async def streamlabs_socket_worker(token: str):
    """Worker asíncrono para escuchar eventos en vivo de Streamlabs Socket API"""
    global _streamlabs_connected
    url = f"wss://sockets.streamlabs.com/socket.io/?EIO=3&transport=websocket&token={token.strip()}"
    logger.info("🔌 Iniciando conexión con Streamlabs Socket API...")

    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(url, heartbeat=20.0) as ws:
                    _streamlabs_connected = True
                    logger.info("✓ ¡Conectado con éxito a Streamlabs Socket API! Escuchando alertas de donaciones...")

                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            text = msg.data
                            if text == "2":
                                await ws.send_str("3")
                                continue
                            elif text.startswith("42"):
                                try:
                                    packet = json.loads(text[2:])
                                    event_name = packet[0] if len(packet) > 0 else ""
                                    event_data = packet[1] if len(packet) > 1 else {}

                                    if event_data.get("type") == "donation" or event_name == "donation":
                                        message_list = event_data.get("message", [])
                                        for don in message_list:
                                            user = don.get("name") or don.get("from") or "Donante"
                                            amount = str(don.get("amount") or don.get("formatted_amount") or "5.00")
                                            curr = don.get("currency") or "EUR"
                                            note = don.get("message") or ""
                                            fmt_amount = don.get("formatted_amount") or f"{amount} {curr}"

                                            logger.info(f"💰 [Streamlabs Socket] Donación recibida de {user}: {fmt_amount}")
                                            payload = {
                                                "type": "tip",
                                                "platform": "paypal",
                                                "user": user,
                                                "amount": fmt_amount,
                                                "raw_amount": float(str(amount).replace('€', '').replace('$', '').strip()) if str(amount).replace('.', '', 1).isdigit() else 5.0,
                                                "currency": curr,
                                                "message": note,
                                                "timestamp": time.time()
                                            }
                                            await broadcast_tip_and_alert(payload)
                                except Exception as err:
                                    logger.error(f"Error procesando paquete de Streamlabs: {err}")
                        elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                            break
        except Exception as e:
            logger.warning(f"Aviso Streamlabs Socket: {e}. Reintentando en 15s...")
            _streamlabs_connected = False
            await asyncio.sleep(15)


def update_streamlabs_connection(token: str | None):
    """Actualiza la tarea de fondo de conexión con Streamlabs según el token suministrado"""
    global _streamlabs_task, _streamlabs_connected
    if _streamlabs_task and not _streamlabs_task.done():
        _streamlabs_task.cancel()
        _streamlabs_connected = False

    if token:
        _streamlabs_task = asyncio.create_task(streamlabs_socket_worker(token))
        _streamlabs_connected = True
    else:
        _streamlabs_connected = False
