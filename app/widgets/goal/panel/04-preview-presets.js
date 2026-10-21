
function updateGoalPipPreview() {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (!iframe || !iframe.contentWindow || !cachedWidgetsConfig) return;

  const g = cachedWidgetsConfig.goal || {};
  const s = g.styles || {};
  const selGoal = (g.goals || []).find(it => it.id === window.selectedGoalId);

  // Recoger valores del DOM
  const titleVal = document.getElementById('cfg-goal-title')?.value;
  const iconVal = document.getElementById('cfg-goal-icon')?.value;
  const currentVal = parseInt(document.getElementById('cfg-goal-current')?.value, 10);
  const targetVal = parseInt(document.getElementById('cfg-goal-target')?.value, 10);
  const pfxVal = document.getElementById('cfg-goal-prefix')?.value;
  const sfxVal = document.getElementById('cfg-goal-suffix')?.value;
  const subtextVal = document.getElementById('cfg-goal-subtext-format')?.value;
  const itemColorVal = document.getElementById('cfg-goal-item-color')?.value;
  const itemBarStartVal = document.getElementById('cfg-goal-item-bar-start')?.value;
  const itemBarEndVal = document.getElementById('cfg-goal-item-bar-end')?.value;

  if (selGoal) {
    if (titleVal !== undefined) selGoal.title = titleVal;
    if (iconVal !== undefined) selGoal.icon = iconVal;
    if (!isNaN(currentVal) && selGoal.category !== 'twitch') selGoal.current = currentVal;
    if (!isNaN(targetVal)) selGoal.target = targetVal;
    if (pfxVal !== undefined) selGoal.prefix = pfxVal;
    if (sfxVal !== undefined) selGoal.suffix = sfxVal;
    if (subtextVal !== undefined) selGoal.subtextFormat = subtextVal;
    if (itemColorVal) selGoal.color = itemColorVal;
    if (itemBarStartVal) selGoal.barColorStart = itemBarStartVal;
    if (itemBarEndVal) selGoal.barColorEnd = itemBarEndVal;
  }

  const shapeVal = document.getElementById('cfg-goal-shape')?.value;
  const bgTypeVal = document.getElementById('cfg-goal-bg-type')?.value;
  const bgColorVal = document.getElementById('cfg-goal-bg-color')?.value;
  const borderStyleVal = document.getElementById('cfg-goal-border-style')?.value;
  const borderColorVal = document.getElementById('cfg-goal-border-color')?.value;
  const glowVal = parseInt(document.getElementById('cfg-goal-glow-intensity')?.value, 10);
  const barHeightVal = document.getElementById('cfg-goal-bar-height')?.value;
  const barPatternVal = document.getElementById('cfg-goal-bar-pattern')?.value;
  const barStartVal = document.getElementById('cfg-goal-bar-start')?.value;
  const barEndVal = document.getElementById('cfg-goal-bar-end')?.value;
  const fontVal = document.getElementById('cfg-goal-font-family')?.value;
  const customCSSVal = document.getElementById('cfg-goal-custom-css')?.value;
  const rotAnimVal = document.getElementById('cfg-goal-rotation-anim')?.value;

  if (shapeVal) s.shape = shapeVal;
  if (bgTypeVal) s.bgType = bgTypeVal;
  if (bgColorVal) s.bgColor = bgColorVal;
  if (borderStyleVal) s.borderStyle = borderStyleVal;
  if (borderColorVal) s.borderColor = borderColorVal;
  if (!isNaN(glowVal)) s.glowIntensity = glowVal;
  if (barHeightVal) s.barHeight = barHeightVal;
  if (barPatternVal) s.barPattern = barPatternVal;
  if (barStartVal) s.barColorStart = barStartVal;
  if (barEndVal) s.barColorEnd = barEndVal;
  if (fontVal) s.fontFamily = fontVal;
  if (customCSSVal !== undefined) s.customCSS = customCSSVal;
  if (rotAnimVal) g.rotationAnimation = rotAnimVal;

  const sameAsChat = document.getElementById('cfg-goal-same-as-chat')?.checked === true;
  g.sameStyleAsChat = sameAsChat;

  const liveConfig = {
    displayMode: g.displayMode || 'stacked',
    rotationInterval: g.rotationInterval || 10,
    rotationAnimation: g.rotationAnimation || 'slide_horizontal',
    activeGoalId: window.selectedGoalId || g.activeGoalId,
    goals: g.goals,
    celebrateOnFinish: document.getElementById('cfg-goal-celebrate-finish')?.checked !== false,
    celebrateSound: document.getElementById('cfg-goal-celebrate-sound')?.checked !== false,
    sameStyleAsChat: sameAsChat,
    styles: s,
    chat: cachedWidgetsConfig.chat || {}
  };

  try {
    if (typeof iframe.contentWindow.applyGoalConfig === 'function') {
      iframe.contentWindow.applyGoalConfig(liveConfig);
    } else {
      iframe.contentWindow.postMessage({
        type: 'apply_goal_config',
        config: liveConfig
      }, '*');
    }
  } catch (err) {
    console.warn('PiP preview iframe error:', err);
  }
}

