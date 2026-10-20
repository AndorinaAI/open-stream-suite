#!/usr/bin/env python3
"""
====================================================================
OPEN STREAM SUITE — SERVIDOR LOCAL DE ALERTAS, TRIGGERS Y WIDGETS
====================================================================
Punto de entrada principal. El servidor ha sido modularizado
en submódulos especializados dentro del paquete `server/`:
  - server/config.py     : Constantes, rutas y variables de entorno
  - server/state.py      : Estado en memoria y broadcast WebSocket
  - server/eventsub.py   : Cliente WebSocket EventSub de Twitch
  - server/irc.py        : Cliente Twitch IRC y comandos de chat
  - server/app.py        : Ensamblador de rutas y aplicación aiohttp
  - server/routes/       : Handlers REST y WebSocket independientes
"""
import sys
from aiohttp import web
from server.app import create_app
from server.config import PORT, HOST, LOOPBACK_HOSTS, DECK_TOKEN, CLIENT_ID, CLIENT_SECRET

if __name__ == "__main__":
    if not CLIENT_ID or not CLIENT_SECRET:
        print("❌ ERROR: TWITCH_CLIENT_ID o TWITCH_CLIENT_SECRET no configurados en .env")
        sys.exit(1)

    print("----------------------------------------------------------------")
    print("🛠️  OPEN STREAM SUITE — SERVIDOR LOCAL DE ALERTAS Y TRIGGERS (MODULAR)")
    print("----------------------------------------------------------------")
    print(f"Panel de Control:  http://localhost:{PORT}/alerts/panel.html")
    print(f"Fuente para OBS:   http://localhost:{PORT}/alerts/index.html")
    print(f"WebSocket Local:   ws://localhost:{PORT}/ws")
    print("----------------------------------------------------------------")
    if HOST not in LOOPBACK_HOSTS:
        print(f"⚠️  Servidor abierto a la red local ({HOST}). Cualquier equipo de tu red puede acceder.")
        if not DECK_TOKEN:
            print("⚠️  Define DECK_TOKEN en .env para proteger los endpoints /api/deck/.")

    app = create_app()
    web.run_app(app, host=HOST, port=PORT)
