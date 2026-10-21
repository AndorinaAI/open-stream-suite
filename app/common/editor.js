// app/common/editor.js — Redirección de compatibilidad hacia app/common/overlay/editor.js
(function() {
  const s = document.createElement('script');
  s.src = '/common/overlay/editor.js?v=50';
  document.head.appendChild(s);
})();
