// ====================================================================
// WIDGET: SHOUTOUT PANEL - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  if (window.WidgetModules && window.WidgetModules['shoutout']) return;
  const scripts = [
    '/widgets/shoutout/panel/01-shortcuts.js',
    '/widgets/shoutout/panel/02a-creator-tab.js',
    '/widgets/shoutout/panel/02b-styles-tab.js',
    '/widgets/shoutout/panel/02-controls.js',
    '/widgets/shoutout/panel/03a-creator-actions.js',
    '/widgets/shoutout/panel/03b-creator-preview.js',
    '/widgets/shoutout/panel/03-creator.js',
    '/widgets/shoutout/panel/04-history.js',
    '/widgets/shoutout/panel/05-presets.js',
    '/widgets/shoutout/panel/06-style-sync.js',
    '/widgets/shoutout/panel/07-qr.js',
    '/widgets/shoutout/panel/08-save.js'
  ];
  scripts.forEach(s => {
    const el = document.createElement('script');
    el.src = s + '?v=50';
    el.async = false;
    document.head.appendChild(el);
  });
})();
