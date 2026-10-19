import json
import time
from aiohttp import web
from server.config import logger
from server.state import system

# Historial en memoria de propinas y donaciones
recent_tips = []

async def handle_kofi_webhook(request):
    """
    Webhook oficial para Ko-fi (Donaciones, Membresías y Tienda).
    Ko-fi envía application/x-www-form-urlencoded con un campo 'data' en JSON.
    """
    try:
        data_json = None
        if request.content_type == "application/x-www-form-urlencoded":
            post_data = await request.post()
            raw_data = post_data.get("data")
            if raw_data:
                data_json = json.loads(raw_data)
        elif request.content_type == "application/json":
            data_json = await request.json()

        if not data_json:
            return web.Response(text="No data received", status=400)

        # Extraer campos de Ko-fi
        user = data_json.get("from_name") or "Anónimo"
        amount = str(data_json.get("amount") or "0")
        currency = data_json.get("currency") or "EUR"
        msg = data_json.get("message") or ""
        is_sub = data_json.get("is_subscription_payment", False)
        kofi_type = data_json.get("type") or "Donation"

        formatted_amount = f"{amount} {currency}"
        logger.info(f"☕ [Ko-fi Webhook] {kofi_type} recibido de {user}: {formatted_amount} ('{msg}')")

        payload = {
            "type": "tip",
            "platform": "kofi",
            "user": user,
            "amount": formatted_amount,
            "raw_amount": float(amount) if amount.replace('.', '', 1).isdigit() else 0,
            "currency": currency,
            "message": msg,
            "is_subscription": is_sub,
            "timestamp": time.time()
        }

        recent_tips.insert(0, payload)
        if len(recent_tips) > 50:
            recent_tips.pop()

        # Difundir a OBS y widgets
        await system.broadcast(payload)
        return web.Response(text="OK", status=200)

    except Exception as e:
        logger.error(f"Error procesando webhook de Ko-fi: {e}")
        return web.Response(text=f"Error: {e}", status=500)

async def handle_bmc_webhook(request):
    """
    Webhook oficial para Buy Me a Coffee (BMC).
    BMC envía un JSON con los detalles del supporter.
    """
    try:
        data = await request.json()
        response_obj = data.get("response", data)

        user = response_obj.get("supporter_name") or response_obj.get("payer_name") or "Anónimo"
        amount = str(response_obj.get("support_price") or response_obj.get("amount") or "0")
        currency = response_obj.get("support_currency") or response_obj.get("currency") or "EUR"
        coffees = response_obj.get("support_coffees") or 1
        note = response_obj.get("support_note") or response_obj.get("note") or ""

        formatted_amount = f"{amount} {currency}"
        logger.info(f"🟡☕ [BuyMeACoffee Webhook] Donación de {user}: {coffees} cafés ({formatted_amount}) - '{note}'")

        payload = {
            "type": "tip",
            "platform": "buymeacoffee",
            "user": user,
            "amount": formatted_amount,
            "raw_amount": float(amount) if amount.replace('.', '', 1).isdigit() else 0,
            "currency": currency,
            "coffees": coffees,
            "message": note,
            "timestamp": time.time()
        }

        recent_tips.insert(0, payload)
        if len(recent_tips) > 50:
            recent_tips.pop()

        await system.broadcast(payload)
        return web.json_response({"status": "ok"})

    except Exception as e:
        logger.error(f"Error procesando webhook de BuyMeACoffee: {e}")
        return web.json_response({"status": "error", "error": str(e)}, status=500)

async def handle_paypal_webhook(request):
    """
    Webhook / IPN para PayPal.
    Compatible con IPN form-urlencoded y Webhooks REST de PayPal en JSON.
    """
    try:
        user = "Anónimo"
        amount = "0"
        currency = "EUR"
        msg = ""

        if request.content_type == "application/json":
            data = await request.json()
            resource = data.get("resource", {})
            user = (resource.get("payer", {}).get("name", {}).get("given_name") or 
                    resource.get("payer", {}).get("email_address") or "Donante PayPal")
            amount_obj = resource.get("amount", {})
            amount = str(amount_obj.get("value") or "0")
            currency = amount_obj.get("currency_code") or "EUR"
            msg = resource.get("note_to_payer") or resource.get("custom_id") or ""
        else:
            post_data = await request.post()
            user = post_data.get("first_name") or post_data.get("payer_email") or "Donante PayPal"
            amount = str(post_data.get("mc_gross") or post_data.get("payment_gross") or "0")
            currency = post_data.get("mc_currency") or "EUR"
            msg = post_data.get("item_name") or post_data.get("memo") or ""

        formatted_amount = f"{amount} {currency}"
        logger.info(f"🅿️ [PayPal Webhook] Donación de {user}: {formatted_amount} - '{msg}'")

        payload = {
            "type": "tip",
            "platform": "paypal",
            "user": user,
            "amount": formatted_amount,
            "raw_amount": float(amount) if amount.replace('.', '', 1).isdigit() else 0,
            "currency": currency,
            "message": msg,
            "timestamp": time.time()
        }

        recent_tips.insert(0, payload)
        if len(recent_tips) > 50:
            recent_tips.pop()

        await system.broadcast(payload)
        return web.Response(text="OK", status=200)

    except Exception as e:
        logger.error(f"Error procesando webhook de PayPal: {e}")
        return web.Response(text=f"Error: {e}", status=500)

