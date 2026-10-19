/**
 * ====================================================================
 * TALLER LIVE — MOTOR DE OVERLAY COMÚN
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

  function initOverlay() {
    const config = window.TALLER_CONFIG || {
      channel: { name: "ANDORINA", tagline: "JUGAR · CREAR · TRASTEAR", visible: true, showLiveIndicator: true },
      maker: { projectName: "NAS CON RASPBERRY PI", currentPhase: "02 MONTAJE", phases: ["01 PLAN", "02 MONTAJE", "03 SOFTWARE", "04 PRUEBAS"] },
      print: { projectName: "PEGATINAS PERSONALIZADAS", material: "Vinilo Holográfico", currentPhase: "CORTE DE VINILO", phases: ["01 DISEÑO", "02 CORTE", "03 PELADO", "04 APLICACIÓN"] },
      chill: { showChatPanel: true },
      performance: { enableAnimations: true }
    };

    // 1. Gestión de animaciones
    if (config.performance && config.performance.enableAnimations === false) {
      document.body.classList.add('no-animations');
    }

    // 1.1 Resolución y aplicación de temas dinámicos
    const urlParams = new URLSearchParams(window.location.search);
    const themeFromUrl = urlParams.get('theme');
    const activeTheme = themeFromUrl || config.activeTheme || config.themeName;
    if (activeTheme) {
      document.body.setAttribute('data-theme', activeTheme);
    }

    // Escuchar cambios de tema en vivo desde el panel vía WebSocket local
    try {
      const wsHost = window.location.hostname || 'localhost';
      const wsPort = window.location.port || '8080';
      const ws = new WebSocket(`ws://${wsHost}:${wsPort}/ws`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'theme_change' && msg.theme) {
            document.body.setAttribute('data-theme', msg.theme);
          }
        } catch (err) {}
      };
    } catch (e) {}

    // 2. Detección de entorno: OBS Studio vs Navegador Web normal
    // En OBS Studio la API inyecta window.obsstudio. Si no existe, es un navegador normal.
    const isOBS = typeof window.obsstudio !== 'undefined';
    if (!isOBS && !document.body.classList.contains('fullscreen-scene') && !document.body.classList.contains('catalog-body')) {
      document.body.classList.add('browser-preview-mode');

      const badge = document.createElement('div');
      badge.className = 'browser-preview-badge';
      badge.title = 'Haz clic para alternar entre fondo oscuro de prueba y transparencia real';
      badge.innerHTML = '👁️ Vista Previa Navegador: <strong>ON</strong> <span style="font-size:9px;color:var(--color-text-dim);">(100% transparente en OBS)</span>';
      badge.addEventListener('click', () => {
        document.body.classList.toggle('browser-preview-mode');
        const active = document.body.classList.contains('browser-preview-mode');
        badge.innerHTML = active 
          ? '👁️ Vista Previa Navegador: <strong>ON</strong> <span style="font-size:9px;color:var(--color-text-dim);">(100% transparente en OBS)</span>'
          : '🔳 Transparencia Real: <strong>ON</strong> <span style="font-size:9px;color:var(--color-text-dim);">(Modo OBS)</span>';
      });
      document.body.appendChild(badge);
    }

    // 2. Inyección de iconos con data-icon="nombre"
    document.querySelectorAll('[data-icon]').forEach(el => {
      const iconKey = el.getAttribute('data-icon');
      if (SVG_ICONS[iconKey]) {
        el.innerHTML = SVG_ICONS[iconKey];
      }
    });

    // 3. Marca del canal
    document.querySelectorAll('.brand-name').forEach(el => {
      el.textContent = config.channel?.name || "ANDORINA";
    });

    document.querySelectorAll('.brand-tagline').forEach(el => {
      el.textContent = config.channel?.tagline || "JUGAR · CREAR · TRASTEAR";
    });

    if (config.channel?.visible === false) {
      document.querySelectorAll('.brand-badge').forEach(el => el.style.display = 'none');
    }

    // 4. Indicador de directo
    if (config.channel?.showLiveIndicator === false) {
      document.querySelectorAll('.live-indicator').forEach(el => el.style.display = 'none');
    }

    // 5. Proyecto Maker / Print
    const isPrintMode = document.body.dataset.mode === 'print';
    const projConfig = isPrintMode ? config.print : config.maker;

    if (projConfig) {
      document.querySelectorAll('.project-name-value').forEach(el => {
        el.textContent = projConfig.projectName || "";
      });

      // Panel lateral
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
          if (phaseText.includes(projConfig.currentPhase) || projConfig.currentPhase.includes(phaseText)) {
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

      // Cámara auxiliar
      if (projConfig.showAuxView === false) {
        const auxFrame = document.querySelector('.camera-aux');
        if (auxFrame) auxFrame.style.display = 'none';
      }
    }

    // 6. Chill mode chat panel toggle
    if (document.body.dataset.mode === 'chill') {
      if (config.chill && config.chill.showChatPanel === false) {
        const chatPanel = document.querySelector('.chat-panel-frame');
        if (chatPanel) chatPanel.style.display = 'none';
        const mainCam = document.querySelector('.camera-chill-main');
        if (mainCam) {
          // Centrar cámara principal elegantemente
          mainCam.style.left = '160px';
          mainCam.style.width = '1600px';
          mainCam.style.height = '900px';
        }
      }
    }

    // 7. Redes sociales (si están activas)
    if (config.channel?.socials?.visible) {
      const socialContainer = document.querySelector('.social-links');
      if (socialContainer) {
        socialContainer.style.display = 'flex';
        const socials = config.channel.socials;
        let html = '';
        ['twitch', 'youtube', 'twitter', 'instagram', 'github'].forEach(net => {
          if (socials[net]) {
            html += `<div class="social-item">${SVG_ICONS[net] || ''} <span>${socials[net]}</span></div>`;
          }
        });
        socialContainer.innerHTML = html;
      }
    }

    // 8. Pantalla BE RIGHT BACK — Rotación de frases
    const brbPhraseEl = document.querySelector('.brb-status-phrase');
    if (brbPhraseEl && config.beRightBack?.statusPhrases?.length) {
      const phrases = config.beRightBack.statusPhrases;
      let pIdx = 0;
      brbPhraseEl.textContent = phrases[0];
      const intervalSec = (config.beRightBack.phraseIntervalSeconds || 6) * 1000;
      setInterval(() => {
        pIdx = (pIdx + 1) % phrases.length;
        brbPhraseEl.style.opacity = '0';
        setTimeout(() => {
          brbPhraseEl.textContent = phrases[pIdx];
          brbPhraseEl.style.opacity = '1';
        }, 300);
      }, intervalSec);
    }

    // 9. Pantalla STARTING SOON — Cuenta atrás o barra de carga
    const countdownEl = document.querySelector('.starting-countdown');
    if (countdownEl && config.startingSoon?.countdownMinutes > 0) {
      let totalSeconds = config.startingSoon.countdownMinutes * 60;
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
      setInterval(updateClock, 1000);
    }
  }

  // Exportar utilidades globales
  window.TallerOverlay = {
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
