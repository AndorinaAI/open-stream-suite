// ====================================================================
// PROMO & SHOUTOUT: RENDERIZADO DE PREVIEW EN VIVO Y PIP IFRAME
// ====================================================================

function updatePromoPipPreview() {
  const container = document.getElementById('promo-live-preview-container');
  if (!container) return;

  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  const color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';
  const shape = document.getElementById('cfg-promo-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-promo-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-promo-bgcolor')?.value || '#191D21';
  const bgGrad = document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon';
  const glow = parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45;
  const font = document.getElementById('cfg-promo-font')?.value || 'outfit';

  const fontFamilies = {
    outfit: "'Outfit', sans-serif",
    inter: "'Inter', sans-serif",
    rajdhani: "'Rajdhani', sans-serif",
    orbitron: "'Orbitron', sans-serif",
    press_start: "'Press Start 2P', monospace",
    jetbrains_mono: "'JetBrains Mono', monospace"
  };

  let title = '';
  let subtitle = '';
  let eyebrow = '';
  let price = '';
  let link = '';
  let showQr = true;
  let avatarUrl = '';
  let imageUrl = '';
  let message = '';
  let playClip = false;

  if (mode === 'shoutout') {
    const streamer = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    title = document.getElementById('cfg-promo-display-name')?.value.trim() || streamer;
    subtitle = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    eyebrow = '📢 CANAL RECOMENDADO';
    link = `twitch.tv/${streamer.toLowerCase().replace(/^@/, '')}`;
    showQr = document.getElementById('cfg-promo-show-qr')?.checked !== false;
    avatarUrl = document.getElementById('cfg-promo-avatar')?.value.trim() || 'https://static-cdn.jtvnw.net/jtv_user_pictures/e33e6764-4631-48b0-9f1d-4cc6e5afc6fd-profile_image-300x300.png';
    message = document.getElementById('cfg-promo-message')?.value.trim() || '';
    playClip = document.getElementById('cfg-promo-play-clip')?.checked === true;
  } else {
    title = document.getElementById('cfg-promo-title')?.value.trim() || 'Pegatinas Holográficas Maker';
    eyebrow = document.getElementById('cfg-promo-eyebrow')?.value.trim() || '🛒 DESTACADO DEL STREAM';
    subtitle = document.getElementById('cfg-promo-subtitle')?.value.trim() || 'Vinilo troquelado impermeable';
    price = document.getElementById('cfg-promo-price')?.value.trim() || '';
    link = document.getElementById('cfg-promo-link')?.value.trim() || 'https://twitch.tv/andorina';
    showQr = document.getElementById('cfg-promo-custom-show-qr')?.checked !== false;
    imageUrl = document.getElementById('cfg-promo-image-url')?.value.trim() || '';
  }

  // Style properties
  let bgCss = 'background: rgba(25, 29, 33, 0.94);';
  if (bgType === 'solid') bgCss = `background: ${bgColor};`;
  else if (bgType === 'gradient') bgCss = `background: linear-gradient(135deg, ${bgColor}, ${bgGrad});`;
  else if (bgType === 'transparent') bgCss = 'background: transparent;';

  let borderCss = `border-left: 4px solid ${color}; border: 1px solid rgba(255,255,255,0.1);`;
  if (borderStyle === 'full_neon') borderCss = `border: 2px solid ${color}; box-shadow: 0 0 ${glow}px ${color}66;`;
  else if (borderStyle === 'left_neon') borderCss = `border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid ${color}; box-shadow: -4px 0 ${glow}px ${color}55;`;
  else if (borderStyle === 'subtle') borderCss = `border: 1px solid rgba(255,255,255,0.15);`;
  else if (borderStyle === 'none') borderCss = 'border: none;';

  let shapeCss = 'border-radius: 12px;';
  if (shape === 'scifi') shapeCss = 'clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px); border-radius: 0;';
  else if (shape === 'arcade') shapeCss = 'border: 3px solid #FFFFFF !important; box-shadow: 4px 4px 0px rgba(0,0,0,0.85); border-radius: 0;';
  else if (shape === 'pill') shapeCss = 'border-radius: 9999px;';
  else if (shape === 'slant') shapeCss = 'transform: skewX(-4deg);';
  else if (shape === 'soft_card') shapeCss = 'border-radius: 20px;';

  const activeQrPayload = window.promoActiveQRPayload || (mode === 'shoutout' ? `https://twitch.tv/${(document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina').toLowerCase().replace(/^@/, '')}` : (link || 'https://twitch.tv/andorina'));
  const activeQrType = window.promoActiveQRType || 'url';
  const activeQrLogo = window.promoActiveQRLogo || 'none';
  let qrLabelText = '📱 ESCANEAR';
  if (activeQrType === 'vcard') qrLabelText = '📇 CONTACTO';
  else if (activeQrType === 'wifi') qrLabelText = '📶 WI-FI';
  else if (activeQrType === 'email') qrLabelText = '✉️ CORREO';

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&ecc=H&margin=0&data=${encodeURIComponent(activeQrPayload || 'https://twitch.tv/andorina')}`;

  const qrCenterBadgeHtml = (activeQrLogo && activeQrLogo !== 'none' && window.QR_LOGO_SVGS && window.QR_LOGO_SVGS[activeQrLogo]) ? `
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 18px; height: 18px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 3px rgba(0,0,0,0.5); overflow: hidden; z-index: 2;">
      <img src="${window.QR_LOGO_SVGS[activeQrLogo]}" alt="Logo" style="width: 14px; height: 14px; object-fit: contain; display: block;">
    </div>
  ` : '';

  const qrStatusLbl = document.getElementById('lbl-promo-current-qr-status');
  if (qrStatusLbl) {
    const typeNames = { url: 'Enlace Web', vcard: 'Contacto vCard', wifi: 'Red Wi-Fi', email: 'Email', text: 'Texto/Cupón' };
    qrStatusLbl.innerHTML = `📱 QR configurado: <strong>${typeNames[activeQrType] || 'Enlace Web'}</strong> | Logo: <strong>${activeQrLogo.toUpperCase()}</strong>`;
  }

  container.innerHTML = `
    <div style="width: 100%; max-width: 600px; ${bgCss} ${borderCss} ${shapeCss} font-family: ${fontFamilies[font] || fontFamilies['outfit']}; padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; backdrop-filter: blur(12px);">
      <div style="display: flex; align-items: center; gap: 14px; width: 100%;">
        <!-- Thumbnail -->
        ${imageUrl ? `
          <div style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 2px solid ${color}; flex-shrink: 0; background: #000;">
            <img src="${imageUrl}" alt="Media" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='https://static-cdn.jtvnw.net/jtv_user_pictures/e33e6764-4631-48b0-9f1d-4cc6e5afc6fd-profile_image-300x300.png'">
          </div>
        ` : `
          <div style="position: relative; width: 64px; height: 64px; flex-shrink: 0;">
            <div style="position: absolute; inset: -3px; border: 1.5px dashed ${color}; border-radius: 50%;"></div>
            <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid ${color}; box-shadow: 0 0 12px ${color}66; background: #191D21; display: block;">
          </div>
        `}

        <!-- Info -->
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; color: ${color}; letter-spacing: 1px; text-transform: uppercase;">
            <span>${eyebrow}</span>
            ${price ? `<span style="background: rgba(245,158,11,0.2); border: 1px solid #F59E0B; color: #FBBF24; padding: 1px 6px; border-radius: 10px; font-size: 9px;">${price}</span>` : ''}
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #fff; line-height: 1.2; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${title}
          </div>
          <div style="font-size: 11px; color: #FF783F; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${subtitle}
          </div>
          ${message ? `<div style="font-size: 10px; color: #CBD5E1; font-style: italic; background: rgba(255,255,255,0.06); border-left: 2px solid ${color}; padding: 2px 6px; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">"${message}"</div>` : ''}
          <div style="font-size: 10px; color: #94A3B8; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${link}
          </div>
        </div>

        <!-- QR Box -->
        ${showQr ? `
          <div style="width: 64px; height: 64px; background: #fff; border-radius: 6px; padding: 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; flex-shrink: 0; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
            <img src="${qrSrc}" alt="QR" style="width: 100%; height: 100%; object-fit: contain; display: block;">
            ${qrCenterBadgeHtml}
            <span style="position: absolute; bottom: -14px; font-size: 8px; font-weight: 800; color: ${color}; letter-spacing: 0.5px; white-space: nowrap;">${qrLabelText}</span>
          </div>
        ` : ''}
      </div>

      ${playClip ? `
        <div style="border-top: 1px dashed ${color}66; padding-top: 6px; font-size: 10px; font-weight: 800; color: ${color}; display: flex; align-items: center; justify-content: space-between;">
          <span>🎬 REPRODUCIRÁ CLIP DESTACADO EN DIRECTO</span>
          <span style="font-size: 9px; opacity: 0.8;">TWITCH EMBED</span>
        </div>
      ` : ''}
    </div>
  `;

  // También actualizar iframe live PiP si está abierto
  const iframe = document.getElementById('miniapp-live-iframe');
  if (iframe && iframe.contentWindow && iframe.contentWindow.showShoutout) {
    iframe.contentWindow.showShoutout({
      promo_type: mode,
      title,
      display_name: title,
      streamer: title,
      subtitle,
      game: subtitle,
      message,
      eyebrow,
      price,
      link,
      qr_data: activeQrPayload,
      qr_type: activeQrType,
      qr_logo: activeQrLogo,
      qr_label: qrLabelText,
      show_qr: showQr,
      avatar: avatarUrl,
      image_url: imageUrl,
      play_clip: playClip,
      color,
      styles: {
        shape,
        bgType,
        bgColor,
        bgGradient: bgGrad,
        borderStyle,
        borderColor: color,
        glowIntensity: glow,
        fontFamily: font
      },
      duration: 10000,
      soundChime: false
    });
  }
}
window.updatePromoPipPreview = updatePromoPipPreview;
