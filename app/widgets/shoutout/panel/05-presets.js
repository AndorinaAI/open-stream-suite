
function onPromoPresetChange(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  const presets = cachedWidgetsConfig.promo.presets || [];
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;

  cachedWidgetsConfig.promo.activePreset = presetId;
  const mode = (preset.type === 'product' || preset.type === 'custom' || preset.type === 'social') ? 'custom' : 'shoutout';
  setPromoMode(mode);

  if (mode === 'shoutout') {
    const sInput = document.getElementById('cfg-promo-streamer');
    const dInput = document.getElementById('cfg-promo-display-name');
    const gInput = document.getElementById('cfg-promo-game');
    const aInput = document.getElementById('cfg-promo-avatar');
    const mInput = document.getElementById('cfg-promo-message');
    const clipChk = document.getElementById('cfg-promo-play-clip');
    const clipUrl = document.getElementById('cfg-promo-clip-url');
    const qrChk = document.getElementById('cfg-promo-show-qr');

    if (sInput) sInput.value = preset.streamer || 'andorina';
    if (dInput) dInput.value = preset.display_name || preset.title || 'Andorina';
    if (gInput) gInput.value = preset.game || preset.subtitle || 'Cacharreo & Directos';
    if (aInput) aInput.value = preset.avatar || '';
    if (mInput) mInput.value = preset.message || '';
    if (clipChk) clipChk.checked = preset.playClip === true;
    if (clipUrl) clipUrl.value = preset.clip_url || '';
    if (qrChk) qrChk.checked = preset.showQR !== false;
    const clipBox = document.getElementById('box-promo-clip-details');
    if (clipBox) clipBox.style.display = preset.playClip ? 'block' : 'none';
  } else {
    const tInput = document.getElementById('cfg-promo-title');
    const eInput = document.getElementById('cfg-promo-eyebrow');
    const sInput = document.getElementById('cfg-promo-subtitle');
    const pInput = document.getElementById('cfg-promo-price');
    const lInput = document.getElementById('cfg-promo-link');
    const iInput = document.getElementById('cfg-promo-image-url');
    const qrChk = document.getElementById('cfg-promo-custom-show-qr');

    if (tInput) tInput.value = preset.title || '';
    if (eInput) eInput.value = preset.eyebrow || '🛒 DESTACADO DEL STREAM';
    if (sInput) sInput.value = preset.subtitle || '';
    if (pInput) pInput.value = preset.price || '';
    if (lInput) lInput.value = preset.link || '';
    if (iInput) iInput.value = preset.image_url || preset.media_url || '';
    if (qrChk) qrChk.checked = preset.showQR !== false;
  }

  // Estilos
  if (!cachedWidgetsConfig.promo.styles) cachedWidgetsConfig.promo.styles = {};
  const s = cachedWidgetsConfig.promo.styles;
  s.shape = preset.shape || 'rounded';
  s.bgType = preset.bgType || 'glass';
  s.bgColor = preset.bgColor || '#191D21';
  s.bgGradient = preset.bgGradient || '#0B0D0F';
  s.borderStyle = preset.borderStyle || 'left_neon';
  s.borderColor = preset.borderColor || preset.color || '#57D6C4';
  s.glowIntensity = preset.glowIntensity !== undefined ? preset.glowIntensity : 45;
  s.fontFamily = preset.fontFamily || 'outfit';
  s.animation = preset.animation || 'slide_up';
  s.customCSS = preset.customCSS || '';

  const shapeSel = document.getElementById('cfg-promo-shape');
  const bgtypeSel = document.getElementById('cfg-promo-bgtype');
  const bgcolorInput = document.getElementById('cfg-promo-bgcolor');
  const bggradInput = document.getElementById('cfg-promo-bggrad');
  const borderSel = document.getElementById('cfg-promo-borderstyle');
  const colorInput = document.getElementById('cfg-promo-color');
  const borderInput = document.getElementById('cfg-promo-border');
  const glowInput = document.getElementById('cfg-promo-glow');
  const fontSel = document.getElementById('cfg-promo-font');
  const animSel = document.getElementById('cfg-promo-anim');
  const cssInput = document.getElementById('cfg-promo-custom-css');

  if (shapeSel) shapeSel.value = s.shape;
  if (bgtypeSel) bgtypeSel.value = s.bgType;
  if (bgcolorInput) bgcolorInput.value = s.bgColor;
  if (bggradInput) bggradInput.value = s.bgGradient;
  if (borderSel) borderSel.value = s.borderStyle;
  if (colorInput) colorInput.value = s.borderColor;
  if (borderInput) borderInput.value = s.borderColor;
  if (glowInput) {
    glowInput.value = s.glowIntensity;
    const lbl = document.getElementById('lbl-promo-glow');
    if (lbl) lbl.textContent = s.glowIntensity + '%';
  }
  if (fontSel) fontSel.value = s.fontFamily;
  if (animSel) animSel.value = s.animation;
  if (cssInput) cssInput.value = s.customCSS;

  updatePromoPipPreview();
}

