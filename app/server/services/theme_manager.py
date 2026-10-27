"""
server/theme_manager.py — Gestor de sistema de archivos y sincronización CSS para temas
"""

import json
import re
from pathlib import Path
from server.config import BASE_DIR, logger
from server.state import system
from server.services import scenes_catalog
from server.services.fs_utils import atomic_write_json, atomic_write_text, lock_for
from server.services.theme_defaults import (
    DEFAULT_PACK_TALLER,
    DEFAULT_THEMES_DATA,
    DEFAULT_OVERLAY_THEMES
)

STREAMTHEMES_DIR = BASE_DIR / "streamthemes"
THEMES_DIR = STREAMTHEMES_DIR
COMMON_THEMES_CSS = BASE_DIR / "common" / "themes.css"
CHAT_CONFIG_FILE = BASE_DIR / "widgets" / "chat" / "config.json"
THEMES_STATE_FILE = BASE_DIR / "themes_state.json"
RESERVED_PACK_DIRS = {"overlays", "common", "config.js", "__pycache__"}

# V3-04: el bootstrap de streamthemes/ se ejecuta una sola vez por proceso.
# Antes `init_themes_directory()` (y por tanto `GET /api/themes/packs`) reescribía
# `common/themes.css` en cada petición.
_THEMES_INITIALISED = False

def _normalize_scene_state_map(raw_map):
    """Migra un mapa {claveEscena: valor} al espacio de claves canónicas.

    - Traduce alias heredados (camelCase/kebab/snake/ruta de carpeta) a la clave
      canónica de la escena.
    - Descarta claves que no son escenas (estado huérfano real detectado en
      `themes_state.json`: "starting", "maker", "print"), que además rompían la
      sincronización escena<->tema porque el overlay nunca las consulta.
    """
    if not isinstance(raw_map, dict):
        return {}, [], {}
    out, dropped, renamed = {}, [], {}
    for raw_key, value in raw_map.items():
        canonical = scenes_catalog.normalize_scene_key(raw_key)
        if not canonical:
            dropped.append(raw_key)
            continue
        if canonical != raw_key:
            renamed[raw_key] = canonical
        out[canonical] = value
    return out, dropped, renamed


def _split_component_keys(mapping):
    """Separa asignaciones de componentes (`widget:` / `alert:`) de las de escena."""
    comp, scenes = {}, {}
    for k, v in (mapping or {}).items():
        if str(k).startswith(("widget:", "alert:")):
            comp[k] = v
        else:
            scenes[k] = v
    return comp, scenes


def migrate_theme_state(state):
    """Sanea el estado de escenas/temas (idempotente). Devuelve un informe.

    Las claves de componente (`widget:<id>` / `alert:<id>`) NO son escenas y se
    preservan intactas; sólo se normalizan las claves de escena.
    """
    report = {"dropped_themes": [], "dropped_shapes": [], "renamed": {}}
    comp_ov, scene_ov = _split_component_keys(state.get("overlayThemes", {}))
    ov, dropped, renamed = _normalize_scene_state_map(scene_ov)
    ov.update(comp_ov)
    report["dropped_themes"] = dropped
    report["renamed"].update(renamed)
    state["overlayThemes"] = ov

    comp_sh, scene_sh = _split_component_keys(state.get("overlayShapes", {}))
    # "original" sólo tiene sentido en escenas; en componentes equivale a sin forma.
    comp_sh = {k: v for k, v in comp_sh.items()
               if str(v).strip().lower() not in ("original", "auto", "__clear__", "none", "null", "")}
    shapes, dropped_sh, renamed_sh = _normalize_scene_state_map(scene_sh)
    shapes.update(comp_sh)
    report["dropped_shapes"] = dropped_sh
    report["renamed"].update(renamed_sh)
    state["overlayShapes"] = shapes

    comp_bd, scene_bd = _split_component_keys(state.get("backdrops", {}))
    backdrops, dropped_bd, _ = _normalize_scene_state_map(scene_bd)
    backdrops.update(comp_bd)
    report["dropped_backdrops"] = dropped_bd
    state["backdrops"] = backdrops
    return report


