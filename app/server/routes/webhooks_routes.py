"""
server/routes/webhooks_routes.py — Rutas HTTP de Webhooks de donaciones externas
Recibe webhooks de Ko-fi, PayPal, Buy Me a Coffee y Streamlabs Socket API.
"""

import json
import time
from aiohttp import web
from server.config import logger, DONATIONS_CONFIG_FILE
from server.services.donations_service import (
    recent_tips,
    broadcast_tip_and_alert,
    load_donations_config,
    save_donations_config,
    is_streamlabs_connected,
    update_streamlabs_connection
)


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

        await broadcast_tip_and_alert(payload)
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

        await broadcast_tip_and_alert(payload)
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

        await broadcast_tip_and_alert(payload)
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
        platform = data.get("platform", "kofi")
        user = data.get("user", "Donante Maker")
        amount = str(data.get("amount", "5.00"))
        currency = data.get("currency", "EUR")
        msg = data.get("message", "¡Gran directo!")

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

        await broadcast_tip_and_alert(payload)
        logger.info(f"💰 [Donación Registrada/Simulada] {platform.upper()} de {user}: {formatted_amount}")
        return web.json_response({"status": "ok", "payload": payload, "recent_tips": recent_tips[:10]})

    except Exception as e:
        logger.error(f"Error simulando donación: {e}")
        return web.json_response({"status": "error", "error": str(e)}, status=500)


async def handle_get_recent_tips(request):
    """Devuelve las últimas donaciones registradas en la sesión"""
    return web.json_response({"status": "ok", "tips": recent_tips})


async def handle_get_donations_config(request):
    """Devuelve la configuración guardada de donaciones y túnel"""
    cfg = load_donations_config()
    cfg["streamlabsConnected"] = is_streamlabs_connected()
    return web.json_response({"status": "ok", "config": cfg})


async def handle_save_donations_config(request):
    """Guarda la configuración de donaciones (token Streamlabs, túnel) y gestiona el socket"""
    try:
        data = await request.json()
        cfg = load_donations_config()

        if "tunnelUrl" in data:
            cfg["tunnelUrl"] = str(data["tunnelUrl"]).strip()

        token = data.get("streamlabsToken")
        if token is not None:
            token = token.strip()
            cfg["streamlabsToken"] = token
            update_streamlabs_connection(token)

        save_donations_config(cfg)
        cfg["streamlabsConnected"] = is_streamlabs_connected()
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
