// ----------------------------------------------------------------------
// TEMPORIZADOR: PRESET OPTIONS & SYNC CON DOM
// ----------------------------------------------------------------------

function buildTimerFontOptions(selectedFont = 'outfit') {
  const fonts = [
    { id: 'outfit', label: '🌐 Outfit (Moderna & Redonda)' },
    { id: 'inter', label: '💻 Inter (Limpia & Minimalista)' },
    { id: 'mono', label: '📟 JetBrains Mono (Terminal & Tech)' },
    { id: 'orbitron', label: '🛸 Orbitron (Cyberpunk & Futurista)' },
    { id: 'retro', label: '👾 Press Start 2P (Pixel Art 8-Bit)' },
    { id: 'bungee', label: '💥 Bungee (Gaming & Punch)' },
    { id: 'righteous', label: '⚡ Righteous (Synthwave & Retro 80s)' },
    { id: 'comfortaa', label: '🌸 Comfortaa (Kawaii & Dulce)' },
    { id: 'russo', label: '🏆 Russo One (Esports & Potente)' },
    { id: 'cinzel', label: '👑 Cinzel (Elegante & Épica)' },
    { id: 'montserrat', label: '📰 Montserrat (Editorial & Clara)' },
    { id: 'rajdhani', label: '⚡ Rajdhani (Cyber & Robótica)' },
    { id: 'silkscreen', label: '🕹️ Silkscreen (Pixel HD Moderno)' }
  ];
  return fonts.map(f => {
    const isSel = (f.id === selectedFont || (selectedFont === 'press_start' && f.id === 'retro') || (selectedFont === 'russo_one' && f.id === 'russo')) ? 'selected' : '';
    return `<option value="${f.id}" ${isSel}>${f.label}</option>`;
  }).join('');
}
window.buildTimerFontOptions = buildTimerFontOptions;

