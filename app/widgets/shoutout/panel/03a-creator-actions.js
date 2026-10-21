// ====================================================================
// PROMO & SHOUTOUT: ACCIONES DE CREADOR Y LANZAMIENTO A OBS
// ====================================================================

function insertPromoToken(token) {
  const input = document.getElementById('cfg-promo-message') || document.getElementById('cfg-promo-title');
  if (!input) return;
  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  const oldVal = input.value;
  input.value = oldVal.substring(0, start) + ' ' + token + ' ' + oldVal.substring(end);
  input.focus();
  input.setSelectionRange(start + token.length + 2, start + token.length + 2);
  if (typeof updatePromoPipPreview === 'function') updatePromoPipPreview();
}
window.insertPromoToken = insertPromoToken;

function setPromoMode(mode) {
  const currentModeInput = document.getElementById('cfg-promo-current-mode');
  if (currentModeInput) currentModeInput.value = mode;

  const btnStreamer = document.getElementById('btn-promo-mode-streamer');
  const btnCustom = document.getElementById('btn-promo-mode-custom');
  const boxStreamer = document.getElementById('box-promo-streamer');
  const boxCustom = document.getElementById('box-promo-custom');

  if (mode === 'shoutout') {
    if (btnStreamer) {
      btnStreamer.classList.add('active');
      btnStreamer.style.borderColor = '#57D6C4';
    }
    if (btnCustom) {
      btnCustom.classList.remove('active');
      btnCustom.style.borderColor = 'var(--color-border-dim)';
    }
    if (boxStreamer) boxStreamer.style.display = 'block';
    if (boxCustom) boxCustom.style.display = 'none';
  } else {
    if (btnStreamer) {
      btnStreamer.classList.remove('active');
      btnStreamer.style.borderColor = 'var(--color-border-dim)';
    }
    if (btnCustom) {
      btnCustom.classList.add('active');
      btnCustom.style.borderColor = '#FF783F';
    }
    if (boxStreamer) boxStreamer.style.display = 'none';
    if (boxCustom) boxCustom.style.display = 'block';
  }

  if (typeof updatePromoPipPreview === 'function') updatePromoPipPreview();
}
window.setPromoMode = setPromoMode;

async function searchTwitchUserForPromo() {
  const input = document.getElementById('cfg-promo-streamer');
  const streamer = (input?.value || '').trim().toLowerCase().replace(/^@/, '');
  if (!streamer) {
    alert('Introduce un nombre de usuario de Twitch para buscar.');
    return;
  }

  const nameInput = document.getElementById('cfg-promo-display-name');
  if (nameInput) {
    nameInput.value = streamer.charAt(0).toUpperCase() + streamer.slice(1);
  }
  if (typeof updatePromoPipPreview === 'function') updatePromoPipPreview();
  alert(`✓ Preparado para @${streamer}. Al emitir la promo se obtendrán su avatar oficial y categoría de Twitch.`);
}
window.searchTwitchUserForPromo = searchTwitchUserForPromo;

async function launchCurrentPromoToOBS() {
  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  const durationSec = parseInt(document.getElementById('cfg-promo-duration')?.value, 10) || 8;
  const soundChime = document.getElementById('cfg-promo-sound')?.checked !== false;
  const color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';
  const sameAsChat = document.getElementById('cfg-promo-same-as-chat')?.checked === true;

  const shape = document.getElementById('cfg-promo-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-promo-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-promo-bgcolor')?.value || '#191D21';
  const bgGrad = document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon';
  const glow = parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45;
  const font = document.getElementById('cfg-promo-font')?.value || 'outfit';
  const anim = document.getElementById('cfg-promo-anim')?.value || 'slide_up';
  const customCss = document.getElementById('cfg-promo-custom-css')?.value || '';

  let payload = {
    type: mode,
    color,
    duration: durationSec * 1000,
    soundChime,
    animation: anim,
    inherit_chat_styles: sameAsChat,
    styles: {
      shape,
      bgType,
      bgColor,
      bgGradient: bgGrad,
      borderStyle,
      borderColor: color,
      glowIntensity: glow,
      fontFamily: font,
      animation: anim,
      customCSS: customCss
    }
  };

  if (mode === 'shoutout') {
    const streamer = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    const displayName = document.getElementById('cfg-promo-display-name')?.value.trim() || streamer;
    const game = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    const avatar = document.getElementById('cfg-promo-avatar')?.value.trim() || '';
    const message = document.getElementById('cfg-promo-message')?.value.trim() || '';
    const playClip = document.getElementById('cfg-promo-play-clip')?.checked === true;
    const clipUrl = document.getElementById('cfg-promo-clip-url')?.value.trim() || '';
    const showQr = document.getElementById('cfg-promo-show-qr')?.checked !== false;

    payload.streamer = streamer;
    payload.display_name = displayName;
    payload.title = displayName;
    payload.game = game;
    payload.subtitle = game;
    payload.avatar = avatar;
    payload.message = message;
    payload.play_clip = playClip;
    payload.clip_url = clipUrl;
    payload.link = `https://twitch.tv/${streamer.toLowerCase().replace(/^@/, '')}`;
    payload.show_qr = showQr;
  } else {
    const title = document.getElementById('cfg-promo-title')?.value.trim() || 'Pegatinas Holográficas Maker';
    const eyebrow = document.getElementById('cfg-promo-eyebrow')?.value.trim() || '🛒 DESTACADO DEL STREAM';
    const subtitle = document.getElementById('cfg-promo-subtitle')?.value.trim() || 'Vinilo troquelado impermeable';
    const price = document.getElementById('cfg-promo-price')?.value.trim() || '';
    const link = document.getElementById('cfg-promo-link')?.value.trim() || 'https://twitch.tv/andorina';
    const imageUrl = document.getElementById('cfg-promo-image-url')?.value.trim() || '';
    const showQr = document.getElementById('cfg-promo-custom-show-qr')?.checked !== false;

    payload.title = title;
    payload.display_name = title;
    payload.eyebrow = eyebrow;
    payload.subtitle = subtitle;
    payload.price = price;
    payload.link = link;
    payload.image_url = imageUrl;
    payload.show_qr = showQr;
  }

  payload.qr_data = window.promoActiveQRPayload || payload.link;
  payload.qr_type = window.promoActiveQRType || 'url';
  payload.qr_logo = window.promoActiveQRLogo || 'none';
  if (payload.qr_type === 'vcard') payload.qr_label = '📇 GUARDAR CONTACTO';
  else if (payload.qr_type === 'wifi') payload.qr_label = '📶 CONECTAR WI-FI';
  else if (payload.qr_type === 'email') payload.qr_label = '✉️ ENVIAR CORREO';
  else payload.qr_label = '📱 ESCANEAR';

  if (!cachedWidgetsConfig.promo) cachedWidgetsConfig.promo = {};
  if (!cachedWidgetsConfig.promo.history) cachedWidgetsConfig.promo.history = [];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  const histEntry = Object.assign({ timestamp: timeStr }, payload);
  cachedWidgetsConfig.promo.history.unshift(histEntry);
  if (cachedWidgetsConfig.promo.history.length > 25) cachedWidgetsConfig.promo.history.pop();
  window.cachedPromoHistory = cachedWidgetsConfig.promo.history;

  await API.triggerWidgetAction('promo', 'promote', payload);
  if (typeof renderMiniAppControls === 'function') renderMiniAppControls();

  alert(`🚀 ¡Promoción "${payload.title || payload.streamer}" lanzada a OBS Studio durante ${durationSec}s!`);
}
window.launchCurrentPromoToOBS = launchCurrentPromoToOBS;
