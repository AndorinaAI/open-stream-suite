/**
 * app/widgets/timer/js/engine.js — Bucle del temporizador, control de alertas y eventos de finalización
 */

window.TimerEngine = (function() {
  let timerInterval = null;

  function startTimer() {
    const S = window.TimerState;
    const R = window.TimerRenderer;
    if (S.isRunning) return;
    S.isRunning = true;

    const cardEl = document.getElementById('timer-card');
    if (cardEl) cardEl.classList.remove('flash-complete');

    const statusEl = document.getElementById('timer-status');
    if (statusEl) {
      statusEl.className = 'timer-status-chip running';
      statusEl.textContent = S.timerMode === 'up' ? 'CRONÓMETRO' : 'EN CURSO';
    }

    timerInterval = setInterval(() => {
      if (S.timerMode === 'down') {
        if (S.totalSeconds > 0) {
          S.totalSeconds--;
          checkTimerAlerts(S.totalSeconds);
          R.updateDisplayDigitsOnly();
        } else {
          completeTimer();
        }
      } else {
        S.totalSeconds++;
        checkTimerAlerts(S.totalSeconds);
        R.updateDisplayDigitsOnly();
        if (S.targetSeconds > 0 && S.totalSeconds >= S.targetSeconds) {
          completeTimer();
        }
      }
    }, 1000);
  }

  function stopTimer() {
    const S = window.TimerState;
    S.isRunning = false;
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
    const S = window.TimerState;
    const R = window.TimerRenderer;
    const cardEl = document.getElementById('timer-card');
    if (cardEl) cardEl.classList.remove('flash-complete');

    if (typeof newMode === 'string') S.timerMode = newMode;
    if (typeof newSeconds === 'number') {
      S.initialSeconds = newSeconds;
      S.totalSeconds = newSeconds;
    } else {
      S.totalSeconds = S.initialSeconds;
    }

    if (newTitle) S.config.title = newTitle;
    if (newUnit) S.config.unitLabel = newUnit;
    if (newSubtitle) S.config.subtitle = newSubtitle;

    R.renderTimerLayout();
    const statusEl = document.getElementById('timer-status');
    if (statusEl) {
      statusEl.className = 'timer-status-chip';
      statusEl.textContent = 'LISTO';
    }
  }

  function completeTimer() {
    stopTimer();
    const S = window.TimerState;
    const R = window.TimerRenderer;
    const cardEl = document.getElementById('timer-card');
    const statusEl = document.getElementById('timer-status');
    if (statusEl) {
      statusEl.className = 'timer-status-chip finished';
      statusEl.textContent = '¡COMPLETADO!';
    }

    const finalCfg = S.config.alerts?.finalAlarm || {};
    if (finalCfg.enabled !== false) {
      R.playAudioTone(finalCfg.sound || 'bell');
      if (finalCfg.flashScreen !== false && cardEl) {
        cardEl.classList.add('flash-complete');
      }
    }
  }

  function checkTimerAlerts(currentSecs) {
    const S = window.TimerState;
    const R = window.TimerRenderer;
    if (!S.config.alerts) return;

    // 1. Alertas periódicas
    const periodic = S.config.alerts.periodic;
    if (periodic && periodic.enabled && periodic.everyMinutes > 0) {
      const everySecs = periodic.everyMinutes * 60;
      if (currentSecs > 0 && currentSecs % everySecs === 0) {
        R.triggerAlertBanner(periodic.message || `Aviso: ${periodic.everyMinutes} minutos transcurridos`, '💧', periodic.sound || 'beep_digital');
      }
    }

    // 2. Alertas por hitos
    const milestones = S.config.alerts.milestones || [];
    milestones.forEach(m => {
      if (m.atSeconds === currentSecs) {
        R.triggerAlertBanner(m.message || `Marca alcanzada: ${S.formatTimeDigits(m.atSeconds)}`, '🎯', m.sound || 'bell');
      }
    });
  }

  return {
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    checkTimerAlerts
  };
})();
