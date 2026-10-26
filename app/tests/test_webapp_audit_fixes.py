"""Regresiones de la auditoría de la webapp (CORS, WS, traversal, acciones, SSRF).

Se ejecutan contra la app real con el cliente de aiohttp; no usan red externa.
"""
import asyncio
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from aiohttp import web, FormData
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop

from server.app import create_app
from server.config import BASE_DIR, DONATIONS_CONFIG_FILE, LOCAL_AUTH_TOKEN, MEDIA_DIR, TRIGGERS_FILE
from server.security import is_loopback_host, is_origin_allowed, is_websocket_allowed
from server.services import widgets_service
from server.services.actions.chat_actions import handle_chat_action
from server.services.actions.goal_actions import handle_goal_action
from server.services.actions.timer_actions import handle_timer_action
from server.services.actions.ticker_actions import handle_ticker_action
from server.services.theme_manager import THEMES_STATE_FILE, get_theme_dir
from server.services.theme_service import create_theme_service
from server.services.url_safety import UnsafeURL, assert_public_url
from server.routes.webhooks_routes import _public_webhook_authorized, handle_get_donations_config
from server.routes.widgets_routes import MAX_RSS_BYTES, RSSFeedTooLarge, _read_rss_body
from server.services.triggers_service import auto_register_artist, load_triggers_data, save_triggers_data
from server.services.overlay_service import OVERLAY_TEXTS_FILE
from server.routes.auth_routes import _consume_oauth_state, _new_oauth_state


