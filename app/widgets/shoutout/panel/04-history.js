
async function repeatPromoFromHistory(idx) {
  const history = cachedWidgetsConfig?.promo?.history || window.cachedPromoHistory || [];
  const item = history[idx];
  if (!item) return;

  await API.triggerWidgetAction('promo', 'promote', Object.assign({}, item, {
    duration: (parseInt(document.getElementById('cfg-promo-duration')?.value, 10) || 8) * 1000
  }));

  alert(`🔄 ¡Promoción "${item.title || item.display_name || item.streamer}" reemitida a OBS Studio!`);
}

function loadPromoIntoCreator(idx) {
  const history = cachedWidgetsConfig?.promo?.history || window.cachedPromoHistory || [];
  const item = history[idx];
  if (!item) return;

  const mode = (item.type === 'product' || item.promo_type === 'product' || item.type === 'custom' || item.promo_type === 'custom') ? 'custom' : 'shoutout';
  setPromoMode(mode);

  if (mode === 'shoutout') {
    const sInput = document.getElementById('cfg-promo-streamer');
    const dInput = document.getElementById('cfg-promo-display-name');
    const gInput = document.getElementById('cfg-promo-game');
    const aInput = document.getElementById('cfg-promo-avatar');
    const mInput = document.getElementById('cfg-promo-message');
    const qrInput = document.getElementById('cfg-promo-show-qr');

    if (sInput) sInput.value = item.streamer || item.title || '';
    if (dInput) dInput.value = item.display_name || item.title || '';
    if (gInput) gInput.value = item.game || item.subtitle || '';
    if (aInput) aInput.value = item.avatar || '';
    if (mInput) mInput.value = item.message || '';
    if (qrInput) qrInput.checked = item.show_qr !== false;
  } else {
    const tInput = document.getElementById('cfg-promo-title');
    const eInput = document.getElementById('cfg-promo-eyebrow');
    const sInput = document.getElementById('cfg-promo-subtitle');
    const pInput = document.getElementById('cfg-promo-price');
    const lInput = document.getElementById('cfg-promo-link');
    const iInput = document.getElementById('cfg-promo-image-url');
    const qrInput = document.getElementById('cfg-promo-custom-show-qr');

    if (tInput) tInput.value = item.title || item.display_name || '';
    if (eInput) eInput.value = item.eyebrow || '🛒 DESTACADO DEL STREAM';
    if (sInput) sInput.value = item.subtitle || '';
    if (pInput) pInput.value = item.price || '';
    if (lInput) lInput.value = item.link || '';
    if (iInput) iInput.value = item.image_url || '';
    if (qrInput) qrInput.checked = item.show_qr !== false;
  }

  if (item.color) {
    const cInput = document.getElementById('cfg-promo-color');
    if (cInput) cInput.value = item.color;
  }

  // Restaurar datos de QR avanzado si existen
  window.promoActiveQRPayload = item.qr_data || item.link || '';
  window.promoActiveQRType = item.qr_type || 'url';
  window.promoActiveQRLogo = item.qr_logo || 'none';

  switchPromoSubTab('creator');
  updatePromoPipPreview();
  const drawer = document.getElementById('widget-miniapp-drawer');
  if (drawer) drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function clearPromoHistory() {
  if (!confirm('¿Deseas vaciar el historial de promociones de esta sesión?')) return;
  if (cachedWidgetsConfig?.promo) {
    cachedWidgetsConfig.promo.history = [];
  }
  window.cachedPromoHistory = [];
  try {
    await API.triggerWidgetAction('promo', 'clear_history', {});
  } catch (e) {}
  renderMiniAppControls();
}
