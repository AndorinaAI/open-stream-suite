/**
 * alerts-studio/03-controls.js — Controladores de campos, modos de medios y variables
 */
Object.assign(AlertsStudio, {
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
    // La casilla ya no dice solo "HABILITADA": nombra el tipo y su efecto.
    this.updateEnabledCard(!!c.enabled);
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

  /** Pinta la tarjeta de activación con el nombre REAL del tipo de alerta. */
  updateEnabledCard(enabled) {
    const card = document.getElementById('cfg-enabled-card');
    const title = document.getElementById('cfg-enabled-title');
    if (!card || !title) return;
    const type = (this.ALERT_TYPES || []).find(t => t.id === this.currentType);
    let name = (type && type.name) || this.currentType || '';
    if (type && window.i18n && window.i18n.tr) {
      name = window.i18n.tr('alerts.type_' + type.id) || name;
    }
    title.textContent = `Alerta de «${name}» ${enabled ? 'activa' : 'desactivada'}`;
    card.classList.toggle('is-on', enabled);
    card.classList.toggle('is-off', !enabled);
  },

  onFieldChange(field, val) {
    if (!this.config || !this.config.alerts[this.currentType]) return;
    this.config.alerts[this.currentType][field] = val;
    // Aviso de "cambios sin guardar" (el mapa vive en UI, sobrevive a re-render).
    if (window.UI && UI.markDirty) UI.markDirty('alert:' + this.currentType, 'alert');

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

  /**
   * Cambio de animación de la alerta.
   *
   * Vivía en `04-themes.js` junto al sistema legacy de 9 estilos. Ese fichero
   * se retiró (el tema es del pack) y esta función sigue siendo necesaria: el
   * select `#cfg-banner-anim` la llama directamente.
   */
  onAnimationChange(anim) {
    this.onFieldChange('bannerAnimation', anim);
    const animObj = (this.ANIMATIONS_LIST || []).find(a => a.id === anim);
    const animLbl = document.getElementById('lbl-preview-anim-name');
    if (animLbl && animObj) animLbl.textContent = animObj.name;
    if (typeof this.playPreviewAnimation === 'function') this.playPreviewAnimation();
  }
});
