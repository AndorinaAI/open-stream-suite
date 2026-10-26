#!/usr/bin/env python3
"""
E2E del backlog de temas: un solo comando, Chrome CDP + API real.

Cubre H1-H5, M1-M3, M7-M9, M11, L4, L5 y L7. Hace snapshot de los cuatro
archivos de estado y los restaura siempre; falla si el servidor no responde o
si algún hash final no coincide con el inicial.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

BASE = "http://localhost:8080"
APP = pathlib.Path(__file__).resolve().parent.parent
ROOT = APP.parent
CHROME = "/usr/bin/google-chrome"
PORT = 9316
STATE_FILES = ("themes_state.json", "fusions.json", "config.js", "overlay_texts_config.json")
CREATED_FUSIONS: list[str] = []
FAILS = 0


def check(name: str, ok: bool, detail: str = "") -> None:
    global FAILS
    if not ok:
        FAILS += 1
    print(("PASS  " if ok else "FAIL  ") + name + (f"  [{detail}]" if detail else ""))


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def token() -> str:
    return json.load(urllib.request.urlopen(BASE + "/api/local-token"))["token"]


def api(method: str, path: str, payload: dict | None = None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        BASE + path, data=data, method=method,
        headers={"Content-Type": "application/json", "X-Local-Token": token()},
    )
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode()
            parsed = json.loads(raw) if raw else {}
            return r.status, parsed if isinstance(parsed, dict) else {"data": parsed}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"error": raw}
        return e.code, parsed if isinstance(parsed, dict) else {"data": parsed}


async def send(ws, mid: int, method: str, params: dict | None = None):
    await ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
    while True:
        r = json.loads(await ws.recv())
        if r.get("id") == mid:
            return r


async def ev(ws, mid: int, expr: str, await_promise: bool = False):
    r = await send(ws, mid, "Runtime.evaluate", {
        "expression": expr, "returnByValue": True, "awaitPromise": await_promise,
    })
    return r.get("result", {}).get("result", {}).get("value")


async def nav(ws, mid: int, url: str, wait: float = 2.6):
    await send(ws, mid, "Page.navigate", {"url": url})
    await asyncio.sleep(wait)


PAGE_STATE = """(() => JSON.stringify({
  theme: document.body.getAttribute('data-theme'),
  shape: document.body.getAttribute('data-theme-shape'),
  accent: getComputedStyle(document.body).getPropertyValue('--color-accent-cyan').trim()
}))()"""


def run_api_contract() -> None:
    st, data = api("GET", "/api/themes/packs")
    check("API packs 200", st == 200, str(st))
    check("API 21 temas / 27 escenas", len(data.get("packs", [])) == 4 and
          sum(len(p.get("themes", [])) for p in data.get("packs", [])) == 21, str(st))
    check("API activeShape original", data.get("activeShape") == "original", str(data.get("activeShape")))
    check("API defaults 27", len(data.get("defaultOverlayThemes", {})) == 27,
          str(len(data.get("defaultOverlayThemes", {}))))

    # M1: defaults de fusión inválidos
    st, body = api("POST", "/api/fusions", {"name": "E2E M1 theme", "defaultTheme": "no-theme", "scenes": ["chill"]})
    check("M1 tema inválido 400", st == 400, f"{st} {body}")
    st, body = api("POST", "/api/fusions", {"name": "E2E M1 shape", "defaultShape": "no-shape", "scenes": ["chill"]})
    check("M1 forma inválida 400", st == 400, f"{st} {body}")

    # M2: miembros desconocidos -> warnings, no error total
    st, body = api("POST", "/api/fusions", {
        "name": "E2E M2 mixed", "scenes": ["chill", "no-existe"],
        "widgets": ["ticker", "no-widget"], "alerts": ["card", "no-alert"],
        "defaultTheme": "maker", "defaultShape": "original",
    })
    fusion = body.get("fusion") or {} if isinstance(body, dict) else {}
    check("M2 guardado 200", st == 200, f"{st} {body}")
    check("M2 unknownScenes", fusion.get("unknownScenes") == ["no-existe"], str(fusion.get("unknownScenes")))
    check("M2 unknownWidgets", fusion.get("unknownWidgets") == ["no-widget"], str(fusion.get("unknownWidgets")))
    check("M2 unknownAlerts", fusion.get("unknownAlerts") == ["no-alert"], str(fusion.get("unknownAlerts")))
    check("M2 warnings", bool(fusion.get("warnings")), str(fusion.get("warnings")))
    if fusion.get("id"):
        CREATED_FUSIONS.append(fusion["id"])

    st, body = api("POST", "/api/fusions", {"name": "E2E M2 empty", "scenes": ["no-existe"]})
    check("M2 todos inválidos 400", st == 400, f"{st} {body}")

    # M3: lote por capacidad
    st, body = api("POST", "/api/fusions", {
        "name": "E2E M3 mixed", "scenes": ["chill"], "alerts": ["card"],
        "defaultTheme": "maker", "defaultShape": "original",
    })
    fusion = body.get("fusion") or {} if isinstance(body, dict) else {}
    fid = fusion.get("id")
    check("M3 fusión creada", st == 200 and bool(fid), f"{st} {body}")
    if fid:
        CREATED_FUSIONS.append(fid)
        st, body = api("POST", f"/api/fusions/{fid}/apply-shape", {"shapeId": "pill"})
        check("M3 lote mixto 200", st == 200, f"{st} {body}")
        check("M3 alerta aplicada", body.get("appliedAlerts") == ["card"], str(body.get("appliedAlerts")))
        check("M3 escena omitida", "chill" in (body.get("skippedScenes") or []), str(body.get("skippedScenes")))
        check("M3 estado partial", body.get("status") == "partial", str(body.get("status")))
        st, body = api("POST", f"/api/fusions/{fid}/apply-shape", {"shapeId": "no-shape"})
        check("M3 forma inválida 400", st == 400, f"{st} {body}")


async def run_browser() -> None:
    profile = tempfile.mkdtemp(prefix="oss_e2e_")
    proc = subprocess.Popen(
        [CHROME, "--headless=new", f"--remote-debugging-port={PORT}",
         f"--user-data-dir={profile}", "--no-first-run", "--disable-gpu", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    import websockets
    try:
        tabs = None
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
                break
            except Exception:
                time.sleep(0.25)
        if not tabs:
            check("Chrome CDP disponible", False)
            return
        tab = [t for t in tabs if t["type"] == "page"][0]
        async with websockets.connect(tab["webSocketDebuggerUrl"], max_size=2**24) as ws:
            mid = 1
            await send(ws, mid, "Page.enable"); mid += 1
            CHILL = f"{BASE}/streamthemes/Maker_Theme_Pack/overlays/chill/index.html"
            TICK = f"{BASE}/widgets/ticker/index.html"
            ALERTS = f"{BASE}/alerts/index.html"

            # H1-H5: contrato de precedencia vivo
            for key in ("chill", "widget:ticker", "alert:card", "alert:banner"):
                api("POST", "/api/themes/reset-assignment", {"overlayKey": key})
            api("POST", "/api/themes/apply", {"pack": "Maker_Theme_Pack", "theme": "synthwave"})
            await asyncio.sleep(0.6)
            await nav(ws, mid, CHILL); a = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H1 escena global", a["theme"] == "synthwave", json.dumps(a))
            await nav(ws, mid, TICK); b = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H1 widget global", b["theme"] == "synthwave", json.dumps(b))
            await nav(ws, mid, ALERTS); c = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H1 alerta global", c["theme"] == "synthwave", json.dumps(c))

            api("POST", "/api/themes/overlay-assignment", {"overlayKey": "chill", "themeId": "terminal"})
            await nav(ws, mid, CHILL)
            api("POST", "/api/themes/apply", {"pack": "Maker_Theme_Pack", "theme": "cyberpunk"})
            await asyncio.sleep(1.0)
            d = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H2 explícita gana", d["theme"] == "terminal", json.dumps(d))
            await nav(ws, mid, CHILL); d2 = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H2 explícita persiste", d2["theme"] == "terminal", json.dumps(d2))

            api("POST", "/api/themes/reset-assignment", {"overlayKey": "widget:ticker"})
            api("POST", "/api/themes/overlay-assignment", {"overlayKey": "widget:ticker", "shapeId": "pill"})
            await nav(ws, mid, TICK)
            api("POST", "/api/themes/apply", {"pack": "Maker_Theme_Pack", "theme": "maker"})
            await asyncio.sleep(1.0)
            e = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H3 global conserva forma", e["shape"] == "pill" and e["theme"] == "maker", json.dumps(e))

            api("POST", "/api/themes/overlay-assignment", {"overlayKey": "widget:ticker", "themeId": "terminal"})
            await nav(ws, mid, TICK)
            api("POST", "/api/themes/reset-assignment", {"overlayKey": "widget:ticker"})
            await asyncio.sleep(0.8)
            api("POST", "/api/themes/apply", {"pack": "Maker_Theme_Pack", "theme": "cyberpunk"})
            await asyncio.sleep(1.0)
            f = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H4 reset recupera global", f["theme"] == "cyberpunk", json.dumps(f))

            api("POST", "/api/themes/overlay-assignment", {"overlayKey": "alert:card", "themeId": "synthwave"})
            api("POST", "/api/themes/overlay-assignment", {"overlayKey": "alert:banner", "themeId": "toxic_rad"})
            await nav(ws, mid, ALERTS)
            g = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H5 card al arrancar", g["theme"] == "synthwave", json.dumps(g))
            await ev(ws, mid, "AlertQueue.playBannerAlert({alertType:'follow',user:'Test',title:'Hola',message:'',duration:900,bannerStyle:'glassmorphism'}); 'ok'"); mid += 1
            await asyncio.sleep(0.8)
            h = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H5 banner usa su tema", h["theme"] == "toxic_rad", json.dumps(h))
            await ev(ws, mid, "AlertQueue.playCardAlert({type:'follow',user:'Test',title:'Hola',message:'',duration:900}); 'ok'"); mid += 1
            await asyncio.sleep(0.8)
            i = json.loads(await ev(ws, mid, PAGE_STATE)); mid += 1
            check("H5 card recupera su tema", i["theme"] == "synthwave", json.dumps(i))

            # Panel: M7/M8/M9, L5 y L7
            await nav(ws, mid, f"{BASE}/alerts/panel.html", 3.2)
            check("panel API/ComponentThemes", bool(await ev(ws, mid,
                  "typeof API === 'object' && typeof ComponentThemes === 'object'"))); mid += 1
            check("M7 escenas reales", bool(await ev(ws, mid,
                  "typeof OSS_SCENES !== 'undefined' && OSS_SCENES.length === 27"))); mid += 1
            m7 = await ev(ws, mid, """(async () => {
              const sel = document.getElementById('select-global-theme-all');
              sel.value = [...sel.options].find(o => o.value)?.value || 'maker';
              const oldApi = API.setOverlayTheme, oldToast = OverlayTexts.showToast;
              let toast = '';
              API.setOverlayTheme = async () => {};
              OverlayTexts.showToast = (msg) => { toast = msg; };
              await applyThemeToAllScenesFromBar();
              API.setOverlayTheme = oldApi; OverlayTexts.showToast = oldToast;
              return toast;
            })()""", True); mid += 1
            check("M7 toast 27", "27" in str(m7) and "9 escenas" not in str(m7), str(m7))
            m8 = await ev(ws, mid, "formatBatchSummary({appliedScenes:['chill'],appliedWidgets:['ticker'],appliedAlerts:['card'],skippedScenes:['maker-desk'],failedAlerts:[{alertId:'banner'}]})"); mid += 1
            check("M8 resumen completo", all(x in str(m8) for x in ("1 escena", "1 widget", "1 alerta", "1 omitido", "1 fallo")), str(m8))
            m9 = await ev(ws, mid, """(async () => {
              const before = cachedOverlayThemes['chill'];
              const oldApi = API.setOverlayTheme, oldToast = OverlayTexts.showToast;
              API.setOverlayTheme = async () => { throw new Error('fallo simulado'); };
              OverlayTexts.showToast = () => {};
              await onOverlayThemeChange('chill', 'terminal');
              API.setOverlayTheme = oldApi; OverlayTexts.showToast = oldToast;
              return {before, after: cachedOverlayThemes['chill']};
            })()""", True); mid += 1
            check("M9 fallo no contamina caché", m9.get("before") == m9.get("after"), str(m9))
            l5 = await ev(ws, mid, """(() => {
              const s = document.querySelector('#component-themes-panel select[data-role="shape"][data-key="widget:ticker"]');
              return s ? [...s.options].filter(o => o.value).map(o => [o.value, o.textContent.trim()]) : null;
            })()"""); mid += 1
            check("L5 etiquetas genéricas", "Píldora" in str(l5) and "pill" not in str([x[1] for x in (l5 or [])]), str(l5)[:140])
            l7 = await ev(ws, mid, """(() => {
              AlertsStudio.renderStudio();
              return true;
            })()"""); mid += 1
            await asyncio.sleep(1.2)
            l7 = await ev(ws, mid, """(() => {
              const panel = document.getElementById('alert-themes-panel');
              const shapes = panel ? [...panel.querySelectorAll('select[data-role="shape"]')] : [];
              return {rows: shapes.length, options: shapes.map(s => s.options.length),
                      template: !!panel && !!panel.closest('.dash-card')};
            })()"""); mid += 1
            check("L7 panel alertas 2 filas", l7.get("rows") == 2, str(l7))
            check("L7 30 formas por fila", sorted(l7.get("options") or []) == [30, 30], str(l7))

            # L4 + M11
            api("POST", "/api/themes/overlay-assignment", {"overlayKey": "gamer_gameplay", "shapeId": "cozy_polaroid"})
            await nav(ws, mid, f"{BASE}/streamthemes/Gamer_Pro_Pack/overlays/gameplay_hud/index.html")
            l4 = await ev(ws, mid, """(() => {
              const cam = document.querySelector('.camera-frame');
              const c = getComputedStyle(cam);
              return {shape: document.body.getAttribute('data-theme-shape'),
                      panel: cam && cam.hasAttribute('data-oss-panel'),
                      radius: c.borderRadius, clip: c.clipPath};
            })()"""); mid += 1
            check("L4 camera panel", l4.get("panel") is True and l4.get("shape") == "cozy_polaroid", str(l4))
            check("L4 forma aplicada", l4.get("radius") not in ("0px", "") or l4.get("clip") not in ("none", ""), str(l4))
            await nav(ws, mid, f"{BASE}/streamthemes/Maker_Theme_Pack/overlays/chill/index.html?theme=maker")
            m11 = await ev(ws, mid, """(() => {
              const s = getComputedStyle(document.body);
              return ['--frame-radius','--frame-border-width','--frame-border-style','--frame-clip-path','--frame-shadow','--frame-corner-display','--panel-radius','--panel-clip-path','--panel-backdrop','--panel-shadow','--badge-radius','--badge-clip-path','--header-radius','--header-clip-path']
                .filter(k => s.getPropertyValue(k).trim()).length;
            })()"""); mid += 1
            check("M11 14 tokens maker", m11 == 14, str(m11))
    finally:
        proc.terminate()


async def main() -> int:
    try:
        urllib.request.urlopen(BASE + "/api/themes/packs", timeout=3).read()
    except Exception as e:
        print(f"FAIL  servidor no disponible en {BASE}: {e}")
        return 2

    with tempfile.TemporaryDirectory(prefix="oss_e2e_state_") as td:
        backup = pathlib.Path(td)
        for f in STATE_FILES:
            shutil.copy2(APP / f, backup / f)
        before = {f: sha(APP / f) for f in STATE_FILES}
        try:
            run_api_contract()
            await run_browser()
        finally:
            for fid in CREATED_FUSIONS:
                api("DELETE", f"/api/fusions/{fid}")
            for f in STATE_FILES:
                shutil.copy2(backup / f, APP / f)
        after = {f: sha(APP / f) for f in STATE_FILES}
        check("estado restaurado", before == after, str({k: (before[k], after[k]) for k in STATE_FILES if before[k] != after[k]}))

    print("\nRESULTADO:", "TODO PASS" if FAILS == 0 else f"{FAILS} FALLOS")
    return 0 if FAILS == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
