/**
 * Open Stream Suite — Tema y forma nativos para widgets.
 *
 * Fuente de verdad: themes_state.json -> config.js (overlayThemes / overlayShapes).
 * Precedencia: asignación explícita del componente > tema global (theme_change).
 *
 * API:
 *   OSSTheme.init('chat')                 // arranque (?theme -> config -> defecto)
 *   OSSTheme.apply(theme, shape, opts)    // cambio en vivo (WS o panel)
 *   OSSTheme.current()                    // {theme, shape, assigned}
 */
window.OSSTheme = (function () {
  var id = null;
  var liveExplicitTheme = null; // null = desconocido; true/false = asignación explícita conocida
  var liveGlobalTheme = null;   // último theme_change global recibido

  function cfg() { return window.OSS_CONFIG || {}; }
  function key() { return 'widget:' + id; }
  function isExplicitTheme() {
    if (liveExplicitTheme !== null) return liveExplicitTheme;
    return !!(cfg().overlayThemeExplicit || {})[key()];
  }
  function assignedTheme() {
    return isExplicitTheme() ? ((cfg().overlayThemes || {})[key()] || null) : null;
  }
  function globalTheme() { return liveGlobalTheme || (cfg().globalThemeActive ? (cfg().activeTheme || null) : null); }
  function assignedShape() { return (cfg().overlayShapes || {})[key()] || null; }

  function shapeTarget() { return document.querySelector('[data-oss-shape-target]'); }

  function applyChatShape(shape) {
    // Chat genera su CSS de forma en `applyChatConfig`; se reutiliza sin duplicar lógica.
    if (!window.ChatStyles || !window.ChatStyles.config) return;
    try {
      window.ChatStyles.config.shape = shape || null;
      if (typeof window.ChatStyles.applyChatConfig === 'function') window.ChatStyles.applyChatConfig();
    } catch (e) {}
  }

  function apply(theme, shape, opts) {
    opts = opts || {};
    // Un tema global no debe pisar una asignación explícita del componente.
    if (opts.global && isExplicitTheme()) return false;

    if (opts.reset) {
      liveExplicitTheme = false;
      theme = null;
      shape = null;
    } else if (typeof opts.explicit === 'boolean' && !opts.global) {
      liveExplicitTheme = opts.explicit;
    }

    // `undefined` = no tocar; `null` = limpiar. Así un theme_change global no
    // borra una forma asignada y un cambio sólo de forma conserva el tema.
    if (theme !== undefined) {
      if (theme) document.body.setAttribute('data-theme', theme);
      else document.body.removeAttribute('data-theme');
    }
    if (shape !== undefined) {
      window.OSS_WIDGET_SHAPE = shape || null;
      if (shape) document.body.setAttribute('data-theme-shape', shape);
      else document.body.removeAttribute('data-theme-shape');

      if (id === 'chat') {
        applyChatShape(shape);
      } else if (window.OSSShape) {
        if (shape) window.OSSShape.apply(shapeTarget(), shape);
        else window.OSSShape.clear(shapeTarget());
      }
    }
    // Skin de componentes: resuelve el arquetipo del tema activo (mapa
    // `themeArchetypes` de config.js, derivado de disco) y activa la capa
    // `common/oss-skin.css`. Sin esto los widgets solo recibían los colores.
    if (window.OSSSkin) {
      var active = document.body.getAttribute('data-theme');
      if (active) window.OSSSkin.apply(active);
      else window.OSSSkin.clear();
    }
    return true;
  }

  function handleMessage(data) {
    if (!data) return;
    var type = data.type;
    if (type === 'theme_change') {
      liveGlobalTheme = data.theme || null;
      apply(data.theme, undefined, { global: true });
      return;
    }
    if (type !== 'widget_theme_change') return;
    if (data.reset) {
      apply(null, null, { reset: true, explicit: false });
      // Si hay un tema global activo, el componente vuelve a él de inmediato.
      if (globalTheme()) apply(globalTheme(), undefined, {});
      return;
    }
    var hasShape = Object.prototype.hasOwnProperty.call(data, 'shape');
    var explicit = (typeof data.explicit === 'boolean') ? data.explicit : undefined;
    if (data.theme != null) {
      apply(data.theme, hasShape ? data.shape : undefined, { explicit: explicit === undefined ? true : explicit });
    } else if (hasShape) {
      // Sólo forma: conserva el tema actual.
      apply(undefined, data.shape, { explicit: explicit === undefined ? false : explicit });
    } else if (explicit !== undefined) {
      apply(undefined, undefined, { explicit: explicit });
    }
  }

  function init(widgetId) {
    id = widgetId;
    window.OSS_WIDGET_ID = widgetId;
    try {
      var p = new URLSearchParams(window.location.search);
      var queryTheme = p.get('theme');
      var theme = queryTheme || assignedTheme() || globalTheme();
      var shape = p.get('shape') || assignedShape();
      apply(theme, shape, queryTheme ? { explicit: true } : {});
    } catch (e) {}
  }

  return {
    init: init,
    apply: apply,
    handleMessage: handleMessage,
    get id() { return id; },
    current: function () {
      return {
        theme: document.body.getAttribute('data-theme'),
        shape: window.OSS_WIDGET_SHAPE || null,
        assigned: isExplicitTheme()
      };
    }
  };
})();
