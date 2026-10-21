/**
 * alerts-studio.js — Estudio y Motor de Alertas en Directo (OBS Suite v2.0)
 * Incluye:
 *  - Diccionario y guía interactiva de variables dinámicas con descripción explícita de cada una.
 *  - Configuración de donaciones: modo unificado o personalizado por plataforma (Ko-fi, PayPal, BMC, Streamlabs),
 *    permitiendo para cada plataforma elegir Banner propio, Multimedia propio (vídeo/gif/audio) o heredar el global.
 *  - Sistema integral de temas: catálogo de presets, editor en vivo, opción de Guardar/Sustituir tema actual,
 *    Guardar como nuevo tema y Eliminar temas personalizados.
 *  - Sistema de animaciones completo (11 efectos de entrada) con reproductor en Vista Previa y prueba de sonido en vivo.
 */

const AlertsStudio = {
  config: null,
  themesConfig: null,
  mediaFiles: [],
  chatConfig: null,
  currentType: 'follow',
  currentDonationPlatform: 'kofi',
  selectedThemeId: 'cyberpunk',
  lastFocusedInput: 'cfg-title-template',
  previewLoopTimer: null,

  ALERT_TYPES: [
    { id: 'follow', name: 'Follower', icon: '❤️', badge: 'NUEVO SEGUIDOR', defaultEmoji: '❤️' },
    { id: 'sub_prime', name: 'Sub Prime Gaming', icon: '👑', badge: 'PRIME GAMING', defaultEmoji: '👑' },
    { id: 'sub_t1', name: 'Sub Tier 1', icon: '⭐', badge: 'SUB NIVEL 1', defaultEmoji: '⭐' },
    { id: 'sub_t2', name: 'Sub Tier 2', icon: '🌟', badge: 'SUB NIVEL 2', defaultEmoji: '🌟' },
    { id: 'sub_t3', name: 'Sub Tier 3', icon: '💫', badge: 'SUB NIVEL 3', defaultEmoji: '💫' },
    { id: 'resub', name: 'Resub (X meses)', icon: '🔄', badge: '{months} MESES', defaultEmoji: '🎉' },
    { id: 'sub_gift', name: 'Sub Regalada', icon: '🎁', badge: 'SUB DE REGALO', defaultEmoji: '🎁' },
    { id: 'sub_community_gift', name: 'Bomba de Subs', icon: '📦', badge: '{amount} SUBS', defaultEmoji: '🎁' },
    { id: 'cheer', name: 'Bits / Cheer', icon: '💎', badge: '{amount} BITS', defaultEmoji: '💎' },
    { id: 'raid', name: 'Raid Recibida', icon: '🚀', badge: 'RAID ({viewers})', defaultEmoji: '🚀' },
    { id: 'donation', name: 'Donaciones / Tips', icon: '💰', badge: '{amount}', defaultEmoji: '💰' }
  ],

  VARIABLES_INFO: [
    { token: '{user}', name: 'Usuario', desc: 'Nombre del seguidor, suscriptor, raider o donante.', sample: 'AndorinaDev' },
    { token: '{amount}', name: 'Cantidad / Importe', desc: 'Importe con divisa (ej. 5.00 EUR), bits enviados o número de subs regaladas.', sample: '10.00 EUR' },
    { token: '{currency}', name: 'Moneda / Divisa', desc: 'Símbolo o código de divisa en donaciones (EUR, USD, etc.).', sample: 'EUR' },
    { token: '{months}', name: 'Meses Acumulados', desc: 'Número total de meses de suscripción en resubs recurrentes.', sample: '6' },
    { token: '{tier}', name: 'Nivel / Tier', desc: 'Nivel de la suscripción (Tier 1, Tier 2, Tier 3 o Prime).', sample: 'Tier 1' },
    { token: '{viewers}', name: 'Espectadores Raid', desc: 'Cantidad de espectadores que se unen al canal en una raid.', sample: '35' },
    { token: '{bits}', name: 'Bits Exactos', desc: 'Cantidad numérica de bits en cheers de Twitch.', sample: '100' },
    { token: '{message}', name: 'Mensaje Escrito', desc: 'Comentario o mensaje que el usuario adjuntó a su donación o resub.', sample: '¡Gran directo!' },
    { token: '{platform}', name: 'Plataforma', desc: 'Nombre de la pasarela de pago (Ko-fi, PayPal, Buy Me a Coffee, Streamlabs).', sample: 'Ko-fi' },
    { token: '{recipient}', name: 'Destinatario', desc: 'Nombre del usuario afortunado que recibe una sub de regalo.', sample: 'AmigoViewer' },
    { token: '{count}', name: 'Contador de Regalos', desc: 'Número de suscripciones entregadas en regalos comunitarios.', sample: '5' }
  ],

  ANIMATIONS_LIST: [
    { id: 'pop', name: 'Pop Elástico (Recomendado)', desc: 'Aparición dinámica con efecto resorte' },
    { id: 'slide_down', name: 'Deslizar desde arriba', desc: 'Baja suavemente desde el borde superior' },
    { id: 'slide_up', name: 'Deslizar desde abajo', desc: 'Sube suavemente desde abajo' },
    { id: 'slide_left', name: 'Deslizar desde la izquierda', desc: 'Entrada lateral dinámica izquierda' },
    { id: 'slide_right', name: 'Deslizar desde la derecha', desc: 'Entrada lateral dinámica derecha' },
    { id: 'bounce', name: 'Rebote Enérgico', desc: 'Triple rebote con gran impacto visual' },
    { id: 'glitch', name: 'Glitch Digital Hacker', desc: 'Fallo digital con aberración cromática' },
    { id: 'rubber_band', name: 'Goma Elástica', desc: 'Estiramiento y compresión gelatinosa' },
    { id: 'neon_flicker', name: 'Parpadeo Tubo de Neón', desc: 'Tubo de gas neón encendiéndose con chispa' },
    { id: 'zoom_in', name: 'Zoom Explosivo', desc: 'Crecimiento rápido desde el centro' },
    { id: 'fade', name: 'Aparición Suave (Fade)', desc: 'Desvanecimiento cinematográfico sobrio' }
  ],

  BASE_STYLES: [
    { id: 'cyberpunk', name: 'Cyberpunk HUD' },
    { id: 'glassmorphism', name: 'Glassmorphism Frosted' },
    { id: 'neon', name: 'Neon Glow Pulsar' },
    { id: 'stream', name: 'Stream Industrial' },
    { id: 'retro', name: 'Retro Arcade 8-Bit' },
    { id: 'minimal', name: 'Minimal Clean' },
    { id: 'synthwave', name: 'Synthwave 80s Sunset' },
    { id: 'matrix', name: 'Matrix Terminal CRT' },
    { id: 'luxury', name: 'Gold Crown Luxury' }
  ],

  async init() {
    await Promise.all([
      this.loadConfig(),
      this.loadThemes(),
      this.loadMediaList(),
      this.loadChatConfig()
    ]);

    this.renderStudio();
    this.selectType(this.currentType);
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(document.getElementById('sec-alerts') || document);
    }
  },

  authHeaders(extra = {}) {
    if (typeof getAuthHeaders === 'function') {
      return getAuthHeaders(extra);
    }
    const token = window.__LOCAL_AUTH_TOKEN__ || (typeof localStorage !== 'undefined' ? localStorage.getItem('local_auth_token') : '') || '';
    const headers = { ...extra };
    if (token) headers['X-Local-Token'] = token;
    return headers;
  },

  async loadConfig() {
    try {
      const res = await fetch('/api/alerts/config');
      const data = await res.json();
      if (data.status === 'ok') {
        this.config = data.config || { alerts: data.alerts || {} };
        if (!this.config.alerts) this.config.alerts = data.alerts || {};
      }
    } catch (e) {
      console.error('Error cargando alerts_config:', e);
    }
  },

  async loadThemes() {
    try {
      const res = await fetch('/api/alerts/themes');
      const data = await res.json();
      if (data.status === 'ok') {
        this.themesConfig = data.themesConfig || { activeTheme: 'cyberpunk', themes: {} };
        this.selectedThemeId = this.themesConfig.activeTheme || 'cyberpunk';
      }
    } catch (e) {
      console.warn('Error cargando temas de alertas:', e);
      this.themesConfig = { activeTheme: 'cyberpunk', themes: {} };
    }
  },

  async loadMediaList() {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      this.mediaFiles = data.files || [];
    } catch (e) {
      this.mediaFiles = [];
    }
  },

  async loadChatConfig() {
    try {
      const res = await fetch('/widgets/chat/config.json');
      if (res.ok) this.chatConfig = await res.json();
    } catch (e) {
      this.chatConfig = null;
    }
  }
};

window.AlertsStudio = AlertsStudio;
