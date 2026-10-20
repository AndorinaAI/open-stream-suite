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

  if (secId === 'sec-alerts') {
    if (window.AlertsStudio) AlertsStudio.init();
  }
  if (secId === 'sec-triggers') {
    loadTriggers();
    loadTwitchRewards();
    loadRoles();
  }
  if (secId === 'sec-themes') {
    if (typeof switchThemesMainTab === 'function') switchThemesMainTab('overlays');
    if (typeof showOverlayFoldersView === 'function') showOverlayFoldersView();
    loadThemePacks();
  }
  if (secId === 'sec-widgets') {
    // Cargar config la primera vez (o si falló antes)
    if (typeof cachedWidgetsConfig === 'undefined' || !cachedWidgetsConfig) {
      if (typeof loadWidgetsConfig === 'function') loadWidgetsConfig();
    } else {
      if (typeof renderWidgetsGrid === 'function') renderWidgetsGrid();
    }
  }

  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    setTimeout(() => window.i18n.applyTranslations(sec || document), 60);
  }
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

// Comprobación de actualizaciones en segundo plano
async function checkUpdates() {
  try {
    const res = await fetch('/api/updates/check?branch=main');
    if (!res.ok) return;
    const data = await res.json();
    if (data.update_available) {
      const badge = document.getElementById('panel-update-badge');
      const title = document.getElementById('panel-update-title');
      const link = document.getElementById('panel-update-link');
      if (badge) {
        badge.style.display = 'block';
        if (title) title.textContent = `🚀 NUEVA VERSIÓN v${data.remote_version}`;
        if (link && data.release_url) link.href = data.release_url;
      }
    }
  } catch (e) {
    // Modo offline o sin internet
  }
}

// Arranque de la aplicación
window.addEventListener('DOMContentLoaded', () => {
  initObsWidgetUrls();
  checkStatus();
  checkUpdates();
  loadTwitchRewards();
  loadTriggers();
  loadRoles();
  loadMedia();
  initStagePositioner();
  initMediaDropzone();
  if (window.OverlayTexts) OverlayTexts.init();

  // Soporte de navegación por hash (ej: #sec-themes o #themes)
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const target = hash.startsWith('sec-') ? hash : `sec-${hash}`;
    if (document.getElementById(target)) showSection(target);
  }

  // Polling de estado cada 6 segundos
  setInterval(checkStatus, 6000);
});

