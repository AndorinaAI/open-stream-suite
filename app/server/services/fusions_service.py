"""
server/services/fusions_service.py — Servicio de gestión de "Fusiones" (Fusions)
Permite agrupar overlays procedentes de diferentes packs en packs personalizados híbridos
y aplicar estilos en lote (batch styling) a los overlays de cada fusión.
"""

import copy
import json
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from server.config import BASE_DIR, logger
from server.services.fs_utils import atomic_write_json, lock_for
from server.services.theme_service import (
    reset_overlay_assignment_service,
    set_overlay_theme_service,
)
from server.services import components_catalog, scenes_catalog
from server.services.validation_utils import (
    is_valid_theme_id,
    is_valid_shape_id,
    sanitize_metadata_text,
    METADATA_NAME_MAX,
    METADATA_DESC_MAX,
    METADATA_ICON_MAX,
)

# V3-06: el id que envía el cliente se interpola en `onclick="..."` y en `id="..."`
# del panel, así que se bloquea lo que rompería un atributo HTML o un argumento
# JS inline (comillas, paréntesis, `;`, `<`, espacios…). Se admiten letras con
# acentos porque el generador histórico ya creó ids así y siguen en disco.
FUSION_ID_MAX = 64
FUSION_ID_FORBIDDEN = set("<>\"'`(){}[];:,/\\ \t\r\n")


def _is_safe_fusion_id(value: str) -> bool:
    """True si el id es seguro para `onclick`, `id="..."` y URLs."""
    return bool(value) and len(value) <= FUSION_ID_MAX and not (set(value) & FUSION_ID_FORBIDDEN)


def _slugify_ascii(value: str, max_length: int = 20) -> str:
    """Slug ASCII para ids nuevos: sin acentos ni caracteres problemáticos."""
    normalized = unicodedata.normalize("NFKD", str(value))
    ascii_only = "".join(c for c in normalized if not unicodedata.combining(c))
    slug = "".join(c if (c.isascii() and c.isalnum()) else "_" for c in ascii_only.lower())
    return slug[:max_length].strip("_")

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
        "widgets": [],
        "alerts": [],
        "defaultTheme": "maker",
        "defaultShape": "original",
        "createdAt": "2026-10-22T02:00:00Z"
    }
]


def _normalize_loaded_fusions(items) -> list:
    """Contrato de lectura uniforme: toda fusión expone scenes/widgets/alerts como listas.

    Las fusiones antiguas sólo tienen `scenes`; sin esto la API devolvía
    `widgets: null` y cada consumidor tenía que defenderse con `|| []`.
    """
    out = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        item.setdefault("scenes", [])
        item.setdefault("widgets", [])
        item.setdefault("alerts", [])
        item.setdefault("defaultTheme", "maker")
        item.setdefault("defaultShape", "original")
        for key in ("scenes", "widgets", "alerts"):
            if not isinstance(item.get(key), list):
                item[key] = []
        out.append(item)
    return out


def _validate_fusion_defaults(default_theme, default_shape):
    """Valida los defaults contra el catálogo real (M1).

    Un default es una referencia del editor, no una asignación: puede ser una
    forma de escena, una genérica de widget o una de alerta. Se acepta cualquier
    forma del catálogo unificado; la aplicación por miembro decide después quién
    la soporta (M3).
    """
    theme = str(default_theme or "").strip() or "maker"
    if not is_valid_theme_id(theme_id=theme):
        raise ValueError(f"Tema predeterminado desconocido: {theme}")

    shape = str(default_shape or "").strip() or "original"
    if shape.lower() not in ("auto", "original"):
        if shape not in components_catalog.get_alert_shapes() and not is_valid_shape_id(shape):
            raise ValueError(f"Forma predeterminada desconocida: {shape}")
    return theme, shape


