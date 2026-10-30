"""
server/services/overlay_service.py — Servicio de persistencia y sincronización de textos de escenas y overlays
Gestiona la lectura/escritura de overlay_texts_config.json y la regeneración de config.js para soporte offline.
"""

import copy
import json
from pathlib import Path
from server.config import BASE_DIR, logger
from server.services.fs_utils import atomic_write_json, atomic_write_text

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


def build_config_payload(texts: dict) -> dict:
    """Textos + estado de escenas/temas, tal y como lo consume `config.js`.

    Sincronización escena↔tema (T4): `overlay.js` decide el tema y la forma de la
    escena de forma SÍNCRONA a partir de `config.overlayThemes` /
    `config.overlayShapes` / `config.activeTheme` y sólo después lo corrige
    consultando `/api/themes/packs`. Como `config.js` sólo llevaba los textos, el
    estado real llegaba tarde y la escena se pintaba con el tema por defecto y se
    re-maquetaba al responder el fetch ("los elementos aparecen descolocados y se
    recolocan al abrir o cambiar de escena"). Incrustar el estado aquí hace que el
    primer pintado ya sea el definitivo.
    """
    payload = dict(texts)
    try:
        from server.services.theme_manager import load_theme_state
        state = load_theme_state() or {}
    except Exception as e:  # nunca debe romper el guardado de textos
        logger.warning(f"No se pudo leer themes_state.json para config.js: {e}")
        return payload

    for key in ("activePack", "activeTheme", "activeShape", "globalThemeActive"):
        if state.get(key) is not None:
            payload[key] = state[key]
    if payload.get("activeShape") is None:
        payload["activeShape"] = "original"
    for key in ("overlayThemes", "overlayShapes", "overlayThemeExplicit", "defaultOverlayThemes", "backdrops"):
        # Se publican SIEMPRE (aunque estén vacíos): el contrato de config.js es
        # que las claves existen, y así `sync_config_js_state` no reescribe el
        # fichero en cada arranque.
        value = state.get(key)
        payload[key] = value if isinstance(value, dict) else {}
    # Fuente única de defaults para overlay.js/01-state.js (27 escenas reales).
    try:
        from server.services.theme_manager import DEFAULT_OVERLAY_THEMES
        payload["defaultOverlayThemes"] = dict(DEFAULT_OVERLAY_THEMES)
    except Exception:
        payload.setdefault("defaultOverlayThemes", {})
    # Arquetipo de cada tema (derivado de disco): permite que widgets y alertas
    # apliquen la familia de tokens `--skin-*` sin conocer ningún pack. Al salir
    # del disco, todo tema nuevo se resuelve solo (nada que registrar a mano).
    try:
        from server.services.theme_manager import get_theme_archetype_map
        payload["themeArchetypes"] = get_theme_archetype_map()
    except Exception as e:
        logger.warning(f"No se pudo publicar themeArchetypes en config.js: {e}")
        payload.setdefault("themeArchetypes", {})
    # Catalogo del motor: tema y forma por defecto de cada pack, arquetipo de
    # cada forma y textos de "atmosfera" por arquetipo. Es lo que permite que
    # `overlay.js` no tenga ninguna lista propia: un pack nuevo aparece solo.
    try:
        payload["themeCatalog"] = build_theme_catalog()
    except Exception as e:
        logger.warning(f"No se pudo publicar themeCatalog en config.js: {e}")
        payload.setdefault("themeCatalog", {})
    return payload


def build_theme_catalog() -> dict:
    """Catalogo derivado del manifiesto (packs -> defaults, formas, atmosfera)."""
    from server.services import theme_engine

    packs = theme_engine.load_packs()
    catalog = theme_engine.build_shape_catalog()
    return {
        "packs": [
            {
                "id": pack.id,
                "archetype": pack.archetype,
                "defaultTheme": pack.default_theme,
                "defaultShape": pack.default_shape,
                "themes": [theme.id for theme in pack.themes],
            }
            for pack in packs
        ],
        "packDefaults": catalog.get("packDefaults", {}),
        "shapeArchetypes": catalog.get("shapeArchetypes", {}),
        "archetypeAtmosphere": catalog.get("archetypeAtmosphere", {}),
    }


def write_config_js(texts: "dict | None" = None) -> None:
    """(Re)genera `config.js` con los textos y el estado actual de escenas/temas."""
    if texts is None:
        texts = load_overlay_texts()
    json_str = json.dumps(build_config_payload(texts), indent=2, ensure_ascii=False)
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
        atomic_write_text(CONFIG_JS_FILE, js_content)
        logger.info("✓ config.js regenerado con los textos actualizados")
    except Exception as e:
        logger.warning(f"Error actualizando config.js: {e}")