async function saveCurrentPromoPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  const activePresetId = cachedWidgetsConfig.promo.activePreset || 'streamer_neon';
  const presets = cachedWidgetsConfig.promo.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  preset.type = mode;

  if (mode === 'shoutout') {
    preset.streamer = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    preset.display_name = document.getElementById('cfg-promo-display-name')?.value.trim() || preset.streamer;
    preset.game = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    preset.avatar = document.getElementById('cfg-promo-avatar')?.value.trim() || '';
    preset.message = document.getElementById('cfg-promo-message')?.value.trim() || '';
    preset.playClip = document.getElementById('cfg-promo-play-clip')?.checked === true;
    preset.clip_url = document.getElementById('cfg-promo-clip-url')?.value.trim() || '';
    preset.showQR = document.getElementById('cfg-promo-show-qr')?.checked !== false;
  } else {
    preset.title = document.getElementById('cfg-promo-title')?.value.trim() || '';
    preset.eyebrow = document.getElementById('cfg-promo-eyebrow')?.value.trim() || '🛒 DESTACADO DEL STREAM';
    preset.subtitle = document.getElementById('cfg-promo-subtitle')?.value.trim() || '';
    preset.price = document.getElementById('cfg-promo-price')?.value.trim() || '';
    preset.link = document.getElementById('cfg-promo-link')?.value.trim() || '';
    preset.image_url = document.getElementById('cfg-promo-image-url')?.value.trim() || '';
    preset.showQR = document.getElementById('cfg-promo-custom-show-qr')?.checked !== false;
  }

  preset.color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';
  preset.shape = document.getElementById('cfg-promo-shape')?.value || 'rounded';
  preset.bgType = document.getElementById('cfg-promo-bgtype')?.value || 'glass';
  preset.bgColor = document.getElementById('cfg-promo-bgcolor')?.value || '#191D21';
  preset.bgGradient = document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F';
  preset.borderStyle = document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon';
  preset.borderColor = document.getElementById('cfg-promo-border')?.value || preset.color;
  preset.glowIntensity = parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45;
  preset.fontFamily = document.getElementById('cfg-promo-font')?.value || 'outfit';
  preset.animation = document.getElementById('cfg-promo-anim')?.value || 'slide_up';
  preset.customCSS = document.getElementById('cfg-promo-custom-css')?.value || '';

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updatePromoPipPreview();
  alert(`✓ ¡Cambios guardados en el preset "${preset.name}"!`);
}

async function renameCurrentPromoPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  const activePresetId = cachedWidgetsConfig.promo.activePreset || 'streamer_neon';
  const presets = cachedWidgetsConfig.promo.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  const newName = prompt('Nuevo nombre para el preset:', preset.name);
  if (!newName || !newName.trim()) return;

  preset.name = newName.trim();
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert(`✓ Preset renombrado a "${preset.name}".`);
}

