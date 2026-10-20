#!/usr/bin/env python3
"""
====================================================================
OPEN STREAM SUITE — AJAZZ AKP LIVE HARDWARE & OPENDECK BRIDGE
====================================================================
Utilidad de control interactivo para teclados y diales Ajazz (AKP05 / AKP153 / AKP03).
Soporta:
  - 10 Teclas Cuadradas LCD (Filas 1 y 2)
  - Pantalla Táctil Alargada (4 zonas táctiles / touch slots)
  - 4 Knobs Rotatorios (Giro Izquierda, Giro Derecha, Pulsación/Click)
"""

import sys
import json
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROFILE_AKP05 = BASE_DIR / "akp05_profile_10keys_touch_4knobs.json"
PROFILE_AKP153 = BASE_DIR / "akp_profile_15keys.json"
BASE_URL = "http://localhost:8080"

def get_profile_file():
    if "--profile-15" in sys.argv:
        return PROFILE_AKP153
    if PROFILE_AKP05.exists():
        return PROFILE_AKP05
    return PROFILE_AKP153

def load_profile():
    pfile = get_profile_file()
    if not pfile.exists():
        print(f"❌ Error: Archivo de perfil no encontrado en {pfile}")
        sys.exit(1)
    with open(pfile, "r", encoding="utf-8") as f:
        return json.load(f)

