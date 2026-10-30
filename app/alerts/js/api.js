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

  async setOverlayTheme(overlayKey, themeId, shapeId = null) {
    const payload = { overlayKey };
    if (themeId) payload.themeId = themeId;
    if (shapeId) payload.shapeId = shapeId;
    const res = await fetch('/api/themes/overlay-assignment', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al asignar estilo`);
    return res.json();
  },

  // Asignación en lote: mismo trabajo que N llamadas a setOverlayTheme, pero en
  // UNA petición (una fusión con varias escenas generaba decenas de POST).
  async setOverlayThemeBulk(entries) {
    const assignments = (entries || []).map(({ overlayKey, themeId, shapeId }) => {
      const item = { overlayKey };
      if (themeId) item.themeId = themeId;
      if (shapeId !== undefined && shapeId !== null) item.shapeId = shapeId;
      return item;
    }).filter(a => a.overlayKey && (a.themeId || a.shapeId !== undefined));
    if (!assignments.length) return { status: 'ok', applied: [], failed: [] };
    const res = await fetch('/api/themes/overlay-assignment/bulk', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ assignments })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al asignar estilos en lote`);
    return res.json();
  },

  async applyShapeGlobal(shape) {
    const res = await fetch('/api/themes/apply-shape', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ shape })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al aplicar forma global`);
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
  },

  // API de Fusiones (Fusions) de Overlays
  async getFusions() {
    const res = await fetch('/api/fusions');
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar fusiones`);
    return res.json();
  },

  async getFusion(id) {
    const res = await fetch(`/api/fusions/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} al obtener fusión`);
    return res.json();
  },

  async saveFusion(fusionData) {
    const res = await fetch('/api/fusions', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(fusionData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} al guardar fusión`);
    return data;
  },

  async deleteFusion(id) {
    const res = await fetch(`/api/fusions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al eliminar fusión`);
    return res.json();
  },

  // applyFusionTheme / applyFusionShape propagan el mensaje de error REAL del
  // servidor (`{error: "Tema desconocido: x"}`). Antes se lanzaba un genérico
  // "HTTP 404" y el panel no podía explicar por qué no se había aplicado nada.
  async applyFusionTheme(id, themeId) {
    const res = await fetch(`/api/fusions/${encodeURIComponent(id)}/apply-theme`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ themeId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} al aplicar tema a la fusión`);
    return data;
  },

  // Vista previa del CSS REAL de un tema (lo genera el backend desde los
  // tokens). El editor deja de inventarse el CSS con literales.
  async previewTheme(meta) {
    const res = await fetch('/api/themes/preview', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(meta || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} al previsualizar el tema`);
    return data;
  },

  // Exporta la fusión como pack propio (tema + forma + escenas). El pack
  // aparece solo en el catálogo y en los menús: no hay listas que tocar.
  async exportFusionPack(id) {
    const res = await fetch(`/api/fusions/${encodeURIComponent(id)}/export-pack`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} al exportar la fusión`);
    return data;
  },

  async applyFusionShape(id, shapeId) {
    const res = await fetch(`/api/fusions/${encodeURIComponent(id)}/apply-shape`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ shapeId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} al aplicar forma a la fusión`);
    return data;
  },

  async resetFusion(id) {
    const res = await fetch(`/api/fusions/${encodeURIComponent(id)}/reset`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: '{}'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} al restaurar la fusión`);
    return data;
  },

  async getComponentsCatalog() {
    const res = await fetch('/api/components/catalog');
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar el catálogo de componentes`);
    return res.json();
  },

  async assignComponent(overlayKey, payload) {
    const res = await fetch('/api/themes/overlay-assignment', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ overlayKey, ...payload })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} al asignar`);
    return data;
  },

  async resetComponent(overlayKey) {
    const res = await fetch('/api/themes/reset-assignment', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ overlayKey })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status} al restaurar`);
    return data;
  }
};

// Iniciar carga del token si aún no existe en window
if (!window.__LOCAL_AUTH_TOKEN__) {
  API.fetchLocalToken();
}

// ====================================================================
// FUNCIONES GLOBALES DE ACCIÓN RÁPIDA PARA EL PANEL (SIMULADOR & METAS)
// ====================================================================
window.sendAlertTest = async function(type) {
  const defaultExtras = {
    follow: { user: 'AndorinaDev', message: '¡Gracias por seguir el canal!' },
    sub: { user: 'AndorinaDev', tier: '1000', months: 1, message: '¡Suscripción de nivel 1!' },
    bits: { user: 'AndorinaDev', bits: 100, message: '¡100 bits para el stream!' },
    raid: { user: 'StreamerAmigo', viewers: 25, message: '¡Raid con 25 espectadores!' }
  };
  const extra = defaultExtras[type] || { user: 'AndorinaDev' };
  try {
    const res = await fetch('/api/alerts/test', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        alertType: type,
        ...extra
      })
    });
    const d = await res.json();
    if (d.status === 'ok') {
      const msg = `🚀 Alerta de prueba [${type.toUpperCase()}] emitida a OBS`;
      if (window.OverlayTexts && OverlayTexts.showToast) OverlayTexts.showToast(msg, 'success');
      else if (window.AlertsStudio && AlertsStudio.showToast) AlertsStudio.showToast(msg);
    }
  } catch (e) {
    console.error('Error enviando alerta de prueba:', e);
  }
};

window.sendCustomAlertTest = async function() {
  const user = document.getElementById('sim-user-input')?.value?.trim() || 'AndorinaDev';
  const msg = document.getElementById('sim-msg-input')?.value?.trim() || '¡Un saludo!';
  try {
    const res = await fetch('/api/alerts/test', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        alertType: 'custom',
        user: user,
        message: msg
      })
    });
    const d = await res.json();
    if (d.status === 'ok') {
      const toastMsg = `🚀 Alerta personalizada enviada para ${user}`;
      if (window.OverlayTexts && OverlayTexts.showToast) OverlayTexts.showToast(toastMsg, 'success');
      else if (window.AlertsStudio && AlertsStudio.showToast) AlertsStudio.showToast(toastMsg);
    }
  } catch (e) {
    console.error('Error enviando alerta personalizada:', e);
  }
};

window.syncGoalWithTwitch = async function() {
  try {
    const res = await fetch('/api/twitch/channel');
    if (res.ok) {
      if (window.OverlayTexts && OverlayTexts.showToast) {
        OverlayTexts.showToast('✓ Metas sincronizadas con datos de Twitch', 'success');
      }
    } else {
      if (window.OverlayTexts && OverlayTexts.showToast) {
        OverlayTexts.showToast('ℹ️ Conecta Twitch en Ajustes para sincronizar metas automáticamente', 'info');
      }
    }
  } catch (e) {
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast('ℹ️ Conecta Twitch en Ajustes para sincronizar metas automáticamente', 'info');
    }
  }
};
