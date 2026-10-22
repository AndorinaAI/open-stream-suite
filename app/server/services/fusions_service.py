"""
server/services/fusions_service.py — Servicio de gestión de "Fusiones" (Fusions)
Permite agrupar overlays procedentes de diferentes packs en packs personalizados híbridos
y aplicar estilos en lote (batch styling) a los overlays de cada fusión.
"""

import json
from datetime import datetime
from pathlib import Path
from server.config import BASE_DIR, logger
from server.services.theme_service import set_overlay_theme_service

FUSIONS_FILE = BASE_DIR / "fusions.json"

DEFAULT_FUSIONS = [
    {
        "id": "fusion_starter_mix",
        "name": "Mix Destacado Stream",
        "icon": "⚡",
        "description": "Fusión híbrida con lo mejor de cada pack: charla relajada, taller maker y pausas.",
        "scenes": [
            "oss_chatting",
            "maker-desk",
            "cozy_brb",
            "gamer_victory"
        ],
        "defaultTheme": "maker",
        "createdAt": "2026-10-22T02:00:00Z"
    }
]


def load_fusions() -> list:
    """Carga la lista de fusiones guardadas en disco o inicializa con las fusiones por defecto"""
    if not FUSIONS_FILE.exists():
        save_fusions(DEFAULT_FUSIONS)
        return list(DEFAULT_FUSIONS)

    try:
        with open(FUSIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "fusions" in data and isinstance(data["fusions"], list):
                return data["fusions"]
            return list(DEFAULT_FUSIONS)
    except Exception as e:
        logger.warning(f"Error cargando fusions.json: {e}")
        return list(DEFAULT_FUSIONS)


def save_fusions(fusions: list) -> bool:
    """Guarda la lista de fusiones en fusions.json"""
    try:
        with open(FUSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(fusions, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error guardando fusions.json: {e}")
        return False


def get_fusion_by_id(fusion_id: str) -> dict | None:
    fusions = load_fusions()
    for f in fusions:
        if f.get("id") == fusion_id:
            return f
    return None


def create_or_update_fusion(data: dict) -> dict:
    """Crea una nueva fusión o actualiza una existente"""
    name = str(data.get("name", "")).strip()
    if not name:
        raise ValueError("El nombre de la fusión es obligatorio")

    fusions = load_fusions()
    fusion_id = str(data.get("id", "")).strip()

    if not fusion_id:
        # Generar un ID único basado en timestamp
        timestamp = int(datetime.utcnow().timestamp())
        slug = "".join(c if c.isalnum() else "_" for c in name.lower())[:20].strip("_")
        fusion_id = f"fusion_{slug}_{timestamp}"

    scenes = data.get("scenes", [])
    if not isinstance(scenes, list):
        scenes = []

    clean_scenes = [str(s).strip() for s in scenes if str(s).strip()]

    fusion_obj = {
        "id": fusion_id,
        "name": name,
        "icon": str(data.get("icon", "⚡")).strip() or "⚡",
        "description": str(data.get("description", "")).strip() or "Fusión personalizada de overlays para streaming.",
        "scenes": clean_scenes,
        "defaultTheme": str(data.get("defaultTheme", "maker")).strip() or "maker",
        "updatedAt": datetime.utcnow().isoformat() + "Z"
    }

    existing_idx = None
    for idx, item in enumerate(fusions):
        if item.get("id") == fusion_id:
            existing_idx = idx
            break

    if existing_idx is not None:
        fusion_obj["createdAt"] = fusions[existing_idx].get("createdAt", fusion_obj["updatedAt"])
        fusions[existing_idx] = fusion_obj
    else:
        fusion_obj["createdAt"] = fusion_obj["updatedAt"]
        fusions.append(fusion_obj)

    save_fusions(fusions)
    logger.info(f"⚡ Fusión guardada correctamente: {fusion_id} ('{name}') con {len(clean_scenes)} escenas")
    return fusion_obj


def delete_fusion(fusion_id: str) -> bool:
    """Elimina una fusión por su ID"""
    fusions = load_fusions()
    filtered = [f for f in fusions if f.get("id") != fusion_id]
    if len(filtered) == len(fusions):
        return False
    save_fusions(filtered)
    logger.info(f"🗑️ Fusión eliminada: {fusion_id}")
    return True


async def apply_fusion_theme_batch(fusion_id: str, theme_id: str) -> dict:
    """Aplica un tema visual a todas las escenas que componen la fusión"""
    fusion = get_fusion_by_id(fusion_id)
    if not fusion:
        raise ValueError(f"Fusión '{fusion_id}' no encontrada")

    scenes = fusion.get("scenes", [])
    applied_scenes = []

    for sc_key in scenes:
        try:
            await set_overlay_theme_service(sc_key, theme_id)
            applied_scenes.append(sc_key)
        except Exception as e:
            logger.warning(f"Error asignando tema '{theme_id}' a escena '{sc_key}' en fusión: {e}")

    # Actualizar defaultTheme de la fusión
    fusion["defaultTheme"] = theme_id
    create_or_update_fusion(fusion)

    logger.info(f"✨ Estilo '{theme_id}' aplicado en lote a {len(applied_scenes)} escenas de la fusión '{fusion_id}'")
    return {
        "status": "ok",
        "fusionId": fusion_id,
        "themeId": theme_id,
        "appliedScenes": applied_scenes
    }


async def apply_fusion_shape_batch(fusion_id: str, shape_id: str) -> dict:
    """Aplica una forma física a todas las escenas que componen la fusión"""
    fusion = get_fusion_by_id(fusion_id)
    if not fusion:
        raise ValueError(f"Fusión '{fusion_id}' no encontrada")

    scenes = fusion.get("scenes", [])
    applied_scenes = []

    for sc_key in scenes:
        try:
            await set_overlay_theme_service(sc_key, shape_id=shape_id)
            applied_scenes.append(sc_key)
        except Exception as e:
            logger.warning(f"Error asignando forma '{shape_id}' a escena '{sc_key}' en fusión: {e}")

    fusion["defaultShape"] = shape_id
    create_or_update_fusion(fusion)

    logger.info(f"✨ Forma '{shape_id}' aplicada en lote a {len(applied_scenes)} escenas de la fusión '{fusion_id}'")
    return {
        "status": "ok",
        "fusionId": fusion_id,
        "shapeId": shape_id,
        "appliedScenes": applied_scenes
    }