class AuditSecurityTestCase(AioHTTPTestCase):
    async def get_application(self):
        return create_app()

    def setUp(self):
        super().setUp()
        self.headers = {"X-Local-Token": LOCAL_AUTH_TOKEN, "Content-Type": "application/json"}

    @unittest_run_loop
    async def test_cors_rejects_lookalike_localhost_origin(self):
        # El token no debe entregarse a http://localhost.evil.com.
        r = await self.client.get("/api/local-token", headers={"Origin": "http://localhost.evil.com"})
        self.assertEqual(r.status, 403)

    @unittest_run_loop
    async def test_cors_allows_exact_localhost_origin(self):
        r = await self.client.get("/api/local-token", headers={"Origin": "http://localhost:8080"})
        self.assertEqual(r.status, 200)
        self.assertEqual(r.headers.get("Access-Control-Allow-Origin"), "http://localhost:8080")

    @unittest_run_loop
    async def test_cors_rejects_other_loopback_port(self):
        for origin in ("http://localhost:9999", "http://127.0.0.1:9999", "http://localhost"):
            r = await self.client.get("/api/local-token", headers={"Origin": origin})
            self.assertEqual(r.status, 403, origin)

    @unittest_run_loop
    async def test_websocket_rejects_other_loopback_port(self):
        for origin in ("http://localhost:9999", "http://127.0.0.1:9999", "http://localhost"):
            with self.assertRaises(Exception, msg=origin):
                await self.client.ws_connect("/ws", headers={"Origin": origin})

    @unittest_run_loop
    async def test_websocket_without_origin_or_token_is_rejected(self):
        with self.assertRaises(Exception):
            await self.client.ws_connect("/ws")

    @unittest_run_loop
    async def test_get_widget_action_mutation_is_rejected(self):
        r = await self.client.get(
            "/api/widgets/action?widget=chat&action=clear",
            headers={"Origin": "http://evil.example", "Sec-Fetch-Site": "cross-site"},
        )
        self.assertEqual(r.status, 403)

    @unittest_run_loop
    async def test_get_widget_action_read_is_allowed(self):
        r = await self.client.get("/api/widgets/action?widget=chat&action=get_recent")
        self.assertEqual(r.status, 200)
        data = await r.json()
        self.assertEqual(data.get("status"), "ok")

    @unittest_run_loop
    async def test_rss_private_ip_is_rejected(self):
        r = await self.client.get("/api/rss/feed?url=http://127.0.0.1:8099/feed.xml")
        self.assertEqual(r.status, 400)

    @unittest_run_loop
    async def test_tip_webhook_requires_token(self):
        r = await self.client.post("/api/webhooks/tip", json={"user": "audit", "amount": 1})
        self.assertEqual(r.status, 403)

    @unittest_run_loop
    async def test_twitch_channel_endpoint_exists(self):
        r = await self.client.get("/api/twitch/channel")
        # 400 si Twitch no está conectado; lo importante es que no sea 404.
        self.assertNotEqual(r.status, 404)

    @unittest_run_loop
    async def test_upload_limit_returns_413(self):
        form = FormData()
        form.add_field("file", b"small", filename="probe.png", content_type="image/png")
        with patch("server.routes.media_routes.MAX_UPLOAD_BYTES", 1):
            r = await self.client.post("/api/upload", data=form, headers={"X-Local-Token": LOCAL_AUTH_TOKEN})
        self.assertEqual(r.status, 413)

    @unittest_run_loop
    async def test_svg_upload_is_rejected(self):
        form = FormData()
        form.add_field(
            "file",
            b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            filename="audit_probe.svg",
            content_type="image/svg+xml",
        )
        r = await self.client.post("/api/upload", data=form, headers={"X-Local-Token": LOCAL_AUTH_TOKEN})
        self.assertEqual(r.status, 400)
        self.assertFalse((MEDIA_DIR / "images" / "audit_probe.svg").exists())

    @unittest_run_loop
    async def test_existing_svg_is_not_served_from_media(self):
        probe = MEDIA_DIR / "images" / "audit_probe_static.svg"
        probe.parent.mkdir(parents=True, exist_ok=True)
        probe.write_text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', encoding="utf-8")
        try:
            r = await self.client.get("/media/images/audit_probe_static.svg")
            self.assertEqual(r.status, 404)
        finally:
            probe.unlink(missing_ok=True)

    @unittest_run_loop
    async def test_docs_are_local_only(self):
        with patch("server.routes.static_routes.is_local_request", return_value=False):
            r = await self.client.get("/docs/AUDITORIA_WEBAPP_V2.md")
        self.assertEqual(r.status, 404)

    @unittest_run_loop
    async def test_docs_local_are_served(self):
        r = await self.client.get("/docs/AUDITORIA_WEBAPP_V2.md")
        self.assertEqual(r.status, 200)
        self.assertTrue(r.headers.get("Content-Type", "").startswith("text/plain"))

    @unittest_run_loop
    async def test_media_listing_is_local_only(self):
        with patch("server.routes.media_routes.is_local_request", return_value=False):
            r = await self.client.get("/api/media")
        self.assertEqual(r.status, 403)

    @unittest_run_loop
    async def test_media_static_is_local_only(self):
        probe = MEDIA_DIR / "images" / "audit_probe_tunnel.png"
        probe.parent.mkdir(parents=True, exist_ok=True)
        probe.write_bytes(b"png")
        try:
            with patch("server.app.is_local_request", return_value=False):
                r = await self.client.get("/media/images/audit_probe_tunnel.png")
            self.assertEqual(r.status, 404)
        finally:
            probe.unlink(missing_ok=True)

    @unittest_run_loop
    async def test_recent_tips_is_local_only(self):
        with patch("server.routes.webhooks_routes.is_local_request", return_value=False):
            r = await self.client.get("/api/tips/recent")
        self.assertEqual(r.status, 403)

    @unittest_run_loop
    async def test_websocket_with_local_origin_is_allowed(self):
        ws = await self.client.ws_connect("/ws", headers={"Origin": "http://localhost:8080"})
        await ws.close()

    @unittest_run_loop
    async def test_websocket_with_token_and_no_origin_is_allowed(self):
        ws = await self.client.ws_connect(f"/ws?token={LOCAL_AUTH_TOKEN}")
        await ws.close()

    @unittest_run_loop
    async def test_malformed_json_returns_json_400(self):
        for path in ("/api/widgets/config", "/api/test", "/api/theme", "/api/roles"):
            r = await self.client.post(path, data="{bad", headers=self.headers)
            self.assertEqual(r.status, 400, path)
            self.assertEqual(r.content_type, "application/json", path)

    @unittest_run_loop
    async def test_deck_without_token_rejected_on_non_loopback_host(self):
        with patch("server.app.HOST", "0.0.0.0"), patch("server.app.DECK_TOKEN", ""):
            r = await self.client.get("/api/deck/status")
        self.assertEqual(r.status, 403)

    @unittest_run_loop
    async def test_deck_without_token_rejected_behind_proxy(self):
        with patch("server.app.HOST", "127.0.0.1"), patch("server.app.DECK_TOKEN", ""):
            r = await self.client.get("/api/deck/status", headers={"X-Forwarded-For": "203.0.113.10"})
        self.assertEqual(r.status, 403)

    @unittest_run_loop
    async def test_deck_token_required_when_configured(self):
        with patch("server.app.DECK_TOKEN", "secret-deck"):
            r = await self.client.get("/api/deck/status")
            self.assertEqual(r.status, 401)
            r = await self.client.get("/api/deck/status", headers={"X-Deck-Token": "otro"})
            self.assertEqual(r.status, 401)
            r = await self.client.get("/api/deck/status", headers={"X-Deck-Token": "secret-deck"})
            self.assertEqual(r.status, 200)

    @unittest_run_loop
    async def test_malformed_json_is_400_json_on_state_endpoints(self):
        for path in (
            "/api/themes/apply-shape",
            "/api/overlays/texts/reset",
            "/api/alerts/themes",
            "/api/alerts/apply-theme",
            "/api/alerts/test",
            "/api/donations/config",
            "/api/triggers",
        ):
            r = await self.client.post(path, data="{bad", headers=self.headers)
            self.assertEqual(r.status, 400, path)
            self.assertEqual(r.content_type, "application/json", path)

    @unittest_run_loop
    async def test_invalid_json_does_not_mutate_state(self):
        watched = (THEMES_STATE_FILE, OVERLAY_TEXTS_FILE, TRIGGERS_FILE, DONATIONS_CONFIG_FILE)
        before = {str(p): p.read_bytes() for p in watched if p.exists()}
        for path in ("/api/themes/apply-shape", "/api/overlays/texts/reset", "/api/triggers", "/api/donations/config"):
            r = await self.client.post(path, data="{bad", headers=self.headers)
            self.assertEqual(r.status, 400, path)
        after = {str(p): p.read_bytes() for p in watched if p.exists()}
        self.assertEqual(before, after)

    @unittest_run_loop
    async def test_donations_save_failure_returns_generic_500(self):
        with patch("server.routes.webhooks_routes.save_donations_config", return_value=False):
            r = await self.client.post(
                "/api/donations/config",
                json={"tunnelUrl": "https://example.test"},
                headers=self.headers,
            )
        self.assertEqual(r.status, 500)
        self.assertNotIn("Traceback", await r.text())
        self.assertNotIn("No such file", await r.text())

    @unittest_run_loop
    async def test_auth_url_contains_oauth_state(self):
        r = await self.client.get("/auth", allow_redirects=False)
        self.assertIn(r.status, (301, 302, 303, 307, 308))
        self.assertIn("state=", r.headers.get("Location", ""))
        cookie = r.headers.get("Set-Cookie", "")
        self.assertIn("oss_oauth_session=", cookie)
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=Lax", cookie)