def _deep_merge_texts(base: dict, incoming: dict) -> dict:
    """Mezcla los textos del panel sobre los existentes sin borrar secciones.

    El formulario del panel sólo envía las secciones que edita; antes el guardado
    reemplazaba el archivo completo y eliminaba `cozy`, `oss`, `pomodoro`,
    `victory`, `art` y `speedrun`.
    """
    out = dict(base or {})
    for key, value in (incoming or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _deep_merge_texts(out[key], value)
        else:
            out[key] = value
    return out


def save_overlay_texts_to_disk(texts: dict, replace: bool = False):
    """Guarda los textos en overlay_texts_config.json y regenera config.js.

    `config.js` lleva ahora también el estado de escenas/temas (ver
    `build_config_payload`), así que cualquier escritura de textos mantiene ambas
    cosas sincronizadas.
    """
    merged = texts
    try:
        existing = {}
        if OVERLAY_TEXTS_FILE.exists():
            existing = json.loads(OVERLAY_TEXTS_FILE.read_text(encoding="utf-8"))
        # En un reset hay que reemplazar, no volver a fusionar: el merge
        # conservaba las claves customScenes que el reset acababa de eliminar.
        merged = texts if replace else _deep_merge_texts(existing, texts)
        atomic_write_json(OVERLAY_TEXTS_FILE, merged)
    except Exception as e:
        logger.warning(f"Error guardando overlay_texts_config.json: {e}")
    write_config_js(merged)


def sync_config_js_state() -> None:
    """Regenera config.js si le falta el estado de escenas/temas (arranque del servidor)."""
    try:
        current = CONFIG_JS_FILE.read_text(encoding="utf-8") if CONFIG_JS_FILE.exists() else ""
    except Exception:
        current = ""
    needed = ("overlayThemes", "overlayShapes", "overlayThemeExplicit", "globalThemeActive",
              "defaultOverlayThemes", "themeArchetypes")
    if all(k in current for k in needed):
        return
    write_config_js()


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

    save_overlay_texts_to_disk(current_texts, replace=True)
    return current_texts


def build_theme_palette() -> dict:
    """Tokens de color/geometria de cada tema, leidos de disco.

    El panel necesita la paleta REAL del pack para ofrecerla al personalizar:
    antes enseñaba colores fijos (`#57D6C4`) que no pertenecen a ningun tema, y
    de ahi la sensacion de "todo mezclado". Se derivan de `theme.json`, asi que
    un tema nuevo aparece solo.

    Devuelve `{theme_id: {pack, name, archetype, tokens}}`.
    """
    import json as _json
    from pathlib import Path as _Path
    from server.config import BASE_DIR as _BASE

    # Tokens utiles para el panel: color y geometria. El resto (patrones de
    # escena, glows complejos) no se ofrece porque no es una eleccion simple.
    WANTED = (
        "--color-accent-cyan", "--color-accent-orange", "--color-panel-bg",
        "--color-bg-dark", "--color-text-light", "--color-text-dim",
        "--color-border-cyan", "--panel-radius", "--frame-radius", "--badge-radius",
    )
    out = {}
    root = _Path(_BASE) / "streamthemes"
    try:
        candidates = sorted(root.glob("*/styles/*/theme.json"))
    except Exception:
        candidates = []
    for tj in candidates:
        theme_id = tj.parent.name
        pack_id = tj.parent.parent.parent.name
        try:
            data = _json.loads(tj.read_text(encoding="utf-8"))
        except Exception:
            continue
        tokens = data.get("tokens") or {}
        out[theme_id] = {
            "pack": pack_id,
            "name": data.get("name") or theme_id,
            "archetype": data.get("archetype"),
            "tokens": {k: tokens[k] for k in WANTED if k in tokens},
        }
    return out


def build_theme_bootstrap() -> dict:
    """Payload unico de arranque de tema para los overlays.

    `config.js` es el config de ESCENAS y no publica las claves `widget:*` ni
    `alert:*`. Por eso cada overlay tiene que pedir su propio arranque: sin
    esto, `overlayThemes` llegaba vacio y el tema asignado en el panel se
    ignoraba (el overlay caia al tema global, que suele estar desactivado,
    y acababa borrando `data-theme`).

    Nunca lanza: si `themes_state.json` falta o esta corrupto devuelve los
    mapas vacios y `globalThemeActive=False`, para que el overlay se quede con
    su aspecto base en vez de romperse.

    Las claves son SIEMPRE las mismas 6, presentes o vacias: el contrato del
    cliente es que existen.
    """
    try:
        from server.services.theme_manager import load_theme_state, get_theme_archetype_map
        state = load_theme_state() or {}
    except Exception as exc:  # pragma: no cover - defensivo
        logger.warning(f"No se pudo leer themes_state.json para el arranque de tema: {exc}")
        state = {}

    out = {
        "globalThemeActive": bool(state.get("globalThemeActive")),
        "activeTheme": state.get("activeTheme"),
        "activePack": state.get("activePack"),
        "activeShape": state.get("activeShape"),
    }
    for key in ("overlayThemes", "overlayShapes", "overlayThemeExplicit", "defaultOverlayThemes"):
        value = state.get(key)
        out[key] = value if isinstance(value, dict) else {}
    try:
        out["themeArchetypes"] = get_theme_archetype_map()
    except Exception:
        out["themeArchetypes"] = {}
    return out
