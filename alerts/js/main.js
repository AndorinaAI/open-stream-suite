// ====================================================================
// INICIALIZACIÓN, NAVEGACIÓN Y ESTADO DEL PANEL DE CONTROL
// ====================================================================

const origin = window.location.origin;

function initObsWidgetUrls() {
  const setUrl = (id, path) => {
    const el = document.getElementById(id);
    if (el) el.textContent = `${origin}${path}`;
  };

  setUrl('widget-url-chat', '/widgets/chat/index.html');
  setUrl('widget-url-timer', '/widgets/timer/index.html');
  setUrl('widget-url-so', '/widgets/shoutout/index.html');
  setUrl('widget-url-goal', '/widgets/goal/index.html');
  setUrl('widget-url-ticker', '/widgets/ticker/index.html');
  setUrl('widget-url-alerts', '/alerts/index.html');
  setUrl('alerts-source-code', '/alerts/index.html');
}

// Navegación de secciones (tabs)
function showSection(secId) {
  document.querySelectorAll('.section-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const sec = document.getElementById(secId);
  if (sec) sec.classList.add('active');

  const btn = Array.from(document.querySelectorAll('.nav-item')).find(b => b.getAttribute('onclick')?.includes(secId));
  if (btn) btn.classList.add('active');

  if (secId === 'sec-monitor') resizeMonitor();
  if (secId === 'sec-triggers') {
    loadTriggers();
    loadTwitchRewards();
    loadRoles();
  }
  if (secId === 'sec-media') loadMedia();
}

// Estado del streamer y conexión Twitch
async function checkStatus() {
  try {
    const data = await API.getStatus();
    if (data.twitch_connected && data.user) {
      const userEl = document.getElementById('user-name');
      const statusEl = document.getElementById('user-status');
      const avatarEl = document.getElementById('user-avatar');

      if (userEl) userEl.textContent = data.user.display_name;
      if (statusEl) statusEl.textContent = `🟢 ${data.user.broadcaster_type ? data.user.broadcaster_type.toUpperCase() : 'CONECTADO'}`;
      if (avatarEl && data.user.profile_image_url) {
        avatarEl.src = data.user.profile_image_url;
      }
    }
  } catch (e) {
    // Servidor reconectando o sin respuesta momentánea
  }
}

// Copiar texto al portapapeles
function copyText(str) {
  navigator.clipboard.writeText(str).then(() => {
    alert('Copiado al portapapeles:\n' + str + '\n\nPégala en OBS Studio como fuente de tipo Navegador.');
  });
}

// Arranque de la aplicación
window.addEventListener('DOMContentLoaded', () => {
  initObsWidgetUrls();
  checkStatus();
  loadTwitchRewards();
  loadTriggers();
  loadRoles();
  loadMedia();
  initStagePositioner();
  initMediaDropzone();

  window.addEventListener('resize', resizeMonitor);
  setTimeout(resizeMonitor, 100);

  // Polling de estado cada 6 segundos
  setInterval(checkStatus, 6000);
});
