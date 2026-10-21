// widgets/chat/widget.js — Coordinador y punto de entrada modular del chat

(function() {
  async function init() {
    if (window.ParticleEngine && typeof window.ParticleEngine.init === 'function') {
      window.ParticleEngine.init('particle-canvas');
    }

    if (window.ChatNetwork && window.ChatRenderer) {
      await window.ChatNetwork.fetchInitialConfig();

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('preview') === 'true') {
        document.body.classList.add('is-preview');
        window.ChatRenderer.renderMessage('AndorinaDev', '#EF4444', '¡Bienvenidos al stream! 🎮', '', 'broadcaster/1');
        window.ChatRenderer.renderMessage('MakerFan', '#F59E0B', '¿Qué filamento usas para esa pieza? ⭐', '', 'subscriber/6');
        window.ChatRenderer.renderMessage('AlexTech', '#38BDF8', '¡Nuevo seguidor por aquí, qué buena pinta! 💜', '', 'follower/1');
        window.ChatRenderer.renderMessage('AnonUser', '#94A3B8', 'Hola a todos, probando el chat sin lag 👤', '', '');
      }

      window.ChatNetwork.connectTwitchIRC();
      window.ChatNetwork.connectLocalWS();
    }
  }

  // Exponer API global
  window.applyChatConfig = function(cfg) {
    if (window.ChatStyles) window.ChatStyles.applyChatConfig(cfg);
  };
  window.renderChatMessage = function(...args) {
    if (window.ChatRenderer) window.ChatRenderer.renderMessage(...args);
  };

  if (window.ChatStyles && window.ChatParser && window.ChatRenderer && window.ChatNetwork) {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } else {
    // Si se cargó directamente sin los tags en HTML, cargarlos dinámicamente
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('chat/widget.js')) {
          return s.src.replace(/widget\.js(\?.*)?$/, 'js/');
        }
      }
      return '/widgets/chat/js/';
    })();

    function loadScript(file) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = basePath + file + '?v=50';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    Promise.all([
      loadScript('particles.js'),
      loadScript('styles.js'),
      loadScript('parser.js'),
      loadScript('render.js'),
      loadScript('network.js')
    ]).then(() => {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    }).catch(err => console.error('Error cargando submódulos de Chat:', err));
  }
})();
