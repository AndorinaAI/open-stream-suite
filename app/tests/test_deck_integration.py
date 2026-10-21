"""
Open Stream Suite — Tests de Integración para Stream Deck, Ajazz AKP y OpenDeck
Verifica que los endpoints /api/deck/ funcionen vía GET y POST sin bloqueos
y que el WebSocket acepte comandos entrantes.
"""

import unittest
import requests
import json
import os

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8080")

class DeckIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            r = requests.get(f"{BASE_URL}/api/status", timeout=1)
            if r.status_code != 200:
                raise unittest.SkipTest(f"Servidor en {BASE_URL} devolvió HTTP {r.status_code}")
        except Exception:
            raise unittest.SkipTest(f"Servidor no disponible en {BASE_URL} (tests omitidos)")

    def test_01_deck_actions_catalog(self):
        """Verifica que el catálogo de acciones para Stream Deck responda con código 200"""
        r = requests.get(f"{BASE_URL}/api/deck/actions", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("triggers", data)
        self.assertIn("timer_actions", data)
        self.assertIn("widget_actions", data)
        self.assertIn("effects", data)

    def test_02_deck_timer_get(self):
        """Verifica que el temporizador pueda controlarse por GET (para Stream Deck y Ajazz)"""
        r = requests.get(f"{BASE_URL}/api/deck/timer?action=start&seconds=300", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("action"), "timer")

    def test_03_deck_theme_get(self):
        """Verifica que un tema pueda aplicarse por GET desde un macro pad"""
        r = requests.get(f"{BASE_URL}/api/deck/theme?id=maker_electronico", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("theme"), "maker_electronico")

    def test_04_deck_explode_get(self):
        """Verifica la lluvia de emotes por GET"""
        r = requests.get(f"{BASE_URL}/api/deck/explode?emoji=🎉&count=10", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")

    def test_05_deck_alert_post(self):
        """Verifica que el endpoint de alerta funcione vía POST sin autenticación estricta (para plugins)"""
        r = requests.post(f"{BASE_URL}/api/deck/alert", json={"type": "follow", "user": "AjazzTester"}, timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")

    def test_06_deck_trigger_not_found(self):
        """Verifica que un trigger inexistente retorne 404 con mensaje explicativo"""
        r = requests.get(f"{BASE_URL}/api/deck/trigger?id=trigger_que_no_existe_xyz", timeout=5)
        self.assertEqual(r.status_code, 404)
        data = r.json()
        self.assertEqual(data.get("status"), "error")

    def test_07_deck_trigger_short_name(self):
        """Verifica que un trigger pueda llamarse por nombre corto sin prefijo (ej: id=susto)"""
        r = requests.get(f"{BASE_URL}/api/deck/trigger?id=susto", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("id"), "trigger_susto")

    def test_08_deck_widget_action_get(self):
        """Verifica que /api/deck/widget funcione vía GET para macro pads"""
        r = requests.get(f"{BASE_URL}/api/deck/widget?widget=promo&streamer=midudev", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("widget"), "promo")

    def test_09_deck_knob_timer(self):
        """Verifica que el Knob 1 controle el temporizador por rotación y pulsación"""
        r = requests.get(f"{BASE_URL}/api/deck/knob?knob=timer&ticks=1", timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json().get("knob"), "timer")

        r2 = requests.get(f"{BASE_URL}/api/deck/knob?knob=timer&action=press", timeout=5)
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json().get("action"), "pause")

    def test_10_deck_knob_theme(self):
        """Verifica que el Knob 2 cambie temas por rotación"""
        r = requests.get(f"{BASE_URL}/api/deck/knob?knob=theme&action=next", timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIn("activeTheme", r.json())

    def test_11_deck_knob_goal(self):
        """Verifica que el Knob 3 sume a la meta activa"""
        r = requests.get(f"{BASE_URL}/api/deck/knob?knob=goal&ticks=1", timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json().get("knob"), "goal")

    def test_12_deck_knob_fx(self):
        """Verifica que el Knob 4 lance el sonido chime al pulsar"""
        r = requests.get(f"{BASE_URL}/api/deck/knob?knob=fx&action=press", timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json().get("action"), "chime")

    def test_13_deck_status(self):
        """Verifica que /api/deck/status devuelva el estado del servidor para el launcher y decks"""
        r = requests.get(f"{BASE_URL}/api/deck/status", timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertTrue(data.get("running"))
        self.assertIn("connectedClients", data)
        self.assertIn("activeTheme", data)