def normalize_theme_assignments(state: dict) -> dict:
    """Descarta temas/formas que ya no existen y normaliza activeTheme/activeShape.

    Es la red de seguridad de M12: `migrate_theme_state` sólo normaliza claves de
    escena; si se borra un pack/tema/forma, el estado no debe publicar IDs muertos.
    """
    report = {"dropped_themes": [], "dropped_shapes": [], "restored": []}
    try:
        from server.services.validation_utils import is_valid_shape_id, is_valid_theme_id
        from server.services import components_catalog
    except Exception as e:  # nunca romper la carga por un import circular
        logger.warning(f"No se pudo validar el estado de temas: {e}")
        return report

    overlay = state.get("overlayThemes", {})
    if not isinstance(overlay, dict):
        overlay = {}
    explicit = state.get("overlayThemeExplicit")
    if not isinstance(explicit, dict):
        explicit = {}

    for key, theme_id in list(overlay.items()):
        key = str(key)
        if key.startswith(("widget:", "alert:")):
            kind, _, cid = key.partition(":")
            if not components_catalog.is_valid_component(kind, cid) or not is_valid_theme_id(theme_id=theme_id):
                overlay.pop(key, None)
                explicit.pop(key, None)
                report["dropped_themes"].append(key)
            continue
        if not is_valid_theme_id(theme_id=theme_id):
            default = DEFAULT_OVERLAY_THEMES.get(key)
            if default and is_valid_theme_id(theme_id=default):
                overlay[key] = default
                explicit.pop(key, None)
                report["restored"].append(key)
            else:
                overlay.pop(key, None)
                explicit.pop(key, None)
                report["dropped_themes"].append(key)

    shapes = state.get("overlayShapes", {})
    if not isinstance(shapes, dict):
        shapes = {}
    for key, shape_id in list(shapes.items()):
        key = str(key)
        clean = str(shape_id or "").strip()
        if key.startswith(("widget:", "alert:")):
            kind, _, cid = key.partition(":")
            if clean.lower() in ("original", "auto", "__clear__", "none", "null", ""):
                shapes.pop(key, None)
                report["dropped_shapes"].append(key)
                continue
            if not components_catalog.is_valid_component_shape(kind, cid, clean):
                shapes.pop(key, None)
                report["dropped_shapes"].append(key)
            continue
        if clean.lower() in ("auto", "__clear__", "none", "null", ""):
            shapes.pop(key, None)
            report["dropped_shapes"].append(key)
        elif clean.lower() != "original" and not is_valid_shape_id(clean):
            shapes.pop(key, None)
            report["dropped_shapes"].append(key)

    state["overlayThemes"] = overlay
    state["overlayShapes"] = shapes
    state["overlayThemeExplicit"] = explicit

    active_shape = str(state.get("activeShape") or "").strip()
    if not active_shape or active_shape.lower() in ("none", "null", "__clear__"):
        state["activeShape"] = "original"
    elif active_shape.lower() != "original" and not is_valid_shape_id(active_shape):
        state["activeShape"] = "original"
        report["dropped_shapes"].append("activeShape")

    active_theme = str(state.get("activeTheme") or "").strip()
    if not is_valid_theme_id(theme_id=active_theme):
        state["activeTheme"] = "maker"
        report["restored"].append("activeTheme")
    return report


def derive_explicit_theme_map(state: dict) -> dict:
    """Claves con tema asignado explícitamente (no simple valor de fábrica).

    Para escenas, un valor igual a `DEFAULT_OVERLAY_THEMES` se considera no explícito:
    así el tema global (`activeTheme`) puede aplicar al arrancar sin perder los
    estilos personalizados. Widgets/alertas sólo existen en el mapa si se asignaron.
    """
    overlay = state.get("overlayThemes", {}) if isinstance(state, dict) else {}
    explicit = state.get("overlayThemeExplicit") if isinstance(state, dict) else None
    if not isinstance(explicit, dict):
        explicit = {}
        for key, value in overlay.items():
            if str(key).startswith(("widget:", "alert:")):
                explicit[key] = True
            else:
                explicit[key] = value != DEFAULT_OVERLAY_THEMES.get(key)
    # Normalizar alias de escena (maker/desk, startingSoon...) a clave canónica.
    normalized = {}
    for key, value in explicit.items():
        key = str(key)
        if key not in overlay:
            continue
        if key.startswith(("widget:", "alert:")):
            normalized[key] = normalized.get(key, False) or bool(value)
            continue
        canonical = scenes_catalog.normalize_scene_key(key)
        if canonical:
            normalized[canonical] = normalized.get(canonical, False) or bool(value)
    return {k: v for k, v in normalized.items() if v}


