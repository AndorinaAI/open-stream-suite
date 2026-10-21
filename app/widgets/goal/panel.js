// ====================================================================
// WIDGET: GOAL PANEL - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  if (window.WidgetModules && window.WidgetModules['goal']) return;
  const scripts = [
    '/widgets/goal/panel/01a-target-tab.js',
    '/widgets/goal/panel/01b-styles-tab.js',
    '/widgets/goal/panel/01-controls.js',
    '/widgets/goal/panel/02-items-state.js',
    '/widgets/goal/panel/03-presets-actions.js',
    '/widgets/goal/panel/04-preview-presets.js',
    '/widgets/goal/panel/05-shortcuts-save.js'
  ];
  scripts.forEach(s => {
    const el = document.createElement('script');
    el.src = s + '?v=50';
    el.async = false;
    document.head.appendChild(el);
  });
})();
