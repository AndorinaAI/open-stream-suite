// ====================================================================
// 03-PRESETS.JS — COORDINADOR MODULAR DE PRESETS DE TEMPORIZADOR
// Carga automática de submódulos si no se han cargado previamente
// ====================================================================

(function() {
  const needsLoader = typeof window.onTimerPresetChange === 'undefined';
  const needsCrud = typeof window.saveCurrentTimerPreset === 'undefined';

  if (!needsLoader && !needsCrud) return;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const basePath = (function() {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      if (s.src && s.src.includes('timer/panel/03-presets.js')) {
        return s.src.replace(/03-presets\.js(\?.*)?$/, '');
      }
    }
    return '/widgets/timer/panel/';
  })();

  const queue = [];
  if (needsLoader) queue.push(loadScript(basePath + '03a-preset-loader.js?v=50'));
  if (needsCrud) queue.push(loadScript(basePath + '03b-preset-crud.js?v=50'));

  Promise.all(queue).catch(err => {
    console.error('Error cargando submódulos de presets de temporizador:', err);
  });
})();
