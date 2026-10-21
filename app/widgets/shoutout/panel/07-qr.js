
function switchPromoSubTab(tab) {
  window.activePromoTab = tab;
  const tabs = ['creator', 'qr', 'history', 'styles'];
  tabs.forEach(t => {
    const pane = document.getElementById(`promo-tab-${t}`);
    const btn = document.getElementById(`promo-subtab-btn-${t}`);
    if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      if (t === tab) {
        btn.classList.add('active');
        btn.style.borderColor = '#57D6C4';
        btn.style.color = '#57D6C4';
        btn.style.background = 'rgba(87,214,196,0.15)';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = 'var(--color-border-dim)';
        btn.style.color = '#fff';
        btn.style.background = 'transparent';
      }
    }
  });

  if (tab === 'creator') {
    updatePromoPipPreview();
  } else if (tab === 'qr') {
    updateQRGeneratorPreview();
  }
}

// ----------------------------------------------------------------------
// GENERADOR DE CÓDIGOS QR PRO (MULTI-FORMATO Y LOGOTIPOS)
// ----------------------------------------------------------------------
window.qrSelectedType = window.qrSelectedType || 'url';
window.qrSelectedLogo = window.qrSelectedLogo || 'none';
window.qrCustomLogoData = window.qrCustomLogoData || '';

window.QR_LOGO_SVGS = {
  twitch: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%239146FF"/><path fill="%23FFFFFF" d="M6.5 4L5 7.5v11h3.5v2h2.5l2-2h2.5L19 15V4H6.5zm11 10l-2 2h-3l-2 2v-2H8.5V5.5h9V14zM11 8h1.5v4H11V8zm4 0h1.5v4H15V8z"/></svg>',
  discord: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%235865F2"/><path fill="%23FFFFFF" d="M17.5 7.2a12.8 12.8 0 0 0-3.2-1 .1.1 0 0 0-.1 0c-.1.3-.3.6-.4.9a11.8 11.8 0 0 0-3.6 0c-.1-.3-.3-.6-.4-.9 0 0-.1 0-.1 0A12.8 12.8 0 0 0 6.5 7.2a.1.1 0 0 0 0 0C4.4 10.3 3.8 13.3 4.1 16.3a.1.1 0 0 0 0 0 13 13 0 0 0 3.9 2 .1.1 0 0 0 .1 0c.3-.4.6-.9.8-1.3 0 0 0-.1-.1-.1a8.5 8.5 0 0 1-1.2-.6.1.1 0 0 1 0-.1c.1-.1.2-.2.3-.2a.1.1 0 0 1 .1 0 9.2 9.2 0 0 0 7.9 0 .1.1 0 0 1 .1 0c.1.1.2.2.3.2 0 0 0 .1 0 .1a8.5 8.5 0 0 1-1.2.6.1.1 0 0 0-.1.1c.2.4.5.9.8 1.3 0 0 .1 0 .1 0a13 13 0 0 0 4-2 .1.1 0 0 0 0 0c.4-3.5-.6-6.5-2.5-9.1 0 0 0 0 0 0zm-8.1 7.2c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6c.8 0 1.4.7 1.4 1.6 0 .9-.6 1.6-1.4 1.6zm5.2 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6c.8 0 1.4.7 1.4 1.6 0 .9-.6 1.6-1.4 1.6z"/></svg>',
  instagram: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><defs><linearGradient id="g" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23f09433"/><stop offset="25%" stop-color="%23e6683c"/><stop offset="50%" stop-color="%23dc2743"/><stop offset="75%" stop-color="%23cc2366"/><stop offset="100%" stop-color="%23bc1888"/></linearGradient></defs><rect width="24" height="24" rx="12" fill="url(%23g)"/><path fill="%23FFFFFF" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>',
  youtube: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%23FF0000"/><path fill="%23FFFFFF" d="M10 8.5l5.5 3.5-5.5 3.5V8.5z"/></svg>',
  maker: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%23191D21"/><path fill="%2357D6C4" d="M13 2.5L4 14h8l-1.5 7.5 9-11.5h-8l1.5-7.5z"/></svg>',
  shop: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%23F59E0B"/><path fill="%23FFFFFF" d="M8 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM4 4h2l2.5 8.5h8.5L19 7H7V5h13a1 1 0 0 1 .9 1.4l-2.5 6.5A1.5 1.5 0 0 1 17 14H8a1.5 1.5 0 0 1-1.4-1L4.3 5H3V4h1z"/></svg>'
};

