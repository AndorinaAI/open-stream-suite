/**
 * app/common/overlay/editor/05a-extract-texts.js
 * Extracción universal de datos y guardado persistente de textos de overlays vía API.
 */

window.OSSEditor = window.OSSEditor || {};

(function() {
  function collectSceneTexts(sceneKey, texts) {
    const brandName = document.querySelector('.brand-name')?.textContent?.trim();
    const brandTagline = document.querySelector('.brand-tagline')?.textContent?.trim();
    const liveText = document.querySelector('.live-indicator span:last-child, .live-status span:last-child, [data-text-key="status"], .live-status')?.textContent?.trim();

    if (texts.channel) {
      if (brandName) texts.channel.name = brandName;
      if (brandTagline) texts.channel.tagline = brandTagline;
      if (liveText) texts.channel.liveText = liveText;
    }

    const isStartingScene = ['startingSoon', 'oss_starting', 'gamer_starting', 'cozy_starting'].includes(sceneKey)
      || window.location.pathname.includes('/starting-soon/');
    const isBRBScene = ['beRightBack', 'oss_brb', 'gamer_brb', 'cozy_brb'].includes(sceneKey)
      || window.location.pathname.includes('/be-right-back/')
      || window.location.pathname.includes('/coffee-break/');
    const isEndingScene = ['ending', 'oss_ending', 'gamer_ending', 'cozy_ending'].includes(sceneKey)
      || window.location.pathname.includes('/ending/');
    const isGameScene = ['game', 'gamer_gameplay', 'gamer_speedrun', 'gamer_victory'].includes(sceneKey)
      || window.location.pathname.includes('/gameplay_hud/')
      || window.location.pathname.includes('/speedrun_split/')
      || window.location.pathname.includes('/victory_clutch/')
      || window.location.pathname.includes('/game/');
    const isChillScene = ['chill', 'oss_chatting', 'oss_podcast', 'cozy_cafe'].includes(sceneKey)
      || window.location.pathname.includes('/just_chatting/')
      || window.location.pathname.includes('/podcast_talk/')
      || window.location.pathname.includes('/cafe_chat/')
      || window.location.pathname.includes('/chill/');
    const isMakerScene = ['maker-desk', 'maker-pc', 'maker', 'oss_desktop', 'cozy_pomodoro'].includes(sceneKey)
      || window.location.pathname.includes('/maker/')
      || window.location.pathname.includes('/desktop_share/')
      || window.location.pathname.includes('/study_pomodoro/');
    const isPrintScene = ['print-machine', 'print-design', 'print', 'cozy_art'].includes(sceneKey)
      || window.location.pathname.includes('/print/')
      || window.location.pathname.includes('/art_dual_cam/');

    if (isGameScene && texts.game) {
      const badgeText = document.querySelector('.game-mode-badge-under span:last-child')?.textContent?.trim()
        || document.querySelector('.hud-header')?.textContent?.trim()
        || document.querySelector('.victory-banner h1')?.textContent?.trim();
      if (badgeText) texts.game.badgeText = badgeText;

      const runTitle = document.querySelector('.run-title')?.textContent?.trim();
      const runCategory = document.querySelector('.run-category')?.textContent?.trim();
      if (runTitle) texts.game.runTitle = runTitle;
      if (runCategory) texts.game.runCategory = runCategory;

      const pb = document.querySelector('.pb-bar span:last-child')?.textContent?.trim();
      if (pb) texts.game.personalBest = pb;

      const matchVal = document.querySelector('.stat-item:first-child .stat-val')?.textContent?.trim();
      if (matchVal) texts.game.matchType = matchVal;

      const fpsVal = document.querySelector('.stat-item:last-child .stat-val')?.textContent?.trim();
      if (fpsVal) texts.game.fps = fpsVal;

      const camHeader = document.querySelector('.hud-header')?.textContent?.trim();
      if (camHeader) texts.game.camLabel = camHeader;

      const splitRows = document.querySelectorAll('.split-row');
      if (splitRows.length > 0) {
        texts.game.splits = Array.from(splitRows).map(row => ({
          name: row.querySelector('.split-name')?.textContent?.trim() || '',
          delta: row.querySelector('.split-delta')?.textContent?.trim() || '',
          type: row.querySelector('.split-delta')?.classList.contains('positive') ? 'positive' : 'negative',
          time: row.querySelector('.split-time')?.textContent?.trim() || '',
          active: row.classList.contains('active')
        }));
      }
    }

    if (isMakerScene && texts.maker) {
      const projName = document.querySelector('.project-name-value')?.textContent?.trim()
        || document.querySelector('.panel-project-name')?.textContent?.trim()
        || document.querySelector('.top-banner')?.textContent?.trim();
      const projTitle = document.querySelector('.panel-project-title')?.textContent?.trim();
      const projPhase = document.querySelector('.panel-project-phase')?.textContent?.trim();
      const projDetail = document.querySelector('.panel-project-detail')?.textContent?.trim();
      if (projName) {
        texts.maker.projectName = projName;
        document.querySelectorAll('.project-name-value, .panel-project-name').forEach(el => el.textContent = projName);
      }
      if (projTitle) texts.maker.projectTitle = projTitle;
      const activePhase = document.querySelector('.project-phases .phase-item.active')?.textContent?.trim() || projPhase;
      if (activePhase) texts.maker.currentPhase = activePhase;
      if (projDetail) texts.maker.detail = projDetail;

      const panelStatus = document.querySelector('.side-info-panel .panel-header span:last-child')?.textContent?.trim();
      if (panelStatus) texts.maker.panelStatus = panelStatus;

      const phases = Array.from(document.querySelectorAll('.project-phases .phase-item'))
        .map(el => el.textContent.trim())
        .filter(Boolean);
      if (phases.length > 0) texts.maker.phases = phases;

      const fMain = document.querySelector('.camera-main .frame-label span:last-child')?.textContent?.trim() || document.querySelector('.camera-main .frame-label')?.textContent?.trim();
      const fFace = document.querySelector('.camera-face .frame-label span:last-child')?.textContent?.trim() || document.querySelector('.camera-face .frame-label')?.textContent?.trim();
      const fAux = document.querySelector('.camera-aux .frame-label span:last-child')?.textContent?.trim() || document.querySelector('.camera-aux .frame-label')?.textContent?.trim();
      if (fMain || fFace || fAux) {
        texts.maker.frames = texts.maker.frames || {};
        if (fMain) texts.maker.frames.main = fMain;
        if (fFace) texts.maker.frames.face = fFace;
        if (fAux) texts.maker.frames.aux = fAux;
      }

      const panelTitle = document.querySelector('.side-info-panel .panel-title')?.textContent?.trim();
      if (panelTitle) texts.maker.panelTitle = panelTitle;

      const pfx = document.querySelector('.project-prefix')?.textContent?.trim();
      if (pfx) texts.maker.projectPrefix = pfx;
    }

    if (isPrintScene && texts.print) {
      const projName = document.querySelector('.project-name-value')?.textContent?.trim()
        || document.querySelector('.panel-project-name')?.textContent?.trim()
        || document.querySelector('.palette-box div:first-child')?.textContent?.trim();
      const projPhase = document.querySelector('.panel-project-phase')?.textContent?.trim();
      const projMat = document.querySelector('.panel-project-detail')?.textContent?.trim();
      if (projName) {
        texts.print.projectName = projName;
        document.querySelectorAll('.project-name-value, .panel-project-name').forEach(el => el.textContent = projName);
      }
      const printActivePhase = document.querySelector('.project-phases .phase-item.active')?.textContent?.trim() || projPhase;
      if (printActivePhase) texts.print.currentPhase = printActivePhase;
      if (projMat) texts.print.material = projMat;

      const printPanelStatus = document.querySelector('.side-info-panel .panel-header span:last-child')?.textContent?.trim();
      if (printPanelStatus) texts.print.panelStatus = printPanelStatus;

      const phases = Array.from(document.querySelectorAll('.project-phases .phase-item'))
        .map(el => el.textContent.trim())
        .filter(Boolean);
      if (phases.length > 0) texts.print.phases = phases;

      const fMain = document.querySelector('.camera-main .frame-label span:last-child')?.textContent?.trim() || document.querySelector('.camera-main .frame-label')?.textContent?.trim();
      const fFace = document.querySelector('.camera-face .frame-label span:last-child')?.textContent?.trim() || document.querySelector('.camera-face .frame-label')?.textContent?.trim();
      const fAux = document.querySelector('.camera-aux .frame-label span:last-child')?.textContent?.trim() || document.querySelector('.camera-aux .frame-label')?.textContent?.trim();
      if (fMain || fFace || fAux) {
        texts.print.frames = texts.print.frames || {};
        if (fMain) texts.print.frames.main = fMain;
        if (fFace) texts.print.frames.face = fFace;
        if (fAux) texts.print.frames.aux = fAux;
      }

      const panelTitle = document.querySelector('.side-info-panel .panel-title')?.textContent?.trim();
      if (panelTitle) texts.print.panelTitle = panelTitle;

      const pfx = document.querySelector('.project-prefix')?.textContent?.trim();
      if (pfx) texts.print.projectPrefix = pfx;
    }

    if (isChillScene && texts.chill) {
      const sub = document.querySelector('.header-subtitle')?.textContent?.trim()
        || document.querySelector('.topic-pill')?.textContent?.trim()
        || document.querySelector('#lbl-topic')?.textContent?.trim();
      if (sub) texts.chill.subtitle = sub;
      const chatTitle = document.querySelector('.chat-title span:last-child')?.textContent?.trim()
        || document.querySelector('.chat-header')?.textContent?.trim()
        || document.querySelector('.chat-card div:first-child')?.textContent?.trim();
      if (chatTitle) texts.chill.chatTitle = chatTitle;
      const chatObs = document.querySelector('.chat-panel-header span:last-child')?.textContent?.trim();
      if (chatObs) texts.chill.chatStatus = chatObs;
      const topVal = document.querySelector('#lbl-topic')?.textContent?.trim()
        || document.querySelector('.topic-pill')?.textContent?.trim();
      if (topVal) texts.chill.topic = topVal;
      const podTitle = document.querySelector('.podcast-title')?.textContent?.trim();
      if (podTitle) texts.chill.podcastTitle = podTitle;
      const nameplates = Array.from(document.querySelectorAll('.guest-nameplate'))
        .map(el => el.textContent.trim())
        .filter(Boolean);
      if (nameplates.length > 0) texts.chill.guestNameplates = nameplates;
    }

    if (isStartingScene && texts.startingSoon) {
      const heroTag = document.querySelector('.starting-hero-text > div:first-child')?.textContent?.trim();
      if (heroTag) texts.startingSoon.heroTag = heroTag;

      const mainTitle = document.querySelector('.starting-hero-text .main-stream-title')
        || document.querySelector('.main-stream-title')
        || document.querySelector('.card h1')
        || document.querySelector('.box h1');
      if (mainTitle) {
        const accentSpan = mainTitle.querySelector('.title-cyan-accent');
        if (accentSpan) {
          const clone = mainTitle.cloneNode(true);
          clone.querySelector('.title-cyan-accent')?.remove();
          const firstLine = clone.textContent.replace(/<br>/g,'').trim();
          if (firstLine) texts.startingSoon.title = firstLine;
          texts.startingSoon.highlight = accentSpan.textContent.trim();
        } else {
          texts.startingSoon.title = mainTitle.textContent.trim();
          texts.startingSoon.highlight = '';
        }
      }

      const sub = document.querySelector('.starting-hero-text .stream-subtitle')?.textContent?.trim()
        || document.querySelector('.stream-subtitle')?.textContent?.trim()
        || document.querySelector('.card p')?.textContent?.trim()
        || document.querySelector('.box p')?.textContent?.trim();
      if (sub) texts.startingSoon.subtitle = sub;

      const footerNote = document.querySelector('.starting-footer > div:first-child, .bottom-bar .footer-note, .bottom-bar > div:first-child')?.textContent?.trim();
      if (footerNote) texts.startingSoon.footerNote = footerNote;

      const liveLabel = document.querySelector('.live-indicator span:last-child, .live-status span:last-child, [data-text-key="status"], .live-status')?.textContent?.trim();
      if (liveLabel) texts.startingSoon.liveStatusText = liveLabel;

      const modeEls = document.querySelectorAll('.ss-mode-label');
      if (modeEls.length > 0) {
        texts.startingSoon.modeLabels = Array.from(modeEls).map(el => el.textContent.trim());
      }
    }

    if (isBRBScene && texts.beRightBack) {
      const title = document.querySelector('.brb-center-content .main-stream-title')?.textContent?.trim()
        || document.querySelector('.main-stream-title')?.textContent?.trim()
        || document.querySelector('.card h1')?.textContent?.trim()
        || document.querySelector('.box h1')?.textContent?.trim();
      if (title) texts.beRightBack.title = title;

      const subEl = document.querySelector('.brb-center-content .stream-subtitle')?.textContent?.trim()
        || document.querySelector('.stream-subtitle')?.textContent?.trim()
        || document.querySelector('.card p')?.textContent?.trim()
        || document.querySelector('.box p')?.textContent?.trim();
      if (subEl) texts.beRightBack.subtitle = subEl;

      const currentPhrase = document.querySelector('.brb-status-phrase')?.textContent?.trim();
      if (currentPhrase && texts.beRightBack.statusPhrases?.length) {
        texts.beRightBack.statusPhrases[0] = currentPhrase;
      }

      const footerNote = document.querySelector('.brb-footer > div:first-child, .bottom-bar .footer-note, .bottom-bar > div:first-child')?.textContent?.trim();
      if (footerNote) texts.beRightBack.footerNote = footerNote;

      const liveLabel = document.querySelector('.live-indicator span:last-child, .live-status span:last-child, [data-text-key="status"], .live-status')?.textContent?.trim();
      if (liveLabel) texts.beRightBack.liveStatusText = liveLabel;
    }

    if (isEndingScene && texts.ending) {
      const titleEl = document.querySelector('.ending-center-content .main-stream-title')?.textContent?.trim()
        || document.querySelector('.main-stream-title')?.textContent?.trim()
        || document.querySelector('.card h1')?.textContent?.trim()
        || document.querySelector('.box h1')?.textContent?.trim();
      if (titleEl) texts.ending.title = titleEl;

      const subEl = document.querySelector('.ending-center-content .stream-subtitle')?.textContent?.trim()
        || document.querySelector('.stream-subtitle')?.textContent?.trim()
        || document.querySelector('.card p')?.textContent?.trim()
        || document.querySelector('.box p')?.textContent?.trim();
      if (subEl) texts.ending.subtitle = subEl;

      const fareMsg = document.querySelector('.ending-farewell-card p')?.textContent?.trim();
      if (fareMsg) texts.ending.farewellMessage = fareMsg;

      const fareTag = document.querySelector('.ending-farewell-card div')?.textContent?.trim();
      if (fareTag) texts.ending.farewellTag = fareTag;

      const footerNote = document.querySelector('.ending-footer > div:first-child, .bottom-bar .footer-note, .bottom-bar > div:first-child')?.textContent?.trim();
      if (footerNote) texts.ending.footerNote = footerNote;

      const liveLabel = document.querySelector('.live-indicator span:last-child, .live-status span:last-child, [data-text-key="status"], .live-status')?.textContent?.trim();
      if (liveLabel) texts.ending.liveStatusText = liveLabel;
    }

    // ==========================================
    // EXTRACTORES DEDICADOS POR PACK TEMÁTICO
    // ==========================================

    // ☕ 1. COZY LO-FI & ART PACK
    texts.cozy = texts.cozy || {};
    // A) Pomodoro (study_pomodoro)
    if (window.location.pathname.includes('/study_pomodoro/') || document.querySelector('.pomodoro-card')) {
      texts.cozy.pomodoro = texts.cozy.pomodoro || {};
      const pomoTitle = document.querySelector('.header-title span:last-child')?.textContent?.trim();
      if (pomoTitle) texts.cozy.pomodoro.pomoTitle = pomoTitle;
      const pomoTime = document.querySelector('.pomo-time')?.textContent?.trim();
      if (pomoTime) texts.cozy.pomodoro.pomoTime = pomoTime;
      const pomoBadge = document.querySelector('.pomo-badge')?.textContent?.trim();
      if (pomoBadge) texts.cozy.pomodoro.pomoBadge = pomoBadge;
      const ambientEls = document.querySelectorAll('.ambient-pill span');
      if (ambientEls.length > 0) {
        texts.cozy.pomodoro.ambientItems = Array.from(ambientEls).map(s => s.textContent.trim()).filter(Boolean);
      }
      const taskEls = document.querySelectorAll('.task-item');
      if (taskEls.length > 0) {
        texts.cozy.pomodoro.taskItems = Array.from(taskEls).map(t => ({
          done: t.classList.contains('done'),
          text: t.querySelector('span:last-child')?.textContent?.trim() || t.textContent.trim()
        }));
      }
    }
    // B) Arte & Proceso Creativo (art_dual_cam)
    if (window.location.pathname.includes('/art_dual_cam/') || document.querySelector('.face-polaroid')) {
      texts.cozy.art = texts.cozy.art || {};
      const canvasTag = document.querySelector('.canvas-tag span:last-child')?.textContent?.trim();
      if (canvasTag) texts.cozy.art.canvasTag = canvasTag;
      const brushTool = document.querySelector('.tools-palette-bar div:last-child')?.textContent?.trim();
      if (brushTool) texts.cozy.art.brushTool = brushTool;
      const faceFooter = document.querySelector('.face-footer')?.textContent?.trim();
      if (faceFooter) texts.cozy.art.faceFooter = faceFooter;
      const fields = document.querySelectorAll('.project-field');
      if (fields.length > 0) {
        texts.cozy.art.projectFields = Array.from(fields).map(f => ({
          label: f.querySelector('.field-label')?.textContent?.trim() || '',
          value: f.querySelector('.field-value')?.textContent?.trim() || ''
        }));
      }
    }
    // C) Café & Charla Chill (cafe_chat)
    if (window.location.pathname.includes('/cafe_chat/') || document.querySelector('.polaroid-handwritten')) {
      texts.cozy.cafe = texts.cozy.cafe || {};
      const handwritten = document.querySelector('.polaroid-handwritten')?.textContent?.trim();
      if (handwritten) texts.cozy.cafe.handwritten = handwritten;
      const handle = document.querySelector('.polaroid-footer span:last-child')?.textContent?.trim();
      if (handle) texts.cozy.cafe.handle = handle;
      const trackTitle = document.querySelector('.track-title')?.textContent?.trim();
      if (trackTitle) texts.cozy.cafe.trackTitle = trackTitle;
      const trackAuthor = document.querySelector('.track-author')?.textContent?.trim();
      if (trackAuthor) texts.cozy.cafe.trackAuthor = trackAuthor;
      const chatTitle = document.querySelector('.chat-header-title span:last-child')?.textContent?.trim();
      if (chatTitle) texts.cozy.cafe.chatTitle = chatTitle;
      const goalText = document.querySelector('.goal-text')?.textContent?.trim();
      if (goalText) texts.cozy.cafe.goalText = goalText;
      const goalCount = document.querySelector('.goal-count')?.textContent?.trim();
      if (goalCount) texts.cozy.cafe.goalCount = goalCount;
    }

    // ⚡ 2. GAMER PRO & ESPORTS PACK
    texts.gamer = texts.gamer || {};
    if (window.location.pathname.includes('/Gamer_Pro_Pack/') || document.querySelector('.match-hero-card')) {
      const serverInfo = document.querySelector('.server-info')?.textContent?.trim();
      const telemetry = Array.from(document.querySelectorAll('.telemetry-pills div')).map(d => d.textContent.trim());
      const heroTag = document.querySelector('.hero-tag')?.textContent?.trim();
      const mapPills = Array.from(document.querySelectorAll('.map-pill')).map(p => ({
        name: p.querySelector('span:first-child')?.textContent?.trim() || '',
        status: p.querySelector('span:last-child')?.textContent?.trim() || '',
        picked: p.classList.contains('picked')
      }));
      const arenaBottom = document.querySelector('.arena-bottom-bar > div:first-child')?.textContent?.trim();
      texts.gamer.telemetry = { serverInfo, telemetry, heroTag, mapPills, arenaBottom };
    }

    // 🌐 3. MAPEO UNIVERSAL PER-SCENE (Fallback Infalible para CUALQUIER elemento editado)
    const effectiveSceneKey = sceneKey || (function() {
      const p = window.location.pathname;
      if (p.includes('/study_pomodoro/')) return 'cozy_pomodoro';
      if (p.includes('/art_dual_cam/')) return 'cozy_art';
      if (p.includes('/cafe_chat/')) return 'cozy_cafe';
      if (p.includes('/maker/desk/')) return 'maker-desk';
      if (p.includes('/maker/pc/')) return 'maker-pc';
      if (p.includes('/print/machine/')) return 'print-machine';
      if (p.includes('/print/design/')) return 'print-design';
      if (p.includes('/gameplay_hud/')) return 'gamer_gameplay';
      if (p.includes('/speedrun_split/')) return 'gamer_speedrun';
      if (p.includes('/victory_clutch/')) return 'gamer_victory';
      if (p.includes('/just_chatting/')) return 'oss_chatting';
      if (p.includes('/desktop_share/')) return 'oss_desktop';
      if (p.includes('/podcast_talk/')) return 'oss_podcast';
      return document.body.dataset.scene || 'current_scene';
    })();

    if (effectiveSceneKey) {
      texts.customScenes = texts.customScenes || {};
      texts.customScenes[effectiveSceneKey] = texts.customScenes[effectiveSceneKey] || {};
      const keyStore = texts.customScenes[effectiveSceneKey];

      document.querySelectorAll('.editable-screen-element, [contenteditable="true"]').forEach((el, i) => {
        const text = el.textContent.trim();
        if (!text) return;
        let sel = '';
        if (el.className) {
          const cleanClasses = el.className
            .replace(/editable-screen-element|editing-active/g, '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          if (cleanClasses.length > 0) {
            sel = '.' + cleanClasses.join('.');
          }
        }
        if (!sel && el.tagName) {
          sel = el.tagName.toLowerCase();
        }
        if (sel) {
          keyStore[sel + '::' + i] = text;
        }
      });
    }

    return texts;
  }

  async function saveTexts(activeSceneKey) {
    const btnSave = document.querySelector('#hud-btn-save-texts');
    if (btnSave) btnSave.textContent = '⏳ Guardando...';

    try {
      const res = await fetch('/api/overlays/texts');
      const data = await res.json();
      const texts = data.texts || {};

      collectSceneTexts(activeSceneKey || '', texts);

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

      const headers = { 'Content-Type': 'application/json' };
      if (localToken) {
        headers['X-Local-Token'] = localToken;
      }

      const saveRes = await fetch('/api/overlays/texts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ texts })
      });
      if (!saveRes.ok) throw new Error('HTTP ' + saveRes.status);

      if (btnSave) btnSave.textContent = '💾 Guardar';
      window.OSSEditor.showHudToast('✓ ¡Textos guardados y sincronizados con OBS Studio!');
    } catch (e) {
      console.error('Error al guardar textos:', e);
      if (btnSave) btnSave.textContent = '💾 Guardar';
      window.OSSEditor.showHudToast('⚠️ Error al guardar los textos');
    }
  }

  window.OSSEditor.collectSceneTexts = collectSceneTexts;
  window.OSSEditor.saveTexts = saveTexts;
})();
