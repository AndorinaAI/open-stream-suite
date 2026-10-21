// ====================================================================
// WIDGET: TICKER PANEL - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  if (window.WidgetModules && window.WidgetModules['ticker']) return;
  const scripts = [
    '/widgets/ticker/panel/01a-content-tab.js',
    '/widgets/ticker/panel/01b-styles-tab.js',
    '/widgets/ticker/panel/01-controls.js',
    '/widgets/ticker/panel/02-phrases-rss.js',
    '/widgets/ticker/panel/03-preview-save.js',
    '/widgets/ticker/panel/04-presets-shortcuts.js'
  ];
  scripts.forEach(s => {
    const el = document.createElement('script');
    el.src = s + '?v=50';
    el.async = false;
    document.head.appendChild(el);
  });
})();
