// widgets/shoutout/widget.js — Coordinador y punto de entrada de Shoutout y Promo
//
// `widgets/promo` es un enlace simbolico a esta carpeta: el MISMO codigo sirve
// a los dos widgets. La clave del tema es `widget:promo` SIEMPRE: es la unica
// que existe en `widgets_config.json` y la unica que escribe el panel.
//
// Antes se derivaba de la URL, asi que abrir /widgets/shoutout/ inicializaba
// `OSSTheme.init('shoutout')` y leia `overlayThemes['widget:shoutout']`, que no
// existe: el widget expuesto en el panel jamas recibia su tema ni su forma.

(function() {

  window.OSSTheme.init('promo');
  function init() {
    if (window.ShoutoutNetwork) {
      window.ShoutoutNetwork.connectWS();
      window.ShoutoutNetwork.checkPreviewMode();
    }
  }

  // Compatibilidad hacia atrás con llamadas externas
  window.showShoutout = function(data) {
    if (window.ShoutoutRenderer) {
      window.ShoutoutRenderer.showShoutout(data);
    }
  };

  if (window.ShoutoutStyles && window.ShoutoutRenderer && window.ShoutoutNetwork) {
    init();
  } else {
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('shoutout/widget.js')) {
          return s.src.replace(/widget\.js(\?.*)?$/, 'js/');
        }
      }
      return '/widgets/shoutout/js/';
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
      loadScript('styles.js'),
      loadScript('render.js'),
      loadScript('network.js')
    ]).then(init).catch(err => console.error('Error cargando submódulos de Shoutout:', err));
  }
})();
