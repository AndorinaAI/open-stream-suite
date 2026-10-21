// widgets/goal/widget.js - Coordinador y punto de entrada del widget Goal

(function() {
  function init() {
    if (window.GoalConfetti) window.GoalConfetti.init();
    if (window.GoalNetwork) {
      window.GoalNetwork.setupEventListeners();
      window.GoalNetwork.loadConfig();
      window.GoalNetwork.connectWS();
    }
  }

  if (window.GoalConfetti && window.GoalRenderer && window.GoalNetwork) {
    init();
  } else {
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('goal/widget.js')) {
          return s.src.replace('widget.js', 'js/');
        }
      }
      return '/widgets/goal/js/';
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
      loadScript('confetti.js'),
      loadScript('render.js'),
      loadScript('network.js')
    ]).then(init).catch(err => console.error('Error cargando submódulos de Goal:', err));
  }
})();
