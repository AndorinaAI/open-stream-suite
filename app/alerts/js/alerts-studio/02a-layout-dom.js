/**
 * alerts-studio/02a-layout-dom.js — Plantilla estructural HTML y secciones del Estudio de Alertas
 */

window.AlertsStudio = window.AlertsStudio || {};

Object.assign(AlertsStudio, {
  renderStudio() {
    const container = document.getElementById('sec-alerts');
    if (!container) return;

    container.innerHTML = `
      <div class="section-header" style="margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
          <div>
            <h1 class="section-title" style="display: flex; align-items: center; gap: 10px;">
              <span>🚨</span> <span data-i18n="alerts.studio_title">ESTUDIO DE ALERTAS EN DIRECTO</span>
              <span class="badge-pill" style="font-size: 11px; background: rgba(87, 214, 196, 0.2); color: #57D6C4; border: 1px solid #57D6C4;" data-i18n="alerts.studio_badge">OBS v2.0 // MOTOR DE TEMAS Y ANIMACIÓN</span>
            </h1>
            <div class="section-subtitle" data-i18n="alerts.studio_subtitle">
              Personaliza el banner, vídeo o gif por plataforma de donación, edita o sustituye temas de diseño y reproduce animaciones en vivo en la previsualización.
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-action-primary" onclick="AlertsStudio.saveConfig()" style="display: flex; align-items: center; gap: 6px;" data-i18n="alerts.btn_save_config">
              💾 Guardar Configuración
            </button>
            <button class="btn-action-test" onclick="AlertsStudio.triggerCurrentTest()" style="border-color: #57D6C4; color: #57D6C4; display: flex; align-items: center; gap: 6px;" data-i18n="alerts.btn_trigger_obs">
              🚀 Disparar en OBS
            </button>
            <button class="btn-action-copy" onclick="copyText(window.location.origin + '/alerts/index.html')" data-i18n="alerts.btn_copy_url">
              📋 Copiar URL para OBS
            </button>
          </div>
        </div>
      </div>

      <!-- Selector de Tipo de Alerta (Tabs Horizontales) -->
      <div id="alerts-type-tabs" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 16px; scrollbar-width: thin;">
        ${this.ALERT_TYPES.map(t => {
          const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
          const locName = tr('alerts.type_' + t.id, t.name);
          return `
          <button type="button" 
            id="tab-alert-${t.id}" 
            class="btn-stage-preset" 
            style="display: flex; align-items: center; gap: 6px; white-space: nowrap; padding: 8px 14px; font-size: 12px; border-radius: 6px; transition: all 0.2s ease;"
            onclick="AlertsStudio.selectType('${t.id}')">
            <span>${t.icon}</span>
            <span data-i18n="alerts.type_${t.id}">${locName}</span>
          </button>
        `}).join('')}
      </div>

      <!-- TEMA DEL PACK (card y banner) — acordeon: una linea cerrada -->
      <details class="component-themes-accordion" id="alert-themes-accordion" style="margin-bottom: 18px;">
        <summary>
          🎨 TEMA DEL PACK — tarjeta y banner
        </summary>
        <div class="component-themes-accordion__body">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
            <div style="font-size:11px; color:var(--color-text-dim); line-height:1.5;">
              Asigna un <strong>tema de pack</strong> y una <strong>forma</strong> a la tarjeta y al banner.
              Manda sobre «Estilo de la alerta» cuando está asignado.
            </div>
            <button type="button" class="btn-action-test" style="font-size:10px; padding:3px 8px;" onclick="ComponentThemes.load({ force: true })" data-i18n="common.refresh">↻ Actualizar</button>
          </div>
          <div id="alert-themes-panel" style="display:flex; flex-direction:column; gap:8px;"></div>
        </div>
      </details>

      <!-- Grid Principal: Configuración a la izquierda, Vista Previa Interactiva y Simulador a la derecha -->
      <div class="grid-2col" style="grid-template-columns: 1.25fr 0.95fr; gap: 20px;">
        
        <!-- COLUMNA IZQUIERDA: CONFIGURACIÓN DINÁMICA -->
        <div class="dash-card" style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Encabezado del tipo activo y switch de activación -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border-dim); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span id="cfg-active-icon" style="font-size: 26px;">❤️</span>
              <div>
                <div id="cfg-active-title" style="font-family: var(--font-tech); font-weight: 800; font-size: 16px; color: var(--color-text-light);" data-i18n="alerts.config_title">
                  CONFIGURACIÓN DE ALERTA
                </div>
                <div id="cfg-active-desc" style="font-size: 11px; color: var(--color-text-dim);">
                  Modifica los textos, aspecto visual, temas, archivos multimedia y capas de audio.
                </div>
              </div>
            </div>
            
            <label class="alert-enabled-card is-on" id="cfg-enabled-card" for="cfg-enabled">
              <input type="checkbox" id="cfg-enabled" aria-describedby="cfg-enabled-help"
                     onchange="AlertsStudio.onFieldChange('enabled', this.checked); AlertsStudio.updateEnabledCard(this.checked)">
              <span>
                <span class="alert-enabled-card__title" id="cfg-enabled-title">Alerta activa</span>
                <span class="alert-enabled-card__help" id="cfg-enabled-help" data-i18n="alerts.enabled_help">
                  Si la desactivas, esta alerta deja de dispararse en OBS y en el panel. No borra su configuracion.
                </span>
              </span>
            </label>
          </div>

          <!-- Selector de Modo de Renderizado General: Banner Procedural vs Multimedia Propio -->
          <div>
            <label style="font-size: 11px; font-family: var(--font-tech); color: var(--color-text-dim); text-transform: uppercase; margin-bottom: 8px; display: block;" data-i18n="alerts.mode_label">
              MODO DE VISUALIZACIÓN PRINCIPAL:
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <button type="button" id="btn-mode-banner" class="btn-stage-preset" style="padding: 10px; text-align: left; display: flex; flex-direction: column; gap: 3px;" onclick="AlertsStudio.setMediaMode('banner')">
                <span style="font-weight: 800; font-size: 13px; color: #57D6C4;" data-i18n="alerts.mode_banner">🎨 Creador por Banner</span>
                <span style="font-size: 10px; color: var(--color-text-dim); line-height: 1.3;" data-i18n="alerts.mode_banner_desc">Estilos procedurales, temas visuales, rápido y ligero.</span>
              </button>
              <button type="button" id="btn-mode-media" class="btn-stage-preset" style="padding: 10px; text-align: left; display: flex; flex-direction: column; gap: 3px;" onclick="AlertsStudio.setMediaMode('media')">
                <span style="font-weight: 800; font-size: 13px; color: #F59E0B;" data-i18n="alerts.mode_media">🎬 Multimedia Propio</span>
                <span style="font-size: 10px; color: var(--color-text-dim); line-height: 1.3;" data-i18n="alerts.mode_media_desc">Vídeos WebM/MP4, GIFs, imágenes con audio nativo o superpuesto.</span>
              </button>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- SECCIÓN: SISTEMA Y MOTOR DE TEMAS DE ALERTAS                   -->
          <!-- ============================================================== -->
          <div id="panel-banner-options" style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <span style="font-family: var(--font-tech); font-size: 12px; font-weight: 800; color: #57D6C4;" data-i18n="alerts.themes_title">
                  🎭 ESTILO DE LA ALERTA (sin tema del pack)
                </span>
                <div style="font-size: 10px; color: var(--color-text-dim); margin-top: 2px;">
                  Aspecto propio de esta alerta. Se usa cuando <strong>no</strong> hay un tema del pack asignado (arriba).
                  Elige uno, edita sus valores, o guárdalo como nuevo.
                </div>
              </div>
              
              <div style="display: flex; gap: 6px; align-items: center;">
                <button type="button" class="btn-action-test" style="padding: 4px 10px; font-size: 10px; border-color: #A855F7; color: #D8B4FE;" onclick="AlertsStudio.applyThemeToAll()" title="Aplica este tema a TODAS las alertas de tu canal" data-i18n="alerts.btn_apply_all">
                  🌐 Aplicar a TODAS
                </button>
                <button type="button" class="btn-action-test" id="btn-chat-link" style="padding: 4px 10px; font-size: 10px;" onclick="AlertsStudio.toggleChatLink()">
                  🔗 Linkear con Chat
                </button>
              </div>
            </div>

            <!-- Galería de Temas con Previews Visuales -->
            <!-- OCULTA: los temas vienen del pack (acordeón de arriba). El
                 sistema de 9 estilos predefinidos se retira en el paso 9 del
                 plan; aquí solo se deja de mostrar para no ofrecer dos
                 catálogos que se contradicen. -->
            <div id="themes-preset-gallery" style="display: none;" aria-hidden="true">
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
              
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; padding: 4px 10px; border-radius: 14px;">
                <input type="checkbox" id="cfg-donation-per-platform" onchange="AlertsStudio.toggleDonationPerPlatform(this.checked)">
                <span style="font-weight: 700; color: #A7F3D0;">Activar personalización por plataforma</span>
              </label>
            </div>

            <div id="donation-platforms-container" style="display: none; flex-direction: column; gap: 12px;">
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="btn-stage-preset" id="subtab-plat-kofi" onclick="AlertsStudio.selectDonationPlatform('kofi')">☕ Ko-fi</button>
                <button type="button" class="btn-stage-preset" id="subtab-plat-paypal" onclick="AlertsStudio.selectDonationPlatform('paypal')">🅿️ PayPal</button>
                <button type="button" class="btn-stage-preset" id="subtab-plat-buymeacoffee" onclick="AlertsStudio.selectDonationPlatform('buymeacoffee')">🟡 Buy Me a Coffee</button>
                <button type="button" class="btn-stage-preset" id="subtab-plat-streamlabs" onclick="AlertsStudio.selectDonationPlatform('streamlabs')">⚡ Streamlabs</button>
              </div>

              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
                  <span style="font-size: 12px; font-weight: 800; color: #57D6C4;" id="lbl-active-plat-title">Configuración para: Ko-fi</span>
                  <span class="badge-pill" id="lbl-active-plat-badge-pill" style="font-size: 9px; background: rgba(0,0,0,0.4);">MODO: HEREDADO</span>
                </div>

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

                <div id="plat-banner-box" style="display: none; background: rgba(255,255,255,0.02); border: 1px dashed rgba(87,214,196,0.3); border-radius: 6px; padding: 10px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 10px;">Tema del banner</label>
                      <div style="font-size: 10px; color: var(--color-text-dim); line-height: 1.4; border: 1px dashed var(--color-border-dim); border-radius: 4px; padding: 6px;">
                        Se elige en el acordeón <strong>🎨 Tema del pack</strong>, en el miembro
                        <em>banner</em>. Aquí solo se personaliza el color.
                      </div>
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
          
          <!-- Escenario de Vista Previa -->
          <div class="dash-card" style="padding: 16px; background: #0A0D10; border: 1px solid #1E293B;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-family: var(--font-tech); font-size: 11px; font-weight: 800; color: #57D6C4; letter-spacing: 1px;">
                  👁️ VISTA PREVIA (OBS CANVAS)
                </span>
                <span class="badge-pill" style="font-size: 9px; background: rgba(0,0,0,0.4); border: 1px solid #334155;">100% FIEL</span>
              </div>

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
              <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 20px 20px; pointer-events: none;"></div>
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
              <span class="card-header-title" data-i18n="alerts.sim_title">🧪 SIMULADOR DE PRUEBA EN VIVO</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;" data-i18n="alerts.sim_label_user">Nombre de Usuario / Donante:</label>
                <input type="text" id="sim-user" class="form-input" value="AndorinaDev" oninput="AlertsStudio.updatePreview(true)">
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label id="sim-extra-label" style="font-size: 10px;" data-i18n="alerts.sim_label_amount">Valor / Cantidad:</label>
                <input type="text" id="sim-extra-val" class="form-input" value="10.00 EUR" oninput="AlertsStudio.updatePreview(true)">
              </div>
            </div>

            <div id="sim-plat-selector-row" style="display: none; margin-bottom: 10px;">
              <label style="font-size: 10px;" data-i18n="alerts.sim_label_platform">Pasarela de Donación para Prueba:</label>
              <select id="sim-plat-choice" class="form-input" style="font-size: 11px;" onchange="AlertsStudio.onSimPlatChange(this.value)">
                <option value="kofi">☕ Ko-fi</option>
                <option value="paypal">🅿️ PayPal</option>
                <option value="buymeacoffee">🟡 Buy Me a Coffee</option>
                <option value="streamlabs">⚡ Streamlabs</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label style="font-size: 10px;" data-i18n="alerts.sim_label_msg">Mensaje / Nota del Espectador:</label>
              <input type="text" id="sim-msg" class="form-input" value="¡Gran stream! ¡Sigue así!" data-i18n-value="alerts.sim_default_msg" oninput="AlertsStudio.updatePreview(true)">
            </div>

            <button type="button" class="btn-action-primary" style="width: 100%; padding: 12px; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="AlertsStudio.triggerCurrentTest()" data-i18n="alerts.btn_fire_obs">
              <span>🚀</span> DISPARAR ALERTA EN OBS AHORA
            </button>
          </div>
        </div>

      </div>
    `;

    // El bloque de temas se recrea con la sección: refrescarlo aquí.
    if (window.ComponentThemes) setTimeout(() => ComponentThemes.load(), 0);

    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(container);
    }
  }
});
