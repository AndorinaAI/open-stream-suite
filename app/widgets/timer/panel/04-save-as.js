
async function saveCurrentTimerAsShortcut() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;

  const initialSec = parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300;
  const modeVal = document.getElementById('cfg-timer-mode')?.value || 'down';
  const titleVal = document.getElementById('cfg-timer-title')?.value.trim() || 'TEMPORIZADOR';
  const unitVal = document.getElementById('cfg-timer-unit')?.value.trim() || 'MIN';
  const subVal = document.getElementById('cfg-timer-subtitle')?.value.trim() || '';

  const labelInput = document.getElementById('cfg-timer-shortcut-label');
  const labelVal = labelInput?.value.trim() || titleVal || 'Temporizador';
  const colorVal = document.getElementById('cfg-timer-shortcut-color')?.value || '#57D6C4';
  const isPinned = document.getElementById('cfg-timer-shortcut-pinned')?.checked !== false;

  const newSc = {
    id: 'sc_timer_' + Date.now(),
    label: labelVal,
    seconds: initialSec,
    mode: modeVal,
    title: titleVal,
    unit: unitVal,
    subtitle: subVal,
    color: colorVal,
    pinned: isPinned
  };

  if (!cachedWidgetsConfig.timer.shortcuts) {
    cachedWidgetsConfig.timer.shortcuts = [];
  }
  cachedWidgetsConfig.timer.shortcuts.push(newSc);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();

  alert(`✓ ¡Acción Rápida "${labelVal}" creada con éxito!\n${isPinned ? '👁️ Añadida a los botones de la tarjeta principal exterior.' : 'Guardada en la lista de atajos del temporizador.'}`);
}

async function saveCurrentTimerAsPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;

  const titleVal = document.getElementById('cfg-timer-title')?.value.trim() || '';
  const defaultName = titleVal ? `Preset ${titleVal}` : 'Mi Temporizador';
  const name = prompt('Nombre para este nuevo preset de temporizador:', defaultName);
  if (!name || !name.trim()) return;

  const newId = 'preset_timer_' + Date.now();
  const shape = document.getElementById('cfg-timer-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-timer-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-timer-bgcolor')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-timer-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-timer-borderstyle')?.value || 'left_neon';
  const borderWidth = parseInt(document.getElementById('cfg-timer-borderwidth')?.value, 10) || 3;
  const borderColor = document.getElementById('cfg-timer-border')?.value || '#57D6C4';
  const glowIntensity = parseInt(document.getElementById('cfg-timer-glow')?.value, 10) || 40;
  const bgOpacity = parseInt(document.getElementById('cfg-timer-opacity')?.value, 10) || 94;
  const fontFamily = document.getElementById('cfg-timer-digits-font')?.value || 'outfit';
  const digitsSize = parseInt(document.getElementById('cfg-timer-digits-size')?.value, 10) || 38;
  const digitsColor = document.getElementById('cfg-timer-digits-color')?.value || '#F2EEE5';
  const barShow = document.getElementById('cfg-timer-bar-show')?.checked !== false;
  const customCSS = document.getElementById('cfg-timer-custom-css')?.value || '';

  const mode = document.getElementById('cfg-timer-mode')?.value || 'down';
  const initialSeconds = parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300;
  const timeFormat = document.getElementById('cfg-timer-time-format')?.value || 'mm:ss';
  const formatLayout = document.getElementById('cfg-timer-format-layout')?.value || 'prefix_time_unit_sub';
  const customTemplate = document.getElementById('cfg-timer-custom-template')?.value || '{prefix} {time} {unit} - {sub}';
  const unitLabel = document.getElementById('cfg-timer-unit')?.value || 'MIN';
  const subtitle = document.getElementById('cfg-timer-subtitle')?.value || '';
  const alarmSound = document.getElementById('cfg-timer-alarm-sound')?.value || 'bell';

  const newPreset = {
    id: newId,
    name: name.trim(),
    isBuiltin: false,
    mode,
    initialSeconds,
    defaultSeconds: initialSeconds,
    timeFormat,
    formatLayout,
    customTemplate,
    title: titleVal,
    unitLabel,
    subtitle,
    alarmSound,
    shape,
    bgType,
    bgColor,
    bgGradient,
    borderStyle,
    borderWidth,
    borderColor,
    accentColor: borderColor,
    glowIntensity,
    bgOpacity,
    timeDigits: {
      fontFamily,
      fontSize: digitsSize,
      color: digitsColor
    },
    unit: {
      fontFamily,
      fontSize: 11,
      color: borderColor
    },
    prefix: {
      fontFamily,
      fontSize: 11,
      color: borderColor
    },
    subtitleObj: {
      fontSize: 11,
      color: '#8B969C'
    },
    progressBar: {
      show: barShow,
      height: 6,
      color: borderColor,
      trackColor: '#2E363B'
    },
    customCSS
  };

  if (!cachedWidgetsConfig.timer.presets) cachedWidgetsConfig.timer.presets = [];
  cachedWidgetsConfig.timer.presets.push(newPreset);
  cachedWidgetsConfig.timer.activePreset = newId;
  cachedWidgetsConfig.timer.styles = Object.assign({}, cachedWidgetsConfig.timer.styles, newPreset);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  updateTimerPipPreview();
  alert(`✓ ¡Nuevo preset "${name.trim()}" guardado con éxito!`);
}

