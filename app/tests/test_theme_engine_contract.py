#!/usr/bin/env python3
"""Contrato del motor de apariencia declarativo (`theme_engine`).

Comprueba las garantias que el plan exige al motor:

  1. El manifiesto es valido (arquetipos completos, sin ids duplicados).
  2. La generacion es DETERMINISTA: dos ejecuciones dan el mismo hash.
  3. Lo generado esta AL DIA respecto al manifiesto (`is_stale()` es False).
  4. El CSS generado no contiene colores literales en la capa de componentes
     (todo se apoya en `var(--color-*)` / `var(--skin-*)`).
  5. Los tokens del arquetipo que antes estaban muertos existen y se usan.
  6. Ninguna forma física queda hardcodeada en `common/styles.css`: todas
     viven en el manifiesto o en el `shapes.css` de su pack.
"""
import hashlib
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

from server.services import theme_engine  # noqa: E402


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class TestThemeEngineContract(unittest.TestCase):
    """Contrato del motor de apariencia."""

    def setUp(self):
        self.archetypes = theme_engine.load_archetypes()
        self.packs = theme_engine.load_packs()

    # --- 1. Manifiesto ---------------------------------------------------

    def test_manifest_is_valid(self):
        problems = theme_engine.validate_manifest()
        self.assertEqual([], problems, f"Manifiesto con problemas: {problems}")

    def test_every_archetype_declares_required_tokens(self):
        self.assertTrue(self.archetypes, "No hay arquetipos declarados")
        for arch_id, arch in self.archetypes.items():
            self.assertEqual(
                (), arch.missing_tokens,
                f"El arquetipo '{arch_id}' no declara: {arch.missing_tokens}")

    def test_shape_ids_are_unique(self):
        seen = set()
        for pack in self.packs:
            for shape in pack.shapes:
                self.assertNotIn(shape.id, seen, f"Forma duplicada: {shape.id}")
                seen.add(shape.id)

    def test_every_shape_declares_geometry(self):
        for pack in self.packs:
            for shape in pack.shapes:
                self.assertTrue(shape.geometry, f"La forma '{shape.id}' no declara geometry")

    # --- 2. Determinismo -------------------------------------------------

    def test_generation_is_deterministic(self):
        first = theme_engine.build_all()
        second = theme_engine.build_all()
        self.assertEqual(
            {k: _sha(v) for k, v in first.items()},
            {k: _sha(v) for k, v in second.items()},
            "El motor no es determinista: dos ejecuciones producen distinto CSS.")

    def test_generated_files_match_disk(self):
        expected = {
            theme_engine.ARCHETYPES_CSS: theme_engine.build_archetypes_css(),
            theme_engine.SHAPES_CSS: theme_engine.build_shapes_css(),
        }
        for path, content in expected.items():
            self.assertTrue(path.is_file(), f"Falta el generado: {path}")
            self.assertEqual(
                content, path.read_text(encoding="utf-8"),
                f"{path.name} esta desfasado respecto al manifiesto.")

    # --- 3. Al dia -------------------------------------------------------

    def test_generated_is_not_stale(self):
        theme_engine.build_all()
        self.assertFalse(theme_engine.is_stale(), "Lo generado esta desfasado.")

    def test_sync_if_stale_is_idempotent(self):
        theme_engine.build_all()
        self.assertFalse(theme_engine.sync_if_stale(), "sync_if_stale regenero sin necesidad.")


    # --- 4. Sin colores literales en la capa de componentes --------------

    def test_component_layer_has_no_literal_colors(self):
        """La capa de componentes se apoya en tokens, no en colores sueltos.

        Solo se miran las reglas generadas desde `geometry` (las que llevan
        `body[data-theme-shape=...]`): la decoracion de ESCENA de cada pack
        si puede traer color propio del pack (no del tema).
        """
        css = theme_engine.build_shapes_css()
        capa_componente = css.split("/* --- Capa 2:")[0]
        offenders = re.findall(r"#[0-9A-Fa-f]{3,8}\b|rgba?\(", capa_componente)
        self.assertEqual(
            [], offenders,
            f"Hay {len(offenders)} colores literales en la capa de componentes: {offenders[:5]}")

    def test_component_rules_use_shape_tokens(self):
        css = theme_engine.build_shapes_css()
        # Cada forma con geometria debe publicar sus reglas de componente.
        for pack in self.packs:
            for shape in pack.shapes:
                if not (shape.panel_radius or shape.panel_clip_path):
                    continue
                self.assertIn(
                    f'body[data-theme-shape="{shape.id}"]', css,
                    f"La forma '{shape.id}' no tiene regla de componente generada.")

    # --- 5. Tokens antes muertos ----------------------------------------

    def test_pill_and_bar_radius_tokens_exist(self):
        """`--skin-pill-radius` y `--skin-bar-radius` existen y se usan."""
        for arch_id, arch in self.archetypes.items():
            self.assertIn("--skin-pill-radius", arch.tokens,
                          f"El arquetipo '{arch_id}' no declara --skin-pill-radius")
            self.assertIn("--skin-bar-radius", arch.tokens,
                          f"El arquetipo '{arch_id}' no declara --skin-bar-radius")

    def test_pill_and_bar_vocabulary_is_disjoint(self):
        """Las píldoras y las barras son vocabularios distintos.

        Una barra con radio de píldora se convierte en una píldora achatada,
        y una píldora en una barra se estira. Ninguna clase puede estar en
        los dos.
        """
        # El vocabulario se publica en la capa de skin (oss-skin.css); se miran
        # los dos ficheros para que el test siga valiendo si vuelve a moverse.
        css = "".join(
            (APP / "common" / name).read_text(encoding="utf-8")
            for name in ("oss-skin.css", "styles.css"))
        # `re.S`: el bloque es multilinea (una clase por linea) y sin DOTALL
        # `[^{]*?` no cruza el salto y el bloque "no aparece".
        barra = re.search(r":is\(\s*\[data-oss-bar\][^{]*?\)\s*\{", css, re.S)
        pill = re.search(r":is\(\s*\[data-oss-pill\][^{]*?\)\s*\{", css, re.S)
        self.assertIsNotNone(barra, "No hay bloque de barras")
        self.assertIsNotNone(pill, "No hay bloque de píldoras")
        clases_barra = set(re.findall(r"\.([a-z0-9-]+)", barra.group(0)))
        clases_pill = set(re.findall(r"\.([a-z0-9-]+)", pill.group(0)))
        comunes = {c for c in clases_barra & clases_pill if c not in {"data-oss-bar", "data-oss-pill"}}
        self.assertEqual(set(), comunes,
                         f"Clases en los dos vocabularios: {sorted(comunes)}")

    def test_scene_texture_is_not_applied_to_components(self):
        """La textura de ESCENA no se pinta en los componentes.

        Se miran solo las DECLARACIONES (los comentarios se quitan antes),
        que es donde la textura se aplicaria de verdad.
        """
        skin = (APP / "common" / "oss-skin.css").read_text(encoding="utf-8")
        # Se eliminan los comentarios: lo que se busca son usos reales.
        skin = re.sub(r"/\*.*?\*/", "", skin, flags=re.S)
        self.assertNotIn(
            "--skin-scene-pattern", skin,
            "La textura de escena no debe usarse en la capa de componentes.")

    # --- 6. Sin formas hardcodeadas en styles.css -----------------------

    def test_no_shape_rules_left_in_common_styles(self):
        """`common/styles.css` no contiene reglas de forma física.

        Las formas viven en el manifiesto (`pack.json`) y en el `shapes.css`
        de cada pack. Si aparece aquí, es que alguien las ha hardcodeado.

        Se miran las DECLARACIONES (sin comentarios): una mención en un
        comentario que explica de dónde viene la regla no es una regla.
        """
        css = (APP / "common" / "styles.css").read_text(encoding="utf-8")
        css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        forma_ids = [shape.id for pack in self.packs for shape in pack.shapes]
        offenders = sorted({f for f in forma_ids if f"data-theme-shape=\"{f}\"" in css})
        self.assertEqual(
            [], offenders,
            f"Formas hardcodeadas en common/styles.css: {offenders}")

    def test_shape_catalog_matches_manifest(self):
        catalog = theme_engine.build_shape_catalog()
        esperado = sorted(shape.id for pack in self.packs for shape in pack.shapes)
        self.assertEqual(esperado, [s["id"] for s in catalog["shapes"]])
        self.assertTrue(catalog["archetypes"], "El catálogo no declara arquetipos")

    def test_shape_catalog_on_disk_is_current(self):
        theme_engine.build_all()
        data = json.loads(theme_engine.SHAPE_CATALOG.read_text(encoding="utf-8"))
        esperado = sorted(shape.id for pack in self.packs for shape in pack.shapes)
        self.assertEqual(esperado, [s["id"] for s in data["shapes"]])


    # --- 7. Los generados llegan a las escenas --------------------------

    def test_generated_css_is_linked_by_every_overlay(self):
        """Toda escena, widget y alerta carga los dos CSS generados.

        Las reglas fisicas de pack ya no viven en `styles.css`: si un HTML no
        enlaza `common/generated/shapes.css`, la forma elegida en el panel no
        se pinta. `archetypes.css` aporta los tokens `--skin-*` del arquetipo,
        que es de donde cuelga la geometria de componentes.
        """
        targets = []
        targets += sorted((APP / "widgets").glob("*/index.html"))
        targets += sorted((APP / "alerts").glob("*.html"))
        targets += sorted((APP / "streamthemes").glob("*/overlays/**/index.html"))
        self.assertTrue(targets, "No se han encontrado overlays")
        for path in targets:
            html = path.read_text(encoding="utf-8")
            rel = path.relative_to(APP)
            self.assertIn("common/generated/archetypes.css", html,
                          f"{rel}: no carga los tokens de arquetipo generados")
            self.assertIn("common/generated/shapes.css", html,
                          f"{rel}: no carga las formas fisicas generadas")


if __name__ == "__main__":
    unittest.main()
