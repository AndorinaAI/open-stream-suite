// ====================================================================
// TRIGGERS & MEMES - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  const scripts = [
    'js/triggers/01-editor-ui.js',
    'js/triggers/02-editor-data.js',
    'js/triggers/03-crud.js'
  ];
  if (typeof triggersList === 'undefined') {
    scripts.forEach(s => {
      const el = document.createElement('script');
      el.src = s + '?v=50';
      el.async = false;
      document.head.appendChild(el);
    });
  }
})();
