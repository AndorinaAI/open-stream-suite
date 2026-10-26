import asyncio
import json
import os
import time
from pathlib import Path
from server.config import TOKEN_FILE, logger
from server.services import triggers_service, twitch_service
from server.services.fs_utils import atomic_write_json

class TwitchAlertSystem:
    def __init__(self):
        self.connected_clients = set()
        self.token_data = self.load_token()
        self.user_info = None
        self.eventsub_ws = None
        self.eventsub_task = None
        self.irc_task = None
        self.trigger_cooldowns = {}
        self.session_id = None
        self.running = True
        self.recent_chat_messages = []
        self.chat_message_counter = 0
        self.bot_timers_task = None

    def load_token(self):
        if TOKEN_FILE.exists():
            try:
                with open(TOKEN_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error cargando token.json: {e}")
        return None

    def save_token(self, token_data):
        self.token_data = token_data
        atomic_write_json(TOKEN_FILE, token_data)
        try:
            os.chmod(TOKEN_FILE, 0o600)
        except OSError:
            pass
        logger.info("✓ Token guardado correctamente en token.json")

    def clear_token(self):
        """Borra la sesión activa de Twitch y limpia el estado"""
        self.token_data = None
        self.user_info = None
        if TOKEN_FILE.exists():
            try:
                TOKEN_FILE.unlink()
                logger.info("✓ token.json eliminado al cerrar sesión")
            except Exception as e:
                logger.error(f"Error eliminando token.json: {e}")

    async def broadcast(self, payload):
        """Envía el evento a todos los navegadores/OBS conectados"""
        if payload.get("type") == "chat_message":
            self.chat_message_counter += 1
            entry = {
                "user": payload.get("user", "Viewer"),
                "message": payload.get("message", ""),
                "color": payload.get("color", "#57D6C4"),
                "badges": payload.get("badges", ""),
                "timestamp": int(time.time() * 1000)
            }
            self.recent_chat_messages.append(entry)
            if len(self.recent_chat_messages) > 60:
                self.recent_chat_messages.pop(0)

        if not self.connected_clients:
            logger.info(f"Evento emitido (sin clientes conectados en OBS): {payload.get('type')}")
            return
        
        msg = json.dumps(payload)
        to_remove = set()
        for ws in self.connected_clients:
            try:
                await ws.send_str(msg)
            except Exception:
                to_remove.add(ws)
        self.connected_clients.difference_update(to_remove)
        logger.info(f"📢 Alerta enviada a {len(self.connected_clients)} clientes: {payload.get('type')} ({payload.get('user', '')})")

    # --- Delegación a Twitch Service (Helix API & Special Actions) ---

    async def refresh_access_token(self):
        """Refresca el token si ha expirado"""
        return await twitch_service.refresh_access_token(self.token_data, self.save_token)

    async def fetch_user_info(self):
        """Obtiene la información del usuario del canal"""
        self.user_info = await twitch_service.fetch_user_info(self.token_data, self.refresh_access_token)
        return self.user_info

    async def set_twitch_chat_setting(self, settings: dict):
        """Cambia ajustes de chat en Twitch (modo emotes, modo lento, modo subs) vía Helix API"""
        return await twitch_service.set_twitch_chat_setting(self.token_data, self.user_info, settings)

    async def clear_twitch_chat(self):
        """Limpia el chat de Twitch vía Helix API"""
        return await twitch_service.clear_twitch_chat(self.token_data, self.user_info)

    async def execute_special_action(self, action, param, user_name):
        """Ejecuta acciones interactivas en Twitch (Helix) o en el Overlay de OBS"""
        await twitch_service.execute_special_action(
            action=action,
            param=param,
            user_name=user_name,
            broadcast_cb=self.broadcast,
            set_chat_setting_cb=self.set_twitch_chat_setting,
            clear_chat_cb=self.clear_twitch_chat
        )

    async def send_chat_message(self, message):
        """Envía un mensaje al chat de Twitch usando Helix API o broadcast interno"""
        await self.broadcast({
            "type": "chat_message",
            "user": (self.user_info and self.user_info.get("display_name")) or "OSS-Bot",
            "color": "#57D6C4",
            "message": message,
            "badges": "broadcaster/1"
        })
        return await twitch_service.send_helix_chat_message(self.token_data, self.user_info, message)

    # --- Delegación a Triggers Service (Búsqueda, Roles y Emisión de Triggers) ---

    def find_trigger_by_reward(self, reward_title):
        return triggers_service.find_trigger_by_reward(reward_title)

    def find_trigger_by_command(self, cmd):
        return triggers_service.find_trigger_by_command(cmd)

    def find_trigger_by_id_or_name(self, ident):
        return triggers_service.find_trigger_by_id_or_name(ident)

    def user_has_custom_role(self, username, role_id):
        return triggers_service.user_has_custom_role(username, role_id)

    def auto_register_artist(self, username):
        triggers_service.auto_register_artist(username, broadcast_cb=lambda pl: asyncio.create_task(self.broadcast(pl)))

    async def dispatch_trigger(self, trigger, user_name, reason="trigger"):
        """Emite un trigger a OBS con todas sus capas de vídeo, imagen, audio, posición y texto"""
        payload = triggers_service.build_trigger_payload(trigger, user_name)
        await self.broadcast(payload)
        logger.info(f"📢 Trigger disparado ({reason}): {trigger.get('title')} por {user_name}")

        spec_act = trigger.get("special_action", "none")
        if spec_act and spec_act != "none":
            asyncio.create_task(self.execute_special_action(spec_act, trigger.get("special_action_param", ""), user_name))


# Instancia singleton compartida por todo el servidor
system = TwitchAlertSystem()
