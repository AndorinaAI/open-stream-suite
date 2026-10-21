// ====================================================================
// WIDGET: CHAT PANEL - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  if (window.WidgetModules && window.WidgetModules['chat']) return;
  const scripts = [
    '/widgets/chat/panel/01-shortcuts.js',
    '/widgets/chat/panel/02a-styles-presets.js',
    '/widgets/chat/panel/02b-spotlight-timers.js',
    '/widgets/chat/panel/02-controls.js',
    '/widgets/chat/panel/03-presets.js',
    '/widgets/chat/panel/04-preview-feed.js',
    '/widgets/chat/panel/05-bot-timers.js',
    '/widgets/chat/panel/06-particles.js',
    '/widgets/chat/panel/07-css-guide.js',
    '/widgets/chat/panel/08-simulate-save.js'
  ];
  scripts.forEach(s => {
    const el = document.createElement('script');
    el.src = s + '?v=50';
    el.async = false;
    document.head.appendChild(el);
  });
})();
