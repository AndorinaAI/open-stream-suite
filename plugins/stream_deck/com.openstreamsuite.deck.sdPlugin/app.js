/**
 * ====================================================================
 * OPEN STREAM SUITE — ELGATO STREAM DECK & OPENDECK PLUGIN CONTROLLER
 * ====================================================================
 * Se comunica con la aplicación Stream Deck / OpenDeck vía WebSocket local
 * y conecta con la suite Open Stream Suite en http://localhost:8080.
 * Soporta:
 *  - Teclas LCD (Keypad) con imágenes y textos
 *  - Knobs / Diales Giratorios (Encoder dialRotate, dialDown)
 *  - Tiras de Pantalla Táctil (touchTap, setFeedback)
 */

let websocket = null;
let pluginUUID = null;
let tallerWs = null;
const activeContexts = new Map();

// Conexión oficial llamada automáticamente por el runtime de Elgato / OpenDeck
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
  pluginUUID = inPluginUUID;
  websocket = new WebSocket(`ws://127.0.0.1:${inPort}`);

  websocket.onopen = function () {
    const registerJson = {
      event: inRegisterEvent,
      uuid: inPluginUUID
    };
    websocket.send(JSON.stringify(registerJson));
    initOpenStreamSuiteWebSocket();
  };

  websocket.onmessage = function (evt) {
    try {
      const data = JSON.parse(evt.data);
      handleStreamDeckEvent(data);
    } catch (e) {}
  };
}

// Conectar con el WebSocket de Open Stream Suite para recibir feedback en vivo
function initOpenStreamSuiteWebSocket() {
  try {
    tallerWs = new WebSocket("ws://localhost:8080/ws");
    
    tallerWs.onmessage = function (e) {
      try {
        const msg = JSON.parse(e.data);
        handleTallerEvent(msg);
      } catch (err) {}
    };

    tallerWs.onclose = function () {
      setTimeout(initOpenStreamSuiteWebSocket, 5000);
    };
  } catch (e) {
    setTimeout(initOpenStreamSuiteWebSocket, 5000);
  }
}

// Procesar eventos de OpenDeck / Stream Deck (Teclas, Diales, Touch)
function handleStreamDeckEvent(json) {
  const event = json.event;
  const context = json.context;
  const action = json.action;
  const settings = json.payload?.settings || {};

  if (event === "willAppear") {
    activeContexts.set(context, { action, settings });
  } else if (event === "willDisappear") {
    activeContexts.delete(context);
  } else if (event === "keyUp") {
    executeDeckAction(action, settings, context);
  } else if (event === "dialRotate") {
    const ticks = json.payload?.ticks || 1;
    executeDialRotate(action, settings, ticks, context);
  } else if (event === "dialDown" || event === "dialPress") {
    executeDialPress(action, settings, context);
  } else if (event === "touchTap") {
    executeTouchTap(action, settings, context);
  }
}

// Ejecutar acción de tecla LCD
async function executeDeckAction(action, settings, context) {
  try {
    if (action === "com.openstreamsuite.deck.trigger") {
      const triggerId = settings.triggerId || "susto";
      await fetch(`http://localhost:8080/api/deck/trigger?id=${encodeURIComponent(triggerId)}`);
      showOk(context);
    } else if (action === "com.openstreamsuite.deck.theme") {
      const themeId = settings.themeId || "maker_electronico";
      await fetch(`http://localhost:8080/api/deck/theme?id=${encodeURIComponent(themeId)}`);
      showOk(context);
    } else if (action === "com.openstreamsuite.deck.timer") {
      const timerAction = settings.timerAction || "start";
      const seconds = settings.seconds || 300;
      await fetch(`http://localhost:8080/api/deck/timer?action=${encodeURIComponent(timerAction)}&seconds=${seconds}`);
      showOk(context);
    } else if (action === "com.openstreamsuite.deck.explode") {
      const emoji = settings.emoji || "🎉";
      await fetch(`http://localhost:8080/api/deck/explode?emoji=${encodeURIComponent(emoji)}&count=40`);
      showOk(context);
    }
  } catch (e) {
    showAlert(context);
  }
}