async function toggleGoalSameStyleAsChat(checked) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  cachedWidgetsConfig.goal.sameStyleAsChat = checked;

  const badge = document.getElementById('badge-goal-chat-synced');
  const controlsWrapper = document.getElementById('goal-style-controls-wrapper');

  if (badge) badge.style.display = checked ? 'inline-block' : 'none';
  if (controlsWrapper) {
    controlsWrapper.style.opacity = checked ? '0.45' : '1';
    controlsWrapper.style.pointerEvents = checked ? 'none' : 'auto';
  }

  if (checked) {
    await copyStylesFromChatToGoal(false);
  }

  updateGoalPipPreview();
}

async function copyStylesFromChatToGoal(showAlert = true) {
  if (!cachedWidgetsConfig) return;
  const chat = cachedWidgetsConfig.chat;
  if (!chat || !chat.styles) {
    if (showAlert) alert('No hay estilos de Chat configurados.');
    return;
  }

  if (!cachedWidgetsConfig.goal) cachedWidgetsConfig.goal = {};
  if (!cachedWidgetsConfig.goal.styles) cachedWidgetsConfig.goal.styles = {};

  const cs = chat.styles;
  const gs = cachedWidgetsConfig.goal.styles;

  if (cs.shape) gs.shape = cs.shape;
  if (cs.bgType) gs.bgType = cs.bgType;
  if (cs.bgColor) gs.bgColor = cs.bgColor;
  if (cs.bgGradient) gs.bgGradient = cs.bgGradient;
  if (cs.borderStyle) gs.borderStyle = cs.borderStyle;
  if (cs.borderColor) {
    gs.borderColor = cs.borderColor;
    gs.accentColor = cs.borderColor;
    gs.barColorStart = cs.borderColor;
  }
  if (cs.glowIntensity !== undefined) gs.glowIntensity = cs.glowIntensity;
  if (cs.fontFamily) gs.fontFamily = cs.fontFamily;

  // Si fue importación manual (no anclaje), desbloqueamos los controles
  if (showAlert) {
    cachedWidgetsConfig.goal.sameStyleAsChat = false;
    const sameBox = document.getElementById('cfg-goal-same-as-chat');
    if (sameBox) sameBox.checked = false;
    const badge = document.getElementById('badge-goal-chat-synced');
    if (badge) badge.style.display = 'none';
    const controlsWrapper = document.getElementById('goal-style-controls-wrapper');
    if (controlsWrapper) {
      controlsWrapper.style.opacity = '1';
      controlsWrapper.style.pointerEvents = 'auto';
    }
  }

  // Reflejar en DOM
  const shapeInput = document.getElementById('cfg-goal-shape');
  if (shapeInput) shapeInput.value = gs.shape;
  const bgTypeInput = document.getElementById('cfg-goal-bg-type');
  if (bgTypeInput) bgTypeInput.value = gs.bgType;
  const bgColorInput = document.getElementById('cfg-goal-bg-color');
  if (bgColorInput) bgColorInput.value = gs.bgColor;
  const borderStyleInput = document.getElementById('cfg-goal-border-style');
  if (borderStyleInput) borderStyleInput.value = gs.borderStyle;
  const borderColorInput = document.getElementById('cfg-goal-border-color');
  if (borderColorInput) borderColorInput.value = gs.borderColor;
  const glowInput = document.getElementById('cfg-goal-glow-intensity');
  if (glowInput) glowInput.value = gs.glowIntensity;
  const fontInput = document.getElementById('cfg-goal-font-family');
  if (fontInput) fontInput.value = gs.fontFamily;

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateGoalPipPreview();
  if (showAlert) alert('✓ ¡Estilos del Chat importados con éxito! Ahora puedes editar cualquier color o propiedad individualmente.');
}

function onGoalPresetChange(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const presets = cachedWidgetsConfig.goal.presets || [];
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;

  cachedWidgetsConfig.goal.activePreset = presetId;
  if (!cachedWidgetsConfig.goal.styles) cachedWidgetsConfig.goal.styles = {};
  const s = cachedWidgetsConfig.goal.styles;
  s.shape = preset.shape || 'rounded';
  s.bgType = preset.bgType || 'glass';
  s.borderStyle = preset.borderStyle || 'left_neon';
  s.borderColor = preset.borderColor || preset.color || '#57D6C4';
  s.barColorStart = preset.barColorStart || preset.color || '#57D6C4';
  s.barColorEnd = preset.barColorEnd || '#38BDF8';
  s.barPattern = preset.barPattern || 'striped';
  s.barHeight = preset.barHeight || 'medium';
  s.glowIntensity = preset.glowIntensity !== undefined ? preset.glowIntensity : 40;
  s.fontFamily = preset.fontFamily || 'outfit';

  renderMiniAppControls();
  updateGoalPipPreview();
}

