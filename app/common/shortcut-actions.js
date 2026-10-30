/**
 * REGISTRO DE ATAJOS POR WIDGET — sin listas centrales.
 *
 * El panel NO conoce la lista de widgets. Cada widget declara qué campos tiene
 * el formulario de alta de atajos y cómo se traduce a la clave que su overlay
 * lee.
 *
 * Para programar un widget nuevo NO hay que tocar ningún otro fichero:
 *
 *   ShortcutActions.register('miwidget', {
 *     fields: [
 *       { name: 'action', label: 'Acción', type: 'select', options: [...] },
 *       { name: 'label',  label: 'Nombre', type: 'text' }
 *     ],
 *     build: function (v) {
 *       return { id: 'x_' + Date.now(), label: v.label, action: v.action, pinned: true };
 *     }
 *   });
 *
 * `build` recibe los valores del formulario y devuelve el objeto atajo tal y
 * como se guarda en `config.json`. Los campos comunes (label + color) se
 * reutilizan con `ShortcutActions.commonFields()`.
 */
window.ShortcutActions = (function () {
  'use strict';

  var registry = {};

  /** Campos comunes a todos los atajos: nombre visible y color del botón. */
  function commonFields() {
    return [
      { name: 'label', label: 'Nombre del botón', type: 'text', value: '',
        placeholder: '▶️ Iniciar 60s', help: 'Lo que se ve en la barra de atajos.' },
      { name: 'color', label: 'Color del botón', type: 'color', value: '#57D6C4' }
    ];
  }

  /** Declara la especificación de un widget. Idempotente (gana la última). */
  function register(widgetId, spec) {
    if (!widgetId || !spec || !Array.isArray(spec.fields) || typeof spec.build !== 'function') {
      return false;
    }
    registry[widgetId] = spec;
    return true;
  }

  /** `promo` y `shoutout` comparten codigo (symlink), asi que comparten spec. */
  function get(widgetId) {
    if (registry[widgetId]) return registry[widgetId];
    var alias = widgetId === 'promo' ? 'shoutout' : (widgetId === 'shoutout' ? 'promo' : null);
    return alias ? (registry[alias] || null) : null;
  }

  function has(widgetId) { return !!get(widgetId); }
  function list() { return Object.keys(registry).sort(); }

  return { commonFields: commonFields, register: register, get: get, has: has, list: list };
})();

// ---------------------------------------------------------------------------
// Especificaciones de los widgets que vienen de serie. Un widget de terceros
// NO necesita aparecer en esta lista: basta con llamar a register() desde su
// propio codigo.
// ---------------------------------------------------------------------------
(function () {
  'use strict';
  if (!window.ShortcutActions) return;
  var S = window.ShortcutActions;
  var common = S.commonFields();

  S.register('timer', {
    fields: [
      { name: 'action', label: 'Acción', type: 'select', value: 'set', options: [
        { value: 'set', label: '⏱️ Fijar tiempo y arrancar' },
        { value: 'pause', label: '⏸️ Pausar' },
        { value: 'resume', label: '▶️ Reanudar' },
        { value: 'reset', label: '↺ Reiniciar' }
      ], help: 'Qué hace el temporizador al pulsar el atajo.' },
      { name: 'seconds', label: 'Segundos', type: 'number', value: 60, min: 1,
        help: 'Solo se usa con «Fijar tiempo».' },
      { name: 'title', label: 'Título en pantalla', type: 'text', value: '',
        placeholder: 'Curado Sublimación (60s)' }
    ].concat(common),
    build: function (v) {
      return {
        id: 't_' + Date.now(),
        label: v.label || 'Atajo',
        action: v.action,
        mode: v.action === 'set' ? 'down' : v.action,
        seconds: v.seconds || 60,
        title: v.title || v.label || '',
        color: v.color || '#57D6C4',
        pinned: true
      };
    }
  });

  var creatorSpec = {
    fields: [
      { name: 'action', label: 'Tipo de promo', type: 'select', value: 'product', options: [
        { value: 'product', label: '🛒 Producto / tienda' },
        { value: 'social', label: '💬 Red social o comunidad' },
        { value: 'shoutout', label: '📢 Shoutout a un creador' }
      ] },
      { name: 'title', label: 'Título destacado', type: 'text', value: '' },
      { name: 'subtitle', label: 'Subtítulo', type: 'text', value: '' },
      { name: 'link', label: 'Enlace (genera QR)', type: 'text', value: '', placeholder: 'https://' },
      { name: 'streamer', label: 'Creador (solo shoutout)', type: 'text', value: '',
        help: 'Canal de Twitch sin @.' }
    ].concat(common),
    build: function (v) {
      return {
        id: 'p_' + Date.now(),
        label: v.label || 'Atajo',
        type: v.action,
        title: v.title || v.label || '',
        subtitle: v.subtitle || '',
        link: v.link || '',
        streamer: v.streamer || '',
        showQR: !!v.link,
        color: v.color || '#57D6C4',
        pinned: true
      };
    }
  };
  S.register('promo', creatorSpec);
  S.register('shoutout', creatorSpec);

  S.register('goal', {
    fields: [
      { name: 'action', label: 'Acción', type: 'select', value: 'increment', options: [
        { value: 'increment', label: '➕ Sumar / restar progreso' },
        { value: 'set', label: '🎯 Fijar progreso exacto' },
        { value: 'reset', label: '↺ Reiniciar a cero' }
      ] },
      { name: 'amount', label: 'Cantidad', type: 'number', value: 1,
        help: 'Negativo para restar. Solo con «Sumar».' }
    ].concat(common),
    build: function (v) {
      return {
        id: 'sc_' + Date.now(),
        label: v.label || 'Atajo',
        action: v.action,
        type: v.action === 'increment' ? 'increment' : v.action,
        amount: v.amount == null ? 1 : v.amount,
        color: v.color || '#57D6C4',
        pinned: true
      };
    }
  });

  S.register('ticker', {
    fields: [
      { name: 'action', label: 'Acción', type: 'select', value: 'message', options: [
        { value: 'message', label: '💬 Publicar mensaje' },
        { value: 'flash', label: '🚨 Flash de última hora' },
        { value: 'pause', label: '⏸️ Pausar el ticker' },
        { value: 'resume', label: '▶️ Reanudar el ticker' }
      ] },
      { name: 'message', label: 'Mensaje', type: 'textarea', value: '',
        help: 'Solo para «Publicar» y «Flash».' }
    ].concat(common),
    build: function (v) {
      return {
        id: 'sc_' + Date.now(),
        label: v.label || 'Atajo',
        action: v.action,
        params: { message: v.message || '' },
        color: v.color || '#57D6C4',
        pinned: true
      };
    }
  });
})();
