#!/usr/bin/env python3
"""Tests del contrato NATIVO de temas en widgets y alertas.
Comprueban estructura + que la apariencia por defecto no cambió (backup)."""
import hashlib
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
# Línea base pre-native-theming (2026-10-23) guardada como **hashes versionados**:
# `.backups/` está en `.gitignore`, así que comparar contra esa carpeta hacía fallar
# la suite en cualquier clon limpio y en CI (FileNotFoundError).
#   * BASELINE_CSS: (longitud, sha256) del prefijo base normalizado -> el CSS
#     actual debe empezar exactamente por esos bytes (capa de tema añadida al final).
#   * BASELINE_JS: sha256 del JS base normalizado tras quitar el arranque de tema.
#   * BASELINE_ALERTS: igual que BASELINE_CSS para las hojas de alertas.
BASELINE_CSS = {
    # ticker/promo/shoutout se refrescaron tras un cambio INTENCIONADO de la capa
    # base (auditoría 1.0.2): el acento de texto usa `--color-accent-orange-text`
    # y el azul de PayPal del ticker se aclaró a #268DCA para leerse sobre el panel.
    "ticker": (11551, "de8f511532233b4ee1fddac2450d791ba93beb43cc4e5be6201c7aad3b62338e"),
    "promo": (8290, "7de1200d38197a3ecdfb9d829da3f72475568620961e23abb6df6625cd8353ba"),
    # goal: el `font-family` base pasa a `var(--font-primary, 'Outfit', …)`
    # para que la tipografia del pack llegue a sus letras.
    "goal": (15597, "f440771e3267bff3e54ad1fa9ab531ff8d0d05993227c98b08998f2968a03549"),
    "chat": (10084, "543f1fcbea1db7cff4717d2fe02201d6f14387bc4cd335a793cdb4a27f2b48e0"),
    "timer": (7052, "97bee5b1d5232d5e4dde84fee334902932ea973886f9a46b2da5aa3c83585ccc"),
    "shoutout": (8290, "7de1200d38197a3ecdfb9d829da3f72475568620961e23abb6df6625cd8353ba"),
}
BASELINE_JS = {
    "ticker": "3db1567dfe04a75acc56bfb4997dfc9912f9253966b118229a7bf414330f8049",
    "promo": "d79c0708d77f8f67befe3c131ba974226d59690cab3b4fc4d099639499e1c387",
    "goal": "464010b90af5dfd93ec41f53611ced86fb4762dcf711a23532e6a1527d836890",
    "chat": "d2d55dbc4588c1d5802bcf442deb9e34123fe5056a82c6c2c01807a37290dc62",
    "timer": "317eb2bb348ba40a5700d40aa2792a21757cc3014434c333fe38a0f9d50489eb",
    "shoutout": "d79c0708d77f8f67befe3c131ba974226d59690cab3b4fc4d099639499e1c387",
}
BASELINE_ALERTS = {
    # Recortado a proposito: se elimino el catalogo legacy de 9 temas
    # (.banner-theme-*). El resto del fichero (maquetacion del banner) no cambia.
    "alerts-themes.css": (13739, "627c060fa7e5ff83ed0f0585ffaf52b1a5ad96e0de8019c9524f7021b36a8de9"),
    "alerts-widget.css": (9893, "ccae115dd60c8e79af188d8b86eb817fdaddc023a071f95ea797620602406aec"),
}


