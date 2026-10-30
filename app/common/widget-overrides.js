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

  // Formas disponibles POR COMPONENTE, agrupadas por pack.
  //
  // No vale ofrecer las 29 formas del catálogo: `chat` solo admite 9 y el
  // backend rechaza el resto («Forma no soportada por widget:chat»). La lista
  // válida la publica `/api/components/catalog`; el nombre y el pack, el
  // catálogo de packs. Un componente nuevo aparece solo.
  var shapesCache = {};

  function loadShapes(widgetId) {
    if (shapesCache[widgetId]) return Promise.resolve(shapesCache[widgetId]);
    var j = function (url) {
      return fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    };
    return Promise.all([j('/api/themes/packs'), j('/api/components/catalog')])
      .then(function (res) {
        var packs = (res[0] && res[0].packs) || [];
        var allowed = {};
        ((res[1] && res[1].widgets) || []).forEach(function (w) {
          if (w && w.id === widgetId) {
            (w.shapes || []).forEach(function (s) { allowed[s] = 1; });
          }
        });
        var groups = [];
        packs.forEach(function (p) {
          var list = (p.shapes || []).filter(function (s) {
            return s && s.id && allowed[s.id];
          });
          if (list.length) groups.push({ pack: p.id, shapes: list });
        });
        shapesCache[widgetId] = groups;
        return groups;
      });
  }

  function shapeOptions(groups, current) {
    var opts = '<option value="">— Sin forma propia (la del tema) —</option>';
    (groups || []).forEach(function (g) {
      opts += '<optgroup label="' + esc(pretty(g.pack)) + '">';
      g.shapes.forEach(function (s) {
        opts += '<option value="' + esc(s.id) + '"' +
          (String(s.id) === String(current) ? ' selected' : '') + '>' +
          esc(pretty(s.name || s.id)) + '</option>';
      });
      opts += '</optgroup>';
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
      // ---------------- TEMA (paleta) ----------------
      '<div class="miniapp-section-card">' +
        '<div class="miniapp-section-header"><div class="miniapp-section-title">' +
          '<span>🎨</span><span>TEMA — colores y tipografía</span>' +
        '</div></div>' +
        '<div class="form-group" style="margin-bottom:8px;">' +
          '<label for="cfg-widget-pack-theme" style="font-size:12px;font-weight:600;color:#fff;display:block;margin-bottom:6px;">' +
            'Tema del pack' +
          '</label>' +
          '<select id="cfg-widget-pack-theme" class="form-select" ' +
            'onchange="ThemePicker.onChange(\'' + esc(widgetId) + '\', \'theme\', this.value)">' + opts + '</select>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--color-text-dim);line-height:1.5;">' +
          'De aquí salen los <strong>colores</strong>: acento, fondo, bordes y tipografía.' +
        '</div>' +
        '<div id="cfg-theme-palette" style="margin-top:10px;"></div>' +
      '</div>' +

      // ---------------- FORMA (geometría) ----------------
      '<div class="miniapp-section-card">' +
        '<div class="miniapp-section-header"><div class="miniapp-section-title">' +
          '<span>🧩</span><span>FORMA — geometría</span>' +
        '</div></div>' +
        '<div class="form-group" style="margin-bottom:8px;">' +
          '<label for="cfg-widget-pack-shape" style="font-size:12px;font-weight:600;color:#fff;display:block;margin-bottom:6px;">' +
            'Silueta del componente' +
          '</label>' +
          '<select id="cfg-widget-pack-shape" class="form-select" ' +
            'onchange="ThemePicker.onChange(\'' + esc(widgetId) + '\', \'shape\', this.value)">' +
            shapeOptions(shapesCache[widgetId] || [], currentShape) + '</select>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--color-text-dim);line-height:1.5;">' +
          'De aquí salen los <strong>radios, recortes y decoración</strong>. ' +
          'Se combina con cualquier tema: forma <em>PCB</em> con paleta <em>caramelo</em> es válido.' +
        '</div>' +
      '</div>' +

      // ---------------- PERSONALIZACIÓN ----------------
      '<div class="miniapp-section-card">' +
        '<div class="miniapp-section-header"><div class="miniapp-section-title">' +
          '<span>🎛️</span><span>Personalización (encima de todo)</span>' +
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

  /** Carga las formas del componente la primera vez y rellena el selector. */
  function ensureShapes(widgetId, currentShape) {
    loadShapes(widgetId).then(function (groups) {
      var sel = document.getElementById('cfg-widget-pack-shape');
      if (sel && sel.options.length <= 1) sel.innerHTML = shapeOptions(groups, currentShape);
    });
  }

  // Paleta REAL del tema (tokens de su theme.json). Antes la personalizacion
  // ofrecia colores fijos que no pertenecian a ningun pack: de ahi la sensacion
  // de "todo mezclado". Ahora se ven los colores del tema elegido.
  var paletteCache = null;

  function loadPalette() {
    if (paletteCache) return Promise.resolve(paletteCache);
    return fetch('/api/themes/palette', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { paletteCache = (d && d.palette) || {}; return paletteCache; })
      .catch(function () { paletteCache = {}; return paletteCache; });
  }

  var PALETTE_KEYS = [
    '--color-accent-cyan', '--color-accent-orange', '--color-panel-bg',
    '--color-bg-dark', '--color-text-light', '--color-border-cyan'
  ];

  /** Pinta las muestras del tema elegido en `#cfg-theme-palette`. */
  function ensurePalette(themeId) {
    var box = document.getElementById('cfg-theme-palette');
    if (!box) return;
    if (!themeId) {
      box.innerHTML = '<div style="font-size:10px;color:var(--color-text-dim);">' +
        'Elige un tema del pack para ver su paleta.</div>';
      return;
    }
    loadPalette().then(function (pal) {
      var t = pal[themeId];
      if (!t) { box.innerHTML = ''; return; }
      var chips = PALETTE_KEYS.map(function (k) {
        var v = (t.tokens || {})[k];
        if (!v) return '';
        return '<span title="' + esc(k) + ' = ' + esc(v) + '" style="display:inline-block;' +
          'width:22px;height:22px;border-radius:4px;background:' + esc(v) +
          ';border:1px solid rgba(255,255,255,.25);"></span>';
      }).join('');
      var radii = ['--panel-radius', '--frame-radius', '--badge-radius']
        .map(function (k) { return (t.tokens || {})[k] ? k.replace('--', '') + ': ' + esc(t.tokens[k]) : ''; })
        .filter(Boolean).join(' · ');
      box.innerHTML =
        '<div style="font-size:10px;color:var(--color-text-dim);margin-bottom:4px;">' +
          'Paleta de «' + esc(t.name) + '» · pack ' + esc(pretty(t.pack)) + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' + chips + '</div>' +
        (radii ? '<div style="font-size:10px;color:var(--color-text-dim);margin-top:4px;">' + radii + '</div>' : '');
    });
  }

  /**
   * Avisa al iframe de previsualización para que aplique tema/forma al
   * instante, sin recargar (y sin perder los mensajes simulados).
   * El widget lo escucha en `widget-theme.js` (`oss-theme-preview`).
   */
  function notifyPreview(widgetId, payload) {
    var frame = document.getElementById('miniapp-live-iframe');
    if (!frame) return false;
    var theme = (payload && 'themeId' in payload) ? (payload.themeId || null) : undefined;
    var shape = (payload && 'shapeId' in payload) ? (payload.shapeId || null) : undefined;

    // 1) Camino rapido: el iframe aplica sin recargar (conserva los mensajes
    //    simulados). Ver `widget-theme.js` -> `oss-theme-preview`.
    try {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage({
          type: 'oss-theme-preview', widgetId: widgetId, theme: theme, shape: shape
        }, '*');
      }
    } catch (e) {}

    // 2) Garantia: si el iframe aun no ha cargado su listener (o viene de una
    //    version cacheada), el postMessage se pierde en silencio. A los 350 ms
    //    se recarga con `?theme=&shape=`, que el widget lee en `init()`.
    try {
      setTimeout(function () {
        var base = String(frame.src || '').split('?')[0];
        if (!base) return;
        var q = ['preview=true', 't=' + Date.now()];
        if (theme) q.push('theme=' + encodeURIComponent(theme));
        if (shape) q.push('shape=' + encodeURIComponent(shape));
        frame.src = base + '?' + q.join('&');
      }, 350);
    } catch (e) {}

    return true;
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

    // Una forma física pertenece a un pack, y ese pack tiene una paleta. Si el
    // widget no tiene tema propio, aplicar la forma trae tambien su tema: es
    // lo que el usuario espera al elegir "PCB" (verde con recorte diagonal).
    var appliedTheme = '';
    if (kind === 'shape' && value) {
      var groups = shapesCache[widgetId] || [];
      var group = groups.filter(function (g) {
        return (g.shapes || []).some(function (s) { return String(s.id) === String(value); });
      })[0];
      if (group && group.defaultTheme) {
        var st = (window.ComponentThemes && ComponentThemes.themeStateFor)
          ? ComponentThemes.themeStateFor('widget:' + widgetId)
          : {};
        if (!st || !st.theme) {
          payload.themeId = group.defaultTheme;
          appliedTheme = group.defaultTheme;
        }
      }
    }

    try {
      await api.assignComponent('widget:' + widgetId, payload);
      // Live view: el iframe de la mini-app aplica el cambio al instante.
      notifyPreview(widgetId, payload);
      if (window.UI && UI.showToast) {
        var msg;
        if (kind === 'shape') {
          msg = value ? '✓ Forma aplicada: ' + pretty(value) : '↺ Sin forma propia (la del tema)';
          if (appliedTheme) msg += ' + tema ' + pretty(appliedTheme) + ' del pack';
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
    ensureShapes: ensureShapes, ensurePalette: ensurePalette,
    loadShapes: loadShapes, loadPalette: loadPalette
  };
})();
