// ----------------------------------------------------------------------
// TEMPORIZADOR: GUARDADO, RENOMBRADO, ELIMINACIÓN Y ANCLAJE DE CHAT
// ----------------------------------------------------------------------

async function saveCurrentTimerPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  const activePresetId = cachedWidgetsConfig.timer.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.timer.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  // Actualizar configuración funcional
  preset.mode = document.getElementById('cfg-timer-mode')?.value || 'down';
  preset.initialSeconds = parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300;
  preset.defaultSeconds = preset.initialSeconds;
  preset.timeFormat = document.getElementById('cfg-timer-time-format')?.value || 'mm:ss';
  preset.formatLayout = document.getElementById('cfg-timer-format-layout')?.value || 'prefix_time_unit_sub';
  preset.customTemplate = document.getElementById('cfg-timer-custom-template')?.value || '{prefix} {time} {unit} - {sub}';
  preset.title = document.getElementById('cfg-timer-title')?.value.trim() || 'TEMPORIZADOR';
  preset.unitLabel = document.getElementById('cfg-timer-unit')?.value.trim() || 'MIN';
  preset.subtitle = document.getElementById('cfg-timer-subtitle')?.value.trim() || '';
  preset.alarmSound = document.getElementById('cfg-timer-alarm-sound')?.value || 'bell';

  // Actualizar estilos visuales
  preset.shape = document.getElementById('cfg-timer-shape')?.value || 'rounded';
  preset.bgType = document.getElementById('cfg-timer-bgtype')?.value || 'glass';
  preset.bgColor = document.getElementById('cfg-timer-bgcolor')?.value || '#191D21';
  preset.bgGradient = document.getElementById('cfg-timer-bggrad')?.value || '#0B0D0F';
  preset.borderStyle = document.getElementById('cfg-timer-borderstyle')?.value || 'left_neon';
  preset.borderWidth = parseInt(document.getElementById('cfg-timer-borderwidth')?.value, 10) || 3;
  preset.borderColor = document.getElementById('cfg-timer-border')?.value || '#57D6C4';
  preset.accentColor = preset.borderColor;
  preset.glowIntensity = parseInt(document.getElementById('cfg-timer-glow')?.value, 10) || 40;
  preset.bgOpacity = parseInt(document.getElementById('cfg-timer-opacity')?.value, 10) || 94;
  preset.customCSS = document.getElementById('cfg-timer-custom-css')?.value || '';

  preset.timeDigits = {
    fontFamily: document.getElementById('cfg-timer-digits-font')?.value || 'outfit',
    fontSize: parseInt(document.getElementById('cfg-timer-digits-size')?.value, 10) || 38,
    color: document.getElementById('cfg-timer-digits-color')?.value || '#F2EEE5'
  };

  preset.unit = {
    fontFamily: document.getElementById('cfg-timer-unit-font')?.value || 'outfit',
    fontSize: parseInt(document.getElementById('cfg-timer-unit-size')?.value, 10) || 11,
    color: document.getElementById('cfg-timer-unit-color')?.value || '#57D6C4'
  };

  preset.prefix = {
    fontFamily: document.getElementById('cfg-timer-prefix-font')?.value || 'outfit',
    fontSize: parseInt(document.getElementById('cfg-timer-prefix-size')?.value, 10) || 11,
    color: document.getElementById('cfg-timer-prefix-color')?.value || '#57D6C4'
  };

  preset.subtitleObj = {
    fontSize: parseInt(document.getElementById('cfg-timer-sub-size')?.value, 10) || 11,
    color: document.getElementById('cfg-timer-sub-color')?.value || '#8B969C'
  };

  preset.progressBar = {
    show: document.getElementById('cfg-timer-bar-show')?.checked !== false,
    height: parseInt(document.getElementById('cfg-timer-bar-height')?.value, 10) || 6,
    color: document.getElementById('cfg-timer-bar-color')?.value || preset.borderColor,
    trackColor: document.getElementById('cfg-timer-bar-track')?.value || '#2E363B'
  };

  cachedWidgetsConfig.timer.styles = Object.assign({}, cachedWidgetsConfig.timer.styles, preset);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  if (typeof updateTimerPipPreview === 'function') updateTimerPipPreview();
  alert(`✓ ¡Cambios guardados con éxito en el preset "${preset.name}"!`);
}
window.saveCurrentTimerPreset = saveCurrentTimerPreset;

async function renameCurrentTimerPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  const activePresetId = cachedWidgetsConfig.timer.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.timer.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  const newName = prompt('Nuevo nombre para este preset de Temporizador:', preset.name);
  if (!newName || !newName.trim() || newName.trim() === preset.name) return;

  preset.name = newName.trim();
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  if (typeof renderMiniAppControls === 'function') renderMiniAppControls();
  alert(`✓ Preset de Temporizador renombrado a "${preset.name}".`);
}
window.renameCurrentTimerPreset = renameCurrentTimerPreset;

async function deleteCurrentTimerPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  const activePresetId = cachedWidgetsConfig.timer.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.timer.presets || [];

  if (presets.length <= 1) {
    alert('No puedes eliminar el único preset existente.');
    return;
  }

  const p = presets.find(item => item.id === activePresetId);
  if (p && p.isBuiltin) {
    alert('⚠️ Los presets integrados de fábrica no se pueden eliminar. Puedes guardar tus modificaciones en un preset nuevo con "➕ Guardar Nuevo...".');
    return;
  }

  const ok = confirm(`¿Estás seguro de que quieres eliminar el preset personalizado "${p ? p.name : activePresetId}"?`);
  if (!ok) return;

  cachedWidgetsConfig.timer.presets = presets.filter(item => item.id !== activePresetId);
  const fallback = cachedWidgetsConfig.timer.presets[0].id;
  cachedWidgetsConfig.timer.activePreset = fallback;

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  if (typeof renderMiniAppControls === 'function') renderMiniAppControls();
  if (typeof onTimerPresetChange === 'function') onTimerPresetChange(fallback);
  alert('✓ Preset eliminado.');
}
window.deleteCurrentTimerPreset = deleteCurrentTimerPreset;

async function toggleSameStyleAsChat(checked) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  cachedWidgetsConfig.timer.sameStyleAsChat = checked === true;

  const styleControls = document.getElementById('timer-style-controls-wrapper');
  const badge = document.getElementById('badge-chat-synced');

  if (checked) {
    if (styleControls) {
      styleControls.style.opacity = '0.45';
      styleControls.style.pointerEvents = 'none';
    }
    if (badge) badge.style.display = 'inline-block';
    if (typeof copyStylesFromChatToTimer === 'function') await copyStylesFromChatToTimer(false);
  } else {
    if (styleControls) {
      styleControls.style.opacity = '1';
      styleControls.style.pointerEvents = 'auto';
    }
    if (badge) badge.style.display = 'none';
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    if (typeof updateTimerPipPreview === 'function') updateTimerPipPreview();
  }
}
window.toggleSameStyleAsChat = toggleSameStyleAsChat;
