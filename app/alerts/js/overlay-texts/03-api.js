// ====================================================================
// OVERLAY TEXTS - RECOLECCIÓN DE DATOS, API PERSISTENCE Y RESTAURACIÓN
// ====================================================================

Object.assign(window.OverlayTexts, {
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
  }
});