function onTimerPresetChange(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  const presets = cachedWidgetsConfig.timer.presets || [];
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;

  cachedWidgetsConfig.timer.activePreset = presetId;

  // 1. Cargar Configuración Funcional
  if (preset.mode) {
    cachedWidgetsConfig.timer.mode = preset.mode;
    const modeEl = document.getElementById('cfg-timer-mode');
    if (modeEl) modeEl.value = preset.mode;
  }
  if (preset.initialSeconds !== undefined || preset.defaultSeconds !== undefined) {
    const secs = preset.initialSeconds !== undefined ? preset.initialSeconds : preset.defaultSeconds;
    cachedWidgetsConfig.timer.initialSeconds = secs;
    cachedWidgetsConfig.timer.defaultSeconds = secs;
    const secEl = document.getElementById('cfg-timer-initial-sec');
    if (secEl) secEl.value = secs;
  }
  if (preset.timeFormat) {
    cachedWidgetsConfig.timer.timeFormat = preset.timeFormat;
    const fmtEl = document.getElementById('cfg-timer-time-format');
    if (fmtEl) fmtEl.value = preset.timeFormat;
  }
  if (preset.formatLayout) {
    cachedWidgetsConfig.timer.formatLayout = preset.formatLayout;
    const layoutEl = document.getElementById('cfg-timer-format-layout');
    if (layoutEl) {
      layoutEl.value = preset.formatLayout;
      if (typeof onTimerLayoutChange === 'function') onTimerLayoutChange(preset.formatLayout);
    }
  }
  if (preset.customTemplate) {
    cachedWidgetsConfig.timer.customTemplate = preset.customTemplate;
    const tmplEl = document.getElementById('cfg-timer-custom-template');
    if (tmplEl) tmplEl.value = preset.customTemplate;
  }
  if (preset.title) {
    cachedWidgetsConfig.timer.title = preset.title;
    const titleEl = document.getElementById('cfg-timer-title');
    if (titleEl) titleEl.value = preset.title;
    const scLabelEl = document.getElementById('cfg-timer-shortcut-label');
    if (scLabelEl) scLabelEl.value = preset.title;
  }
  if (preset.unitLabel || preset.unit) {
    const uVal = preset.unitLabel || (typeof preset.unit === 'string' ? preset.unit : preset.unit?.label) || 'MIN';
    cachedWidgetsConfig.timer.unitLabel = uVal;
    const unitEl = document.getElementById('cfg-timer-unit');
    if (unitEl) unitEl.value = uVal;
  }
  if (preset.subtitle !== undefined) {
    const subVal = typeof preset.subtitle === 'string' ? preset.subtitle : (preset.subtitle?.text || '');
    cachedWidgetsConfig.timer.subtitle = subVal;
    const subEl = document.getElementById('cfg-timer-subtitle');
    if (subEl) subEl.value = subVal;
  }
  if (preset.alarmSound) {
    cachedWidgetsConfig.timer.alarmSound = preset.alarmSound;
    const soundEl = document.getElementById('cfg-timer-alarm-sound');
    if (soundEl) soundEl.value = preset.alarmSound;
  }

  // 2. Cargar Estilos Visuales
  if (!cachedWidgetsConfig.timer.styles) cachedWidgetsConfig.timer.styles = {};
  const s = cachedWidgetsConfig.timer.styles;

  s.themePreset = presetId;
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
  s.bgOpacity = preset.bgOpacity !== undefined ? preset.bgOpacity : 94;
  s.customCSS = preset.customCSS || '';

  if (preset.timeDigits) s.timeDigits = Object.assign({}, preset.timeDigits);
  if (preset.unit && typeof preset.unit === 'object') s.unit = Object.assign({}, preset.unit);
  if (preset.prefix) s.prefix = Object.assign({}, preset.prefix);
  if (preset.subtitle && typeof preset.subtitle === 'object') s.subtitle = Object.assign({}, preset.subtitle);
  if (preset.progressBar) s.progressBar = Object.assign({}, preset.progressBar);

  if (cachedWidgetsConfig.timer.sameStyleAsChat !== true) {
    syncTimerDomFromStyles(s);
  }

  const sel = document.getElementById('cfg-timer-preset-select');
  if (sel && sel.value !== presetId) sel.value = presetId;

  if (typeof updateTimerPipPreview === 'function') updateTimerPipPreview();
}
window.onTimerPresetChange = onTimerPresetChange;

