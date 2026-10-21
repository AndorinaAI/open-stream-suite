/**
 * app/alerts/js/overlay/04-ws-client.js
 * Conexión WebSocket al servidor local y despacho de eventos en tiempo real para OBS.
 */

function jsonParse(str) {
  try { return JSON.parse(str); } catch (e) { return null; }
}

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
        document.body.setAttribute('data-theme', data.theme);
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
