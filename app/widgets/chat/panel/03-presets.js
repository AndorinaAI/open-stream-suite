

// ----------------------------------------------------------------------
// CHAT: PRESET MANAGEMENT & LIVE REFLECTION
// ----------------------------------------------------------------------
function onChatPresetChange(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const presets = cachedWidgetsConfig.chat.presets || [];
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;

  cachedWidgetsConfig.chat.activePreset = presetId;
  if (!cachedWidgetsConfig.chat.styles) cachedWidgetsConfig.chat.styles = {};
  const s = cachedWidgetsConfig.chat.styles;

  // Sync state
  s.themePreset = preset.themePreset || presetId;
  s.activePreset = presetId;
  s.shape = preset.shape || 'rounded';
  s.bgType = preset.bgType || 'glass';
  s.bgColor = preset.bgColor || '#191D21';
  s.bgGradient = preset.bgGradient || '#0B0D0F';
  s.borderStyle = preset.borderStyle || 'left_neon';
  s.borderWidth = preset.borderWidth !== undefined ? preset.borderWidth : 3;
  s.borderColor = preset.borderColor || '#57D6C4';
  s.accentColor = s.borderColor;
  s.glowIntensity = preset.glowIntensity !== undefined ? preset.glowIntensity : 40;
  s.fontFamily = preset.fontFamily || 'outfit';
  s.fontSize = preset.fontSize || 14;
  s.bgOpacity = preset.bgOpacity !== undefined ? preset.bgOpacity : 88;
  s.fadeSeconds = preset.fadeSeconds !== undefined ? preset.fadeSeconds : 18;
  s.customCSS = preset.customCSS || '';
  if (preset.roleColors) s.roleColors = Object.assign({}, preset.roleColors);

  // Update DOM inputs
  const shapeEl = document.getElementById('cfg-chat-shape');
  const bgTypeEl = document.getElementById('cfg-chat-bgtype');
  const bgColorEl = document.getElementById('cfg-chat-bgcolor');
  const bgColorHexEl = document.getElementById('cfg-chat-bgcolor-hex');
  const bgGradEl = document.getElementById('cfg-chat-bggrad');
  const bgGradHexEl = document.getElementById('cfg-chat-bggrad-hex');
  const borderStyleEl = document.getElementById('cfg-chat-borderstyle');
  const borderWidthEl = document.getElementById('cfg-chat-borderwidth');
  const borderWdLbl = document.getElementById('lbl-chat-bw');
  const borderEl = document.getElementById('cfg-chat-border');
  const borderHexEl = document.getElementById('cfg-chat-border-hex');
  const glowEl = document.getElementById('cfg-chat-glow');
  const glowLbl = document.getElementById('lbl-chat-glow');
  const fontEl = document.getElementById('cfg-chat-font');
  const sizeEl = document.getElementById('cfg-chat-size');
  const opEl = document.getElementById('cfg-chat-opacity');
  const opLbl = document.getElementById('lbl-chat-op');
  const fadeEl = document.getElementById('cfg-chat-fade');
  const cssEl = document.getElementById('cfg-chat-custom-css');

  if (shapeEl) shapeEl.value = s.shape;
  if (bgTypeEl) bgTypeEl.value = s.bgType;
  if (bgColorEl) bgColorEl.value = s.bgColor;
  if (bgColorHexEl) bgColorHexEl.value = s.bgColor;
  if (bgGradEl) bgGradEl.value = s.bgGradient;
  if (bgGradHexEl) bgGradHexEl.value = s.bgGradient;
  if (borderStyleEl) borderStyleEl.value = s.borderStyle;
  if (borderWidthEl) borderWidthEl.value = s.borderWidth;
  if (borderWdLbl) borderWdLbl.textContent = s.borderWidth + 'px';
  if (borderEl) borderEl.value = s.borderColor;
  if (borderHexEl) borderHexEl.value = s.borderColor;
  if (glowEl) glowEl.value = s.glowIntensity;
  if (glowLbl) glowLbl.textContent = s.glowIntensity + '%';
  if (fontEl) fontEl.value = s.fontFamily;
  if (sizeEl) sizeEl.value = s.fontSize;
  if (opEl) opEl.value = s.bgOpacity;
  if (opLbl) opLbl.textContent = s.bgOpacity + '%';
  if (fadeEl) fadeEl.value = s.fadeSeconds;
  if (cssEl) cssEl.value = s.customCSS;

  if (preset.roleColors) {
    const rc = preset.roleColors;
    const rBroad = document.getElementById('cfg-chat-role-broadcaster');
    const rMod = document.getElementById('cfg-chat-role-moderator');
    const rVip = document.getElementById('cfg-chat-role-vip');
    const rSub = document.getElementById('cfg-chat-role-subscriber');
    const rArt = document.getElementById('cfg-chat-role-artist');
    const rFollow = document.getElementById('cfg-chat-role-follower');
    const rViewer = document.getElementById('cfg-chat-role-viewer');
    if (rBroad && rc.broadcaster) rBroad.value = rc.broadcaster;
    if (rMod && rc.moderator) rMod.value = rc.moderator;
    if (rVip && rc.vip) rVip.value = rc.vip;
    if (rSub && rc.subscriber) rSub.value = rc.subscriber;
    if (rArt && rc.artist) rArt.value = rc.artist;
    if (rFollow && rc.follower) rFollow.value = rc.follower;
    if (rViewer && rc.viewer) rViewer.value = rc.viewer;
  }

  updateChatPipPreview();
  if (cachedWidgetsConfig.timer && cachedWidgetsConfig.timer.sameStyleAsChat) {
    copyStylesFromChatToTimer(false);
  }
}