function syncTimerDomFromStyles(s) {
  if (!s) return;
  const shapeEl = document.getElementById('cfg-timer-shape');
  const bgTypeEl = document.getElementById('cfg-timer-bgtype');
  const bgColorEl = document.getElementById('cfg-timer-bgcolor');
  const bgColorHexEl = document.getElementById('cfg-timer-bgcolor-hex');
  const bgGradEl = document.getElementById('cfg-timer-bggrad');
  const bgGradHexEl = document.getElementById('cfg-timer-bggrad-hex');
  const borderStyleEl = document.getElementById('cfg-timer-borderstyle');
  const borderWidthEl = document.getElementById('cfg-timer-borderwidth');
  const borderWdLbl = document.getElementById('lbl-timer-bw');
  const borderEl = document.getElementById('cfg-timer-border');
  const borderHexEl = document.getElementById('cfg-timer-border-hex');
  const glowEl = document.getElementById('cfg-timer-glow');
  const glowLbl = document.getElementById('lbl-timer-glow');
  const opEl = document.getElementById('cfg-timer-opacity');
  const opLbl = document.getElementById('lbl-timer-op');
  const cssEl = document.getElementById('cfg-timer-custom-css');

  if (shapeEl && s.shape) shapeEl.value = s.shape;
  if (bgTypeEl && s.bgType) bgTypeEl.value = s.bgType;
  if (bgColorEl && s.bgColor) bgColorEl.value = s.bgColor;
  if (bgColorHexEl && s.bgColor) bgColorHexEl.value = s.bgColor;
  if (bgGradEl && s.bgGradient) bgGradEl.value = s.bgGradient;
  if (bgGradHexEl && s.bgGradient) bgGradHexEl.value = s.bgGradient;
  if (borderStyleEl && s.borderStyle) borderStyleEl.value = s.borderStyle;
  if (borderWidthEl && s.borderWidth !== undefined) {
    borderWidthEl.value = s.borderWidth;
    if (borderWdLbl) borderWdLbl.textContent = s.borderWidth + 'px';
  }
  if (borderEl && s.borderColor) borderEl.value = s.borderColor;
  if (borderHexEl && s.borderColor) borderHexEl.value = s.borderColor;
  if (glowEl && s.glowIntensity !== undefined) {
    glowEl.value = s.glowIntensity;
    if (glowLbl) glowLbl.textContent = s.glowIntensity + '%';
  }
  if (opEl && s.bgOpacity !== undefined) {
    opEl.value = s.bgOpacity;
    if (opLbl) opLbl.textContent = s.bgOpacity + '%';
  }
  if (cssEl && s.customCSS !== undefined) cssEl.value = s.customCSS;

  if (s.timeDigits) {
    const dFont = document.getElementById('cfg-timer-digits-font');
    const dSize = document.getElementById('cfg-timer-digits-size');
    const dColor = document.getElementById('cfg-timer-digits-color');
    const dLbl = document.getElementById('lbl-timer-digits-sz');
    if (dFont && s.timeDigits.fontFamily) dFont.value = s.timeDigits.fontFamily;
    if (dSize && s.timeDigits.fontSize) {
      dSize.value = s.timeDigits.fontSize;
      if (dLbl) dLbl.textContent = s.timeDigits.fontSize + 'px';
    }
    if (dColor && s.timeDigits.color) dColor.value = s.timeDigits.color;
  }

  if (s.unit) {
    const uFont = document.getElementById('cfg-timer-unit-font');
    const uSize = document.getElementById('cfg-timer-unit-size');
    const uColor = document.getElementById('cfg-timer-unit-color');
    const uLbl = document.getElementById('lbl-timer-unit-sz');
    if (uFont && s.unit.fontFamily) uFont.value = s.unit.fontFamily;
    if (uSize && s.unit.fontSize) {
      uSize.value = s.unit.fontSize;
      if (uLbl) uLbl.textContent = s.unit.fontSize + 'px';
    }
    if (uColor && s.unit.color) uColor.value = s.unit.color;
  }

  if (s.prefix) {
    const pFont = document.getElementById('cfg-timer-prefix-font');
    const pSize = document.getElementById('cfg-timer-prefix-size');
    const pColor = document.getElementById('cfg-timer-prefix-color');
    const pLbl = document.getElementById('lbl-timer-prefix-sz');
    if (pFont && s.prefix.fontFamily) pFont.value = s.prefix.fontFamily;
    if (pSize && s.prefix.fontSize) {
      pSize.value = s.prefix.fontSize;
      if (pLbl) pLbl.textContent = s.prefix.fontSize + 'px';
    }
    if (pColor && s.prefix.color) pColor.value = s.prefix.color;
  }

  if (s.subtitle) {
    const subSize = document.getElementById('cfg-timer-sub-size');
    const subColor = document.getElementById('cfg-timer-sub-color');
    if (subSize && s.subtitle.fontSize) subSize.value = s.subtitle.fontSize;
    if (subColor && s.subtitle.color) subColor.value = s.subtitle.color;
  }

  if (s.progressBar) {
    const barShow = document.getElementById('cfg-timer-bar-show');
    const barHeight = document.getElementById('cfg-timer-bar-height');
    const barColor = document.getElementById('cfg-timer-bar-color');
    const barTrack = document.getElementById('cfg-timer-bar-track');
    if (barShow && s.progressBar.show !== undefined) barShow.checked = s.progressBar.show !== false;
    if (barHeight && s.progressBar.height) barHeight.value = s.progressBar.height;
    if (barColor && s.progressBar.color) barColor.value = s.progressBar.color;
    if (barTrack && s.progressBar.trackColor) barTrack.value = s.progressBar.trackColor;
  }
}
window.syncTimerDomFromStyles = syncTimerDomFromStyles;
