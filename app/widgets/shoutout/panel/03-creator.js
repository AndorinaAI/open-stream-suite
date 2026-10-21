// ====================================================================
// 03-CREATOR.JS — COORDINADOR MODULAR DEL CREADOR DE PROMOS/SHOUTOUTS
// Carga automática de submódulos si no se han cargado previamente
// ====================================================================

(function() {
  const needsActions = typeof window.launchCurrentPromoToOBS === 'undefined';
  const needsPreview = typeof window.updatePromoPipPreview === 'undefined';

  if (!needsActions && !needsPreview) return;

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
      if (s.src && s.src.includes('shoutout/panel/03-creator.js')) {
        return s.src.replace(/03-creator\.js(\?.*)?$/, '');
      }
    }
    return '/widgets/shoutout/panel/';
  })();

  const queue = [];
  if (needsActions) queue.push(loadScript(basePath + '03a-creator-actions.js?v=50'));
  if (needsPreview) queue.push(loadScript(basePath + '03b-creator-preview.js?v=50'));

  Promise.all(queue).catch(err => {
    console.error('Error cargando submódulos del creador de shoutout:', err);
  });
})();
