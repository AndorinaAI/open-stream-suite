// -------------------------------------------------------------
    // ESTADO Y CONFIGURACIÓN DEL TEMPORIZADOR
    // -------------------------------------------------------------
    let timerConfig = {
      activePreset: 'maker_glass',
      mode: 'down', // 'down' (cuenta atrás) | 'up' (cronómetro hacia adelante)
      defaultSeconds: 300,
      initialSeconds: 300,
      targetSeconds: 0,
      title: 'TEMPORIZADOR',
      subtitle: 'FASE ACTUAL',
      unitLabel: 'MIN',
      timeFormat: 'mm:ss',
      formatLayout: 'prefix_time_unit_sub',
      customTemplate: '{prefix} {time} {unit} - {sub}',
      styles: {
        shape: 'rounded',
        bgType: 'glass',
        bgColor: '#191D21',
        bgGradient: '#0B0D0F',
        borderColor: '#57D6C4',
        borderStyle: 'left_neon',
        borderWidth: 3,
        glowIntensity: 40,
        bgOpacity: 94,
        fontFamily: 'outfit',
        timeDigits: { color: '#F2EEE5', fontSize: 38, fontFamily: 'outfit', glow: true },
        unit: { color: '#57D6C4', fontSize: 12, fontFamily: 'outfit' },
        prefix: { color: '#57D6C4', fontSize: 11, fontFamily: 'outfit' },
        subtitle: { color: '#8B969C', fontSize: 11, fontFamily: 'outfit' },
        progressBar: { show: true, height: 6, color: '#57D6C4', trackColor: 'rgba(46, 54, 59, 0.6)' },
        statusChip: { show: true, color: '#57D6C4' },
        customCSS: ''
      },
      alerts: {
        finalAlarm: { enabled: true, sound: 'bell', flashScreen: true },
        warningThreshold: { enabled: true, seconds: 30, color: '#EF4444' },
        periodic: { enabled: false, everyMinutes: 15, sound: 'beep_digital', flash: true, message: '💧 Recordatorio de Hidratación / Descanso' },
        milestones: [
          { atSeconds: 300, message: '¡5 minutos restantes!', sound: 'bell', flash: true },
          { atSeconds: 60, message: '¡Último minuto!', sound: 'beep_digital', flash: true }
        ]
      }
    };

    let totalSeconds = 300;
    let initialSeconds = 300;
    let targetSeconds = 0;
    let timerMode = 'down'; // 'down' | 'up'
    let timerInterval = null;
    let isRunning = false;
    let lastPeriodicMinuteTriggered = 0;

    const cardEl = document.getElementById('timer-card');
    const dynamicContainer = document.getElementById('timer-dynamic-container');
    const progressTrackEl = document.getElementById('timer-bar-track');
    const progressFillEl = document.getElementById('timer-progress');
    const alertBannerEl = document.getElementById('timer-alert-banner');
    const alertBannerIcon = document.getElementById('alert-banner-icon');
    const alertBannerText = document.getElementById('alert-banner-text');

    // -------------------------------------------------------------
    // MOTOR DE SÍNTESIS DE AUDIO (WEB AUDIO API)
    // -------------------------------------------------------------
    function playAudioTone(soundType = 'bell') {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        if (soundType === 'bell') {
          // Campana limpia armónica
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(880, now);
          osc2.frequency.setValueAtTime(1760, now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.2);
          osc2.stop(now + 1.2);

        } else if (soundType === 'beep_digital') {
          // Doble beep neón tech
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1046.5, now);
          osc.frequency.setValueAtTime(1318.5, now + 0.12);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);

        } else if (soundType === 'coin') {
          // Moneda retro 8-Bit
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(987.77, now);
          osc.frequency.setValueAtTime(1318.51, now + 0.08);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.45);

        } else if (soundType === 'victory') {
          // Fanfarria victoria
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.25, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.4);
          });

        } else if (soundType === 'boom') {
          // Bajo punch profundo
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.65);

        } else if (soundType === 'retro_pulse') {
          // Alarma retro pulsante
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(880, now + 0.25);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        }
      } catch (e) {}
    }

    // -------------------------------------------------------------
    // FORMATEO DE DÍGITOS Y TIEMPO
    // -------------------------------------------------------------
    function formatTimeDigits(secs, format = 'mm:ss') {
      const s = Math.max(0, secs);
      const hours = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const remSecs = s % 60;

      if (format === 'hh:mm:ss' || hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
      } else if (format === 'ss') {
        return `${s}s`;
      } else if (format === 'human') {
        if (mins > 0) return `${mins}m ${String(remSecs).padStart(2, '0')}s`;
        return `${remSecs}s`;
      }
      return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
    }

    // -------------------------------------------------------------
    // RENDERIZADO DEL LAYOUT DINÁMICO (PREFIJO + X + MEDIDA + TEXTO)
    // -------------------------------------------------------------
    function renderTimerLayout() {
      const layout = timerConfig.formatLayout || 'prefix_time_unit_sub';
      const titleText = timerConfig.title || 'TEMPORIZADOR';
      const subText = timerConfig.subtitle || 'FASE ACTUAL';
      const unitText = timerConfig.unitLabel || (timerMode === 'up' ? 'CRONO' : 'MIN');
      const timeStr = formatTimeDigits(totalSeconds, timerConfig.timeFormat);
      const showStatus = timerConfig.styles?.statusChip?.show !== false;

      let statusHtml = showStatus ? `<span id="timer-status" class="timer-status-chip ${isRunning ? 'running' : ''}">${getStatusText()}</span>` : '';

      if (layout === 'prefix_time_unit_sub') {
        // Modo A: Cabecera con Título + Estado, Fila con Dígitos + Unidad + Subtexto
        dynamicContainer.innerHTML = `
          <div class="timer-header">
            <div class="timer-badge">
              <span class="timer-dot"></span>
              <span id="timer-title" class="timer-prefix-text">${escapeHtml(titleText)}</span>
            </div>
            ${statusHtml}
          </div>
          <div class="timer-content-row">
            <div class="timer-digits-wrap">
              <span id="timer-display" class="timer-digits">${timeStr}</span>
              ${unitText ? `<span id="timer-unit" class="timer-unit-pill">${escapeHtml(unitText)}</span>` : ''}
            </div>
            <span id="timer-sublabel" class="timer-label">${escapeHtml(subText)}</span>
          </div>
        `;
      } else if (layout === 'time_unit_prefix') {
        // Modo B: Dígitos + Medida + Título
        dynamicContainer.innerHTML = `
          <div class="timer-header">
            <div class="timer-digits-wrap" style="align-items: center;">
              <span id="timer-display" class="timer-digits">${timeStr}</span>
              ${unitText ? `<span id="timer-unit" class="timer-unit-pill">${escapeHtml(unitText)}</span>` : ''}
            </div>
            ${statusHtml}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span id="timer-title" class="timer-badge">${escapeHtml(titleText)}</span>
            <span id="timer-sublabel" class="timer-label">${escapeHtml(subText)}</span>
          </div>
        `;
      } else if (layout === 'prefix_unit_time') {
        // Modo C: Título + Medida + Tiempo X
        dynamicContainer.innerHTML = `
          <div class="timer-header">
            <div class="timer-badge" style="gap: 8px;">
              <span class="timer-dot"></span>
              <span id="timer-title" class="timer-prefix-text">${escapeHtml(titleText)}</span>
              ${unitText ? `<span id="timer-unit" class="timer-unit-pill">${escapeHtml(unitText)}</span>` : ''}
            </div>
            ${statusHtml}
          </div>
          <div class="timer-content-row" style="margin-top: 4px;">
            <span id="timer-display" class="timer-digits">${timeStr}</span>
            <span id="timer-sublabel" class="timer-label">${escapeHtml(subText)}</span>
          </div>
        `;
      } else if (layout === 'time_only') {
        // Modo D: Solo Tiempo Gigante Centrado
        dynamicContainer.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: baseline; gap: 8px; padding: 6px 0;">
            <span id="timer-display" class="timer-digits" style="font-size: 52px;">${timeStr}</span>
            ${unitText ? `<span id="timer-unit" class="timer-unit-pill" style="font-size: 14px;">${escapeHtml(unitText)}</span>` : ''}
          </div>
        `;
      } else {
        // Modo E: Plantilla Libre Personalizada con Tokens
        const template = timerConfig.customTemplate || '{prefix} {time} {unit} - {sub}';
        const pct = computeProgressPercent();
        let renderedText = template
          .replace(/{time}/g, `<span id="timer-display" class="timer-digits">${timeStr}</span>`)
          .replace(/{unit}/g, `<span id="timer-unit" class="timer-unit-pill">${escapeHtml(unitText)}</span>`)
          .replace(/{prefix}/g, `<span id="timer-title" class="timer-prefix-text">${escapeHtml(titleText)}</span>`)
          .replace(/{sub}/g, `<span id="timer-sublabel" class="timer-label">${escapeHtml(subText)}</span>`)
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

    function getStatusText() {
      if (totalSeconds === 0 && timerMode === 'down') return '¡COMPLETADO!';
      if (isRunning) return timerMode === 'up' ? 'CRONÓMETRO' : 'EN CURSO';
      return 'PAUSADO';
    }

    function computeProgressPercent() {
      if (timerMode === 'up') {
        const target = targetSeconds || initialSeconds || 3600;
        return Math.min(100, (totalSeconds / target) * 100);
      } else {
        const base = initialSeconds > 0 ? initialSeconds : 300;
        return Math.max(0, Math.min(100, (totalSeconds / base) * 100));
      }
    }

    function updateProgressBar() {
      const showBar = timerConfig.styles?.progressBar?.show !== false;
      if (progressTrackEl) {
        progressTrackEl.style.display = showBar ? 'block' : 'none';
      }
      if (progressFillEl) {
        const pct = computeProgressPercent();
        progressFillEl.style.width = `${pct}%`;

        // Alerta de advertencia en los últimos segundos
        const warnSecs = timerConfig.alerts?.warningThreshold?.seconds || 30;
        const isWarning = timerMode === 'down' && isRunning && totalSeconds > 0 && totalSeconds <= warnSecs;
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
      const displayEl = document.getElementById('timer-display');
      if (displayEl) {
        displayEl.textContent = formatTimeDigits(totalSeconds, timerConfig.timeFormat);
      }
      const statusEl = document.getElementById('timer-status');
      if (statusEl && isRunning) {
        const warnSecs = timerConfig.alerts?.warningThreshold?.seconds || 30;
        if (timerMode === 'down' && totalSeconds <= warnSecs && totalSeconds > 0) {
          statusEl.className = 'timer-status-chip warning';
          statusEl.textContent = `¡${totalSeconds}s!`;
        } else {
          statusEl.className = 'timer-status-chip running';
          statusEl.textContent = timerMode === 'up' ? 'CRONÓMETRO' : 'EN CURSO';
        }
      }
      updateProgressBar();
    }

    // -------------------------------------------------------------
    // MOTOR DE EJECUCIÓN (COUNTDOWN & COUNTUP)
    // -------------------------------------------------------------
    function startTimer() {
      if (isRunning) return;
      isRunning = true;
      cardEl.classList.remove('flash-complete');
      
      const statusEl = document.getElementById('timer-status');
      if (statusEl) {
        statusEl.className = 'timer-status-chip running';
        statusEl.textContent = timerMode === 'up' ? 'CRONÓMETRO' : 'EN CURSO';
      }

      timerInterval = setInterval(() => {
        if (timerMode === 'down') {
          if (totalSeconds > 0) {
            totalSeconds--;
            checkTimerAlerts(totalSeconds);
            updateDisplayDigitsOnly();
          } else {
            completeTimer();
          }
        } else {
          // Count up / Cronómetro
          totalSeconds++;
          checkTimerAlerts(totalSeconds);
          updateDisplayDigitsOnly();
          if (targetSeconds > 0 && totalSeconds >= targetSeconds) {
            completeTimer();
          }
        }
      }, 1000);
    }

    function stopTimer() {
      isRunning = false;
      if (timerInterval) clearInterval(timerInterval);
    }

    function pauseTimer() {
      stopTimer();
      const statusEl = document.getElementById('timer-status');
      if (statusEl) {
        statusEl.className = 'timer-status-chip paused';
        statusEl.textContent = 'PAUSADO';
      }
    }

    function resetTimer(newSeconds, newTitle, newMode, newUnit, newSubtitle) {
      stopTimer();
      cardEl.classList.remove('flash-complete');

      if (typeof newMode === 'string') timerMode = newMode;
      if (typeof newSeconds === 'number') {
        initialSeconds = newSeconds;
        totalSeconds = newSeconds;
      } else {
        totalSeconds = initialSeconds;
      }

      if (newTitle) {
        timerConfig.title = newTitle;
      }
      if (newUnit) {
        timerConfig.unitLabel = newUnit;
      }
      if (newSubtitle) {
        timerConfig.subtitle = newSubtitle;
      }

      renderTimerLayout();
      const statusEl = document.getElementById('timer-status');
      if (statusEl) {
        statusEl.className = 'timer-status-chip';
        statusEl.textContent = 'LISTO';
      }
    }

    function completeTimer() {
      stopTimer();
      const statusEl = document.getElementById('timer-status');
      if (statusEl) {
        statusEl.className = 'timer-status-chip finished';
        statusEl.textContent = '¡COMPLETADO!';
      }

      // Alarma y efecto de flash visual
      const finalCfg = timerConfig.alerts?.finalAlarm || {};
      if (finalCfg.enabled !== false) {
        playAudioTone(finalCfg.sound || 'bell');
        if (finalCfg.flashScreen !== false) {
          cardEl.classList.add('flash-complete');
        }
      }
    }

    // -------------------------------------------------------------
    // MOTOR DE ALERTAS PERIÓDICAS Y POR HITOS
    // -------------------------------------------------------------
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

    function checkTimerAlerts(currentSecs) {
      if (!timerConfig.alerts) return;

      // 1. Alertas periódicas (cada X minutos)
      const periodic = timerConfig.alerts.periodic;
      if (periodic && periodic.enabled && periodic.everyMinutes > 0) {
        const everySecs = periodic.everyMinutes * 60;
        if (currentSecs > 0 && currentSecs % everySecs === 0) {
          triggerAlertBanner(periodic.message || `Aviso: ${periodic.everyMinutes} minutos transcurridos`, '💧', periodic.sound || 'beep_digital');
        }
      }

      // 2. Alertas por hitos específicos
      const milestones = timerConfig.alerts.milestones || [];
      milestones.forEach(m => {
        if (m.atSeconds === currentSecs) {
          triggerAlertBanner(m.message || `Marca alcanzada: ${formatTimeDigits(m.atSeconds)}`, '🎯', m.sound || 'bell');
        }
      });
    }

    // -------------------------------------------------------------
    // MOTOR DE ESTILOS Y PRESETS (APPLYTIMERCONFIG)
    // -------------------------------------------------------------
    function applyTimerConfig(cfg) {
      if (!cfg) return;
      if (cfg.mode) timerMode = cfg.mode;
      if (cfg.title) timerConfig.title = cfg.title;
      if (cfg.subtitle) timerConfig.subtitle = cfg.subtitle;
      if (cfg.unitLabel !== undefined) timerConfig.unitLabel = cfg.unitLabel;
      if (cfg.timeFormat) timerConfig.timeFormat = cfg.timeFormat;
      if (cfg.formatLayout) timerConfig.formatLayout = cfg.formatLayout;
      if (cfg.customTemplate) timerConfig.customTemplate = cfg.customTemplate;
      if (cfg.alerts) timerConfig.alerts = Object.assign({}, timerConfig.alerts, cfg.alerts);

      const s = cfg.styles || {};
      const activeTheme = s.themePreset || cfg.activePreset || 'maker_glass';

      // 1. Forma / Silueta
      const shape = s.shape || 'rounded';
      cardEl.className = `timer-card shape-${shape}`;

      // 2. Tipo de Fondo
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
        bgCss = `background: linear-gradient(135deg, ${hexToRgba(bgColor, op)}, ${hexToRgba(bgGrad, op)}) !important; backdrop-filter: blur(12px) !important;`;
      } else {
        // glass
        bgCss = `background: ${hexToRgba(bgColor, op)} !important; backdrop-filter: blur(14px) saturate(160%) !important;`;
      }

      // 3. Borde y Glow
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
        ? `box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 ${Math.round(glowPct * 0.4)}px ${hexToRgba(bColor, glowPct / 100)} !important;` 
        : 'box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;';

      // 4. Tipografías individuales
      const digitsFont = s.timeDigits?.fontFamily || s.fontFamily || 'outfit';
      const digitsSize = s.timeDigits?.fontSize || 38;
      const digitsColor = s.timeDigits?.color || '#F2EEE5';
      const unitColor = s.unit?.color || bColor;
      const prefixColor = s.prefix?.color || bColor;
      const subColor = s.subtitle?.color || '#8B969C';
      const progressColor = s.progressBar?.color || bColor;

      // Inyección en custom-user-css
      const customStyleEl = document.getElementById('custom-user-css');
      if (customStyleEl) {
        customStyleEl.textContent = `
          .timer-card {
            ${bgCss}
            ${borderCss}
            ${glowCss}
          }
          .timer-digits {
            font-family: ${getFontStack(digitsFont)} !important;
            font-size: ${digitsSize}px !important;
            color: ${digitsColor} !important;
            ${s.timeDigits?.glow ? `text-shadow: 0 0 16px ${hexToRgba(digitsColor, 0.5)} !important;` : ''}
            ${bgType === 'transparent' ? 'text-shadow: 0 1px 4px #000, 0 2px 10px rgba(0,0,0,0.95), 0 0 14px #000 !important;' : ''}
          }
          .timer-unit-pill {
            font-family: ${getFontStack(s.unit?.fontFamily || digitsFont)} !important;
            color: ${unitColor} !important;
            font-size: ${s.unit?.fontSize || 11}px !important;
          }
          .timer-prefix-text {
            font-family: ${getFontStack(s.prefix?.fontFamily || digitsFont)} !important;
            color: ${prefixColor} !important;
            font-size: ${s.prefix?.fontSize || 11}px !important;
          }
          .timer-label {
            font-family: ${getFontStack(s.subtitle?.fontFamily || digitsFont)} !important;
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

    function getFontStack(f) {
      if (f === 'outfit') return "'Outfit', sans-serif";
      if (f === 'poppins') return "'Poppins', sans-serif";
      if (f === 'inter') return "'Inter', sans-serif";
      if (f === 'montserrat') return "'Montserrat', sans-serif";
      if (f === 'rajdhani') return "'Rajdhani', sans-serif";
      if (f === 'orbitron') return "'Orbitron', sans-serif";
      if (f === 'russo' || f === 'russo_one') return "'Russo One', sans-serif";
      if (f === 'comfortaa') return "'Comfortaa', cursive, sans-serif";
      if (f === 'mono') return "'JetBrains Mono', monospace";
      if (f === 'retro' || f === 'press_start') return "'Press Start 2P', monospace";
      if (f === 'silkscreen') return "'Silkscreen', monospace";
      if (f === 'bungee') return "'Bungee', cursive, sans-serif";
      if (f === 'righteous') return "'Righteous', cursive, sans-serif";
      if (f === 'cinzel') return "'Cinzel', serif";
      return "'Outfit', sans-serif";
    }

    function hexToRgba(hex, alpha = 1) {
      if (!hex || hex === 'transparent') return 'transparent';
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      if (isNaN(num)) return hex;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // -------------------------------------------------------------
    // WEBSOCKET LOCAL & SINCRONIZACIÓN
    // -------------------------------------------------------------
    function connectWS() {
      const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'timer_control') {
            const action = data.action;
            if (action === 'start') {
              if (typeof data.seconds === 'number') resetTimer(data.seconds, data.title, data.mode, data.unit, data.subtitle);
              startTimer();
            } else if (action === 'pause') {
              pauseTimer();
            } else if (action === 'stop') {
              stopTimer();
            } else if (action === 'reset' || action === 'set') {
              resetTimer(data.seconds, data.title, data.mode, data.unit, data.subtitle);
            } else if (action === 'add') {
              const toAdd = parseInt(data.seconds, 10) || 60;
              totalSeconds += toAdd;
              initialSeconds += toAdd;
              updateDisplayDigitsOnly();
            } else if (action === 'config' && data.config) {
              applyTimerConfig(data.config);
            }
          } else if (data.type === 'timer_config' && data.config) {
            applyTimerConfig(data.config);
          } else if (data.type === 'theme_change' && data.theme) {
            document.body.setAttribute('data-theme', data.theme);
          }
        } catch (e) {}
      };

      ws.onclose = () => setTimeout(connectWS, 3000);
    }

    async function fetchInitialConfig() {
      try {
        const res = await fetch('/api/widgets/config');
        if (res.ok) {
          const data = await res.json();
          if (data && data.config && data.config.timer) {
            applyTimerConfig(data.config.timer);
            if (typeof data.config.timer.defaultSeconds === 'number') {
              initialSeconds = data.config.timer.defaultSeconds;
              totalSeconds = initialSeconds;
            }
          }
        }
      } catch (e) {}
    }

    // -------------------------------------------------------------
    // INICIALIZACIÓN
    // -------------------------------------------------------------
    window.addEventListener('DOMContentLoaded', async () => {
      await fetchInitialConfig();

      const params = new URLSearchParams(window.location.search);
      const initSec = parseInt(params.get('seconds'), 10);
      if (!isNaN(initSec) && initSec > 0) {
        initialSeconds = initSec;
        totalSeconds = initSec;
      }
      const initTitle = params.get('title');
      if (initTitle) timerConfig.title = initTitle;
      const initMode = params.get('mode');
      if (initMode === 'up' || initMode === 'down') timerMode = initMode;

      renderTimerLayout();
      connectWS();

      // Modo previsualización automática
      if (params.get('preview') === 'true') {
        const statusEl = document.getElementById('timer-status');
        if (statusEl) {
          statusEl.className = 'timer-status-chip';
          statusEl.textContent = 'VISTA PREVIA';
        }
      }
    });

    // Exponer globalmente para la ventana del panel PiP
    window.applyTimerConfig = applyTimerConfig;
    window.startTimer = startTimer;
    window.pauseTimer = pauseTimer;
    window.resetTimer = resetTimer;
    window.playAudioTone = playAudioTone;