def load_theme_state():
    state = {
        "activePack": "Maker_Theme_Pack",
        "activeTheme": "maker",
        "globalThemeActive": False,
        "activeShape": "original",
        "overlayThemes": dict(DEFAULT_OVERLAY_THEMES)
    }
    if not THEMES_STATE_FILE.exists():
        return state
    try:
        # Lectura + normalización + escritura bajo el mismo lock que save_theme_state:
        # una normalización no puede pisar una asignación concurrente.
        with lock_for(THEMES_STATE_FILE):
            with open(THEMES_STATE_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            state.update(loaded)
            current_ov = state.get("overlayThemes", {})
            for k, v in DEFAULT_OVERLAY_THEMES.items():
                if k not in current_ov:
                    current_ov[k] = v
            state["overlayThemes"] = current_ov
            before_active_shape = state.get("activeShape")
            report = migrate_theme_state(state)
            report_norm = normalize_theme_assignments(state)
            state["overlayThemeExplicit"] = derive_explicit_theme_map(state)
            changed = (
                report["dropped_themes"] or report["dropped_shapes"] or report["renamed"]
                or report_norm["dropped_themes"] or report_norm["dropped_shapes"] or report_norm["restored"]
                or state.get("activeShape") != before_active_shape
                or "overlayThemeExplicit" not in loaded
            )
            if changed:
                logger.info(
                    "🧹 Estado normalizado: escenas=%s formas=%s restauradas=%s renombradas=%s",
                    report["dropped_themes"] + report_norm["dropped_themes"],
                    report["dropped_shapes"] + report_norm["dropped_shapes"],
                    report_norm["restored"], report["renamed"],
                )
                try:
                    atomic_write_json(THEMES_STATE_FILE, state)
                except Exception as write_err:
                    logger.warning(f"No se pudo persistir estado normalizado: {write_err}")
            return state
    except Exception as e:
        logger.warning(f"Error leyendo themes_state.json: {e}")
    return state

def save_theme_state(state):
    try:
        # El lock cubre lectura + merge + escritura: dos POST concurrentes no
        # pueden perder la asignación del otro entre el load y el save.
        with lock_for(THEMES_STATE_FILE):
            existing = {}
            if THEMES_STATE_FILE.exists():
                try:
                    with open(THEMES_STATE_FILE, "r", encoding="utf-8") as f:
                        existing = json.load(f)
                except Exception:
                    existing = {}
            merged = dict(existing)
            for k, v in state.items():
                merged[k] = v
            # Persistir SIEMPRE el estado saneado.
            migrate_theme_state(merged)
            normalize_theme_assignments(merged)
            atomic_write_json(THEMES_STATE_FILE, merged)
        # Sincronización escena↔tema: config.js se lee de forma síncrona al
        # arrancar; debe reflejar el estado recién guardado.
        try:
            from server.services.overlay_service import write_config_js
            write_config_js()
        except Exception as e:
            logger.warning(f"No se pudo sincronizar config.js con themes_state.json: {e}")
    except Exception as e:
        logger.warning(f"Error guardando themes_state.json: {e}")

def get_pack_styles_dir(pack_dir: Path) -> Path:
    """Devuelve el directorio que contiene los estilos de un pack (styles/ o el propio pack_dir)"""
    if (pack_dir / "styles").is_dir():
        return pack_dir / "styles"
    if (pack_dir / "themes").is_dir():
        return pack_dir / "themes"
    return pack_dir

def get_pack_overlays_dir(pack_dir: Path) -> Path:
    """Devuelve el directorio que contiene los overlays de un pack (overlays/)"""
    return pack_dir / "overlays"

def find_pack_dir(pack_id: str) -> Path:
    """Busca la carpeta física del pack admitiendo mayúsculas/minúsculas y alias históricos"""
    if not _safe_component(pack_id):
        return _INVALID_THEME_DIR.parent / "__invalid_pack__"
    exact = STREAMTHEMES_DIR / pack_id
    try:
        if exact.exists() and exact.resolve().is_relative_to(STREAMTHEMES_DIR.resolve()):
            return exact
    except (OSError, ValueError):
        return exact
    clean_id = pack_id.lower().replace("pack_", "").replace("_suite", "").replace("_pack", "")
    for d in STREAMTHEMES_DIR.iterdir():
        if not d.is_dir():
            continue
        d_clean = d.name.lower().replace("pack_", "").replace("_suite", "").replace("_pack", "")
        if d.name.lower() == pack_id.lower() or d_clean == clean_id:
            return d
    return exact

_INVALID_THEME_DIR = STREAMTHEMES_DIR / "__invalid_theme__"


def _safe_component(value) -> bool:
    """Un único segmento de ruta, sin traversal, separadores ni rutas absolutas."""
    text = str(value or "").strip()
    if not text or text in (".", ".."):
        return False
    if "/" in text or "\\" in text:
        return False
    try:
        return not Path(text).is_absolute()
    except (OSError, ValueError):
        return False


def get_theme_dir(pack_id: str, theme_id: str) -> Path:
    """Resuelve un tema sin permitir abandonar ``streamthemes/``.

    Es la función que usan el editor, el deck y el ancla de chat. La validación
    se hace aquí, no solo en la ruta, para que cualquier llamada interna quede
    protegida. Si el pack o el tema no son un único componente seguro, devuelve
    una ruta inexistente (los handlers responden 404 sin tocar disco).
    """
    if not _safe_component(pack_id) or not _safe_component(theme_id):
        return _INVALID_THEME_DIR

    pack_dir = find_pack_dir(str(pack_id).strip())
    if not _safe_component(pack_dir.name):
        return _INVALID_THEME_DIR

    candidates = [
        pack_dir / "styles" / str(theme_id).strip(),
        pack_dir / "themes" / str(theme_id).strip(),
        pack_dir / str(theme_id).strip(),
        pack_dir / "styles" / str(theme_id).strip(),
        pack_dir / str(theme_id).strip(),
    ]
    root = STREAMTHEMES_DIR.resolve()
    for candidate in candidates:
        try:
            resolved = candidate.resolve()
            if not resolved.is_relative_to(root):
                return _INVALID_THEME_DIR
        except (OSError, ValueError):
            return _INVALID_THEME_DIR
        if candidate.exists():
            return candidate
    return candidates[-1]

def init_themes_directory(force: bool = False) -> bool:
    """Inicializa la estructura modular de streamthemes/ si no existe.

    Idempotente y **de solo escritura cuando hace falta** (V3-04): se ejecuta una
    vez por proceso y la recompilación de `common/themes.css` se decide por
    frescura, no en cada invocación. Devuelve True si ha ejecutado el bootstrap.
    """
    global _THEMES_INITIALISED
    if _THEMES_INITIALISED and not force:
        return False
    STREAMTHEMES_DIR.mkdir(parents=True, exist_ok=True)

    # Pack Maker & Taller oficial
    pack_taller_dir = find_pack_dir("Maker_Theme_Pack")
    pack_taller_dir.mkdir(parents=True, exist_ok=True)
    styles_dir = pack_taller_dir / "styles"
    overlays_dir = pack_taller_dir / "overlays"
    styles_dir.mkdir(parents=True, exist_ok=True)
    overlays_dir.mkdir(parents=True, exist_ok=True)

    if not (pack_taller_dir / "pack.json").exists():
        with open(pack_taller_dir / "pack.json", "w", encoding="utf-8") as f:
            json.dump(DEFAULT_PACK_TALLER, f, indent=2, ensure_ascii=False)

    for t in DEFAULT_THEMES_DATA:
        t_id = t["id"]
        t_dir = styles_dir / t_id
        t_dir.mkdir(parents=True, exist_ok=True)

        t_json = t_dir / "theme.json"
        t_css = t_dir / "style.css"
        def_json = t_dir / "theme.default.json"
        def_css = t_dir / "style.default.css"

        payload_meta = {k: v for k, v in t.items() if k != "css"}
        if not t_json.exists():
            with open(t_json, "w", encoding="utf-8") as f:
                json.dump(payload_meta, f, indent=2, ensure_ascii=False)
        if not t_css.exists():
            with open(t_css, "w", encoding="utf-8") as f:
                f.write(t["css"])
        if not def_json.exists():
            with open(def_json, "w", encoding="utf-8") as f:
                json.dump(payload_meta, f, indent=2, ensure_ascii=False)
        if not def_css.exists():
            with open(def_css, "w", encoding="utf-8") as f:
                f.write(t["css"])

    # Recompilar common/themes.css solo si está desfasado (V3-04).
    _sync_themes_css_if_stale()
    _THEMES_INITIALISED = True
    return True

def _color_to_rgb(value):
    """Acepta #RRGGBB o rgb()/rgba() y devuelve (r, g, b)."""
    text = str(value or "").strip()
    m = re.fullmatch(r"#([0-9a-fA-F]{6})", text)
    if m:
        h = m.group(1)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    m = re.fullmatch(r"rgba?\(([^)]+)\)", text)
    if m:
        parts = [p.strip() for p in m.group(1).replace("/", ",").split(",")]
        try:
            return tuple(int(float(p)) for p in parts[:3])
        except ValueError:
            return None
    return None


def _relative_luminance(rgb):
    def channel(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def _contrast_ratio(a, b):
    la, lb = _relative_luminance(a), _relative_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def _readable_text_variant(accent, background, minimum=4.5):
    """Aclara el acento lo justo para que se lea como texto sobre el panel.

    Algunos packs definen acentos oscuros (p. ej. `#7928CA`) que como *color de
    texto* quedan en ~2:1 sobre el fondo oscuro del panel. Se publica una
    variante aclarada (mezcla progresiva con blanco) que alcanza el mínimo de
    contraste conservando el tono del pack.
    """
    rgb, bg = _color_to_rgb(accent), _color_to_rgb(background)
    if not rgb or not bg or _contrast_ratio(rgb, bg) >= minimum:
        return accent
    for step in range(1, 21):
        t = step / 20
        mixed = tuple(round(c + (255 - c) * t) for c in rgb)
        if _contrast_ratio(mixed, bg) >= minimum:
            return "#%02X%02X%02X" % mixed
    return "#FFFFFF"


def _derived_theme_tokens(theme_css: str, theme_id: str) -> str:
    """Bloque con los tokens derivados de legibilidad del tema (o vacío)."""
    def token(name):
        m = re.search(rf"{name}\s*:\s*([^;]+);", theme_css)
        return m.group(1).strip() if m else ""

    background = token("--color-bg-dark") or token("--color-panel-bg") or "#0B0E14"
    lines = []
    for source, derived, on_accent in (("--color-accent-cyan", "--color-accent-cyan-text", "--color-on-accent-cyan"),
                                       ("--color-accent-orange", "--color-accent-orange-text", "--color-on-accent-orange")):
        value = token(source)
        if not value:
            continue
        lines.append(f"  {derived}: {_readable_text_variant(value, background)};")
        # Tinta óptima sobre una placa MACIZA de ese acento (badges/etiquetas).
        accent = _color_to_rgb(value)
        if accent:
            dark_ink, light_ink = _color_to_rgb("#0B0E14"), (255, 255, 255)
            ink = "#0B0E14" if _contrast_ratio(accent, dark_ink) >= _contrast_ratio(accent, light_ink) else "#FFFFFF"
            lines.append(f"  {on_accent}: {ink};")
    if not lines:
        return ""
    return (f'body[data-theme="{theme_id}"],\n[data-theme="{theme_id}"] {{\n'
            + "\n".join(lines) + "\n}")


def sync_common_themes_css():
    """Compila y sincroniza todos los style.css de todos los packs en common/themes.css"""
    try:
        css_blocks = [
            "/* ====================================================================",
            "   OPEN STREAM SUITE — CSS UNIFICADO DE TEMAS Y PACKS MODULARES",
            "   Generado automáticamente a partir de streamthemes/<pack>/styles/<theme>/style.css",
            "   ==================================================================== */\n"
        ]

        for pack_dir in sorted(STREAMTHEMES_DIR.iterdir()):
            if not pack_dir.is_dir():
                continue
            styles_dir = get_pack_styles_dir(pack_dir)
            if not styles_dir.is_dir():
                continue
            for theme_dir in sorted(styles_dir.iterdir()):
                if not theme_dir.is_dir() or theme_dir.name in RESERVED_PACK_DIRS:
                    continue
                css_file = theme_dir / "style.css"
                if css_file.exists():
                    raw_css = css_file.read_text(encoding="utf-8").strip()
                    clean_css = re.sub(r':root\s*,\s*', '', raw_css)
                    css_blocks.append(f"/* Pack: {pack_dir.name} | Tema: {theme_dir.name} */")
                    css_blocks.append(clean_css)
                    # Tokens derivados de legibilidad (acentos que se usan como TEXTO).
                    derived = _derived_theme_tokens(clean_css, theme_dir.name)
                    if derived:
                        css_blocks.append(derived)
                    css_blocks.append("")

        COMMON_THEMES_CSS.parent.mkdir(parents=True, exist_ok=True)
        atomic_write_text(COMMON_THEMES_CSS, "\n".join(css_blocks))
        logger.info("✓ common/themes.css sincronizado correctamente")
    except Exception as e:
        logger.warning(f"Error sincronizando common/themes.css: {e}")

def themes_css_is_stale() -> bool:
    """True si `common/themes.css` falta o es más antiguo que algún `style.css`.

    Permite recompilar solo cuando de verdad hace falta (así un tema añadido a
    mano se sigue detectando) sin reescribir el fichero en cada lectura (V3-04).
    """
    try:
        if not COMMON_THEMES_CSS.exists():
            return True
        css_mtime = COMMON_THEMES_CSS.stat().st_mtime
        for style in STREAMTHEMES_DIR.glob("*/styles/*/style.css"):
            if style.stat().st_mtime > css_mtime:
                return True
    except OSError:
        return True
    return False


def _sync_themes_css_if_stale() -> bool:
    """Recompila `common/themes.css` solo si está desfasado. True si sincronizó."""
    if not themes_css_is_stale():
        return False
    sync_common_themes_css()
    return True


def infer_archetype(pack_id: str, theme_id: str = "") -> str:
    combined = f"{pack_id} {theme_id}".lower()
    if any(k in combined for k in ["cozy", "lofi", "chill", "latte", "matcha", "sakura", "lavender", "nordic", "kawaii"]):
        return "cozy"
    if any(k in combined for k in ["gamer", "esport", "cyber", "toxic", "glory", "stealth", "arcade", "matrix"]):
        return "gamer"
    if any(k in combined for k in ["maker", "terminal", "print", "blueprint", "circuit", "taller", "workbench"]):
        return "maker"
    return "openstream"

def get_all_packs_and_themes():
    """Escanea el directorio streamthemes/ y devuelve los packs con sus temas, overlays y metadatos"""
    init_themes_directory()
    # V3-04: lectura sin escritura. Solo se recompila si el CSS compartido está
    # desfasado respecto a los style.css de los packs.
    _sync_themes_css_if_stale()
    packs = []
    state = load_theme_state()
    active_theme = state.get("activeTheme", "maker")
    active_pack = state.get("activePack", "Open_stream_Pack")

    for pack_dir in sorted(STREAMTHEMES_DIR.iterdir()):
        if not pack_dir.is_dir():
            continue

        pack_json_file = pack_dir / "pack.json"
        if pack_json_file.exists():
            try:
                with open(pack_json_file, "r", encoding="utf-8") as f:
                    pack_meta = json.load(f)
            except Exception:
                pack_meta = {"id": pack_dir.name, "name": pack_dir.name}
        else:
            pack_meta = {"id": pack_dir.name, "name": pack_dir.name}

        pack_archetype = pack_meta.get("archetype") or infer_archetype(pack_dir.name)
        pack_meta["archetype"] = pack_archetype

        # 1. Escanear estilos/temas del pack
        styles_dir = get_pack_styles_dir(pack_dir)
        themes = []
        if styles_dir.is_dir():
            for theme_dir in sorted(styles_dir.iterdir()):
                if not theme_dir.is_dir() or theme_dir.name in RESERVED_PACK_DIRS:
                    continue
                t_json_file = theme_dir / "theme.json"
                t_css_file = theme_dir / "style.css"

                theme_data = {
                    "id": theme_dir.name,
                    "name": theme_dir.name,
                    "packId": pack_dir.name,
                    "archetype": pack_archetype
                }
                if t_json_file.exists():
                    try:
                        with open(t_json_file, "r", encoding="utf-8") as f:
                            theme_data.update(json.load(f))
                    except Exception:
                        pass

                if not theme_data.get("archetype"):
                    theme_data["archetype"] = infer_archetype(pack_dir.name, theme_dir.name)

                theme_data["css"] = t_css_file.read_text(encoding="utf-8") if t_css_file.exists() else ""
                theme_data["isActive"] = (theme_data["id"] == active_theme)
                themes.append(theme_data)

        # 2. Escanear overlays del pack
        overlays = []
        overlays_dir = get_pack_overlays_dir(pack_dir)
        if overlays_dir.is_dir():
            for ov_entry in sorted(overlays_dir.rglob("index.html")):
                rel_path = ov_entry.relative_to(overlays_dir)
                overlays.append({
                    "path": f"/streamthemes/{pack_dir.name}/overlays/{rel_path.as_posix()}",
                    "relPath": str(rel_path),
                    "name": rel_path.parent.name if rel_path.parent != Path(".") else rel_path.stem
                })

        pack_meta["themes"] = themes
        pack_meta["themesCount"] = len(themes)
        pack_meta["overlays"] = overlays
        pack_meta["overlaysCount"] = len(overlays)
        pack_meta["shapes"] = pack_meta.get("shapes", [])
        pack_meta["isActivePack"] = (pack_meta.get("id") == active_pack)
        packs.append(pack_meta)

    return {
        "packs": packs,
        "activePack": active_pack,
        "activeTheme": active_theme,
        "activeShape": state.get("activeShape", "original"),
        "globalThemeActive": bool(state.get("globalThemeActive")),
        "overlayThemes": state.get("overlayThemes", dict(DEFAULT_OVERLAY_THEMES)),
        "defaultOverlayThemes": dict(DEFAULT_OVERLAY_THEMES),
        "overlayShapes": state.get("overlayShapes", {}),
        "overlayThemeExplicit": derive_explicit_theme_map(state),
        "backdrops": state.get("backdrops", {})
    }

# ====================================================================
# CONTROLADORES DE RUTA (API)
# ====================================================================



def sync_chat_with_theme(theme_data):
    """Sincroniza el widget de chat con las variables del tema cuando está anclado"""
    if not CHAT_CONFIG_FILE.exists():
        return
    try:
        with open(CHAT_CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        styles = cfg.setdefault("styles", {})
        styles["borderColor"] = theme_data.get("accentCyan", "#57D6C4")
        styles["bgColor"] = theme_data.get("bgDark", "#191D21")
        styles["glowIntensity"] = theme_data.get("glowIntensity", 50)

        atomic_write_json(CHAT_CONFIG_FILE, cfg)
        logger.info(f"🔗 Estilo de chat anclado sincronizado con tema: {theme_data.get('id')}")
    except Exception as e:
        logger.warning(f"Error en sync_chat_with_theme: {e}")


