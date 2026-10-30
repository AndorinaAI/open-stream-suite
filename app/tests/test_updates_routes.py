#!/usr/bin/env python3
"""Contrato de `/api/updates/apply`: local-only y con rescate del trabajo.

Aplicar una actualizacion ejecuta `git checkout -f` + `git reset --hard` sobre
el repo del usuario. Dos garantias que no pueden perderse:

  1. Solo se puede disparar desde el propio equipo (loopback, sin proxys ni
     tuneles): una peticion que llega de fuera nunca debe poder reescribir el
     repo, aunque conozca el token.
  2. El trabajo local sin versionar se guarda antes de tocar nada (ver
     `test_updater.test_apply_update_rescata_el_trabajo_local_en_un_stash`).
"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

from server.routes import updates_routes  # noqa: E402


class _FakeRequest:
    """Lo minimo que miran `is_local_request` y el handler."""

    def __init__(self, remote="203.0.113.9", headers=None):
        self.remote = remote
        self.headers = headers or {}


class TestApplyUpdateIsLocalOnly(unittest.IsolatedAsyncioTestCase):
    async def test_rechaza_peticion_de_fuera(self):
        res = await updates_routes.handle_apply_update(_FakeRequest())
        self.assertEqual(403, res.status)

    async def test_rechaza_peticion_a_traves_de_un_proxy(self):
        # Viene de loopback pero con cabeceras de proxy/tunel: no es local.
        request = _FakeRequest(remote="127.0.0.1", headers={"X-Forwarded-For": "1.2.3.4"})
        res = await updates_routes.handle_apply_update(request)
        self.assertEqual(403, res.status)

    async def test_no_llega_a_tocar_git_si_no_es_local(self):
        called = []

        def spy(*args, **kwargs):
            called.append(args)
            return {"status": "ok"}

        original = updates_routes.updater.apply_update
        updates_routes.updater.apply_update = spy
        try:
            await updates_routes.handle_apply_update(_FakeRequest())
        finally:
            updates_routes.updater.apply_update = original
        self.assertEqual([], called, "se aplico una actualizacion desde fuera")


if __name__ == "__main__":
    unittest.main()
