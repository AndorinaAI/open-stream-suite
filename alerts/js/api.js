// ====================================================================
// API CLIENT - TALLER LIVE OVERLAY SUITE (CON PROTECCIÓN LOCAL TOKEN)
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

  // Gestor de medios
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

  async uploadMedia(formData) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
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
  }
};

// Iniciar carga del token si aún no existe en window
if (!window.__LOCAL_AUTH_TOKEN__) {
  API.fetchLocalToken();
}