class AuditServicesTestCase(unittest.TestCase):
    def test_oauth_state_is_bound_to_session_cookie(self):
        state, session = _new_oauth_state()
        self.assertFalse(_consume_oauth_state(state, "otra-sesion"))
        state2, session2 = _new_oauth_state()
        self.assertTrue(_consume_oauth_state(state2, session2))
        self.assertFalse(_consume_oauth_state(state2, session2))

    def test_deck_startup_warns_without_token_on_public_host(self):
        with patch("server.app.HOST", "0.0.0.0"), patch("server.app.DECK_TOKEN", ""):
            with self.assertLogs("OpenStreamSuite", level="WARNING") as captured:
                create_app()
        self.assertTrue(any("DECK_TOKEN" in line for line in captured.output))

    def test_rss_body_reads_all_chunks_and_enforces_limit(self):
        class FakeContent:
            def __init__(self, chunks):
                self.chunks = chunks

            async def iter_chunked(self, _size):
                for chunk in self.chunks:
                    yield chunk

        class FakeResponse:
            def __init__(self, chunks):
                self.content = FakeContent(chunks)

        async def check():
            raw = await _read_rss_body(FakeResponse([b'<?xml version="1.0"?>', b'<rss><channel/></rss>']))
            self.assertEqual(raw, b'<?xml version="1.0"?><rss><channel/></rss>')
            with self.assertRaises(RSSFeedTooLarge):
                await _read_rss_body(FakeResponse([b'x' * (MAX_RSS_BYTES + 1)]))

        asyncio.run(check())

    def test_triggers_and_auto_roles_are_atomic_and_private(self):
        with tempfile.TemporaryDirectory() as td:
            roles = Path(td) / "roles.json"
            roles.write_text(json.dumps({"roles": [{"id": "role_artista", "members": ["existente"]}]}), encoding="utf-8")
            triggers = Path(td) / "triggers.json"
            with patch("server.services.triggers_service.ROLES_FILE", roles), \
                 patch("server.services.triggers_service.TRIGGERS_FILE", triggers):
                auto_register_artist("NuevoArtista")
                data = json.loads(roles.read_text(encoding="utf-8"))
                self.assertIn("existente", data["roles"][0]["members"])
                self.assertIn("nuevoartista", data["roles"][0]["members"])
                self.assertEqual(roles.stat().st_mode & 0o777, 0o600)
                self.assertTrue(save_triggers_data({"triggers": [{"id": "t1"}]}))
                self.assertEqual(load_triggers_data()["triggers"][0]["id"], "t1")
                self.assertEqual(triggers.stat().st_mode & 0o777, 0o600)

    def test_loopback_host_classification(self):
        self.assertTrue(is_loopback_host("127.0.0.1"))
        self.assertTrue(is_loopback_host("localhost"))
        self.assertTrue(is_loopback_host("::1"))
        self.assertFalse(is_loopback_host("0.0.0.0"))
        self.assertFalse(is_loopback_host("192.168.1.10"))

    def test_origin_validation_is_exact(self):
        self.assertTrue(is_origin_allowed("http://localhost:8080"))
        self.assertTrue(is_origin_allowed("http://127.0.0.1:8080"))
        self.assertFalse(is_origin_allowed("http://localhost:9999"))
        self.assertFalse(is_origin_allowed("http://127.0.0.1:9999"))
        self.assertFalse(is_origin_allowed("http://localhost"))
        self.assertFalse(is_origin_allowed("http://localhost.evil.com"))
        self.assertFalse(is_origin_allowed("http://127.0.0.1.evil.com"))
        self.assertFalse(is_origin_allowed("null"))

    def test_create_theme_rejects_non_hex_colors(self):
        for payload in (
            {"accentCyan": "red; background: url(javascript:alert(1))"},
            {"accentCyan": "#12345"},
            {"glowIntensity": 101},
        ):
            body = {"packId": "Maker_Theme_Pack", "name": "Audit XSS Color"}
            body.update(payload)
            with self.assertRaises(ValueError, msg=str(payload)):
                create_theme_service(body)

    def test_theme_dir_traversal_returns_invalid_path(self):
        path = get_theme_dir("Maker_Theme_Pack", "../../../../tmp/evil")
        self.assertFalse(path.exists())
        self.assertNotIn("..", str(path))

    def test_invalid_widget_key_rejected(self):
        self.assertFalse(widgets_service.is_valid_widget_key("../evil"))
        self.assertFalse(widgets_service.is_valid_widget_key("/tmp/evil"))
        self.assertTrue(widgets_service.is_valid_widget_key("chat"))

    def test_save_widgets_rejects_traversal(self):
        with tempfile.TemporaryDirectory() as td:
            before = Path(td) / "outside"
            marker = before / "config.json"
            self.assertFalse(widgets_service.save_widgets_config({"../outside": {"x": 1}}))
            self.assertFalse(marker.exists())

    def test_donations_config_does_not_expose_token(self):
        async def check():
            with patch("server.routes.webhooks_routes.load_donations_config", return_value={"streamlabsToken": "secret", "tunnelUrl": ""}), \
                 patch("server.routes.webhooks_routes.is_streamlabs_connected", return_value=True), \
                 patch("server.routes.webhooks_routes.is_local_request", return_value=True):
                r = await handle_get_donations_config(None)
                data = json.loads(r.text)
                self.assertEqual(data["config"]["streamlabsToken"], "••••••••")
                self.assertTrue(data["config"]["streamlabsTokenSet"])
        asyncio.run(check())

    def test_webhook_remote_without_secret_is_rejected(self):
        from types import SimpleNamespace
        remote_request = SimpleNamespace(remote="203.0.113.10", headers={}, query={})
        local_request = SimpleNamespace(remote="127.0.0.1", headers={}, query={})
        self.assertFalse(_public_webhook_authorized(remote_request, "kofi", ""))
        self.assertTrue(_public_webhook_authorized(local_request, "kofi", ""))

    def test_public_url_rejects_private_targets(self):
        async def check():
            with self.assertRaises(UnsafeURL):
                await assert_public_url("http://127.0.0.1:8099/x")
            with self.assertRaises(UnsafeURL):
                await assert_public_url("http://localhost/x")
            with self.assertRaises(UnsafeURL):
                await assert_public_url("file:///etc/passwd")
        asyncio.run(check())

    def test_chat_unknown_action_returns_400(self):
        async def check():
            r = await handle_chat_action("does_not_exist", {})
            self.assertEqual(r.status, 400)
        asyncio.run(check())

    def test_goal_action_does_not_raise_nameerror(self):
        async def check():
            with patch("server.services.actions.goal_actions.load_widgets_config", return_value={"goal": {"goals": []}}), \
                 patch("server.services.actions.goal_actions.save_widgets_config", return_value=True), \
                 patch("server.services.actions.goal_actions.system.broadcast", return_value=None):
                r = await handle_goal_action("increment", {"goal_id": "missing"})
                self.assertLess(r.status, 500)
        asyncio.run(check())

    def test_timer_action_does_not_raise_nameerror(self):
        async def check():
            with patch("server.services.actions.timer_actions.system.broadcast", return_value=None):
                r = await handle_timer_action("start", {"duration": 60})
                self.assertEqual(r.status, 200)
        asyncio.run(check())

    def test_chat_spotlight_imports_are_present(self):
        async def check():
            with patch("server.services.actions.chat_actions.load_widgets_config", return_value={"chat": {}}), \
                 patch("server.services.actions.chat_actions.save_widgets_config", return_value=True), \
                 patch("server.services.actions.chat_actions.system.broadcast", return_value=None):
                r = await handle_chat_action("spotlight", {"active": True, "user": "a", "message": "b"})
                self.assertEqual(r.status, 200)
        asyncio.run(check())

    def test_ticker_simulate_does_not_raise_nameerror(self):
        async def check():
            with patch("server.services.actions.ticker_actions.load_widgets_config", return_value={"ticker": {}}), \
                 patch("server.services.actions.ticker_actions.save_widgets_config", return_value=True), \
                 patch("server.services.actions.ticker_actions.system.broadcast", return_value=None):
                r = await handle_ticker_action("simulate", {"event": "follow", "user": "a"})
                self.assertEqual(r.status, 200)
        asyncio.run(check())



class SceneStaticModuleTests(unittest.TestCase):
    def test_every_scene_loads_critical_modules_before_overlay(self):
        data = json.loads((BASE_DIR / "scenes.json").read_text(encoding="utf-8"))
        scenes = data.get("scenes", [])
        self.assertEqual(len(scenes), 27)
        for scene in scenes:
            path = BASE_DIR / scene["path"].lstrip("/")
            html = path.read_text(encoding="utf-8")
            for module in ("icons.js", "dom-injector.js", "interactive-features.js"):
                self.assertIn(f'/common/overlay/{module}', html, scene["key"])
                self.assertLess(html.index(f'/common/overlay/{module}'), html.index('/common/overlay.js'), scene["key"])

    def test_bundled_cinzel_font_exists(self):
        self.assertTrue((BASE_DIR / "common" / "fonts" / "cinzel_variable.ttf").is_file())


if __name__ == "__main__":
    unittest.main()
