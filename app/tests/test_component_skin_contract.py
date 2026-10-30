"""Contrato de la capa de skin de componentes (tokens -> apariencia).

Fija el objetivo arquitectónico del sistema: **un componente se programa con su
aspecto base** y adopta el skin que se le asigne sin escribir CSS propio;
**un tema nuevo solo declara tokens** y llega a widgets y alertas a la vez
(el catálogo y el mapa de arquetipos salen de disco, así que también aparece
solo en los menús del panel).

Regresión de esta ronda: los widgets y alertas recibían solo los colores del
pack (`--color-*`) porque nadie les ponía `data-theme-archetype`, la familia
`--skin-*` que sí usaban las escenas; y las alertas además perdían
`?theme=`/`?shape=` de la URL al arrancar.
"""
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR
from server.services.overlay_service import build_config_payload
from server.services.theme_manager import get_theme_archetype_map

APP = Path(BASE_DIR)
WIDGETS = ["chat", "goal", "promo", "shoutout", "ticker", "timer"]
COMPONENTS = [(f"widgets/{w}/index.html", w) for w in WIDGETS] + [("alerts/index.html", "alerts")]
HOOKS = ("data-oss-shape-target", "data-oss-panel")
ARCHETYPES = ("cozy", "gamer", "maker", "openstream")
# Propiedades donde el `!important` es intencionado (marco y decoración): la
# apariencia asignada manda sobre el aspecto base, que varios widgets aplican
# con CSS inyectado o estilos en línea.
IMPORTANT_ALLOWED = ("border-width", "border-style", "border-color", "box-shadow",
                     "background-color", "background-image", "background-position",
                     "background-size", "background-repeat")
# El radio y el recorte NO pueden llevarlo: la forma física debe seguir ganando.
IMPORTANT_FORBIDDEN = ("border-radius", "clip-path")


def rules(css_text: str):
    """Reglas (selector, cuerpo) del CSS, sin comentarios."""
    clean = re.sub(r"/\*.*?\*/", "", css_text, flags=re.S)
    return re.findall(r"([^{}]+)\{([^{}]*)\}", clean)


def archetype_block(styles_css: str, archetype: str) -> str:
    """Cuerpo del bloque `[data-theme-archetype="<arch>"]` de styles.css."""
    clean = re.sub(r"/\*.*?\*/", "", styles_css, flags=re.S)
    for selector, body in rules(clean):
        if f'[data-theme-archetype="{archetype}"]' in selector:
            return body
    return ""