def sha256(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def base_prefix_preserved(text, baseline):
    """True si `text` empieza exactamente por la línea base (longitud + hash)."""
    length, digest = baseline
    return sha256(text[:length]) == digest
WIDGETS = ["ticker", "promo", "goal", "chat", "timer", "shoutout"]
BOOT_RE = re.compile(r"\n  (// --- Tema.*?\n  \}\)\(\);|window\.OSSTheme\.init\([^)]*\);)\n", re.S)


class TestWidgetsContract(unittest.TestCase):
    def test_1_link_themes_css(self):
        for w in WIDGETS:
            html = (APP / "widgets" / w / "index.html").read_text(encoding="utf-8")
            self.assertIn("common/themes.css", html, f"{w}: no carga themes.css")

    def test_2_theme_boot_from_shared_module(self):
        mod = (APP / "common" / "widget-theme.js").read_text(encoding="utf-8")
        for token in ("URLSearchParams", "data-theme", "data-theme-shape",
                      "overlayThemes", "overlayShapes", "ChatStyles.applyChatConfig"):
            self.assertIn(token, mod, f"widget-theme.js: falta {token}")
        for w in WIDGETS:
            js = (APP / "widgets" / w / "widget.js").read_text(encoding="utf-8")
            self.assertIn("OSSTheme.init", js, f"{w}: no usa el módulo compartido")
            html = (APP / "widgets" / w / "index.html").read_text(encoding="utf-8")
            self.assertIn("common/widget-theme.js", html, f"{w}: no carga widget-theme.js")

    def test_3_ws_theme_change(self):
        for w in WIDGETS:
            js = (APP / "widgets" / w / "js" / "network.js").read_text(encoding="utf-8")
            self.assertIn("theme_change", js, f"{w}: WS sin theme_change")
            self.assertTrue("OSSTheme.apply" in js or "OSSTheme.handleMessage" in js, f"{w}: WS sin aplicar forma/tema compartido")

    def test_4_css_theme_layer(self):
        shape_mod = (APP / "common" / "oss-shape.js").read_text(encoding="utf-8")
        for token in ("border-radius", "clip-path", "ossShapeSaved", "apply"):
            self.assertIn(token, shape_mod, f"oss-shape.js: falta {token}")
        for w in WIDGETS:
            css = (APP / "widgets" / w / "style.css").read_text(encoding="utf-8")
            self.assertIn("body[data-theme]", css, f"{w}: sin capa body[data-theme]")
            self.assertIn("var(--color-", css, f"{w}: no consume tokens")
            html = (APP / "widgets" / w / "index.html").read_text(encoding="utf-8")
            self.assertIn("common/oss-shape.js", html, f"{w}: no carga oss-shape.js")
            if w != "chat":
                self.assertIn("data-oss-shape-target", html, f"{w}: raíz sin marcar para formas")

    def test_5_default_appearance_preserved(self):
        """El CSS por defecto no se tocó: lo actual empieza por el backup."""
        def norm_colors(t):
            t = re.sub(r"var\(--color-[a-z-]+,\s*(#[0-9A-Fa-f]{3,8})\)", r"\1", t)
            # el gateo de presets sólo actúa cuando hay tema de pack
            return t.replace("body:not([data-theme]).theme-", "body.theme-")
        for w in WIDGETS:
            cur = norm_colors((APP / "widgets" / w / "style.css").read_text(encoding="utf-8"))
            self.assertTrue(base_prefix_preserved(cur, BASELINE_CSS[w]), f"{w}: CSS base alterado")
        for w in WIDGETS:
            cur = (APP / "widgets" / w / "widget.js").read_text(encoding="utf-8")
            stripped = BOOT_RE.sub("", cur)
            stripped = re.sub(r"\n  // Modo embebido.*?\n  \}\);\n", "\n", stripped, flags=re.S)
            norm = lambda s: re.sub(r"\n{2,}", "\n", s).strip()
            self.assertEqual(sha256(norm(stripped)), BASELINE_JS[w], f"{w}: JS base alterado")

    def test_6_no_important_in_theme_layer(self):
        for w in WIDGETS:
            css = (APP / "widgets" / w / "style.css").read_text(encoding="utf-8")
            tail = css.split("Capa nativa de temas de pack")[-1]
            self.assertNotIn("!important", tail, f"{w}: capa de tema usa !important")

    def test_7_chat_presets_gated(self):
        css = (APP / "widgets" / "chat" / "style.css").read_text(encoding="utf-8")
        self.assertIn("body:not([data-theme]).theme-", css,
                      "los presets de chat deben ceder ante un tema de pack")

    def test_8_reset_assignment_endpoint(self):
        routes = (APP / "server" / "routes" / "themes_routes.py").read_text(encoding="utf-8")
        self.assertIn("/api/themes/reset-assignment", routes)

    def test_9_component_i18n_in_modules(self):
        import json
        for lang in ("es", "en"):
            data = json.loads((APP / "languages" / f"{lang}.alerts.json").read_text(encoding="utf-8"))
            for key in ("component_themes_title", "btn_apply_theme", "btn_reset_theme"):
                self.assertIn(key, data.get("widgets", {}), f"{lang}.alerts.json: falta widgets.{key}")
            for key in ("members_title", "remove_member"):
                self.assertIn(key, data.get("fusions", {}), f"{lang}.alerts.json: falta fusions.{key}")


class TestAlertsContract(unittest.TestCase):
    def test_1_overlay_links_themes(self):
        html = (APP / "alerts" / "index.html").read_text(encoding="utf-8")
        self.assertIn("common/themes.css", html)

    def test_2_ws_theme_change_and_boot(self):
        js = (APP / "alerts" / "js" / "overlay" / "04-ws-client.js").read_text(encoding="utf-8")
        self.assertIn("theme_change", js)
        self.assertIn("URLSearchParams", js)
        self.assertIn("setAttribute('data-theme'", js)

    def test_3_banner_tokens_layer(self):
        css = (APP / "alerts" / "css" / "alerts-themes.css").read_text(encoding="utf-8")
        self.assertIn("body[data-theme]", css)
        for tok in ("--banner-accent", "--banner-border", "--banner-text"):
            self.assertIn(tok, css.split("Capa nativa de temas de pack")[-1])

    def test_4b_alerts_shapes_and_banner_theme(self):
        html = (APP / "alerts" / "index.html").read_text(encoding="utf-8")
        self.assertIn("common/oss-shape.js", html)
        css = (APP / "alerts" / "css" / "alerts-themes.css").read_text(encoding="utf-8")
        self.assertIn("body[data-theme] #banner-alert-root", css)
        self.assertIn("linear-gradient", css.split("Banner gobernado por el tema de pack")[-1])
        js = (APP / "alerts" / "js" / "overlay" / "04-ws-client.js").read_text(encoding="utf-8")
        self.assertIn("OSSShape.apply", js)

    def test_4_alert_card_consumes_tokens(self):
        css = (APP / "alerts" / "css" / "alerts-widget.css").read_text(encoding="utf-8")
        self.assertIn("var(--color-accent-cyan)", css)
        self.assertIn("body[data-theme] .alert-box", css)

    def test_7_scene_chat_toggles(self):
        cfg = json.loads((APP / "overlay_texts_config.json").read_text(encoding="utf-8"))
        for sec in ("chill", "cozy", "oss"):
            self.assertIn("showChatPanel", cfg.get(sec, {}), f"{sec}: sin showChatPanel")
        panel = (APP / "alerts" / "panel.html").read_text(encoding="utf-8")
        for pid in ("txt-chill-show-chat", "txt-cozy-show-chat", "txt-oss-show-chat"):
            self.assertIn(pid, panel, f"panel: falta {pid}")
        inj = (APP / "common" / "overlay" / "dom-injector.js").read_text(encoding="utf-8")
        self.assertIn("cozy-chat-card", inj)
        self.assertIn("chat-column", inj)

    def test_8_texts_merge_preserves_sections(self):
        from server.services.overlay_service import _deep_merge_texts
        merged = _deep_merge_texts(
            {"cozy": {"cafeCamLabel": "X", "showChatPanel": True}, "pomodoro": {"a": 1}},
            {"cozy": {"showChatPanel": False}})
        self.assertEqual(merged["cozy"]["cafeCamLabel"], "X")
        self.assertFalse(merged["cozy"]["showChatPanel"])
        self.assertIn("pomodoro", merged)

    def test_9_scene_chat_embeds_widget(self):
        scenes = [
            "streamthemes/Maker_Theme_Pack/overlays/chill/index.html",
            "streamthemes/Cozy_LoFi_Pack/overlays/cafe_chat/index.html",
            "streamthemes/Open_stream_Pack/overlays/just_chatting/index.html",
        ]
        for rel in scenes:
            html = (APP / rel).read_text(encoding="utf-8")
            self.assertIn("scene-chat-embed", html, rel)
            self.assertIn("/widgets/chat/index.html?embed=1", html, rel)
            self.assertIn("scene-chat-embed.js", html, rel)
        inj = (APP / "common" / "overlay" / "dom-injector.js").read_text(encoding="utf-8")
        self.assertIn("scene-chat-embed", inj)
        self.assertNotIn("mainCam.style.width", inj, "el chat no debe redimensionar la cámara")
        widget = (APP / "widgets" / "chat" / "widget.js").read_text(encoding="utf-8")
        self.assertIn("classList.add('embedded')", widget)
        self.assertIn("oss:theme", widget)

    def test_10_alerts_accept_pack_shapes(self):
        from server.services import components_catalog as C
        shapes = C.shape_ids_for("alert", "card")
        for sid in ("gamer_mecha", "cozy_polaroid", "comic_manga_action", "pill"):
            self.assertIn(sid, shapes, f"alerta: falta forma {sid}")
        self.assertTrue(C.is_valid_component_shape("alert", "banner", "cozy_polaroid"))
        html = (APP / "alerts" / "index.html").read_text(encoding="utf-8")
        self.assertIn('id="alert-card" class="alert-box" data-oss-panel="true"', html)
        self.assertIn("02b-alert-shapes.js", html)
        helper = (APP / "alerts" / "js" / "overlay" / "02b-alert-shapes.js").read_text(encoding="utf-8")
        self.assertIn("data-theme-shape", helper)
        self.assertIn("OSSShape", helper)

    def test_5_no_dead_integrator(self):
        self.assertFalse((APP / "alerts" / "js" / "themes" / "theme-integrator.js").exists(),
                         "theme-integrator.js (script no nativo) sigue presente")

    def test_6_default_banner_css_preserved(self):
        cur = (APP / "alerts" / "css" / "alerts-themes.css").read_text(encoding="utf-8")
        self.assertTrue(
            base_prefix_preserved(cur, BASELINE_ALERTS["alerts-themes.css"]),
            "alerts-themes.css base alterado",
        )
        cur2 = (APP / "alerts" / "css" / "alerts-widget.css").read_text(encoding="utf-8")
        self.assertTrue(
            base_prefix_preserved(cur2, BASELINE_ALERTS["alerts-widget.css"]),
            "alerts-widget.css base alterado",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
