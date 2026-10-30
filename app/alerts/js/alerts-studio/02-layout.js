/**
 * alerts-studio/02-layout.js — Coordinador de renderizado y layouts del Estudio de Alertas
 * Submódulos:
 *   - 02a-layout-dom.js: Plantilla estructural del panel y secciones de configuración
 *   - 02b-gallery-toast.js: Galería de presets, iconos y avisos flotantes (toasts)
 */

window.AlertsStudio = window.AlertsStudio || {};

(function() {
  if (typeof AlertsStudio.renderStudio !== 'function') {
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('alerts-studio/02-layout.js')) {
          return s.src.replace(/02-layout\.js(\?.*)?$/, '');
        }
      }
      return 'js/alerts-studio/';
    })();

    function loadScript(file) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = basePath + file + '?v=51';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    Promise.all([
      loadScript('02a-layout-dom.js'),
      loadScript('02b-gallery-toast.js')
    ]).catch(err => console.error('Error cargando submódulos de AlertsStudio Layout:', err));
  }
})();
