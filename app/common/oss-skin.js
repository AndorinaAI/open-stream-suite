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
    return arch;
  }

  function clear() {
    var body = document.body;
    if (!body) return;
    body.removeAttribute('data-theme');
    body.removeAttribute('data-theme-archetype');
  }

  /** ¿El arquetipo declarado por el tema es alguno de los conocidos? */
  function isKnown(arch) {
    return arch === 'cozy' || arch === 'gamer' || arch === 'maker' || arch === 'openstream';
  }

  return {
    apply: apply,
    clear: clear,
    archetype: archetype,
    isKnown: isKnown,
    get current() { return document.body ? document.body.getAttribute('data-theme-archetype') : null; },
    get map() { return cfg().themeArchetypes || {}; }
  };
})();
