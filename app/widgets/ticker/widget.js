// widgets/ticker/widget.js - Coordinador y punto de entrada del widget Ticker

(function() {
  function init() {
    if (window.TickerNetwork) {
      window.TickerNetwork.setupEventListeners();
      window.TickerNetwork.loadInitialConfig();
      window.TickerNetwork.connectWS();
    }
  }

  if (window.TickerStateData && window.TickerRenderer && window.TickerNetwork) {
    init();
  } else {
    // Si se cargó directamente sin los tags en HTML, cargarlos dinámicamente
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('ticker/widget.js')) {
          return s.src.replace('widget.js', 'js/');
        }
      }
      return '/widgets/ticker/js/';
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
      loadScript('network.js')
    ]).then(init).catch(err => console.error('Error cargando submódulos de Ticker:', err));
  }
})();
