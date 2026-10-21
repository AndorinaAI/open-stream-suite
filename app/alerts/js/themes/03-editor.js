// ====================================================================
// 03-EDITOR.JS — COORDINADOR MODULAR DEL EDITOR DE TEMAS
// Carga automática de submódulos si no se han cargado previamente
// ====================================================================

(function() {
  const needsModal = typeof window.openThemeEditor === 'undefined';
  const needsSave = typeof window.saveCurrentThemeChanges === 'undefined';

  if (!needsModal && !needsSave) return;

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
      if (s.src && s.src.includes('themes/03-editor.js')) {
        return s.src.replace(/03-editor\.js(\?.*)?$/, '');
      }
    }
    return 'js/themes/';
  })();

  const queue = [];
  if (needsModal) queue.push(loadScript(basePath + '03a-editor-modal.js?v=50'));
  if (needsSave) queue.push(loadScript(basePath + '03b-editor-save.js?v=50'));

  Promise.all(queue).catch(err => {
    console.error('Error cargando submódulos del editor de temas:', err);
  });
})();
