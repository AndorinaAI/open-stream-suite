
async function saveCurrentPromoAsShortcut() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;

  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  const color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';

  let labelVal = '';
  let titleVal = '';
  let subtitleVal = '';
  let priceVal = '';
  let linkVal = '';
  let streamerVal = '';

  if (mode === 'shoutout') {
    streamerVal = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    labelVal = `📢 SO @${streamerVal}`;
    titleVal = document.getElementById('cfg-promo-display-name')?.value.trim() || streamerVal;
    subtitleVal = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    linkVal = `https://twitch.tv/${streamerVal.toLowerCase()}`;
  } else {
    titleVal = document.getElementById('cfg-promo-title')?.value.trim() || 'Producto';
    labelVal = `🛒 ${titleVal}`;
    subtitleVal = document.getElementById('cfg-promo-subtitle')?.value.trim() || '';
    priceVal = document.getElementById('cfg-promo-price')?.value.trim() || '';
    linkVal = document.getElementById('cfg-promo-link')?.value.trim() || '';
  }

  const promptLabel = prompt('Nombre para este botón de acceso rápido:', labelVal);
  if (!promptLabel || !promptLabel.trim()) return;

  const newSc = {
    id: 'sc_promo_' + Date.now(),
    label: promptLabel.trim(),
    type: mode,
    title: titleVal,
    subtitle: subtitleVal,
    streamer: streamerVal,
    price: priceVal,
    link: linkVal,
    showQR: true,
    color,
    pinned: true
  };

  if (!cachedWidgetsConfig.promo.shortcuts) cachedWidgetsConfig.promo.shortcuts = [];
  cachedWidgetsConfig.promo.shortcuts.push(newSc);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();

  alert(`✓ ¡Acción Rápida "${promptLabel.trim()}" creada con éxito! Visible en el panel exterior.`);
}

async function togglePromoSameStyleAsChat(checked) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  cachedWidgetsConfig.promo.sameStyleAsChat = checked;

  const controlsWrapper = document.getElementById('promo-style-controls-wrapper');
  const badge = document.getElementById('badge-promo-chat-synced');

  if (controlsWrapper) {
    controlsWrapper.style.opacity = checked ? '0.45' : '1';
    controlsWrapper.style.pointerEvents = checked ? 'none' : 'auto';
  }
  if (badge) {
    badge.style.display = checked ? 'inline-block' : 'none';
  }

  if (checked) {
    await copyStylesFromChatToPromo(true);
  } else {
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    updatePromoPipPreview();
  }
}

async function copyStylesFromChatToPromo(showAlert = true) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat || !cachedWidgetsConfig.promo) return;
  const chatStyles = cachedWidgetsConfig.chat.styles || {};

  if (!cachedWidgetsConfig.promo.styles) cachedWidgetsConfig.promo.styles = {};
  const ps = cachedWidgetsConfig.promo.styles;

  ps.shape = chatStyles.shape || 'rounded';
  ps.bgType = chatStyles.bgType || 'glass';
  ps.bgColor = chatStyles.bgColor || '#191D21';
  ps.bgGradient = chatStyles.bgGradient || '#0B0D0F';
  ps.borderStyle = chatStyles.borderStyle || 'left_neon';
  ps.borderWidth = chatStyles.borderWidth !== undefined ? chatStyles.borderWidth : 4;
  ps.borderColor = chatStyles.borderColor || '#57D6C4';
  ps.accentColor = ps.borderColor;
  ps.glowIntensity = chatStyles.glowIntensity !== undefined ? chatStyles.glowIntensity : 45;
  ps.fontFamily = chatStyles.fontFamily || 'outfit';
  ps.customCSS = chatStyles.customCSS || '';

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  updatePromoPipPreview();

  if (showAlert) {
    alert(`✓ ¡Estilos de Chat sincronizados con la Promoción!\nSilueta: ${ps.shape} | Fondo: ${ps.bgType} | Color: ${ps.borderColor}`);
  }
}

// ----------------------------------------------------------------------
// GESTIÓN DE SUBPESTAÑAS DE PROMO (LAYOUT SIN SCROLLING)
// ----------------------------------------------------------------------
window.activePromoTab = window.activePromoTab || 'creator';