async function saveCurrentGoalPreset(asNew = false) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const presets = g.presets || [];

  if (asNew) {
    const name = prompt('Nombre para el nuevo Preset de Objetivo:', 'Mi Preset de Metas');
    if (!name || !name.trim()) return;

    const newId = 'preset_goal_' + Date.now();
    const newPreset = {
      id: newId,
      name: name.trim(),
      isBuiltin: false,
      shape: document.getElementById('cfg-goal-shape')?.value || 'rounded',
      bgType: document.getElementById('cfg-goal-bg-type')?.value || 'glass',
      borderColor: document.getElementById('cfg-goal-border-color')?.value || '#57D6C4',
      barColorStart: document.getElementById('cfg-goal-bar-start')?.value || '#57D6C4',
      barColorEnd: document.getElementById('cfg-goal-bar-end')?.value || '#38BDF8',
      barHeight: document.getElementById('cfg-goal-bar-height')?.value || 'medium',
      barPattern: document.getElementById('cfg-goal-bar-pattern')?.value || 'striped',
      glowIntensity: parseInt(document.getElementById('cfg-goal-glow-intensity')?.value, 10) || 40,
      fontFamily: document.getElementById('cfg-goal-font-family')?.value || 'outfit'
    };

    presets.push(newPreset);
    g.activePreset = newId;
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    renderMiniAppControls();
    alert(`✓ ¡Nuevo preset "${name.trim()}" guardado con éxito!`);
  } else {
    const activeId = g.activePreset || 'twitch_followers';
    const idx = presets.findIndex(p => p.id === activeId);
    if (idx !== -1) {
      presets[idx].shape = document.getElementById('cfg-goal-shape')?.value || presets[idx].shape;
      presets[idx].borderColor = document.getElementById('cfg-goal-border-color')?.value || presets[idx].borderColor;
      presets[idx].barColorStart = document.getElementById('cfg-goal-bar-start')?.value || presets[idx].barColorStart;
      presets[idx].barColorEnd = document.getElementById('cfg-goal-bar-end')?.value || presets[idx].barColorEnd;
      presets[idx].barHeight = document.getElementById('cfg-goal-bar-height')?.value || presets[idx].barHeight;
      presets[idx].barPattern = document.getElementById('cfg-goal-bar-pattern')?.value || presets[idx].barPattern;
      presets[idx].glowIntensity = parseInt(document.getElementById('cfg-goal-glow-intensity')?.value, 10) || presets[idx].glowIntensity;
      presets[idx].fontFamily = document.getElementById('cfg-goal-font-family')?.value || presets[idx].fontFamily;

      await API.saveWidgetsConfig(cachedWidgetsConfig);
      alert(`✓ Preset "${presets[idx].name}" actualizado con éxito.`);
    }
  }
}

function exportGoalPresetJson() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const activeId = g.activePreset || 'twitch_followers';
  const preset = (g.presets || []).find(p => p.id === activeId);
  if (!preset) return;

  const jsonStr = JSON.stringify(preset, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    alert(`📋 ¡Preset "${preset.name}" copiado al portapapeles en formato JSON!`);
  }).catch(() => {
    prompt('Copia el JSON de este Preset:', jsonStr);
  });
}

async function importGoalPresetJson() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const jsonStr = prompt('Pega aquí el JSON del Preset de Metas a importar:');
  if (!jsonStr || !jsonStr.trim()) return;

  try {
    const data = JSON.parse(jsonStr.trim());
    if (!data.name) {
      alert('El formato JSON no es válido. Debe contener al menos el campo "name".');
      return;
    }
    const newId = 'preset_goal_' + Date.now();
    data.id = newId;
    data.name = `${data.name} [Importado]`;
    data.isBuiltin = false;

    if (!Array.isArray(cachedWidgetsConfig.goal.presets)) {
      cachedWidgetsConfig.goal.presets = [];
    }
    cachedWidgetsConfig.goal.presets.push(data);
    cachedWidgetsConfig.goal.activePreset = newId;

    if (data.goals && Array.isArray(data.goals)) cachedWidgetsConfig.goal.goals = data.goals;
    if (data.styles) cachedWidgetsConfig.goal.styles = data.styles;
    if (data.displayMode) cachedWidgetsConfig.goal.displayMode = data.displayMode;

    await API.saveWidgetsConfig(cachedWidgetsConfig);
    renderMiniAppControls();
    updateGoalPipPreview();
    renderGoalShortcuts();
    alert(`✓ Preset "${data.name}" importado y activado correctamente.`);
  } catch (err) {
    alert('Error al leer el JSON: ' + err.message);
  }
}
window.importGoalPresetJson = importGoalPresetJson;

async function deleteGoalPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const presets = g.presets || [];
  const activeId = g.activePreset;

  const p = presets.find(item => item.id === activeId);
  if (!p) return;

  if (p.isBuiltin) {
    alert('No se pueden eliminar los presets predefinidos de fábrica.');
    return;
  }

  if (!confirm(`¿Eliminar definitivamente el preset "${p.name}"?`)) return;

  g.presets = presets.filter(item => item.id !== activeId);
  g.activePreset = 'twitch_followers';
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert('✓ Preset eliminado.');
}
