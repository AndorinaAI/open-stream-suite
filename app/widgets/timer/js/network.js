/**
 * app/widgets/timer/js/network.js — Comunicación WebSocket local y carga de configuración inicial
 */

window.TimerNetwork = (function() {
  function connectWS() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch(e) {
      setTimeout(connectWS, 3000);
      return;
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const S = window.TimerState;
        const R = window.TimerRenderer;
        const E = window.TimerEngine;

        if (data.type === 'timer_control') {
          const action = data.action;
          if (action === 'start') {
            if (typeof data.seconds === 'number') E.resetTimer(data.seconds, data.title, data.mode, data.unit, data.subtitle);
            E.startTimer();
          } else if (action === 'pause') {
            E.pauseTimer();
          } else if (action === 'stop') {
            E.stopTimer();
          } else if (action === 'reset' || action === 'set') {
            E.resetTimer(data.seconds, data.title, data.mode, data.unit, data.subtitle);
          } else if (action === 'add') {
            const toAdd = parseInt(data.seconds, 10) || 60;
            S.totalSeconds += toAdd;
            S.initialSeconds += toAdd;
            R.updateDisplayDigitsOnly();
          } else if (action === 'config' && data.config) {
            R.applyTimerConfig(data.config);
          }
        } else if (data.type === 'timer_config' && data.config) {
          R.applyTimerConfig(data.config);
        } else if ((data.type === 'theme_change' && data.theme) || (data.type === 'widget_theme_change' && (!data.id || data.id === window.OSS_WIDGET_ID))) {
          window.OSSTheme.handleMessage(data);
          return;
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
          window.TimerRenderer.applyTimerConfig(data.config.timer);
          if (typeof data.config.timer.defaultSeconds === 'number') {
            window.TimerState.initialSeconds = data.config.timer.defaultSeconds;
            window.TimerState.totalSeconds = window.TimerState.initialSeconds;
          }
        }
      }
    } catch (e) {}
  }

  function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    const S = window.TimerState;
    const initSec = parseInt(params.get('seconds'), 10);
    if (!isNaN(initSec) && initSec > 0) {
      S.initialSeconds = initSec;
      S.totalSeconds = initSec;
    }
    const initTitle = params.get('title');
    if (initTitle) S.config.title = initTitle;
    const initMode = params.get('mode');
    if (initMode === 'up' || initMode === 'down') S.timerMode = initMode;

    if (params.get('preview') === 'true') {
      const statusEl = document.getElementById('timer-status');
      if (statusEl) {
        statusEl.className = 'timer-status-chip';
        statusEl.textContent = 'VISTA PREVIA';
      }
    }
  }

  return {
    connectWS,
    fetchInitialConfig,
    initFromURL
  };
})();
