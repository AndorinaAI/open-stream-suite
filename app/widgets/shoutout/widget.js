// widgets/shoutout/widget.js — Coordinador y punto de entrada de Shoutout y Promo
//
// `widgets/promo` es un enlace simbolico a esta carpeta: el MISMO codigo sirve
// a los dos widgets. La clave del tema debe salir de la URL
// (`/widgets/promo/...` vs `/widgets/shoutout/...`) y no estar fija. Con
// `init('shoutout')` el tema asignado a Promo (overlayThemes['widget:promo'])
// no se leia nunca y ademas `data-oss-widget` quedaba como "shoutout".

(function() {

  var _wid = /\/widgets\/([a-z]+)\//.exec(window.location.pathname);
  _wid = _wid ? _wid[1] : 'shoutout';
  window.OSSTheme.init(_wid === 'promo' ? 'promo' : 'shoutout');
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
