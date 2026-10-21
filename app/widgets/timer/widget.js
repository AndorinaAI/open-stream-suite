// widgets/timer/widget.js — Coordinador y punto de entrada modular del temporizador

(function() {
  async function init() {
    if (window.TimerNetwork && window.TimerRenderer) {
      await window.TimerNetwork.fetchInitialConfig();
      window.TimerNetwork.initFromURL();
      window.TimerRenderer.renderTimerLayout();
      window.TimerNetwork.connectWS();
    }
  }

  // Exponer API global compatible con controles externos y panel PiP
  window.applyTimerConfig = function(cfg) {
    if (window.TimerRenderer) window.TimerRenderer.applyTimerConfig(cfg);
  };
  window.startTimer = function() {
    if (window.TimerEngine) window.TimerEngine.startTimer();
  };
  window.pauseTimer = function() {
    if (window.TimerEngine) window.TimerEngine.pauseTimer();
  };
  window.resetTimer = function(newSecs, newTitle, newMode, newUnit, newSub) {
    if (window.TimerEngine) window.TimerEngine.resetTimer(newSecs, newTitle, newMode, newUnit, newSub);
  };
  window.playAudioTone = function(s) {
    if (window.TimerRenderer) window.TimerRenderer.playAudioTone(s);
  };

  if (window.TimerState && window.TimerRenderer && window.TimerEngine && window.TimerNetwork) {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } else {
    // Si se cargó directamente sin los tags en HTML, cargarlos dinámicamente
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('timer/widget.js')) {
          return s.src.replace(/widget\.js(\?.*)?$/, 'js/');
        }
      }
      return '/widgets/timer/js/';
    })();

    function loadScript(file) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = basePath + file + '?v=50';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    Promise.all([
      loadScript('state-data.js'),
      loadScript('render.js'),
      loadScript('engine.js'),
      loadScript('network.js')
    ]).then(() => {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    }).catch(err => console.error('Error cargando submódulos de Timer:', err));
  }
})();
