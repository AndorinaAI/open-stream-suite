"""Esquema comun de personalizacion de widgets (paso 12b del plan).

Cada widget guardaba su estilo con sus propias claves y su propia UI. Aqui se
define **un solo juego de ejes** (color, borde, fondo, tipografia, forma...) con
su tipo, rango y valor por defecto; la UI los renderiza igual para cualquier
widget y la precedencia es unica:

    con tema asignado -> el TEMA pone la base y cada eje con override del
                         usuario gana
    sin tema          -> manda la configuracion del usuario

Un eje es "override del usuario" cuando su valor difiere del default de
fabrica: no hace falta una bandera por eje ni migrar los configs existentes.

Sin dependencias nuevas: `dataclasses` + stdlib.
"""
from __future__ import annotations

from dataclasses import dataclass, field

BG_TYPES = ("solid", "gradient", "glass")
BORDER_STYLES = ("solid", "dashed", "dotted", "double", "none", "left_neon", "top_accent", "bottom_accent")
FONT_FAMILIES = ("inter", "outfit", "comfortaa", "mono", "jetbrains", "sharetech", "rajdhani")
SHAPES = ("rounded", "bubble", "scifi", "pill", "arcade", "tag", "slant", "soft_card", "box", "auto")


@dataclass(frozen=True)
class Axis:
    """Un eje de personalizacion: clave, tipo, rango/valores y default."""

    key: str
    kind: str                       # color|number|enum|text|gradient
    default: object
    label: str = ""
    values: tuple = ()
    minimum: float | None = None
    maximum: float | None = None

    def normalize(self, value):
        """Valor valido del eje, o el default si no lo es."""
        if self.kind == "color":
            text = str(value or "").strip()
            if text.startswith("#") and len(text) in (4, 7, 9):
                return text.upper()
            if text.startswith("rgba(") or text.startswith("rgb("):
                return text
            return self.default
        if self.kind == "number":
            try:
                number = float(value)
            except (TypeError, ValueError):
                return self.default
            if self.minimum is not None:
                number = max(number, self.minimum)
            if self.maximum is not None:
                number = min(number, self.maximum)
            return int(number) if float(number).is_integer() else number
        if self.kind == "enum":
            text = str(value or "").strip()
            return text if text in self.values else self.default
        return str(value if value is not None else self.default)


COMMON_AXES = (
    Axis("bgType", "enum", "solid", "Fondo", BG_TYPES),
    Axis("bgColor", "color", "#1E1B18", "Color de fondo"),
    Axis("bgGradient", "gradient", "#0B0D0F", "Degradado"),
    Axis("bgOpacity", "number", 88, "Opacidad", None, 0, 100),
    Axis("borderColor", "color", "#57D6C4", "Color del borde"),
    Axis("borderStyle", "enum", "solid", "Estilo del borde", BORDER_STYLES),
    Axis("borderWidth", "number", 2, "Grosor del borde", None, 0, 12),
    Axis("glowIntensity", "number", 50, "Brillo", None, 0, 100),
    Axis("fontFamily", "enum", "inter", "Tipografia", FONT_FAMILIES),
    Axis("fontSize", "number", 14, "Tamano de letra", None, 8, 48),
    Axis("shape", "enum", "rounded", "Forma", SHAPES),
    Axis("accentColor", "color", "#57D6C4", "Color de acento"),
    Axis("customCSS", "text", "", "CSS propio"),
)

# Ejes propios de cada widget (se suman a los comunes).
WIDGET_AXES = {
    "goal": (
        Axis("barColorStart", "color", "#57D6C4", "Barra (inicio)"),
        Axis("barColorEnd", "color", "#FF783F", "Barra (fin)"),
        Axis("barTrackColor", "color", "#2E363B", "Carril de la barra"),
        Axis("barHeight", "number", 10, "Altura de la barra", None, 2, 40),
        Axis("barPattern", "enum", "solid", "Patron de la barra", ("solid", "stripes", "gradient")),
    ),
    "chat": (
        Axis("fadeSeconds", "number", 0, "Desvanecido", None, 0, 60),
        Axis("maxMessages", "number", 30, "Mensajes maximos", None, 1, 200),
        Axis("autoParticles", "enum", "off", "Particulas", ("on", "off")),
    ),
    "ticker": (
        Axis("speed", "number", 60, "Velocidad", None, 5, 200),
        Axis("rotationInterval", "number", 8, "Intervalo", None, 1, 120),
        Axis("topicSeparator", "text", "///", "Separador"),
    ),
    "timer": (
        Axis("timerColor", "color", "#57D6C4", "Color del tiempo"),
        Axis("timerFontSize", "number", 48, "Tamano del tiempo", None, 12, 200),
    ),
    "promo": (
        Axis("promoAccent", "color", "#57D6C4", "Acento del promo"),
    ),
    "shoutout": (
        Axis("qrColor", "color", "#57D6C4", "Color del QR"),
    ),
}

