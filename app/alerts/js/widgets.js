// ====================================================================
// GESTOR DE WIDGETS COMO MINI-APPS Y ACCIONES RÁPIDAS (SUITE ORQUESTADOR)
// Carga modularizada: alerts/js/widgets/*.js
// ====================================================================

// Inicialización de widgets en el arranque
window.addEventListener('DOMContentLoaded', () => {
  if (typeof loadWidgetsConfig === 'function') {
    loadWidgetsConfig();
  }
});
