// ====================================================================
// OVERLAY TEXTS - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  const scripts = [
    'js/overlay-texts/01-core.js',
    'js/overlay-texts/02-render.js',
    'js/overlay-texts/03-api.js'
  ];
  if (!window.OverlayTexts || !window.OverlayTexts.collectFormData) {
    scripts.forEach(s => {
      const el = document.createElement('script');
      el.src = s + '?v=50';
      el.async = false;
      document.head.appendChild(el);
    });
  }
})();
