/**
 * Formas de alerta: 9 genéricas (OSSShape inline) + 20 físicas de pack.
 * Las físicas reutilizan el CSS de escenas: body[data-theme-shape] + [data-oss-panel].
 */
window.AlertShapes = (function () {
  var assigned = { card: null, banner: null };
  var themes = { card: null, banner: null };
  var explicit = { card: false, banner: false };
  var globalTheme = null;

  function node(type) {
    return document.getElementById(type === 'banner' ? 'banner-alert-root' : 'alert-card');
  }

  function isGeneric(shape) {
    return !!(window.OSSShape && OSSShape.shapes.indexOf(shape) !== -1);
  }

  function clearBodyShape() {
    if (document.body.hasAttribute('data-theme-shape')) {
      document.body.removeAttribute('data-theme-shape');
    }
  }

  function apply(type, shape) {
    var el = node(type);
    if (!el) return;
    if (window.OSSShape) OSSShape.clear(el);
    clearBodyShape();
    if (!shape) return;
    if (isGeneric(shape)) {
      if (window.OSSShape) OSSShape.apply(el, shape);
      return;
    }
    document.body.setAttribute('data-theme-shape', shape);
  }

  function set(type, shape) {
    assigned[type] = shape || null;
  }

  function applyAssigned(type) {
    apply(type, assigned[type]);
  }

  function configure(cfg) {
    cfg = cfg || {};
    var ot = cfg.overlayThemes || {};
    var oe = cfg.overlayThemeExplicit || {};
    themes.card = ot['alert:card'] || null;
    themes.banner = ot['alert:banner'] || null;
    explicit.card = !!oe['alert:card'];
    explicit.banner = !!oe['alert:banner'];
    globalTheme = cfg.globalThemeActive ? (cfg.activeTheme || null) : null;
  }

  function visibleType() {
    var banner = document.getElementById('banner-alert-root');
    if (banner && (banner.classList.contains('visible') || getComputedStyle(banner).display !== 'none')) {
      return 'banner';
    }
    var card = document.getElementById('alert-card');
    if (card && card.classList.contains('visible')) return 'card';
    return null;
  }

  function setTheme(type, theme, isExplicit) {
    themes[type] = theme || null;
    explicit[type] = !!isExplicit;
  }

  function setGlobalTheme(theme) {
    globalTheme = theme || null;
  }

  function applyThemeFor(type) {
    var theme = explicit[type] ? themes[type] : globalTheme;
    if (theme) document.body.setAttribute('data-theme', theme);
    else document.body.removeAttribute('data-theme');
  }

  function applyAll(type) {
    applyThemeFor(type);
    applyAssigned(type);
  }

  return {
    set: set, apply: apply, applyAssigned: applyAssigned,
    configure: configure, setTheme: setTheme, setGlobalTheme: setGlobalTheme, applyThemeFor: applyThemeFor,
    applyAll: applyAll, visibleType: visibleType,
    isExplicit: function (type) { return !!explicit[type]; },
    assigned: assigned, themes: themes
  };
})();