async function saveCurrentChatPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const activePresetId = cachedWidgetsConfig.chat.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.chat.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  preset.shape = document.getElementById('cfg-chat-shape')?.value || 'rounded';
  preset.bgType = document.getElementById('cfg-chat-bgtype')?.value || 'glass';
  preset.bgColor = document.getElementById('cfg-chat-bgcolor')?.value || '#191D21';
  preset.bgGradient = document.getElementById('cfg-chat-bggrad')?.value || '#0B0D0F';
  preset.borderStyle = document.getElementById('cfg-chat-borderstyle')?.value || 'left_neon';
  preset.borderWidth = parseInt(document.getElementById('cfg-chat-borderwidth')?.value, 10) || 3;
  preset.borderColor = document.getElementById('cfg-chat-border')?.value || '#57D6C4';
  preset.accentColor = preset.borderColor;
  preset.glowIntensity = parseInt(document.getElementById('cfg-chat-glow')?.value, 10) || 40;
  preset.fontFamily = document.getElementById('cfg-chat-font')?.value || 'outfit';
  preset.fontSize = parseInt(document.getElementById('cfg-chat-size')?.value, 10) || 14;
  preset.bgOpacity = parseInt(document.getElementById('cfg-chat-opacity')?.value, 10) || 88;
  preset.fadeSeconds = parseInt(document.getElementById('cfg-chat-fade')?.value, 10) || 18;
  preset.customCSS = document.getElementById('cfg-chat-custom-css')?.value || '';

  preset.roleColors = {
    broadcaster: document.getElementById('cfg-chat-role-broadcaster')?.value || '#EF4444',
    moderator: document.getElementById('cfg-chat-role-moderator')?.value || '#22C55E',
    vip: document.getElementById('cfg-chat-role-vip')?.value || '#EC4899',
    subscriber: document.getElementById('cfg-chat-role-subscriber')?.value || '#F59E0B',
    artist: document.getElementById('cfg-chat-role-artist')?.value || '#8B5CF6',
    follower: document.getElementById('cfg-chat-role-follower')?.value || '#38BDF8',
    viewer: document.getElementById('cfg-chat-role-viewer')?.value || '#94A3B8'
  };

  // Sincronizar también con styles
  cachedWidgetsConfig.chat.styles = Object.assign({}, cachedWidgetsConfig.chat.styles, {
    activePreset: activePresetId,
    themePreset: preset.themePreset || activePresetId,
    shape: preset.shape,
    bgType: preset.bgType,
    bgColor: preset.bgColor,
    bgGradient: preset.bgGradient,
    borderStyle: preset.borderStyle,
    borderWidth: preset.borderWidth,
    borderColor: preset.borderColor,
    accentColor: preset.borderColor,
    glowIntensity: preset.glowIntensity,
    fontFamily: preset.fontFamily,
    fontSize: preset.fontSize,
    bgOpacity: preset.bgOpacity,
    fadeSeconds: preset.fadeSeconds,
    roleColors: preset.roleColors,
    customCSS: preset.customCSS
  });

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateChatPipPreview();
  alert(`✓ ¡Preset "${preset.name}" guardado con éxito!`);
}

