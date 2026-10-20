import asyncio
import json
import time
from pathlib import Path
import aiohttp
from server.config import (
    CLIENT_ID, CLIENT_SECRET, TOKEN_FILE, TRIGGERS_FILE, ROLES_FILE, logger
)

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
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            json.dump(token_data, f, indent=2)
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

    async def refresh_access_token(self):
        """Refresca el token si ha expirado"""
        if not self.token_data or "refresh_token" not in self.token_data:
            return False
        
        url = "https://id.twitch.tv/oauth2/token"
        params = {
            "grant_type": "refresh_token",
            "refresh_token": self.token_data["refresh_token"],
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.token_data.update(data)
                    self.save_token(self.token_data)
                    logger.info("✓ Token de Twitch renovado con éxito.")
                    return True
                else:
                    logger.error(f"Fallo al renovar token: {await resp.text()}")
                    return False

    async def fetch_user_info(self):
        """Obtiene la información del usuario del canal"""
        if not self.token_data:
            return None
        
        headers = {
            "Client-Id": CLIENT_ID,
            "Authorization": f"Bearer {self.token_data.get('access_token')}"
        }
        async with aiohttp.ClientSession() as session:
            async with session.get("https://api.twitch.tv/helix/users", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("data"):
                        self.user_info = data["data"][0]
                        logger.info(f"✓ Canal conectado: {self.user_info['display_name']} (ID: {self.user_info['id']})")
                        return self.user_info
                elif resp.status == 401:
                    logger.warning("Token expirado, intentando renovar...")
                    if await self.refresh_access_token():
                        return await self.fetch_user_info()
        return None

    def find_trigger_by_reward(self, reward_title):
        if not TRIGGERS_FILE.exists():
            return None
        try:
            with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for trig in data.get("triggers", []):
                    if not trig.get("enabled", True):
                        continue
                    if trig.get("activation_mode") == "command_only":
                        continue
                    if trig.get("reward_title", "").strip().lower() == reward_title.strip().lower():
                        return trig
        except Exception as e:
            logger.error(f"Error leyendo triggers.json: {e}")
        return None

    def find_trigger_by_command(self, cmd):
        if not TRIGGERS_FILE.exists():
            return None
        try:
            cmd_norm = cmd.strip().lower().lstrip("!")
            with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for trig in data.get("triggers", []):
                    if not trig.get("enabled", True):
                        continue
                    if trig.get("activation_mode") == "points_only":
                        continue
                    t_cmd = trig.get("chat_command", "").strip().lower().lstrip("!")
                    if t_cmd and t_cmd == cmd_norm:
                        return trig
        except Exception as e:
            logger.error(f"Error buscando trigger por comando: {e}")
        return None

    def find_trigger_by_id_or_name(self, ident):
        if not TRIGGERS_FILE.exists():
            return None
        try:
            ident_clean = str(ident).strip().lower()
            ident_no_prefix = ident_clean.removeprefix("trigger_").lstrip("!")
            with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for trig in data.get("triggers", []):
                    trig_id = str(trig.get("id", "")).strip().lower()
                    trig_title = str(trig.get("title", "")).strip().lower()
                    trig_cmd = trig.get("chat_command", "").strip().lower().lstrip("!")
                    if trig_id in (ident_clean, f"trigger_{ident_clean}") or trig_id.removeprefix("trigger_") == ident_no_prefix:
                        return trig
                    if trig_title == ident_clean:
                        return trig
                    if trig_cmd and trig_cmd == ident_no_prefix:
                        return trig
        except Exception as e:
            logger.error(f"Error buscando trigger por id/nombre: {e}")
        return None

    async def dispatch_trigger(self, trigger, user_name, reason="trigger"):
        """Emite un trigger a OBS con todas sus capas de vídeo, imagen, audio, posición y texto"""
        payload = {
            "type": "video" if trigger.get("video_url") else ("image" if trigger.get("image_url") else "trigger"),
            "user": user_name,
            "reward_title": trigger.get("reward_title", ""),
            "title": trigger.get("title", ""),
            "message": trigger.get("message", ""),
            "video_url": trigger.get("video_url", ""),
            "image_url": trigger.get("image_url", ""),
            "sound_url": trigger.get("sound_url", ""),
            "sound_volume": trigger.get("sound_volume", trigger.get("volume", 0.8)),
            "audio_type": trigger.get("audio_type", "custom"),
            "banner_text": trigger.get("banner_text", trigger.get("title", "")),
            "show_banner_text": trigger.get("show_banner_text", True),
            "banner_text_color": trigger.get("banner_text_color", "#FFFFFF"),
            "banner_border_color": trigger.get("banner_border_color", trigger.get("accent", "#57D6C4")),
            "banner_bg_style": trigger.get("banner_bg_style", "dark_glass"),
            "banner_font_size": trigger.get("banner_font_size", "medium"),
            "banner_font_family": trigger.get("banner_font_family", "tech"),
            "banner_position": trigger.get("banner_position", "below"),
            "banner_animation": trigger.get("banner_animation", "pop"),
            "position_mode": trigger.get("position_mode", trigger.get("position", "center")),
            "custom_x": trigger.get("custom_x", 50),
            "custom_y": trigger.get("custom_y", 50),
            "size": trigger.get("size", "medium"),
            "duration": trigger.get("duration", 5000),
            "accent": trigger.get("accent", "#57D6C4"),
            "special_action": trigger.get("special_action", "none"),
            "special_action_param": trigger.get("special_action_param", "")
        }
        await self.broadcast(payload)
        logger.info(f"📢 Trigger disparado ({reason}): {trigger.get('title')} por {user_name}")

        spec_act = trigger.get("special_action", "none")
        if spec_act and spec_act != "none":
            asyncio.create_task(self.execute_special_action(spec_act, trigger.get("special_action_param", ""), user_name))

    def user_has_custom_role(self, username, role_id):
        """Comprueba si un usuario de Twitch pertenece a una función o rol definido en roles.json"""
        if not ROLES_FILE.exists():
            return False
        try:
            with open(ROLES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                u_clean = username.lower().strip().lstrip("@")
                for r in data.get("roles", []):
                    r_id = r.get("id")
                    matches = (r_id == role_id) or \
                              (role_id in ("role_artista", "role_artistas") and r_id in ("role_artista", "role_artistas")) or \
                              (role_id in ("role_moderador", "role_moderadores") and r_id in ("role_moderador", "role_moderadores")) or \
                              (role_id in ("role_vip", "role_vips") and r_id in ("role_vip", "role_vips"))
                    if matches:
                        members = [m.lower().strip().lstrip("@") for m in r.get("members", [])]
                        if u_clean in members:
                            return True
        except Exception as e:
            logger.error(f"Error comprobando función personalizada: {e}")
        return False

    def auto_register_artist(self, username):
        """Auto-registra en roles.json a cualquier usuario de chat que tenga la insignia oficial de artista de Twitch"""
        if not ROLES_FILE.exists():
            return
        try:
            with open(ROLES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            u_clean = username.lower().strip().lstrip("@")
            updated = False
            for r in data.get("roles", []):
                if r.get("id") in ("role_artista", "role_artistas"):
                    members = [m.lower().strip().lstrip("@") for m in r.get("members", [])]
                    if u_clean not in members:
                        r.setdefault("members", []).append(u_clean)
                        updated = True
                        logger.info(f"🎨 Artista oficial de Twitch detectado en chat y registrado: @{u_clean}")
            if updated:
                with open(ROLES_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                try:
                    asyncio.create_task(self.broadcast({"type": "roles_updated", "roles": data.get("roles", [])}))
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"Aviso auto-registrando artista: {e}")

    async def set_twitch_chat_setting(self, settings: dict):
        """Cambia ajustes de chat en Twitch (modo emotes, modo lento, modo subs) vía Helix API"""
        if not self.token_data or not self.user_info:
            return False
        b_id = self.user_info["id"]
        headers = {
            "Client-Id": CLIENT_ID,
            "Authorization": f"Bearer {self.token_data['access_token']}",
            "Content-Type": "application/json"
        }
        url = f"https://api.twitch.tv/helix/chat/settings?broadcaster_id={b_id}&moderator_id={b_id}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.patch(url, headers=headers, json=settings) as resp:
                    if resp.status == 200:
                        logger.info(f"✓ Ajuste de chat Twitch aplicado: {settings}")
                        return True
                    elif resp.status in (401, 403):
                        logger.warning(f"Aviso: Falta permiso moderator:manage:chat_settings en token ({resp.status})")
                        return False
        except Exception as e:
            logger.error(f"Error cambiando chat setting en Twitch: {e}")
        return False

    async def clear_twitch_chat(self):
        """Limpia el chat de Twitch vía Helix API"""
        if not self.token_data or not self.user_info:
            return False
        b_id = self.user_info["id"]
        headers = {
            "Client-Id": CLIENT_ID,
            "Authorization": f"Bearer {self.token_data['access_token']}"
        }
        url = f"https://api.twitch.tv/helix/moderation/chat?broadcaster_id={b_id}&moderator_id={b_id}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.delete(url, headers=headers) as resp:
                    return resp.status in (200, 204)
        except Exception as e:
            logger.error(f"Error limpiando chat en Twitch: {e}")
        return False

    async def execute_special_action(self, action, param, user_name):
        """Ejecuta acciones interactivas en Twitch (Helix) o en el Overlay de OBS"""
        try:
            logger.info(f"🎯 Ejecutando acción especial: {action} (param: {param}) por {user_name}")

            if action == "overlay_explode_emotes":
                emoji = param or "🎉"
                await self.broadcast({"type": "explode_emotes", "emoji": emoji, "count": 45})

            elif action == "overlay_timer_add":
                seconds = int(param) if str(param).isdigit() else 60
                await self.broadcast({"type": "timer_control", "action": "add", "seconds": seconds})
                await self.broadcast({
                    "type": "chat_notification",
                    "text": f"⏱️ ¡{user_name} ha añadido +{seconds}s al temporizador del stream!"
                })

            elif action == "twitch_emote_only":
                duration = int(param) if str(param).isdigit() else 60
                await self.set_twitch_chat_setting({"emote_mode": True})
                await self.broadcast({
                    "type": "chat_notification",
                    "text": f"💬 ¡{user_name} activó el Modo Solo Emoticonos ({duration}s)!"
                })
                await asyncio.sleep(duration)
                await self.set_twitch_chat_setting({"emote_mode": False})
                await self.broadcast({
                    "type": "chat_notification",
                    "text": "💬 El chat de Twitch vuelve a modo normal."
                })

            elif action == "twitch_slow_mode":
                duration = 60
                wait_time = int(param) if str(param).isdigit() else 15
                await self.set_twitch_chat_setting({"slow_mode": True, "slow_mode_wait_time": wait_time})
                await self.broadcast({
                    "type": "chat_notification",
                    "text": f"🐢 ¡{user_name} activó Modo Lento ({wait_time}s entre mensajes)!"
                })
                await asyncio.sleep(duration)
                await self.set_twitch_chat_setting({"slow_mode": False})
                await self.broadcast({
                    "type": "chat_notification",
                    "text": "🐢 Modo Lento desactivado."
                })

            elif action == "twitch_sub_only":
                duration = int(param) if str(param).isdigit() else 60
                await self.set_twitch_chat_setting({"subscriber_mode": True})
                await self.broadcast({
                    "type": "chat_notification",
                    "text": f"⭐ ¡{user_name} activó el Modo Solo Suscriptores ({duration}s)!"
                })
                await asyncio.sleep(duration)
                await self.set_twitch_chat_setting({"subscriber_mode": False})
                await self.broadcast({
                    "type": "chat_notification",
                    "text": "⭐ Modo Solo Suscriptores desactivado."
                })

            elif action == "twitch_clear_chat":
                await self.clear_twitch_chat()
                await self.broadcast({
                    "type": "chat_notification",
                    "text": f"🧹 ¡{user_name} ha limpiado el chat de Twitch!"
                })

        except Exception as e:
            logger.error(f"Error ejecutando acción especial {action}: {e}")

    async def send_chat_message(self, message):
        """Envía un mensaje al chat de Twitch usando Helix API o broadcast interno"""
        # Siempre difundir al overlay local y dashboard
        await self.broadcast({
            "type": "chat_message",
            "user": (self.user_info and self.user_info.get("display_name")) or "OSS-Bot",
            "color": "#57D6C4",
            "message": message,
            "badges": "broadcaster/1"
        })

        if not self.token_data or not self.user_info:
            logger.warning("No hay sesión OAuth activa con Twitch; mensaje emitido localmente")
            return False

        headers = {
            "Client-Id": CLIENT_ID,
            "Authorization": f"Bearer {self.token_data.get('access_token')}",
            "Content-Type": "application/json"
        }
        body = {
            "broadcaster_id": self.user_info.get("id"),
            "sender_id": self.user_info.get("id"),
            "message": message
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://api.twitch.tv/helix/chat/messages", headers=headers, json=body) as resp:
                    if resp.status == 200:
                        logger.info(f"💬 Mensaje enviado al chat de Twitch: {message}")
                        return True
                    else:
                        text = await resp.text()
                        logger.warning(f"Aviso al enviar mensaje Helix ({resp.status}): {text}")
        except Exception as e:
            logger.error(f"Excepción al enviar mensaje a Twitch: {e}")
        return False

# Instancia singleton compartida por todo el servidor
system = TwitchAlertSystem()
