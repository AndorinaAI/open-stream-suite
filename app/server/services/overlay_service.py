"""
server/services/overlay_service.py — Servicio de persistencia y sincronización de textos de escenas y overlays
Gestiona la lectura/escritura de overlay_texts_config.json y la regeneración de config.js para soporte offline.
"""

import copy
import json
from pathlib import Path
from server.config import BASE_DIR, logger

OVERLAY_TEXTS_FILE = BASE_DIR / "overlay_texts_config.json"
OVERLAY_TEXTS_EN_FILE = BASE_DIR / "overlay_texts_config.en.json"
CONFIG_JS_FILE = BASE_DIR / "config.js"

DEFAULT_OVERLAY_TEXTS = {
    "channel": {
        "name": "ANDORINA",
        "tagline": "JUGAR · CREAR · TRASTEAR",
        "visible": True,
        "showLiveIndicator": True,
        "liveText": "EN DIRECTO",
        "socials": {
            "visible": False,
            "twitch": "andorina",
            "youtube": "andorina",
            "twitter": "andorina",
            "instagram": "andorina",
            "github": "andorina"
        }
    },
    "game": {
        "badgeText": "GAME MODE",
        "tagline": "MODO JUEGO / GAMEPLAY"
    },
    "maker": {
        "projectName": "NAS CON RASPBERRY PI",
        "currentPhase": "02 MONTAJE",
        "detail": "Armbian OS · PCB v1.2 · Caja a medida",
        "panelTitle": "ESTADO DEL PROYECTO",
        "projectPrefix": "PROYECTO:",
        "frames": {
            "main": "CÁMARA CENITAL · BANCO DE TRABAJO",
            "face": "STREAMER",
            "aux": "PC / TERMINAL"
        },
        "phases": [
            "01 PLAN",
            "02 MONTAJE",
            "03 SOFTWARE",
            "04 PRUEBAS"
        ],
        "showAuxView": True
    },
    "print": {
        "projectName": "PEGATINAS PERSONALIZADAS",
        "material": "Vinilo Holográfico Adhesivo",
        "currentPhase": "CORTE DE VINILO",
        "panelTitle": "TRABAJO DE CORTE / IMPRESIÓN",
        "projectPrefix": "TRABAJO:",
        "frames": {
            "main": "CÁMARA PLOTTER / MÁQUINA",
            "face": "STREAMER",
            "aux": "SOFTWARE & CORTE"
        },
        "phases": [
            "DISEÑO VECTORIAL",
            "CORTE DE VINILO",
            "PELADO & TRANSFER",
            "APLICACIÓN"
        ],
        "showAuxView": True
    },
    "chill": {
        "subtitle": "CHARLA TRANQUILA · CAFÉ · COMUNIDAD",
        "chatTitle": "CHAT DEL STREAM",
        "chatStatus": "CONECTADO A TWITCH",
        "podcastTitle": "OPEN STREAM PODCAST",
        "guestNameplates": [
            "INVITADO 1",
            "INVITADO 2"
        ]
    },
    "startingSoon": {
        "title": "EL STREAM EMPIEZA PRONTO",
        "subtitle": "PREPARANDO CAFÉ Y REVISANDO CABLES...",
        "countdownSeconds": 300,
        "badgeText": "STARTING SOON",
        "liveStatusText": "EMPEZANDO..."
    },
    "beRightBack": {
        "title": "YA VUELVO",
        "subtitle": "UN BREVE DESCANSO · EL STREAM CONTINÚA EN BREVE",
        "countdownSeconds": 300,
        "badgeText": "PAUSA TÉCNICA",
        "liveStatusText": "PAUSA"
    },
    "ending": {
        "title": "STREAM FINALIZADO",
        "subtitle": "¡MUCHAS GRACIAS POR ACOMPAÑARME!",
        "badgeText": "OFFLINE",
        "liveStatusText": "FIN DEL STREAM",
        "credits": [
            "Gracias por el apoyo a todos los suscriptores y vips",
            "Nos vemos en el próximo directo",
            "¡Que tengáis un buen día!"
        ]
    },
    "pomodoro": {
        "taskName": "SESIÓN DE CONCENTRACIÓN & ESTUDIO",
        "focusSeconds": 1500,
        "shortBreakSeconds": 300,
        "longBreakSeconds": 900
    },
    "performance": {
        "enableAnimations": True
    }
}


def deep_merge(base: dict, override: dict) -> dict:
    """Combina dos dicts de forma profunda: los valores de override sobreescriben base,
    para sub-dicts se combina recursivamente, los arrays se reemplazan (no se concatenan)."""
    result = copy.deepcopy(base)
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge(result[k], v)
        else:
            result[k] = copy.deepcopy(v)
    return result


def load_overlay_texts(lang: str = None) -> dict:
    """Carga los textos configurados desde overlay_texts_config.json o overlay_texts_config.en.json"""
    target_file = OVERLAY_TEXTS_EN_FILE if lang == "en" and OVERLAY_TEXTS_EN_FILE.exists() else OVERLAY_TEXTS_FILE
    if target_file.exists():
        try:
            with open(target_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return deep_merge(DEFAULT_OVERLAY_TEXTS, data)
        except Exception as e:
            logger.warning(f"Error leyendo {target_file.name}: {e}")

    return json.loads(json.dumps(DEFAULT_OVERLAY_TEXTS))


def save_overlay_texts_to_disk(texts: dict):
    """Guarda la configuración en overlay_texts_config.json y actualiza config.js para soporte offline"""
    # 1. Guardar JSON
    with open(OVERLAY_TEXTS_FILE, "w", encoding="utf-8") as f:
        json.dump(texts, f, indent=2, ensure_ascii=False)

    # 2. Generar config.js para overlays sin servidor o modo offline
    json_str = json.dumps(texts, indent=2, ensure_ascii=False)
    js_content = f"""/**
 * ====================================================================
 * OPEN STREAM SUITE — CONFIGURACIÓN CENTRALIZADA DE OVERLAYS Y ESCENAS
 * ====================================================================
 * Generado automáticamente por el panel de control Open Stream Suite.
 * Modifica desde el panel web o directamente en este archivo.
 */

window.OSS_CONFIG = {json_str};
window.TALLER_CONFIG = window.OSS_CONFIG;  // alias de compatibilidad hacia atrás
"""
    try:
        with open(CONFIG_JS_FILE, "w", encoding="utf-8") as f:
            f.write(js_content)
        logger.info("✓ config.js regenerado con los textos actualizados")
    except Exception as e:
        logger.warning(f"Error actualizando config.js: {e}")


def reset_overlay_texts(section: str = "all", scene_key: str = None) -> dict:
    """Restaura los textos de overlays globalmente o para una sección/escena específica"""
    current_texts = load_overlay_texts()
    if section == "all":
        current_texts = copy.deepcopy(DEFAULT_OVERLAY_TEXTS)
    else:
        if section in DEFAULT_OVERLAY_TEXTS:
            current_texts[section] = copy.deepcopy(DEFAULT_OVERLAY_TEXTS[section])
        if "customScenes" in current_texts:
            targets = {section}
            if scene_key:
                targets.add(scene_key)
            for t in targets:
                current_texts["customScenes"].pop(t, None)
                for k in list(current_texts["customScenes"].keys()):
                    if k == t or k.startswith(t) or t.startswith(k):
                        current_texts["customScenes"].pop(k, None)

    save_overlay_texts_to_disk(current_texts)
    return current_texts
