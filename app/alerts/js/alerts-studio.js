/**
 * alerts-studio.js — Punto de entrada modular y compatibilidad retrospectiva.
 * El código fuente está dividido en sub-módulos en app/alerts/js/alerts-studio/:
 *   - 01-state-data.js: Estado, constantes (ALERT_TYPES, VARIABLES, ANIMACIONES) y loaders
 *   - 02-layout.js: Renderizado del estudio y galería de temas
 *   - 03-controls.js: Selectores de tipos, modos multimedia y variables
 *   - 04-themes.js: Gestión, guardado y aplicación de temas de alertas
 *   - 05-donations.js: Configuración de plataformas de propinas y sync de chat
 *   - 06-preview-test.js: Previsualización en vivo, animaciones y pruebas en OBS
 */
(function() {
  if (typeof window.AlertsStudio !== 'undefined' && window.AlertsStudio.init) return;
  const parts = [
    'js/alerts-studio/01-state-data.js',
    'js/alerts-studio/02-layout.js',
    'js/alerts-studio/03-controls.js',
    'js/alerts-studio/04-themes.js',
    'js/alerts-studio/05-donations.js',
    'js/alerts-studio/06-preview-test.js'
  ];
  parts.forEach(src => {
    if (!document.querySelector(`script[src*="${src}"]`)) {
      const s = document.createElement('script');
      s.src = (window.location.pathname.includes('/alerts/') ? '' : 'alerts/') + src;
      s.async = false;
      document.head.appendChild(s);
    }
  });
})();
