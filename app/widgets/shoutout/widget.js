// widgets/shoutout/widget.js — Coordinador y punto de entrada modular del widget Shoutout

(function() {
  function init() {
    if (window.ShoutoutNetwork) {
      window.ShoutoutNetwork.connectWS();
      window.ShoutoutNetwork.checkPreviewMode();
    }
  }

  // Compatibilidad hacia atrás con llamadas externas
  window.showShoutout = function(data) {
    if (window.ShoutoutRenderer) {
      window.ShoutoutRenderer.showShoutout(data);
    }
  };

  if (window.ShoutoutStyles && window.ShoutoutRenderer && window.ShoutoutNetwork) {
    init();
  } else {
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('shoutout/widget.js')) {
          return s.src.replace(/widget\.js(\?.*)?$/, 'js/');
        }
      }
      return '/widgets/shoutout/js/';
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
      loadScript('styles.js'),
      loadScript('render.js'),
      loadScript('network.js')
    ]).then(init).catch(err => console.error('Error cargando submódulos de Shoutout:', err));
  }
})();
