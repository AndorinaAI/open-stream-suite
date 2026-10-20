// ====================================================================
// OVERLAY TEXTS - PERSONALIZADOR CENTRALIZADO DE TEXTOS DE ESCENAS
// ====================================================================

const OverlayTexts = {
  currentTexts: null,
  activeTab: 'channel',

  async init() {
    this.bindTabEvents();
    await this.load();
  },

  bindTabEvents() {
    const tabs = document.querySelectorAll('.text-scene-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        this.switchTab(target);
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.text-scene-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.target === tabId);
    });
    document.querySelectorAll('.text-tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `text-pane-${tabId}`);
    });
  },

  async load() {
    try {
      const res = await API.getOverlayTexts();
      if (res && res.texts) {
        this.currentTexts = JSON.parse(JSON.stringify(res.texts));
        this.renderForm(this.currentTexts);
      }
    } catch (e) {
      console.error('Error cargando textos de overlays:', e);
      this.showToast('⚠️ No se pudieron cargar los textos desde el servidor', 'error');
    }
  },

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

  setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  },

  setChecked(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
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
  },

  collectFormData() {
    const elVal = id => (document.getElementById(id)?.value ?? '').trim();
    const elChecked = id => !!document.getElementById(id)?.checked;
    const elNum = (id, def = 0) => {
      const v = parseFloat(document.getElementById(id)?.value);
      return isNaN(v) ? def : v;
    };

    const makerPhases = [];
    document.querySelectorAll('#txt-maker-phases-list .phase-chip-input').forEach(inp => {
      if (inp.value.trim()) makerPhases.push(inp.value.trim());
    });

    const printPhases = [];
    document.querySelectorAll('#txt-print-phases-list .phase-chip-input').forEach(inp => {
      if (inp.value.trim()) printPhases.push(inp.value.trim());
    });

    const brbPhrases = [];
    document.querySelectorAll('#txt-brb-phrases-list .phrase-row-input').forEach(inp => {
      if (inp.value.trim()) brbPhrases.push(inp.value.trim());
    });

    return {
      channel: {
        name: elVal('txt-channel-name') || 'ANDORINA',
        tagline: elVal('txt-channel-tagline') || 'JUGAR · CREAR · COMPARTIR',
        visible: elChecked('txt-channel-visible'),
        showLiveIndicator: elChecked('txt-channel-live-indicator'),
        liveText: elVal('txt-channel-live-text') || 'EN DIRECTO',
        socials: {
          visible: elChecked('txt-socials-visible'),
          twitch: elVal('txt-soc-twitch'),
          youtube: elVal('txt-soc-youtube'),
          twitter: elVal('txt-soc-twitter'),
          instagram: elVal('txt-soc-instagram'),
          github: elVal('txt-soc-github')
        }
      },
      game: {
        badgeText: elVal('txt-game-badge') || 'GAME MODE',
        tagline: elVal('txt-game-tagline')
      },
      maker: {
        projectName: elVal('txt-maker-project') || 'NAS CON RASPBERRY PI',
        currentPhase: elVal('txt-maker-phase') || '02 MONTAJE',
        panelTitle: elVal('txt-maker-panel-title') || 'ESTADO DEL PROYECTO',
        projectPrefix: elVal('txt-maker-prefix') || 'PROYECTO:',
        detail: elVal('txt-maker-detail') || 'Armbian OS · PCB v1.2 · Caja a medida',
        frames: {
          main: elVal('txt-maker-frame-main') || 'CÁMARA PRINCIPAL · ESCENA',
          face: elVal('txt-maker-frame-face') || 'STREAMER',
          aux: elVal('txt-maker-frame-aux') || 'PC / TERMINAL'
        },
        phases: makerPhases.length ? makerPhases : ['01 PLAN', '02 MONTAJE', '03 SOFTWARE', '04 PRUEBAS'],
        showAuxView: elChecked('txt-maker-aux')
      },
      print: {
        projectName: elVal('txt-print-project') || 'PEGATINAS PERSONALIZADAS',
        material: elVal('txt-print-material') || 'Vinilo Holográfico Adhesivo',
        currentPhase: elVal('txt-print-phase') || 'CORTE DE VINILO',
        panelTitle: elVal('txt-print-panel-title') || 'TRABAJO DE CORTE / IMPRESIÓN',
        projectPrefix: elVal('txt-print-prefix') || 'TRABAJO:',
        frames: {
          main: elVal('txt-print-frame-main') || 'CÁMARA SECUNDARIA · PROCESO',
          face: elVal('txt-print-frame-face') || 'STREAMER',
          aux: elVal('txt-print-frame-aux') || 'SOFTWARE & CORTE'
        },
        phases: printPhases.length ? printPhases : ['01 DISEÑO', '02 CORTE', '03 PELADO', '04 APLICACIÓN'],
        showAuxView: elChecked('txt-print-aux')
      },
      chill: {
        subtitle: elVal('txt-chill-subtitle') || 'CHARLA / DUDAS / IDEAS / COMUNIDAD',
        showChatPanel: elChecked('txt-chill-show-chat'),
        chatTitle: elVal('txt-chill-chat-title') || 'CHAT EN DIRECTO',
        topic: elVal('txt-chill-topic') || 'Tema de hoy, proyectos y preguntas del chat',
        chatPrompt: elVal('txt-chill-chat-prompt') || '¡Escribe en el chat para participar!'
      },
      startingSoon: {
        heroTag: elVal('txt-ss-hero-tag') || '// STREAM EN DIRECTO',
        title: elVal('txt-ss-title') || 'ENSEGUIDA',
        highlight: elVal('txt-ss-highlight') || 'ESTAMOS EN DIRECTO',
        subtitle: elVal('txt-ss-subtitle') || 'PREPARANDO EL DIRECTO...',
        countdownMinutes: elNum('txt-ss-countdown', 5),
        footerNote: elVal('txt-ss-footer') || 'ESTACIÓN DE TRABAJO · LINUX / OBS STUDIO / RASPBERRY PI',
        liveStatusText: elVal('txt-ss-live-status') || 'TRANSMISIÓN INICIANDO',
        modeLabels: [0, 1, 2, 3].map(i => elVal(`txt-ss-mode-${i}`)).filter(Boolean).length
          ? [0, 1, 2, 3].map(i => elVal(`txt-ss-mode-${i}`) || ['01 // GAME','02 // MAKER','03 // PRINT','04 // CHILL'][i])
          : ['01 // GAME', '02 // MAKER', '03 // PRINT', '04 // CHILL'],
        showModesOverview: true
      },
      beRightBack: {
        title: elVal('txt-brb-title') || 'AHORA VUELVO',
        subtitle: elVal('txt-brb-subtitle') || 'UN MOMENTO...',
        statusPhrases: brbPhrases.length ? brbPhrases : [
          'TOMANDO UN CAFÉ...',
          'PREPARANDO TODO...',
          'PROBANDO COSAS...',
          'VOLVEMOS ENSEGUIDA'
        ],
        phraseIntervalSeconds: elNum('txt-brb-interval', 6),
        footerNote: elVal('txt-brb-footer') || 'EL DIRECTO CONTINÚA EN BREVES INSTANTES',
        liveStatusText: elVal('txt-brb-live-status') || 'PAUSA TÉCNICA'
      },
      ending: {
        title: elVal('txt-end-title') || 'GRACIAS POR PASARTE',
        subtitle: elVal('txt-end-subtitle') || 'NOS VEMOS EN EL PRÓXIMO DIRECTO',
        farewellMessage: elVal('txt-end-farewell') || '¡Gracias por acompañar el stream! Nos vemos en el próximo directo.',
        farewellTag: elVal('txt-end-farewell-tag') || '// SIGUE TRASTEANDO Y CREANDO',
        footerNote: elVal('txt-end-footer') || 'ANDORINA · OPEN STREAM SUITE · TRANSMISIÓN FINALIZADA',
        liveStatusText: elVal('txt-end-live-status') || 'FIN DE TRANSMISIÓN'
      },
      performance: {
        enableAnimations: true
      }
    };
  },

  async save() {
    const saveBtn = document.getElementById('btn-save-overlay-texts');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '⏳ Guardando y Transmitiendo...';
    }

    try {
      const texts = this.collectFormData();
      const res = await API.saveOverlayTexts(texts);
      if (res && res.status === 'ok') {
        this.currentTexts = texts;
        this.showToast('✅ ¡Textos guardados y sincronizados con OBS al instante!', 'success');
      } else {
        throw new Error(res?.error || 'Respuesta no válida del servidor');
      }
    } catch (e) {
      console.error('Error guardando textos:', e);
      this.showToast('❌ Error al guardar los textos: ' + (e.message || e), 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Guardar y Aplicar en Directo';
      }
    }
  },

  async reset(section = 'all') {
    try {
      const res = await fetch('/api/overlays/texts/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section })
      });
      const data = await res.json();
      if (data && data.status === 'ok') {
        this.currentTexts = data.texts;
        this.renderForm(data.texts);
        if (typeof updateSceneModalPreviewLive === 'function') {
          updateSceneModalPreviewLive();
        }
        this.showToast(section === 'all' ? '↺ Textos de todas las escenas restaurados a valores originales' : `↺ Textos de "${section}" restaurados a los originales de fábrica`, 'success');
      }
    } catch (e) {
      console.error('Error al resetear textos:', e);
      this.showToast('❌ Error al restaurar textos', 'error');
    }
  },

  showToast(msg, type = 'info') {
    let toast = document.getElementById('overlay-texts-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'overlay-texts-toast';
      toast.className = 'overlay-texts-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `overlay-texts-toast show ${type}`;
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};

window.OverlayTexts = OverlayTexts;
