"""
server/widgets_service.py — Servicio de carga, persistencia y sincronización de widgets
Gestiona la lectura/escritura modular de widgets/<widget>/config.json y sincronización Twitch.
"""

import json
import time
import aiohttp
from server.config import (
    WIDGETS_DIR,
    WIDGETS_CONFIG_FILE,
    WIDGET_CONFIG_MAPPING,
    CLIENT_ID,
    logger
)
from server.state import system

def load_widgets_config():
    """Carga la configuración persistente modular de cada widget desde widgets/<widget>/config.json"""
    cfg = {}

    # 1. Cargar cada archivo modular individual definido en WIDGET_CONFIG_MAPPING
    for widget_key, file_path in WIDGET_CONFIG_MAPPING.items():
        if widget_key in cfg:
            continue
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    cfg[widget_key] = json.load(f)
            except Exception as e:
                logger.error(f"Error al leer config modular de {widget_key} ({file_path}): {e}")

    # 2. Si faltan widgets o hay una configuración previa en widgets_config.json, complementar
    if WIDGETS_CONFIG_FILE.exists():
        try:
            with open(WIDGETS_CONFIG_FILE, "r", encoding="utf-8") as f:
                legacy = json.load(f)
                if isinstance(legacy, dict):
                    for k, v in legacy.items():
                        if k not in cfg:
                            cfg[k] = v
        except Exception as e:
            logger.error(f"Error al leer widgets_config.json legado: {e}")

    # 3. Escanear dinámicamente cualquier otra subcarpeta en widgets/ que tenga config.json
    if WIDGETS_DIR.exists():
        for sub in WIDGETS_DIR.iterdir():
            if sub.is_dir() and sub.name not in ["__pycache__", ".git"]:
                w_cfg_file = sub / "config.json"
                if w_cfg_file.exists() and sub.name not in cfg and sub.name != "shoutout":
                    try:
                        with open(w_cfg_file, "r", encoding="utf-8") as f:
                            cfg[sub.name] = json.load(f)
                    except Exception as e:
                        logger.error(f"Error al leer config de {sub.name}: {e}")

    return cfg

def save_widgets_config(cfg):
    """Guarda la configuración persistente en los archivos modulares widgets/<widget>/config.json y respalda widgets_config.json"""
    if not isinstance(cfg, dict):
        return False
    success = True
    try:
        # 1. Guardar cada sección en su carpeta modular correspondiente
        for widget_key, val in cfg.items():
            target_path = WIDGET_CONFIG_MAPPING.get(widget_key)
            if not target_path:
                target_path = WIDGETS_DIR / widget_key / "config.json"

            try:
                target_path.parent.mkdir(parents=True, exist_ok=True)
                with open(target_path, "w", encoding="utf-8") as f:
                    json.dump(val, f, indent=2, ensure_ascii=False)
            except Exception as e:
                logger.error(f"Error guardando config modular para {widget_key} en {target_path}: {e}")
                success = False

        # 2. Respaldar el archivo unificado widgets_config.json para compatibilidad total
        try:
            with open(WIDGETS_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error guardando copia unificada widgets_config.json: {e}")

        return success
    except Exception as e:
        logger.error(f"Error general en save_widgets_config: {e}")
        return False

async def auto_sync_twitch_goals(cfg):
    """Sincroniza automáticamente las metas oficiales reales de Twitch vía Helix sin botones manuales"""
    if not system.token_data or not system.user_info or not CLIENT_ID:
        return False
    
    b_id = system.user_info.get("id")
    if not b_id:
        return False

    headers = {
        "Client-Id": CLIENT_ID,
        "Authorization": f"Bearer {system.token_data['access_token']}"
    }

    goal_cfg = cfg.get("goal", {})
    goals_list = goal_cfg.get("goals", [])
    changed = False

    try:
        async with aiohttp.ClientSession() as session:
            # 1. Seguidores reales de Twitch
            async with session.get(f"https://api.twitch.tv/helix/channels/followers?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    f_data = await resp.json()
                    total_followers = f_data.get("total")
                    if total_followers is not None:
                        total_followers = int(total_followers)
                        if goal_cfg.get("type") == "followers" and goal_cfg.get("current") != total_followers:
                            goal_cfg["current"] = total_followers
                            changed = True
                        for g in goals_list:
                            if g.get("type") in ["followers", "follower"] and g.get("category") == "twitch":
                                if g.get("current") != total_followers:
                                    g["current"] = total_followers
                                    changed = True

            # 2. Suscriptores reales de Twitch
            async with session.get(f"https://api.twitch.tv/helix/subscriptions?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    s_data = await resp.json()
                    total_subs = s_data.get("total")
                    if total_subs is not None:
                        total_subs = int(total_subs)
                        if goal_cfg.get("type") in ["subscribers", "subs"] and goal_cfg.get("current") != total_subs:
                            goal_cfg["current"] = total_subs
                            changed = True
                        for g in goals_list:
                            if g.get("type") in ["subscribers", "subs"] and g.get("category") == "twitch":
                                if g.get("current") != total_subs:
                                    g["current"] = total_subs
                                    changed = True

            # 3. Metas oficiales creadas en Twitch Helix Goals
            async with session.get(f"https://api.twitch.tv/helix/goals?broadcaster_id={b_id}", headers=headers) as resp:
                if resp.status == 200:
                    g_data = await resp.json()
                    items = g_data.get("data", [])
                    if items:
                        for item in items:
                            g_type = item.get("type") # "follower" or "subscription"
                            cur = item.get("current_amount")
                            targ = item.get("target_amount")
                            desc = item.get("description")
                            for g in goals_list:
                                if (g.get("type") == "followers" and g_type == "follower") or (g.get("type") in ["subscribers", "subs"] and g_type == "subscription"):
                                    if cur is not None and g.get("current") != int(cur):
                                        g["current"] = int(cur)
                                        changed = True
                                    if targ is not None and g.get("target") != int(targ):
                                        g["target"] = int(targ)
                                        changed = True
                                    if desc and g.get("title") != desc:
                                        g["title"] = desc
                                        changed = True
    except Exception as e:
        logger.warning(f"Aviso en sincronización automática de metas Twitch: {e}")

    if changed:
        cfg["goal"] = goal_cfg
        save_widgets_config(cfg)
    return changed

