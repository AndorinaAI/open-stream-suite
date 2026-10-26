/**
 * Open Stream Suite — Motor de formas para widgets y alertas.
 * Aplica la forma sobre el elemento raíz con prioridad inline (gana a CSS con !important)
 * y guarda el estilo previo para poder restaurarlo al resetear.
 */
window.OSSShape = (function () {
  var SHAPES = {
    rounded:  { 'border-radius': '8px' },
    box:      { 'border-radius': '2px' },
    bubble:   { 'border-radius': '20px 20px 20px 4px' },
    scifi:    { 'border-radius': '0', 'clip-path': 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' },
    pill:     { 'border-radius': '9999px' },
    arcade:   { 'border-radius': '0' },
    tag:      { 'border-radius': '0', 'clip-path': 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' },
    slant:    { 'border-radius': '0', 'clip-path': 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)' },
    soft_card:{ 'border-radius': '18px' }
  };

  function clear(el) {
    if (!el) return;
    try {
      var saved = JSON.parse(el.dataset.ossShapeSaved || '{}');
      Object.keys(saved).forEach(function (prop) {
        var info = saved[prop];
        el.style.setProperty(prop, info.value || '', info.priority || '');
      });
    } catch (e) {}
    delete el.dataset.ossShapeSaved;
    el.removeAttribute('data-oss-shape');
  }

  function apply(el, shape) {
    if (!el) return false;
    clear(el);
    if (!shape || !SHAPES[shape]) return false;
    var saved = {};
    var rules = SHAPES[shape];
    Object.keys(rules).forEach(function (prop) {
      saved[prop] = { value: el.style.getPropertyValue(prop), priority: el.style.getPropertyPriority(prop) };
      el.style.setProperty(prop, rules[prop], 'important');
    });
    el.dataset.ossShapeSaved = JSON.stringify(saved);
    el.setAttribute('data-oss-shape', shape);
    return true;
  }

  return { apply: apply, clear: clear, shapes: Object.keys(SHAPES) };
})();
