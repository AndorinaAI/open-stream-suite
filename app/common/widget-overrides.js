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

  // Formas disponibles: se piden UNA vez y se cachean. Salen del catálogo de
  // packs (el mismo que usa el acordeón), así que una forma nueva aparece sola.
  var shapesCache = null;

  function loadShapes() {
    if (shapesCache) return Promise.resolve(shapesCache);
    return fetch('/api/themes/packs', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var seen = {}, out = [];
        ((d && d.packs) || []).forEach(function (p) {
          (p.shapes || []).forEach(function (s) {
            if (s && s.id && !seen[s.id]) { seen[s.id] = 1; out.push({ id: s.id, name: s.name || s.id }); }
          });
        });
        shapesCache = out;
        return out;
      })
      .catch(function () { shapesCache = []; return shapesCache; });
  }

  function shapeOptions(shapes, current) {
    var opts = '<option value="">— Sin forma (la del tema) —</option>';
    (shapes || []).forEach(function (s) {
      opts += '<option value="' + esc(s.id) + '"' +
        (String(s.id) === String(current) ? ' selected' : '') + '>' + esc(pretty(s.name)) + '</option>';
    });
    return opts;
  }

  /** Panel completo: tema + forma + personalización, todo en el mismo sitio. */
  function render(widgetId, current, currentShape, overrides) {
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
    var o = overrides || {};
    return '' +
      '<div class="miniapp-section-card">' +
        '<div class="miniapp-section-header"><div class="miniapp-section-title">' +
          '<span>🎨</span><span>Tema y forma del pack</span>' +
        '</div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">' +
          '<div class="form-group" style="margin-bottom:0;">' +
            '<label for="cfg-widget-pack-theme" style="font-size:12px;font-weight:600;color:#fff;display:block;margin-bottom:6px;">Tema</label>' +
            '<select id="cfg-widget-pack-theme" class="form-select" ' +
              'onchange="ThemePicker.onChange(\'' + esc(widgetId) + '\', \'theme\', this.value)">' + opts + '</select>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:0;">' +
            '<label for="cfg-widget-pack-shape" style="font-size:12px;font-weight:600;color:#fff;display:block;margin-bottom:6px;">Forma</label>' +
            '<select id="cfg-widget-pack-shape" class="form-select" ' +
              'onchange="ThemePicker.onChange(\'' + esc(widgetId) + '\', \'shape\', this.value)">' +
              shapeOptions(shapesCache || [], currentShape) + '</select>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--color-text-dim);">' +
          'El tema del pack manda y trae su forma (en «cozy», píldoras redondas). ' +
          'La personalización de abajo se aplica encima.' +
        '</div>' +
      '</div>' +
      '<div class="miniapp-section-card">' +
        '<div class="miniapp-section-header"><div class="miniapp-section-title">' +
          '<span>🎛️</span><span>Personalización (encima del tema)</span>' +
        '</div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
          '<div class="form-group" style="margin-bottom:0;">' +
            '<label for="cfg-ov-accent" style="font-size:11px;display:block;margin-bottom:4px;">Color de acento</label>' +
            '<input type="color" id="cfg-ov-accent" value="' + esc(o.accentColor || '#57D6C4') + '" ' +
              'style="height:32px;width:100%;border:1px solid var(--color-border-dim);background:transparent;border-radius:4px;" ' +
              'oninput="WidgetOverrides.set(\'' + esc(widgetId) + '\', \'accentColor\', this.value)">' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:0;">' +
            '<label for="cfg-ov-border" style="font-size:11px;display:block;margin-bottom:4px;">Color de borde</label>' +
            '<input type="color" id="cfg-ov-border" value="' + esc(o.borderColor || '#57D6C4') + '" ' +
              'style="height:32px;width:100%;border:1px solid var(--color-border-dim);background:transparent;border-radius:4px;" ' +
              'oninput="WidgetOverrides.set(\'' + esc(widgetId) + '\', \'borderColor\', this.value)">' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn-action-test" style="font-size:11px;padding:5px 10px;margin-top:10px;" ' +
          'onclick="WidgetOverrides.clear()">↺ Volver al tema del pack</button>' +
      '</div>';
  }

  /** Carga las formas la primera vez y rellena el selector. */
  function ensureShapes(widgetId, currentShape) {
    loadShapes().then(function (shapes) {
      var sel = document.getElementById('cfg-widget-pack-shape');
      if (sel && sel.options.length <= 1) sel.innerHTML = shapeOptions(shapes, currentShape);
    });
  }

  /** Guarda tema o forma del widget. `kind`: 'theme' | 'shape'. */
  async function onChange(widgetId, kind, value) {
    var api = (typeof API !== 'undefined' && API) || window.API || null;
    if (!api || typeof api.assignComponent !== 'function') {
      if (window.UI && UI.showToast) {
        UI.showToast('No se pudo guardar: la API del panel no está disponible', 'error');
      }
      return false;
    }
    // El backend trata '' como «heredar» (lo convierte en __clear__ y borra la
    // asignación), así que un valor vacío es una acción válida.
    var payload = (kind === 'shape') ? { shapeId: value || '' } : { themeId: value || '' };
    try {
      await api.assignComponent('widget:' + widgetId, payload);
      if (window.UI && UI.showToast) {
        var msg;
        if (kind === 'shape') {
          msg = value ? '✓ Forma aplicada: ' + pretty(value) : '↺ Sin forma propia (la del tema)';
        } else {
          msg = value ? '✓ Tema aplicado: ' + pretty(value) : '↺ Heredando el tema global';
        }
        UI.showToast(msg, 'success');
      }
      // Solo se repintan los chips: reconstruir la cuadrícula cerraba el
      // <select> que el usuario acababa de usar.
      if (window.ComponentThemes && ComponentThemes.paintStatusChips) {
        try { ComponentThemes.paintStatusChips(); } catch (e2) {}
      }
      return true;
    } catch (e) {
      if (window.UI && UI.showToast) UI.showToast('No se pudo aplicar: ' + e.message, 'error');
      return false;
    }
  }

  return {
    render: render, onChange: onChange, catalog: catalog,
    ensureShapes: ensureShapes, loadShapes: loadShapes
  };
})();
