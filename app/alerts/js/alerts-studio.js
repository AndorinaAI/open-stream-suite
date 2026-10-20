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
    { token: '{user}', name: 'Usuario', desc: 'Nombre del seguidor, suscriptor, raider o donante.', sample: 'AndorinaMaker' },
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
  },

  renderStudio() {
    const container = document.getElementById('sec-alerts');
    if (!container) return;

    container.innerHTML = `
      <div class="section-header" style="margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
          <div>
            <h1 class="section-title" style="display: flex; align-items: center; gap: 10px;">
              <span>🚨</span> ESTUDIO DE ALERTAS EN DIRECTO
              <span class="badge-pill" style="font-size: 11px; background: rgba(87, 214, 196, 0.2); color: #57D6C4; border: 1px solid #57D6C4;">OBS v2.0 // MOTOR DE TEMAS Y ANIMACIÓN</span>
            </h1>
            <div class="section-subtitle">
              Personaliza el banner, vídeo o gif por plataforma de donación, edita o sustituye temas de diseño y reproduce animaciones en vivo en la previsualización.
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-action-primary" onclick="AlertsStudio.saveConfig()" style="display: flex; align-items: center; gap: 6px;">
              💾 Guardar Configuración
            </button>
            <button class="btn-action-test" onclick="AlertsStudio.triggerCurrentTest()" style="border-color: #57D6C4; color: #57D6C4; display: flex; align-items: center; gap: 6px;">
              🚀 Disparar en OBS
            </button>
            <button class="btn-action-copy" onclick="copyText('http://localhost:8080/alerts/index.html')">
              📋 Copiar URL para OBS
            </button>
          </div>
        </div>
      </div>

      <!-- Selector de Tipo de Alerta (Tabs Horizontales) -->
      <div id="alerts-type-tabs" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 16px; scrollbar-width: thin;">
        ${this.ALERT_TYPES.map(t => `
          <button type="button" 
            id="tab-alert-${t.id}" 
            class="btn-stage-preset" 
            style="display: flex; align-items: center; gap: 6px; white-space: nowrap; padding: 8px 14px; font-size: 12px; border-radius: 6px; transition: all 0.2s ease;"
            onclick="AlertsStudio.selectType('${t.id}')">
            <span>${t.icon}</span>
            <span>${t.name}</span>
          </button>
        `).join('')}
      </div>

      <!-- Grid Principal: Configuración a la izquierda, Vista Previa Interactiva y Simulador a la derecha -->
      <div class="grid-2col" style="grid-template-columns: 1.25fr 0.95fr; gap: 20px;">
        
        <!-- COLUMNA IZQUIERDA: CONFIGURACIÓN DINÁMICA -->
        <div class="dash-card" style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Encabezado del tipo activo y switch de activación -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border-dim); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span id="cfg-active-icon" style="font-size: 26px;">❤️</span>
              <div>
                <div id="cfg-active-title" style="font-family: var(--font-tech); font-weight: 800; font-size: 16px; color: var(--color-text-light);">
                  CONFIGURACIÓN DE ALERTA
                </div>
                <div id="cfg-active-desc" style="font-size: 11px; color: var(--color-text-dim);">
                  Modifica los textos, aspecto visual, temas, archivos multimedia y capas de audio.
                </div>
              </div>
            </div>
            
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 20px; border: 1px solid var(--color-border-dim);">
              <input type="checkbox" id="cfg-enabled" onchange="AlertsStudio.onFieldChange('enabled', this.checked)">
              <span style="font-family: var(--font-tech); font-size: 11px; font-weight: 700; color: #10B981;">HABILITADA</span>
            </label>
          </div>

          <!-- Selector de Modo de Renderizado General: Banner Procedural vs Multimedia Propio -->
          <div>
            <label style="font-size: 11px; font-family: var(--font-tech); color: var(--color-text-dim); text-transform: uppercase; margin-bottom: 8px; display: block;">
              MODO DE VISUALIZACIÓN PRINCIPAL:
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <button type="button" id="btn-mode-banner" class="btn-stage-preset" style="padding: 10px; text-align: left; display: flex; flex-direction: column; gap: 3px;" onclick="AlertsStudio.setMediaMode('banner')">
                <span style="font-weight: 800; font-size: 13px; color: #57D6C4;">🎨 Creador por Banner</span>
                <span style="font-size: 10px; color: var(--color-text-dim); line-height: 1.3;">Estilos procedurales, temas visuales, rápido y ligero.</span>
              </button>
              <button type="button" id="btn-mode-media" class="btn-stage-preset" style="padding: 10px; text-align: left; display: flex; flex-direction: column; gap: 3px;" onclick="AlertsStudio.setMediaMode('media')">
                <span style="font-weight: 800; font-size: 13px; color: #F59E0B;">🎬 Multimedia Propio</span>
                <span style="font-size: 10px; color: var(--color-text-dim); line-height: 1.3;">Vídeos WebM/MP4, GIFs, imágenes con audio nativo o superpuesto.</span>
              </button>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- SECCIÓN: SISTEMA Y MOTOR DE TEMAS DE ALERTAS                   -->
          <!-- ============================================================== -->
          <div id="panel-banner-options" style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <span style="font-family: var(--font-tech); font-size: 12px; font-weight: 800; color: #57D6C4;">
                  🎭 SISTEMA Y BIBLIOTECA DE TEMAS
                </span>
                <div style="font-size: 10px; color: var(--color-text-dim); margin-top: 2px;">
                  Elige un tema, edita sus valores o guárdalo sustituyendo el actual o como uno nuevo.
                </div>
              </div>
              
              <div style="display: flex; gap: 6px; align-items: center;">
                <button type="button" class="btn-action-test" style="padding: 4px 10px; font-size: 10px; border-color: #A855F7; color: #D8B4FE;" onclick="AlertsStudio.applyThemeToAll()" title="Aplica este tema a TODAS las alertas de tu canal">
                  🌐 Aplicar a TODAS
                </button>
                <button type="button" class="btn-action-test" id="btn-chat-link" style="padding: 4px 10px; font-size: 10px;" onclick="AlertsStudio.toggleChatLink()">
                  🔗 Linkear con Chat
                </button>
              </div>
            </div>

            <!-- Galería de Temas con Previews Visuales -->
            <div id="themes-preset-gallery" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px;">
              <!-- Inyectado por renderThemesGallery() -->
            </div>

            <!-- EDITOR COMPLETO DEL TEMA: EDICIÓN, SUSTITUCIÓN Y NUEVOS TEMAS -->
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(87, 214, 196, 0.3); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 11px; font-weight: 800; color: #57D6C4;">🛠️ EDITOR DEL TEMA:</span>
                  <span id="lbl-editing-theme-name" class="badge-pill" style="font-size: 10px; background: rgba(87, 214, 196, 0.15); border: 1px solid #57D6C4; color: #57D6C4;">Cyberpunk HUD</span>
                </div>
                
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn-action-primary" style="padding: 4px 10px; font-size: 10px; background: #059669; border-color: #10B981;" onclick="AlertsStudio.saveCurrentThemeOverwrite()" title="Sustituye y guarda los cambios en el tema actual">
                    💾 Guardar y Sustituir Tema
                  </button>
                  <button type="button" class="btn-action-primary" style="padding: 4px 10px; font-size: 10px;" onclick="AlertsStudio.saveThemeAsNew()" title="Crea un tema nuevo con estos ajustes">
                    ➕ Guardar como Nuevo
                  </button>
                  <button type="button" id="btn-delete-theme" class="btn-action-test" style="padding: 4px 8px; font-size: 10px; border-color: #EF4444; color: #FCA5A5; display: none;" onclick="AlertsStudio.deleteCurrentTheme()" title="Elimina este tema personalizado">
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Campos de Personalización del Tema -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 10px;">Nombre del Tema:</label>
                  <input type="text" id="cfg-theme-name" class="form-input" style="font-size: 11px;" value="Cyberpunk HUD" oninput="AlertsStudio.onThemeNameChange(this.value)">
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 10px;">Estilo Base Visual:</label>
                  <select id="cfg-theme-style" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onThemeStyleChange(this.value)">
                    ${this.BASE_STYLES.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                  </select>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 10px;">Color Borde / Acento:</label>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <input type="color" id="cfg-banner-border-color" style="height: 30px; width: 34px; border: 1px solid var(--color-border-dim); background: transparent; cursor: pointer; border-radius: 4px;" oninput="AlertsStudio.onFieldChange('bannerBorderColor', this.value)">
                    <input type="text" id="cfg-banner-border-hex" class="form-input" style="font-family: monospace; font-size: 10px; text-transform: uppercase;" oninput="AlertsStudio.onFieldChange('bannerBorderColor', this.value)">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 10px;">Color Texto Principal:</label>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <input type="color" id="cfg-banner-text-color" style="height: 30px; width: 34px; border: 1px solid var(--color-border-dim); background: transparent; cursor: pointer; border-radius: 4px;" oninput="AlertsStudio.onFieldChange('bannerTextColor', this.value)">
                    <input type="text" id="cfg-banner-text-hex" class="form-input" style="font-family: monospace; font-size: 10px; text-transform: uppercase;" oninput="AlertsStudio.onFieldChange('bannerTextColor', this.value)">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 10px;">Tipografía:</label>
                  <select id="cfg-banner-font" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onFieldChange('bannerFontFamily', this.value)">
                    <option value="var(--font-tech), monospace">Tech Monospace</option>
                    <option value="var(--font-primary), sans-serif">Sans Moderna</option>
                    <option value="monospace">Arcade Monospace</option>
                    <option value="Impact, sans-serif">Impact / Bold</option>
                  </select>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 10px;">Animación de Entrada:</label>
                  <select id="cfg-banner-anim" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onAnimationChange(this.value)">
                    ${this.ANIMATIONS_LIST.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: MULTIMEDIA PERSONALIZADO -->
          <div id="panel-media-options" style="display: none; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 16px; flex-direction: column; gap: 14px;">
            <div style="font-family: var(--font-tech); font-size: 12px; font-weight: 800; color: #F59E0B;">
              🎬 ARCHIVO MULTIMEDIA Y POSICIÓN
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Archivo de Vídeo o GIF (alerts/media):</label>
                <select id="cfg-media-url" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onMediaSelect(this.value)">
                  <option value="">-- Seleccionar medio --</option>
                  ${this.mediaFiles.map(m => `<option value="${m.url}">[${m.type.toUpperCase()}] ${m.name}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Tamaño en Pantalla:</label>
                <select id="cfg-media-size" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onFieldChange('mediaSize', this.value)">
                  <option value="small">Pequeño (360x270)</option>
                  <option value="medium">Mediano (580x440)</option>
                  <option value="large">Grande (960x720)</option>
                  <option value="fullscreen">Pantalla Completa (1920x1080)</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Posición en Pantalla:</label>
                <select id="cfg-position" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onFieldChange('position', this.value)">
                  <option value="center">Centro</option>
                  <option value="top-left">Arriba Izquierda</option>
                  <option value="top-right">Arriba Derecha</option>
                  <option value="bottom-left">Abajo Izquierda</option>
                  <option value="bottom-right">Abajo Derecha</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Rótulo de Texto Superpuesto:</label>
                <select id="cfg-caption-pos" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onFieldChange('captionPosition', this.value)">
                  <option value="below">Debajo del medio</option>
                  <option value="above">Encima del medio</option>
                  <option value="inside">En el centro</option>
                  <option value="bottom_screen">Abajo de la pantalla</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- SECCIÓN: DONACIONES PERSONALIZADAS POR PLATAFORMA              -->
          <!-- ============================================================== -->
          <div id="panel-donation-platforms" style="display: none; background: rgba(0,0,0,0.25); border: 1px solid #10B981; border-radius: 8px; padding: 16px; flex-direction: column; gap: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <div style="font-family: var(--font-tech); font-size: 12px; font-weight: 800; color: #10B981; display: flex; align-items: center; gap: 6px;">
                  <span>💰</span> PERSONALIZACIÓN POR PLATAFORMA DE DONACIÓN
                </div>
                <div style="font-size: 10px; color: var(--color-text-dim); margin-top: 2px;">
                  Personaliza qué aparece en pantalla (banner exclusivo o vídeo/gif propio y textos) para cada pasarela.
                </div>
              </div>
              
              <!-- Switch de modo unificado vs por plataforma -->
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; padding: 4px 10px; border-radius: 14px;">
                <input type="checkbox" id="cfg-donation-per-platform" onchange="AlertsStudio.toggleDonationPerPlatform(this.checked)">
                <span style="font-weight: 700; color: #A7F3D0;">Activar personalización por plataforma</span>
              </label>
            </div>

            <div id="donation-platforms-container" style="display: none; flex-direction: column; gap: 12px;">
              <!-- Sub-tabs de plataformas -->
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="btn-stage-preset" id="subtab-plat-kofi" onclick="AlertsStudio.selectDonationPlatform('kofi')">☕ Ko-fi</button>
                <button type="button" class="btn-stage-preset" id="subtab-plat-paypal" onclick="AlertsStudio.selectDonationPlatform('paypal')">🅿️ PayPal</button>
                <button type="button" class="btn-stage-preset" id="subtab-plat-buymeacoffee" onclick="AlertsStudio.selectDonationPlatform('buymeacoffee')">🟡 Buy Me a Coffee</button>
                <button type="button" class="btn-stage-preset" id="subtab-plat-streamlabs" onclick="AlertsStudio.selectDonationPlatform('streamlabs')">⚡ Streamlabs</button>
              </div>

              <!-- Formulario específico de la plataforma seleccionada -->
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
                  <span style="font-size: 12px; font-weight: 800; color: #57D6C4;" id="lbl-active-plat-title">Configuración para: Ko-fi</span>
                  <span class="badge-pill" id="lbl-active-plat-badge-pill" style="font-size: 9px; background: rgba(0,0,0,0.4);">MODO: HEREDADO</span>
                </div>

                <!-- 1. MODO VISUAL PARA ESTA PLATAFORMA: HEREDAR VS BANNER PROPIO VS MULTIMEDIA PROPIO -->
                <div>
                  <label style="font-size: 10px; font-family: var(--font-tech); color: var(--color-text-dim); text-transform: uppercase; margin-bottom: 6px; display: block;">
                    ¿QUÉ MOSTRAR EN PANTALLA CUANDO DONEN POR ESTA PLATAFORMA?
                  </label>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                    <button type="button" id="btn-platmode-inherit" class="btn-stage-preset" style="padding: 8px; font-size: 11px; text-align: left;" onclick="AlertsStudio.setPlatformMediaMode('inherit')">
                      <div style="font-weight: 700;">🔄 Heredar General</div>
                      <div style="font-size: 9px; color: var(--color-text-dim);">Usa el mismo diseño global</div>
                    </button>
                    <button type="button" id="btn-platmode-banner" class="btn-stage-preset" style="padding: 8px; font-size: 11px; text-align: left;" onclick="AlertsStudio.setPlatformMediaMode('banner')">
                      <div style="font-weight: 700; color: #57D6C4;">🎨 Banner Propio</div>
                      <div style="font-size: 9px; color: var(--color-text-dim);">Tema y colores exclusivos</div>
                    </button>
                    <button type="button" id="btn-platmode-media" class="btn-stage-preset" style="padding: 8px; font-size: 11px; text-align: left;" onclick="AlertsStudio.setPlatformMediaMode('media')">
                      <div style="font-weight: 700; color: #F59E0B;">🎬 Multimedia Propio</div>
                      <div style="font-size: 9px; color: var(--color-text-dim);">Vídeo, GIF o audio propio</div>
                    </button>
                  </div>
                </div>

                <!-- Opciones cuando elige BANNER PROPIO para esta plataforma -->
                <div id="plat-banner-box" style="display: none; background: rgba(255,255,255,0.02); border: 1px dashed rgba(87,214,196,0.3); border-radius: 6px; padding: 10px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 10px;">Tema de Banner:</label>
                      <select id="cfg-plat-banner-style" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onDonationPlatChange('bannerStyle', this.value)">
                        ${this.BASE_STYLES.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 10px;">Color Borde / Acento:</label>
                      <input type="color" id="cfg-plat-border-color" style="height: 30px; width: 100%; border: 1px solid var(--color-border-dim); background: transparent; cursor: pointer; border-radius: 4px;" oninput="AlertsStudio.onDonationPlatChange('bannerBorderColor', this.value)">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 10px;">Badge Superior:</label>
                      <input type="text" id="cfg-plat-badge" class="form-input" style="font-size: 11px;" placeholder="KO-FI" oninput="AlertsStudio.onDonationPlatChange('badge', this.value)">
                    </div>
                  </div>
                </div>

                <!-- Opciones cuando elige MULTIMEDIA PROPIO para esta plataforma -->
                <div id="plat-media-box" style="display: none; background: rgba(255,255,255,0.02); border: 1px dashed rgba(245,158,11,0.3); border-radius: 6px; padding: 10px;">
                  <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 8px;">
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 10px;">Archivo de Vídeo o GIF exclusivo:</label>
                      <select id="cfg-plat-media-url" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onPlatformMediaSelect(this.value)">
                        <option value="">-- Seleccionar medio --</option>
                        ${this.mediaFiles.map(m => `<option value="${m.url}">[${m.type.toUpperCase()}] ${m.name}</option>`).join('')}
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 10px;">Modo de Audio para este medio:</label>
                      <select id="cfg-plat-sound-mode" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onDonationPlatChange('soundMode', this.value)">
                        <option value="inherit">🔄 Heredar audio general</option>
                        <option value="video">🎥 Audio propio del vídeo</option>
                        <option value="custom">🎵 Archivo MP3 superpuesto</option>
                        <option value="synth">🎹 Sintetizador Web</option>
                        <option value="none">🔇 Silencioso</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Textos exclusivos de esta plataforma -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 10px;">Título para esta plataforma:</label>
                    <input type="text" id="cfg-plat-title" class="form-input" onfocus="AlertsStudio.lastFocusedInput='cfg-plat-title'" oninput="AlertsStudio.onDonationPlatChange('titleTemplate', this.value)">
                  </div>

                  <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 10px;">Mensaje / Subtítulo para esta plataforma:</label>
                    <input type="text" id="cfg-plat-subtitle" class="form-input" onfocus="AlertsStudio.lastFocusedInput='cfg-plat-subtitle'" oninput="AlertsStudio.onDonationPlatChange('subtitleTemplate', this.value)">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 0; display: flex; align-items: center; gap: 8px;">
                  <label style="font-size: 10px; margin-bottom: 0;">Emoji de Partículas para esta plataforma:</label>
                  <input type="text" id="cfg-plat-particle-emoji" class="form-input" style="width: 60px; text-align: center; font-size: 14px;" oninput="AlertsStudio.onDonationPlatChange('particleEmoji', this.value)">
                </div>

              </div>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- SECCIÓN: PLANTILLAS DE TEXTOS Y DICCIONARIO DE VARIABLES       -->
          <!-- ============================================================== -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-family: var(--font-tech); font-size: 12px; font-weight: 800; color: var(--color-text-light);">
                📝 PLANTILLAS DE TEXTO Y MENSAJES (GENERAL)
              </span>
              <span class="badge-pill" style="font-size: 9px; background: rgba(87,214,196,0.1); color: #57D6C4;">TEXTOS ACTIVOS</span>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 10px;">Título Principal:</label>
              <input type="text" id="cfg-title-template" class="form-input" onfocus="AlertsStudio.lastFocusedInput='cfg-title-template'" oninput="AlertsStudio.onFieldChange('titleTemplate', this.value)">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 10px;">Subtítulo / Mensaje secundario:</label>
              <input type="text" id="cfg-subtitle-template" class="form-input" onfocus="AlertsStudio.lastFocusedInput='cfg-subtitle-template'" oninput="AlertsStudio.onFieldChange('subtitleTemplate', this.value)">
            </div>

            <!-- DICCIONARIO EXPLICATIVO DE VARIABLES -->
            <div style="margin-top: 4px; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 10px;">
              <div style="font-family: var(--font-tech); font-size: 10px; font-weight: 800; color: #57D6C4; margin-bottom: 6px; display: flex; justify-content: space-between;">
                <span>💡 VARIABLES DINÁMICAS (Haz clic en una para insertarla en el campo de texto activo):</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 6px; max-height: 180px; overflow-y: auto; padding-right: 4px;">
                ${this.VARIABLES_INFO.map(v => `
                  <div onclick="AlertsStudio.insertVariable('${v.token}')" style="cursor: pointer; padding: 6px 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; display: flex; flex-direction: column; gap: 2px; transition: all 0.15s ease;" onmouseenter="this.style.borderColor='#57D6C4'; this.style.background='rgba(87,214,196,0.1)';" onmouseleave="this.style.borderColor='rgba(255,255,255,0.06)'; this.style.background='rgba(255,255,255,0.03)';">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <code style="font-size: 11px; font-weight: 800; color: #57D6C4;">${v.token}</code>
                      <span style="font-size: 9px; font-weight: 700; color: #E2E8F0;">${v.name}</span>
                    </div>
                    <div style="font-size: 9px; color: var(--color-text-dim); line-height: 1.2;">${v.desc}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- SECCIÓN: CAPAS DE AUDIO Y SONIDO -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            <div style="font-family: var(--font-tech); font-size: 12px; font-weight: 800; color: #38BDF8;">
              🔊 ENRUTAMIENTO DE AUDIO Y SONIDO
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px;">
              <button type="button" id="btn-sound-video" class="btn-stage-preset" style="padding: 8px 10px; font-size: 11px;" onclick="AlertsStudio.setSoundMode('video')">
                🎥 Audio del Vídeo
              </button>
              <button type="button" id="btn-sound-custom" class="btn-stage-preset" style="padding: 8px 10px; font-size: 11px;" onclick="AlertsStudio.setSoundMode('custom')">
                🎵 Audio Superpuesto
              </button>
              <button type="button" id="btn-sound-synth" class="btn-stage-preset" style="padding: 8px 10px; font-size: 11px;" onclick="AlertsStudio.setSoundMode('synth')">
                🎹 Sintetizador Web
              </button>
              <button type="button" id="btn-sound-none" class="btn-stage-preset" style="padding: 8px 10px; font-size: 11px;" onclick="AlertsStudio.setSoundMode('none')">
                🔇 Silencioso
              </button>
            </div>

            <!-- Filas condicionales de audio -->
            <div id="sound-custom-row" style="display: none; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Archivo de Audio (alerts/media):</label>
                <select id="cfg-sound-url" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onFieldChange('soundUrl', this.value)">
                  <option value="">-- Seleccionar audio --</option>
                  ${this.mediaFiles.filter(m => m.type === 'sound').map(m => `<option value="${m.url}">[AUDIO] ${m.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Volumen Audio: <span id="val-sound-vol">80%</span></label>
                <input type="range" id="cfg-sound-vol" min="0" max="100" value="80" style="width: 100%; cursor: pointer;" oninput="AlertsStudio.onFieldChange('soundVolume', parseInt(this.value)); document.getElementById('val-sound-vol').textContent = this.value + '%';">
              </div>
            </div>

            <div id="sound-video-row" style="display: none;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Volumen del Vídeo: <span id="val-video-vol">80%</span></label>
                <input type="range" id="cfg-video-vol" min="0" max="100" value="80" style="width: 100%; cursor: pointer;" oninput="AlertsStudio.onFieldChange('videoVolume', parseInt(this.value)); document.getElementById('val-video-vol').textContent = this.value + '%';">
              </div>
            </div>

            <div id="sound-synth-row" style="display: none;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Tono Sintetizador Web Audio API:</label>
                <select id="cfg-synth-tone" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onFieldChange('synthTone', this.value)">
                  <option value="sub">Sub Acorde Triada Brillante</option>
                  <option value="coin">Coin Arcade / Propinas</option>
                  <option value="victory">Fanfarria de Victoria / Raids</option>
                  <option value="bell">Campana Suave / Follows</option>
                  <option value="susto">Susto / Tensión Sawtooth</option>
                  <option value="boom">Boom Explosión</option>
                </select>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: DURACIÓN Y PARTÍCULAS -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 10px;">Duración en Pantalla: <span id="val-duration">5s</span></label>
              <input type="range" id="cfg-duration" min="2000" max="15000" step="500" value="5000" style="width: 100%; cursor: pointer;" oninput="AlertsStudio.onFieldChange('duration', parseInt(this.value)); document.getElementById('val-duration').textContent = (this.value/1000) + 's';">
            </div>

            <div style="display: flex; flex-direction: column; justify-content: center; gap: 6px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px;">
                <input type="checkbox" id="cfg-show-particles" onchange="AlertsStudio.onFieldChange('showParticles', this.checked)">
                <span>Lluvia de Partículas al Disparar</span>
              </label>
              <div style="display: flex; gap: 6px; align-items: center;">
                <span style="font-size: 10px; color: var(--color-text-dim);">Emoji:</span>
                <input type="text" id="cfg-particle-emoji" class="form-input" style="width: 60px; text-align: center; font-size: 14px;" oninput="AlertsStudio.onFieldChange('particleEmoji', this.value)">
              </div>
            </div>
          </div>

        </div>

        <!-- COLUMNA DERECHA: VISTA PREVIA INTERACTIVA CON REPRODUCTOR Y SIMULADOR -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Escenario de Vista Previa con Reproductor de Animaciones -->
          <div class="dash-card" style="padding: 16px; background: #0A0D10; border: 1px solid #1E293B;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-family: var(--font-tech); font-size: 11px; font-weight: 800; color: #57D6C4; letter-spacing: 1px;">
                  👁️ VISTA PREVIA (OBS CANVAS)
                </span>
                <span class="badge-pill" style="font-size: 9px; background: rgba(0,0,0,0.4); border: 1px solid #334155;">100% FIEL</span>
              </div>

              <!-- CONTROLES DEL REPRODUCTOR EN PREVIEW -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #94A3B8; cursor: pointer;">
                  <input type="checkbox" id="cfg-preview-sound" checked>
                  <span>🔊 Audio</span>
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #94A3B8; cursor: pointer;">
                  <input type="checkbox" id="cfg-preview-loop" onchange="AlertsStudio.togglePreviewLoop(this.checked)">
                  <span>🔄 Bucle</span>
                </label>
                <button type="button" class="btn-action-primary" style="padding: 4px 12px; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 5px;" onclick="AlertsStudio.playPreviewAnimation()">
                  <span>▶️</span> REPRODUCIR PREVIEW
                </button>
              </div>
            </div>

            <!-- Escenario visual con rejilla -->
            <div id="preview-stage" class="preview-stage" style="position: relative; width: 100%; min-height: 250px; background: radial-gradient(circle at 50% 30%, #151C24 0%, #080A0D 100%); border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.15); padding: 24px; box-sizing: border-box;">
              <!-- Rejilla tenue de fondo de escenario -->
              <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 20px 20px; pointer-events: none;"></div>
              
              <!-- Elemento de Alerta de Previsualización -->
              <div id="preview-alert-box" style="position: relative; z-index: 10; width: 100%; display: flex; justify-content: center;"></div>
            </div>

            <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--color-text-dim);">
              <span>💡 Animación actual: <b id="lbl-preview-anim-name" style="color: #57D6C4;">Pop Elástico</b></span>
              <span>Cambia de animación o pulsa ▶️ para ver la entrada en vivo</span>
            </div>
          </div>

          <!-- Simulador de Prueba -->
          <div class="dash-card">
            <div class="card-header-bar">
              <span class="card-header-title">🧪 SIMULADOR DE PRUEBA EN VIVO</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Nombre de Usuario / Donante:</label>
                <input type="text" id="sim-user" class="form-input" value="AndorinaMaker" oninput="AlertsStudio.updatePreview(true)">
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label id="sim-extra-label" style="font-size: 10px;">Valor / Cantidad:</label>
                <input type="text" id="sim-extra-val" class="form-input" value="10.00 EUR" oninput="AlertsStudio.updatePreview(true)">
              </div>
            </div>

            <!-- Selector de plataforma de prueba (solo en donación) -->
            <div id="sim-plat-selector-row" style="display: none; margin-bottom: 10px;">
              <label style="font-size: 10px;">Pasarela de Donación para Prueba:</label>
              <select id="sim-plat-choice" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onSimPlatChange(this.value)">
                <option value="kofi">☕ Ko-fi</option>
                <option value="paypal">🅿️ PayPal</option>
                <option value="buymeacoffee">🟡 Buy Me a Coffee</option>
                <option value="streamlabs">⚡ Streamlabs</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label style="font-size: 10px;">Mensaje / Nota del Espectador:</label>
              <input type="text" id="sim-msg" class="form-input" value="¡Gran stream! ¡Sigue así!" oninput="AlertsStudio.updatePreview(true)">
            </div>

            <button type="button" class="btn-action-primary" style="width: 100%; padding: 12px; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="AlertsStudio.triggerCurrentTest()">
              <span>🚀</span> DISPARAR ALERTA EN OBS AHORA
            </button>
          </div>
        </div>

      </div>
    `;

    this.renderThemesGallery();
  },

  renderThemesGallery() {
    const gallery = document.getElementById('themes-preset-gallery');
    if (!gallery || !this.themesConfig || !this.themesConfig.themes) return;

    const currentThemeId = this.selectedThemeId || 'cyberpunk';
    const themesList = Object.values(this.themesConfig.themes);

    gallery.innerHTML = themesList.map(t => {
      const isSelected = (currentThemeId === t.id);
      const isCustom = t.id.startsWith('custom_') || t.badge === 'CUSTOM';
      return `
        <div class="banner-style-card" id="card-theme-${t.id}" onclick="AlertsStudio.selectAndApplyTheme('${t.id}')" style="cursor: pointer; padding: 10px; border-radius: 6px; border: ${isSelected ? '2px solid #57D6C4' : '1px solid var(--color-border-dim)'}; background: ${isSelected ? 'rgba(87, 214, 196, 0.15)' : 'rgba(255,255,255,0.03)'}; transition: all 0.2s ease; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 11px; color: ${t.accentColor || '#57D6C4'};">${t.name}</span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${t.accentColor || '#57D6C4'}; box-shadow: 0 0 6px ${t.accentColor || '#57D6C4'};"></span>
          </div>
          <div style="font-size: 9px; color: var(--color-text-dim); line-height: 1.25;">${t.desc || 'Tema para alertas.'}</div>
          ${isCustom ? `<span style="position: absolute; bottom: 4px; right: 6px; font-size: 8px; font-weight: 700; color: #F59E0B;">PERSONALIZADO</span>` : ''}
        </div>
      `;
    }).join('');

    // Actualizar nombre en cabecera del editor
    const activeTheme = this.themesConfig.themes[currentThemeId] || this.themesConfig.themes.cyberpunk;
    const lblEl = document.getElementById('lbl-editing-theme-name');
    if (lblEl && activeTheme) {
      lblEl.textContent = activeTheme.name;
    }

    const delBtn = document.getElementById('btn-delete-theme');
    if (delBtn) {
      const isCustom = activeTheme && (activeTheme.id.startsWith('custom_') || activeTheme.badge === 'CUSTOM');
      delBtn.style.display = isCustom ? 'inline-block' : 'none';
    }
  },

  selectType(type) {
    this.currentType = type;
    const typeMeta = this.ALERT_TYPES.find(t => t.id === type) || this.ALERT_TYPES[0];

    // Actualizar botones de tabs
    this.ALERT_TYPES.forEach(t => {
      const btn = document.getElementById(`tab-alert-${t.id}`);
      if (btn) {
        if (t.id === type) {
          btn.style.background = 'rgba(87, 214, 196, 0.2)';
          btn.style.borderColor = '#57D6C4';
          btn.style.color = '#57D6C4';
        } else {
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }
      }
    });

    const titleEl = document.getElementById('cfg-active-title');
    const iconEl = document.getElementById('cfg-active-icon');
    if (titleEl) titleEl.textContent = `CONFIGURACIÓN // ${typeMeta.name.toUpperCase()}`;
    if (iconEl) iconEl.textContent = typeMeta.icon;

    // Asegurar estructura
    if (!this.config || !this.config.alerts) this.config = { alerts: {} };
    if (!this.config.alerts[type]) {
      this.config.alerts[type] = {
        enabled: true,
        mediaMode: 'banner',
        bannerStyle: 'cyberpunk',
        bannerBorderColor: '#57D6C4',
        bannerTextColor: '#FFFFFF',
        bannerFontFamily: 'var(--font-tech), monospace',
        bannerAnimation: 'pop',
        chatStyleLinked: false,
        titleTemplate: `¡NUEVO ${typeMeta.badge}!`,
        subtitleTemplate: '¡Gracias por apoyar el directo!',
        soundMode: 'synth',
        synthTone: type === 'donation' ? 'coin' : 'sub',
        soundVolume: 80,
        videoVolume: 80,
        duration: 5000,
        showParticles: true,
        particleEmoji: typeMeta.defaultEmoji,
        perPlatformEnabled: false,
        platforms: {
          kofi: { mediaMode: 'inherit', bannerStyle: 'cyberpunk', bannerBorderColor: '#57D6C4', badge: 'KO-FI', titleTemplate: '☕ ¡INVITACIÓN EN KO-FI DE {user}!', subtitleTemplate: '{amount} — "{message}"', particleEmoji: '☕', soundMode: 'inherit' },
          paypal: { mediaMode: 'inherit', bannerStyle: 'cyberpunk', bannerBorderColor: '#0079C1', badge: 'PAYPAL', titleTemplate: '🅿️ ¡DONACIÓN POR PAYPAL DE {user}!', subtitleTemplate: '{amount} — "{message}"', particleEmoji: '🅿️', soundMode: 'inherit' },
          buymeacoffee: { mediaMode: 'inherit', bannerStyle: 'cyberpunk', bannerBorderColor: '#FFDD00', badge: 'BUY ME A COFFEE', titleTemplate: '🟡 ¡CAFÉ RECIBIDO DE {user}!', subtitleTemplate: '{amount} — "{message}"', particleEmoji: '🟡', soundMode: 'inherit' },
          streamlabs: { mediaMode: 'inherit', bannerStyle: 'cyberpunk', bannerBorderColor: '#31C48D', badge: 'STREAMLABS', titleTemplate: '⚡ ¡DONACIÓN STREAMLABS DE {user}!', subtitleTemplate: '{amount} — "{message}"', particleEmoji: '⚡', soundMode: 'inherit' }
        }
      };
    }

    const c = this.config.alerts[type];

    // Poblar campos
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val !== undefined ? val : ''; };
    const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

    setCheck('cfg-enabled', c.enabled);
    setVal('cfg-title-template', c.titleTemplate || c.templateTitle);
    setVal('cfg-subtitle-template', c.subtitleTemplate || c.templateMessage);
    setVal('cfg-banner-border-color', c.bannerBorderColor || c.borderColor || '#57D6C4');
    setVal('cfg-banner-border-hex', c.bannerBorderColor || c.borderColor || '#57D6C4');
    setVal('cfg-banner-text-color', c.bannerTextColor || '#FFFFFF');
    setVal('cfg-banner-text-hex', c.bannerTextColor || '#FFFFFF');
    setVal('cfg-banner-font', c.bannerFontFamily || c.fontFamily || 'var(--font-tech), monospace');
    setVal('cfg-banner-anim', c.bannerAnimation || 'pop');
    setVal('cfg-theme-style', c.bannerStyle || 'cyberpunk');
    setVal('cfg-media-url', c.mediaUrl || '');
    setVal('cfg-media-size', c.mediaSize || 'medium');
    setVal('cfg-position', c.position || 'center');
    setVal('cfg-caption-pos', c.captionPosition || 'below');
    setVal('cfg-sound-url', c.soundUrl || '');
    setVal('cfg-sound-vol', c.soundVolume ?? 80);
    setVal('cfg-video-vol', c.videoVolume ?? 80);
    setVal('cfg-synth-tone', c.synthTone || (type === 'donation' ? 'coin' : 'sub'));
    setVal('cfg-duration', c.duration || 5000);
    setCheck('cfg-show-particles', c.showParticles !== false);
    setVal('cfg-particle-emoji', c.particleEmoji || typeMeta.defaultEmoji);

    const durEl = document.getElementById('val-duration');
    if (durEl) durEl.textContent = ((c.duration || 5000) / 1000) + 's';
    const sVolEl = document.getElementById('val-sound-vol');
    if (sVolEl) sVolEl.textContent = (c.soundVolume ?? 80) + '%';
    const vVolEl = document.getElementById('val-video-vol');
    if (vVolEl) vVolEl.textContent = (c.videoVolume ?? 80) + '%';

    // Mostrar/ocultar bloque de plataformas de donación
    const donationPanel = document.getElementById('panel-donation-platforms');
    const simPlatRow = document.getElementById('sim-plat-selector-row');
    if (type === 'donation') {
      if (donationPanel) donationPanel.style.display = 'flex';
      if (simPlatRow) simPlatRow.style.display = 'block';
      const perPlat = c.perPlatformEnabled || c.perPlatform || false;
      setCheck('cfg-donation-per-platform', perPlat);
      this.toggleDonationPerPlatform(perPlat, false);
    } else {
      if (donationPanel) donationPanel.style.display = 'none';
      if (simPlatRow) simPlatRow.style.display = 'none';
    }

    // Ajustar etiquetas del simulador según tipo
    const simExtraLabel = document.getElementById('sim-extra-label');
    const simExtraVal = document.getElementById('sim-extra-val');
    if (simExtraLabel && simExtraVal) {
      if (type === 'resub') {
        simExtraLabel.textContent = 'Meses Acumulados:';
        simExtraVal.value = '6';
      } else if (type === 'cheer') {
        simExtraLabel.textContent = 'Bits Donados:';
        simExtraVal.value = '250';
      } else if (type === 'raid') {
        simExtraLabel.textContent = 'Espectadores (Viewers):';
        simExtraVal.value = '35';
      } else if (type === 'donation') {
        simExtraLabel.textContent = 'Importe Donación:';
        simExtraVal.value = '10.00 EUR';
      } else if (type === 'sub_community_gift') {
        simExtraLabel.textContent = 'Subs Regaladas:';
        simExtraVal.value = '5';
      } else {
        simExtraLabel.textContent = 'Detalle adicional:';
        simExtraVal.value = 'Nivel 1';
      }
    }

    // Sincronizar tema seleccionado con el estilo activo
    if (this.themesConfig && this.themesConfig.themes) {
      const match = Object.values(this.themesConfig.themes).find(t => t.style === c.bannerStyle || t.id === c.bannerStyle);
      if (match) {
        this.selectedThemeId = match.id;
        const nameInput = document.getElementById('cfg-theme-name');
        if (nameInput) nameInput.value = match.name;
      }
    }

    this.setMediaMode(c.mediaMode || 'banner', false);
    this.renderThemesGallery();
    this.setSoundMode(c.soundMode || (c.mediaMode === 'media' ? 'video' : 'synth'), false);
    this.updateChatLinkStatus();
    this.updatePreview(true);
  },

  setMediaMode(mode, triggerPreview = true) {
    if (!this.config || !this.config.alerts[this.currentType]) return;
    this.config.alerts[this.currentType].mediaMode = mode;

    const bannerBtn = document.getElementById('btn-mode-banner');
    const mediaBtn = document.getElementById('btn-mode-media');
    const bannerPanel = document.getElementById('panel-banner-options');
    const mediaPanel = document.getElementById('panel-media-options');

    if (mode === 'banner') {
      if (bannerBtn) { bannerBtn.style.background = 'rgba(87, 214, 196, 0.15)'; bannerBtn.style.borderColor = '#57D6C4'; }
      if (mediaBtn) { mediaBtn.style.background = ''; mediaBtn.style.borderColor = ''; }
      if (bannerPanel) bannerPanel.style.display = 'flex';
      if (mediaPanel) mediaPanel.style.display = 'none';
    } else {
      if (bannerBtn) { bannerBtn.style.background = ''; bannerBtn.style.borderColor = ''; }
      if (mediaBtn) { mediaBtn.style.background = 'rgba(245, 158, 11, 0.15)'; mediaBtn.style.borderColor = '#F59E0B'; }
      if (bannerPanel) bannerPanel.style.display = 'none';
      if (mediaPanel) mediaPanel.style.display = 'flex';
    }

    if (triggerPreview) this.updatePreview(true);
  },

  selectAndApplyTheme(themeId) {
    if (!this.themesConfig || !this.themesConfig.themes) return;
    const theme = this.themesConfig.themes[themeId];
    if (!theme) return;

    this.selectedThemeId = themeId;
    const c = this.config.alerts[this.currentType];
    if (!c) return;

    c.bannerStyle = theme.style || theme.id;
    c.bannerBorderColor = theme.borderColor || theme.accentColor || '#57D6C4';
    c.bannerAccentColor = theme.accentColor || '#57D6C4';
    c.bannerTextColor = theme.textColor || '#FFFFFF';
    c.bannerFontFamily = theme.fontFamily || 'var(--font-tech), monospace';
    c.bannerAnimation = theme.animation || 'pop';
    c.chatStyleLinked = false;

    // Actualizar campos de input
    const bColor = document.getElementById('cfg-banner-border-color');
    const bHex = document.getElementById('cfg-banner-border-hex');
    const tColor = document.getElementById('cfg-banner-text-color');
    const tHex = document.getElementById('cfg-banner-text-hex');
    const fontEl = document.getElementById('cfg-banner-font');
    const animEl = document.getElementById('cfg-banner-anim');
    const nameEl = document.getElementById('cfg-theme-name');
    const styleEl = document.getElementById('cfg-theme-style');

    if (bColor) bColor.value = c.bannerBorderColor;
    if (bHex) bHex.value = c.bannerBorderColor;
    if (tColor) tColor.value = c.bannerTextColor;
    if (tHex) tHex.value = c.bannerTextColor;
    if (fontEl) fontEl.value = c.bannerFontFamily;
    if (animEl) animEl.value = c.bannerAnimation;
    if (nameEl) nameEl.value = theme.name;
    if (styleEl) styleEl.value = theme.style || 'cyberpunk';

    this.renderThemesGallery();
    this.updateChatLinkStatus();
    this.updatePreview(true); // actualiza y reproduce animación automáticamente
    this.showToast(`✨ Tema '${theme.name}' cargado en el editor.`);
  },

  onAnimationChange(anim) {
    this.onFieldChange('bannerAnimation', anim);
    const animObj = this.ANIMATIONS_LIST.find(a => a.id === anim);
    const animLbl = document.getElementById('lbl-preview-anim-name');
    if (animLbl && animObj) animLbl.textContent = animObj.name;
    this.playPreviewAnimation();
  },

  onThemeNameChange(name) {
    if (!name) return;
    const theme = this.themesConfig.themes[this.selectedThemeId];
    if (theme) {
      theme.name = name;
    }
    const lblEl = document.getElementById('lbl-editing-theme-name');
    if (lblEl) lblEl.textContent = name;
  },

  onThemeStyleChange(style) {
    this.onFieldChange('bannerStyle', style);
    const theme = this.themesConfig.themes[this.selectedThemeId];
    if (theme) {
      theme.style = style;
    }
    this.updatePreview(true);
  },

  /**
   * Guarda y sobrescribe el tema actual en el catálogo de temas
   */
  async saveCurrentThemeOverwrite() {
    const c = this.config.alerts[this.currentType];
    const themeId = this.selectedThemeId || 'cyberpunk';
    let theme = this.themesConfig.themes[themeId];

    const inputName = (document.getElementById('cfg-theme-name') || {}).value || (theme ? theme.name : 'Tema Personalizado');

    if (!theme) {
      theme = { id: themeId };
      this.themesConfig.themes[themeId] = theme;
    }

    theme.name = inputName;
    theme.style = (document.getElementById('cfg-theme-style') || {}).value || c.bannerStyle || 'cyberpunk';
    theme.accentColor = c.bannerBorderColor || '#57D6C4';
    theme.borderColor = c.bannerBorderColor || '#57D6C4';
    theme.textColor = c.bannerTextColor || '#FFFFFF';
    theme.fontFamily = c.bannerFontFamily || 'var(--font-tech), monospace';
    theme.animation = c.bannerAnimation || 'pop';
    theme.desc = `Tema editado y personalizado (${new Date().toLocaleDateString()}).`;

    try {
      const res = await fetch('/api/alerts/themes', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ theme: theme, themes: this.themesConfig.themes, activeTheme: themeId })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.renderThemesGallery();
        this.showToast(`✓ Tema '${theme.name}' guardado y actualizado con éxito.`);
      } else {
        alert('Error guardando tema: ' + (data.error || 'Respuesta inesperada'));
      }
    } catch (e) {
      alert('Error de conexión al guardar tema: ' + e);
    }
  },

  /**
   * Guarda como un nuevo tema independiente en el catálogo
   */
  async saveThemeAsNew() {
    const defaultName = ((document.getElementById('cfg-theme-name') || {}).value || 'Mi Tema') + ' (Nuevo)';
    const name = prompt('Escribe el nombre para tu nuevo tema de alertas:', defaultName);
    if (!name || !name.trim()) return;

    const c = this.config.alerts[this.currentType];
    const newId = 'custom_' + Date.now().toString(36) + '_' + name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);

    const newTheme = {
      id: newId,
      name: name.trim(),
      style: (document.getElementById('cfg-theme-style') || {}).value || c.bannerStyle || 'cyberpunk',
      badge: 'CUSTOM',
      accentColor: c.bannerBorderColor || '#57D6C4',
      borderColor: c.bannerBorderColor || '#57D6C4',
      textColor: c.bannerTextColor || '#FFFFFF',
      fontFamily: c.bannerFontFamily || 'var(--font-tech), monospace',
      animation: c.bannerAnimation || 'pop',
      desc: 'Tema personalizado creado desde el editor.'
    };

    this.themesConfig.themes[newId] = newTheme;
    this.selectedThemeId = newId;

    try {
      const res = await fetch('/api/alerts/themes', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ theme: newTheme, themes: this.themesConfig.themes, activeTheme: newId })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.renderThemesGallery();
        this.selectAndApplyTheme(newId);
        this.showToast(`🎉 ¡Nuevo tema '${newTheme.name}' añadido al catálogo!`);
      } else {
        alert('Error creando nuevo tema: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Error al crear nuevo tema: ' + e);
    }
  },

  /**
   * Elimina un tema personalizado
   */
  async deleteCurrentTheme() {
    const themeId = this.selectedThemeId;
    const theme = this.themesConfig.themes[themeId];
    if (!theme) return;

    if (!confirm(`¿Seguro que deseas eliminar el tema '${theme.name}' de tu catálogo?`)) {
      return;
    }

    try {
      const res = await fetch('/api/alerts/themes', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ deleteThemeId: themeId })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        delete this.themesConfig.themes[themeId];
        this.selectedThemeId = 'cyberpunk';
        this.selectAndApplyTheme('cyberpunk');
        this.showToast(`🗑️ Tema '${theme.name}' eliminado.`);
      }
    } catch (e) {
      alert('Error eliminando tema: ' + e);
    }
  },

  async applyThemeToAll() {
    const currentStyle = (this.config.alerts[this.currentType] || {}).bannerStyle || 'cyberpunk';
    const theme = this.themesConfig.themes[this.selectedThemeId] || Object.values(this.themesConfig.themes).find(t => t.style === currentStyle || t.id === currentStyle) || this.themesConfig.themes.cyberpunk;

    if (!confirm(`¿Deseas aplicar el tema '${theme.name}' a TODAS las alertas de tu canal para unificar el diseño?`)) {
      return;
    }

    try {
      const res = await fetch('/api/alerts/apply-theme', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ themeId: theme.id, target: 'all' })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.config.alerts = data.alerts;
        this.selectType(this.currentType);
        this.showToast(`🌐 ¡Tema '${theme.name}' unificado en todas las alertas!`);
      }
    } catch (e) {
      alert('Error aplicando tema global: ' + e);
    }
  },

  setSoundMode(mode, triggerPreview = true) {
    if (!this.config || !this.config.alerts[this.currentType]) return;
    this.config.alerts[this.currentType].soundMode = mode;

    ['video', 'custom', 'synth', 'none'].forEach(m => {
      const btn = document.getElementById(`btn-sound-${m}`);
      if (btn) {
        if (m === mode) {
          btn.style.background = 'rgba(56, 189, 248, 0.2)';
          btn.style.borderColor = '#38BDF8';
          btn.style.color = '#38BDF8';
        } else {
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }
      }
    });

    const customRow = document.getElementById('sound-custom-row');
    const videoRow = document.getElementById('sound-video-row');
    const synthRow = document.getElementById('sound-synth-row');

    if (customRow) customRow.style.display = mode === 'custom' ? 'grid' : 'none';
    if (videoRow) videoRow.style.display = mode === 'video' ? 'block' : 'none';
    if (synthRow) synthRow.style.display = mode === 'synth' ? 'block' : 'none';
  },

  onFieldChange(field, val) {
    if (!this.config || !this.config.alerts[this.currentType]) return;
    this.config.alerts[this.currentType][field] = val;

    if (['bannerBorderColor', 'bannerTextColor', 'bannerFontFamily'].includes(field)) {
      if (this.config.alerts[this.currentType].chatStyleLinked) {
        this.config.alerts[this.currentType].chatStyleLinked = false;
        this.updateChatLinkStatus();
      }
    }

    if (field === 'bannerBorderColor') {
      const hex = document.getElementById('cfg-banner-border-hex');
      const col = document.getElementById('cfg-banner-border-color');
      if (hex && hex.value !== val) hex.value = val;
      if (col && col.value !== val) col.value = val;
    }
    if (field === 'bannerTextColor') {
      const hex = document.getElementById('cfg-banner-text-hex');
      const col = document.getElementById('cfg-banner-text-color');
      if (hex && hex.value !== val) hex.value = val;
      if (col && col.value !== val) col.value = val;
    }

    this.updatePreview(false);
  },

  onMediaSelect(val) {
    this.onFieldChange('mediaUrl', val);
    const media = this.mediaFiles.find(m => m.url === val);
    if (media) {
      this.onFieldChange('mediaType', media.type);
      if (media.type === 'video') this.setSoundMode('video');
    }
  },

  insertVariable(token) {
    const input = document.getElementById(this.lastFocusedInput) || document.getElementById('cfg-title-template');
    if (input) {
      const start = input.selectionStart || input.value.length;
      const end = input.selectionEnd || input.value.length;
      input.value = input.value.substring(0, start) + token + input.value.substring(end);
      input.dispatchEvent(new Event('input'));
      input.focus();
      this.showToast(`Insertado ${token}`);
    }
  },

  // ==========================================================================
  // DONACIONES POR PLATAFORMA: PERSONALIZACIÓN VISUAL, MULTIMEDIA Y TEXTOS
  // ==========================================================================
  toggleDonationPerPlatform(enabled, triggerPreview = true) {
    const c = this.config.alerts.donation;
    if (!c) return;
    c.perPlatformEnabled = enabled;

    const container = document.getElementById('donation-platforms-container');
    if (container) container.style.display = enabled ? 'flex' : 'none';

    if (enabled) {
      this.selectDonationPlatform(this.currentDonationPlatform);
    }
    if (triggerPreview) this.updatePreview(true);
  },

  selectDonationPlatform(plat) {
    this.currentDonationPlatform = plat;
    const c = this.config.alerts.donation;
    if (!c || !c.platforms) return;
    if (!c.platforms[plat]) {
      c.platforms[plat] = {
        mediaMode: 'inherit',
        bannerStyle: 'cyberpunk',
        bannerBorderColor: '#57D6C4',
        badge: plat.toUpperCase(),
        titleTemplate: `¡DONACIÓN EN ${plat.toUpperCase()}!`,
        subtitleTemplate: '{user}: {amount}',
        particleEmoji: plat === 'kofi' ? '☕' : (plat === 'paypal' ? '🅿️' : (plat === 'buymeacoffee' ? '🟡' : '⚡')),
        soundMode: 'inherit'
      };
    }

    ['kofi', 'paypal', 'buymeacoffee', 'streamlabs'].forEach(p => {
      const btn = document.getElementById(`subtab-plat-${p}`);
      if (btn) {
        if (p === plat) {
          btn.style.background = 'rgba(16, 185, 129, 0.2)';
          btn.style.borderColor = '#10B981';
          btn.style.color = '#10B981';
        } else {
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }
      }
    });

    const lbl = document.getElementById('lbl-active-plat-title');
    const platNames = { kofi: 'Ko-fi', paypal: 'PayPal', buymeacoffee: 'Buy Me a Coffee', streamlabs: 'Streamlabs' };
    if (lbl) lbl.textContent = `Configuración para: ${platNames[plat] || plat}`;

    const platData = c.platforms[plat];
    const tInput = document.getElementById('cfg-plat-title');
    const sInput = document.getElementById('cfg-plat-subtitle');
    const badgeInput = document.getElementById('cfg-plat-badge');
    const bColorInput = document.getElementById('cfg-plat-border-color');
    const bStyleInput = document.getElementById('cfg-plat-banner-style');
    const mUrlInput = document.getElementById('cfg-plat-media-url');
    const sndModeInput = document.getElementById('cfg-plat-sound-mode');
    const pEmojiInput = document.getElementById('cfg-plat-particle-emoji');

    if (tInput) tInput.value = platData.titleTemplate || '';
    if (sInput) sInput.value = platData.subtitleTemplate || '';
    if (badgeInput) badgeInput.value = platData.badge || plat.toUpperCase();
    if (bColorInput) bColorInput.value = platData.bannerBorderColor || '#57D6C4';
    if (bStyleInput) bStyleInput.value = platData.bannerStyle || 'cyberpunk';
    if (mUrlInput) mUrlInput.value = platData.mediaUrl || '';
    if (sndModeInput) sndModeInput.value = platData.soundMode || 'inherit';
    if (pEmojiInput) pEmojiInput.value = platData.particleEmoji || '💰';

    this.setPlatformMediaMode(platData.mediaMode || 'inherit', false);

    // Sincronizar selector del simulador
    const simChoice = document.getElementById('sim-plat-choice');
    if (simChoice) simChoice.value = plat;

    this.updatePreview(true);
  },

  setPlatformMediaMode(mode, triggerPreview = true) {
    const c = this.config.alerts.donation;
    if (!c || !c.platforms || !c.platforms[this.currentDonationPlatform]) return;
    const platData = c.platforms[this.currentDonationPlatform];
    platData.mediaMode = mode;

    ['inherit', 'banner', 'media'].forEach(m => {
      const btn = document.getElementById(`btn-platmode-${m}`);
      if (btn) {
        if (m === mode) {
          btn.style.background = m === 'inherit' ? 'rgba(255,255,255,0.1)' : (m === 'banner' ? 'rgba(87, 214, 196, 0.2)' : 'rgba(245, 158, 11, 0.2)');
          btn.style.borderColor = m === 'inherit' ? '#94A3B8' : (m === 'banner' ? '#57D6C4' : '#F59E0B');
        } else {
          btn.style.background = '';
          btn.style.borderColor = '';
        }
      }
    });

    const bannerBox = document.getElementById('plat-banner-box');
    const mediaBox = document.getElementById('plat-media-box');
    const badgePill = document.getElementById('lbl-active-plat-badge-pill');

    if (bannerBox) bannerBox.style.display = mode === 'banner' ? 'block' : 'none';
    if (mediaBox) mediaBox.style.display = mode === 'media' ? 'block' : 'none';

    if (badgePill) {
      if (mode === 'banner') badgePill.textContent = 'MODO: BANNER EXCLUSIVO';
      else if (mode === 'media') badgePill.textContent = 'MODO: MULTIMEDIA PROPIO';
      else badgePill.textContent = 'MODO: HEREDADO (GLOBAL)';
    }

    if (triggerPreview) this.updatePreview(true);
  },

  onPlatformMediaSelect(val) {
    this.onDonationPlatChange('mediaUrl', val);
    const media = this.mediaFiles.find(m => m.url === val);
    if (media) {
      this.onDonationPlatChange('mediaType', media.type);
    }
  },

  onDonationPlatChange(field, val) {
    const c = this.config.alerts.donation;
    if (!c || !c.platforms || !c.platforms[this.currentDonationPlatform]) return;
    c.platforms[this.currentDonationPlatform][field] = val;
    this.updatePreview(false);
  },

  onSimPlatChange(plat) {
    if (this.config.alerts.donation && this.config.alerts.donation.perPlatformEnabled) {
      this.selectDonationPlatform(plat);
    } else {
      this.updatePreview(true);
    }
  },

  toggleChatLink() {
    const c = this.config.alerts[this.currentType];
    if (!c) return;

    if (c.chatStyleLinked) {
      c.chatStyleLinked = false;
      this.updateChatLinkStatus();
      this.showToast('🔓 Estilos desvinculados: ahora puedes editarlos libremente.');
    } else {
      if (this.chatConfig && this.chatConfig.styles) {
        const s = this.chatConfig.styles;
        c.bannerFontFamily = s.fontFamily || 'var(--font-tech), monospace';
        c.bannerBorderColor = s.borderColor || '#57D6C4';
        c.bannerAccentColor = s.borderColor || '#57D6C4';
      } else {
        c.bannerBorderColor = '#57D6C4';
      }
      c.chatStyleLinked = true;

      const fontEl = document.getElementById('cfg-banner-font');
      const colEl = document.getElementById('cfg-banner-border-color');
      const hexEl = document.getElementById('cfg-banner-border-hex');
      if (fontEl) fontEl.value = c.bannerFontFamily;
      if (colEl) colEl.value = c.bannerBorderColor;
      if (hexEl) hexEl.value = c.bannerBorderColor;

      this.updateChatLinkStatus();
      this.updatePreview(true);
      this.showToast('🔗 Estilos vinculados con el widget de Chat.');
    }
  },

  updateChatLinkStatus() {
    const c = this.config.alerts[this.currentType];
    const btnEl = document.getElementById('btn-chat-link');
    if (!c || !btnEl) return;

    if (c.chatStyleLinked) {
      btnEl.textContent = '🔓 Desvincular de Chat';
      btnEl.style.borderColor = '#57D6C4';
      btnEl.style.color = '#57D6C4';
    } else {
      btnEl.textContent = '🔗 Linkear con Chat';
      btnEl.style.borderColor = '';
      btnEl.style.color = '';
    }
  },

  // ==========================================================================
  // MOTOR DE VISTA PREVIA Y REPRODUCTOR DE ANIMACIONES
  // ==========================================================================
  updatePreview(animate = false) {
    const box = document.getElementById('preview-alert-box');
    if (!box) return;

    const c = this.config ? this.config.alerts[this.currentType] : null;
    if (!c) return;

    const user = (document.getElementById('sim-user') || {}).value || 'AndorinaMaker';
    const extraVal = (document.getElementById('sim-extra-val') || {}).value || '10.00 EUR';
    const msg = (document.getElementById('sim-msg') || {}).value || '¡Gran directo!';
    const chosenPlat = (document.getElementById('sim-plat-choice') || {}).value || this.currentDonationPlatform || 'kofi';

    const platNames = { kofi: 'Ko-fi', paypal: 'PayPal', buymeacoffee: 'Buy Me a Coffee', streamlabs: 'Streamlabs' };
    const displayPlat = platNames[chosenPlat] || chosenPlat;

    const resolveTpl = (tpl) => {
      return (tpl || '')
        .replace(/\{user\}/gi, user)
        .replace(/\{username\}/gi, user)
        .replace(/\{amount\}/gi, extraVal)
        .replace(/\{months\}/gi, extraVal)
        .replace(/\{viewers\}/gi, extraVal)
        .replace(/\{bits\}/gi, extraVal)
        .replace(/\{currency\}/gi, 'EUR')
        .replace(/\{platform\}/gi, displayPlat)
        .replace(/\{message\}/gi, msg);
    };

    let titleTpl = c.titleTemplate || c.templateTitle || '¡ALERTA DE DIRECTO!';
    let subtitleTpl = c.subtitleTemplate || c.templateMessage || '';
    let effectiveMediaMode = c.mediaMode || 'banner';
    let effectiveMediaUrl = c.mediaUrl || '';
    let effectiveBannerStyle = c.bannerStyle || 'cyberpunk';
    let effectiveBorderColor = c.bannerBorderColor || c.borderColor || '#57D6C4';
    let effectiveTextColor = c.bannerTextColor || '#FFFFFF';
    let effectiveBadge = '';

    const typeMeta = this.ALERT_TYPES.find(t => t.id === this.currentType) || this.ALERT_TYPES[0];
    effectiveBadge = typeMeta.badge.replace('{months}', extraVal).replace('{amount}', extraVal).replace('{viewers}', extraVal);

    // Si es donación y está activado perPlatform
    if (this.currentType === 'donation' && c.perPlatformEnabled && c.platforms && c.platforms[chosenPlat]) {
      const p = c.platforms[chosenPlat];
      if (p.titleTemplate) titleTpl = p.titleTemplate;
      if (p.subtitleTemplate) subtitleTpl = p.subtitleTemplate;
      if (p.badge) effectiveBadge = p.badge;
      else effectiveBadge = displayPlat.toUpperCase();

      if (p.mediaMode === 'banner') {
        effectiveMediaMode = 'banner';
        if (p.bannerStyle) effectiveBannerStyle = p.bannerStyle;
        if (p.bannerBorderColor) effectiveBorderColor = p.bannerBorderColor;
      } else if (p.mediaMode === 'media') {
        effectiveMediaMode = 'media';
        if (p.mediaUrl) effectiveMediaUrl = p.mediaUrl;
      }
    }

    const titleText = resolveTpl(titleTpl);
    const subtitleText = resolveTpl(subtitleTpl);
    const anim = c.bannerAnimation || 'pop';
    const font = c.bannerFontFamily || 'var(--font-tech), monospace';

    if (effectiveMediaMode === 'banner') {
      box.innerHTML = `
        <div id="preview-alert-element" class="banner-alert-root banner-theme-${effectiveBannerStyle} anim-${anim}" style="--banner-border: ${effectiveBorderColor}; --banner-accent: ${effectiveBorderColor}; --banner-text: ${effectiveTextColor}; font-family: ${font};">
          <div class="banner-icon-box" style="width: 52px; height: 52px; font-size: 24px; display: flex; align-items: center; justify-content: center; border-color: ${effectiveBorderColor}66; color: ${effectiveBorderColor};">
            ${this.getAlertIconSvg(this.currentType, chosenPlat)}
          </div>
          <div class="banner-text-col" style="margin-left: 14px;">
            <div class="banner-badge-tag" style="color: ${effectiveBorderColor}; border-color: ${effectiveBorderColor}44;">
              ${effectiveBadge}
            </div>
            <div class="banner-primary-title" style="color: ${effectiveBorderColor}; font-size: 11px;">
              ${titleText}
            </div>
            <div class="banner-user-display" style="font-size: 22px; color: ${effectiveTextColor};">
              ${user}
            </div>
            ${subtitleText ? `<div class="banner-subtitle-msg" style="font-size: 11px;">${subtitleText}</div>` : ''}
          </div>
        </div>
      `;
    } else {
      // Modo Multimedia
      const isVideo = effectiveMediaUrl && (effectiveMediaUrl.endsWith('.webm') || effectiveMediaUrl.endsWith('.mp4'));
      box.innerHTML = `
        <div id="preview-alert-element" class="preview-media-container anim-${anim}" style="position: relative; width: 340px; text-align: center;">
          ${effectiveMediaUrl ? (isVideo ? `
            <video src="${effectiveMediaUrl}" autoplay loop muted playsinline style="max-width: 100%; max-height: 180px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);"></video>
          ` : `
            <img src="${effectiveMediaUrl}" style="max-width: 100%; max-height: 180px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);" alt="Media Preview">
          `) : `
            <div style="background: rgba(255,255,255,0.05); border: 2px dashed #475569; border-radius: 8px; padding: 24px; color: var(--color-text-dim); font-size: 11px;">
              [No has seleccionado archivo multimedia]<br>Elige un archivo de vídeo o GIF en el menú.
            </div>
          `}
          <div style="margin-top: 8px; display: inline-block; padding: 6px 14px; background: rgba(18, 22, 26, 0.94); border: 2px solid ${effectiveBorderColor}; border-radius: 6px; font-weight: 800; font-size: 12px; color: #FFF; box-shadow: 0 0 16px rgba(87, 214, 196, 0.3);">
            ${titleText}: ${user}
          </div>
        </div>
      `;
    }

    if (animate) {
      this.playPreviewAnimation();
    }
  },

  playPreviewAnimation() {
    const el = document.getElementById('preview-alert-element');
    if (!el) return;

    const c = this.config.alerts[this.currentType] || {};
    const anim = c.bannerAnimation || 'pop';

    // Eliminar clases y forzar reflow
    el.classList.remove('preview-play-anim');
    this.ANIMATIONS_LIST.forEach(a => el.classList.remove(`anim-${a.id}`));
    void el.offsetWidth;

    // Aplicar animación
    el.classList.add('preview-play-anim', `anim-${anim}`);

    // Si tiene sonido activado para preview, reproducir
    const soundChk = document.getElementById('cfg-preview-sound');
    if (soundChk && soundChk.checked && typeof AudioEngine !== 'undefined') {
      const soundMode = c.soundMode || 'synth';
      if (soundMode === 'synth') {
        const tone = c.synthTone || (this.currentType === 'donation' ? 'coin' : 'sub');
        AudioEngine.playChime(tone);
      } else if (soundMode === 'custom' && c.soundUrl) {
        const snd = new Audio(c.soundUrl);
        snd.volume = typeof c.soundVolume === 'number' ? (c.soundVolume / 100) : 0.8;
        snd.play().catch(() => {});
      }
    }
  },

  togglePreviewLoop(enabled) {
    if (this.previewLoopTimer) {
      clearInterval(this.previewLoopTimer);
      this.previewLoopTimer = null;
    }
    if (enabled) {
      this.playPreviewAnimation();
      this.previewLoopTimer = setInterval(() => {
        this.playPreviewAnimation();
      }, 4000);
    }
  },

  getAlertIconSvg(type, plat) {
    if (type === 'donation') {
      if (plat === 'kofi') return '☕';
      if (plat === 'paypal') return '🅿️';
      if (plat === 'buymeacoffee') return '🟡';
      return '💰';
    }
    const icons = {
      follow: '❤️',
      sub_prime: '👑',
      sub_t1: '⭐',
      sub_t2: '🌟',
      sub_t3: '💫',
      resub: '🔄',
      sub_gift: '🎁',
      sub_community_gift: '📦',
      cheer: '💎',
      raid: '🚀'
    };
    return icons[type] || '✨';
  },

  async saveConfig() {
    try {
      const res = await fetch('/api/alerts/config', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ alerts: this.config.alerts })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.showToast('✓ Configuración de alertas guardada con éxito.');
      } else {
        alert('Error al guardar: ' + (data.error || 'Respuesta inesperada'));
      }
    } catch (e) {
      alert('Error de conexión al guardar configuración de alertas: ' + e);
    }
  },

  async triggerCurrentTest() {
    const user = (document.getElementById('sim-user') || {}).value || 'AndorinaMaker';
    const extraVal = (document.getElementById('sim-extra-val') || {}).value || '10.00 EUR';
    const msg = (document.getElementById('sim-msg') || {}).value || '¡Saludos!';
    const chosenPlat = (document.getElementById('sim-plat-choice') || {}).value || 'kofi';

    const testPayload = {
      alertType: this.currentType,
      user: user,
      message: msg,
      months: extraVal,
      amount: extraVal,
      currency: 'EUR',
      viewers: extraVal,
      platform: chosenPlat
    };

    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(testPayload)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.showToast(`🚀 Alerta de [${this.currentType.toUpperCase()}] emitida a OBS`);
      } else {
        alert('Error en prueba: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Error enviando prueba: ' + e);
    }
  },

  showToast(msg) {
    let toast = document.getElementById('alerts-studio-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'alerts-studio-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.padding = '12px 20px';
      toast.style.background = '#1E293B';
      toast.style.color = '#57D6C4';
      toast.style.border = '1px solid #57D6C4';
      toast.style.borderRadius = '8px';
      toast.style.fontFamily = 'var(--font-tech, monospace)';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = '700';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      toast.style.zIndex = '9999';
      toast.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  AlertsStudio.init();
});
