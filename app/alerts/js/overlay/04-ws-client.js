/**
 * app/alerts/js/overlay/04-ws-client.js
 * Conexión WebSocket al servidor local y despacho de eventos en tiempo real para OBS.
 */

/**
 * Tema nativo de packs (OSS): ?theme=<id> aplica el tema al overlay de alertas.
 * El WebSocket (theme_change) lo actualiza en vivo.
 */
(function () {
  try {
    var t = new URLSearchParams(window.location.search).get('theme');
    if (t) document.body.setAttribute('data-theme', t);
  } catch (e) {}
})();

function jsonParse(str) {
  try { return JSON.parse(str); } catch (e) { return null; }
}

// Asignación de fábrica/fusión para las alertas de panel (themes_state.json -> config.js)
(function () {
  try {
    var cfg = window.OSS_CONFIG || {};
    // Formas: genéricas (OSSShape) o físicas de pack (body[data-theme-shape])
    var shapes = cfg.overlayShapes || {};
    if (window.AlertShapes) {
      AlertShapes.configure(cfg);
      AlertShapes.set('card', shapes['alert:card']);
      AlertShapes.set('banner', shapes['alert:banner']);
      // El tipo que se muestre aplicará su propio tema/forma en la cola.
      AlertShapes.applyAll('card');
    } else {
      [['alert:card', 'alert-card'], ['alert:banner', 'banner-alert-root']].forEach(function (pair) {
        var el = document.getElementById(pair[1]);
        if (el && window.OSSShape) window.OSSShape.apply(el, shapes[pair[0]] || null);
      });
    }
  } catch (e) {}
})();

function connectWS() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    const ind = document.getElementById('ws-indicator');
    if (ind) {
      ind.style.opacity = '1';
      setTimeout(() => ind.style.opacity = '0', 2500);
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = jsonParse(event.data);
      if (!data || data.type === 'system_status') return;

      if (data.type === 'theme_change' && data.theme) {
        if (window.AlertShapes) AlertShapes.setGlobalTheme(data.theme);
        // El tema global sólo aplica si el tipo visible no tiene tema explícito.
        var visible = window.AlertShapes ? AlertShapes.visibleType() : null;
        if (!window.AlertShapes || !visible || !AlertShapes.isExplicit(visible)) {
          document.body.setAttribute('data-theme', data.theme);
        }
        return;
      }

      if (data.type === 'alert_theme_change') {
        var shapeType = data.id === 'banner' ? 'banner' : 'card';
        if (window.AlertShapes) {
          AlertShapes.setTheme(shapeType, data.theme, data.explicit);
          AlertShapes.set(shapeType, data.shape);
          var visibleNow = AlertShapes.visibleType();
          if (!visibleNow || visibleNow === shapeType) {
            AlertShapes.applyAll(shapeType);
          } else {
            AlertShapes.apply(shapeType, data.shape);
          }
        } else if (window.OSSShape) {
          var targetId = data.id === 'banner' ? 'banner-alert-root' : 'alert-card';
          var el = document.getElementById(targetId);
          if (data.shape) window.OSSShape.apply(el, data.shape);
          else window.OSSShape.clear(el);
        }
        return;
      }

      if (data.type === 'explode_emotes') {
        if (window.ParticleEngine) {
          window.ParticleEngine.explode(data.emoji || '🎉', data.count || 45);
        }
        return;
      }

      if (data.type === 'sound' && data.sound_url) {
        const snd = new Audio(data.sound_url);
        snd.volume = typeof data.volume === 'number' ? data.volume : 0.8;
        snd.play().catch(() => {});
        return;
      }

      if (window.AlertQueue) {
        window.AlertQueue.push(data);
      }
    } catch (e) {
      console.warn('Error procesando evento WS de alerta:', e);
    }
  };

  ws.onclose = () => {
    setTimeout(connectWS, 2500);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.location.search.includes('preview=true') || typeof window.obsstudio === 'undefined') {
    document.documentElement.classList.add('preview-mode');
    document.body.classList.add('preview-mode');
  }
  connectWS();
});
