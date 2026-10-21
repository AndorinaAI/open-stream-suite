
// Exponer en window para retrocompatibilidad total
window.cachedWidgetsConfig = cachedWidgetsConfig;
window.currentMiniAppWidget = currentMiniAppWidget;
window.activeMiniAppTab = activeMiniAppTab;
window.loadWidgetsConfig = loadWidgetsConfig;
window.renderWidgetsGrid = renderWidgetsGrid;
window.openWidgetMiniApp = openWidgetMiniApp;
window.closeWidgetMiniApp = closeWidgetMiniApp;
window.switchMiniAppTab = switchMiniAppTab;
window.renderMiniAppControls = renderMiniAppControls;
window.saveMiniAppControls = saveMiniAppControls;
window.renderMiniAppCodeEditor = renderMiniAppCodeEditor;
window.saveMiniAppCodeEditor = saveMiniAppCodeEditor;
window.closeMiniAppModal = closeMiniAppModal;
window.openWidgetDevGuideModal = openWidgetDevGuideModal;
window.openWidgetCssGuideModal = openWidgetCssGuideModal;

let currentPipZoom = 1.0;
function setPipZoom(zoom) {
  currentPipZoom = zoom;
  ['100', '85', 'fit'].forEach(id => {
    const btn = document.getElementById('btn-pip-zoom-' + id);
    if (btn) btn.classList.toggle('active', (zoom === 1.0 && id === '100') || (zoom === 0.85 && id === '85') || (zoom === 'fit' && id === 'fit'));
  });
  const iframe = document.getElementById('miniapp-live-iframe');
  if (iframe) {
    try {
      const url = new URL(iframe.src, window.location.origin);
      url.searchParams.set('zoom', zoom);
      iframe.src = url.toString();
    } catch (e) {}
  }
}
window.setPipZoom = setPipZoom;
