


async function saveTimerControls() {
  if (!cachedWidgetsConfig) return;
    if (!cachedWidgetsConfig.timer) cachedWidgetsConfig.timer = {};
    const t = cachedWidgetsConfig.timer;
    const activePresetId = document.getElementById('cfg-timer-preset-select')?.value || 'maker_glass';
    t.activePreset = activePresetId;
    t.sameStyleAsChat = document.getElementById('cfg-timer-same-as-chat')?.checked === true;

    t.mode = document.getElementById('cfg-timer-mode')?.value || 'down';
    t.initialSeconds = parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300;
    t.targetSeconds = parseInt(document.getElementById('cfg-timer-target-sec')?.value, 10) || 0;
    t.defaultSeconds = t.initialSeconds;
    t.timeFormat = document.getElementById('cfg-timer-time-format')?.value || 'mm:ss';
    t.formatLayout = document.getElementById('cfg-timer-format-layout')?.value || 'prefix_time_unit_sub';
    t.customTemplate = document.getElementById('cfg-timer-custom-template')?.value || '{prefix} {time} {unit} - {sub}';
    t.title = document.getElementById('cfg-timer-title')?.value || 'EN BREVE COMENZAMOS';
    t.unitLabel = document.getElementById('cfg-timer-unit')?.value || 'MIN';
    t.subtitle = document.getElementById('cfg-timer-subtitle')?.value || 'FASE ACTUAL';

    if (!t.styles) t.styles = {};
    const s = t.styles;
    s.themePreset = activePresetId;
    s.activePreset = activePresetId;
    s.shape = document.getElementById('cfg-timer-shape')?.value || 'rounded';
    s.bgType = document.getElementById('cfg-timer-bgtype')?.value || 'glass';
    s.bgColor = document.getElementById('cfg-timer-bgcolor')?.value || '#191D21';
    s.bgGradient = document.getElementById('cfg-timer-bggrad')?.value || '#0B0D0F';
    s.borderStyle = document.getElementById('cfg-timer-borderstyle')?.value || 'left_neon';
    s.borderWidth = parseInt(document.getElementById('cfg-timer-borderwidth')?.value, 10) || 3;
    s.borderColor = document.getElementById('cfg-timer-border')?.value || '#57D6C4';
    s.accentColor = s.borderColor;
    s.glowIntensity = parseInt(document.getElementById('cfg-timer-glow')?.value, 10) || 40;
    s.bgOpacity = parseInt(document.getElementById('cfg-timer-opacity')?.value, 10) || 94;

    s.timeDigits = {
      fontFamily: document.getElementById('cfg-timer-digits-font')?.value || 'outfit',
      fontSize: parseInt(document.getElementById('cfg-timer-digits-size')?.value, 10) || 38,
      color: document.getElementById('cfg-timer-digits-color')?.value || '#F2EEE5'
    };

    s.unit = {
      fontFamily: document.getElementById('cfg-timer-unit-font')?.value || 'outfit',
      fontSize: parseInt(document.getElementById('cfg-timer-unit-size')?.value, 10) || 11,
      color: document.getElementById('cfg-timer-unit-color')?.value || '#57D6C4'
    };

    s.prefix = {
      fontFamily: document.getElementById('cfg-timer-prefix-font')?.value || 'outfit',
      fontSize: parseInt(document.getElementById('cfg-timer-prefix-size')?.value, 10) || 11,
      color: document.getElementById('cfg-timer-prefix-color')?.value || '#57D6C4'
    };

    s.subtitle = {
      fontSize: parseInt(document.getElementById('cfg-timer-sub-size')?.value, 10) || 11,
      color: document.getElementById('cfg-timer-sub-color')?.value || '#8B969C'
    };

    s.progressBar = {
      show: document.getElementById('cfg-timer-bar-show')?.checked !== false,
      height: parseInt(document.getElementById('cfg-timer-bar-height')?.value, 10) || 6,
      color: document.getElementById('cfg-timer-bar-color')?.value || s.borderColor,
      trackColor: document.getElementById('cfg-timer-bar-track')?.value || '#2E363B'
    };

    s.customCSS = document.getElementById('cfg-timer-custom-css')?.value || '';

    // Alertas
    if (!t.alerts) t.alerts = {};
    t.alarmSound = document.getElementById('cfg-timer-alarm-sound')?.value || 'bell';
    t.warningSeconds = parseInt(document.getElementById('cfg-timer-warn-sec')?.value, 10) || 30;
    t.allowChannelPointsAdd = document.getElementById('cfg-timer-points')?.checked !== false;

    t.alerts.finalAlarm = {
      enabled: t.alarmSound !== 'none',
      sound: t.alarmSound,
      flashScreen: document.getElementById('cfg-timer-flash')?.checked !== false
    };
    t.alerts.warningThreshold = {
      enabled: t.warningSeconds > 0,
      seconds: t.warningSeconds,
      color: '#EF4444'
    };
    t.alerts.periodic = {
      enabled: document.getElementById('cfg-timer-periodic-enable')?.checked === true,
      everyMinutes: parseInt(document.getElementById('cfg-timer-periodic-min')?.value, 10) || 15,
      sound: document.getElementById('cfg-timer-periodic-sound')?.value || 'beep_digital',
      flash: true,
      message: document.getElementById('cfg-timer-periodic-msg')?.value || '💧 Recordatorio de Hidratación / Descanso'
    };

    const milestonesStr = document.getElementById('cfg-timer-milestones')?.value || '5, 1';
    t.alerts.milestones = milestonesStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0).map(mins => ({
      atSeconds: mins * 60,
      message: `¡${mins} minuto${mins > 1 ? 's' : ''} restante${mins > 1 ? 's' : ''}!`,
      sound: 'bell',
      flash: true
    }));

    // Actualizar preset en la lista de presets
    const curP = (t.presets || []).find(p => p.id === activePresetId);
    if (curP) {
      curP.shape = s.shape;
      curP.bgType = s.bgType;
      curP.bgColor = s.bgColor;
      curP.bgGradient = s.bgGradient;
      curP.borderStyle = s.borderStyle;
      curP.borderWidth = s.borderWidth;
      curP.borderColor = s.borderColor;
      curP.glowIntensity = s.glowIntensity;
      curP.bgOpacity = s.bgOpacity;
      curP.timeDigits = Object.assign({}, s.timeDigits);
      curP.unit = Object.assign({}, s.unit);
      curP.prefix = Object.assign({}, s.prefix);
      curP.subtitle = Object.assign({}, s.subtitle);
      curP.progressBar = Object.assign({}, s.progressBar);
      curP.customCSS = s.customCSS;
    }

}



// Registro del módulo Timer
window.renderTimerShortcuts = renderTimerShortcuts;
window.triggerTimerShortcut = triggerTimerShortcut;
window.renderTimerControls = renderTimerControls;
window.saveTimerControls = saveTimerControls;

window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['timer'] = {
  renderControls: renderTimerControls,
  saveControls: saveTimerControls,
  renderShortcuts: renderTimerShortcuts,
  updatePreview: typeof updateTimerPipPreview === 'function' ? updateTimerPipPreview : () => {}
};