async def handle_tip_simulate(request):
    """
    Endpoint para registrar manualmente o simular donaciones de prueba
    desde el panel de control o Stream Deck.
    """
    try:
        data = await request.json()
        platform = data.get("platform", "kofi") # kofi | paypal | buymeacoffee | generic
        user = data.get("user", "Donante Maker")
        amount = str(data.get("amount", "5.00"))
        currency = data.get("currency", "EUR")
        msg = data.get("message", "¡Gran directo de taller!")

        formatted_amount = f"{amount} {currency}" if currency not in amount else amount

        payload = {
            "type": "tip",
            "platform": platform,
            "user": user,
            "amount": formatted_amount,
            "raw_amount": float(amount.replace('€', '').replace('$', '').strip()) if amount.replace('.', '', 1).isdigit() else 5.0,
            "currency": currency,
            "message": msg,
            "timestamp": time.time()
        }

        recent_tips.insert(0, payload)
        if len(recent_tips) > 50:
            recent_tips.pop()

        await system.broadcast(payload)
        logger.info(f"💰 [Donación Registrada/Simulada] {platform.upper()} de {user}: {formatted_amount}")
        return web.json_response({"status": "ok", "payload": payload, "recent_tips": recent_tips[:10]})

    except Exception as e:
        logger.error(f"Error simulando donación: {e}")
        return web.json_response({"status": "error", "error": str(e)}, status=500)

async def handle_get_recent_tips(request):
    """Devuelve las últimas donaciones registradas en la sesión"""
    return web.json_response({"status": "ok", "tips": recent_tips})

DONATIONS_CONFIG_FILE = "donations_config.json"
streamlabs_task = None
streamlabs_connected = False

def load_donations_config():
    try:
        import os
        if os.path.exists(DONATIONS_CONFIG_FILE):
            with open(DONATIONS_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"No se pudo cargar {DONATIONS_CONFIG_FILE}: {e}")
    return {
        "tunnelUrl": "",
        "streamlabsToken": "",
        "streamlabsConnected": False
    }

def save_donations_config(cfg):
    try:
        with open(DONATIONS_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error guardando {DONATIONS_CONFIG_FILE}: {e}")

async def streamlabs_socket_worker(token):
    global streamlabs_connected
    import aiohttp
    import asyncio
    
    url = f"wss://sockets.streamlabs.com/socket.io/?EIO=3&transport=websocket&token={token.strip()}"
    logger.info("🔌 Iniciando conexión con Streamlabs Socket API...")
    
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(url, heartbeat=20.0) as ws:
                    streamlabs_connected = True
                    logger.info("✓ ¡Conectado con éxito a Streamlabs Socket API! Escuchando alertas de donaciones...")
                    
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            text = msg.data
                            # Socket.io ping
                            if text == "2":
                                await ws.send_str("3")
                                continue
                            elif text.startswith("42"):
                                try:
                                    packet = json.loads(text[2:])
                                    event_name = packet[0] if len(packet) > 0 else ""
                                    event_data = packet[1] if len(packet) > 1 else {}
                                    
                                    # Eventos de donación
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
                                            recent_tips.insert(0, payload)
                                            if len(recent_tips) > 50:
                                                recent_tips.pop()
                                            await system.broadcast(payload)
                                except Exception as err:
                                    logger.error(f"Error procesando paquete de Streamlabs: {err}")
                        elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                            break
        except Exception as e:
            logger.warning(f"Aviso Streamlabs Socket: {e}. Reintentando en 15s...")
            streamlabs_connected = False
            await asyncio.sleep(15)

async def handle_get_donations_config(request):
    """Devuelve la configuración guardada de donaciones y túnel"""
    cfg = load_donations_config()
    cfg["streamlabsConnected"] = streamlabs_connected
    return web.json_response({"status": "ok", "config": cfg})

async def handle_save_donations_config(request):
    """Guarda la configuración de donaciones (token Streamlabs, túnel) y gestiona el socket"""
    global streamlabs_task, streamlabs_connected
    import asyncio
    try:
        data = await request.json()
        cfg = load_donations_config()
        
        if "tunnelUrl" in data:
            cfg["tunnelUrl"] = str(data["tunnelUrl"]).strip()
        
        token = data.get("streamlabsToken")
        if token is not None:
            token = token.strip()
            cfg["streamlabsToken"] = token
            
            # Si hay una tarea previa, cancelarla
            if streamlabs_task and not streamlabs_task.done():
                streamlabs_task.cancel()
                streamlabs_connected = False
            
            if token:
                streamlabs_task = asyncio.create_task(streamlabs_socket_worker(token))
                streamlabs_connected = True
            else:
                streamlabs_connected = False

        save_donations_config(cfg)
        cfg["streamlabsConnected"] = streamlabs_connected
        return web.json_response({"status": "ok", "config": cfg})
    except Exception as e:
        logger.error(f"Error guardando configuración de donaciones: {e}")
        return web.json_response({"status": "error", "error": str(e)}, status=500)

def register_webhooks_routes(app):
    """Registra las rutas de Webhooks de donaciones externas"""
    app.router.add_post("/api/webhooks/kofi", handle_kofi_webhook)
    app.router.add_post("/api/webhooks/buymeacoffee", handle_bmc_webhook)
    app.router.add_post("/api/webhooks/paypal", handle_paypal_webhook)
    app.router.add_post("/api/webhooks/tip", handle_tip_simulate)
    app.router.add_post("/api/tips/simulate", handle_tip_simulate)
    app.router.add_get("/api/tips/recent", handle_get_recent_tips)
    app.router.add_get("/api/donations/config", handle_get_donations_config)
    app.router.add_post("/api/donations/config", handle_save_donations_config)

