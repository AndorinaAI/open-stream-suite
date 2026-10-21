// ====================================================================
// WIDGETS CORE - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  const scripts = [
    'js/widgets-core/01-miniapp.js',
    'js/widgets-core/02-dev-guide.js',
    'js/widgets-core/03-css-guide.js',
    'js/widgets-core/04-pip-zoom.js',
    'js/widgets-core/05-donations-modal.js',
    'js/widgets-core/06-donations-actions.js',
    'js/widgets-shortcuts.js'
  ];
  if (typeof openWidgetMiniApp === 'undefined') {
    scripts.forEach(s => {
      const el = document.createElement('script');
      el.src = s + '?v=50';
      el.async = false;
      document.head.appendChild(el);
    });
  }
})();
