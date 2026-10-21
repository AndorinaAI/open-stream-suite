// ====================================================================
// WIDGET: TIMER PANEL - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  if (window.WidgetModules && window.WidgetModules['timer']) return;
  const scripts = [
    '/widgets/timer/panel/01-shortcuts.js',
    '/widgets/timer/panel/02a-time-setup.js',
    '/widgets/timer/panel/02b-styles-alerts.js',
    '/widgets/timer/panel/02-controls.js',
    '/widgets/timer/panel/03a-preset-loader.js',
    '/widgets/timer/panel/03b-preset-crud.js',
    '/widgets/timer/panel/03-presets.js',
    '/widgets/timer/panel/04-save-as.js',
    '/widgets/timer/panel/05-preview-actions.js',
    '/widgets/timer/panel/06-save.js'
  ];
  scripts.forEach(s => {
    const el = document.createElement('script');
    el.src = s + '?v=50';
    el.async = false;
    document.head.appendChild(el);
  });
})();
