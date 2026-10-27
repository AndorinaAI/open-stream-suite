/**
 * Formas de alerta: 9 genéricas (OSSShape inline) + 20 físicas de pack.
 * Las físicas reutilizan el CSS de escenas: body[data-theme-shape] + [data-oss-panel].
 */
window.AlertShapes = (function () {
  var assigned = { card: null, banner: null };
  var themes = { card: null, banner: null };
  var explicit = { card: false, banner: false };
  var globalTheme = null;
  var locked = false;

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
    applyUrlOverrides();
  }

  /**
   * `?theme=` / `?shape=` / `?lock=1` en la URL de OBS cuentan como asignación
   * explícita. Antes el arranque de config los borraba (`applyAll` con
   * `themes`/`assigned` vacíos), así que una Browser Source con `?theme=maker`
   * ignoraba el tema aunque 04-ws-client.js sí lo leyera. Escenas y widgets ya
   * se comportaban así; las alertas no.
   */
  function applyUrlOverrides() {
    try {
      var p = new URLSearchParams(window.location.search);
      var theme = p.get('theme');
      var shape = p.get('shape');
      if (theme) {
        themes.card = theme;
        themes.banner = theme;
        explicit.card = true;
        explicit.banner = true;
      }
      if (shape) {
        assigned.card = shape;
        assigned.banner = shape;
      }
      if (p.get('lock') === '1' || p.get('lockTheme') === '1') locked = true;
    } catch (e) {}
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
    applySkin();
  }

  /** Skin de componentes: arquetipo del tema activo -> `data-theme-archetype`. */
  function applySkin() {
    if (!window.OSSSkin) return null;
    var active = document.body.getAttribute('data-theme');
    if (active) return window.OSSSkin.apply(active);
    window.OSSSkin.clear();
    return null;
  }

  function applyAll(type) {
    applyThemeFor(type);
    applyAssigned(type);
  }

  return {
    set: set, apply: apply, applyAssigned: applyAssigned,
    configure: configure, setTheme: setTheme, setGlobalTheme: setGlobalTheme, applyThemeFor: applyThemeFor,
    applyAll: applyAll, visibleType: visibleType, applySkin: applySkin,
    isExplicit: function (type) { return !!explicit[type]; },
    isLocked: function () { return !!locked; },
    assigned: assigned, themes: themes
  };
})();