class TestComponentSkinContract(unittest.TestCase):
    def setUp(self):
        self.css = (APP / "common" / "oss-skin.css").read_text(encoding="utf-8")
        self.skin_js = (APP / "common" / "oss-skin.js").read_text(encoding="utf-8")
        self.styles = (APP / "common" / "styles.css").read_text(encoding="utf-8")

    def test_1_todos_los_componentes_cargan_la_capa(self):
        for rel, name in COMPONENTS:
            html = (APP / rel).read_text(encoding="utf-8")
            self.assertIn("common/oss-skin.css", html, f"{name}: no carga la capa de skin")
            self.assertIn("common/oss-skin.js", html, f"{name}: no carga el resolutor de skin")

    def test_2_todos_los_componentes_exponen_hook_universal(self):
        for rel, name in COMPONENTS:
            html = (APP / rel).read_text(encoding="utf-8")
            self.assertTrue(any(h in html for h in HOOKS),
                            f"{name}: su raíz no declara hook universal {HOOKS}")

    def test_3_la_capa_solo_actua_con_skin_asignado(self):
        for selector, _ in rules(self.css):
            self.assertIn("body[data-theme-archetype]", selector,
                          f"regla sin skin asignado (aplicaría siempre): {selector.strip()[:60]}")

    def test_4_la_capa_consume_el_contrato_de_tokens(self):
        # `--skin-panel-pattern` ya no forma parte del contrato: la textura se
        # separo en `--skin-scene-pattern` (escena) y la capa de componentes no
        # debe pintarla (ver `test_scene_texture_is_not_applied_to_components`).
        for token in ("--skin-panel-radius", "--skin-panel-clip", "--skin-panel-decor",
                      "--skin-panel-decor-position", "--skin-panel-decor-size", "--skin-panel-decor-repeat",
                      "--frame-border-width", "--frame-border-style",
                      "--color-border-cyan", "--panel-shadow", "--theme-glow",
                      "--skin-font-display", "--skin-badge-radius"):
            self.assertIn(token, self.css, f"la capa no consume {token}")

    def test_5_las_formas_fisicas_siguen_mandando(self):
        panel_rules = [s for s, b in rules(self.css) if "var(--skin-panel-radius" in b]
        self.assertTrue(panel_rules, "la capa debe declarar radio de arquetipo")
        for selector in panel_rules:
            self.assertIn(":not([data-theme-shape])", selector,
                          "el radio del arquetipo debe ceder ante una forma física")

    def test_6_important_solo_en_marco_y_decoracion(self):
        for selector, body in rules(self.css):
            for prop in re.findall(r"([a-z-]+)\s*:[^;]*!important", body):
                self.assertNotIn(prop, IMPORTANT_FORBIDDEN,
                                 f"{prop} con !important bloquearía la forma física")
                self.assertIn(prop, IMPORTANT_ALLOWED,
                              f"{prop} con !important no está justificado en la capa")

    def test_7_el_arquetipo_declara_decoracion_de_componente(self):
        """Los tokens de decoración viven en el manifiesto, no en `styles.css`.

        Antes estaban en los dos sitios y el bloque de `styles.css` pisaba al
        generado: editar `archetypes.json` no cambiaba nada.
        """
        from server.services import theme_engine

        archetypes = theme_engine.load_archetypes()
        generated = (APP / "common" / "generated" / "archetypes.css").read_text(encoding="utf-8")
        for arch in ARCHETYPES:
            self.assertIn(arch, archetypes, f"archetypes.json: falta el arquetipo {arch}")
            # La decoración vive en `skin` (lo que aporta el arquetipo como
            # skin), no en `tokens` (la geometría base). El generador emite las
            # dos familias en el mismo bloque.
            tokens = {**archetypes[arch].tokens, **archetypes[arch].skin}
            for token in ("--skin-panel-decor", "--skin-panel-decor-position",
                          "--skin-panel-decor-size", "--skin-panel-decor-repeat"):
                self.assertIn(token, tokens, f"arquetipo {arch}: falta {token} en el manifiesto")
                self.assertIn(token, generated, f"arquetipo {arch}: el generado no publica {token}")
        # Una sola fuente de verdad: `styles.css` no vuelve a declararlos.
        self.assertNotIn("--skin-panel-decor:", self.styles,
                         "los tokens --skin-* han vuelto a duplicarse en styles.css")

    def test_8_el_mapa_de_arquetipos_sale_de_disco(self):
        on_disk = {d.name for d in (APP / "streamthemes").glob("*/styles/*") if d.is_dir()}
        mapping = get_theme_archetype_map()
        self.assertEqual(on_disk, set(mapping),
                         "todo tema del disco debe resolver arquetipo (menús automáticos)")
        self.assertTrue(on_disk, "no se encontraron temas en disco")
        for theme, arch in mapping.items():
            self.assertIn(arch, ARCHETYPES, f"{theme}: arquetipo desconocido {arch}")

    def test_9_config_js_publica_el_mapa(self):
        payload = build_config_payload({})
        self.assertIn("themeArchetypes", payload, "config.js no publica el mapa de arquetipos")
        self.assertEqual(payload["themeArchetypes"], get_theme_archetype_map())

    def test_12_los_acentos_inline_siguen_al_tema_si_no_hay_override(self):
        """Un widget con tema cozy no puede seguir pintando el verde del maker.

        Varios widgets ponen su acento con `style.setProperty('--goal-accent')`,
        y el inline gana al CSS. `OSSSkin.adoptThemeColors()` lo reescribe al
        token del tema SOLO cuando el valor sigue siendo el de fábrica; si el
        usuario lo cambió, se respeta.
        """
        self.assertIn("adoptThemeColors", self.skin_js)
        self.assertIn("'--goal-accent'", self.skin_js)
        self.assertIn("'--color-accent-cyan'", self.skin_js)
        self.assertIn("THEME_COLOR_AXES", self.skin_js)
        self.assertIn("FACTORY_COLORS", self.skin_js)
        # Se invoca al aplicar un tema (si no, el render del widget llega tarde).
        start = self.skin_js.index("function apply(")
        end = self.skin_js.index("function clear(", start)
        self.assertIn("adoptThemeColors", self.skin_js[start:end],
                      "apply() no adopta los colores del tema")

    def test_13_los_widgets_pintan_el_fondo_del_tema(self):
        """Un widget con tema cozy no puede conservar el gris del maker.

        Los widgets fijaban su fondo en su propio `style.css`; con el tema
        asignado manda `--color-panel-bg`. Se acota con `data-oss-widget` para
        no tocar escenas ni alertas.
        """
        css = (APP / "common" / "oss-skin.css").read_text(encoding="utf-8")
        self.assertIn("[data-oss-widget]", css)
        self.assertIn("--color-panel-bg", css)
        self.assertIn("color-mix", css, "se pierde la opacidad configurada")
        widget_theme = (APP / "common" / "widget-theme.js").read_text(encoding="utf-8")
        self.assertIn("data-oss-widget", widget_theme,
                      "widget-theme.js no marca el widget en el body")

    def test_10_los_aplicadores_conectan_el_skin(self):
        self.assertIn("window.OSSSkin", self.skin_js)
        self.assertIn("data-theme-archetype", self.skin_js)
        widget_theme = (APP / "common" / "widget-theme.js").read_text(encoding="utf-8")
        self.assertIn("OSSSkin.apply", widget_theme, "widget-theme.js no aplica el skin")
        alert_shapes = (APP / "alerts" / "js" / "overlay" / "02b-alert-shapes.js").read_text(encoding="utf-8")
        self.assertIn("OSSSkin.apply", alert_shapes, "las alertas no aplican el skin")

    def test_11_las_alertas_respetan_theme_y_shape_de_la_url(self):
        alert_shapes = (APP / "alerts" / "js" / "overlay" / "02b-alert-shapes.js").read_text(encoding="utf-8")
        self.assertIn("applyUrlOverrides", alert_shapes)
        self.assertIn("URLSearchParams", alert_shapes)
        self.assertIn("isLocked", alert_shapes)
        ws = (APP / "alerts" / "js" / "overlay" / "04-ws-client.js").read_text(encoding="utf-8")
        self.assertIn("isLocked", ws, "el WS debe respetar el lock de la URL")


if __name__ == "__main__":
    unittest.main(verbosity=2)