async function saveCurrentPromoAsPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;

  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  const defaultName = mode === 'shoutout' ? `📢 Promo ${document.getElementById('cfg-promo-display-name')?.value || 'Canal'}` : `📦 ${document.getElementById('cfg-promo-title')?.value || 'Producto'}`;
  const name = prompt('Nombre para este nuevo preset de promoción:', defaultName);
  if (!name || !name.trim()) return;

  const newId = 'preset_promo_' + Date.now();
  const color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';

  const newPreset = {
    id: newId,
    name: name.trim(),
    isBuiltin: false,
    type: mode,
    color,
    shape: document.getElementById('cfg-promo-shape')?.value || 'rounded',
    bgType: document.getElementById('cfg-promo-bgtype')?.value || 'glass',
    bgColor: document.getElementById('cfg-promo-bgcolor')?.value || '#191D21',
    bgGradient: document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F',
    borderStyle: document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon',
    borderColor: document.getElementById('cfg-promo-border')?.value || color,
    glowIntensity: parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45,
    fontFamily: document.getElementById('cfg-promo-font')?.value || 'outfit',
    animation: document.getElementById('cfg-promo-anim')?.value || 'slide_up',
    customCSS: document.getElementById('cfg-promo-custom-css')?.value || '',
    showQR: mode === 'shoutout' ? document.getElementById('cfg-promo-show-qr')?.checked !== false : document.getElementById('cfg-promo-custom-show-qr')?.checked !== false
  };

  if (mode === 'shoutout') {
    newPreset.streamer = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    newPreset.display_name = document.getElementById('cfg-promo-display-name')?.value.trim() || newPreset.streamer;
    newPreset.game = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    newPreset.avatar = document.getElementById('cfg-promo-avatar')?.value.trim() || '';
    newPreset.message = document.getElementById('cfg-promo-message')?.value.trim() || '';
    newPreset.playClip = document.getElementById('cfg-promo-play-clip')?.checked === true;
    newPreset.clip_url = document.getElementById('cfg-promo-clip-url')?.value.trim() || '';
  } else {
    newPreset.title = document.getElementById('cfg-promo-title')?.value.trim() || '';
    newPreset.eyebrow = document.getElementById('cfg-promo-eyebrow')?.value.trim() || '🛒 DESTACADO DEL STREAM';
    newPreset.subtitle = document.getElementById('cfg-promo-subtitle')?.value.trim() || '';
    newPreset.price = document.getElementById('cfg-promo-price')?.value.trim() || '';
    newPreset.link = document.getElementById('cfg-promo-link')?.value.trim() || '';
    newPreset.image_url = document.getElementById('cfg-promo-image-url')?.value.trim() || '';
  }

  if (!cachedWidgetsConfig.promo.presets) cachedWidgetsConfig.promo.presets = [];
  cachedWidgetsConfig.promo.presets.push(newPreset);
  cachedWidgetsConfig.promo.activePreset = newId;

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert(`✓ ¡Nuevo preset de promo "${name.trim()}" guardado con éxito!`);
}

async function deleteCurrentPromoPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  const activePresetId = cachedWidgetsConfig.promo.activePreset || 'streamer_neon';
  const presets = cachedWidgetsConfig.promo.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  if (preset.isBuiltin) {
    alert('Los presets predefinidos del sistema no se pueden eliminar.');
    return;
  }

  if (!confirm(`¿Eliminar definitivamente el preset "${preset.name}"?`)) return;

  cachedWidgetsConfig.promo.presets = presets.filter(p => p.id !== activePresetId);
  cachedWidgetsConfig.promo.activePreset = cachedWidgetsConfig.promo.presets[0]?.id || 'streamer_neon';

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert('✓ Preset eliminado.');
}