def make_request(url):
    try:
        safe_url = urllib.parse.quote(url, safe=":/?=&")
        req = urllib.request.Request(safe_url, headers={"User-Agent": "AjazzOpenDeckBridge/2.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            action_desc = data.get("action") or data.get("themeName") or data.get("id") or "ejecutado"
            print(f"  ✓ Open Stream Suite OK ➔ {action_desc} ({json.dumps(data, ensure_ascii=False)})")
            return True
    except Exception as e:
        print(f"  ⚠️ Error de conexión a {url}: {e}")
        return False

def trigger_key(key_num: int):
    profile = load_profile()
    keys = profile.get("keys", [])
    target = next((k for k in keys if k.get("key_index") == key_num), None)

    if not target:
        print(f"❌ Tecla {key_num} no encontrada en el perfil (disponibles 1-{len(keys)})")
        return False

    label = target.get("label", f"Tecla {key_num}")
    url = target.get("url")
    action_type = target.get("action_type")

    print(f"👉 [TECLA LCD {key_num}] {label} ({action_type})")

    if action_type == "http_request" and url:
        return make_request(url)
    elif action_type == "obs_scene":
        scene = target.get("target_scene")
        print(f"  📺 [OBS Studio] Conmutando a escena: '{scene}'.")
        return True

    return False

def trigger_touch(slot_num: int):
    profile = load_profile()
    slots = profile.get("touch_strip_slots", [])
    target = next((s for s in slots if s.get("slot_index") == slot_num), None)

    if not target:
        print(f"❌ Zona táctil {slot_num} no encontrada (disponibles 1-4)")
        return False

    title = target.get("title", f"Touch Slot {slot_num}")
    url = target.get("url")
    print(f"👆 [PANTALLA TÁCTIL - ZONA {slot_num}] {title}")
    if url:
        return make_request(url)
    return False

def trigger_knob(knob_num: int, direction: str):
    profile = load_profile()
    knobs = profile.get("knobs", [])
    target = next((k for k in knobs if k.get("knob_index") == knob_num), None)

    if not target:
        print(f"❌ Knob {knob_num} no encontrado (disponibles 1-4)")
        return False

    name = target.get("name", f"Knob {knob_num}")
    direction = direction.lower()

    if direction in ("left", "izq", "anticlockwise", "-1", "prev"):
        info = target.get("rotate_left", {})
        url = info.get("url")
        desc = f"Giro Izquierda ↺ ({info.get('action')})"
    elif direction in ("right", "der", "clockwise", "1", "+1", "next"):
        info = target.get("rotate_right", {})
        url = info.get("url")
        desc = f"Giro Derecha ↻ ({info.get('action')})"
    elif direction in ("press", "click", "push", "pulsa"):
        info = target.get("press", {})
        url = info.get("url")
        desc = f"Pulsación / Click 🔘 ({info.get('action')})"
    else:
        print(f"❌ Dirección desconocida '{direction}'. Usa: left, right o press")
        return False

    print(f"🎛️ [{name}] {desc}")
    if url:
        return make_request(url)
    return False

def show_help():
    print("================================================================")
    print("🎮 OPEN STREAM SUITE — PUENTE AJAZZ AKP & OPENDECK")
    print("================================================================")
    print("Uso interactivo:")
    print("  python3 ajazz_live_bridge.py list                      # Ver mapa completo")
    print("  python3 ajazz_live_bridge.py <1-10>                    # Pulsar tecla LCD 1 a 10")
    print("  python3 ajazz_live_bridge.py key <1-10>                # Pulsar tecla LCD 1 a 10")
    print("  python3 ajazz_live_bridge.py touch <1-4>               # Pulsar zona de pantalla táctil")
    print("  python3 ajazz_live_bridge.py knob <1-4> <left|right|press> # Girar o pulsar knob")
    print("Ejemplos:")
    print("  python3 ajazz_live_bridge.py 1                         # Escena Gameplay")
    print("  python3 ajazz_live_bridge.py knob 1 right              # Knob 1: +1 min timer")
    print("  python3 ajazz_live_bridge.py knob 1 press              # Knob 1: Pausar/Reanudar")
    print("  python3 ajazz_live_bridge.py knob 2 right              # Knob 2: Siguiente Tema Neón")
    print("  python3 ajazz_live_bridge.py knob 3 right              # Knob 3: +1 a Meta (Goal)")
    print("  python3 ajazz_live_bridge.py knob 4 press              # Knob 4: Chime / Ding")
    print("================================================================")

def list_all():
    profile = load_profile()
    print("================================================================")
    print(f"📋 {profile.get('profile_name')}")
    print(f"🏷️  Modelo: {profile.get('device_model')}")
    print("================================================================")
    
    print("\n[🟦 10 TECLAS CUADRADAS LCD - 2 FILAS DE 5]")
    for k in profile.get("keys", []):
        print(f" [{k.get('key_index'):2d}]  {k.get('label'):<16} ➔ {k.get('description')}")

    if profile.get("touch_strip_slots"):
        print("\n[📱 PANTALLA TÁCTIL ALARGADA - 4 ZONAS SOBRE LOS KNOBS]")
        for s in profile.get("touch_strip_slots", []):
            print(f" [T{s.get('slot_index')}]  {s.get('title'):<16} ➔ {s.get('subtext')} (Alineado con Knob {s.get('aligned_with_knob')})")

    if profile.get("knobs"):
        print("\n[🎛️ 4 KNOBS ROTATORIOS CON CLICK]")
        for kn in profile.get("knobs", []):
            print(f" [K{kn.get('knob_index')}] {kn.get('name')}")
            print(f"      ↺ Izq:    {kn.get('rotate_left', {}).get('action')}")
            print(f"      ↻ Der:    {kn.get('rotate_right', {}).get('action')}")
            print(f"      🔘 Click:  {kn.get('press', {}).get('action')}")
    print("================================================================\n")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--profile")]
    if not args or args[0] in ("-h", "--help"):
        show_help()
        sys.exit(0)

    cmd = args[0].lower()
    if cmd == "list":
        list_all()
        sys.exit(0)

    if cmd == "key" and len(args) >= 2:
        try:
            sys.exit(0 if trigger_key(int(args[1])) else 1)
        except ValueError:
            print("Número de tecla inválido.")
            sys.exit(1)

    if cmd == "touch" and len(args) >= 2:
        try:
            sys.exit(0 if trigger_touch(int(args[1])) else 1)
        except ValueError:
            print("Número de zona táctil inválido (1-4).")
            sys.exit(1)

    if cmd == "knob" and len(args) >= 3:
        try:
            knob_idx = int(args[1])
            direction = args[2]
            sys.exit(0 if trigger_knob(knob_idx, direction) else 1)
        except ValueError:
            print("Número de knob inválido (1-4).")
            sys.exit(1)

    # Si es solo un número directo (ej: python3 ajazz_live_bridge.py 1)
    try:
        num = int(cmd)
        sys.exit(0 if trigger_key(num) else 1)
    except ValueError:
        print(f"❌ Comando no reconocido: '{cmd}'. Ejecuta con --help para ver las opciones.")
        sys.exit(1)
