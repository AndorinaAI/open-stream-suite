# 🎮 HARDWARE DECK INTEGRATION: ELGATO STREAM DECK, AJAZZ AKP & OPENDECK (COMPANION)
### Open Stream Suite — Physical Hardware Control for Scenes, Memes, Themes, Widgets & Timers

<p align="center">
  <a href="GUIA_INTEGRACION_DECKS.md">Español</a> | <b>English</b>
</p>

This guide explains clearly how to connect your physical macro controllers (**Elgato Stream Deck, Ajazz AKP keyboards, OpenDeck, or Bitfocus Companion**) with your live stream and Open Stream Suite.

---

## 📑 TABLE OF CONTENTS
1. [How Does the Connection Work?](#1-how-does-the-connection-work)
2. [OBS Scene Switching (Native Integration)](#2-obs-scene-switching-native-integration)
3. [Controlling Memes, Triggers, Themes, and Timers (REST API & WebSockets)](#3-controlling-memes-triggers-themes-and-timers)
4. [Setting Up Your Ajazz (AKP05 with 10 Keys, Touch Strip & 4 Knobs / OpenDeck on Linux)](#4-setting-up-your-ajazz-akp05-with-10-keys-touch-strip--4-knobs)
5. [Setting Up Elgato Stream Deck](#5-setting-up-elgato-stream-deck)
6. [Setting Up OpenDeck & Bitfocus Companion](#6-setting-up-opendeck--bitfocus-companion)
7. [Universal Widget Control (Promo, Goal, Ticker, Chat)](#7-universal-widget-control)
8. [Quick Action Reference & 1-Click URLs](#8-quick-action-reference--1-click-urls)

---

## 1. How Does the Connection Work?

> [!TIP]
> **Quick answer: You do NOT need to write complex code.**
> All hardware buttons operate via two pre-built pathways:

1. **Switching Scenes in OBS (Game, Maker, Chat, BRB):**
   * Handled through the **official OBS WebSocket** built directly into OBS Studio. All deck applications (Elgato, Ajazz, Companion) provide native scene-switching actions.
2. **Triggering Memes, Color Themes, Widgets, or Timers:**
   * Open Stream Suite exposes a **1-Click HTTP API (`/api/deck/...`)**: paste a URL (GET or POST) into any button or macro key, responding in under 5 ms.
   * In addition, the local WebSocket (`ws://localhost:8080/ws`) is always active for real-time bidirectional feedback on LCD screens.

> [!IMPORTANT]
> **Network Security.** By default the server listens **exclusively on your local machine** (`127.0.0.1`), meaning decks connected to the same PC require zero extra setup. If your deck is on **another machine** on your LAN, add to `app/.env`:
> ```ini
> SERVER_HOST=0.0.0.0
> DECK_TOKEN=choose_a_long_random_secret_passphrase
> ```
> and send this token in every request (header `X-Deck-Token: ...` or `?deck_token=...`). Requests from external web browsers are blocked. Plugin setup guide: [`plugins/README.en.md`](../../plugins/README.en.md) ([Español](../../plugins/README.md)).

---

## 2. OBS Scene Switching (Native Integration)

To switch live broadcast scenes, your deck communicates directly with OBS Studio:

### Enable OBS WebSocket in OBS Studio
1. In OBS Studio, open **Tools → WebSocket Server Settings**.
2. Check **✅ Enable WebSocket server**.
3. Default port: **`4455`**.
4. You can uncheck password for local networks or note the generated secret.

### Configure Buttons in Your Deck Software
In your deck application (Stream Deck, AKP Studio, or Companion):
* Add the native action: **OBS Studio ➔ Switch Scene**.
* Select the target scene: `Gameplay`, `Main Scene`, `PC Screen`, `Chill`, or `Be Right Back`.
* Pressing the physical key immediately triggers the OBS transition.

---

## 3. Controlling Memes, Triggers, Themes, and Timers

The local suite (`http://localhost:8080`) provides ready-to-call endpoints:
* **Method 1 (1-Click HTTP GET - Simplest):** Any device capable of making a background HTTP GET request.
* **Method 2 (WebSocket JSON):** For OpenDeck, Companion, or scripts maintaining a persistent connection to `ws://localhost:8080/ws`.

---

## 4. Setting Up Your Ajazz (AKP05 with 10 Keys, Touch Strip & 4 Knobs)

For the **Ajazz AKP05 / AKP05E** (10 square LCD keys, panoramic touch strip, and 4 physical rotary knobs), a tailor-made profile is provided in [`plugins/ajazz/`](../../plugins/ajazz/):

### Controller Mapping:
1. **10 Square LCD Keys (2 rows of 5):**
   * Row 1 (Keys 1-5): Native OBS Studio scenes (`Gameplay`, `Maker Desk`, `Maker PC`, `Chill`, `Be Right Back`).
   * Row 2 (Keys 6-10): Neon Themes (Maker & Cyberpunk), Jump-scare Meme (`/api/deck/trigger?id=susto`), Confetti Shower (`🎉`), and Streamer Shoutout.
2. **Panoramic Touch Strip (4 slots aligned above each knob):**
   * **T1 (Timer):** Tap to start a 5-minute countdown (displays remaining `mm:ss` live via WebSocket).
   * **T2 (Theme):** Tap to reset to default theme (displays active palette name).
   * **T3 (Goal):** Tap to celebrate reached target (displays current count vs goal).
   * **T4 (FX):** Tap to play live chime sound.
3. **4 Rotary Knobs with Push-to-Click:**
   * **Knob 1 (Timer):** Turn right for +1 min, turn left for -1 min, press to pause/resume.
   * **Knob 2 (Neon Theme Selector):** Turn right/left to cycle through 20 live color palettes, press for default.
   * **Knob 3 (Twitch Goals):** Turn to add (+1) or subtract (-1) from goal, press for celebratory confetti.
   * **Knob 4 (FX Sounds & Emotes):** Turn right for confetti 🎉, turn left for hearts ❤️, press for ding chime 🔊.

### Setup on Linux with OpenDeck:
1. Open **OpenDeck** and connect your **Ajazz AKP05**.
2. Import the pre-configured profile:
   [`plugins/ajazz/opendeck_akp05_config.json`](../../plugins/ajazz/opendeck_akp05_config.json).
3. Copy [`plugins/stream_deck/com.openstreamsuite.deck.sdPlugin`](../../plugins/stream_deck/com.openstreamsuite.deck.sdPlugin) to `~/.local/share/opendeck/plugins/` for native encoder support.

### Live CLI Testing (`ajazz_live_bridge.py`):
Run these commands from the project root with the server running:
```bash
python3 plugins/ajazz/ajazz_live_bridge.py list                      # Show mapping
python3 plugins/ajazz/ajazz_live_bridge.py key 1                    # Switch to Gameplay scene
python3 plugins/ajazz/ajazz_live_bridge.py touch 1                  # Start 5 min timer
python3 plugins/ajazz/ajazz_live_bridge.py knob 1 right             # +1 min with Knob 1
python3 plugins/ajazz/ajazz_live_bridge.py knob 2 right             # Next neon theme
python3 plugins/ajazz/ajazz_live_bridge.py knob 3 right             # +1 to follower goal
python3 plugins/ajazz/ajazz_live_bridge.py knob 4 press             # Play chime ding
```

---

## 5. Setting Up Elgato Stream Deck

### Option A: Official Native Plugin
1. In [`plugins/stream_deck/`](../../plugins/stream_deck/), copy `com.openstreamsuite.deck.sdPlugin` to:
   * **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   * **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
2. Restart the Stream Deck software.
3. The **Open Stream Suite** category will appear with dedicated actions:
   * *Trigger Meme / Sound*
   * *Apply Theme Palette*
   * *Countdown Timer on LCD*
   * *Confetti / Emote Shower*

### Option B: Built-in Stream Deck Actions (No Plugins)
1. Drag **System ➔ Website** (or **API Request**) onto any button.
2. Enter the direct 1-Click URL (e.g., `http://localhost:8080/api/deck/timer?action=start&seconds=300`).
3. Check **GET request in background**.

---

## 6. Setting Up OpenDeck & Bitfocus Companion

### Import Companion Page
1. Open Companion in your browser (`http://localhost:8888`).
2. Go to **Import / Export**.
3. Under **Import Page**, select:
   [`open_stream_suite_companion_page.json`](../../plugins/opendeck_companion/open_stream_suite_companion_page.json).
4. Select target page and click **Import**.

### Direct WebSocket Connection (Microcontrollers & Custom Scripts)
Connect any script to `ws://localhost:8080/ws` and dispatch JSON messages:
```json
{
  "action": "trigger",
  "id": "susto"
}
```

---

## 7. Universal Widget Control

Control widgets via `/api/deck/widget`:

| Widget | Action | 1-Click URL |
| :--- | :--- | :--- |
| **Promo / Shoutout** | Spotlight fellow creator | `http://localhost:8080/api/deck/widget?widget=promo&streamer=STREAMER_NAME` |
| **Goals** | Add +1 or +5 to goal | `http://localhost:8080/api/deck/widget?widget=goal&action=add&amount=1` |
| **Ticker** | Broadcast live message | `http://localhost:8080/api/deck/widget?widget=ticker&action=message&text=HELLO+STREAM` |
| **Chat Overlay** | Clear messages from screen | `http://localhost:8080/api/deck/widget?widget=chat&action=clear` |

---

## 8. Quick Action Reference & 1-Click URLs

| Action | Local URL (GET / POST) | Optional Parameters |
| :--- | :--- | :--- |
| **Trigger Meme** | `http://localhost:8080/api/deck/trigger?id=TRIGGER_ID` | `&user=Name` |
| **Apply Theme** | `http://localhost:8080/api/deck/theme?id=THEME_ID` | `&pack=pack_id` |
| **Start Timer** | `http://localhost:8080/api/deck/timer?action=start&seconds=300` | `&title=BREAK` |
| **Pause Timer** | `http://localhost:8080/api/deck/timer?action=pause` | — |
| **Reset Timer** | `http://localhost:8080/api/deck/timer?action=reset` | — |
| **Confetti Shower** | `http://localhost:8080/api/deck/explode?emoji=🎉&count=40` | `&emoji=❤️` |
| **Simulate Follow** | `http://localhost:8080/api/deck/alert?type=follow` | `&user=Name` |
| **Simulate Sub** | `http://localhost:8080/api/deck/alert?type=sub` | `&user=Name` |
| **Rotary Dial** | `http://localhost:8080/api/deck/knob?knob=theme&action=next` | `knob=timer|volume` |
| **Dynamic Action List** | `http://localhost:8080/api/deck/actions` | *(Returns live JSON with all your actions)* |
