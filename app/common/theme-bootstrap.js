/**
 * ARRANQUE DE TEMA PARA OVERLAYS — un solo camino.
 *
 * `config.js` es el config de ESCENAS y no publica las claves `widget:*` ni
 * `alert:*`. Cada overlay tiene que pedir su propio arranque a su endpoint:
 *
 *     widgets  -> /api/widgets/config
 *     alertas  -> /api/alerts/config
 *
 * Los dos devuelven el MISMO payload (`build_theme_bootstrap()` en
 * `server/services/overlay_service.py`), así que aquí hay una única forma de
 * aplicarlo.
 *
 * Antes cada overlay lo hacía a su manera y dos de ellos estaban mal: widgets
 * exigía `overlayThemeExplicit` (que no llega) y alertas leía `config.js`
 * (que no trae `alert:*`). Resultado: el tema se borraba en cada arranque.
 */
window.ThemeBootstrap = (function () {
  'use strict';

  var inflight = null;   // single-flight: dos llamadas = una petición
  var last = null;       // último payload aplicado
  var lastType = null;   // 'widget' | 'alert'

  /** @param {string} url '/api/widgets/config' | '/api/alerts/config' */
  function load(url) {
    if (inflight) return inflight;
    inflight = fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) { return cfg || null; })
      .catch(function () { return null; })
      .then(function (cfg) { inflight = null; return cfg; });
    return inflight;
  }

  /**
   * Aplica el payload al documento.
   * @param {object} cfg  payload de build_theme_bootstrap()
   * @param {string} type 'widget' | 'alert'
   */
  function apply(cfg, type) {
    if (!cfg) return false;
    last = cfg;
    lastType = type || lastType;

    if (type === 'alert' && window.AlertShapes) {
      var shapes = cfg.overlayShapes || {};
      AlertShapes.configure(cfg);
      AlertShapes.set('card', shapes['alert:card']);
      AlertShapes.set('banner', shapes['alert:banner']);
      AlertShapes.applyAll('card');
      return true;
    }

    if (type === 'widget' && window.OSSTheme && typeof OSSTheme.apply === 'function') {
      var ot = cfg.overlayThemes || {};
      var os = cfg.overlayShapes || {};
      var id = (window.OSSTheme.current && OSSTheme.current()) || null;
      if (!id) return false;
      OSSTheme.apply(ot['widget:' + id] || null, os['widget:' + id] || null);
      return true;
    }

    return false;
  }

  /** Último payload aplicado (para depurar desde la consola). */
  function current() { return last; }

  /**
   * Vuelve a aplicar el último payload. Se usa al recibir un `theme_change`
   * global: el overlay recalcula con los arquetipos frescos que llegaron por su
   * endpoint, en lugar de con `config.js`, que puede estar desactualizado.
   */
  function refresh() { return last ? apply(last, lastType) : false; }

  return { load: load, apply: apply, current: current, refresh: refresh };
})();
