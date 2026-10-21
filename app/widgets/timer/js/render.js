/**
 * app/widgets/timer/js/render.js — Motor de renderizado visual, estilos y layouts del temporizador
 */

window.TimerRenderer = (function() {
  const cardEl = document.getElementById('timer-card');
  const dynamicContainer = document.getElementById('timer-dynamic-container');
  const progressTrackEl = document.getElementById('timer-bar-track');
  const progressFillEl = document.getElementById('timer-progress');
  const alertBannerEl = document.getElementById('timer-alert-banner');
  const alertBannerIcon = document.getElementById('alert-banner-icon');
  const alertBannerText = document.getElementById('alert-banner-text');

  function playAudioTone(soundType = 'bell') {
    if (window.SoundSynth) {
      window.SoundSynth.playTone(soundType);
    }
  }

  function renderTimerLayout() {
    if (!dynamicContainer) return;
    const S = window.TimerState;
    const cfg = S.config;
    const layout = cfg.formatLayout || 'prefix_time_unit_sub';
    const titleText = cfg.title || 'TEMPORIZADOR';
    const subText = cfg.subtitle || 'FASE ACTUAL';
    const unitText = cfg.unitLabel || (S.timerMode === 'up' ? 'CRONO' : 'MIN');
    const timeStr = S.formatTimeDigits(S.totalSeconds, cfg.timeFormat);
    const showStatus = cfg.styles?.statusChip?.show !== false;

    let statusHtml = showStatus ? `<span id="timer-status" class="timer-status-chip ${S.isRunning ? 'running' : ''}">${S.getStatusText()}</span>` : '';

    if (layout === 'prefix_time_unit_sub') {
      dynamicContainer.innerHTML = `
        <div class="timer-header">
          <div class="timer-badge">
            <span class="timer-dot"></span>
            <span id="timer-title" class="timer-prefix-text">${S.escapeHtml(titleText)}</span>
          </div>
          ${statusHtml}
        </div>
        <div class="timer-content-row">
          <div class="timer-digits-wrap">
            <span id="timer-display" class="timer-digits">${timeStr}</span>
            ${unitText ? `<span id="timer-unit" class="timer-unit-pill">${S.escapeHtml(unitText)}</span>` : ''}
          </div>
          <span id="timer-sublabel" class="timer-label">${S.escapeHtml(subText)}</span>
        </div>
      `;
    } else if (layout === 'time_unit_prefix') {
      dynamicContainer.innerHTML = `
        <div class="timer-header">
          <div class="timer-digits-wrap" style="align-items: center;">
            <span id="timer-display" class="timer-digits">${timeStr}</span>
            ${unitText ? `<span id="timer-unit" class="timer-unit-pill">${S.escapeHtml(unitText)}</span>` : ''}
          </div>
          ${statusHtml}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span id="timer-title" class="timer-badge">${S.escapeHtml(titleText)}</span>
          <span id="timer-sublabel" class="timer-label">${S.escapeHtml(subText)}</span>
        </div>
      `;
    } else if (layout === 'prefix_unit_time') {
      dynamicContainer.innerHTML = `
        <div class="timer-header">
          <div class="timer-badge" style="gap: 8px;">
            <span class="timer-dot"></span>
            <span id="timer-title" class="timer-prefix-text">${S.escapeHtml(titleText)}</span>
            ${unitText ? `<span id="timer-unit" class="timer-unit-pill">${S.escapeHtml(unitText)}</span>` : ''}
          </div>
          ${statusHtml}
        </div>
        <div class="timer-content-row" style="margin-top: 4px;">
          <span id="timer-display" class="timer-digits">${timeStr}</span>
          <span id="timer-sublabel" class="timer-label">${S.escapeHtml(subText)}</span>
        </div>
      `;
    } else if (layout === 'time_only') {
      dynamicContainer.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: baseline; gap: 8px; padding: 6px 0;">
          <span id="timer-display" class="timer-digits" style="font-size: 52px;">${timeStr}</span>
          ${unitText ? `<span id="timer-unit" class="timer-unit-pill" style="font-size: 14px;">${S.escapeHtml(unitText)}</span>` : ''}
        </div>
      `;
    } else {
      const template = cfg.customTemplate || '{prefix} {time} {unit} - {sub}';
      const pct = S.computeProgressPercent();
      let renderedText = template
        .replace(/{time}/g, `<span id="timer-display" class="timer-digits">${timeStr}</span>`)
        .replace(/{unit}/g, `<span id="timer-unit" class="timer-unit-pill">${S.escapeHtml(unitText)}</span>`)
        .replace(/{prefix}/g, `<span id="timer-title" class="timer-prefix-text">${S.escapeHtml(titleText)}</span>`)
        .replace(/{sub}/g, `<span id="timer-sublabel" class="timer-label">${S.escapeHtml(subText)}</span>`)
        .replace(/{pct}/g, `<span class="timer-unit-pill">${Math.round(pct)}%</span>`);

      dynamicContainer.innerHTML = `
        <div class="timer-header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="timer-dot"></span>
            <span style="font-family: var(--font-ui); font-size: 11px; color: var(--timer-sub-color); text-transform: uppercase;">TEMPORIZADOR</span>
          </div>
          ${statusHtml}
        </div>
        <div style="margin-top: 6px; line-height: 1.4; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">
          ${renderedText}
        </div>
      `;
    }

    updateProgressBar();
  }

  function updateProgressBar() {
    const S = window.TimerState;
    const showBar = S.config.styles?.progressBar?.show !== false;
    if (progressTrackEl) {
      progressTrackEl.style.display = showBar ? 'block' : 'none';
    }
    if (progressFillEl) {
      const pct = S.computeProgressPercent();
      progressFillEl.style.width = `${pct}%`;

      const warnSecs = S.config.alerts?.warningThreshold?.seconds || 30;
      const isWarning = S.timerMode === 'down' && S.isRunning && S.totalSeconds > 0 && S.totalSeconds <= warnSecs;
      if (isWarning) {
        progressFillEl.classList.add('warning');
        const chip = document.getElementById('timer-status');
        if (chip) chip.className = 'timer-status-chip warning';
      } else {
        progressFillEl.classList.remove('warning');
      }
    }
  }

  function updateDisplayDigitsOnly() {
    const S = window.TimerState;
    const displayEl = document.getElementById('timer-display');
    if (displayEl) {
      displayEl.textContent = S.formatTimeDigits(S.totalSeconds, S.config.timeFormat);
    }
    const statusEl = document.getElementById('timer-status');
    if (statusEl && S.isRunning) {
      const warnSecs = S.config.alerts?.warningThreshold?.seconds || 30;
      if (S.timerMode === 'down' && S.totalSeconds <= warnSecs && S.totalSeconds > 0) {
        statusEl.className = 'timer-status-chip warning';
        statusEl.textContent = `¡${S.totalSeconds}s!`;
      } else {
        statusEl.className = 'timer-status-chip running';
        statusEl.textContent = S.timerMode === 'up' ? 'CRONÓMETRO' : 'EN CURSO';
      }
    }
    updateProgressBar();
  }

  function triggerAlertBanner(text, icon = '🔔', sound = 'bell') {
    if (!alertBannerEl) return;
    alertBannerIcon.textContent = icon;
    alertBannerText.textContent = text;
    alertBannerEl.classList.add('show');
    playAudioTone(sound);

    setTimeout(() => {
      alertBannerEl.classList.remove('show');
    }, 5000);
  }

  function applyTimerConfig(cfg) {
    if (!cfg) return;
    const S = window.TimerState;
    if (cfg.mode) S.timerMode = cfg.mode;
    if (cfg.title) S.config.title = cfg.title;
    if (cfg.subtitle) S.config.subtitle = cfg.subtitle;
    if (cfg.unitLabel !== undefined) S.config.unitLabel = cfg.unitLabel;
    if (cfg.timeFormat) S.config.timeFormat = cfg.timeFormat;
    if (cfg.formatLayout) S.config.formatLayout = cfg.formatLayout;
    if (cfg.customTemplate) S.config.customTemplate = cfg.customTemplate;
    if (cfg.alerts) S.config.alerts = Object.assign({}, S.config.alerts, cfg.alerts);

    const s = cfg.styles || {};
    const shape = s.shape || 'rounded';
    if (cardEl) cardEl.className = `timer-card shape-${shape}`;

    const bgType = s.bgType || 'glass';
    const bgColor = s.bgColor || '#191D21';
    const bgGrad = s.bgGradient || '#0B0D0F';
    const op = (s.bgOpacity !== undefined ? s.bgOpacity : 94) / 100;
    let bgCss = '';

    if (bgType === 'transparent') {
      bgCss = 'background: transparent !important; backdrop-filter: none !important; box-shadow: none !important;';
    } else if (bgType === 'solid') {
      bgCss = `background: ${bgColor} !important; backdrop-filter: none !important;`;
    } else if (bgType === 'gradient') {
      bgCss = `background: linear-gradient(135deg, ${S.hexToRgba(bgColor, op)}, ${S.hexToRgba(bgGrad, op)}) !important; backdrop-filter: blur(12px) !important;`;
    } else {
      bgCss = `background: ${S.hexToRgba(bgColor, op)} !important; backdrop-filter: blur(14px) saturate(160%) !important;`;
    }

    const borderStyle = s.borderStyle || 'left_neon';
    const bw = s.borderWidth !== undefined ? s.borderWidth : 3;
    const bColor = s.borderColor || '#57D6C4';
    const glowPct = s.glowIntensity !== undefined ? s.glowIntensity : 40;
    let borderCss = '';

    if (borderStyle === 'left_neon') {
      borderCss = `border: 1px solid rgba(255,255,255,0.08) !important; border-left: ${bw}px solid ${bColor} !important;`;
    } else if (borderStyle === 'full') {
      borderCss = `border: ${bw}px solid ${bColor} !important;`;
    } else if (borderStyle === 'double') {
      borderCss = `border: ${bw}px double ${bColor} !important;`;
    } else if (borderStyle === 'none') {
      borderCss = 'border: none !important;';
    }

    const glowCss = glowPct > 0 
      ? `box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 ${Math.round(glowPct * 0.4)}px ${S.hexToRgba(bColor, glowPct / 100)} !important;` 
      : 'box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;';

    const digitsFont = s.timeDigits?.fontFamily || s.fontFamily || 'outfit';
    const digitsSize = s.timeDigits?.fontSize || 38;
    const digitsColor = s.timeDigits?.color || '#F2EEE5';
    const unitColor = s.unit?.color || bColor;
    const prefixColor = s.prefix?.color || bColor;
    const subColor = s.subtitle?.color || '#8B969C';
    const progressColor = s.progressBar?.color || bColor;

    const customStyleEl = document.getElementById('custom-user-css');
    if (customStyleEl) {
      customStyleEl.textContent = `
        .timer-card {
          ${bgCss}
          ${borderCss}
          ${glowCss}
        }
        .timer-digits {
          font-family: ${S.getFontStack(digitsFont)} !important;
          font-size: ${digitsSize}px !important;
          color: ${digitsColor} !important;
          ${s.timeDigits?.glow ? `text-shadow: 0 0 16px ${S.hexToRgba(digitsColor, 0.5)} !important;` : ''}
          ${bgType === 'transparent' ? 'text-shadow: 0 1px 4px #000, 0 2px 10px rgba(0,0,0,0.95), 0 0 14px #000 !important;' : ''}
        }
        .timer-unit-pill {
          font-family: ${S.getFontStack(s.unit?.fontFamily || digitsFont)} !important;
          color: ${unitColor} !important;
          font-size: ${s.unit?.fontSize || 11}px !important;
        }
        .timer-prefix-text {
          font-family: ${S.getFontStack(s.prefix?.fontFamily || digitsFont)} !important;
          color: ${prefixColor} !important;
          font-size: ${s.prefix?.fontSize || 11}px !important;
        }
        .timer-label {
          font-family: ${S.getFontStack(s.subtitle?.fontFamily || digitsFont)} !important;
          color: ${subColor} !important;
          font-size: ${s.subtitle?.fontSize || 11}px !important;
        }
        .timer-bar-fill {
          background: ${progressColor} !important;
          box-shadow: 0 0 8px ${progressColor} !important;
        }
        .timer-bar-track {
          height: ${s.progressBar?.height || 6}px !important;
        }
        ${s.customCSS || ''}
      `;
    }

    renderTimerLayout();
  }

  return {
    renderTimerLayout,
    updateProgressBar,
    updateDisplayDigitsOnly,
    triggerAlertBanner,
    applyTimerConfig,
    playAudioTone
  };
})();