async function copyStylesFromChatToTimer(showAlert = true) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat || !cachedWidgetsConfig.timer) return;
  const chatStyles = cachedWidgetsConfig.chat.styles || {};
  const chatActivePreset = cachedWidgetsConfig.chat.activePreset || chatStyles.themePreset || 'maker_glass';

  // 1. Si existe un preset en timer con el mismo ID, lo seleccionamos
  const timerPresets = cachedWidgetsConfig.timer.presets || [];
  const matchingPreset = timerPresets.find(p => p.id === chatActivePreset);
  if (matchingPreset) {
    cachedWidgetsConfig.timer.activePreset = matchingPreset.id;
    const sel = document.getElementById('cfg-timer-preset-select');
    if (sel) sel.value = matchingPreset.id;
  }

  // 2. Copiamos los atributos visuales clave del chat al timer
  if (!cachedWidgetsConfig.timer.styles) cachedWidgetsConfig.timer.styles = {};
  const ts = cachedWidgetsConfig.timer.styles;

  ts.shape = chatStyles.shape || 'rounded';
  ts.bgType = chatStyles.bgType || 'glass';
  ts.bgColor = chatStyles.bgColor || '#191D21';
  ts.bgGradient = chatStyles.bgGradient || '#0B0D0F';
  ts.borderStyle = chatStyles.borderStyle || 'left_neon';
  ts.borderWidth = chatStyles.borderWidth !== undefined ? chatStyles.borderWidth : 3;
  ts.borderColor = chatStyles.borderColor || '#57D6C4';
  ts.accentColor = ts.borderColor;
  ts.glowIntensity = chatStyles.glowIntensity !== undefined ? chatStyles.glowIntensity : 40;
  ts.bgOpacity = chatStyles.bgOpacity !== undefined ? chatStyles.bgOpacity : 94;
  ts.customCSS = chatStyles.customCSS || '';

  // Actualizar también tipografías y acentos individuales acordes
  const chatFont = chatStyles.fontFamily || 'outfit';
  if (!ts.timeDigits) ts.timeDigits = {};
  ts.timeDigits.fontFamily = chatFont;
  ts.timeDigits.color = '#F2EEE5';

  if (!ts.unit) ts.unit = {};
  ts.unit.fontFamily = chatFont;
  ts.unit.color = ts.borderColor;

  if (!ts.prefix) ts.prefix = {};
  ts.prefix.fontFamily = chatFont;
  ts.prefix.color = ts.borderColor;

  if (!ts.progressBar) ts.progressBar = {};
  ts.progressBar.color = ts.borderColor;

  // Actualizar DOM inputs del temporizador
  syncTimerDomFromStyles(ts);

  // Actualizar el preset activo si existe
  const activePresetId = cachedWidgetsConfig.timer.activePreset;
  const currentP = timerPresets.find(p => p.id === activePresetId);
  if (currentP) {
    Object.assign(currentP, {
      shape: ts.shape,
      bgType: ts.bgType,
      bgColor: ts.bgColor,
      bgGradient: ts.bgGradient,
      borderStyle: ts.borderStyle,
      borderWidth: ts.borderWidth,
      borderColor: ts.borderColor,
      glowIntensity: ts.glowIntensity,
      bgOpacity: ts.bgOpacity,
      timeDigits: Object.assign({}, ts.timeDigits),
      unit: Object.assign({}, ts.unit),
      prefix: Object.assign({}, ts.prefix),
      progressBar: Object.assign({}, ts.progressBar),
      customCSS: ts.customCSS
    });
  }

  // Guardar y refrescar preview en vivo
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateTimerPipPreview();
  if (showAlert) {
    alert(`✓ ¡Estilos del Chat sincronizados con el Temporizador con éxito!\nTema: "${chatActivePreset}" | Color Acento: ${ts.borderColor} | Silueta: ${ts.shape}`);
  }
}
