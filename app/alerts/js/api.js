// ====================================================================
// API CLIENT - OPEN STREAM SUITE OVERLAY SUITE (CON PROTECCIÓN LOCAL TOKEN)
// ====================================================================

function getAuthHeaders(extra = {}) {
  const headers = { ...extra };
  const token = window.__LOCAL_AUTH_TOKEN__ || (typeof localStorage !== 'undefined' ? localStorage.getItem('local_auth_token') : '') || '';
  if (token) {
    headers['X-Local-Token'] = token;
  }
  return headers;
}

const API = {
  // Comprobación de estado del streamer y servidor
  async getStatus() {
    const res = await fetch('/api/status');
    return res.json();
  },

  // Obtención/refresco del token local
  async fetchLocalToken() {
    try {
      const res = await fetch('/api/local-token');
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          window.__LOCAL_AUTH_TOKEN__ = data.token;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('local_auth_token', data.token);
          }
          return data.token;
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener token local:', e);
    }
    return '';
  },

  // Triggers y memes
  async getTriggers() {
    const res = await fetch('/api/triggers');
    return res.json();
  },

  async saveTriggers(triggers) {
    const res = await fetch('/api/triggers', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ triggers })
    });
    return res.json();
  },

  // Funciones del canal y roles
  async getRoles() {
    const res = await fetch('/api/roles');
    return res.json();
  },

  async saveRoles(roles) {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ roles })
    });
    return res.json();
  },

  async getTwitchModsAndVips() {
    const res = await fetch('/api/twitch/mods_and_vips');
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  // Recompensas de Twitch (Canal)
  async getRewards() {
    const res = await fetch('/api/twitch/rewards');
    return res.json();
  },

  async createReward(payload) {
    const res = await fetch('/api/twitch/rewards/create', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  async updateReward(payload) {
    const res = await fetch('/api/twitch/rewards/update', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  async deleteReward(id) {
    const res = await fetch('/api/twitch/rewards/delete', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  // Gestor de medios (Explorador Completo)
  async getMedia() {
    const res = await fetch('/api/media');
    return res.json();
  },

  async deleteMedia(relPath) {
    const res = await fetch('/api/media/delete', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ path: relPath })
    });
    return res.json();
  },

  async deleteMediaBatch(paths) {
    const res = await fetch('/api/media/delete', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ paths })
    });
    return res.json();
  },

  async uploadMedia(formData, queryStr = '') {
    const url = queryStr ? `/api/upload?${queryStr}` : '/api/upload';
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    return res.json();
  },

  async mkdirMedia(name, parent = '') {
    const res = await fetch('/api/media/mkdir', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, parent })
    });
    return res.json();
  },

  async renameMedia(path, newName) {
    const res = await fetch('/api/media/rename', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ path, new_name: newName })
    });
    return res.json();
  },

  async moveMedia(sources, targetFolder = '') {
    const res = await fetch('/api/media/move', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ sources, target_folder: targetFolder })
    });
    return res.json();
  },

  async copyMedia(sources, targetFolder = '') {
    const res = await fetch('/api/media/copy', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ sources, target_folder: targetFolder })
    });
    return res.json();
  },

  // Acciones y testing
  async testAlert(payload) {
    const res = await fetch('/api/test', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async explode(payload) {
    const res = await fetch('/api/explode', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async timer(payload) {
    const res = await fetch('/api/timer', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async shoutout(streamer) {
    const res = await fetch('/api/shoutout', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ streamer })
    });
    return res.json();
  },

  async theme(theme) {
    const res = await fetch('/api/theme', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ theme })
    });
    return res.json();
  },

  // API de Temas Modulares y Packs en Carpetas
  async getThemePacks() {
    const res = await fetch('/api/themes/packs');
    return res.json();
  },

  async createThemePack(payload) {
    const res = await fetch('/api/themes/packs/create', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async createTheme(payload) {
    const res = await fetch('/api/themes/create', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async saveTheme(payload) {
    const res = await fetch('/api/themes/save', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async applyThemePack(theme, pack = '') {
    const res = await fetch('/api/themes/apply', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ theme, pack })
    });
    return res.json();
  },

  async toggleChatAnchor(packId, themeId, anchored) {
    const res = await fetch('/api/themes/chat-anchor', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ packId, themeId, anchored })
    });
    return res.json();
  },

  async restoreTheme(packId, themeId) {
    const res = await fetch('/api/themes/restore', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ packId, themeId })
    });
    return res.json();
  },

  async setOverlayTheme(overlayKey, themeId) {
    const res = await fetch('/api/themes/overlay-assignment', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ overlayKey, themeId })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al asignar estilo`);
    return res.json();
  },

  // API de configuración y acciones de widgets (OpenDeck / StreamDeck compatible)
  async getWidgetsConfig() {
    const res = await fetch('/api/widgets/config');
    return res.json();
  },

  async saveWidgetsConfig(config) {
    const res = await fetch('/api/widgets/config', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ config })
    });
    return res.json();
  },

  async triggerWidgetAction(widget, action, params = {}) {
    const res = await fetch('/api/widgets/action', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ widget, action, params })
    });
    return res.json();
  },

  // API de Textos de Escenas y Overlays
  async getOverlayTexts() {
    const res = await fetch('/api/overlays/texts');
    return res.json();
  },

  async saveOverlayTexts(texts) {
    const res = await fetch('/api/overlays/texts', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ texts })
    });
    return res.json();
  }
};

// Iniciar carga del token si aún no existe en window
if (!window.__LOCAL_AUTH_TOKEN__) {
  API.fetchLocalToken();
}
