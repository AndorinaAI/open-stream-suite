"""Contrato del alta de atajos: modal propio y accion explicita.

Regresion de esta ronda: `addCustomShortcutToWidget` encadenaba hasta seis
`prompt()` del navegador. Eso impedia elegir una accion (no habia forma de
crear un atajo «play», «pause» o «reset») y rompia la estetica del panel.

Ahora hay un unico `UI.formDialog` declarativo con `select` de accion.
"""
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR

APP = Path(BASE_DIR)
UI = APP / "alerts/js/ui-feedback.js"
SHORTCUTS = APP / "alerts/js/widgets-shortcuts.js"
SHOUTOUT = APP / "widgets/shoutout/widget.js"


def _read(p):
    return p.read_text(encoding="utf-8")


class ShortcutDialogContract(unittest.TestCase):
    def test_form_dialog_exists_and_is_exported(self):
        js = _read(UI)
        self.assertIn("function formDialog(opts)", js)
        self.assertIn("formDialog: formDialog", js)
        # Un solo dialogo abierto a la vez, igual que confirmAction.
        self.assertIn("if (state.open) return Promise.resolve(null)", js)

    def test_form_dialog_supports_select_and_number(self):
        js = _read(UI)
        self.assertIn("f.type === 'select'", js)
        self.assertIn("f.type === 'number'", js)

    def test_shortcut_creation_uses_no_native_prompt(self):
        js = _read(SHORTCUTS)
        body = re.search(
            r"async function addCustomShortcutToWidget\(.*?\n\}", js, re.S
        )
        self.assertIsNotNone(body, "addCustomShortcutToWidget() no encontrada")
        # Busca la LLAMADA (prompt con argumento), no la palabra en un comentario.
        self.assertIsNone(re.search(r"\bprompt\s*\(\s*['\"`]", body.group(0)),
                          "el alta de atajos no debe usar prompt() nativo")
        self.assertIn("UI.formDialog(", body.group(0))

    def test_timer_shortcut_has_playback_actions(self):
        js = _read(SHORTCUTS)
        for action in ("pause", "resume", "reset"):
            self.assertIn(f"value: '{action}'", js,
                          f"falta la accion '{action}' en el selector de atajos")

    def test_every_widget_has_an_action_selector(self):
        js = _read(SHORTCUTS)
        # timer, promo/shoutout, goal y ticker declaran un select 'action'.
        self.assertGreaterEqual(
            js.count("{ name: 'action'"), 4,
            "cada widget debe ofrecer un selector de accion en el alta de atajos",
        )


class SharedWidgetIdContract(unittest.TestCase):
    def test_promo_and_shoutout_resolve_id_from_url(self):
        """`widgets/promo` es un symlink: el id debe salir de la ruta."""
        js = _read(SHOUTOUT)
        self.assertIn("window.location.pathname", js)
        self.assertIn("'promo'", js)
        self.assertNotIn(
            "window.OSSTheme.init('shoutout');", js,
            "el id no puede estar fijo: Promo es la misma carpeta que Shoutout",
        )


if __name__ == "__main__":
    unittest.main()
