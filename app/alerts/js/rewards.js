// ====================================================================
// TWITCH REWARDS MANAGER - LOADER & BACKWARD-COMPATIBILITY ENTRY POINT
// ====================================================================
(function() {
  const scripts = [
    'js/rewards/01-state-colors.js',
    'js/rewards/02-drawer-render.js',
    'js/rewards/03-actions-crud.js'
  ];
  if (typeof twitchRewardsList === 'undefined') {
    scripts.forEach(s => {
      const el = document.createElement('script');
      el.src = s + '?v=50';
      el.async = false;
      document.head.appendChild(el);
    });
  }
})();
