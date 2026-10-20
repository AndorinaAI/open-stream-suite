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
    const isStartingSoon = document.querySelector('.starting-container') !== null;
    const isBRB = document.querySelector('.brb-container') !== null;
    const isEnding = document.querySelector('.ending-container') !== null;

    document.querySelectorAll('.live-indicator').forEach(el => {
      if (config.channel?.showLiveIndicator === false && !isStartingSoon && !isBRB && !isEnding) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
      const label = el.querySelector('span:last-child');
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
    const gameBadgeUnder = document.querySelector('.game-mode-badge-under span:last-child');
    if (gameBadgeUnder && config.game?.badgeText) {
      gameBadgeUnder.textContent = config.game.badgeText;
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
        projConfig.phases.forEach((phaseText, idx) => {
          const item = document.createElement('div');
          item.className = 'phase-item';
          const cur = projConfig.currentPhase || '';
          if (cur && (phaseText.includes(cur) || cur.includes(phaseText))) {
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

    // 7. Chill mode
    if (document.body.dataset.mode === 'chill' && config.chill) {
      const headerSub = document.querySelector('.scene-header.theme-chill .header-subtitle');
      if (headerSub && config.chill.subtitle) {
        headerSub.textContent = config.chill.subtitle;
      }

      const chatTitleEl = document.querySelector('.chat-title span:last-child');
      if (chatTitleEl && config.chill.chatTitle) {
        chatTitleEl.textContent = config.chill.chatTitle;
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
      const heroTag = document.querySelector('.starting-hero-text > div:first-child');
      if (heroTag && s.heroTag) heroTag.textContent = s.heroTag;

      const mainTitle = document.querySelector('.starting-hero-text .main-stream-title');
      if (mainTitle) {
        if (s.highlight) {
          mainTitle.innerHTML = `${s.title || 'ENSEGUIDA'}<br><span class="title-cyan-accent">${s.highlight}</span>`;
        } else if (s.title) {
          mainTitle.textContent = s.title;
        }
      }

      const subtitle = document.querySelector('.starting-hero-text .stream-subtitle');
      if (subtitle && s.subtitle) subtitle.textContent = s.subtitle;

      const footerNote = document.querySelector('.starting-footer > div:first-child');
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

      // Cuenta atrás o barra de carga
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

    // 9. Pantalla BE RIGHT BACK — Rotación de frases y textos
    if (isBRB && config.beRightBack) {
      const b = config.beRightBack;
      const titleEl = document.querySelector('.brb-center-content .main-stream-title');
      if (titleEl && b.title) titleEl.textContent = b.title;

      const subEl = document.querySelector('.brb-center-content .stream-subtitle');
      if (subEl && b.subtitle) subEl.textContent = b.subtitle;

      const footerNote = document.querySelector('.brb-footer > div:first-child');
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
          pIdx = (pIdx + 1) % phrases.length;
          brbPhraseEl.style.opacity = '0';
          setTimeout(() => {
            brbPhraseEl.textContent = phrases[pIdx];
            brbPhraseEl.style.opacity = '1';
          }, 300);
        }, intervalSec);
      }
    }

    // 10. Pantalla ENDING — Textos y tarjeta de despedida
    if (isEnding && config.ending) {
      const e = config.ending;
      const titleEl = document.querySelector('.ending-center-content .main-stream-title');
      if (titleEl && e.title) titleEl.textContent = e.title;

      const subEl = document.querySelector('.ending-center-content .stream-subtitle');
      if (subEl && e.subtitle) subEl.textContent = e.subtitle;

      const cardMsg = document.querySelector('.ending-farewell-card p');
      if (cardMsg && (e.farewellMessage || e.farewellText)) {
        cardMsg.textContent = e.farewellMessage || e.farewellText;
      }

      const cardTag = document.querySelector('.ending-farewell-card div');
      if (cardTag && e.farewellTag) {
        cardTag.textContent = e.farewellTag;
      }

      const footerNote = document.querySelector('.ending-footer > div:first-child');
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
      </div>

      <button type="button" class="hud-btn" id="hud-btn-toggle-min" style="padding:4px 6px; font-size:10px;" title="Minimizar barra">
        ▲
      </button>
    `;
    document.body.appendChild(hud);

    // --- Control especial: minutos de cuenta atrás (solo Starting Soon) ---
    if (sceneKey === 'startingSoon') {
      const countdownControl = document.createElement('div');
      countdownControl.id = 'oss-countdown-control';
      countdownControl.style.cssText = `
        position: fixed; top: 50%; right: 18px; transform: translateY(-50%);
        z-index: 999998; background: rgba(14,18,24,0.96); backdrop-filter: blur(14px);
        border: 1px solid rgba(87,214,196,0.45); border-radius: 8px;
        padding: 14px 18px; font-family: 'JetBrains Mono', monospace;
        font-size: 11px; color: #F0F6FC; box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(87,214,196,0.15);
        display: flex; flex-direction: column; gap: 10px; min-width: 190px;
      `;
      countdownControl.innerHTML = `
        <div style="font-weight:700; color:#57D6C4; letter-spacing:0.5px; border-bottom:1px solid rgba(87,214,196,0.2); padding-bottom:7px; margin-bottom:3px;">
          ⏱️ CUENTA ATRÁS
        </div>
        <label style="display:flex; flex-direction:column; gap:4px;">
          <span style="color:#8B949E; font-size:10px;">MINUTOS PARA EMPEZAR</span>
          <div style="display:flex; align-items:center; gap:6px;">
            <input id="oss-cd-minutes" type="number" min="1" max="60" step="1" value="5"
              style="width:60px; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                     border-radius:4px; padding:5px 8px; font-size:14px; font-family:inherit;
                     font-weight:700; outline:none; text-align:center;"
            >
            <span style="color:#8B949E;">min</span>
          </div>
        </label>
        <button id="oss-cd-apply" type="button" style="
          background:#57D6C4; color:#0D1117; border:none; border-radius:4px;
          padding:6px 10px; font-size:11px; font-family:inherit; font-weight:700;
          cursor:pointer; transition:background 0.2s;
        ">&#9654; Aplicar y Reiniciar</button>
        <div id="oss-cd-preview" style="color:#57D6C4; font-size:12px; font-weight:600; text-align:center;">5:00</div>
      `;
      document.body.appendChild(countdownControl);

      // Sincronizar valor inicial desde el config cargado
      const syncCdInput = () => {
        const cfg = window.OSS_CONFIG || window.TALLER_CONFIG;
        const mins = cfg?.startingSoon?.countdownMinutes;
        if (mins && mins > 0) {
          const inp = document.getElementById('oss-cd-minutes');
          if (inp) inp.value = mins;
          const prev = document.getElementById('oss-cd-preview');
          if (prev) prev.textContent = `${String(mins).padStart(2,'0')}:00`;
        }
      };
      setTimeout(syncCdInput, 800); // esperar a que overlay.js cargue la config

      // Preview en tiempo real mientras escribe
      document.getElementById('oss-cd-minutes')?.addEventListener('input', (e) => {
        const m = parseInt(e.target.value) || 0;
        const prev = document.getElementById('oss-cd-preview');
        if (prev) prev.textContent = m > 0 ? `${String(m).padStart(2,'0')}:00` : '--:--';
      });

      // Aplicar: actualizar OSS_CONFIG, reiniciar cuenta atrás y barra
      document.getElementById('oss-cd-apply')?.addEventListener('click', async () => {
        const inp = document.getElementById('oss-cd-minutes');
        const newMins = parseInt(inp?.value) || 5;
        if (newMins < 1 || newMins > 60) {
          showHudToast('⚠️ El valor debe ser entre 1 y 60 minutos');
          return;
        }

        // 1. Actualizar config en memoria y reiniciar el timer
        if (!window.OSS_CONFIG) window.OSS_CONFIG = {};
        if (!window.OSS_CONFIG.startingSoon) window.OSS_CONFIG.startingSoon = {};
        window.OSS_CONFIG.startingSoon.countdownMinutes = newMins;

        // 2. Reiniciar cuenta atrás visual
        if (countdownInterval) clearInterval(countdownInterval);
        const countdownEl = document.querySelector('.starting-countdown');
        const progressFill = document.querySelector('.tech-progress-fill');
        let totalSeconds = newMins * 60;
        const initialTotal = totalSeconds;

        function updateClock() {
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;
          if (countdownEl) countdownEl.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
          if (progressFill) {
            const pct = Math.min(100, Math.max(0, ((initialTotal - totalSeconds) / initialTotal) * 100));
            progressFill.style.width = `${pct}%`;
          }
          if (totalSeconds > 0) {
            totalSeconds--;
          } else {
            if (countdownEl) countdownEl.textContent = '00:00 - ¡EMPEZANDO!';
            clearInterval(countdownInterval);
          }
        }
        updateClock();
        countdownInterval = setInterval(updateClock, 1000);

        // 3. Persistir en el servidor
        try {
          const res = await fetch('/api/overlays/texts');
          const serverData = await res.json();
          const texts = serverData.texts || {};
          if (!texts.startingSoon) texts.startingSoon = {};
          texts.startingSoon.countdownMinutes = newMins;

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
          showHudToast(`⏱️ Cuenta atrás actualizada: ${newMins} min — reiniciando...`);
        } catch(e) {
          showHudToast('⚠️ Timer actualizado localmente (error al guardar en servidor)');
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
      // Marca del canal (todas las escenas)
      '.brand-name',
      '.brand-tagline',
      '.live-indicator span:last-child',
      // Game
      '.game-mode-badge-under span:last-child',
      // Maker / Print
      '.project-prefix',
      '.project-name-value',
      '.panel-project-name',
      '.panel-project-title',
      '.panel-project-phase',
      '.panel-project-detail',
      '.panel-title',
      '.info-label',
      '.frame-label span:last-child',
      '.camera-label',
      '.phase-item',
      // Chill
      '.header-subtitle',
      '.chat-title',
      '.chat-topic',
      // Starting Soon (selectores reales del HTML)
      '.starting-hero-text > div:first-child',       // heroTag
      '.starting-hero-text .main-stream-title',       // título + highlight
      '.starting-hero-text .stream-subtitle',         // subtítulo
      '.starting-footer > div:first-child',           // footerNote starting
      '.ss-mode-label',                               // etiquetas de modos de emisión
      // BRB (selectores reales del HTML)
      '.brb-center-content .main-stream-title',       // título BRB
      '.brb-center-content .stream-subtitle',         // subtítulo BRB
      '.brb-status-phrase',                           // frase rotante actual
      '.brb-footer > div:first-child',                // footerNote BRB
      // Ending (selectores reales del HTML)
      '.ending-center-content .main-stream-title',    // título ending
      '.ending-center-content .stream-subtitle',      // subtítulo ending
      '.ending-farewell-card p',                      // mensaje de despedida
      '.ending-farewell-card div',                    // tag de despedida
      '.ending-footer > div:first-child',             // footerNote ending
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
        if (el.matches('.project-name-value, .panel-project-name')) tag = 'Proyecto';
        else if (el.matches('.panel-project-phase')) tag = 'Fase Activa';
        else if (el.matches('.phase-item')) tag = 'Fase';
        else if (el.matches('.frame-label span:last-child, .frame-label, .camera-label')) tag = 'Marco/Cámara';
        else if (el.matches('.panel-title')) tag = 'Título Panel';
        else if (el.matches('.project-prefix')) tag = 'Prefijo';
        else if (el.matches('.panel-project-detail')) tag = 'Notas';
        else if (el.matches('.brand-name')) tag = 'Streamer';
        else if (el.matches('.brand-tagline')) tag = 'Lema';
        else if (el.matches('.hero-title')) tag = 'Título';
        else if (el.matches('.header-subtitle, .hero-subtitle')) tag = 'Subtítulo';

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

    btnToggleEdit.addEventListener('click', () => {
      isEditing = !isEditing;
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
            try {
              const range = document.createRange();
              range.selectNodeContents(el);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            } catch (err) {}
          };
        } else {
          el.removeAttribute('contenteditable');
          el.removeAttribute('title');
          el.onclick = null;
          el.onfocus = null;
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
        const liveText = document.querySelector('.live-indicator span:last-child')?.textContent?.trim();

        if (texts.channel) {
          if (brandName) texts.channel.name = brandName;
          if (brandTagline) texts.channel.tagline = brandTagline;
          if (liveText) texts.channel.liveText = liveText;
        }

        if (sceneKey === 'game' && texts.game) {
          const badgeText = document.querySelector('.game-mode-badge-under span:last-child')?.textContent?.trim();
          if (badgeText) texts.game.badgeText = badgeText;
        }

        if ((sceneKey === 'maker-desk' || sceneKey === 'maker-pc' || sceneKey === 'maker') && texts.maker) {
          const projName = document.querySelector('.project-name-value')?.textContent?.trim() || document.querySelector('.panel-project-name')?.textContent?.trim();
          const projTitle = document.querySelector('.panel-project-title')?.textContent?.trim();
          const projPhase = document.querySelector('.panel-project-phase')?.textContent?.trim();
          const projDetail = document.querySelector('.panel-project-detail')?.textContent?.trim();
          if (projName) {
            texts.maker.projectName = projName;
            document.querySelectorAll('.project-name-value, .panel-project-name').forEach(el => el.textContent = projName);
          }
          if (projTitle) texts.maker.projectTitle = projTitle;
          if (projPhase) texts.maker.currentPhase = projPhase;
          if (projDetail) texts.maker.detail = projDetail;

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

        if ((sceneKey === 'print-machine' || sceneKey === 'print-design' || sceneKey === 'print') && texts.print) {
          const projName = document.querySelector('.project-name-value')?.textContent?.trim() || document.querySelector('.panel-project-name')?.textContent?.trim();
          const projPhase = document.querySelector('.panel-project-phase')?.textContent?.trim();
          const projMat = document.querySelector('.panel-project-detail')?.textContent?.trim();
          if (projName) {
            texts.print.projectName = projName;
            document.querySelectorAll('.project-name-value, .panel-project-name').forEach(el => el.textContent = projName);
          }
          if (projPhase) texts.print.currentPhase = projPhase;
          if (projMat) texts.print.material = projMat;

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

        if (sceneKey === 'chill' && texts.chill) {
          const sub = document.querySelector('.header-subtitle')?.textContent?.trim();
          if (sub) texts.chill.subtitle = sub;
          const chatTitle = document.querySelector('.chat-title span:last-child')?.textContent?.trim();
          if (chatTitle) texts.chill.chatTitle = chatTitle;
        }

        if (sceneKey === 'startingSoon' && texts.startingSoon) {
          // HeroTag (// STREAM EN DIRECTO)
          const heroTag = document.querySelector('.starting-hero-text > div:first-child')?.textContent?.trim();
          if (heroTag) texts.startingSoon.heroTag = heroTag;

          // Título principal (puede tener 2 líneas: title + highlight)
          const mainTitle = document.querySelector('.starting-hero-text .main-stream-title');
          if (mainTitle) {
            const accentSpan = mainTitle.querySelector('.title-cyan-accent');
            if (accentSpan) {
              // Extraer la primera línea (title) y el span (highlight) por separado
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
          const sub = document.querySelector('.starting-hero-text .stream-subtitle')?.textContent?.trim();
          if (sub) texts.startingSoon.subtitle = sub;

          // Nota de pie
          const footerNote = document.querySelector('.starting-footer > div:first-child')?.textContent?.trim();
          if (footerNote) texts.startingSoon.footerNote = footerNote;

          // Estado del indicador de directo
          const liveLabel = document.querySelector('.live-indicator span:last-child')?.textContent?.trim();
          if (liveLabel) texts.startingSoon.liveStatusText = liveLabel;

          // Etiquetas de modos de emisión (panel derecho)
          const modeEls = document.querySelectorAll('.ss-mode-label');
          if (modeEls.length > 0) {
            texts.startingSoon.modeLabels = Array.from(modeEls).map(el => el.textContent.trim());
          }
        }

        if (sceneKey === 'beRightBack' && texts.beRightBack) {
          // Título principal
          const title = document.querySelector('.brb-center-content .main-stream-title')?.textContent?.trim();
          if (title) texts.beRightBack.title = title;

          // Subtítulo
          const subEl = document.querySelector('.brb-center-content .stream-subtitle')?.textContent?.trim();
          if (subEl) texts.beRightBack.subtitle = subEl;

          // Frase de estado actual (sólo la visible ahora)
          const currentPhrase = document.querySelector('.brb-status-phrase')?.textContent?.trim();
          if (currentPhrase && texts.beRightBack.statusPhrases?.length) {
            texts.beRightBack.statusPhrases[0] = currentPhrase;
          }

          // Nota de pie
          const footerNote = document.querySelector('.brb-footer > div:first-child')?.textContent?.trim();
          if (footerNote) texts.beRightBack.footerNote = footerNote;

          // Estado del indicador
          const liveLabel = document.querySelector('.live-indicator span:last-child')?.textContent?.trim();
          if (liveLabel) texts.beRightBack.liveStatusText = liveLabel;
        }

        if (sceneKey === 'ending' && texts.ending) {
          const titleEl = document.querySelector('.ending-center-content .main-stream-title')?.textContent?.trim();
          if (titleEl) texts.ending.title = titleEl;

          const subEl = document.querySelector('.ending-center-content .stream-subtitle')?.textContent?.trim();
          if (subEl) texts.ending.subtitle = subEl;

          const fareMsg = document.querySelector('.ending-farewell-card p')?.textContent?.trim();
          if (fareMsg) texts.ending.farewellMessage = fareMsg;

          const fareTag = document.querySelector('.ending-farewell-card div')?.textContent?.trim();
          if (fareTag) texts.ending.farewellTag = fareTag;

          const footerNote = document.querySelector('.ending-footer > div:first-child')?.textContent?.trim();
          if (footerNote) texts.ending.footerNote = footerNote;

          const liveLabel = document.querySelector('.live-indicator span:last-child')?.textContent?.trim();
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

    // Arrastre libre de la barra desde el asa (hud-drag-handle)
    const dragHandle = hud.querySelector('.hud-drag-handle');
    if (dragHandle) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initLeft = 0;
      let initTop = 0;

      dragHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = hud.getBoundingClientRect();
        initLeft = rect.left;
        initTop = rect.top;
        hud.style.bottom = 'auto';
        hud.style.transform = 'none';
        hud.style.left = initLeft + 'px';
        hud.style.top = initTop + 'px';
        dragHandle.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        function onMouseMove(me) {
          if (!isDragging) return;
          const dx = me.clientX - startX;
          const dy = me.clientY - startY;
          hud.style.left = Math.max(10, Math.min(window.innerWidth - hud.offsetWidth - 10, initLeft + dx)) + 'px';
          hud.style.top = Math.max(10, Math.min(window.innerHeight - hud.offsetHeight - 10, initTop + dy)) + 'px';
        }

        function onMouseUp() {
          isDragging = false;
          dragHandle.style.cursor = 'grab';
          document.body.style.userSelect = '';
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    // Botón de Restaurar textos a fábrica desde el HUD
    const btnResetTexts = hud.querySelector('#hud-btn-reset-texts');
    if (btnResetTexts) {
      btnResetTexts.addEventListener('click', async () => {
        let section = 'all';
        if (sceneKey.startsWith('maker')) section = 'maker';
        else if (sceneKey.startsWith('print')) section = 'print';
        else if (sceneKey === 'game') section = 'game';
        else if (sceneKey === 'chill') section = 'chill';
        else if (sceneKey === 'startingSoon') section = 'startingSoon';
        else if (sceneKey === 'beRightBack') section = 'beRightBack';
        else if (sceneKey === 'ending') section = 'ending';

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
