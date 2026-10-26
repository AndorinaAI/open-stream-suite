# 🎮 OPEN STREAM SUITE — STREAM DECK PLUGINS & PROFILES
### Hardware control for Ajazz AKP, Elgato Stream Deck, and OpenDeck / Bitfocus Companion

<p align="center">
  <a href="README.md">Español</a> | <b>English</b>
</p>

This directory contains pre-configured plugins and profiles to control **Open Stream Suite** directly from macro pads, physical controllers, and LCD keypads. It is located **outside the `app/` folder** on purpose so you can find it easily.

---

## ✅ Before Installing Anything

1. Launch Open Stream Suite (the local server must be running at `http://localhost:8080`).
2. Verify that it responds by opening in your browser: <http://localhost:8080/api/deck/status>. It should return `"status": "ok"`.
3. All deck plugins connect to this local server. **Everything runs 100% locally, with no cloud accounts or subscriptions required.**

> [!NOTE]
> For security reasons, the server listens **exclusively on your local machine** (`127.0.0.1`) by default. If your macro deck is connected to the same PC, you do not need to change any network settings. If you control it from another device on your LAN, check [Using the Deck from Another Machine](#-using-the-deck-from-another-machine).

---

## 📁 Which Plugin Do I Need?

| Hardware | Directory | What to Install |
| :--- | :--- | :--- |
| **Ajazz AKP05 / AKP05E** (10 LCD keys + touch strip + 4 knobs) with **OpenDeck** | [`ajazz/`](./ajazz/) | Import `opendeck_akp05_config.json` and `akp05_profile_10keys_touch_4knobs.json`. |
| **Ajazz AKP153 / AKP03 / AKP846** | [`ajazz/`](./ajazz/) | Profile `akp_profile_15keys.json` + `ajazz_live_bridge.py` CLI bridge script. |
| **Elgato Stream Deck** (Mini, Standard, XL, +) | [`stream_deck/`](./stream_deck/) | Copy the `com.openstreamsuite.deck.sdPlugin` directory into the Elgato plugins folder. |
| **Bitfocus Companion or OpenDeck** (any macro controller) | [`opendeck_companion/`](./opendeck_companion/) | Import `open_stream_suite_companion_page.json`. |
| Key LCD Icons | [`assets/`](./assets/) | Ready-to-use SVG icons formatted for 144×144 px LCD keys. |

Each folder has its own detailed `README.md` with step-by-step instructions.

---

## 🚀 Quick Setup

### Ajazz AKP05 with OpenDeck
1. Install **OpenDeck** (Linux, Windows, or macOS) and plug in your AKP05.
2. Import [`ajazz/opendeck_akp05_config.json`](./ajazz/opendeck_akp05_config.json).
3. Press any key to test: your OBS overlay will react immediately.
4. Full guide for LCD keys, touch strip, and physical knobs: [`ajazz/README.en.md`](./ajazz/README.en.md) ([Español](./ajazz/README.md)).

### Elgato Stream Deck (Windows and macOS)
1. Close the official **Stream Deck** application.
2. Copy `stream_deck/com.openstreamsuite.deck.sdPlugin` to:
   - **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
3. Launch Stream Deck again; you will see the **Open Stream Suite** category in the action drawer.
4. On **Linux**, Elgato does not provide an official app: use **OpenDeck** with the profile in [`opendeck_companion/`](./opendeck_companion/).

### Bitfocus Companion / OpenDeck
1. Import [`opendeck_companion/open_stream_suite_companion_page.json`](./opendeck_companion/open_stream_suite_companion_page.json).
2. Ensure the generic HTTP target URL points to `http://localhost:8080`.

### What if my deck is not listed?
Any hardware that can issue an **HTTP GET request** works out-of-the-box. You can view all ready-to-copy action URLs at <http://localhost:8080/api/deck/actions>. For example:

```text
http://localhost:8080/api/deck/trigger?id=susto
http://localhost:8080/api/deck/timer?action=start&seconds=300
http://localhost:8080/api/deck/knob?knob=theme&action=next
```

---

## 🌐 Using the Deck from Another Machine

Only necessary if your physical deck or tablet is plugged into a **different computer** on your local network:

1. In `app/.env`, configure:
   ```ini
   SERVER_HOST=0.0.0.0
   DECK_TOKEN=choose_a_long_random_secret_passphrase
   ```
2. Restart the server.
3. On your deck, send the token with each request: header `X-Deck-Token: <token>` or URL parameter `?deck_token=<token>`.
4. Replace `localhost` with your streaming PC's local IP (e.g., `http://192.168.1.20:8080`).

> [!WARNING]
> Never expose the server to the public Internet without an authentication token. `DECK_TOKEN` protects the `/api/deck/` API endpoints. Only use this on a trusted home network.

---

## 🌟 Key Advantages

1. **Real-time Two-way Feedback:** Hardware buttons subscribe to the local WebSocket (`ws://localhost:8080/ws`): timers show remaining countdown seconds, and the active theme button reflects the live palette.
2. **Dual-Layer Architecture:** Cleanly separates OBS Studio scene transitions from interactive overlays and visual meme triggers.
3. **100% Local Execution:** Instant millisecond response times without monthly subscriptions or cloud latency.

---

## 📚 Further Reading
- Full Hardware Integration Guide: [`app/docs/GUIA_INTEGRACION_DECKS.en.md`](../app/docs/GUIA_INTEGRACION_DECKS.en.md)
- Development & Theme Architecture: [`app/docs/GUIA_DESARROLLO_Y_TEMAS.en.md`](../app/docs/GUIA_DESARROLLO_Y_TEMAS.en.md)
