/**
 * alerts/js/ui-feedback.js — Una sola forma de avisar y de recordar estado.
 *
 * Antes: 64 `alert()`, 22 `confirm()`, 9 toasts distintos y ningun aviso de
 * "cambios sin guardar". Aqui se centraliza:
 *
 *   UI.showToast(msg, kind)          toast no bloqueante (deduplica 1 s)
 *   UI.confirmAction({...})          UN solo <dialog>; nunca dos a la vez
 *   UI.markDirty / clearDirty        estado "sin guardar" por componente
 *   UI.clearDirtyScope('alert')      al guardar el bloque completo de alertas
 *   UI.dirtyKeys()                   para avisar antes de salir
 *   UI.renderStatusChip(status)      chip "Tema: X · Forma: Y"
 *   UI.bindLabel(inputId, text, help)
 *   UI.setPressed(el, pressed)       class="active" + aria-pressed
 */
window.UI = (function () {
  'use strict';

  var tr = function (k, fb) { return (window.i18n && window.i18n.tr && window.i18n.tr(k)) || fb; };

  // ---------------------------------------------------------------- toasts
  var toastHost = null;
  var lastToast = { msg: '', at: 0 };

  function ensureToastHost() {
    if (toastHost && document.body.contains(toastHost)) return toastHost;
    toastHost = document.createElement('div');
    toastHost.id = 'ui-toast-host';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    toastHost.style.cssText =
      'position:fixed;bottom:22px;right:22px;display:flex;flex-direction:column;' +
      'gap:8px;z-index:100000;pointer-events:none;max-width:min(420px,80vw);';
    document.body.appendChild(toastHost);
    return toastHost;
  }

  function showToast(msg, kind, ms) {
    msg = String(msg == null ? '' : msg);
    if (!msg) return;
    var now = Date.now();
    // Deduplicacion: el mismo mensaje en <1 s no se repite (doble clic).
    if (msg === lastToast.msg && now - lastToast.at < 1000) return;
    lastToast = { msg: msg, at: now };

    var colors = {
      success: ['rgba(16,185,129,.16)', '#10B981'],
      error: ['rgba(239,68,68,.16)', '#F87171'],
      info: ['rgba(87,214,196,.14)', '#57D6C4']
    };
    var pair = colors[kind] || colors.info;
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText =
      'pointer-events:auto;padding:11px 16px;border-radius:8px;font-size:12px;' +
      'font-weight:600;color:#F2EEE5;background:' + pair[0] + ';border:1px solid ' + pair[1] + ';' +
      'box-shadow:0 8px 24px rgba(0,0,0,.45);backdrop-filter:blur(6px);';
    ensureToastHost().appendChild(el);
    setTimeout(function () { el.remove(); }, ms || 3200);
  }

  // ------------------------------------------------- confirmacion singleton
  var dlg = null;
  var state = { open: false, busy: false, current: null, calls: 0 };

  function ensureDialog() {
    if (dlg && document.body.contains(dlg)) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'ui-confirm-dialog';
    dlg.style.cssText =
      'border:1px solid rgba(87,214,196,.45);border-radius:10px;background:#141A20;' +
      'color:#F2EEE5;padding:0;max-width:440px;width:92vw;box-shadow:0 24px 60px rgba(0,0,0,.6);';
    dlg.innerHTML =
      '<form method="dialog" style="margin:0">' +
      '<div style="padding:18px 20px 6px">' +
      '<div id="ui-confirm-title" style="font-family:var(--font-tech);font-weight:800;font-size:14px;margin-bottom:8px"></div>' +
      '<div id="ui-confirm-detail" style="font-size:12px;line-height:1.5;color:#A6ADC8;white-space:pre-line"></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;padding:14px 20px 18px">' +
      '<button type="button" id="ui-confirm-cancel" class="btn-stage-preset" style="font-size:12px;padding:7px 14px"></button>' +
      '<button type="button" id="ui-confirm-ok" class="btn-action-primary" style="font-size:12px;padding:7px 14px"></button>' +
      '</div></form>';
    document.body.appendChild(dlg);

    dlg.querySelector('#ui-confirm-cancel').addEventListener('click', function () { settle(false); });
    dlg.querySelector('#ui-confirm-ok').addEventListener('click', function () { settle(true); });
    // Escape / clic fuera = cancelar
    dlg.addEventListener('cancel', function (ev) { ev.preventDefault(); settle(false); });
    return dlg;
  }

  function settle(value) {
    if (!state.open || state.busy) return;   // <-- doble clic: se ignora
    state.busy = true;
    var okBtn = dlg && dlg.querySelector('#ui-confirm-ok');
    if (okBtn) { okBtn.disabled = true; okBtn.style.opacity = '.6'; }
    var current = state.current;
    state.open = false;
    state.current = null;
    try { dlg.close(); } catch (e) { dlg.removeAttribute('open'); }
    if (current && typeof current.resolve === 'function') current.resolve(value);
    setTimeout(function () { state.busy = false; }, 0);
  }

  function confirmAction(opts) {
    opts = opts || {};
    state.calls++;
    if (state.open) return Promise.resolve(false);  // ya hay uno: no se abre otro
    var d = ensureDialog();
    var okBtn = d.querySelector('#ui-confirm-ok');
    var cancelBtn = d.querySelector('#ui-confirm-cancel');
    d.querySelector('#ui-confirm-title').textContent = opts.title || tr('common.confirm', 'Confirmar');
    d.querySelector('#ui-confirm-detail').textContent = opts.detail || '';
    okBtn.textContent = opts.confirmLabel || tr('common.confirm', 'Confirmar');
    okBtn.disabled = false;
    okBtn.style.opacity = '1';
    okBtn.style.background = opts.danger ? '#B91C1C' : '';
    okBtn.style.borderColor = opts.danger ? '#EF4444' : '';
    cancelBtn.textContent = opts.cancelLabel || tr('common.cancel', 'Cancelar');

    return new Promise(function (resolve) {
      state.open = true;
      state.current = { resolve: resolve };
      if (typeof d.showModal === 'function') { try { d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
      else d.setAttribute('open', '');
      setTimeout(function () { okBtn.focus(); }, 0);
    });
  }

  // ------------------------------------------------------- estado "sin guardar"
  // El mapa vive AQUI (fuera del DOM): sobrevive a renderStudio() y a los
  // re-render del drawer, asi no se pierde el aviso al repintar.
  var dirty = {};

  function entry(key, scope) {
    if (!dirty[key]) {
      dirty[key] = { key: key, scope: scope || String(key).split(':')[0], dirty: false, lastSavedAt: null, saving: false, error: null };
    }
    return dirty[key];
  }

  function paintDirty() {
    document.querySelectorAll('[data-dirty-key]').forEach(function (el) {
      var key = el.getAttribute('data-dirty-key');
      var isDirty = !!(dirty[key] && dirty[key].dirty);
      el.classList.toggle('is-dirty', isDirty);
      el.setAttribute('data-dirty', isDirty ? 'true' : 'false');
      if (isDirty) el.setAttribute('title', 'Cambios sin guardar');
      else el.removeAttribute('title');
    });
  }

  function markDirty(key, scope) {
    if (!key) return;
    entry(key, scope).dirty = true;
    paintDirty();
  }

  function clearDirty(key) {
    if (!dirty[key]) return;
    dirty[key].dirty = false;
    dirty[key].lastSavedAt = new Date().toISOString();
    paintDirty();
  }

  /** Al guardar las alertas se envia el bloque completo: se limpian TODAS. */
  function clearDirtyScope(scope) {
    Object.keys(dirty).forEach(function (key) {
      if (dirty[key].scope === scope) {
        dirty[key].dirty = false;
        dirty[key].lastSavedAt = new Date().toISOString();
      }
    });
    paintDirty();
  }

  function isDirty(key) { return !!(dirty[key] && dirty[key].dirty); }

  function dirtyKeys() {
    return Object.keys(dirty).filter(function (k) { return dirty[k].dirty; });
  }

  function resetDirty() { dirty = {}; paintDirty(); }

  // ------------------------------------------------------------- misc utilidades
  function renderStatusChip(status) {
    status = status || {};
    var theme = status.themeName || status.theme || tr('widgets.theme_none', 'sin tema');
    var shape = status.shapeName || status.shape || tr('widgets.shape_none', 'sin forma');
    var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    return '<span class="ui-status-chip" data-theme-chip="' + (status.theme ? 'set' : 'none') + '">' +
      '🎨 ' + esc(theme) + ' · 📐 ' + esc(shape) + '</span>';
  }

  function bindLabel(inputId, labelText, helpText) {
    var input = document.getElementById(inputId);
    if (!input) return null;
    var label = document.querySelector('label[for="' + inputId + '"]');
    if (!label) {
      label = document.createElement('label');
      label.setAttribute('for', inputId);
      input.parentNode.insertBefore(label, input);
    }
    label.textContent = labelText || '';
    if (helpText) {
      var helpId = inputId + '-help';
      var help = document.getElementById(helpId);
      if (!help) {
        help = document.createElement('div');
        help.id = helpId;
        help.className = 'ui-help-text';
        label.parentNode.insertBefore(help, label.nextSibling);
      }
      help.textContent = helpText;
      input.setAttribute('aria-describedby', helpId);
    }
    return label;
  }

  function setPressed(el, pressed) {
    if (!el) return;
    el.classList.toggle('active', !!pressed);
    el.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  }

  return {
    showToast: showToast,
    confirmAction: confirmAction,
    markDirty: markDirty,
    clearDirty: clearDirty,
    clearDirtyScope: clearDirtyScope,
    isDirty: isDirty,
    dirtyKeys: dirtyKeys,
    resetDirty: resetDirty,
    paintDirty: paintDirty,
    renderStatusChip: renderStatusChip,
    bindLabel: bindLabel,
    setPressed: setPressed,
    // solo para tests
    _debug: function () { return { state: state, dirty: dirty }; }
  };
})();
