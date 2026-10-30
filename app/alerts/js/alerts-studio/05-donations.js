/**
 * alerts-studio/05-donations.js — Configuración multiplataforma de donaciones y vinculación de chat
 */
Object.assign(AlertsStudio, {
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
    const mUrlInput = document.getElementById('cfg-plat-media-url');
    const sndModeInput = document.getElementById('cfg-plat-sound-mode');
    const pEmojiInput = document.getElementById('cfg-plat-particle-emoji');

    if (tInput) tInput.value = platData.titleTemplate || '';
    if (sInput) sInput.value = platData.subtitleTemplate || '';
    if (badgeInput) badgeInput.value = platData.badge || plat.toUpperCase();
    if (bColorInput) bColorInput.value = platData.bannerBorderColor || '#57D6C4';
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
});
