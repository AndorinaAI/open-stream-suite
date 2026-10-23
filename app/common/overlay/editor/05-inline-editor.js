/**
 * app/common/overlay/editor/05-inline-editor.js
 * Edición visual sobre los elementos del DOM, salto rápido, persistencia y delegación de eventos.
 */

window.OSSEditor = window.OSSEditor || {};

(function() {
  const editableSelectors = [
    // Selector universal estándar para cualquier escena
    '[data-text-key]',
    '.editable-screen-element',
    // Marca del canal y estados de directo
    '.brand-name',
    '.brand-tagline',
    '.brand-box span',
    '.brand-info span',
    '.live-indicator span:last-child',
    '.live-indicator span:not(.live-dot)',
    '.live-status span:last-child',
    '[data-text-key="status"]',
    '.live-status',
    '[data-i18n="themes.placeholder_ss_status"]',
    '[data-i18n="themes.live_indicator"]',
    // Game / Esports / Stats / Speedrun
    '.game-mode-badge-under span:last-child',
    '.hud-header',
    '.stat-val',
    '.stat-item',
    '.victory-banner h1',
    '.timer-big',
    '.run-title',
    '.run-category',
    '.split-name',
    '.split-time',
    '.split-delta',
    '.pb-bar span',
    '.pb-bar',
    '.game-tag',
    '.cam-split .cam-label',
    '.floating-cam .cam-label',
    // Maker / Print / Art
    '.project-prefix',
    '.project-name-value',
    '.panel-project-name',
    '.panel-project-title',
    '.panel-project-phase',
    '.panel-project-detail',
    '.panel-title',
    '.info-label',
    '.info-value',
    '.frame-label span:last-child',
    '.frame-label',
    '.camera-label',
    '.phase-item',
    '.palette-box div',
    '.mode-badge span:last-child',
    '.canvas-cam div',
    // Chill / Chatting / Podcast / Cafe
    '.header-subtitle',
    '.chat-title',
    '.chat-title span:last-child',
    '.chat-topic',
    '.stream-tag',
    '.stream-tag span',
    '.topic-pill',
    '#lbl-topic',
    '.cam-label',
    '.chat-header',
    '.social-tag',
    '.top-banner',
    '.podcast-title',
    '.guest-nameplate',
    '.chill-footer-topic span',
    '.chill-footer-topic div',
    '.chat-card div',
    '.cam-polaroid',
    '.header-bar div',
    // Pomodoro / Estudio
    '.pomodoro-card div',
    '.pomo-time',
    // Starting Soon
    '.starting-hero-text > div:first-child',
    '.tag-line',
    '[data-i18n="themes.placeholder_ss_tag"]',
    '.starting-hero-text .main-stream-title',
    '.starting-hero-text .stream-subtitle',
    '.starting-footer > div:first-child',
    '.ss-mode-label',
    '.box h1',
    '.box p',
    '.box > div',
    '.card h1',
    '.card p',
    '.card > div',
    '.main-stream-title',
    '.stream-subtitle',
    // BRB
    '.brb-center-content .main-stream-title',
    '.brb-center-content .stream-subtitle',
    '.brb-status-phrase',
    '.brb-footer > div:first-child',
    // Ending
    '.ending-center-content .main-stream-title',
    '.ending-center-content .stream-subtitle',
    '.ending-farewell-card p',
    '.ending-farewell-card div',
    '.ending-footer > div:first-child',
    // Encabezados y textos generales
    'h1',
    'h2',
    'h3',
    '.footer-note',
    '.bottom-bar div',
    '.bottom-bar b',
    '.bottom-bar span',
    // Ventanas, cabeceras, estado técnico DEV: ACTIVE, info lateral y modos
    '.panel-header span',
    '.chat-panel-header span',
    '.win-header',
    '.win-header span',
    '.window-title',
    '.box-header span',
    '.card-header span',
    '.side-info-panel .info-row span',
    '.starting-side-modes > div:first-child',
    '.stream-mode-card span',
    // Cozy Lo-Fi Pack
    '.header-title span',
    '.header-title',
    '.ambient-pill span',
    '.ambient-pill',
    '.pomo-badge',
    '.pomo-time',
    '.tasks-header span',
    '.tasks-header',
    '.task-item span',
    '.task-item',
    '.canvas-tag span',
    '.canvas-tag',
    '.tools-palette-bar div',
    '.tools-palette-bar b',
    '.face-footer',
    '.project-card-title span',
    '.project-card-title',
    '.field-label',
    '.field-value',
    '.polaroid-handwritten span',
    '.polaroid-handwritten',
    '.polaroid-footer span',
    '.track-title',
    '.track-author',
    '.chat-header-title span',
    '.chat-header-title',
    '.chat-live-badge',
    '.cozy-author',
    '.cozy-text',
    '.goal-text span',
    '.goal-text',
    '.goal-count',
    // Gamer Pro Pack
    '.match-badge span',
    '.server-info',
    '.telemetry-pills div',
    '.telemetry-pills span',
    '.telemetry-pills .val',
    '.corner-reticle',
    '.hero-tag',
    '.side-panel-title',
    '.map-pill span',
    '.map-pill',
    '.side-panel-box div',
    '.side-panel-box strong',
    '.arena-bottom-bar div',
    '.social-links div',
    '.social-links span',
    '.arena-top-bar span',
    '.arena-top-bar div',
    // Open Stream Pack
    '.agenda-item span',
    '.agenda-item',
    '.pod-cam-box span',
    '.desktop-task-pill span',
    '.desktop-task-pill'
  ];

  let isEditing = false;
  let activeSceneKey = '';

  function populateQuickJump(quickJumpSelect) {
    if (!quickJumpSelect) return;
    quickJumpSelect.innerHTML = '<option value="">🎯 Ir a Texto...</option>';
    const items = document.querySelectorAll(editableSelectors.join(','));
    items.forEach((el, idx) => {
      const raw = el.textContent.trim().replace(/\s+/g, ' ');
      if (!raw) return;
      const shortText = raw.length > 20 ? raw.substring(0, 18) + '…' : raw;
      if (!el.dataset.quickEditId) {
        el.dataset.quickEditId = 'quick-edit-' + idx;
      }

      let tag = 'Texto';
      if (el.hasAttribute('data-text-key')) tag = el.getAttribute('data-text-key');
      else if (el.matches('.panel-header span:last-child, .chat-panel-header span:last-child, .server-info')) tag = 'Estado DEV/SYS';
      else if (el.matches('.panel-header span, .chat-panel-header span, .window-title, .win-header, .tasks-header, .project-card-title, .side-panel-title')) tag = 'Cabecera Ventana';
      else if (el.matches('.info-label, .field-label')) tag = 'Etiqueta Info';
      else if (el.matches('.info-value, .field-value')) tag = 'Valor Info';
      else if (el.matches('.stream-mode-card span, .ss-mode-label')) tag = 'Modo Emisión';
      else if (el.matches('.run-title, .run-category')) tag = 'Juego Speedrun';
      else if (el.matches('.split-name')) tag = 'Segmento';
      else if (el.matches('.split-time, .split-delta, .timer-big, .pomo-time, .starting-countdown')) tag = 'Tiempo';
      else if (el.matches('.pb-bar span, .pb-bar, .stat-item, .stat-val, .goal-count')) tag = 'Récord/Stat';
      else if (el.matches('.live-indicator span, .live-status span, [data-text-key="status"], .live-status, .live-indicator, .chat-live-badge, .match-badge span')) tag = 'Estado Live';
      else if (el.matches('.tag-line, .starting-hero-text > div:first-child, [data-i18n="themes.placeholder_ss_tag"], .game-tag, .hero-tag, .pomo-badge')) tag = 'Etiqueta';
      else if (el.matches('.project-name-value, .panel-project-name')) tag = 'Proyecto';
      else if (el.matches('.panel-project-phase')) tag = 'Fase Activa';
      else if (el.matches('.phase-item')) tag = 'Fase';
      else if (el.matches('.frame-label span:last-child, .frame-label, .camera-label, .cam-label, .canvas-tag span, .canvas-tag')) tag = 'Marco/Cámara';
      else if (el.matches('.panel-title')) tag = 'Título Panel';
      else if (el.matches('.project-prefix')) tag = 'Prefijo';
      else if (el.matches('.panel-project-detail')) tag = 'Notas';
      else if (el.matches('.brand-name')) tag = 'Streamer';
      else if (el.matches('.brand-tagline, .face-footer, .polaroid-handwritten')) tag = 'Lema/Firma';
      else if (el.matches('.hero-title, .main-stream-title')) tag = 'Título';
      else if (el.matches('.header-subtitle, .hero-subtitle, .stream-subtitle')) tag = 'Subtítulo';
      else if (el.matches('.brb-status-phrase')) tag = 'Frase Rotativa';
      else if (el.matches('.track-title, .track-author')) tag = 'Música Lofi';
      else if (el.matches('.task-item, .task-item span')) tag = 'Tarea Objetivo';
      else if (el.matches('.map-pill, .map-pill span')) tag = 'Mapa Veto';
      else if (el.matches('.ambient-pill span, .ambient-pill')) tag = 'Ambiente Cozy';
      else if (el.matches('.footer-note, .bottom-bar div, .starting-footer div, .arena-bottom-bar div')) tag = 'Pie de página';

      const opt = document.createElement('option');
      opt.value = el.dataset.quickEditId;
      opt.textContent = `✏️ ${tag}: "${shortText}"`;
      quickJumpSelect.appendChild(opt);
    });
  }

  async function saveTexts() {
    if (window.OSSEditor && typeof window.OSSEditor.saveTexts === 'function') {
      return await window.OSSEditor.saveTexts(activeSceneKey);
    }
  }

  function setupInlineEditor(hud, sceneKey) {
    activeSceneKey = sceneKey;

    const btnToggleEdit = hud.querySelector('#hud-btn-toggle-edit');
    const lblEditState = hud.querySelector('#hud-edit-state');
    const quickJumpSelect = hud.querySelector('#hud-quick-jump-select');
    const btnSave = hud.querySelector('#hud-btn-save-texts');
    const btnResetTexts = hud.querySelector('#hud-btn-reset-texts');

    // Registrar textos originales de fábrica en cada nodo para restauración inmediata
    document.querySelectorAll(editableSelectors.join(',')).forEach(el => {
      if (el.dataset.ossOriginalText === undefined && el.textContent) {
        el.dataset.ossOriginalText = el.textContent;
      }
    });

    if (btnSave) {
      btnSave.addEventListener('click', saveTexts);
    }

    if (quickJumpSelect) {
      quickJumpSelect.addEventListener('change', () => {
        const targetId = quickJumpSelect.value;
        if (!targetId) return;
        const targetEl = document.querySelector(`[data-quick-edit-id="${targetId}"]`);
        if (!targetEl) return;

        if (!isEditing && btnToggleEdit) {
          btnToggleEdit.click();
        }

        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.focus();

        try {
          const range = document.createRange();
          range.selectNodeContents(targetEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (err) {}

        window.OSSEditor.showHudToast(`✏️ Editando: ${targetEl.textContent.trim().substring(0, 25)}`);
      });
    }

    // Captura universal de clics cuando el modo edición está activo
    document.addEventListener('click', (e) => {
      if (!isEditing) return;
      if (e.target.closest('#oss-hud-editor') || e.target.closest('#oss-brb-phrases-control') || e.target.closest('.hud-toast') || e.target.closest('#open-stream-suite-screen-hud') || e.target.closest('#oss-countdown-control')) return;

      let leaf = e.target;
      // Si el elemento clicado contiene hijos, obtener el elemento hoja más específico bajo el cursor
      if (leaf.children.length > 0) {
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        if (hit && hit !== leaf && leaf.contains(hit)) {
          leaf = hit;
        }
      }

      if (leaf && !leaf.isContentEditable && leaf.textContent && leaf.textContent.trim().length > 0) {
        leaf.setAttribute('contenteditable', 'true');
        leaf.setAttribute('spellcheck', 'false');
        leaf.classList.add('editable-screen-element', 'editing-active');
        window.__OSS_IS_EDITING__ = true;
        leaf.focus();
      }
    }, true);

    if (btnToggleEdit) {
      btnToggleEdit.addEventListener('click', () => {
        isEditing = !isEditing;
        window.__OSS_IS_EDITING__ = isEditing;
        btnToggleEdit.classList.toggle('active-editing', isEditing);
        lblEditState.textContent = isEditing ? 'ON (ACTIVO)' : 'OFF';
        lblEditState.style.color = isEditing ? '#57D6C4' : '#FF783F';

        if (quickJumpSelect) {
          quickJumpSelect.style.display = isEditing ? 'inline-block' : 'none';
          if (isEditing) populateQuickJump(quickJumpSelect);
        }

        // Recolectar candidatos según lista y cualquier elemento con texto directo en el lienzo
        const allCandidates = new Set(document.querySelectorAll(editableSelectors.join(',')));
        const canvas = document.querySelector('.overlay-canvas') || document.body;
        canvas.querySelectorAll('*').forEach(el => {
          if (el.closest('#open-stream-suite-screen-hud') || el.closest('#oss-countdown-control') || el.closest('.hud-toast')) return;
          if (['SCRIPT', 'STYLE', 'SVG', 'PATH', 'MASK', 'DEFS', 'LINK'].includes(el.tagName)) return;
          for (let i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === Node.TEXT_NODE && el.childNodes[i].textContent.trim().length > 0) {
              allCandidates.add(el);
              break;
            }
          }
        });

        allCandidates.forEach(el => {
          el.classList.toggle('editable-screen-element', isEditing);
          el.classList.toggle('editing-active', isEditing);
          if (isEditing) {
            el.setAttribute('contenteditable', 'true');
            el.setAttribute('spellcheck', 'false');
            el.setAttribute('title', '✏️ Haz clic para editar o selecciónalo en el menú superior');
            
            el.onclick = (e) => {
              if (!isEditing) return;
              e.stopPropagation();
              el.focus();
            };
            el.onfocus = () => {
              if (!isEditing) return;
              window.__OSS_IS_EDITING__ = true;
              try {
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              } catch (err) {}
            };
            el.oninput = () => {
              window.__OSS_IS_EDITING__ = true;
            };
          } else {
            el.removeAttribute('contenteditable');
            el.removeAttribute('title');
            el.onclick = null;
            el.onfocus = null;
            el.oninput = null;
          }
        });

        if (isEditing) {
          window.OSSEditor.showHudToast('✏️ Haz clic en cualquier texto o usa "🎯 Ir a Texto" para editar');
        }
      });
    }

    // Botón de Restaurar textos a fábrica
    if (btnResetTexts) {
      btnResetTexts.addEventListener('click', async () => {
        let section = sceneKey || 'all';
        if (['startingSoon', 'oss_starting', 'gamer_starting', 'cozy_starting'].includes(sceneKey) || window.location.pathname.includes('/starting-soon/')) section = 'startingSoon';
        else if (['beRightBack', 'oss_brb', 'gamer_brb', 'cozy_brb'].includes(sceneKey) || window.location.pathname.includes('/be-right-back/') || window.location.pathname.includes('/coffee-break/')) section = 'beRightBack';
        else if (['ending', 'oss_ending', 'gamer_ending', 'cozy_ending'].includes(sceneKey) || window.location.pathname.includes('/ending/')) section = 'ending';
        else if (sceneKey === 'maker-desk' || sceneKey === 'maker-pc' || sceneKey === 'maker') section = 'maker';
        else if (sceneKey === 'print-machine' || sceneKey === 'print-design' || sceneKey === 'print') section = 'print';
        else if (sceneKey === 'game') section = 'game';
        else if (sceneKey === 'chill') section = 'chill';

        try {
          btnResetTexts.textContent = '⏳...';

          // 1. Restaurar textos originales en el DOM inmediatamente
          document.querySelectorAll(editableSelectors.join(',')).forEach(el => {
            if (el.dataset.ossOriginalText !== undefined) {
              el.textContent = el.dataset.ossOriginalText;
            }
          });

          // 2. Persistir en el servidor y limpiar customScenes con token local
          let localToken = window.__LOCAL_AUTH_TOKEN__ || (typeof localStorage !== 'undefined' ? localStorage.getItem('local_auth_token') : '') || '';
          if (!localToken) {
            try {
              const tokRes = await fetch('/api/local-token');
              if (tokRes.ok) {
                const tokData = await tokRes.json();
                localToken = tokData.token || '';
                if (localToken && typeof localStorage !== 'undefined') {
                  localStorage.setItem('local_auth_token', localToken);
                }
              }
            } catch (te) {}
          }

          const resetHeaders = { 'Content-Type': 'application/json' };
          if (localToken) resetHeaders['X-Local-Token'] = localToken;

          const res = await fetch('/api/overlays/texts/reset', {
            method: 'POST',
            headers: resetHeaders,
            body: JSON.stringify({ section, sceneKey })
          });
          const data = await res.json();
          if (data && data.status === 'ok') {
            window.OSS_CONFIG = data.texts;
            const applyFn = typeof applyConfigToDOM === 'function' ? applyConfigToDOM : (window._oss_applyConfigToDOM || (window.OSSOverlay && window.OSSOverlay.applyConfigToDOM));
            if (typeof applyFn === 'function') {
              applyFn(data.texts);
            }
            if (isEditing && quickJumpSelect) {
              populateQuickJump(quickJumpSelect);
            }
            window.OSSEditor.showHudToast(`↺ Textos restaurados a los originales de fábrica`);
          }
        } catch (e) {
          window.OSSEditor.showHudToast('⚠️ Error al restaurar textos');
        } finally {
          btnResetTexts.textContent = '↺ Restaurar Textos';
        }
      });
    }

    // Delegación universal de interacciones de escenas
    document.addEventListener('click', (e) => {
      // Delegación de eventos para Speedrun splits (.split-row)
      const splitRow = e.target.closest('.split-row');
      if (splitRow) {
        if (splitRow.isContentEditable && document.activeElement === splitRow) return;
        document.querySelectorAll('.split-row').forEach(sr => sr.classList.remove('active'));
        splitRow.classList.add('active');
        const sName = splitRow.querySelector('.split-name')?.textContent?.trim() || 'Tramo';
        window.OSSEditor.showHudToast(`⚡ Tramo activo: ${sName}`);
        return;
      }

      // Alternar delta positivo / negativo en Speedrun (.split-delta)
      const splitDelta = e.target.closest('.split-delta');
      if (splitDelta) {
        if (splitDelta.isContentEditable && document.activeElement === splitDelta) return;
        const isPos = splitDelta.classList.contains('positive');
        splitDelta.classList.toggle('positive', !isPos);
        splitDelta.classList.toggle('negative', isPos);
        let txt = splitDelta.textContent.trim();
        if (txt.startsWith('+')) txt = '-' + txt.slice(1);
        else if (txt.startsWith('-')) txt = '+' + txt.slice(1);
        splitDelta.textContent = txt;
        window.OSSEditor.showHudToast(`Delta ajustado a: ${txt}`);
        return;
      }

      // Alternar modos activos en Starting Soon (.starting-side-modes .stream-mode-card)
      const modeCard = e.target.closest('.starting-side-modes .stream-mode-card');
      if (modeCard) {
        if (modeCard.isContentEditable && document.activeElement === modeCard) return;
        const isOrange = modeCard.classList.contains('active-orange');
        const activeClass = isOrange ? 'active-orange' : 'active-cyan';
        modeCard.classList.toggle(activeClass);
        const lbl = modeCard.querySelector('.ss-mode-label')?.textContent?.trim() || 'Modo';
        window.OSSEditor.showHudToast(`🎯 Modo ${lbl} ${modeCard.classList.contains(activeClass) ? 'activado' : 'desactivado'}`);
        return;
      }

      // Clic en banner de victoria (Gamer Pro Pack)
      const victoryH1 = e.target.closest('.victory-banner h1');
      if (victoryH1) {
        if (victoryH1.isContentEditable && document.activeElement === victoryH1) return;
        const banners = [
          'VICTORY // CLUTCH',
          'DEFEAT // GG',
          'ACE // ROUND WON',
          'MATCH POINT // FINAL',
          'OVERTIME // SUDDEN DEATH'
        ];
        const cur = victoryH1.textContent.trim();
        let idx = banners.indexOf(cur);
        const next = banners[(idx + 1) % banners.length];
        victoryH1.textContent = next;
        window.OSSEditor.showHudToast(`🏆 Banner cambiado a: ${next}`);
        return;
      }

      // Clic en estadísticas de partida (Gamer Pro Pack HUD)
      const statVal = e.target.closest('.hud-stats-bar .stat-item');
      if (statVal) {
        if (statVal.isContentEditable && document.activeElement === statVal) return;
        const valSpan = statVal.querySelector('.stat-val');
        if (!valSpan) return;
        const isMatch = statVal.textContent.includes('MATCH');
        if (isMatch) {
          const matchTypes = ['COMPETITIVE', 'RANKED', 'TOURNAMENT', 'CASUAL', 'SCRIMS'];
          let cur = valSpan.textContent.trim();
          let idx = matchTypes.indexOf(cur);
          valSpan.textContent = matchTypes[(idx + 1) % matchTypes.length];
          window.OSSEditor.showHudToast(`🎮 Modo de partida: ${valSpan.textContent}`);
        } else {
          const fpsTypes = ['240', '360', '144', '120', '60'];
          let cur = valSpan.textContent.trim();
          let idx = fpsTypes.indexOf(cur);
          valSpan.textContent = fpsTypes[(idx + 1) % fpsTypes.length];
          window.OSSEditor.showHudToast(`⚡ FPS fijados a: ${valSpan.textContent}`);
        }
        return;
      }

      // Clic en webcam flotante para alternar esquinas (Open Stream Pack Desktop)
      const floatingCam = e.target.closest('.floating-cam');
      if (floatingCam) {
        if (e.target.closest('.cam-label') && e.target.closest('.cam-label').isContentEditable) return;
        const positions = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
        const cur = floatingCam.dataset.position || 'bottom-right';
        const next = positions[(positions.indexOf(cur) + 1) % positions.length];
        floatingCam.dataset.position = next;
        if (next === 'bottom-left') {
          floatingCam.style.bottom = '40px'; floatingCam.style.left = '40px'; floatingCam.style.right = 'auto'; floatingCam.style.top = 'auto';
        } else if (next === 'top-left') {
          floatingCam.style.top = '40px'; floatingCam.style.left = '40px'; floatingCam.style.bottom = 'auto'; floatingCam.style.right = 'auto';
        } else if (next === 'top-right') {
          floatingCam.style.top = '40px'; floatingCam.style.right = '40px'; floatingCam.style.bottom = 'auto'; floatingCam.style.left = 'auto';
        } else {
          floatingCam.style.bottom = '40px'; floatingCam.style.right = '40px'; floatingCam.style.top = 'auto'; floatingCam.style.left = 'auto';
        }
        window.OSSEditor.showHudToast(`📹 Webcam movida a: ${next.replace('-', ' ').toUpperCase()}`);
        return;
      }
    });
  }

  window.OSSEditor.saveTexts = saveTexts;
  window.OSSEditor.setupInlineEditor = setupInlineEditor;
  window.OSSEditor.populateQuickJump = populateQuickJump;
})();