function setQRDataType(type) {
  window.qrSelectedType = type;
  const types = ['url', 'vcard', 'wifi', 'email', 'text'];
  types.forEach(t => {
    const box = document.getElementById(`box-qr-type-${t}`);
    const btn = document.getElementById(`btn-qr-type-${t}`);
    if (box) box.style.display = (t === type) ? 'block' : 'none';
    if (btn) {
      if (t === type) {
        btn.classList.add('active');
        btn.style.borderColor = '#57D6C4';
        btn.style.color = '#57D6C4';
        btn.style.background = 'rgba(87,214,196,0.15)';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = 'var(--color-border-dim)';
        btn.style.color = '#fff';
        btn.style.background = 'transparent';
      }
    }
  });
  updateQRGeneratorPreview();
}

function setQRLogo(logo) {
  window.qrSelectedLogo = logo;
  const logos = ['none', 'twitch', 'discord', 'instagram', 'youtube', 'maker', 'shop', 'custom'];
  logos.forEach(l => {
    const btn = document.getElementById(`btn-qr-logo-${l}`);
    if (btn) {
      if (l === logo) {
        btn.classList.add('active');
        btn.style.borderColor = '#57D6C4';
        btn.style.color = '#57D6C4';
        btn.style.background = 'rgba(87,214,196,0.15)';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = 'var(--color-border-dim)';
        btn.style.color = '#fff';
        btn.style.background = 'transparent';
      }
    }
  });
  const customBox = document.getElementById('box-qr-custom-logo');
  if (customBox) customBox.style.display = (logo === 'custom') ? 'block' : 'none';
  updateQRGeneratorPreview();
}

function handleQRLogoUpload(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    window.qrCustomLogoData = e.target.result;
    const urlInput = document.getElementById('cfg-qr-custom-logo-url');
    if (urlInput) urlInput.value = 'Imagen local subida';
    updateQRGeneratorPreview();
  };
  reader.readAsDataURL(file);
}

function buildQRDataPayload() {
  const type = window.qrSelectedType || 'url';
  if (type === 'vcard') {
    const fn = document.getElementById('cfg-qr-vcard-name')?.value.trim() || 'Andorina Maker';
    const phone = document.getElementById('cfg-qr-vcard-phone')?.value.trim() || '';
    const email = document.getElementById('cfg-qr-vcard-email')?.value.trim() || '';
    const org = document.getElementById('cfg-qr-vcard-org')?.value.trim() || 'Mi Canal';
    const web = document.getElementById('cfg-qr-vcard-url')?.value.trim() || 'https://twitch.tv/andorina';
    const note = document.getElementById('cfg-qr-vcard-note')?.value.trim() || 'Contacto desde Twitch';
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${fn}\nORG:${org}\nTEL;TYPE=CELL:${phone}\nEMAIL:${email}\nURL:${web}\nNOTE:${note}\nEND:VCARD`;
  } else if (type === 'wifi') {
    const ssid = document.getElementById('cfg-qr-wifi-ssid')?.value.trim() || 'Taller_Maker';
    const pass = document.getElementById('cfg-qr-wifi-pass')?.value.trim() || '';
    const auth = document.getElementById('cfg-qr-wifi-auth')?.value || 'WPA';
    return `WIFI:T:${auth};S:${ssid};P:${pass};;`;
  } else if (type === 'email') {
    const to = document.getElementById('cfg-qr-email-to')?.value.trim() || 'contacto@taller.com';
    const sub = document.getElementById('cfg-qr-email-sub')?.value.trim() || '';
    const body = document.getElementById('cfg-qr-email-body')?.value.trim() || '';
    return `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
  } else if (type === 'text') {
    return document.getElementById('cfg-qr-text-val')?.value.trim() || 'MAKER-DESCUENTO-2026';
  } else {
    return document.getElementById('cfg-qr-input-url')?.value.trim() || 'https://twitch.tv/andorina';
  }
}

function setQRPresetUrl(type) {
  const input = document.getElementById('cfg-qr-input-url');
  if (!input) return;

  const streamer = cachedWidgetsConfig?.promo?.shortcuts?.find(s => s.streamer)?.streamer || 'andorina';
  const urls = {
    twitch: `https://twitch.tv/${streamer}`,
    discord: 'https://discord.gg/andorina',
    shop: `https://twitch.tv/${streamer}`,
    youtube: `https://youtube.com/@${streamer}`,
    instagram: `https://instagram.com/${streamer}`
  };

  input.value = urls[type] || urls.twitch;
  updateQRGeneratorPreview();
}