// Giro de Knob / Dial (Encoders de Ajazz AKP05 y Stream Deck +)
async function executeDialRotate(action, settings, ticks, context) {
  try {
    if (action === "com.openstreamsuite.deck.dial.timer") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=timer&action=step&ticks=${ticks}`);
    } else if (action === "com.openstreamsuite.deck.dial.theme") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=theme&ticks=${ticks}`);
    } else if (action === "com.openstreamsuite.deck.dial.goal") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=goal&ticks=${ticks}`);
    } else if (action === "com.openstreamsuite.deck.dial.fx") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=fx&ticks=${ticks}`);
    }
  } catch (e) {
    showAlert(context);
  }
}

// Pulsación / Click de Knob
async function executeDialPress(action, settings, context) {
  try {
    if (action === "com.openstreamsuite.deck.dial.timer") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=timer&action=press`);
    } else if (action === "com.openstreamsuite.deck.dial.theme") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=theme&action=press`);
    } else if (action === "com.openstreamsuite.deck.dial.goal") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=goal&action=press`);
    } else if (action === "com.openstreamsuite.deck.dial.fx") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=fx&action=press`);
    }
    showOk(context);
  } catch (e) {
    showAlert(context);
  }
}

// Toque en la Pantalla Táctil (Touch Strip encima del dial)
async function executeTouchTap(action, settings, context) {
  try {
    if (action === "com.openstreamsuite.deck.dial.timer") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=timer&action=touch`);
    } else if (action === "com.openstreamsuite.deck.dial.theme") {
      await fetch(`http://localhost:8080/api/deck/theme?id=maker_electronico`);
    } else if (action === "com.openstreamsuite.deck.dial.goal") {
      await fetch(`http://localhost:8080/api/deck/knob?knob=goal&action=touch`);
    } else if (action === "com.openstreamsuite.deck.dial.fx") {
      await fetch(`http://localhost:8080/api/deck/explode?emoji=🎉&count=40`);
    }
    showOk(context);
  } catch (e) {
    showAlert(context);
  }
}

// Feedback bidireccional en LCDs y Touch Bar
function handleTallerEvent(msg) {
  if (msg.type === "timer_control") {
    activeContexts.forEach((info, ctx) => {
      if (info.action === "com.openstreamsuite.deck.timer" || info.action === "com.openstreamsuite.deck.dial.timer") {
        const mins = Math.floor((msg.seconds || 0) / 60);
        const secs = (msg.seconds || 0) % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        setTitle(ctx, `${(msg.action || "TIMER").toUpperCase()}\n${timeStr}`);
        setFeedback(ctx, { title: "CRONÓMETRO", value: timeStr, indicator: 50 });
      }
    });
  } else if (msg.type === "theme_change") {
    activeContexts.forEach((info, ctx) => {
      if (info.action === "com.openstreamsuite.deck.theme" || info.action === "com.openstreamsuite.deck.dial.theme") {
        setTitle(ctx, `✓ TEMA\n${msg.theme}`);
        setFeedback(ctx, { title: "TEMA ACTIVO", value: msg.theme, indicator: 100 });
      }
    });
  } else if (msg.type === "goal_update") {
    activeContexts.forEach((info, ctx) => {
      if (info.action === "com.openstreamsuite.deck.dial.goal") {
        const cur = msg.goal?.current || 0;
        const tgt = msg.goal?.target || 100;
        const pct = Math.min(100, Math.round((cur / (tgt || 1)) * 100));
        setTitle(ctx, `META\n${cur}/${tgt}`);
        setFeedback(ctx, { title: "META EN DIRECTO", value: `${cur}/${tgt}`, indicator: pct });
      }
    });
  }
}

// Utilidades Elgato / OpenDeck
function setTitle(context, title) {
  if (!websocket) return;
  websocket.send(JSON.stringify({
    event: "setTitle",
    context: context,
    payload: { title: title, target: 0 }
  }));
}

function setFeedback(context, payload) {
  if (!websocket) return;
  websocket.send(JSON.stringify({
    event: "setFeedback",
    context: context,
    payload: payload
  }));
}

function showOk(context) {
  if (!websocket) return;
  websocket.send(JSON.stringify({
    event: "showOk",
    context: context
  }));
}

function showAlert(context) {
  if (!websocket) return;
  websocket.send(JSON.stringify({
    event: "showAlert",
    context: context
  }));
}
