/**
 * Overrides de estilo por widget + selector de temas del pack.
 *
 * Un tema del pack define el aspecto; `styleOverrides` permite cambiarlo
 * encima sin perderlo. Este fichero es el ÚNICO sitio que decide qué variable
 * CSS representa cada override, para que los 6 widgets no vuelvan a divergir.
 *
 * Los temas salen de `config.js.themeCatalog` (generado desde disco): un pack
 * o un tema nuevos aparecen solos en el desplegable.
 */
window.WidgetOverrides = (function () {
  'use strict';

  var MAP = {
    accentColor: '--widget-accent',
    bgColor: '--widget-bg',
    bgOpacity: '--widget-bg-opacity',
    borderColor: '--widget-border',
    borderWidth: '--widget-border-width',
    borderStyle: '--widget-border-style',
    glowIntensity: '--widget-glow',
    fontFamily: '--widget-font',
    fontSize: '--widget-font-size',
    barPattern: '--widget-bar-pattern',
    barHeight: '--widget-bar-height'
  };

  function clear() {
    var s = document.body.style;
    Object.keys(MAP).forEach(function (k) { s.removeProperty(MAP[k]); });
    s.removeProperty('--oss-bg-opacity');
  }

  function resolve(overrides) {
    var out = {};
    var o = overrides || {};
    Object.keys(MAP).forEach(function (k) {
      if (o[k] !== undefined && o[k] !== null && o[k] !== '') out[MAP[k]] = o[k];
    });
    return out;
  }

  function apply(widgetId, overrides) {
    clear();
    var resolved = resolve(overrides);
    var s = document.body.style;
    Object.keys(resolved).forEach(function (k) { s.setProperty(k, resolved[k]); });
    // glowIntensity (0-100) -> --widget-glow con el acento resuelto
    if (resolved['--widget-glow'] != null) {
      var n = Number(resolved['--widget-glow']);
      var accent = resolved['--widget-accent'] || 'currentColor';
      s.setProperty('--widget-glow', '0 0 ' + (isFinite(n) ? n / 2 : 20) + 'px ' + accent);
    }
    if (resolved['--widget-bg-opacity'] != null) {
      s.setProperty('--oss-bg-opacity', resolved['--widget-bg-opacity'] + '%');
    }
    return resolved;
  }

  function set(widgetId, key, value) {
    if (!MAP[key]) return null;
    if (value === '' || value === null || value === undefined) {
      document.body.style.removeProperty(MAP[key]);
    } else {
      document.body.style.setProperty(MAP[key], value);
    }
    return value;
  }

  return { MAP: MAP, apply: apply, clear: clear, set: set, resolve: resolve };
})();

window.ThemePicker = (function () {
  'use strict';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function catalog() {
    return (window.OSS_CONFIG && window.OSS_CONFIG.themeCatalog) || { packs: [] };
  }

  function pretty(id) {
    return String(id || '').replace(/_/g, ' ');
  }

  /** HTML del selector: temas agrupados por pack + «heredar global». */
  function render(widgetId, current) {
    var packs = catalog().packs || [];
    var opts = '<option value="">— Heredar tema global —</option>';
    packs.forEach(function (p) {
      var themes = p.themes || [];
      if (!themes.length) return;
      opts += '<optgroup label="' + esc(pretty(p.id)) + '">';
      themes.forEach(function (t) {
        opts += '<option value="' + esc(t) + '"' +
          (String(t) === String(current) ? ' selected' : '') + '>' + esc(pretty(t)) + '</option>';
      });
      opts += '</optgroup>';
    });
    return '' +
      '<div class="miniapp-section-card">' +
        '<div class="miniapp-section-header"><div class="miniapp-section-title">' +
          '<span>🎨</span><span>Tema del pack</span>' +
        '</div></div>' +
        '<div class="form-group" style="margin-bottom:10px;">' +
          '<label for="cfg-widget-pack-theme" style="font-size:12px;font-weight:600;color:#fff;display:block;margin-bottom:6px;">' +
            'Tema aplicado a este widget' +
          '</label>' +
          '<select id="cfg-widget-pack-theme" class="form-select" ' +
            'onchange="ThemePicker.onChange(\'' + esc(widgetId) + '\', this.value)">' + opts + '</select>' +
          '<div style="font-size:10px;color:var(--color-text-dim);margin-top:4px;">' +
            'El tema del pack manda. Los ajustes de abajo se aplican encima.' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /** Guarda el tema asignado al widget y refresca el preview. */
  async function onChange(widgetId, themeId) {
    var api = (typeof API !== 'undefined' && API) || window.API || null;
    if (!api || typeof api.assignComponent !== 'function') {
      if (window.UI && UI.showToast) {
        UI.showToast('No se pudo guardar: la API del panel no está disponible', 'error');
      }
      return false;
    }
    try {
      await api.assignComponent('widget:' + widgetId, { themeId: themeId || '' });
      if (window.UI && UI.showToast) {
        UI.showToast(themeId ? '✓ Tema aplicado: ' + pretty(themeId) : '↺ Heredando el tema global', 'success');
      }
      // Refresco del chip de estado sin reconstruir el DOM del panel: repintar
      // la cuadricula cerraba el <select> que el usuario acababa de usar.
      if (window.ComponentThemes && ComponentThemes.paintStatusChips) {
        try { ComponentThemes.paintStatusChips(); } catch (e2) {}
      }
      return true;
    } catch (e) {
      if (window.UI && UI.showToast) UI.showToast('No se pudo aplicar el tema: ' + e.message, 'error');
      return false;
    }
  }

  return { render: render, onChange: onChange, catalog: catalog };
})();
