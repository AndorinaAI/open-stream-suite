// ====================================================================
// ROLES MANAGER - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  const scripts = [
    'js/roles/01-state.js',
    'js/roles/02-render.js',
    'js/roles/03-actions.js',
    'js/roles/04-twitch-sync.js'
  ];
  if (typeof cachedRoles === 'undefined') {
    scripts.forEach(s => {
      const el = document.createElement('script');
      el.src = s + '?v=50';
      el.async = false;
      document.head.appendChild(el);
    });
  }
})();
