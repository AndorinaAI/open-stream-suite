/**
 * app/alerts/js/overlay-widget.js
 * Coordinador y punto de entrada modular del widget de alertas y memes para OBS Studio.
 */

(function() {
  const isLoaded = window.AudioEngine && window.ParticleEngine && window.AlertQueue;
  if (!isLoaded) {
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('alerts/js/overlay-widget.js')) {
          return s.src.replace(/overlay-widget\.js(\?.*)?$/, 'overlay/');
        }
      }
      return '/alerts/js/overlay/';
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

    // Carga secuencial de submódulos
    loadScript('01-audio-engine.js')
      .then(() => loadScript('02-particle-engine.js'))
      .then(() => loadScript('03-alert-queue.js'))
      .then(() => loadScript('04-ws-client.js'))
      .catch(e => console.error('Error cargando submódulos de alertas OBS:', e));
  }
})();
