/**
 * app/common/overlay/dom-injector.js — Inyector de configuración visual al DOM de las escenas
 */

window.OSSDomInjector = (function() {
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  let brbInterval = null;
  let countdownInterval = null;

  function getIcons() {
    return window.OSSIcons || (window.OSSOverlay && window.OSSOverlay.icons) || {};
  }

  function applyConfigToDOM(config) {
    if (!config) return;
    window.OSS_CONFIG = Object.assign(window.OSS_CONFIG || {}, config);
    const icons = getIcons();

    // 1. Gestión de animaciones
    if (config.performance && config.performance.enableAnimations === false) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }

    // 1.5 Inyección Universal de data-text-key (Contrato estándar para nuevos packs)
    const activeSceneKey = window.__CURRENT_SCENE_KEY__ || document.body.dataset.scene || null;
    document.querySelectorAll('[data-text-key]').forEach(el => {
      const key = el.getAttribute('data-text-key');
      if (!key) return;
      let curr = undefined;
      if (activeSceneKey && config.customScenes && config.customScenes[activeSceneKey] && config.customScenes[activeSceneKey][key] !== undefined) {
        curr = config.customScenes[activeSceneKey][key];
      }
      if (curr === undefined) {
        const parts = key.split('.');
        let ptr = config;
        for (const p of parts) {
          if (ptr && typeof ptr === 'object' && p in ptr) {
            ptr = ptr[p];
          } else {
            ptr = undefined;
            break;
          }
        }
        curr = ptr;
      }
      if (curr !== undefined && curr !== null && typeof curr !== 'object') {
        if (el.textContent.trim() !== String(curr)) {
          el.textContent = String(curr);
        }
      }
    });

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
            html += `<div class="social-item">${icons[net] || ''} <span>${escapeHtml(socials[net])}</span></div>`;
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
              <span class="split-name">${escapeHtml(sp.name || "Tramo")}</span>
              <div class="split-times">
                <span class="split-delta ${deltaClass}">${escapeHtml(sp.delta || "±00:00")}</span>
                <span class="split-time">${escapeHtml(sp.time || "--:--")}</span>
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

      // El marco del chat SIEMPRE permanece; solo se ocultan los mensajes.
      const chillEmbed = document.querySelector('.chat-panel-frame .scene-chat-embed');
      const chillBody = document.querySelector('.chat-content-viewport');
      if (config.chill.showChatPanel === false) {
        if (chillEmbed) chillEmbed.style.display = 'none';
        else if (chillBody) chillBody.style.display = 'none';
      } else {
        if (chillEmbed) chillEmbed.style.display = 'block';
        else if (chillBody) chillBody.style.display = '';
      }
    }

    // 7b. Marcos de chat por escena (café y just chatting)
    if (window.location.pathname.includes('/cafe_chat/') && config.cozy) {
      const cozyEmbed = document.querySelector('.cozy-chat-card .scene-chat-embed');
      const hide = config.cozy.showChatPanel === false;
      if (cozyEmbed) cozyEmbed.style.display = hide ? 'none' : 'block';
      else {
        const list = document.querySelector('.cozy-chat-card .cozy-message-pill')?.parentElement;
        if (list) list.style.display = hide ? 'none' : '';
      }
    }
    if (window.location.pathname.includes('/just_chatting/') && config.oss) {
      const ossEmbed = document.querySelector('.chat-column .scene-chat-embed');
      const hide = config.oss.showChatPanel === false;
      if (ossEmbed) ossEmbed.style.display = hide ? 'none' : 'block';
      else {
        const body = document.querySelector('.chat-column > div:nth-child(2)');
        if (body) body.style.display = hide ? 'none' : '';
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

      if (Array.isArray(s.modeLabels)) {
        document.querySelectorAll('.ss-mode-label').forEach((el, idx) => {
          if (s.modeLabels[idx] !== undefined) {
            el.textContent = s.modeLabels[idx];
          }
        });
      }

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
      if (pomoEl && !pomoEl.isContentEditable) {
        if (config.cozy?.pomodoro?.pomoTime) {
          pomoEl.textContent = config.cozy.pomodoro.pomoTime;
        } else if (!pomoEl.textContent.trim()) {
          pomoEl.textContent = "25:00";
        }
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
          if (window.__OSS_IS_EDITING__) return;
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

    // 11. Cozy Lo-Fi Pack
    if (config.cozy) {
      if (config.cozy.pomodoro) {
        const cp = config.cozy.pomodoro;
        if (cp.pomoTitle) {
          const pt = document.querySelector('.header-title span:last-child');
          if (pt) pt.textContent = cp.pomoTitle;
        }
        if (cp.pomoTime) {
          const pt = document.querySelector('.pomo-time');
          if (pt) pt.textContent = cp.pomoTime;
        }
        if (cp.pomoBadge) {
          const pb = document.querySelector('.pomo-badge');
          if (pb) pb.textContent = cp.pomoBadge;
        }
        if (Array.isArray(cp.ambientItems)) {
          const ambSpans = document.querySelectorAll('.ambient-pill span');
          cp.ambientItems.forEach((txt, i) => {
            if (ambSpans[i]) ambSpans[i].textContent = txt;
          });
        }
        if (Array.isArray(cp.taskItems)) {
          const taskEls = document.querySelectorAll('.task-item');
          cp.taskItems.forEach((t, i) => {
            if (taskEls[i]) {
              taskEls[i].classList.toggle('done', !!t.done);
              const label = taskEls[i].querySelector('span:last-child');
              if (label) label.textContent = t.text;
            }
          });
        }
      }
      if (config.cozy.art) {
        const ca = config.cozy.art;
        if (ca.canvasTag) {
          const ct = document.querySelector('.canvas-tag span:last-child');
          if (ct) ct.textContent = ca.canvasTag;
        }
        if (ca.brushTool) {
          const bt = document.querySelector('.tools-palette-bar div:last-child');
          if (bt) bt.textContent = ca.brushTool;
        }
        if (ca.faceFooter) {
          const ff = document.querySelector('.face-footer');
          if (ff) ff.textContent = ca.faceFooter;
        }
        if (Array.isArray(ca.projectFields)) {
          const fieldEls = document.querySelectorAll('.project-field');
          ca.projectFields.forEach((f, i) => {
            if (fieldEls[i]) {
              const lbl = fieldEls[i].querySelector('.field-label');
              const val = fieldEls[i].querySelector('.field-value');
              if (lbl && f.label) lbl.textContent = f.label;
              if (val && f.value) val.textContent = f.value;
            }
          });
        }
      }
      if (config.cozy.cafe) {
        const cc = config.cozy.cafe;
        if (cc.handwritten) {
          const hw = document.querySelector('.polaroid-handwritten');
          if (hw) hw.textContent = cc.handwritten;
        }
        if (cc.handle) {
          const h = document.querySelector('.polaroid-footer span:last-child');
          if (h) h.textContent = cc.handle;
        }
        if (cc.trackTitle) {
          const tt = document.querySelector('.track-title');
          if (tt) tt.textContent = cc.trackTitle;
        }
        if (cc.trackAuthor) {
          const ta = document.querySelector('.track-author');
          if (ta) ta.textContent = cc.trackAuthor;
        }
        if (cc.chatTitle) {
          const ct = document.querySelector('.chat-header-title span:last-child');
          if (ct) ct.textContent = cc.chatTitle;
        }
        if (cc.goalText) {
          const gt = document.querySelector('.goal-text');
          if (gt) gt.textContent = cc.goalText;
        }
        if (cc.goalCount) {
          const gc = document.querySelector('.goal-count');
          if (gc) gc.textContent = cc.goalCount;
        }
      }
    }

    // 12. Gamer Pro Pack
    if (config.gamer) {
      if (config.gamer.telemetry) {
        const gt = config.gamer.telemetry;
        if (gt.serverInfo) {
          const si = document.querySelector('.server-info');
          if (si) si.textContent = gt.serverInfo;
        }
        if (gt.heroTag) {
          const ht = document.querySelector('.hero-tag');
          if (ht) ht.textContent = gt.heroTag;
        }
        if (Array.isArray(gt.telemetry)) {
          const pills = document.querySelectorAll('.telemetry-pills div');
          gt.telemetry.forEach((t, i) => {
            if (pills[i]) pills[i].textContent = t;
          });
        }
        if (Array.isArray(gt.mapPills)) {
          const mp = document.querySelectorAll('.map-pill');
          gt.mapPills.forEach((p, i) => {
            if (mp[i]) {
              const nameSpan = mp[i].querySelector('span:first-child');
              const statusSpan = mp[i].querySelector('span:last-child');
              if (nameSpan && p.name) nameSpan.textContent = p.name;
              if (statusSpan && p.status) statusSpan.textContent = p.status;
              mp[i].classList.toggle('picked', !!p.picked);
            }
          });
        }
        if (gt.arenaBottom) {
          const ab = document.querySelector('.arena-bottom-bar > div:first-child');
          if (ab) ab.textContent = gt.arenaBottom;
        }
      }
    }

    // 13. Mapeo Universal Infalible (customScenes)
    if (config.customScenes) {
      const p = window.location.pathname;
      let matchedKey = null;

      if (p.includes('/study_pomodoro/')) matchedKey = 'cozy_pomodoro';
      else if (p.includes('/art_dual_cam/')) matchedKey = 'cozy_art';
      else if (p.includes('/cafe_chat/')) matchedKey = 'cozy_cafe';
      else if (p.includes('/maker/desk/')) matchedKey = 'maker-desk';
      else if (p.includes('/maker/pc/')) matchedKey = 'maker-pc';
      else if (p.includes('/print/machine/')) matchedKey = 'print-machine';
      else if (p.includes('/print/design/')) matchedKey = 'print-design';
      else if (p.includes('/gameplay_hud/')) matchedKey = 'gamer_gameplay';
      else if (p.includes('/speedrun_split/')) matchedKey = 'gamer_speedrun';
      else if (p.includes('/victory_clutch/')) matchedKey = 'gamer_victory';
      else if (p.includes('/just_chatting/')) matchedKey = 'oss_chatting';
      else if (p.includes('/desktop_share/')) matchedKey = 'oss_desktop';
      else if (p.includes('/podcast_talk/')) matchedKey = 'oss_podcast';
      else if (p.includes('/chill/')) matchedKey = 'chill';
      else if (p.includes('/game/')) matchedKey = 'game';
      else if (p.includes('/starting-soon/')) {
        if (p.includes('Cozy')) matchedKey = 'cozy_starting';
        else if (p.includes('Gamer')) matchedKey = 'gamer_starting';
        else if (p.includes('Open_stream')) matchedKey = 'oss_starting';
        else matchedKey = 'startingSoon';
      }
      else if (p.includes('/be-right-back/') || p.includes('/coffee-break/')) {
        if (p.includes('Cozy')) matchedKey = 'cozy_brb';
        else if (p.includes('Gamer')) matchedKey = 'gamer_brb';
        else if (p.includes('Open_stream')) matchedKey = 'oss_brb';
        else matchedKey = 'beRightBack';
      }
      else if (p.includes('/ending/')) {
        if (p.includes('Cozy')) matchedKey = 'cozy_ending';
        else if (p.includes('Gamer')) matchedKey = 'gamer_ending';
        else if (p.includes('Open_stream')) matchedKey = 'oss_ending';
        else matchedKey = 'ending';
      }

      if (!matchedKey) {
        for (const k of Object.keys(config.customScenes)) {
          if (p.includes(k) || (document.body.dataset.scene === k)) {
            matchedKey = k;
            break;
          }
        }
      }
      if (matchedKey && config.customScenes[matchedKey]) {
        const keyStore = config.customScenes[matchedKey];
        for (const [token, val] of Object.entries(keyStore)) {
          if (!val) continue;
          const [sel, idxStr] = token.split('::');
          const idx = parseInt(idxStr, 10);
          try {
            const matches = document.querySelectorAll(sel);
            const target = (!isNaN(idx) && matches[idx]) ? matches[idx] : matches[0];
            if (target && target.textContent.trim() !== val) {
              target.textContent = val;
            }
          } catch (e) {}
        }
      }
    }
  }

  function injectIcons() {
    const icons = getIcons();
    document.querySelectorAll('[data-icon]').forEach(el => {
      const iconKey = el.getAttribute('data-icon');
      if (icons[iconKey]) {
        el.innerHTML = icons[iconKey];
      }
    });
  }

  return {
    applyConfigToDOM: applyConfigToDOM,
    injectIcons: injectIcons
  };
})();
