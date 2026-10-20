# ⌨️ AJAZZ AKP KEYPADS & DIALS — COMPLETE PROFILE & OPENDECK
### Native Support for: Ajazz AKP05 / AKP05E (10 Keys + Touch Strip + 4 Knobs) & AKP153 (15 Keys)

<p align="center">
  <a href="README.md">Español</a> | <b>English</b>
</p>

This directory contains full configurations and official profiles for using your Ajazz macro controller with **Open Stream Suite** on **Linux (OpenDeck)**, Windows, and macOS (AKP Studio).

---

## 🎮 Your Hardware: Ajazz AKP05 (10 Keys + Panoramic Touch Strip + 4 Knobs)

The **AKP05 / AKP05E** model provides three layers of physical control:

```text
┌─────────────────────────────────────────────────────────────┐
│ [ 01 GAME ] [ 02 DESK ] [ 03 PC ] [ 04 CHAT ] [ 05 PAUSE ] │ ➔ 10 Square LCD Keys
│ [ 06 MAKER] [ 07 CYBER] [ 08 MEME ] [ 09 CONF] [ 10 PROMO ] │   (OBS Scenes, Themes, Memes)
├─────────────────────────────────────────────────────────────┤
│  [ T1: TIMER ]   [ T2: THEME ]   [ T3: GOAL ]   [ T4: FX ]  │ ➔ Panoramic Touch Strip
├─────────────────────────────────────────────────────────────┤
│     ( 🎛️ 1 )        ( 🎛️ 2 )       ( 🎛️ 3 )       ( 🎛️ 4 )    │ ➔ 4 Rotary Knobs + Click
│     Stopwatch      Neon Themes    Stream Goals  Effects & Chime
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 1. 10 Square LCD Keys Mapping

| Key | Label | Action Type | Function |
| :---: | :--- | :--- | :--- |
| **01** | `GAMEPLAY` | OBS Studio | Switches to full-screen gameplay scene. |
| **02** | `MAKER DESK` | OBS Studio | Switches to workbench / desk camera. |
| **03** | `MAKER PC` | OBS Studio | Switches to programming / terminal screen. |
| **04** | `CHILL CHAT`| OBS Studio | Switches to Just Chatting scene with chat frame. |
| **05** | `PAUSE BRB` | OBS Studio | Switches to animated holding / break screen. |
| **06** | `THEME MAKER` | HTTP GET | Sets Cyan Neon theme (`/api/deck/theme?id=maker_electronico`). |
| **07** | `THEME CYBER` | HTTP GET | Sets Cyberpunk Neon theme (`/api/deck/theme?id=cyberpunk_neon`). |
| **08** | `MEME JUMPSCARE` | HTTP GET | Triggers jumpscare meme video in OBS (`/api/deck/trigger?id=susto`). |
| **09** | `CONFETTI FX` | HTTP GET | Triggers celebratory confetti shower (`/api/deck/explode?emoji=🎉&count=40`). |
| **10** | `SHOUTOUT` | HTTP GET | Launches spotlight promo card for streamer (`/api/deck/widget?widget=promo&action=trigger`). |

---

## 📱 2. Panoramic Touch Strip Mapping (4 Slots)

| Touch Slot | Position | On Tap | Live Feedback (WebSocket) |
| :---: | :--- | :--- | :--- |
| **T1** | Above Knob 1 | Starts a 5-minute countdown | Shows remaining `mm:ss` countdown |
| **T2** | Above Knob 2 | Resets to default theme (Maker Cyan) | Displays active color palette name |
| **T3** | Above Knob 3 | Triggers goal milestone celebration | Displays numerical progress vs goal |
| **T4** | Above Knob 4 | Plays stream chime bell sound | Displays FX icon |

---

## 🎛️ 3. 4 Rotary Knobs Mapping (Physical Encoders)

### Knob 1 — Stopwatch / Timer
* ↺ **Turn Left:** Subtracts 1 minute (`/api/deck/knob?knob=timer&ticks=-1`).
* ↻ **Turn Right:** Adds 1 minute (`/api/deck/knob?knob=timer&ticks=1`).
* 🔘 **Press:** Pauses or resumes countdown (`/api/deck/knob?knob=timer&action=press`).

### Knob 2 — Neon Theme Selector
* ↺ **Turn Left:** Switches to previous color theme (`/api/deck/knob?knob=theme&action=prev`).
* ↻ **Turn Right:** Switches to next color theme (`/api/deck/knob?knob=theme&action=next`).
* 🔘 **Press:** Resets to default channel theme (`/api/deck/theme?id=maker_electronico`).

### Knob 3 — Stream Goals Counter
* ↺ **Turn Left:** Decrements active goal count by 1 (`/api/deck/knob?knob=goal&ticks=-1`).
* ↻ **Turn Right:** Increments active goal count by 1 (`/api/deck/knob?knob=goal&ticks=1`).
* 🔘 **Press:** Fires confetti celebration (`/api/deck/knob?knob=goal&action=press`).

### Knob 4 — Audio-Visual Effects & FX
* ↺ **Turn Left:** Spawns floating hearts ❤️ (`/api/deck/knob?knob=fx&ticks=-1`).
* ↻ **Turn Right:** Spawns confetti shower 🎉 (`/api/deck/knob?knob=fx&ticks=1`).
* 🔘 **Press:** Plays chime / ding notification audio (`/api/deck/knob?knob=fx&action=press`).

---

## 🐧 Setup on Linux with OpenDeck

1. **Launch OpenDeck** on your system.
2. Confirm it detects your **Ajazz AKP05** device.
3. **Import Profile:**
   - In OpenDeck Settings / Profiles, import: [`opendeck_akp05_config.json`](./opendeck_akp05_config.json).
4. Optionally install [`../stream_deck/com.openstreamsuite.deck.sdPlugin`](../stream_deck/com.openstreamsuite.deck.sdPlugin) into `~/.local/share/opendeck/plugins/`.

---

## 🛠️ Testing Script: `ajazz_live_bridge.py`

Test all mapping actions directly from terminal:

```bash
# View complete device mapping
python3 ajazz_live_bridge.py list

# Test key 1 (Gameplay) or key 8 (Meme)
python3 ajazz_live_bridge.py key 1
python3 ajazz_live_bridge.py key 8

# Test touch slot 1 (Timer)
python3 ajazz_live_bridge.py touch 1

# Test Knobs:
python3 ajazz_live_bridge.py knob 1 right   # Knob 1 ↻: +1 min to timer
python3 ajazz_live_bridge.py knob 1 press   # Knob 1 🔘: Pause/Resume timer
python3 ajazz_live_bridge.py knob 2 right   # Knob 2 ↻: Cycle next theme
python3 ajazz_live_bridge.py knob 3 right   # Knob 3 ↻: +1 to follower goal
python3 ajazz_live_bridge.py knob 4 press   # Knob 4 🔘: Play chime ding
```
