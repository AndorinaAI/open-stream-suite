/**
 * Sincroniza el tema (y la forma) de la escena con el chat embebido.
 * El iframe aplica el tema vía postMessage; no recarga ni pierde mensajes.
 */
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('iframe.scene-chat-embed'));
  if (!frames.length) return;

  function payload() {
    return {
      type: 'oss:theme',
      theme: document.body.getAttribute('data-theme') || null,
      shape: null
    };
  }

  function send(frame) {
    try {
      if (frame.contentWindow) frame.contentWindow.postMessage(payload(), '*');
    } catch (e) {}
  }

  frames.forEach(function (frame) {
    frame.addEventListener('load', function () { send(frame); });
  });

  new MutationObserver(function () {
    frames.forEach(send);
  }).observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'data-theme-shape'] });

  setTimeout(function () { frames.forEach(send); }, 400);
})();