# Tokens del tema que alimentan cada eje cuando hay tema asignado.
THEME_TOKEN_FOR_AXIS = {
    "bgColor": "--color-panel-bg",
    "borderColor": "--color-border-cyan",
    "accentColor": "--color-accent-cyan",
    "fontFamily": "--skin-font-body",
}

DEFAULT_WIDGETS = tuple(WIDGET_AXES) + ("alerts",)


@dataclass(frozen=True)
class WidgetCustomization:
    """Esquema resuelto de un widget concreto."""

    widget: str
    axes: tuple = field(default_factory=tuple)

    def axis(self, key: str):
        for item in self.axes:
            if item.key == key:
                return item
        return None

    def defaults(self) -> dict:
        return {axis.key: axis.default for axis in self.axes}

    def normalize(self, raw: dict) -> dict:
        """Config valida y completa (ignora claves desconocidas)."""
        raw = raw if isinstance(raw, dict) else {}
        return {axis.key: axis.normalize(raw.get(axis.key, axis.default)) for axis in self.axes}

    def overrides(self, raw: dict) -> dict:
        """Solo los ejes que el usuario ha cambiado respecto al default."""
        normalized = self.normalize(raw)
        out = {}
        for axis in self.axes:
            if normalized[axis.key] != axis.normalize(axis.default):
                out[axis.key] = normalized[axis.key]
        return out

    def effective(self, raw: dict, theme_tokens: dict | None = None) -> dict:
        """Config efectiva: base del tema + overrides del usuario.

        Sin tema (`theme_tokens` vacio) devuelve la config del usuario.
        """
        base = self.defaults()
        if theme_tokens:
            for axis_key, token in THEME_TOKEN_FOR_AXIS.items():
                value = theme_tokens.get(token)
                if value:
                    base[axis_key] = value
        base.update(self.overrides(raw))
        return base

    def schema(self) -> dict:
        """Descripcion serializable para que el panel pinte los controles."""
        return {
            "widget": self.widget,
            "axes": [
                {
                    "key": axis.key,
                    "kind": axis.kind,
                    "label": axis.label or axis.key,
                    "default": axis.default,
                    "values": list(axis.values or ()),
                    "min": axis.minimum,
                    "max": axis.maximum,
                }
                for axis in self.axes
            ],
        }


def customization_for(widget_key: str) -> WidgetCustomization:
    """Esquema de un widget (comunes + propios)."""
    key = str(widget_key or "").strip()
    axes = list(COMMON_AXES)
    axes.extend(WIDGET_AXES.get(key, ()))
    return WidgetCustomization(widget=key, axes=tuple(axes))


def schema_for(widget_key: str) -> dict:
    return customization_for(widget_key).schema()


def normalize_styles(widget_key: str, raw: dict) -> dict:
    return customization_for(widget_key).normalize(raw)


def effective_styles(widget_key: str, raw: dict, theme_tokens: dict | None = None) -> dict:
    return customization_for(widget_key).effective(raw, theme_tokens)


def all_schemas() -> dict:
    return {widget: schema_for(widget) for widget in DEFAULT_WIDGETS}


def active_theme_tokens(theme_id: str) -> dict:
    """Tokens CSS del tema activo, para usarlos como base de la precedencia."""
    theme_id = str(theme_id or "").strip()
    if not theme_id:
        return {}
    from server.services.theme_render import STREAMTHEMES_DIR, tokens_from_css

    for css_path in STREAMTHEMES_DIR.glob(f"*/styles/{theme_id}/style.css"):
        try:
            tokens, _rest = tokens_from_css(css_path.read_text(encoding="utf-8"), theme_id)
        except OSError:
            return {}
        return tokens
    return {}