function updateQRGeneratorPreview() {
  const canvas = document.getElementById('qr-gen-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const payload = buildQRDataPayload();
  const fgColor = (document.getElementById('cfg-qr-fg-color')?.value || '#000000').replace('#', '');
  const bgColor = (document.getElementById('cfg-qr-bg-color')?.value || '#FFFFFF').replace('#', '');
  const size = parseInt(document.getElementById('cfg-qr-size')?.value, 10) || 500;
  const logo = window.qrSelectedLogo || 'none';

  // Resumen del tipo generado
  const summaryLbl = document.getElementById('lbl-qr-result-summary');
  if (summaryLbl) {
    const typeNames = {
      url: '🌐 Enlace Web',
      vcard: '📇 Tarjeta de Contacto (Guarda en agenda)',
      wifi: '📶 Conexión Wi-Fi Automática',
      email: '✉️ Redacción de Email',
      text: '💬 Texto / Cupón Promocional'
    };
    summaryLbl.textContent = `${typeNames[window.qrSelectedType || 'url']} (${payload.length} caracteres)`;
  }

  // Cargar QR con corrección de error ecc=H (30% de tolerancia para superponer el logo central)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&color=${fgColor}&bgcolor=${bgColor}&margin=1&data=${encodeURIComponent(payload)}`;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);

    // Dibujar logotipo central si está seleccionado
    let logoSrc = null;
    if (logo === 'custom') {
      logoSrc = window.qrCustomLogoData || document.getElementById('cfg-qr-custom-logo-url')?.value.trim();
    } else if (logo !== 'none' && window.QR_LOGO_SVGS && window.QR_LOGO_SVGS[logo]) {
      logoSrc = window.QR_LOGO_SVGS[logo];
    }

    if (logoSrc) {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const cx = size / 2;
        const cy = size / 2;
        const radius = size * 0.12; // 24% del ancho (seguro dentro del 30% de tolerancia)

        // Escudo circular de fondo
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + (size * 0.02), 0, Math.PI * 2);
        ctx.fillStyle = '#' + bgColor;
        ctx.fill();
        ctx.lineWidth = size * 0.015;
        ctx.strokeStyle = '#' + fgColor;
        ctx.stroke();

        // Máscara y dibujo del logo
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.restore();
      };
      logoImg.src = logoSrc;
    }
  };
  img.src = qrUrl;
}

function downloadGeneratedQR() {
  const canvas = document.getElementById('qr-gen-canvas');
  if (!canvas) return;
  const type = window.qrSelectedType || 'qr';

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Error al generar la imagen del código QR.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `codigo-qr-${type}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert('✓ ¡Código QR descargado con éxito en PNG de alta resolución con su logotipo central!');
  }, 'image/png');
}

function copyGeneratedQRLink() {
  const payload = buildQRDataPayload();
  if (payload) {
    copyText(payload);
    alert('✓ Contenido del código QR copiado al portapapeles.');
  }
}

function applyGeneratedQRToPromo() {
  const payload = buildQRDataPayload();
  const type = window.qrSelectedType || 'url';
  const logo = window.qrSelectedLogo || 'none';

  window.promoActiveQRPayload = payload;
  window.promoActiveQRType = type;
  window.promoActiveQRLogo = logo;

  if (type === 'url') {
    const lInput = document.getElementById('cfg-promo-link');
    if (lInput) lInput.value = payload;
  }

  const qrChk1 = document.getElementById('cfg-promo-show-qr');
  const qrChk2 = document.getElementById('cfg-promo-custom-show-qr');
  if (qrChk1) qrChk1.checked = true;
  if (qrChk2) qrChk2.checked = true;

  switchPromoSubTab('creator');
  updatePromoPipPreview();

  const typeLabels = { url: 'Enlace Web', vcard: 'Contacto vCard', wifi: 'Red Wi-Fi', email: 'Email', text: 'Cupón/Texto' };
  alert(`✓ ¡QR configurado y aplicado a la Promoción!\nTipo: ${typeLabels[type] || type} | Logotipo: ${logo.toUpperCase()}`);
}
