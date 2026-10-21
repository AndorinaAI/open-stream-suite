// ====================================================================
// MEDIA EXPLORER - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  const scripts = [
    'js/media/01-state-load.js',
    'js/media/02-render.js',
    'js/media/03-selection-dnd.js',
    'js/media/04-upload-folders.js',
    'js/media/05-preview-assign.js',
    'js/media/06-filters-select-init.js'
  ];
  if (typeof mediaFiles === 'undefined') {
    scripts.forEach(s => {
      const el = document.createElement('script');
      el.src = s + '?v=50';
      el.async = false;
      document.head.appendChild(el);
    });
  }
})();
