"""
Servicio para búsqueda, validación y disparo de triggers multimedia y roles.
"""

import json
from pathlib import Path
from server.config import TRIGGERS_FILE, ROLES_FILE, logger
from server.services.fs_utils import atomic_write_json, ensure_private_file, lock_for


def load_triggers_data() -> dict:
    """Lectura robusta y bloqueada de triggers.json."""
    with lock_for(TRIGGERS_FILE):
        with open(TRIGGERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    if not isinstance(data, dict) or not isinstance(data.get("triggers", []), list):
        raise ValueError("triggers.json no tiene el esquema esperado")
    return data


def save_triggers_data(data: dict) -> bool:
    """Escritura atómica y bloqueada; devuelve False sin romper la API."""
    try:
        with lock_for(TRIGGERS_FILE):
            atomic_write_json(TRIGGERS_FILE, data)
            ensure_private_file(TRIGGERS_FILE)
        return True
    except Exception as e:
        logger.error(f"No se pudo guardar triggers.json: {e}")
        return False


def find_trigger_by_reward(reward_title: str):
    """Busca un trigger configurado para activarse por puntos de canal."""
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


def find_trigger_by_command(cmd: str):
    """Busca un trigger configurado para activarse por comando de chat (!comando)."""
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


def find_trigger_by_id_or_name(ident: str):
    """Busca un trigger por su ID interno, título o comando asociado."""
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


def build_trigger_payload(trigger: dict, user_name: str) -> dict:
    """Construye el payload completo para emisión a OBS."""
    return {
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


def user_has_custom_role(username: str, role_id: str) -> bool:
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


def auto_register_artist(username: str, broadcast_cb=None):
    """Auto-registra en roles.json a cualquier usuario de chat que tenga insignia oficial de artista"""
    if not ROLES_FILE.exists():
        return
    try:
        with lock_for(ROLES_FILE):
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
                atomic_write_json(ROLES_FILE, data)
                ensure_private_file(ROLES_FILE)
        if updated and broadcast_cb:
            try:
                broadcast_cb({"type": "roles_updated", "roles": data.get("roles", [])})
            except Exception:
                pass
    except Exception as e:
        logger.warning(f"Aviso auto-registrando artista: {e}")
