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
function updateSidebarSceneCount() {
  const el = document.getElementById('sidebar-obs-active');
  if (!el) return;
  const count = Array.isArray(window.OSS_SCENES) ? window.OSS_SCENES.length : 27;
  const lang = (document.documentElement.lang || 'es').toLowerCase();
  el.textContent = lang.startsWith('en')
    ? `OBS STUDIO · ${count} ACTIVE SCENES`
    : `OBS STUDIO · ${count} ESCENAS ACTIVAS`;
}

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
function copyText(str, label) {
  const name = label || 'URL';
  navigator.clipboard.writeText(str).then(() => {
    // Antes: alert() bloqueante. Ahora un toast; nunca interrumpe el directo.
    if (window.UI && UI.showToast) UI.showToast(`✓ ${name} copiada. Pégala en OBS como fuente de tipo Navegador.`, 'success');
  }).catch(() => {
    if (window.UI && UI.showToast) UI.showToast(`No se pudo copiar ${name}. Cópiala a mano: ${str}`, 'error');
  });
}

// Comprobación de actualizaciones en segundo plano (al abrir y cada 6 h)
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function checkUpdates() {
  try {
    const res = await fetch('/api/updates/check?branch=main');
    if (!res.ok) return;
    const data = await res.json();
    const badge = document.getElementById('panel-update-badge');
    if (!badge) return;
    if (!data.update_available) { badge.style.display = 'none'; return; }

    const tag = data.remote_version || String(data.commits_behind || '');
    // Si el usuario ya descartó este aviso concreto, no volver a mostrarlo
    if (localStorage.getItem('oss-update-dismissed') === tag) return;

    const title = document.getElementById('panel-update-title');
    const current = document.getElementById('panel-update-current');
    const link = document.getElementById('panel-update-link');
    const ver = data.remote_version && data.remote_version !== data.current_version
      ? ` v${data.remote_version}` : '';
    const T = (k, fb, p) => (window.i18n && window.i18n.tr(k, p)) || fb;
    if (title) title.textContent = `${T('updates.new_version', '🚀 NUEVA VERSIÓN')}${ver}`;
    if (current) current.textContent = T('updates.your_version', 'Tu versión: v{version}', { version: data.current_version });
    if (link && data.release_url) link.href = data.release_url;
    badge.dataset.tag = tag;
    badge.style.display = 'block';
  } catch (e) {
    // Modo offline o sin internet
  }
}

function dismissUpdateBadge() {
  const badge = document.getElementById('panel-update-badge');
  if (!badge) return;
  localStorage.setItem('oss-update-dismissed', badge.dataset.tag || '');
  badge.style.display = 'none';
}

setInterval(checkUpdates, UPDATE_CHECK_INTERVAL_MS);
window.addEventListener('oss-lang-change', checkUpdates);

// Arranque de la aplicación
window.addEventListener('DOMContentLoaded', () => {
  initObsWidgetUrls();
  updateSidebarSceneCount();
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

  // Escuchar cambio de idioma para re-renderizar componentes dinámicos
  window.addEventListener('oss-lang-change', () => {
    if (typeof renderOverlayFolders === 'function') {
      try { renderOverlayFolders(); } catch (_) {}
    }
    if (typeof renderWidgetsGrid === 'function') {
      try { renderWidgetsGrid(); } catch (_) {}
    }
    if (typeof renderRoles === 'function') {
      try { renderRoles(); } catch (_) {}
    }
    if (typeof populatePermissionRolesSelect === 'function') {
      try { populatePermissionRolesSelect(); } catch (_) {}
    }
    if (typeof renderMediaExplorer === 'function') {
      try { renderMediaExplorer(); } catch (_) {}
    }
    if (typeof renderTriggers === 'function') {
      try { renderTriggers(); } catch (_) {}
    }
    if (window.AlertsStudio && typeof AlertsStudio.renderStudio === 'function') {
      try { AlertsStudio.renderStudio(); } catch (_) {}
    }
    if (typeof currentMiniAppWidget !== 'undefined' && currentMiniAppWidget && typeof renderMiniAppControls === 'function') {
      try { renderMiniAppControls(); } catch (_) {}
    }
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(document);
    }
    updateSidebarSceneCount();
  });
});