def load_fusions() -> list:
    """Carga fusiones, normaliza el esquema y persiste una sola vez si cambió."""
    if not FUSIONS_FILE.exists():
        save_fusions(DEFAULT_FUSIONS)
        return _normalize_loaded_fusions(copy.deepcopy(DEFAULT_FUSIONS))

    try:
        with lock_for(FUSIONS_FILE):
            with open(FUSIONS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                normalized = _normalize_loaded_fusions(copy.deepcopy(data))
            elif isinstance(data, dict) and "fusions" in data and isinstance(data["fusions"], list):
                normalized = _normalize_loaded_fusions(copy.deepcopy(data["fusions"]))
            else:
                normalized = _normalize_loaded_fusions(copy.deepcopy(DEFAULT_FUSIONS))
            # L3: API y disco con el mismo esquema; no reescribe en cada lectura.
            if data != normalized:
                save_fusions(normalized)
            return normalized
    except Exception as e:
        logger.warning(f"Error cargando fusions.json: {e}")
        return _normalize_loaded_fusions(copy.deepcopy(DEFAULT_FUSIONS))

def save_fusions(fusions: list) -> bool:
    """Guarda la lista de fusiones en fusions.json (atómico + lock por archivo)."""
    try:
        atomic_write_json(FUSIONS_FILE, fusions)
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
    """Crea/actualiza una fusión bajo un lock de mutación (M13)."""
    with lock_for(FUSIONS_FILE):
        return _create_or_update_fusion(data)


def _create_or_update_fusion(data: dict) -> dict:
    """Implementación interna; el wrapper mantiene el lock de lectura/escritura."""

    # V3-01: los metadatos de la fusión se pintan con innerHTML en el panel
    # (nombre, icono y descripción) → se sanean antes de persistir.
    name = sanitize_metadata_text(
        data.get("name", ""), "El nombre de la fusión",
        max_length=METADATA_NAME_MAX, required=True
    )

    default_theme, default_shape = _validate_fusion_defaults(
        data.get("defaultTheme"), data.get("defaultShape")
    )

    fusions = load_fusions()
    fusion_id = str(data.get("id", "")).strip()
    # V3-06: el id llega del cliente y se interpola en onclick/id del panel.
    if fusion_id and not _is_safe_fusion_id(fusion_id):
        raise ValueError("ID de fusión inválido: no puede contener comillas, paréntesis ni '<>'")

    if not fusion_id:
        # Generar un ID único basado en timestamp (slug ASCII: se usa en onclick,
        # en `id="..."` y en URLs, así que nada de acentos ni caracteres raros).
        timestamp = int(datetime.now(timezone.utc).timestamp())
        slug = _slugify_ascii(name) or "custom"
        fusion_id = f"fusion_{slug}_{timestamp}"

    scenes = data.get("scenes", [])
    if not isinstance(scenes, list):
        scenes = []
    raw_widgets = data.get("widgets") if isinstance(data.get("widgets"), list) else []
    raw_alerts = data.get("alerts") if isinstance(data.get("alerts"), list) else []
    raw_member_count = len(scenes) + len(raw_widgets) + len(raw_alerts)

    # Normalizar a claves canónicas de escena (el panel puede enviar alias como
    # 'maker/desk' o 'starting-soon'). Las claves que no corresponden a ninguna
    # escena NO se persisten: antes quedaban guardadas y luego la vista de la
    # fusión no podía resolverlas (escenas que "desaparecían" de la fusión).
    clean_scenes, unknown_scenes = [], []
    for raw in scenes:
        raw_key = str(raw).strip()
        if not raw_key:
            continue
        canonical = scenes_catalog.normalize_scene_key(raw_key)
        if not canonical:
            unknown_scenes.append(raw_key)
            continue
        if canonical not in clean_scenes:
            clean_scenes.append(canonical)
    if unknown_scenes:
        logger.warning(f"⚠️ Fusión '{name}': ignoradas claves de escena desconocidas {unknown_scenes}")

    # Miembros no-escena: widgets y alertas de panel (claves planas, sin prefijo).
    clean_widgets, unknown_widgets = [], []
    for raw in raw_widgets:
        wid = str(raw).strip()
        if not wid:
            continue
        if not components_catalog.is_valid_component("widget", wid):
            unknown_widgets.append(wid)
            continue
        if wid not in clean_widgets:
            clean_widgets.append(wid)
    clean_alerts, unknown_alerts = [], []
    for raw in raw_alerts:
        aid = str(raw).strip()
        if not aid:
            continue
        if not components_catalog.is_valid_component("alert", aid):
            unknown_alerts.append(aid)
            continue
        if aid not in clean_alerts:
            clean_alerts.append(aid)
    if unknown_widgets:
        logger.warning(f"⚠️ Fusión '{name}': widgets desconocidos ignorados {unknown_widgets}")
    if unknown_alerts:
        logger.warning(f"⚠️ Fusión '{name}': alertas desconocidas ignoradas {unknown_alerts}")

    if raw_member_count and not (clean_scenes or clean_widgets or clean_alerts):
        raise ValueError(
            "La fusión no tiene miembros válidos. "
            f"Escenas: {unknown_scenes or '—'}; widgets: {unknown_widgets or '—'}; "
            f"alertas: {unknown_alerts or '—'}"
        )

    fusion_obj = {
        "id": fusion_id,
        "name": name,
        "icon": sanitize_metadata_text(
            data.get("icon"), "Icono de la fusión", max_length=METADATA_ICON_MAX, default="⚡"
        ) or "⚡",
        "description": sanitize_metadata_text(
            data.get("description"), "Descripción de la fusión", max_length=METADATA_DESC_MAX,
            default="Fusión personalizada de overlays para streaming."
        ) or "Fusión personalizada de overlays para streaming.",
        "scenes": clean_scenes,
        "widgets": clean_widgets,
        "alerts": clean_alerts,
        "defaultTheme": default_theme,
        "defaultShape": default_shape,
        "updatedAt": datetime.now(timezone.utc).isoformat()
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
    logger.info(
        f"⚡ Fusión guardada: {fusion_id} ('{name}') con {len(clean_scenes)} escenas, "
        f"{len(clean_widgets)} widgets y {len(clean_alerts)} alertas"
    )
    warnings = []
    if unknown_scenes:
        fusion_obj["unknownScenes"] = unknown_scenes
        warnings.append(f"Escenas ignoradas: {', '.join(unknown_scenes)}")
    if unknown_widgets:
        fusion_obj["unknownWidgets"] = unknown_widgets
        warnings.append(f"Widgets ignorados: {', '.join(unknown_widgets)}")
    if unknown_alerts:
        fusion_obj["unknownAlerts"] = unknown_alerts
        warnings.append(f"Alertas ignoradas: {', '.join(unknown_alerts)}")
    if warnings:
        fusion_obj["warnings"] = warnings
    return fusion_obj


def delete_fusion(fusion_id: str) -> bool:
    """Elimina una fusión por su ID."""
    with lock_for(FUSIONS_FILE):
        return _delete_fusion(fusion_id)


def _delete_fusion(fusion_id: str) -> bool:
    fusions = load_fusions()
    filtered = [f for f in fusions if f.get("id") != fusion_id]
    if len(filtered) == len(fusions):
        return False
    save_fusions(filtered)
    logger.info(f"🗑️ Fusión eliminada: {fusion_id}")
    return True


def _batch_result(status: str, **extra) -> dict:
    """Respuesta homogénea de las operaciones en lote sobre una fusión.

    `ok` es False cuando NO se aplicó nada por un fallo real, de modo que el panel
    puede distinguir "0 escenas aplicadas" (fusión vacía) de "no se pudo aplicar".
    """
    result = {"ok": status != "error", "status": status}
    result.update(extra)
    return result


async def apply_fusion_theme_batch(fusion_id: str, theme_id: str) -> dict:
    """Aplica un tema visual a todas las escenas que componen la fusión.

    Contrato (T4):
      * Si el `themeId` no existe se lanza ValueError ANTES de tocar nada (la ruta
        lo traduce a 400). Antes cada escena fallaba por dentro, el error quedaba
        sólo en `logger.warning` y la respuesta era **200 con `appliedScenes: []`**,
        así que el panel no podía distinguir "0 escenas" de "fallo silencioso".
      * Devuelve siempre `ok` (bool), `status` ("ok" | "partial" | "error"),
        `appliedScenes`, `failedScenes` y `skippedScenes` (claves de escena que ya
        no existen en el catálogo).
    """
    fusion = get_fusion_by_id(fusion_id)
    if not fusion:
        raise ValueError(f"Fusión '{fusion_id}' no encontrada")

    theme_id = str(theme_id or "").strip()
    if not theme_id:
        raise ValueError("themeId requerido")
    if not is_valid_theme_id(theme_id=theme_id):
        raise ValueError(f"Tema desconocido: {theme_id}")

    scenes = fusion.get("scenes", [])
    applied_scenes = []
    failed_scenes = []
    skipped_scenes = []

    for sc_key in scenes:
        canonical = scenes_catalog.normalize_scene_key(sc_key)
        if not canonical:
            logger.warning(f"Fusión '{fusion_id}': clave de escena desconocida '{sc_key}' (omitida)")
            skipped_scenes.append(sc_key)
            continue
        try:
            await set_overlay_theme_service(canonical, theme_id)
            applied_scenes.append(canonical)
        except Exception as e:
            logger.warning(f"Error asignando tema '{theme_id}' a escena '{sc_key}' en fusión: {e}")
            failed_scenes.append({"sceneKey": canonical, "error": str(e)})

    # Miembros no-escena: widgets y alertas comparten la misma asignación única.
    applied_widgets, failed_widgets = [], []
    applied_alerts, failed_alerts = [], []
    for wid in fusion.get("widgets", []):
        try:
            await set_overlay_theme_service(f"widget:{wid}", theme_id)
            applied_widgets.append(wid)
        except Exception as e:
            logger.warning(f"Error asignando tema a widget '{wid}' en fusión: {e}")
            failed_widgets.append({"widgetId": wid, "error": str(e)})
    for aid in fusion.get("alerts", []):
        try:
            await set_overlay_theme_service(f"alert:{aid}", theme_id)
            applied_alerts.append(aid)
        except Exception as e:
            logger.warning(f"Error asignando tema a alerta '{aid}' en fusión: {e}")
            failed_alerts.append({"alertId": aid, "error": str(e)})

    members = scenes or fusion.get("widgets") or fusion.get("alerts")
    any_applied = applied_scenes or applied_widgets or applied_alerts
    any_failed = failed_scenes or failed_widgets or failed_alerts
    if any_applied or not members:
        fusion["defaultTheme"] = theme_id
        create_or_update_fusion(fusion)

    status = "error" if (any_failed and not any_applied) else ("partial" if any_failed else "ok")
    logger.info(
        f"✨ Estilo '{theme_id}' aplicado en lote a {len(applied_scenes)}/{len(scenes)} escenas "
        f"de la fusión '{fusion_id}' (estado: {status})"
    )
    return _batch_result(
        status,
        fusionId=fusion_id,
        themeId=theme_id,
        appliedScenes=applied_scenes,
        failedScenes=failed_scenes,
        skippedScenes=skipped_scenes,
        appliedWidgets=applied_widgets,
        failedWidgets=failed_widgets,
        appliedAlerts=applied_alerts,
        failedAlerts=failed_alerts,
    )


async def apply_fusion_shape_batch(fusion_id: str, shape_id: str) -> dict:
    """Aplica una forma a cada miembro de la fusión según su capacidad real.

    Contrato:
      * La forma debe estar soportada por al menos un miembro (si no, 400).
      * Cada escena recibe solo formas físicas de escena; cada widget, las 9
        genéricas; cada alerta, las 9 genéricas + las 20 físicas de pack.
      * Un miembro que no soporta la forma se informa en `skipped*`, no se
        intenta y no convierte el lote en un error total.
      * `original`/`auto` son válidos en todos: en componentes equivalen a
        quitar la forma (se normaliza en `set_overlay_theme_service`).
    """
    fusion = get_fusion_by_id(fusion_id)
    if not fusion:
        raise ValueError(f"Fusión '{fusion_id}' no encontrada")

    shape_id = str(shape_id or "").strip() or "original"
    scenes = fusion.get("scenes", [])
    widgets = fusion.get("widgets", [])
    alerts = fusion.get("alerts", [])

    supported_members = []
    for sc_key in scenes:
        canonical = scenes_catalog.normalize_scene_key(sc_key)
        if canonical and components_catalog.supports_shape("scene", canonical, shape_id):
            supported_members.append(("scene", canonical))
    for wid in widgets:
        if components_catalog.supports_shape("widget", wid, shape_id):
            supported_members.append(("widget", wid))
    for aid in alerts:
        if components_catalog.supports_shape("alert", aid, shape_id):
            supported_members.append(("alert", aid))
    if not supported_members and (scenes or widgets or alerts):
        raise ValueError(f"Forma no soportada por ningún miembro de la fusión: {shape_id}")

    applied_scenes, failed_scenes, skipped_scenes = [], [], []
    for sc_key in scenes:
        canonical = scenes_catalog.normalize_scene_key(sc_key)
        if not canonical:
            logger.warning(f"Fusión '{fusion_id}': clave de escena desconocida '{sc_key}' (omitida)")
            skipped_scenes.append(sc_key)
            continue
        if not components_catalog.supports_shape("scene", canonical, shape_id):
            skipped_scenes.append(canonical)
            continue
        try:
            await set_overlay_theme_service(canonical, shape_id=shape_id)
            applied_scenes.append(canonical)
        except Exception as e:
            logger.warning(f"Error asignando forma '{shape_id}' a escena '{sc_key}' en fusión: {e}")
            failed_scenes.append({"sceneKey": canonical, "error": str(e)})

    applied_widgets, skipped_widgets, failed_widgets = [], [], []
    for wid in widgets:
        if not components_catalog.supports_shape("widget", wid, shape_id):
            skipped_widgets.append(wid)
            continue
        try:
            await set_overlay_theme_service(f"widget:{wid}", shape_id=shape_id)
            applied_widgets.append(wid)
        except Exception as e:
            logger.warning(f"Error asignando forma a widget '{wid}' en fusión: {e}")
            failed_widgets.append({"widgetId": wid, "error": str(e)})

    applied_alerts, skipped_alerts, failed_alerts = [], [], []
    for aid in alerts:
        if not components_catalog.supports_shape("alert", aid, shape_id):
            skipped_alerts.append(aid)
            continue
        try:
            await set_overlay_theme_service(f"alert:{aid}", shape_id=shape_id)
            applied_alerts.append(aid)
        except Exception as e:
            logger.warning(f"Error asignando forma a alerta '{aid}' en fusión: {e}")
            failed_alerts.append({"alertId": aid, "error": str(e)})

    members = scenes or widgets or alerts
    any_applied = applied_scenes or applied_widgets or applied_alerts
    any_failed = failed_scenes or failed_widgets or failed_alerts
    any_skipped = skipped_scenes or skipped_widgets or skipped_alerts
    if any_applied or not members:
        fusion["defaultShape"] = shape_id
        create_or_update_fusion(fusion)

    if any_failed and not any_applied:
        status = "error"
    elif any_failed or any_skipped:
        status = "partial"
    else:
        status = "ok"
    logger.info(
        f"✨ Forma '{shape_id}' aplicada en lote: {len(applied_scenes)} escena(s), "
        f"{len(applied_widgets)} widget(s), {len(applied_alerts)} alerta(s); "
        f"omitidos {len(skipped_scenes) + len(skipped_widgets) + len(skipped_alerts)} "
        f"(estado: {status})"
    )
    return _batch_result(
        status,
        fusionId=fusion_id,
        shapeId=shape_id,
        appliedScenes=applied_scenes,
        failedScenes=failed_scenes,
        skippedScenes=skipped_scenes,
        appliedWidgets=applied_widgets,
        failedWidgets=failed_widgets,
        skippedWidgets=skipped_widgets,
        appliedAlerts=applied_alerts,
        failedAlerts=failed_alerts,
        skippedAlerts=skipped_alerts,
    )

async def reset_fusion_batch(fusion_id: str) -> dict:
    """Restaura tema y forma de fábrica en TODOS los miembros de la fusión."""
    fusion = get_fusion_by_id(fusion_id)
    if not fusion:
        raise ValueError(f"Fusión '{fusion_id}' no encontrada")

    reset_scenes, reset_widgets, reset_alerts, failed = [], [], [], []
    for sc_key in fusion.get("scenes", []):
        canonical = scenes_catalog.normalize_scene_key(sc_key)
        if not canonical:
            continue
        try:
            await reset_overlay_assignment_service(canonical)
            reset_scenes.append(canonical)
        except Exception as e:
            failed.append({"key": canonical, "error": str(e)})
    for wid in fusion.get("widgets", []):
        try:
            await reset_overlay_assignment_service(f"widget:{wid}")
            reset_widgets.append(wid)
        except Exception as e:
            failed.append({"key": f"widget:{wid}", "error": str(e)})
    for aid in fusion.get("alerts", []):
        try:
            await reset_overlay_assignment_service(f"alert:{aid}")
            reset_alerts.append(aid)
        except Exception as e:
            failed.append({"key": f"alert:{aid}", "error": str(e)})

    fusion["defaultTheme"] = "maker"
    fusion["defaultShape"] = "original"
    create_or_update_fusion(fusion)

    status = "error" if (failed and not (reset_scenes or reset_widgets or reset_alerts)) else ("partial" if failed else "ok")
    logger.info(
        f"↺ Fusión '{fusion_id}' restaurada: {len(reset_scenes)} escenas, "
        f"{len(reset_widgets)} widgets, {len(reset_alerts)} alertas"
    )
    return _batch_result(
        status, fusionId=fusion_id,
        resetScenes=reset_scenes, resetWidgets=reset_widgets, resetAlerts=reset_alerts,
        failed=failed,
    )
