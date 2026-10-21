/**
 * ====================================================================
 * OPEN STREAM SUITE — MOTOR DE OVERLAY COMÚN
 * ====================================================================
 * Carga la configuración local, inyecta textos, gestiona visibilidad
 * y actualiza elementos interactivos (fases, cuentas atrás, frases).
 */

(function () {
  // Diccionario de Iconos SVG limpios y optimizados
  const SVG_ICONS = {
    // Símbolo de identidad: Golondrina geométrica / Chevron de circuito
    logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 9l10 5 10-5-10-7z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>`,

    // Mando de videojuegos (GAME MODE)
    gamepad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="4"/>
      <path d="M6 12h4m-2-2v4"/>
      <circle cx="15" cy="11" r="1" fill="currentColor"/>
      <circle cx="17" cy="13" r="1" fill="currentColor"/>
    </svg>`,

    // Chip integrado (MAKER MODE)
    chip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="2"/>
      <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
      <path d="M9 1V5M15 1V5M9 19V23M15 19V23M1 9H5M1 15H5M19 9H23M19 15H23"/>
    </svg>`,

    // Herramienta de corte / Plotter / Vinilo (PRINT MODE)
    cutter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>`,

    // Bocadillo de chat (CHILL MODE)
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`,

    // Redes sociales
    twitch: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`
  };

  let brbInterval = null;
  let countdownInterval = null;

  function applyConfigToDOM(config) {
    if (!config) return;
    window.OSS_CONFIG = Object.assign(window.OSS_CONFIG || {}, config);

    // 1. Gestión de animaciones
    if (config.performance && config.performance.enableAnimations === false) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }

    // 2. Marca del canal
    document.querySelectorAll('.brand-name').forEach(el => {
      el.textContent = config.channel?.name || "ANDORINA";
    });

    document.querySelectorAll('.brand-tagline').forEach(el => {
      el.textContent = config.channel?.tagline || "JUGAR · CREAR · COMPARTIR";
    });

    document.querySelectorAll('.brand-badge').forEach(el => {
      el.style.display = config.channel?.visible === false ? 'none' : '';
    });

    // 3. Indicador de directo y textos de estado
    const isStartingSoon = document.querySelector('.starting-container') !== null
      || document.querySelector('.starting-countdown') !== null
      || window.location.pathname.includes('/starting-soon/');
    const isBRB = document.querySelector('.brb-container') !== null
      || window.location.pathname.includes('/be-right-back/')
      || window.location.pathname.includes('/coffee-break/');
    const isEnding = document.querySelector('.ending-container') !== null
      || window.location.pathname.includes('/ending/');
    const isPomodoro = window.location.pathname.includes('/study_pomodoro/')
      || document.querySelector('.pomodoro-card') !== null;

    document.querySelectorAll('.live-indicator, .live-status').forEach(el => {
      if (config.channel?.showLiveIndicator === false && !isStartingSoon && !isBRB && !isEnding) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
      const label = el.querySelector('[data-text-key="status"]') || el.querySelector('span:last-child') || el;
      if (label) {
        if (isStartingSoon && config.startingSoon?.liveStatusText) {
          label.textContent = config.startingSoon.liveStatusText;
        } else if (isBRB && config.beRightBack?.liveStatusText) {
          label.textContent = config.beRightBack.liveStatusText;
        } else if (isEnding && config.ending?.liveStatusText) {
          label.textContent = config.ending.liveStatusText;
        } else if (config.channel?.liveText) {
          label.textContent = config.channel.liveText;
        }
      }
    });

    // 4. Redes sociales
    const socialContainer = document.querySelector('.social-links');
    if (socialContainer) {
      if (config.channel?.socials?.visible) {
        socialContainer.style.display = 'flex';
        const socials = config.channel.socials;
        let html = '';
        ['twitch', 'youtube', 'twitter', 'instagram', 'github'].forEach(net => {
          if (socials[net]) {
            html += `<div class="social-item">${SVG_ICONS[net] || ''} <span>${socials[net]}</span></div>`;
          }
        });
        socialContainer.innerHTML = html;
      } else {
        socialContainer.style.display = 'none';
      }
    }

    // 5. Game mode
    if (config.game) {
      if (config.game.badgeText) {
        document.querySelectorAll('.game-mode-badge-under span:last-child, .victory-banner h1').forEach(el => el.textContent = config.game.badgeText);
      }
      if (config.game.runTitle) {
        document.querySelectorAll('.run-title').forEach(el => el.textContent = config.game.runTitle);
      }
      if (config.game.runCategory) {
        document.querySelectorAll('.run-category').forEach(el => el.textContent = config.game.runCategory);
      }
      if (config.game.personalBest) {
        const pb = document.querySelector('.pb-bar span:last-child');
        if (pb) pb.textContent = config.game.personalBest;
      }
      if (config.game.matchType) {
        const mv = document.querySelector('.stat-item:first-child .stat-val');
        if (mv) mv.textContent = config.game.matchType;
      }
      if (config.game.fps) {
        const fv = document.querySelector('.stat-item:last-child .stat-val');
        if (fv) fv.textContent = config.game.fps;
      }
      if (config.game.camLabel) {
        document.querySelectorAll('.hud-header, .cam-split .cam-label').forEach(el => el.textContent = config.game.camLabel);
      }
      if (Array.isArray(config.game.splits) && config.game.splits.length > 0) {
        const splitsContainer = document.querySelector('.splits-list');
        if (splitsContainer) {
          splitsContainer.innerHTML = '';
          config.game.splits.forEach(sp => {
            const row = document.createElement('div');
            row.className = 'split-row' + (sp.active ? ' active' : '');
            const deltaClass = sp.type === 'positive' ? 'positive' : 'negative';
            row.innerHTML = `
              <span class="split-name">${sp.name || 'Tramo'}</span>
              <div class="split-times">
                <span class="split-delta ${deltaClass}">${sp.delta || '±00:00'}</span>
                <span class="split-time">${sp.time || '--:--'}</span>
              </div>
            `;
            splitsContainer.appendChild(row);
          });
        }
      }
    }

    // 6. Proyecto Maker / Print
    const isPrintMode = document.body.dataset.mode === 'print';
    const projConfig = isPrintMode ? config.print : config.maker;

    if (projConfig) {
      document.querySelectorAll('.project-name-value').forEach(el => {
        el.textContent = projConfig.projectName || "";
      });
      document.querySelectorAll('.panel-project-name').forEach(el => {
        el.textContent = projConfig.projectName || "";
      });
      document.querySelectorAll('.panel-project-phase').forEach(el => {
        el.textContent = projConfig.currentPhase || "";
      });
      document.querySelectorAll('.panel-project-detail').forEach(el => {
        el.textContent = isPrintMode ? (projConfig.material || "") : (projConfig.detail || "");
      });

      // Lista de fases inferior
      const phaseContainer = document.querySelector('.project-phases');
      if (phaseContainer && Array.isArray(projConfig.phases)) {
        phaseContainer.innerHTML = '';
        const cur = projConfig.currentPhase || '';
        projConfig.phases.forEach((phaseText, idx) => {
          const item = document.createElement('div');
          item.className = 'phase-item';
          if (cur && (phaseText.trim().toLowerCase() === cur.trim().toLowerCase() || phaseText.includes(cur) || cur.includes(phaseText))) {
            item.classList.add('active');
          }
          item.textContent = phaseText;
          phaseContainer.appendChild(item);

          if (idx < projConfig.phases.length - 1) {
            const div = document.createElement('span');
            div.className = 'phase-divider';
            div.textContent = '·';
            phaseContainer.appendChild(div);
          }
        });

        // Asegurar que al menos una fase esté activa y sincronizada con FASE ACTUAL
        let activeItem = phaseContainer.querySelector('.phase-item.active');
        if (!activeItem && phaseContainer.querySelector('.phase-item')) {
          activeItem = phaseContainer.querySelector('.phase-item');
          activeItem.classList.add('active');
        }
        if (activeItem) {
          const activeText = activeItem.textContent.trim();
          document.querySelectorAll('.panel-project-phase').forEach(pp => {
            pp.textContent = activeText;
          });
        }
        if (typeof window.__refreshHudPhases === 'function') {
          window.__refreshHudPhases();
        }
      }

      // Rótulos de marcos de cámara y paneles
      if (projConfig.frames) {
        const mainLabel = document.querySelector('.camera-main .frame-label span:last-child') || document.querySelector('.camera-main .frame-label');
        if (mainLabel && projConfig.frames.main) mainLabel.textContent = projConfig.frames.main;
        const faceLabel = document.querySelector('.camera-face .frame-label span:last-child') || document.querySelector('.camera-face .frame-label');
        if (faceLabel && projConfig.frames.face) faceLabel.textContent = projConfig.frames.face;
        const auxLabel = document.querySelector('.camera-aux .frame-label span:last-child') || document.querySelector('.camera-aux .frame-label');
        if (auxLabel && projConfig.frames.aux) auxLabel.textContent = projConfig.frames.aux;
      }
      if (projConfig.panelTitle) {
        const pt = document.querySelector('.side-info-panel .panel-title');
        if (pt) pt.textContent = projConfig.panelTitle;
      }
      if (projConfig.panelStatus) {
        const ps = document.querySelector('.side-info-panel .panel-header span:last-child');
        if (ps) ps.textContent = projConfig.panelStatus;
      }
      if (projConfig.projectPrefix) {
        const pfx = document.querySelector('.project-prefix');
        if (pfx) pfx.textContent = projConfig.projectPrefix;
      }

      // Cámara auxiliar
      const auxFrame = document.querySelector('.camera-aux');
      if (auxFrame) {
        auxFrame.style.display = projConfig.showAuxView === false ? 'none' : '';
      }
    }

    // 7. Chill mode / Chatting / Podcast / Cafe
    if (config.chill) {
      const headerSub = document.querySelector('.scene-header.theme-chill .header-subtitle')
        || document.querySelector('.header-subtitle')
        || document.querySelector('.topic-pill')
        || document.querySelector('#lbl-topic');
      if (headerSub && config.chill.subtitle) {
        headerSub.textContent = config.chill.subtitle;
      }

      const chatTitleEl = document.querySelector('.chat-title span:last-child')
        || document.querySelector('.chat-header')
        || document.querySelector('.chat-card div:first-child');
      if (chatTitleEl && config.chill.chatTitle) {
        chatTitleEl.textContent = config.chill.chatTitle;
      }

      const chatObsStatus = document.querySelector('.chat-panel-header span:last-child');
      if (chatObsStatus && config.chill.chatStatus) {
        chatObsStatus.textContent = config.chill.chatStatus;
      }

      if (config.chill.podcastTitle) {
        document.querySelectorAll('.podcast-title').forEach(el => el.textContent = config.chill.podcastTitle);
      }
      if (Array.isArray(config.chill.guestNameplates)) {
        const plates = document.querySelectorAll('.guest-nameplate');
        plates.forEach((p, idx) => {
          if (config.chill.guestNameplates[idx]) p.textContent = config.chill.guestNameplates[idx];
        });
      }

      const footerTopic = document.querySelector('.chill-footer-topic');
      if (footerTopic) {
        if (config.chill.topic) {
          const topicVal = footerTopic.querySelector('span:nth-child(2)');
          if (topicVal) topicVal.textContent = config.chill.topic;
        }
        if (config.chill.chatPrompt) {
          const promptVal = footerTopic.querySelector('div:last-child');
          if (promptVal) promptVal.textContent = config.chill.chatPrompt;
        }
      }

      const chatPanel = document.querySelector('.chat-panel-frame');
      const mainCam = document.querySelector('.camera-chill-main');
      if (config.chill.showChatPanel === false) {
        if (chatPanel) chatPanel.style.display = 'none';
        if (mainCam) {
          mainCam.style.left = '160px';
          mainCam.style.width = '1600px';
          mainCam.style.height = '900px';
        }
      } else {
        if (chatPanel) chatPanel.style.display = '';
        if (mainCam) {
          mainCam.style.left = '32px';
          mainCam.style.width = '1280px';
          mainCam.style.height = '720px';
        }
      }
    }

    // 8. Pantalla STARTING SOON
    if (isStartingSoon && config.startingSoon) {
      const s = config.startingSoon;
      const heroTag = document.querySelector('.starting-hero-text > div:first-child, .tag-line, [data-i18n="themes.placeholder_ss_tag"]');
      if (heroTag && s.heroTag) heroTag.textContent = s.heroTag;

      const mainTitle = document.querySelector('.starting-hero-text .main-stream-title')
        || document.querySelector('.main-stream-title')
        || document.querySelector('.card h1')
        || document.querySelector('.box h1');
      if (mainTitle) {
        if (s.highlight) {
          mainTitle.innerHTML = `${s.title || 'ENSEGUIDA'}<br><span class="title-cyan-accent">${s.highlight}</span>`;
        } else if (s.title) {
          mainTitle.textContent = s.title;
        }
      }

      const subtitle = document.querySelector('.starting-hero-text .stream-subtitle')
        || document.querySelector('.stream-subtitle')
        || document.querySelector('.card p')
        || document.querySelector('.box p');
      if (subtitle && s.subtitle) subtitle.textContent = s.subtitle;

      const footerNote = document.querySelector('.starting-footer > div:first-child, .bottom-bar .footer-note, .bottom-bar > div:first-child');
      if (footerNote && (s.footerNote || s.footer)) {
        footerNote.textContent = s.footerNote || s.footer;
      }

      // Etiquetas de los modos de emisión (panel derecho)
      if (Array.isArray(s.modeLabels)) {
        document.querySelectorAll('.ss-mode-label').forEach((el, idx) => {
          if (s.modeLabels[idx] !== undefined) {
            el.textContent = s.modeLabels[idx];
          }
        });
      }

      // Cuenta atrás y barra de carga sincronizadas
      const countdownEl = document.querySelector('.starting-countdown');
      if (countdownInterval) clearInterval(countdownInterval);
      if (countdownEl && s.countdownMinutes > 0) {
        let totalSeconds = s.countdownMinutes * 60;
        const initialTotal = totalSeconds;
        const progressFill = document.querySelector('.tech-progress-fill');

        function updateClock() {
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;
          countdownEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          if (progressFill) {
            const pct = Math.min(100, Math.max(0, ((initialTotal - totalSeconds) / initialTotal) * 100));
            progressFill.style.width = `${pct}%`;
          }
          if (totalSeconds > 0) {
            totalSeconds--;
          } else {
            countdownEl.textContent = "00:00 - ¡EMPEZANDO!";
          }
        }
        updateClock();
        countdownInterval = setInterval(updateClock, 1000);
      }
    }

    // 8.1 Pantalla POMODORO / STUDY
    if (isPomodoro) {
      const pomoEl = document.querySelector('.pomo-time, .pomodoro-countdown');
      const progressFill = document.querySelector('.tech-progress-fill');
      const pomoMins = config.startingSoon?.countdownMinutes || 25;
      if (countdownInterval) clearInterval(countdownInterval);
      if (pomoEl && pomoMins > 0) {
        let totalSeconds = pomoMins * 60;
        const initialTotal = totalSeconds;
        function updatePomoClock() {
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;
          pomoEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          if (progressFill) {
            const pct = Math.min(100, Math.max(0, ((initialTotal - totalSeconds) / initialTotal) * 100));
            progressFill.style.width = `${pct}%`;
          }
          if (totalSeconds > 0) {
            totalSeconds--;
          } else {
            pomoEl.textContent = "00:00 - ¡DESCANSO!";
          }
        }
        updatePomoClock();
        countdownInterval = setInterval(updatePomoClock, 1000);
      }
    }

    // 9. Pantalla BE RIGHT BACK — Rotación de frases y textos
    if (isBRB && config.beRightBack) {
      const b = config.beRightBack;
      const titleEl = document.querySelector('.brb-center-content .main-stream-title')
        || document.querySelector('.main-stream-title')
        || document.querySelector('.card h1')
        || document.querySelector('.box h1');
      if (titleEl && b.title) titleEl.textContent = b.title;

      const subEl = document.querySelector('.brb-center-content .stream-subtitle')
        || document.querySelector('.stream-subtitle')
        || document.querySelector('.card p')
        || document.querySelector('.box p');
      if (subEl && b.subtitle) subEl.textContent = b.subtitle;

      const footerNote = document.querySelector('.brb-footer > div:first-child, .bottom-bar .footer-note, .bottom-bar > div:first-child');
      if (footerNote && (b.footerNote || b.footer)) {
        footerNote.textContent = b.footerNote || b.footer;
      }

      const brbPhraseEl = document.querySelector('.brb-status-phrase');
      if (brbInterval) clearInterval(brbInterval);
      if (brbPhraseEl && b.statusPhrases?.length) {
        const phrases = b.statusPhrases;
        let pIdx = 0;
        brbPhraseEl.textContent = phrases[0];
        const intervalSec = (b.phraseIntervalSeconds || 6) * 1000;
        brbInterval = setInterval(() => {
          if (window.__OSS_IS_EDITING__) return; // PAUSAR rotación mientras el usuario edita o escribe
          pIdx = (pIdx + 1) % phrases.length;
          brbPhraseEl.style.opacity = '0';
          setTimeout(() => {
            if (window.__OSS_IS_EDITING__) return;
            brbPhraseEl.textContent = phrases[pIdx];
            brbPhraseEl.style.opacity = '1';
          }, 300);
        }, intervalSec);
      }
    }

    // 10. Pantalla ENDING — Textos y tarjeta de despedida
    if (isEnding && config.ending) {
      const e = config.ending;
      const titleEl = document.querySelector('.ending-center-content .main-stream-title')
        || document.querySelector('.main-stream-title')
        || document.querySelector('.card h1')
        || document.querySelector('.box h1');
      if (titleEl && e.title) titleEl.textContent = e.title;

      const subEl = document.querySelector('.ending-center-content .stream-subtitle')
        || document.querySelector('.stream-subtitle')
        || document.querySelector('.card p')
        || document.querySelector('.box p');
      if (subEl && e.subtitle) subEl.textContent = e.subtitle;

      const cardMsg = document.querySelector('.ending-farewell-card p');
      if (cardMsg && (e.farewellMessage || e.farewellText)) {
        cardMsg.textContent = e.farewellMessage || e.farewellText;
      }

      const cardTag = document.querySelector('.ending-farewell-card div');
      if (cardTag && e.farewellTag) {
        cardTag.textContent = e.farewellTag;
      }

      const footerNote = document.querySelector('.ending-footer > div:first-child, .bottom-bar .footer-note, .bottom-bar > div:first-child');
      if (footerNote && (e.footerNote || e.footer)) {
        footerNote.textContent = e.footerNote || e.footer;
      }
    }
  }

  function initOverlay() {
    const config = window.OSS_CONFIG || {
      channel: { name: "ANDORINA", tagline: "JUGAR · CREAR · COMPARTIR", visible: true, showLiveIndicator: true },
      maker: { projectName: "NAS CON RASPBERRY PI", currentPhase: "02 MONTAJE", phases: ["01 PLAN", "02 MONTAJE", "03 SOFTWARE", "04 PRUEBAS"] },
      print: { projectName: "PEGATINAS PERSONALIZADAS", material: "Vinilo Holográfico", currentPhase: "CORTE DE VINILO", phases: ["01 DISEÑO", "02 CORTE", "03 PELADO", "04 APLICACIÓN"] },
      chill: { showChatPanel: true },
      performance: { enableAnimations: true }
    };

    // 1. Inyección de iconos con data-icon="nombre"
    document.querySelectorAll('[data-icon]').forEach(el => {
      const iconKey = el.getAttribute('data-icon');
      if (SVG_ICONS[iconKey]) {
        el.innerHTML = SVG_ICONS[iconKey];
      }
    });

    // 1.1 Detección de clave de escena para estilos independientes
    function detectCurrentSceneKey() {
      const p = window.location.pathname;
      if (p.includes('/Open_stream_Pack/')) {
        if (p.includes('/just_chatting/')) return 'oss_chatting';
        if (p.includes('/desktop_share/')) return 'oss_desktop';
        if (p.includes('/podcast_talk/')) return 'oss_podcast';
        if (p.includes('/starting-soon/')) return 'oss_starting';
        if (p.includes('/be-right-back/')) return 'oss_brb';
        if (p.includes('/ending/')) return 'oss_ending';
      }
      if (p.includes('/Gamer_Pro_Pack/')) {
        if (p.includes('/gameplay_hud/')) return 'gamer_gameplay';
        if (p.includes('/speedrun_split/')) return 'gamer_speedrun';
        if (p.includes('/victory_clutch/')) return 'gamer_victory';
        if (p.includes('/starting-soon/')) return 'gamer_starting';
        if (p.includes('/be-right-back/')) return 'gamer_brb';
        if (p.includes('/ending/')) return 'gamer_ending';
      }
      if (p.includes('/Cozy_LoFi_Pack/')) {
        if (p.includes('/study_pomodoro/')) return 'cozy_pomodoro';
        if (p.includes('/art_dual_cam/')) return 'cozy_art';
        if (p.includes('/cafe_chat/')) return 'cozy_cafe';
        if (p.includes('/starting-soon/')) return 'cozy_starting';
        if (p.includes('/coffee-break/')) return 'cozy_brb';
        if (p.includes('/ending/')) return 'cozy_ending';
      }
      if (p.includes('/game/')) return 'game';
      if (p.includes('/maker/desk/') || p.includes('/maker-desk/')) return 'maker-desk';
      if (p.includes('/maker/pc/') || p.includes('/maker-pc/')) return 'maker-pc';
      if (p.includes('/print/machine/') || p.includes('/print-machine/')) return 'print-machine';
      if (p.includes('/print/design/') || p.includes('/print-design/')) return 'print-design';
      if (p.includes('/chill/')) return 'chill';
      if (p.includes('/starting-soon/')) return 'startingSoon';
      if (p.includes('/be-right-back/')) return 'beRightBack';
      if (p.includes('/ending/')) return 'ending';
      return document.body.dataset.scene || document.body.dataset.mode || null;
    }

    const currentSceneKey = detectCurrentSceneKey();

    // 1.2 Resolución y aplicación de temas dinámicos
    const urlParams = new URLSearchParams(window.location.search);
    // En OBS el estilo guardado en el panel manda; ?theme= solo vale para
    // previsualizar en navegador (o en OBS si se añade &lockTheme=1).
    const inOBS = typeof window.obsstudio !== 'undefined';
    const rawUrlTheme = urlParams.get('theme');
    const themeFromUrl = (inOBS && urlParams.get('lockTheme') !== '1') ? null : rawUrlTheme;
    let activeTheme = themeFromUrl;
    if (!activeTheme && config.overlayThemes && currentSceneKey && config.overlayThemes[currentSceneKey]) {
      activeTheme = config.overlayThemes[currentSceneKey];
    }
    if (!activeTheme) {
      activeTheme = config.activeTheme || config.themeName;
    }
    if (activeTheme) {
      document.body.setAttribute('data-theme', activeTheme);
    }

    // Consultar mapeo de temas por escena desde el servidor local
    function syncThemeFromServer() {
      if (themeFromUrl) return;
      fetch('/api/themes/packs', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const t = (data.overlayThemes && currentSceneKey && data.overlayThemes[currentSceneKey]) || data.activeTheme;
          if (t) document.body.setAttribute('data-theme', t);
        })
        .catch(() => {});
    }
    function syncTextsFromServer() {
      fetch('/api/overlays/texts', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data && data.texts) applyConfigToDOM(data.texts); })
        .catch(() => { /* Modo offline o standalone en OBS */ });
    }
    syncThemeFromServer();

    // 2. Detección de entorno: OBS Studio vs Navegador Web normal
    const isOBS = inOBS;
    if (!isOBS && !document.body.classList.contains('catalog-body')) {
      document.body.classList.add('browser-preview-mode');
      setupFullScreenEditor(currentSceneKey);
    }

    // 3. Aplicar configuración base del DOM
    applyConfigToDOM(config);

    // 4. Intentar cargar textos actualizados desde la API local
    syncTextsFromServer();

    // 5. Escuchar cambios de temas y textos en vivo vía WebSocket local (con reconexión)
    const wsHost = window.location.hostname || 'localhost';
    const wsPort = window.location.port || '8080';
    let wsRetry = 0;
    function connectLiveSocket() {
      let ws;
      try {
        ws = new WebSocket(`ws://${wsHost}:${wsPort}/ws`);
      } catch (e) { return; }
      ws.onopen = () => {
        if (wsRetry > 0) { syncThemeFromServer(); syncTextsFromServer(); }
        wsRetry = 0;
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'overlay_theme_change' && msg.theme) {
            if (!msg.overlayKey || msg.overlayKey === currentSceneKey) {
              if (!themeFromUrl) document.body.setAttribute('data-theme', msg.theme);
            }
          } else if (msg.type === 'theme_change') {
            // Cambio global: respetar el estilo asignado a esta escena
            syncThemeFromServer();
          } else if (msg.type === 'overlay_texts_update' && msg.texts) {
            applyConfigToDOM(msg.texts);
          }
        } catch (err) {}
      };
      ws.onclose = () => {
        wsRetry++;
        setTimeout(connectLiveSocket, Math.min(10000, 1000 * wsRetry));
      };
    }
    connectLiveSocket();
  }

  function setupFullScreenEditor(sceneKey) {
    if (typeof window.obsstudio !== 'undefined') return;
    if (document.getElementById('open-stream-suite-screen-hud')) return;

    // Inyectar estilos CSS del HUD
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .open-stream-suite-screen-hud {
        position: fixed;
        bottom: 18px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(14, 18, 24, 0.96);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(87, 214, 196, 0.45);
        padding: 6px 12px;
        border-radius: 8px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.8), 0 0 15px rgba(87, 214, 196, 0.2);
        font-family: 'JetBrains Mono', 'Segoe UI', monospace;
        font-size: 11px;
        color: #F0F6FC;
        user-select: none;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .open-stream-suite-screen-hud.docked-top {
        bottom: auto !important;
        top: 14px !important;
      }
      .open-stream-suite-screen-hud.minimized {
        padding: 5px 12px;
        background: rgba(14, 18, 24, 0.9);
      }
      .open-stream-suite-screen-hud.minimized .hud-content {
        display: none !important;
      }
      .hud-drag-handle {
        cursor: grab;
        display: flex;
        align-items: center;
        gap: 6px;
        padding-right: 6px;
        border-right: 1px solid rgba(255,255,255,0.12);
      }
      .hud-drag-handle:active {
        cursor: grabbing;
      }
      .hud-btn {
        background: #21262D;
        color: #F0F6FC;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 4px;
        padding: 4px 9px;
        font-size: 11px;
        font-family: inherit;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 600;
        transition: all 0.2s;
      }
      .hud-btn:hover {
        background: #30363D;
        border-color: #57D6C4;
        color: #57D6C4;
      }
      .hud-btn.active-editing {
        background: rgba(255, 120, 63, 0.25) !important;
        border-color: #FF783F !important;
        color: #FF783F !important;
        box-shadow: 0 0 10px rgba(255, 120, 63, 0.4);
      }
      .hud-btn.btn-save {
        background: #57D6C4;
        color: #0D1117;
        border-color: #57D6C4;
        font-weight: 700;
      }
      .hud-btn.btn-save:hover {
        background: #6FE3D3;
      }
      .hud-select {
        background: #161B22;
        color: #F0F6FC;
        border: 1px solid rgba(87, 214, 196, 0.4);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 11px;
        font-family: inherit;
        outline: none;
        cursor: pointer;
      }
      .editable-screen-element.editing-active {
        box-shadow: inset 0 0 0 1.5px #57D6C4, 0 0 8px rgba(87, 214, 196, 0.25) !important;
        background: rgba(87, 214, 196, 0.14) !important;
        border-radius: 3px;
        cursor: pointer !important;
        position: relative;
        z-index: 10;
        outline: none !important;
        display: inline-block;
        padding: 1px 4px !important;
        margin: 1px !important;
        transition: box-shadow 0.15s, background 0.15s;
      }
      .editable-screen-element.editing-active:hover {
        box-shadow: inset 0 0 0 2px #FF783F, 0 0 12px rgba(255, 120, 63, 0.45) !important;
        background: rgba(255, 120, 63, 0.24) !important;
        z-index: 100;
      }
      .editable-screen-element.editing-active:focus {
        box-shadow: inset 0 0 0 2px #57D6C4, 0 0 16px rgba(87, 214, 196, 0.6) !important;
        background: rgba(14, 18, 24, 0.95) !important;
        color: #FFFFFF !important;
        z-index: 200;
        outline: none !important;
        cursor: text !important;
      }
      .hud-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000000;
        background: #161B22;
        border: 1px solid #57D6C4;
        color: #FFFFFF;
        padding: 10px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-family: 'JetBrains Mono', monospace;
        box-shadow: 0 6px 20px rgba(0,0,0,0.6);
        animation: hudToastIn 0.3s ease-out;
      }
      @keyframes hudToastIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleEl);

    const hud = document.createElement('div');
    hud.className = 'open-stream-suite-screen-hud';
    hud.id = 'open-stream-suite-screen-hud';

    hud.innerHTML = `
      <div class="hud-drag-handle" title="Arrastra desde aquí para mover la barra a cualquier parte de la pantalla">
        <span>🛠️</span>
        <span style="font-weight:700; color:#57D6C4; letter-spacing:0.5px;">EDITOR</span>
        <span style="color:#8B949E; font-size:10px;">[${(sceneKey || 'ESCENA').toUpperCase()}]</span>
        <span style="color:#6E7681; font-size:10px; margin-left:2px;">⋮⋮</span>
      </div>

      <div class="hud-content" style="display:flex; align-items:center; gap:6px;">
        <button type="button" class="hud-btn" id="hud-btn-toggle-dock" title="Mover barra arriba / abajo para no tapar textos">
          ↕️ Mover
        </button>

        <button type="button" class="hud-btn" id="hud-btn-toggle-fit" title="Auto-ajustar 1080p a la ventana">
          📐 Ajustar: <span id="hud-fit-state" style="color:#57D6C4;">ON</span>
        </button>

        <button type="button" class="hud-btn" id="hud-btn-toggle-edit" title="Hacer clic para editar cualquier texto">
          ✏️ Edición: <span id="hud-edit-state" style="color:#FF783F;">OFF</span>
        </button>

        <select class="hud-select" id="hud-quick-jump-select" style="display:none; max-width:140px;">
          <option value="">🎯 Ir a Texto...</option>
        </select>

        <div style="display:flex; align-items:center; gap:3px;">
          <span style="color:#8B949E; font-size:10px;">🎨</span>
          <select class="hud-select" id="hud-theme-select">
            <option value="">Cargando estilos...</option>
          </select>
        </div>

        <button type="button" class="hud-btn btn-save" id="hud-btn-save-texts" title="Guardar cambios de texto y emitirlos a OBS">
          💾 Guardar
        </button>

        <button type="button" class="hud-btn" id="hud-btn-reset-texts" style="color:#FF783F; border-color:rgba(255,120,63,0.4);" title="Restaurar textos de esta escena a valores originales">
          🔄 Restaurar
        </button>

        <button type="button" class="hud-btn" id="hud-btn-toggle-bg" title="Alternar fondo transparente u oscuro de prueba">
          👁️ Fondo OBS
        </button>

        <div id="hud-phase-switcher" style="display:none; align-items:center; gap:4px; padding:0 6px; border-left:1px solid rgba(255,255,255,0.15);">
          <span style="color:#57D6C4; font-size:10px; font-weight:700;">FASE:</span>
          <div id="hud-phase-buttons" style="display:flex; gap:3px;"></div>
          <button type="button" class="hud-btn" id="hud-btn-add-phase" style="padding:2px 6px; font-size:10px;" title="Añadir una nueva fase al proyecto">➕</button>
          <button type="button" class="hud-btn" id="hud-btn-del-phase" style="padding:2px 6px; font-size:10px; color:#F85149;" title="Eliminar la fase activa">🗑️</button>
        </div>

        <div id="hud-podcast-switcher" style="display:none; align-items:center; gap:4px; padding:0 6px; border-left:1px solid rgba(255,255,255,0.15);">
          <span style="color:#57D6C4; font-size:10px; font-weight:700;">👥 CÁMARAS:</span>
          <button type="button" class="hud-btn hud-pod-cam-btn" data-cams="2" style="padding:2px 6px; font-size:10px;">2 Cams</button>
          <button type="button" class="hud-btn hud-pod-cam-btn" data-cams="3" style="padding:2px 6px; font-size:10px;">3 Cams</button>
          <button type="button" class="hud-btn hud-pod-cam-btn" data-cams="4" style="padding:2px 6px; font-size:10px;">4 Cams</button>
        </div>
      </div>

      <button type="button" class="hud-btn" id="hud-btn-toggle-min" style="padding:4px 6px; font-size:10px;" title="Minimizar barra">
        ▲
      </button>
    `;
    document.body.appendChild(hud);

    let countdownControl = null;
    let speedControl = null;
    let phrasesControl = null;

    // --- Control especial 1: Minutos de cuenta atrás y temporizadores (Starting Soon y Pomodoro) ---
    const isCountdownScene = ['startingSoon', 'oss_starting', 'gamer_starting', 'cozy_starting', 'cozy_pomodoro'].includes(sceneKey)
      || window.location.pathname.includes('/starting-soon/')
      || window.location.pathname.includes('/study_pomodoro/')
      || document.querySelector('.starting-countdown') !== null
      || document.querySelector('.pomo-time') !== null;

    if (isCountdownScene) {
      const isPomo = sceneKey === 'cozy_pomodoro' || window.location.pathname.includes('/study_pomodoro/') || document.querySelector('.pomo-time') !== null;
      countdownControl = document.createElement('div');
      countdownControl.id = 'oss-countdown-control';
      countdownControl.style.cssText = `
        position: fixed; top: 50%; right: 18px; transform: translateY(-50%);
        z-index: 999998; background: rgba(14,18,24,0.96); backdrop-filter: blur(14px);
        border: 1px solid rgba(87,214,196,0.45); border-radius: 8px;
        padding: 14px 18px; font-family: 'JetBrains Mono', monospace;
        font-size: 11px; color: #F0F6FC; box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(87,214,196,0.15);
        display: flex; flex-direction: column; gap: 10px; width: 230px;
      `;

      const presets = isPomo
        ? [ { label: '🍅 25m', val: 25 }, { label: '🍅 50m', val: 50 }, { label: '☕ 5m', val: 5 }, { label: '☕ 10m', val: 10 } ]
        : [ { label: '3 min', val: 3 }, { label: '5 min', val: 5 }, { label: '10 min', val: 10 }, { label: '15 min', val: 15 } ];

      countdownControl.innerHTML = `
        <div class="hud-drag-handle" style="font-weight:700; color:#57D6C4; letter-spacing:0.5px; border-bottom:1px solid rgba(87,214,196,0.2); padding-bottom:7px; display:flex; justify-content:space-between; align-items:center; cursor:grab;" title="Arrastra desde aquí para mover este menú">
          <span>${isPomo ? '🍅 POMODORO FOCUS' : '⏱️ CUENTA ATRÁS'}</span>
          <span style="display:flex; align-items:center; gap:4px;">
            <span id="oss-cd-status" style="font-size:10px; color:#3FB950;">EN MARCHA</span>
            <span style="color:#6E7681; font-size:11px;">⋮⋮</span>
          </span>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <span style="color:#8B949E; font-size:10px;">AJUSTES RÁPIDOS:</span>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
            ${presets.map(p => `<button type="button" class="hud-btn oss-cd-preset" data-mins="${p.val}" style="padding:4px 6px; font-size:10px; justify-content:center;">${p.label}</button>`).join('')}
          </div>
          <div style="display:flex; gap:4px; margin-top:2px;">
            <button id="oss-cd-plus-1m" type="button" class="hud-btn" style="flex:1; justify-content:center; font-size:10px;">+1 Min</button>
            <button id="oss-cd-minus-1m" type="button" class="hud-btn" style="flex:1; justify-content:center; font-size:10px;">-1 Min</button>
          </div>
        </div>
        <label style="display:flex; flex-direction:column; gap:4px;">
          <span style="color:#8B949E; font-size:10px;">MINUTOS TOTALES:</span>
          <div style="display:flex; align-items:center; gap:6px;">
            <input id="oss-cd-minutes" type="number" min="1" max="180" step="1" value="${isPomo ? '25' : '5'}"
              style="width:65px; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                     border-radius:4px; padding:4px 8px; font-size:13px; font-family:inherit;
                     font-weight:700; outline:none; text-align:center;"
            >
            <span style="color:#8B949E;">min</span>
            <span id="oss-cd-preview" style="color:#57D6C4; font-size:13px; font-weight:700; margin-left:auto;">${isPomo ? '25:00' : '05:00'}</span>
          </div>
        </label>
        <div style="display:flex; gap:6px;">
          <button id="oss-cd-toggle" type="button" class="hud-btn" style="flex:1; justify-content:center;">⏸ Pausar</button>
          <button id="oss-cd-reset" type="button" class="hud-btn" style="flex:1; justify-content:center;">🔄 Reiniciar</button>
        </div>
        <button id="oss-cd-apply" type="button" class="hud-btn btn-save" style="width:100%; justify-content:center; padding:6px;">💾 Guardar y Aplicar</button>
      `;
      document.body.appendChild(countdownControl);

      let timerRunning = true;
      let totalMins = isPomo ? 25 : 5;
      let currentSecondsRemaining = totalMins * 60;
      let totalSecondsInitial = totalMins * 60;

      const countdownEl = document.querySelector('.starting-countdown, .pomo-time, .pomodoro-countdown');
      const progressFill = document.querySelector('.tech-progress-fill');
      const statusSpan = document.getElementById('oss-cd-status');
      const toggleBtn = document.getElementById('oss-cd-toggle');

      function updateClockDisplay() {
        const mins = Math.floor(currentSecondsRemaining / 60);
        const secs = currentSecondsRemaining % 60;
        const formatted = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        if (countdownEl) countdownEl.textContent = formatted;
        const prev = document.getElementById('oss-cd-preview');
        if (prev) prev.textContent = formatted;

        if (progressFill && totalSecondsInitial > 0) {
          const pct = Math.min(100, Math.max(0, ((totalSecondsInitial - currentSecondsRemaining) / totalSecondsInitial) * 100));
          progressFill.style.width = `${pct}%`;
        }
      }

      function startTimerEngine(mins) {
        if (countdownInterval) clearInterval(countdownInterval);
        totalMins = mins;
        totalSecondsInitial = totalMins * 60;
        currentSecondsRemaining = totalSecondsInitial;
        timerRunning = true;
        if (statusSpan) { statusSpan.textContent = 'EN MARCHA'; statusSpan.style.color = '#3FB950'; }
        if (toggleBtn) toggleBtn.textContent = '⏸ Pausar';

        updateClockDisplay();
        countdownInterval = setInterval(() => {
          if (!timerRunning) return;
          if (currentSecondsRemaining > 0) {
            currentSecondsRemaining--;
            updateClockDisplay();
          } else {
            if (countdownEl) countdownEl.textContent = isPomo ? '00:00 - ¡DESCANSO!' : '00:00 - ¡EMPEZANDO!';
            if (statusSpan) { statusSpan.textContent = 'FINALIZADO'; statusSpan.style.color = '#FF783F'; }
            if (toggleBtn) toggleBtn.textContent = '▶ Reanudar';
            timerRunning = false;
            clearInterval(countdownInterval);
          }
        }, 1000);
      }

      // Sincronizar valor inicial de config
      const syncCdInput = () => {
        const cfg = window.OSS_CONFIG || window.TALLER_CONFIG;
        const mins = isPomo ? (cfg?.pomodoroMinutes || 25) : cfg?.startingSoon?.countdownMinutes;
        if (mins && mins > 0) {
          const inp = document.getElementById('oss-cd-minutes');
          if (inp) inp.value = mins;
          startTimerEngine(mins);
        }
      };
      setTimeout(syncCdInput, 800);

      // Botón Pausar / Reanudar
      toggleBtn?.addEventListener('click', () => {
        timerRunning = !timerRunning;
        toggleBtn.textContent = timerRunning ? '⏸ Pausar' : '▶ Reanudar';
        if (statusSpan) {
          statusSpan.textContent = timerRunning ? 'EN MARCHA' : 'PAUSADO';
          statusSpan.style.color = timerRunning ? '#3FB950' : '#FF783F';
        }
        showHudToast(timerRunning ? '▶ Temporizador reanudado' : '⏸ Temporizador pausado');
      });

      // Botón Reiniciar
      document.getElementById('oss-cd-reset')?.addEventListener('click', () => {
        const inp = document.getElementById('oss-cd-minutes');
        const m = parseInt(inp?.value) || totalMins;
        startTimerEngine(m);
        showHudToast(`🔄 Temporizador reiniciado a ${m} min`);
      });

      // Botones +1 Min / -1 Min
      document.getElementById('oss-cd-plus-1m')?.addEventListener('click', () => {
        currentSecondsRemaining += 60;
        totalSecondsInitial += 60;
        updateClockDisplay();
        showHudToast('⏱️ +1 Minuto añadido');
      });
      document.getElementById('oss-cd-minus-1m')?.addEventListener('click', () => {
        if (currentSecondsRemaining > 60) {
          currentSecondsRemaining -= 60;
          totalSecondsInitial = Math.max(60, totalSecondsInitial - 60);
          updateClockDisplay();
          showHudToast('⏱️ -1 Minuto restado');
        }
      });

      // Clic directo en el reloj para Iniciar / Pausar
      if (countdownEl) {
        countdownEl.style.cursor = 'pointer';
        countdownEl.title = 'Haz clic para Iniciar / Pausar el temporizador';
        countdownEl.addEventListener('click', (e) => {
          if (window.__OSS_IS_EDITING__) return;
          e.stopPropagation();
          toggleBtn?.click();
        });
      }

      // Guardar y Aplicar en el servidor
      document.getElementById('oss-cd-apply')?.addEventListener('click', async () => {
        const inp = document.getElementById('oss-cd-minutes');
        const newMins = parseInt(inp?.value) || 5;
        if (newMins < 1 || newMins > 180) {
          showHudToast('⚠️ El valor debe ser entre 1 y 180 minutos');
          return;
        }

        startTimerEngine(newMins);

        try {
          const res = await fetch('/api/overlays/texts');
          const serverData = await res.json();
          const texts = serverData.texts || {};
          if (!texts.startingSoon) texts.startingSoon = {};
          texts.startingSoon.countdownMinutes = newMins;
          if (isPomo) texts.pomodoroMinutes = newMins;

          let localToken = window.__LOCAL_AUTH_TOKEN__ || localStorage?.getItem('local_auth_token') || '';
          if (!localToken) {
            try {
              const tokRes = await fetch('/api/local-token');
              if (tokRes.ok) { const td = await tokRes.json(); localToken = td.token || ''; }
            } catch(e){}
          }
          await fetch('/api/overlays/texts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(localToken ? {'X-Local-Token': localToken} : {}) },
            body: JSON.stringify({ texts })
          });
          showHudToast(`💾 Tiempo guardado: ${newMins} min sincronizado con OBS Studio`);
        } catch(e) {
          showHudToast('⚠️ Tiempo actualizado localmente (error al persistir)');
        }
      });
    }

    // --- Control especial 2: Speedrun & Splits (Gamer Pro Pack) ---
    const isSpeedrunScene = ['gamer_speedrun'].includes(sceneKey)
      || window.location.pathname.includes('/speedrun_split/')
      || document.querySelector('.sidebar-splits') !== null;

    if (isSpeedrunScene) {
      speedControl = document.createElement('div');
      speedControl.id = 'oss-speedrun-control';
      speedControl.style.cssText = `
        position: fixed; top: 50%; right: 18px; transform: translateY(-50%);
        z-index: 999998; background: rgba(14,18,24,0.96); backdrop-filter: blur(14px);
        border: 1px solid rgba(87,214,196,0.45); border-radius: 8px;
        padding: 14px 18px; font-family: 'JetBrains Mono', monospace;
        font-size: 11px; color: #F0F6FC; box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(87,214,196,0.15);
        display: flex; flex-direction: column; gap: 8px; width: 250px;
      `;
      speedControl.innerHTML = `
        <div class="hud-drag-handle" style="font-weight:700; color:#57D6C4; letter-spacing:0.5px; border-bottom:1px solid rgba(87,214,196,0.2); padding-bottom:7px; display:flex; justify-content:space-between; align-items:center; cursor:grab;" title="Arrastra desde aquí para mover este menú">
          <span>⚡ SPEEDRUN LIVE</span>
          <span style="display:flex; align-items:center; gap:4px;">
            <span id="oss-sr-state" style="font-size:10px; color:#8B949E;">LISTO</span>
            <span style="color:#6E7681; font-size:11px;">⋮⋮</span>
          </span>
        </div>
        <div style="font-size:26px; font-weight:900; color:#FF783F; text-align:center; padding:6px; background:#161B22; border-radius:4px; border:1px solid rgba(255,120,63,0.3); cursor:pointer;" id="oss-sr-readout" title="Clic para Iniciar / Pausar">
          00:09:15
        </div>
        <div style="display:flex; gap:6px;">
          <button id="oss-sr-toggle" type="button" class="hud-btn" style="flex:1; justify-content:center;">▶ Iniciar</button>
          <button id="oss-sr-split" type="button" class="hud-btn" style="flex:1; justify-content:center; background:rgba(87,214,196,0.15); color:#57D6C4; border-color:rgba(87,214,196,0.4);">⚡ Split</button>
        </div>
        <div style="display:flex; gap:6px;">
          <button id="oss-sr-prev-split" type="button" class="hud-btn" style="flex:1; justify-content:center;" title="Retroceder al tramo anterior">⏮ Split Prev</button>
          <button id="oss-sr-reset" type="button" class="hud-btn" style="flex:1; justify-content:center;">🔄 Reset 00:00</button>
        </div>
        <div style="display:flex; gap:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
          <button id="oss-sr-add-split" type="button" class="hud-btn" style="flex:1; justify-content:center; font-size:10px;">➕ Añadir Tramo</button>
          <button id="oss-sr-del-split" type="button" class="hud-btn" style="flex:1; justify-content:center; font-size:10px; color:#F85149;" title="Eliminar el tramo activo">🗑️ Eliminar</button>
        </div>
        <div style="display:flex; align-items:center; gap:4px; margin-top:2px;">
          <span style="color:#8B949E; font-size:10px;">TIEMPO:</span>
          <input id="oss-sr-custom-time" type="text" value="00:09:15" placeholder="hh:mm:ss"
            style="flex:1; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                   border-radius:4px; padding:3px 6px; font-size:11px; font-family:inherit; text-align:center;">
          <button id="oss-sr-set-time" type="button" class="hud-btn" style="padding:3px 6px; font-size:10px;">Fijar</button>
        </div>
        <button id="oss-sr-save" type="button" class="hud-btn btn-save" style="width:100%; justify-content:center; padding:6px; margin-top:2px;">💾 Guardar Tramos y Tiempos</button>
      `;
      document.body.appendChild(speedControl);

      let srInterval = null;
      let srSeconds = 555; // 09:15 inicial
      let srRunning = false;
      const srTimerEl = document.getElementById('speedrun-timer') || document.querySelector('.timer-big');
      const srReadout = document.getElementById('oss-sr-readout');
      const srToggleBtn = document.getElementById('oss-sr-toggle');
      const srStateSpan = document.getElementById('oss-sr-state');

      function formatSrTime(s) {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      }

      function updateSrDisplay() {
        const formatted = formatSrTime(srSeconds);
        if (srReadout) srReadout.textContent = formatted;
        if (srTimerEl) srTimerEl.textContent = formatted;
        const customInput = document.getElementById('oss-sr-custom-time');
        if (customInput && document.activeElement !== customInput) {
          customInput.value = formatted;
        }
      }
      updateSrDisplay();

      // Clic directo en el reloj de la pantalla o en el visor del widget para Iniciar / Pausar
      if (srTimerEl) {
        srTimerEl.style.cursor = 'pointer';
        srTimerEl.title = 'Haz clic para Iniciar / Pausar el cronómetro';
        srTimerEl.addEventListener('click', (e) => {
          if (window.__OSS_IS_EDITING__) return;
          e.stopPropagation();
          srToggleBtn?.click();
        });
      }
      srReadout?.addEventListener('click', () => {
        srToggleBtn?.click();
      });

      srToggleBtn?.addEventListener('click', () => {
        srRunning = !srRunning;
        srToggleBtn.textContent = srRunning ? '⏸ Pausar' : '▶ Reanudar';
        if (srStateSpan) {
          srStateSpan.textContent = srRunning ? 'CORRIENDO' : 'PAUSA';
          srStateSpan.style.color = srRunning ? '#3FB950' : '#FF783F';
        }
        if (srRunning) {
          srInterval = setInterval(() => {
            srSeconds++;
            updateSrDisplay();
          }, 1000);
          showHudToast('▶ Cronómetro de Speedrun en marcha');
        } else {
          if (srInterval) clearInterval(srInterval);
          showHudToast('⏸ Cronómetro pausado');
        }
      });

      // Split siguiente con captura de tiempo
      document.getElementById('oss-sr-split')?.addEventListener('click', () => {
        const rows = document.querySelectorAll('.split-row');
        if (rows.length > 0) {
          let curIdx = -1;
          rows.forEach((r, idx) => { if (r.classList.contains('active')) curIdx = idx; });
          if (curIdx >= 0) {
            const activeRow = rows[curIdx];
            const timeEl = activeRow.querySelector('.split-time');
            if (timeEl) timeEl.textContent = formatSrTime(srSeconds).substring(3); // mm:ss
            activeRow.classList.remove('active');
          }
          const nextIdx = curIdx < rows.length - 1 ? curIdx + 1 : 0;
          rows[nextIdx].classList.add('active');
          rows[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const nextName = rows[nextIdx].querySelector('.split-name')?.textContent?.trim() || `Tramo ${nextIdx+1}`;
          showHudToast(`⚡ Split registrado (${formatSrTime(srSeconds)}) → Siguiente: "${nextName}"`);
        } else {
          showHudToast('⚡ Split registrado');
        }
      });

      // Split anterior
      document.getElementById('oss-sr-prev-split')?.addEventListener('click', () => {
        const rows = document.querySelectorAll('.split-row');
        if (rows.length > 0) {
          let curIdx = -1;
          rows.forEach((r, idx) => { if (r.classList.contains('active')) curIdx = idx; });
          if (curIdx >= 0) rows[curIdx].classList.remove('active');
          const prevIdx = curIdx <= 0 ? rows.length - 1 : curIdx - 1;
          rows[prevIdx].classList.add('active');
          rows[prevIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const prevName = rows[prevIdx].querySelector('.split-name')?.textContent?.trim() || `Tramo ${prevIdx+1}`;
          showHudToast(`⏮ Retrocedido a: "${prevName}"`);
        }
      });

      // Añadir nuevo tramo
      document.getElementById('oss-sr-add-split')?.addEventListener('click', () => {
        const container = document.querySelector('.splits-list');
        if (!container) return;
        const count = container.querySelectorAll('.split-row').length + 1;
        const numStr = String(count).padStart(2, '0');
        const newRow = document.createElement('div');
        newRow.className = 'split-row';
        newRow.innerHTML = `
          <span class="split-name">${numStr} NUEVO TRAMO</span>
          <div class="split-times">
            <span class="split-delta negative">-00:10</span>
            <span class="split-time">--:--</span>
          </div>
        `;
        container.appendChild(newRow);
        newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showHudToast(`➕ Añadido tramo ${numStr} a la lista`);
      });

      // Eliminar tramo activo
      document.getElementById('oss-sr-del-split')?.addEventListener('click', () => {
        const rows = document.querySelectorAll('.split-row');
        if (rows.length <= 1) {
          showHudToast('⚠️ Debe quedar al menos un tramo');
          return;
        }
        const activeRow = document.querySelector('.split-row.active') || rows[rows.length - 1];
        const nextActive = activeRow.previousElementSibling || activeRow.nextElementSibling;
        activeRow.remove();
        if (nextActive && nextActive.classList.contains('split-row')) {
          nextActive.classList.add('active');
        } else {
          document.querySelector('.split-row')?.classList.add('active');
        }
        showHudToast('🗑️ Tramo eliminado');
      });

      // Fijar tiempo manualmente
      document.getElementById('oss-sr-set-time')?.addEventListener('click', () => {
        const inp = document.getElementById('oss-sr-custom-time');
        if (!inp) return;
        const parts = inp.value.trim().split(':').map(Number);
        let s = 0;
        if (parts.length === 3) s = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        else if (parts.length === 2) s = (parts[0] * 60) + parts[1];
        else if (parts.length === 1) s = parts[0];
        if (!isNaN(s) && s >= 0) {
          srSeconds = s;
          updateSrDisplay();
          showHudToast(`⏱️ Tiempo fijado a ${formatSrTime(srSeconds)}`);
        }
      });

      // Guardar tramos y tiempos
      document.getElementById('oss-sr-save')?.addEventListener('click', async () => {
        const btn = document.getElementById('oss-sr-save');
        btn.textContent = '⏳ Guardando...';
        await saveTexts();
        btn.textContent = '💾 Guardar Tramos y Tiempos';
        showHudToast('💾 Tramos y tiempos guardados con éxito');
      });

      // Reset
      document.getElementById('oss-sr-reset')?.addEventListener('click', () => {
        srRunning = false;
        if (srInterval) clearInterval(srInterval);
        srSeconds = 0;
        updateSrDisplay();
        if (srToggleBtn) srToggleBtn.textContent = '▶ Iniciar';
        if (srStateSpan) { srStateSpan.textContent = 'LISTO'; srStateSpan.style.color = '#8B949E'; }
        const rows = document.querySelectorAll('.split-row');
        rows.forEach((r, idx) => {
          r.classList.toggle('active', idx === 0);
        });
        showHudToast('🔄 Cronómetro reseteado a 00:00:00 y vuelto al tramo 1');
      });
    }

    // --- Control especial 3: Frases en rotación (Pantallas Be Right Back y Coffee Break) ---
    const isBrbScene = ['beRightBack', 'oss_brb', 'gamer_brb', 'cozy_brb'].includes(sceneKey)
      || window.location.pathname.includes('/be-right-back/')
      || window.location.pathname.includes('/coffee-break/')
      || document.querySelector('.brb-status-phrase') !== null;

    if (isBrbScene) {
      phrasesControl = document.createElement('div');
      phrasesControl.id = 'oss-brb-phrases-control';
      phrasesControl.style.cssText = `
        position: fixed; top: 50%; right: 18px; transform: translateY(-50%);
        z-index: 999998; background: rgba(14,18,24,0.96); backdrop-filter: blur(14px);
        border: 1px solid rgba(87,214,196,0.45); border-radius: 8px;
        padding: 14px 18px; font-family: 'JetBrains Mono', monospace;
        font-size: 11px; color: #F0F6FC; box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(87,214,196,0.15);
        display: flex; flex-direction: column; gap: 10px; width: 260px;
      `;
      phrasesControl.innerHTML = `
        <div class="hud-drag-handle" style="font-weight:700; color:#57D6C4; letter-spacing:0.5px; border-bottom:1px solid rgba(87,214,196,0.2); padding-bottom:7px; display:flex; justify-content:space-between; align-items:center; cursor:grab;" title="Arrastra desde aquí para mover este menú">
          <span>🔄 FRASES EN ROTACIÓN</span>
          <span style="display:flex; align-items:center; gap:4px;">
            <span id="oss-brb-phrase-counter" style="font-size:10px; color:#8B949E;">1 / 1</span>
            <span style="color:#6E7681; font-size:11px;">⋮⋮</span>
          </span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <button id="oss-brb-prev-phrase" type="button" class="hud-btn" style="flex:1; justify-content:center; padding:3px 6px;">◀ Anterior</button>
          <button id="oss-brb-next-phrase" type="button" class="hud-btn" style="flex:1; justify-content:center; padding:3px 6px;">Siguiente ▶</button>
        </div>
        <label style="display:flex; flex-direction:column; gap:4px;">
          <span style="color:#8B949E; font-size:10px;">EDITAR FRASE SELECCIONADA:</span>
          <textarea id="oss-brb-active-text" rows="2"
            style="width:100%; box-sizing:border-box; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                   border-radius:4px; padding:6px 8px; font-size:12px; font-family:inherit; outline:none; resize:none;"
          ></textarea>
        </label>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <span style="color:#8B949E; font-size:10px;">CAMBIAR CADA:</span>
          <div style="display:flex; align-items:center; gap:4px;">
            <input id="oss-brb-interval" type="number" min="2" max="60" value="6"
              style="width:45px; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                     border-radius:4px; padding:3px 6px; font-size:11px; font-family:inherit; text-align:center;"
            >
            <span style="color:#8B949E; font-size:10px;">seg</span>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button id="oss-brb-add-phrase" type="button" class="hud-btn" style="flex:1; justify-content:center;">➕ Añadir</button>
          <button id="oss-brb-delete-phrase" type="button" class="hud-btn" style="flex:1; justify-content:center; color:#F85149;">🗑️ Borrar</button>
          <button id="oss-brb-save-phrases" type="button" class="hud-btn btn-save" style="flex:1.2; justify-content:center;">💾 Guardar</button>
        </div>
      `;
      document.body.appendChild(phrasesControl);

      let currentPhrases = [
        'TOMANDO UN CAFÉ...',
        'PREPARANDO TODO...',
        'PROBANDO COSAS...',
        'VOLVEMOS ENSEGUIDA'
      ];
      let activeIndex = 0;

      const syncPhrasesUI = () => {
        const cfg = window.OSS_CONFIG || window.TALLER_CONFIG;
        if (cfg?.beRightBack?.statusPhrases?.length) {
          currentPhrases = [...cfg.beRightBack.statusPhrases];
        }
        if (cfg?.beRightBack?.phraseIntervalSeconds) {
          const inpInt = document.getElementById('oss-brb-interval');
          if (inpInt) inpInt.value = cfg.beRightBack.phraseIntervalSeconds;
        }
        renderCurrentPhrase();
      };

      const renderCurrentPhrase = () => {
        if (activeIndex >= currentPhrases.length) activeIndex = 0;
        if (activeIndex < 0) activeIndex = Math.max(0, currentPhrases.length - 1);
        const counter = document.getElementById('oss-brb-phrase-counter');
        const txtArea = document.getElementById('oss-brb-active-text');
        if (counter) counter.textContent = `${activeIndex + 1} / ${currentPhrases.length}`;
        if (txtArea) txtArea.value = currentPhrases[activeIndex] || '';
        const brbEl = document.querySelector('.brb-status-phrase');
        if (brbEl && currentPhrases[activeIndex]) {
          brbEl.textContent = currentPhrases[activeIndex];
        }
      };

      setTimeout(syncPhrasesUI, 800);

      document.getElementById('oss-brb-prev-phrase')?.addEventListener('click', () => {
        window.__OSS_IS_EDITING__ = true;
        activeIndex = (activeIndex - 1 + currentPhrases.length) % currentPhrases.length;
        renderCurrentPhrase();
      });

      document.getElementById('oss-brb-next-phrase')?.addEventListener('click', () => {
        window.__OSS_IS_EDITING__ = true;
        activeIndex = (activeIndex + 1) % currentPhrases.length;
        renderCurrentPhrase();
      });

      document.getElementById('oss-brb-active-text')?.addEventListener('input', (e) => {
        window.__OSS_IS_EDITING__ = true;
        currentPhrases[activeIndex] = e.target.value;
        const brbEl = document.querySelector('.brb-status-phrase');
        if (brbEl) brbEl.textContent = e.target.value;
      });

      document.getElementById('oss-brb-add-phrase')?.addEventListener('click', () => {
        window.__OSS_IS_EDITING__ = true;
        currentPhrases.push('NUEVA FRASE EN ROTACIÓN...');
        activeIndex = currentPhrases.length - 1;
        renderCurrentPhrase();
        showHudToast('➕ Nueva frase añadida a la lista');
      });

      document.getElementById('oss-brb-delete-phrase')?.addEventListener('click', () => {
        if (currentPhrases.length <= 1) {
          showHudToast('⚠️ Debe haber al menos una frase');
          return;
        }
        window.__OSS_IS_EDITING__ = true;
        currentPhrases.splice(activeIndex, 1);
        if (activeIndex >= currentPhrases.length) activeIndex = currentPhrases.length - 1;
        renderCurrentPhrase();
        showHudToast('🗑️ Frase eliminada');
      });

      document.getElementById('oss-brb-save-phrases')?.addEventListener('click', async () => {
        try {
          const sec = parseInt(document.getElementById('oss-brb-interval')?.value) || 6;
          if (!window.OSS_CONFIG) window.OSS_CONFIG = {};
          if (!window.OSS_CONFIG.beRightBack) window.OSS_CONFIG.beRightBack = {};
          window.OSS_CONFIG.beRightBack.statusPhrases = currentPhrases.filter(Boolean);
          window.OSS_CONFIG.beRightBack.phraseIntervalSeconds = sec;

          const res = await fetch('/api/overlays/texts');
          const serverData = await res.json();
          const texts = serverData.texts || {};
          if (!texts.beRightBack) texts.beRightBack = {};
          texts.beRightBack.statusPhrases = currentPhrases.filter(Boolean);
          texts.beRightBack.phraseIntervalSeconds = sec;

          let localToken = window.__LOCAL_AUTH_TOKEN__ || localStorage?.getItem('local_auth_token') || '';
          if (!localToken) {
            try {
              const tokRes = await fetch('/api/local-token');
              if (tokRes.ok) { const td = await tokRes.json(); localToken = td.token || ''; }
            } catch(e){}
          }
          await fetch('/api/overlays/texts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(localToken ? {'X-Local-Token': localToken} : {}) },
            body: JSON.stringify({ texts })
          });
          showHudToast('💾 Frases en rotación guardadas con éxito');
        } catch(e) {
          showHudToast('⚠️ Error al guardar frases en el servidor');
        }
      });
    }

    // Auto-escalado inteligente para que 1920x1080 quepa 100% en la ventana del navegador sin scrollbars
    let autoFitEnabled = true;
    function applyAutoFit() {
      if (typeof window.obsstudio !== 'undefined') return;
      const canvas = document.querySelector('.overlay-canvas');
      if (!canvas) return;

      if (autoFitEnabled) {
        document.documentElement.classList.add('browser-preview-fit');
        document.body.classList.add('browser-preview-fit');
        const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'center center';
      } else {
        document.documentElement.classList.remove('browser-preview-fit');
        document.body.classList.remove('browser-preview-fit');
        canvas.style.transform = '';
      }
    }

    window.addEventListener('resize', applyAutoFit);
    setTimeout(applyAutoFit, 60);

    const btnToggleFit = hud.querySelector('#hud-btn-toggle-fit');
    const lblFitState = hud.querySelector('#hud-fit-state');
    btnToggleFit.addEventListener('click', () => {
      autoFitEnabled = !autoFitEnabled;
      lblFitState.textContent = autoFitEnabled ? 'ON' : 'OFF (1:1)';
      lblFitState.style.color = autoFitEnabled ? '#57D6C4' : '#8B949E';
      applyAutoFit();
      showHudToast(autoFitEnabled ? '📐 Auto-Ajuste activado (sin scrollbars)' : '🔍 Escala original 100% (1920×1080)');
    });

    // Cargar selector de temas
    const themeSelect = hud.querySelector('#hud-theme-select');
    fetch('/api/themes/packs')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.packs) return;
        const currentTheme = document.body.getAttribute('data-theme') || data.activeTheme || 'maker';
        let html = '';
        data.packs.forEach(p => {
          html += `<optgroup label="${p.icon || '📁'} ${p.name}">`;
          (p.themes || []).forEach(t => {
            html += `<option value="${t.id}" ${t.id === currentTheme ? 'selected' : ''}>${t.name}</option>`;
          });
          html += `</optgroup>`;
        });
        themeSelect.innerHTML = html;
      })
      .catch(() => {});

    themeSelect.addEventListener('change', () => {
      const selected = themeSelect.value;
      if (!selected) return;
      document.body.setAttribute('data-theme', selected);
      if (sceneKey) {
        fetch('/api/themes/overlay-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overlayKey: sceneKey, themeId: selected })
        }).catch(() => {});
      }
      showHudToast(`🎨 Estilo aplicado a esta escena: ${selected}`);
    });

    // Modo edición interactiva de textos
    let isEditing = false;
    const btnToggleEdit = hud.querySelector('#hud-btn-toggle-edit');
    const lblEditState = hud.querySelector('#hud-edit-state');
    const quickJumpSelect = hud.querySelector('#hud-quick-jump-select');

    const editableSelectors = [
      // Marca del canal y estados de directo (todas las escenas y packs)
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
      // Starting Soon (todos los packs)
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
      // BRB (todos los packs)
      '.brb-center-content .main-stream-title',
      '.brb-center-content .stream-subtitle',
      '.brb-status-phrase',
      '.brb-footer > div:first-child',
      // Ending (todos los packs)
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
      '.stream-mode-card span'
    ];

    function populateQuickJump() {
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
        if (el.matches('.panel-header span:last-child, .chat-panel-header span:last-child')) tag = 'Estado DEV/SYS';
        else if (el.matches('.panel-header span, .chat-panel-header span, .window-title, .win-header')) tag = 'Cabecera Ventana';
        else if (el.matches('.info-label')) tag = 'Etiqueta Info';
        else if (el.matches('.info-value')) tag = 'Valor Info';
        else if (el.matches('.stream-mode-card span')) tag = 'Modo Emisión';
        else if (el.matches('.run-title, .run-category')) tag = 'Juego Speedrun';
        else if (el.matches('.split-name')) tag = 'Segmento';
        else if (el.matches('.split-time, .split-delta, .timer-big, .pomo-time, .starting-countdown')) tag = 'Tiempo';
        else if (el.matches('.pb-bar span, .pb-bar, .stat-item, .stat-val')) tag = 'Récord/Stat';
        else if (el.matches('.live-indicator span, .live-status span, [data-text-key="status"], .live-status, .live-indicator')) tag = 'Estado Live';
        else if (el.matches('.tag-line, .starting-hero-text > div:first-child, [data-i18n="themes.placeholder_ss_tag"], .game-tag')) tag = 'Etiqueta';
        else if (el.matches('.project-name-value, .panel-project-name')) tag = 'Proyecto';
        else if (el.matches('.panel-project-phase')) tag = 'Fase Activa';
        else if (el.matches('.phase-item')) tag = 'Fase';
        else if (el.matches('.frame-label span:last-child, .frame-label, .camera-label, .cam-label')) tag = 'Marco/Cámara';
        else if (el.matches('.panel-title')) tag = 'Título Panel';
        else if (el.matches('.project-prefix')) tag = 'Prefijo';
        else if (el.matches('.panel-project-detail')) tag = 'Notas';
        else if (el.matches('.brand-name')) tag = 'Streamer';
        else if (el.matches('.brand-tagline')) tag = 'Lema';
        else if (el.matches('.hero-title, .main-stream-title')) tag = 'Título';
        else if (el.matches('.header-subtitle, .hero-subtitle, .stream-subtitle')) tag = 'Subtítulo';
        else if (el.matches('.brb-status-phrase')) tag = 'Frase Rotativa';
        else if (el.matches('.footer-note, .bottom-bar div, .starting-footer div')) tag = 'Pie de página';

        const opt = document.createElement('option');
        opt.value = el.dataset.quickEditId;
        opt.textContent = `✏️ ${tag}: "${shortText}"`;
        quickJumpSelect.appendChild(opt);
      });
    }

    if (quickJumpSelect) {
      quickJumpSelect.addEventListener('change', () => {
        const targetId = quickJumpSelect.value;
        if (!targetId) return;
        const targetEl = document.querySelector(`[data-quick-edit-id="${targetId}"]`);
        if (!targetEl) return;

        if (!isEditing) {
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

        showHudToast(`✏️ Editando: ${targetEl.textContent.trim().substring(0, 25)}`);
      });
    }

    // Captura universal de clics: cualquier texto del canvas es editable
    document.addEventListener('click', (e) => {
      if (!isEditing) return;
      if (e.target.closest('#oss-hud-editor') || e.target.closest('#oss-brb-phrases-control') || e.target.closest('.hud-toast')) return;
      const target = e.target;
      if (!target.isContentEditable && target.textContent && target.textContent.trim().length > 0 && target.children.length === 0) {
        target.setAttribute('contenteditable', 'true');
        target.setAttribute('spellcheck', 'false');
        target.classList.add('editable-screen-element', 'editing-active');
        window.__OSS_IS_EDITING__ = true;
        target.focus();
      }
    }, true);

    btnToggleEdit.addEventListener('click', () => {
      isEditing = !isEditing;
      window.__OSS_IS_EDITING__ = isEditing;
      btnToggleEdit.classList.toggle('active-editing', isEditing);
      lblEditState.textContent = isEditing ? 'ON (ACTIVO)' : 'OFF';
      lblEditState.style.color = isEditing ? '#57D6C4' : '#FF783F';

      if (quickJumpSelect) {
        quickJumpSelect.style.display = isEditing ? 'inline-block' : 'none';
        if (isEditing) populateQuickJump();
      }

      document.querySelectorAll(editableSelectors.join(',')).forEach(el => {
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
        showHudToast('✏️ Haz clic en cualquier texto o usa "🎯 Ir a Texto" para editar sin solapamientos');
      }
    });

    // Guardar cambios en el backend y emitir a OBS
    const btnSave = hud.querySelector('#hud-btn-save-texts');
    btnSave.addEventListener('click', async () => {
      try {
        btnSave.textContent = '⏳ Guardando...';
        const res = await fetch('/api/overlays/texts');
        const data = await res.json();
        const texts = data.texts || {};

        // Recolectar valores editados en vivo
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
          // HeroTag (// STREAM EN DIRECTO)
          const heroTag = document.querySelector('.starting-hero-text > div:first-child')?.textContent?.trim();
          if (heroTag) texts.startingSoon.heroTag = heroTag;

          // Título principal (puede tener 2 líneas: title + highlight)
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

          // Subtítulo
          const sub = document.querySelector('.starting-hero-text .stream-subtitle')?.textContent?.trim()
            || document.querySelector('.stream-subtitle')?.textContent?.trim()
            || document.querySelector('.card p')?.textContent?.trim()
            || document.querySelector('.box p')?.textContent?.trim();
          if (sub) texts.startingSoon.subtitle = sub;

          // Nota de pie
          const footerNote = document.querySelector('.starting-footer > div:first-child, .bottom-bar .footer-note, .bottom-bar > div:first-child')?.textContent?.trim();
          if (footerNote) texts.startingSoon.footerNote = footerNote;

          // Estado del indicador de directo
          const liveLabel = document.querySelector('.live-indicator span:last-child, .live-status span:last-child, [data-text-key="status"], .live-status')?.textContent?.trim();
          if (liveLabel) texts.startingSoon.liveStatusText = liveLabel;

          // Etiquetas de modos de emisión (panel derecho)
          const modeEls = document.querySelectorAll('.ss-mode-label');
          if (modeEls.length > 0) {
            texts.startingSoon.modeLabels = Array.from(modeEls).map(el => el.textContent.trim());
          }
        }

        if (isBRBScene && texts.beRightBack) {
          // Título principal
          const title = document.querySelector('.brb-center-content .main-stream-title')?.textContent?.trim()
            || document.querySelector('.main-stream-title')?.textContent?.trim()
            || document.querySelector('.card h1')?.textContent?.trim()
            || document.querySelector('.box h1')?.textContent?.trim();
          if (title) texts.beRightBack.title = title;

          // Subtítulo
          const subEl = document.querySelector('.brb-center-content .stream-subtitle')?.textContent?.trim()
            || document.querySelector('.stream-subtitle')?.textContent?.trim()
            || document.querySelector('.card p')?.textContent?.trim()
            || document.querySelector('.box p')?.textContent?.trim();
          if (subEl) texts.beRightBack.subtitle = subEl;

          // Frase de estado actual
          const currentPhrase = document.querySelector('.brb-status-phrase')?.textContent?.trim();
          if (currentPhrase && texts.beRightBack.statusPhrases?.length) {
            texts.beRightBack.statusPhrases[0] = currentPhrase;
          }

          // Nota de pie
          const footerNote = document.querySelector('.brb-footer > div:first-child, .bottom-bar .footer-note, .bottom-bar > div:first-child')?.textContent?.trim();
          if (footerNote) texts.beRightBack.footerNote = footerNote;

          // Estado del indicador
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

        // Obtener o asegurar token de autenticación local
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

        btnSave.textContent = '💾 Guardar';
        showHudToast('✓ ¡Textos guardados y sincronizados con OBS Studio!');
      } catch (e) {
        console.error('Error al guardar textos:', e);
        btnSave.textContent = '💾 Guardar';
        showHudToast('⚠️ Error al guardar los textos');
      }
    });

    // Mover barra (Alternar arriba / abajo para no tapar contenido)
    let isDockedTop = false;
    const btnToggleDock = hud.querySelector('#hud-btn-toggle-dock');
    if (btnToggleDock) {
      btnToggleDock.addEventListener('click', () => {
        isDockedTop = !isDockedTop;
        hud.style.left = '50%';
        hud.style.transform = 'translateX(-50%)';
        if (isDockedTop) {
          hud.style.top = '18px';
          hud.style.bottom = 'auto';
          btnToggleDock.textContent = '↕️ Abajo';
          showHudToast('↕️ Barra fijada arriba');
        } else {
          hud.style.bottom = '18px';
          hud.style.top = 'auto';
          btnToggleDock.textContent = '↕️ Arriba';
          showHudToast('↕️ Barra fijada abajo');
        }
      });
    }

    // Sistema universal de arrastre para mover menús flotantes por la pantalla
    function makeDraggable(el, handleSelector) {
      if (!el) return;
      const handle = handleSelector ? (el.querySelector(handleSelector) || el) : el;
      handle.style.cursor = 'grab';

      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initLeft = 0;
      let initTop = 0;

      handle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(e.target.tagName)) return;
        if (e.target.isContentEditable) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = el.getBoundingClientRect();
        initLeft = rect.left;
        initTop = rect.top;

        el.style.bottom = 'auto';
        el.style.right = 'auto';
        el.style.transform = 'none';
        el.style.left = initLeft + 'px';
        el.style.top = initTop + 'px';
        handle.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        function onPointerMove(me) {
          if (!isDragging) return;
          const dx = me.clientX - startX;
          const dy = me.clientY - startY;
          const maxLeft = Math.max(10, window.innerWidth - el.offsetWidth - 10);
          const maxTop = Math.max(10, window.innerHeight - el.offsetHeight - 10);
          el.style.left = Math.max(10, Math.min(maxLeft, initLeft + dx)) + 'px';
          el.style.top = Math.max(10, Math.min(maxTop, initTop + dy)) + 'px';
        }

        function onPointerUp() {
          if (!isDragging) return;
          isDragging = false;
          handle.style.cursor = 'grab';
          document.body.style.userSelect = '';
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
        }

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      });
    }

    makeDraggable(hud, '.hud-drag-handle');
    if (countdownControl) makeDraggable(countdownControl, '.hud-drag-handle');
    if (speedControl) makeDraggable(speedControl, '.hud-drag-handle');
    if (phrasesControl) makeDraggable(phrasesControl, '.hud-drag-handle');

    // Gestión dinámica y delegada de Fases (01, 02, 03, 04) y sincronización con FASE ACTUAL
    window.__refreshHudPhases = function() {
      const hudPhaseSwitcher = hud.querySelector('#hud-phase-switcher');
      const hudPhaseButtons = hud.querySelector('#hud-phase-buttons');
      const phaseItems = document.querySelectorAll('.project-phases .phase-item');
      if (!hudPhaseButtons) return;
      if (phaseItems.length === 0) {
        if (hudPhaseSwitcher) hudPhaseSwitcher.style.display = 'none';
        return;
      }
      if (hudPhaseSwitcher) hudPhaseSwitcher.style.display = 'flex';
      hudPhaseButtons.innerHTML = '';
      phaseItems.forEach(pi => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hud-btn';
        const pText = pi.textContent.trim();
        btn.textContent = pText;
        const isActive = pi.classList.contains('active');
        if (isActive) {
          btn.style.borderColor = '#57D6C4';
          btn.style.color = '#57D6C4';
          btn.style.background = 'rgba(87,214,196,0.18)';
          btn.style.fontWeight = '700';
        }
        btn.addEventListener('click', () => {
          activatePhase(pi);
        });
        hudPhaseButtons.appendChild(btn);
      });
    };

    async function activatePhase(targetPi) {
      const allPhases = document.querySelectorAll('.project-phases .phase-item');
      allPhases.forEach(p => p.classList.remove('active'));
      targetPi.classList.add('active');
      const phaseText = targetPi.textContent.trim();

      // Sincronizar FASE ACTUAL inmediatamente en el panel lateral
      document.querySelectorAll('.panel-project-phase').forEach(pp => {
        pp.textContent = phaseText;
      });

      if (typeof window.__refreshHudPhases === 'function') {
        window.__refreshHudPhases();
      }
      showHudToast(`🏷️ Fase seleccionada: ${phaseText}`);

      // Persistir al servidor para sincronizar con OBS Studio
      try {
        const isPrintMode = document.body.dataset.mode === 'print';
        const section = isPrintMode ? 'print' : 'maker';
        const res = await fetch('/api/overlays/texts');
        if (!res.ok) return;
        const serverData = await res.json();
        const texts = serverData.texts || {};
        if (!texts[section]) texts[section] = {};
        texts[section].currentPhase = phaseText;

        let localToken = window.__LOCAL_AUTH_TOKEN__ || localStorage?.getItem('local_auth_token') || '';
        if (!localToken) {
          try {
            const tokRes = await fetch('/api/local-token');
            if (tokRes.ok) { const td = await tokRes.json(); localToken = td.token || ''; }
          } catch(e){}
        }

        await fetch('/api/overlays/texts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localToken ? { 'X-Local-Token': localToken } : {})
          },
          body: JSON.stringify({ texts })
        });
      } catch(e) {
        console.error('Error al persistir fase activa:', e);
      }
    }

    // Delegación de eventos infalible en document para cualquier .phase-item (incluso tras recargar dinámicamente)
    document.addEventListener('click', (e) => {
      const phaseItem = e.target.closest('.project-phases .phase-item');
      if (phaseItem) {
        if (phaseItem.isContentEditable && document.activeElement === phaseItem) return;
        activatePhase(phaseItem);
        return;
      }

      // Delegación de eventos para Speedrun splits (.split-row)
      const splitRow = e.target.closest('.split-row');
      if (splitRow) {
        if (splitRow.isContentEditable && document.activeElement === splitRow) return;
        document.querySelectorAll('.split-row').forEach(sr => sr.classList.remove('active'));
        splitRow.classList.add('active');
        const sName = splitRow.querySelector('.split-name')?.textContent?.trim() || 'Tramo';
        showHudToast(`⚡ Tramo activo: ${sName}`);
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
        showHudToast(`Delta ajustado a: ${txt}`);
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
        showHudToast(`🎯 Modo ${lbl} ${modeCard.classList.contains(activeClass) ? 'activado' : 'desactivado'}`);
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
        showHudToast(`🏆 Banner cambiado a: ${next}`);
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
          showHudToast(`🎮 Modo de partida: ${valSpan.textContent}`);
        } else {
          const fpsTypes = ['240', '360', '144', '120', '60'];
          let cur = valSpan.textContent.trim();
          let idx = fpsTypes.indexOf(cur);
          valSpan.textContent = fpsTypes[(idx + 1) % fpsTypes.length];
          showHudToast(`⚡ FPS fijados a: ${valSpan.textContent}`);
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
        showHudToast(`📹 Webcam movida a: ${next.replace('-', ' ').toUpperCase()}`);
        return;
      }
    });

    if (typeof window.__refreshHudPhases === 'function') {
      window.__refreshHudPhases();
    }

    // Botón Añadir Fase en HUD
    const btnAddPhase = hud.querySelector('#hud-btn-add-phase');
    if (btnAddPhase && !btnAddPhase.dataset.bound) {
      btnAddPhase.dataset.bound = 'true';
      btnAddPhase.addEventListener('click', async () => {
        const container = document.querySelector('.project-phases');
        if (!container) return;
        const currentCount = container.querySelectorAll('.phase-item').length + 1;
        const numStr = String(currentCount).padStart(2, '0');
        const phaseName = prompt('Nombre de la nueva fase:', `${numStr} FASE ${numStr}`);
        if (!phaseName || !phaseName.trim()) return;
        const div = document.createElement('span');
        div.className = 'phase-divider';
        div.textContent = '·';
        container.appendChild(div);
        const item = document.createElement('div');
        item.className = 'phase-item';
        item.textContent = phaseName.trim();
        container.appendChild(item);
        activatePhase(item);
        await saveTexts();
        showHudToast(`➕ Nueva fase añadida: "${phaseName.trim()}"`);
      });
    }

    // Botón Eliminar Fase en HUD
    const btnDelPhase = hud.querySelector('#hud-btn-del-phase');
    if (btnDelPhase && !btnDelPhase.dataset.bound) {
      btnDelPhase.dataset.bound = 'true';
      btnDelPhase.addEventListener('click', async () => {
        const container = document.querySelector('.project-phases');
        const phaseItems = container?.querySelectorAll('.phase-item');
        if (!container || !phaseItems || phaseItems.length <= 1) {
          showHudToast('⚠️ Debe quedar al menos una fase');
          return;
        }
        const activeItem = container.querySelector('.phase-item.active') || phaseItems[phaseItems.length - 1];
        const divider = activeItem.nextElementSibling?.classList.contains('phase-divider')
          ? activeItem.nextElementSibling
          : activeItem.previousElementSibling?.classList.contains('phase-divider')
            ? activeItem.previousElementSibling
            : null;
        divider?.remove();
        const nextActive = container.querySelector('.phase-item:not(.active)') || container.querySelector('.phase-item');
        activeItem.remove();
        if (nextActive) activatePhase(nextActive);
        await saveTexts();
        showHudToast('🗑️ Fase eliminada');
      });
    }

    // Gestión de distribución de cámaras para Podcast (Open Stream Pack)
    if (sceneKey === 'oss_podcast' || window.location.pathname.includes('/podcast_talk/')) {
      const podSwitcher = hud.querySelector('#hud-podcast-switcher');
      if (podSwitcher) podSwitcher.style.display = 'flex';
      hud.querySelectorAll('.hud-pod-cam-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const cams = parseInt(btn.dataset.cams) || 2;
          const camGrid = document.querySelector('.cam-grid');
          if (!camGrid) return;
          let currentCams = camGrid.querySelectorAll('.guest-cam');
          if (cams === 2) {
            camGrid.style.gridTemplateColumns = '1fr 1fr';
            camGrid.style.gridTemplateRows = 'none';
          } else if (cams === 3) {
            camGrid.style.gridTemplateColumns = '1fr 1fr 1fr';
            camGrid.style.gridTemplateRows = 'none';
          } else if (cams === 4) {
            camGrid.style.gridTemplateColumns = '1fr 1fr';
            camGrid.style.gridTemplateRows = '1fr 1fr';
          }
          while (currentCams.length < cams) {
            const idx = currentCams.length + 1;
            const newCam = document.createElement('div');
            newCam.className = 'guest-cam';
            const colors = ['', 'var(--color-accent-orange)', '#A371F7', '#3FB950'];
            newCam.innerHTML = `<div class="guest-nameplate" style="border-left-color: ${colors[idx-1] || 'var(--color-accent-cyan)'};">INVITADO ${idx - 1}</div>`;
            camGrid.appendChild(newCam);
            currentCams = camGrid.querySelectorAll('.guest-cam');
          }
          while (currentCams.length > cams) {
            currentCams[currentCams.length - 1].remove();
            currentCams = camGrid.querySelectorAll('.guest-cam');
          }
          await saveTexts();
          showHudToast(`🎙️ Configuración cambiada a ${cams} cámaras`);
        });
      });
    }

    // Botón de Restaurar textos a fábrica desde el HUD
    const btnResetTexts = hud.querySelector('#hud-btn-reset-texts');
    if (btnResetTexts) {
      btnResetTexts.addEventListener('click', async () => {
        let section = 'all';
        if (['startingSoon', 'oss_starting', 'gamer_starting', 'cozy_starting'].includes(sceneKey) || window.location.pathname.includes('/starting-soon/')) section = 'startingSoon';
        else if (['beRightBack', 'oss_brb', 'gamer_brb', 'cozy_brb'].includes(sceneKey) || window.location.pathname.includes('/be-right-back/') || window.location.pathname.includes('/coffee-break/')) section = 'beRightBack';
        else if (['ending', 'oss_ending', 'gamer_ending', 'cozy_ending'].includes(sceneKey) || window.location.pathname.includes('/ending/')) section = 'ending';
        else if (sceneKey?.startsWith('maker') || sceneKey === 'oss_desktop' || sceneKey === 'cozy_pomodoro') section = 'maker';
        else if (sceneKey?.startsWith('print') || sceneKey === 'cozy_art') section = 'print';
        else if (sceneKey === 'game' || ['gamer_gameplay', 'gamer_speedrun', 'gamer_victory'].includes(sceneKey)) section = 'game';
        else if (sceneKey === 'chill' || ['oss_chatting', 'oss_podcast', 'cozy_cafe'].includes(sceneKey)) section = 'chill';

        if (!confirm(`¿Restaurar los textos de esta escena (${section.toUpperCase()}) a sus valores originales de fábrica?`)) {
          return;
        }

        try {
          btnResetTexts.textContent = '⏳...';
          const res = await fetch('/api/overlays/texts/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section })
          });
          const data = await res.json();
          if (data && data.status === 'ok') {
            applyConfigToDOM(data.texts);
            if (isEditing) {
              // Refrescar quickJump si estaba editando
              populateQuickJump();
            }
            showHudToast(`↺ Textos de "${section}" restaurados a los originales de fábrica`);
          }
        } catch (e) {
          showHudToast('⚠️ Error al restaurar textos');
        } finally {
          btnResetTexts.textContent = '🔄 Restaurar';
        }
      });
    }

    // Alternar fondo de prueba vs transparencia OBS
    const btnToggleBg = hud.querySelector('#hud-btn-toggle-bg');
    btnToggleBg.addEventListener('click', () => {
      document.body.classList.toggle('browser-preview-mode');
      const isTrans = !document.body.classList.contains('browser-preview-mode');
      btnToggleBg.textContent = isTrans ? '🔳 Modo OBS (Transp)' : '👁️ Fondo OBS';
    });

    // Minimizar / Restaurar
    const btnMin = hud.querySelector('#hud-btn-toggle-min');
    btnMin.addEventListener('click', () => {
      hud.classList.toggle('minimized');
      btnMin.textContent = hud.classList.contains('minimized') ? '🛠️ Editor' : '▲';
    });
  }

  function showHudToast(msg) {
    const prev = document.querySelector('.hud-toast');
    if (prev) prev.remove();
    const toast = document.createElement('div');
    toast.className = 'hud-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Exportar utilidades globales
  window.OSSOverlay = {
    init: initOverlay,
    icons: SVG_ICONS
  };

  // Autoejecutar al cargar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOverlay);
  } else {
    initOverlay();
  }
})();
