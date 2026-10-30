#!/usr/bin/env python3
"""Contrato de claridad del panel (widgets y alertas).

Fija lo que la revisión de UI arregló, para que no vuelva:

  1. Sin código muerto (el HTML que `renderStudio()` sobrescribía).
  2. Sin «HABILITADA» suelto: la tarjeta nombra el tipo y explica el efecto.
  3. Un solo sistema de feedback: `ui-feedback.js` y `copyText` sin `alert()`.
  4. Un solo vocabulario: no hay dos «Tema» con significados distintos.
  5. Acordeones cerrados: la cuadrícula de widgets no queda empujada.
  6. Precauciones: `confirmAction` singleton, `load` single-flight y
     `bindAccordionOnce`.
"""
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"

PANEL = APP / "alerts" / "panel.html"
UI_FEEDBACK = APP / "alerts" / "js" / "ui-feedback.js"
MAIN_JS = APP / "alerts" / "js" / "main.js"
COMPONENT_THEMES = APP / "alerts" / "js" / "component-themes.js"
ALERTS_DOM = APP / "alerts" / "js" / "alerts-studio" / "02a-layout-dom.js"
ALERTS_CTRL = APP / "alerts" / "js" / "alerts-studio" / "03-controls.js"


class TestPanelUiClarity(unittest.TestCase):
    def setUp(self):
        self.panel = PANEL.read_text(encoding="utf-8")
        self.ui = UI_FEEDBACK.read_text(encoding="utf-8")
        self.main_js = MAIN_JS.read_text(encoding="utf-8")
        self.ct = COMPONENT_THEMES.read_text(encoding="utf-8")
        self.dom = ALERTS_DOM.read_text(encoding="utf-8")
        self.ctrl = ALERTS_CTRL.read_text(encoding="utf-8")

    # 1. Código muerto
    def test_1_no_queda_codigo_muerto(self):
        for dead in ("sendAlertTest", "sendCustomAlertTest", "sim-user-input", "sim-msg-input"):
            self.assertNotIn(dead, self.panel, f"panel.html sigue teniendo {dead}")
        api = (APP / "alerts" / "js" / "api.js").read_text(encoding="utf-8")
        self.assertNotIn("sendAlertTest", api)
        self.assertNotIn("sendCustomAlertTest", api)

    # 2. HABILITADA
    def test_2_la_activacion_nombra_el_tipo_y_su_efecto(self):
        self.assertNotIn(">HABILITADA<", self.dom)
        self.assertIn("alert-enabled-card", self.dom)
        self.assertIn("cfg-enabled-title", self.dom)
        self.assertIn("cfg-enabled-help", self.dom)
        self.assertIn("updateEnabledCard", self.ctrl)
        self.assertIn("Alerta de", self.ctrl)

    # 3. Feedback único
    def test_3_un_solo_sistema_de_feedback(self):
        self.assertTrue(UI_FEEDBACK.is_file(), "falta ui-feedback.js")
        self.assertIn("window.UI", self.ui)
        for fn in ("showToast", "confirmAction", "markDirty", "clearDirty",
                   "clearDirtyScope", "dirtyKeys"):
            self.assertIn(fn, self.ui, f"UI.{fn} no existe")
        # copyText ya no bloquea (se ignoran los comentarios)
        copy_block = self.main_js[self.main_js.index("function copyText("):]
        copy_block = copy_block[:copy_block.index("\n}")]
        code_only = "\n".join(
            line for line in copy_block.splitlines() if not line.strip().startswith("//"))
        self.assertNotIn("alert(", code_only, "copyText sigue usando alert()")
        self.assertIn("UI.showToast", copy_block)
        # cargado antes que main.js
        self.assertLess(self.panel.index("js/ui-feedback.js"), self.panel.index("js/main.js"))

    # 4. Vocabulario
    def test_4_un_solo_vocabulario_de_temas(self):
        self.assertNotIn("Tema / Preset Visual Activo", self.panel)
        self.assertIn("ESTILO DE LA ALERTA", self.dom.upper())
        self.assertIn("TEMA DEL PACK", self.panel)

    # 5. Sin scroll
    def test_5_la_cuadricula_no_queda_empujada(self):
        self.assertIn('id="widgets-guide-accordion"', self.panel)
        self.assertIn('id="widget-themes-accordion"', self.panel)
        # acordeon cerrado por defecto (sin open)
        for acc in ("widgets-guide-accordion", "widget-themes-accordion"):
            tag = re.search(rf'<details[^>]*id="{acc}"[^>]*>', self.panel)
            self.assertIsNotNone(tag, f"{acc} no es <details>")
            self.assertNotIn("open", tag.group(0), f"{acc} deberia estar cerrado")
        # el acordeon de temas va DESPUES de la cuadricula
        self.assertLess(self.panel.index('class="widget-showcase-grid"'),
                        self.panel.index('id="widget-themes-accordion"'))

    # 6. Precauciones
    def test_6_confirmacion_singleton(self):
        self.assertIn("state.open", self.ui)
        self.assertIn("if (state.open) return Promise.resolve(false)", self.ui)
        self.assertIn("state.busy", self.ui)
        self.assertIn("okBtn.disabled = true", self.ui)

    def test_7_dirty_por_ambitos(self):
        self.assertIn("clearDirtyScope", self.ui)
        self.assertIn("scope", self.ui)
        save = (APP / "alerts" / "js" / "alerts-studio" / "06-preview-test.js").read_text(encoding="utf-8")
        self.assertIn("clearDirtyScope('alert')", save)
        self.assertIn("markDirty('alert:'", self.ctrl)

    def test_8_carga_perezosa_sin_duplicar(self):
        self.assertIn("inflight", self.ct, "falta el single-flight")
        self.assertIn("bindAccordionOnce", self.ct)
        self.assertIn("bindCount", self.ct)
        self.assertIn("expandFor", self.ct)
        # abrir el acordeon no registra listeners nuevos
        self.assertEqual(1, self.ct.count("addEventListener('toggle'"))

    def test_9_chips_de_estado_en_las_tarjetas(self):
        self.assertEqual(6, self.panel.count("data-status-chip"))
        self.assertEqual(6, self.panel.count("ComponentThemes.expandFor('widget'"))


    def test_10_accesibilidad_de_formularios(self):
        """Los `<label>` deben estar asociados a su control.

        Un label es accesible si tiene `for=` **o** si envuelve el control.
        Antes: 0 con `for` y **114 huérfanos**. Ahora: 109 con `for`, 12
        envolventes y ≤5 huérfanos (los que no tienen control asociado).
        """
        labels = re.findall(r'<label\b([^>]*)>(.*?)</label>', self.panel, re.S)
        self.assertGreaterEqual(len(labels), 120, "no se encontraron los labels")
        explicit = [a for a, _ in labels if 'for=' in a]
        implicit = [a for a, inner in labels
                    if 'for=' not in a and re.search(r'<(input|select|textarea)\b', inner)]
        self.assertGreaterEqual(len(explicit), 100,
                                f"solo {len(explicit)} labels con for=")
        self.assertLessEqual(len(labels) - len(explicit) - len(implicit), 5,
                             "quedan demasiados labels sin asociar")

    def test_11_botones_icono_tienen_nombre_accesible(self):
        """Todo botón-icono que ya tenía `title` debe exponerlo como `aria-label`.

        Los botones que solo llevan un emoji y **no** tienen `title` quedan como
        deuda documentada en `docs/PANEL_UI.md` (necesitan un nombre de negocio
        que no se puede inferir del emoji sin adivinar).
        """
        buttons = re.findall(r'<button\b([^>]*)>(.*?)</button>', self.panel, re.S)
        icons = [(a, i) for a, i in buttons
                 if re.sub(r'<[^>]+>', '', i).strip()
                 and not re.search(r'[0-9A-Za-z\u00c0-\u024f]', re.sub(r'<[^>]+>', '', i))]
        self.assertTrue(icons, "no se encontraron botones-icono")
        with_title = [a for a, _ in icons if 'title=' in a]
        self.assertTrue(with_title, "ningun boton-icono con title")
        for attrs in with_title:
            self.assertIn('aria-label', attrs,
                          f"boton-icono con title pero sin aria-label: {attrs[:90]}")
        # Al menos la mitad de todos los iconos deben estar nombrados ya.
        named = [1 for a, _ in icons if 'aria-label' in a]
        self.assertGreaterEqual(len(named) * 2, len(icons),
                                f"solo {len(named)}/{len(icons)} botones-icono nombrados")


if __name__ == "__main__":
    unittest.main()
