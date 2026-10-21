// ====================================================================
// OVERLAY TEXTS - RENDERIZADO DEL FORMULARIO Y LISTAS DINÁMICAS
// ====================================================================

Object.assign(window.OverlayTexts, {
  renderForm(texts) {
    if (!texts) return;

    // 1. Identidad / Canal
    const ch = texts.channel || {};
    this.setValue('txt-channel-name', ch.name || '');
    this.setValue('txt-channel-tagline', ch.tagline || '');
    this.setChecked('txt-channel-visible', ch.visible !== false);
    this.setChecked('txt-channel-live-indicator', ch.showLiveIndicator !== false);
    this.setValue('txt-channel-live-text', ch.liveText || 'EN DIRECTO');

    const soc = ch.socials || {};
    this.setChecked('txt-socials-visible', soc.visible === true);
    this.setValue('txt-soc-twitch', soc.twitch || '');
    this.setValue('txt-soc-youtube', soc.youtube || '');
    this.setValue('txt-soc-twitter', soc.twitter || '');
    this.setValue('txt-soc-instagram', soc.instagram || '');
    this.setValue('txt-soc-github', soc.github || '');

    // 2. Modo Juego
    const gm = texts.game || {};
    this.setValue('txt-game-badge', gm.badgeText || 'GAME MODE');
    this.setValue('txt-game-tagline', gm.tagline || '');

    // 3. Modo Maker
    const mk = texts.maker || {};
    this.setValue('txt-maker-project', mk.projectName || '');
    this.setValue('txt-maker-phase', mk.currentPhase || '');
    this.setValue('txt-maker-panel-title', mk.panelTitle || 'ESTADO DEL PROYECTO');
    this.setValue('txt-maker-prefix', mk.projectPrefix || 'PROYECTO:');
    this.setValue('txt-maker-detail', mk.detail || '');
    const mkFrames = mk.frames || {};
    this.setValue('txt-maker-frame-main', mkFrames.main || 'CÁMARA PRINCIPAL · ESCENA');
    this.setValue('txt-maker-frame-face', mkFrames.face || 'STREAMER');
    this.setValue('txt-maker-frame-aux', mkFrames.aux || 'PC / TERMINAL');
    this.setChecked('txt-maker-aux', mk.showAuxView !== false);
    this.renderPhasesList('maker', mk.phases || []);

    // 4. Modo Print
    const pr = texts.print || {};
    this.setValue('txt-print-project', pr.projectName || '');
    this.setValue('txt-print-material', pr.material || '');
    this.setValue('txt-print-phase', pr.currentPhase || '');
    this.setValue('txt-print-panel-title', pr.panelTitle || 'TRABAJO DE CORTE / IMPRESIÓN');
    this.setValue('txt-print-prefix', pr.projectPrefix || 'TRABAJO:');
    const prFrames = pr.frames || {};
    this.setValue('txt-print-frame-main', prFrames.main || 'CÁMARA SECUNDARIA · PROCESO');
    this.setValue('txt-print-frame-face', prFrames.face || 'STREAMER');
    this.setValue('txt-print-frame-aux', prFrames.aux || 'SOFTWARE & CORTE');
    this.setChecked('txt-print-aux', pr.showAuxView !== false);
    this.renderPhasesList('print', pr.phases || []);

    // 5. Modo Chill
    const cl = texts.chill || {};
    this.setValue('txt-chill-subtitle', cl.subtitle || '');
    this.setValue('txt-chill-chat-title', cl.chatTitle || '');
    this.setValue('txt-chill-topic', cl.topic || '');
    this.setValue('txt-chill-chat-prompt', cl.chatPrompt || '');
    this.setChecked('txt-chill-show-chat', cl.showChatPanel !== false);

    // 6. Starting Soon
    const ss = texts.startingSoon || {};
    this.setValue('txt-ss-hero-tag', ss.heroTag || '');
    this.setValue('txt-ss-title', ss.title || '');
    this.setValue('txt-ss-highlight', ss.highlight || '');
    this.setValue('txt-ss-subtitle', ss.subtitle || '');
    this.setValue('txt-ss-countdown', ss.countdownMinutes ?? 5);
    this.setValue('txt-ss-footer', ss.footerNote || ss.footer || '');
    this.setValue('txt-ss-live-status', ss.liveStatusText || 'TRANSMISIÓN INICIANDO');
    const defaultModes = ['01 // GAME', '02 // MAKER', '03 // PRINT', '04 // CHILL'];
    const modeLabels = Array.isArray(ss.modeLabels) ? ss.modeLabels : [];
    [0, 1, 2, 3].forEach(i => this.setValue(`txt-ss-mode-${i}`, modeLabels[i] || defaultModes[i] || ''));

    // 7. Be Right Back
    const brb = texts.beRightBack || {};
    this.setValue('txt-brb-title', brb.title || '');
    this.setValue('txt-brb-subtitle', brb.subtitle || '');
    this.setValue('txt-brb-interval', brb.phraseIntervalSeconds ?? 6);
    this.setValue('txt-brb-footer', brb.footerNote || brb.footer || '');
    this.setValue('txt-brb-live-status', brb.liveStatusText || 'PAUSA TÉCNICA');
    this.renderBrbPhrasesList(brb.statusPhrases || []);

    // 8. Ending
    const ed = texts.ending || {};
    this.setValue('txt-end-title', ed.title || '');
    this.setValue('txt-end-subtitle', ed.subtitle || '');
    this.setValue('txt-end-farewell', ed.farewellMessage || ed.farewellText || '');
    this.setValue('txt-end-farewell-tag', ed.farewellTag || '');
    this.setValue('txt-end-footer', ed.footerNote || ed.footer || '');
    this.setValue('txt-end-live-status', ed.liveStatusText || 'FIN DE TRANSMISIÓN');
  },

  renderPhasesList(mode, phases) {
    const container = document.getElementById(`txt-${mode}-phases-list`);
    if (!container) return;
    container.innerHTML = '';

    phases.forEach((phase, index) => {
      const chip = document.createElement('div');
      chip.className = 'text-phase-chip';
      chip.innerHTML = `
        <span class="phase-chip-num">${String(index + 1).padStart(2, '0')}</span>
        <input type="text" class="phase-chip-input" value="${this.escapeHtml(phase)}" onchange="OverlayTexts.updatePhase('${mode}', ${index}, this.value)">
        <button type="button" class="phase-chip-del" title="Eliminar fase" onclick="OverlayTexts.removePhase('${mode}', ${index})">✕</button>
      `;
      container.appendChild(chip);
    });
  },

  addPhase(mode) {
    if (!this.currentTexts) return;
    if (!this.currentTexts[mode]) this.currentTexts[mode] = {};
    if (!Array.isArray(this.currentTexts[mode].phases)) this.currentTexts[mode].phases = [];

    const nextNum = String(this.currentTexts[mode].phases.length + 1).padStart(2, '0');
    this.currentTexts[mode].phases.push(`${nextNum} NUEVA FASE`);
    this.renderPhasesList(mode, this.currentTexts[mode].phases);
  },

  updatePhase(mode, index, value) {
    if (this.currentTexts?.[mode]?.phases) {
      this.currentTexts[mode].phases[index] = value;
    }
  },

  removePhase(mode, index) {
    if (this.currentTexts?.[mode]?.phases) {
      this.currentTexts[mode].phases.splice(index, 1);
      this.renderPhasesList(mode, this.currentTexts[mode].phases);
    }
  },

  renderBrbPhrasesList(phrases) {
    const container = document.getElementById('txt-brb-phrases-list');
    if (!container) return;
    container.innerHTML = '';

    phrases.forEach((phrase, index) => {
      const row = document.createElement('div');
      row.className = 'text-phrase-row';
      row.innerHTML = `
        <span class="phrase-row-icon">💬</span>
        <input type="text" class="form-input phrase-row-input" value="${this.escapeHtml(phrase)}" onchange="OverlayTexts.updateBrbPhrase(${index}, this.value)">
        <button type="button" class="btn-action-test" style="color: #F87171; border-color: rgba(248, 113, 113, 0.4);" onclick="OverlayTexts.removeBrbPhrase(${index})">✕ Eliminar</button>
      `;
      container.appendChild(row);
    });
  },

  addBrbPhrase() {
    if (!this.currentTexts) return;
    if (!this.currentTexts.beRightBack) this.currentTexts.beRightBack = {};
    if (!Array.isArray(this.currentTexts.beRightBack.statusPhrases)) {
      this.currentTexts.beRightBack.statusPhrases = [];
    }
    this.currentTexts.beRightBack.statusPhrases.push('NUEVA FRASE EN ROTACIÓN...');
    this.renderBrbPhrasesList(this.currentTexts.beRightBack.statusPhrases);
  },

  updateBrbPhrase(index, value) {
    if (this.currentTexts?.beRightBack?.statusPhrases) {
      this.currentTexts.beRightBack.statusPhrases[index] = value;
    }
  },

  removeBrbPhrase(index) {
    if (this.currentTexts?.beRightBack?.statusPhrases) {
      this.currentTexts.beRightBack.statusPhrases.splice(index, 1);
      this.renderBrbPhrasesList(this.currentTexts.beRightBack.statusPhrases);
    }
  }
});
