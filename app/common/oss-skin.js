/**
 * Open Stream Suite — Resolutor de skin para widgets y alertas.
 *
 * Convierte el tema asignado en `data-theme-archetype` sobre el <body>, que es
 * lo que activa la familia de tokens `--skin-*` (geometría, adornos y
 * tipografía por arquetipo) y con ella la capa `common/oss-skin.css`.
 *
 * El mapa `tema -> arquetipo` lo publica el servidor en `config.js`
 * (`themeArchetypes`), derivado de `streamthemes/<Pack>/styles/<tema>`: cualquier
 * pack o tema nuevo queda resuelto automáticamente, sin listas ni código por
 * componente.
 *
 * API:
 *   OSSSkin.apply(theme, archetype?)   // fija tema + arquetipo (archetype manda)
 *   OSSSkin.clear()                    // quita el skin (vuelve al aspecto base)
 *   OSSSkin.archetype(theme)           // arquetipo de un tema, o null
 */
window.OSSSkin = (function () {
  function cfg() { return window.OSS_CONFIG || {}; }

  function archetype(theme) {
    if (!theme) return null;
    var map = cfg().themeArchetypes || {};
    return map[theme] || null;
  }

  function apply(theme, archetypeOverride) {
    var arch = archetypeOverride || archetype(theme);
    var body = document.body;
    if (!body) return null;
    if (theme) body.setAttribute('data-theme', theme);
    else body.removeAttribute('data-theme');
    if (arch) body.setAttribute('data-theme-archetype', arch);
    else body.removeAttribute('data-theme-archetype');
    // Los widgets aplican su acento inline DESPUÉS de este punto (su render va
    // aparte), así que se reintenta sin bloquear; la operación es idempotente.
    if (theme && arch) {
      [0, 250, 900].forEach(function (delay) {
        setTimeout(function () {
          adoptThemeColors(document);
          adoptWidgetContentStyles(document);
        }, delay);
      });
    }
    return arch;
  }

  function clear() {
    var body = document.body;
    if (!body) return;
    body.removeAttribute('data-theme');
    body.removeAttribute('data-theme-archetype');
  }

  /** ¿El arquetipo declarado por el tema es alguno de los conocidos?
   *  Se resuelve con el catalogo publicado por el servidor: un arquetipo nuevo
   *  aparece solo (antes estaba hardcodeado a los cuatro de fabrica). */
  function isKnown(arch) {
    if (!arch) return false;
    var atmo = ((cfg().themeCatalog || {}).archetypeAtmosphere) || {};
    if (Object.prototype.hasOwnProperty.call(atmo, arch)) return true;
    var packs = ((cfg().themeCatalog || {}).packs) || [];
    for (var i = 0; i < packs.length; i++) {
      if (packs[i] && packs[i].archetype === arch) return true;
    }
    return arch === 'cozy' || arch === 'gamer' || arch === 'maker' || arch === 'openstream';
  }

  /* ------------------------------------------------------------------
     AUTO-ETIQUETA DE TEXTOS (`data-text-key`)
     `dom-injector.js` ya sabe APLICAR los textos por `data-text-key`, pero
     solo los elementos que ya traian el atributo eran editables (~180 textos
     del producto se quedaban fuera). Aqui se generan las claves que faltan:

       * clave estable y legible: `<escena>.<tag>[.<clase>]#<n>`;
       * no pisa una clave manual existente;
       * respeta `common/overlay/static-texts.json` (selectores y patrones:
         relojes, telemetria, iconos) y la marca explicita `data-oss-static`;
       * idempotente: ejecutarla dos veces no cambia nada.
     ------------------------------------------------------------------ */
  var staticRules = null;

  function loadStaticRules() {
    if (staticRules) return Promise.resolve(staticRules);
    var url = '/common/overlay/static-texts.json';
    return fetch(url, { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { staticRules = (data && typeof data === 'object') ? data : {}; return staticRules; })
      .catch(function () { staticRules = {}; return staticRules; });
  }

  function matchesAny(el, selectors) {
    for (var i = 0; i < selectors.length; i++) {
      try {
        if (el.matches(selectors[i]) || el.closest(selectors[i])) return true;
      } catch (e) { /* selector invalido: se ignora */ }
    }
    return false;
  }

  function textMatchesAny(text, patterns) {
    for (var i = 0; i < patterns.length; i++) {
      try {
        if (new RegExp(patterns[i]).test(text)) return true;
      } catch (e) { /* patron invalido: se ignora */ }
    }
    return false;
  }

  function isStaticText(el, text, rules) {
    if (el.hasAttribute('data-oss-static')) return true;
    if (matchesAny(el, rules.selectors || [])) return true;
    return textMatchesAny(text, rules.textPatterns || []);
  }

  function textKeyFor(el, scene, counters) {
    var tag = (el.tagName || 'el').toLowerCase();
    var cls = String(el.className || '').split(/\s+/).filter(Boolean)[0] || '';
    var base = scene + '.' + tag + (cls ? '.' + cls : '');
    counters[base] = (counters[base] || 0) + 1;
    return base + '#' + counters[base];
  }

  function autoTagTexts(root) {
    root = root || document.body;
    if (!root) return 0;
    var rules = staticRules || { selectors: ['[data-oss-static]'], textPatterns: [] };
    var scene = window.__CURRENT_SCENE_KEY__ || (document.body && document.body.dataset.scene) || 'scene';
    var counters = {};
    var tagged = 0;
    var elements = root.querySelectorAll('*');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.hasAttribute('data-text-key')) continue;
      if (el.closest('script, style, textarea, pre, code, svg')) continue;
      // Solo hojas: un contenedor con hijos no es un texto editable.
      var hasElementChild = false;
      for (var c = 0; c < el.childNodes.length; c++) {
        if (el.childNodes[c].nodeType === 1) { hasElementChild = true; break; }
      }
      if (hasElementChild) continue;
      var text = (el.textContent || '').trim();
      if (text.length < 2 || text.length > 220) continue;
      if (isStaticText(el, text, rules)) continue;
      el.setAttribute('data-text-key', textKeyFor(el, scene, counters));
      tagged++;
    }
    return tagged;
  }

  // Carga temprana de las reglas; si aun no han llegado, autoTagTexts usa el
  // fallback minimo y una segunda pasada con las reglas reales es inocua.
  loadStaticRules().then(function () {
    if (document.body) autoTagTexts(document.body);
  });

  /* ------------------------------------------------------------------
     COLORES DE TEMA EN WIDGETS
     Algunos widgets ponen su acento INLINE (`--goal-accent`) desde su render
     (`.style.setProperty`), y ese inline GANA al CSS: un widget con tema cozy
     seguia pintando el verde del maker.

     Regla (la misma del esquema de personalizacion): si el valor inline es el
     de FABRICA, el usuario no lo ha tocado -> manda el TEMA; si lo cambio, se
     respeta su valor.

     Solo se tocan acentos GENERICOS. Los colores semanticos del ticker
     (`--tk-sub`, `--tk-tip`, `--tk-bits`...) son de cada plataforma, no del
     tema, y no se tocan.
     ------------------------------------------------------------------ */
  var THEME_COLOR_AXES = {
    '--goal-accent': '--color-accent-cyan'
  };
  var FACTORY_COLORS = {
    '--goal-accent': '#57D6C4'
  };

  function adoptThemeColors(root) {
    root = root || document;
    var body = document.body;
    if (!body || !body.getAttribute('data-theme')) return 0;
    var bodyStyle = getComputedStyle(body);
    var elements = root.querySelectorAll('*');
    var changed = 0;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.style) continue;
      for (var prop in THEME_COLOR_AXES) {
        var inline = (el.style.getPropertyValue(prop) || '').trim();
        if (!inline) continue;
        var factory = (FACTORY_COLORS[prop] || '').toUpperCase();
        if (inline.toUpperCase() !== factory) continue;   // override del usuario
        var themeValue = (bodyStyle.getPropertyValue(THEME_COLOR_AXES[prop]) || '').trim();
        if (!themeValue) continue;
        el.style.setProperty(prop, themeValue);
        changed++;
      }
    }
    return changed;
  }

  /* ------------------------------------------------------------------
     CONTENIDO DE WIDGETS
     Que elemento de cada widget es "contenido" (mensajes, filas, tarjetas).
     El CSS de `oss-skin.css` ya los viste cuando hay tema; aqui se marca el
     elemento para que (a) sea inspeccionable y (b) un widget nuevo solo tenga
     que anadir su entrada. Sin tema no se marca nada.
     ------------------------------------------------------------------ */
  var CONTENT_THEME_SCOPES = {
    chat: '.chat-msg',
    ticker: '.prompter-item',
    goal: '.goal-item',
    shoutout: '.shoutout-card-body',
    promo: '.shoutout-card-body',
    timer: '.timer-card'
  };

  function adoptWidgetContentStyles(root) {
    root = root || document;
    var body = document.body;
    if (!body) return 0;
    var widget = body.getAttribute('data-oss-widget');
    if (!widget) return 0;
    if (!body.getAttribute('data-theme') || !body.getAttribute('data-theme-archetype')) return 0;
    var selector = CONTENT_THEME_SCOPES[widget];
    if (!selector) return 0;
    var marked = 0;
    root.querySelectorAll(selector).forEach(function (el) {
      if (!el.hasAttribute('data-oss-content-theme')) {
        el.setAttribute('data-oss-content-theme', widget);
        marked++;
      }
    });
    return marked;
  }

  return {
    apply: apply,
    clear: clear,
    archetype: archetype,
    isKnown: isKnown,
    autoTagTexts: autoTagTexts,
    adoptThemeColors: adoptThemeColors,
    adoptWidgetContentStyles: adoptWidgetContentStyles,
    contentScopes: CONTENT_THEME_SCOPES,
    loadStaticRules: loadStaticRules,
    get current() { return document.body ? document.body.getAttribute('data-theme-archetype') : null; },
    get map() { return cfg().themeArchetypes || {}; }
  };
})();