async function createNewChatPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const name = prompt('Nombre del nuevo Preset de Chat (ej. "Cyberpunk Neón Azul", "Bocadillo Cómic"):');
  if (!name || !name.trim()) return;

  const newId = 'preset_' + Date.now();
  const themePreset = document.getElementById('cfg-chat-preset-select')?.value || 'maker_glass';
  const shape = document.getElementById('cfg-chat-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-chat-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-chat-bgcolor')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-chat-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-chat-borderstyle')?.value || 'left_neon';
  const borderWidth = parseInt(document.getElementById('cfg-chat-borderwidth')?.value, 10) || 3;
  const borderColor = document.getElementById('cfg-chat-border')?.value || '#57D6C4';
  const glowIntensity = parseInt(document.getElementById('cfg-chat-glow')?.value, 10) || 40;
  const fontFamily = document.getElementById('cfg-chat-font')?.value || 'outfit';
  const fontSize = parseInt(document.getElementById('cfg-chat-size')?.value, 10) || 14;
  const bgOpacity = parseInt(document.getElementById('cfg-chat-opacity')?.value, 10) || 88;
  const fadeSeconds = parseInt(document.getElementById('cfg-chat-fade')?.value, 10) || 18;
  const customCSS = document.getElementById('cfg-chat-custom-css')?.value || '';

  const roleColors = {
    broadcaster: document.getElementById('cfg-chat-role-broadcaster')?.value || '#EF4444',
    moderator: document.getElementById('cfg-chat-role-moderator')?.value || '#22C55E',
    vip: document.getElementById('cfg-chat-role-vip')?.value || '#EC4899',
    subscriber: document.getElementById('cfg-chat-role-subscriber')?.value || '#F59E0B',
    artist: document.getElementById('cfg-chat-role-artist')?.value || '#8B5CF6',
    follower: document.getElementById('cfg-chat-role-follower')?.value || '#38BDF8',
    viewer: document.getElementById('cfg-chat-role-viewer')?.value || '#94A3B8'
  };

  const newPreset = {
    id: newId,
    name: name.trim(),
    isBuiltin: false,
    themePreset,
    shape,
    bgType,
    bgColor,
    bgGradient,
    borderStyle,
    borderWidth,
    borderColor,
    accentColor: borderColor,
    glowIntensity,
    fontFamily,
    fontSize,
    bgOpacity,
    fadeSeconds,
    roleColors,
    customCSS
  };

  if (!cachedWidgetsConfig.chat.presets) cachedWidgetsConfig.chat.presets = [];
  cachedWidgetsConfig.chat.presets.push(newPreset);
  cachedWidgetsConfig.chat.activePreset = newId;

  // Sincronizar también con styles
  cachedWidgetsConfig.chat.styles = Object.assign({}, cachedWidgetsConfig.chat.styles, {
    activePreset: newId,
    themePreset: themePreset,
    shape,
    bgType,
    bgColor,
    bgGradient,
    borderStyle,
    borderWidth,
    borderColor,
    accentColor: borderColor,
    glowIntensity,
    fontFamily,
    fontSize,
    bgOpacity,
    fadeSeconds,
    roleColors,
    customCSS
  });

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  updateChatPipPreview();
  alert(`✓ ¡Nuevo preset "${name}" creado y activado!`);
}

async function renameCurrentChatPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const activePresetId = cachedWidgetsConfig.chat.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.chat.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  const newName = prompt('Nuevo nombre para este preset de Chat:', preset.name);
  if (!newName || !newName.trim() || newName.trim() === preset.name) return;

  preset.name = newName.trim();
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert(`✓ Preset de Chat renombrado a "${preset.name}".`);
}

async function deleteCurrentChatPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const activePresetId = cachedWidgetsConfig.chat.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.chat.presets || [];
  const preset = presets.find(p => p.id === activePresetId);

  if (!preset) return;
  if (preset.isBuiltin) {
    alert('⚠️ Los presets integrados de fábrica del sistema no se pueden eliminar. Puedes guardar tus modificaciones en un preset nuevo con "➕ Guardar Como Nuevo Preset...".');
    return;
  }

  if (!confirm(`¿Seguro que deseas eliminar el preset personalizado "${preset.name}"?`)) return;

  cachedWidgetsConfig.chat.presets = presets.filter(p => p.id !== activePresetId);
  cachedWidgetsConfig.chat.activePreset = 'maker_glass';
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert('✓ Preset personalizado eliminado.');
}
