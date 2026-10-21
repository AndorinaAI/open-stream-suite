
function updateTimerPipPreview() {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (!iframe || currentMiniAppWidget !== 'timer') return;

  const mode = document.getElementById('cfg-timer-mode')?.value || 'down';
  const timeFormat = document.getElementById('cfg-timer-time-format')?.value || 'mm:ss';
  const formatLayout = document.getElementById('cfg-timer-format-layout')?.value || 'prefix_time_unit_sub';
  const customTemplate = document.getElementById('cfg-timer-custom-template')?.value || '{prefix} {time} {unit} - {sub}';
  const title = document.getElementById('cfg-timer-title')?.value || 'EN BREVE COMENZAMOS';
  const unitLabel = document.getElementById('cfg-timer-unit')?.value || 'MIN';
  const subtitle = document.getElementById('cfg-timer-subtitle')?.value || 'FASE ACTUAL';

  const shape = document.getElementById('cfg-timer-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-timer-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-timer-bgcolor')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-timer-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-timer-borderstyle')?.value || 'left_neon';
  const borderWidth = parseInt(document.getElementById('cfg-timer-borderwidth')?.value, 10) || 3;
  const borderColor = document.getElementById('cfg-timer-border')?.value || '#57D6C4';
  const glowIntensity = parseInt(document.getElementById('cfg-timer-glow')?.value, 10) || 40;
  const bgOpacity = parseInt(document.getElementById('cfg-timer-opacity')?.value, 10) || 94;

  const digitsFont = document.getElementById('cfg-timer-digits-font')?.value || 'outfit';
  const digitsSize = parseInt(document.getElementById('cfg-timer-digits-size')?.value, 10) || 38;
  const digitsColor = document.getElementById('cfg-timer-digits-color')?.value || '#F2EEE5';

  const unitFont = document.getElementById('cfg-timer-unit-font')?.value || 'outfit';
  const unitSize = parseInt(document.getElementById('cfg-timer-unit-size')?.value, 10) || 11;
  const unitColor = document.getElementById('cfg-timer-unit-color')?.value || '#57D6C4';

  const prefixFont = document.getElementById('cfg-timer-prefix-font')?.value || 'outfit';
  const prefixSize = parseInt(document.getElementById('cfg-timer-prefix-size')?.value, 10) || 11;
  const prefixColor = document.getElementById('cfg-timer-prefix-color')?.value || '#57D6C4';

  const subSize = parseInt(document.getElementById('cfg-timer-sub-size')?.value, 10) || 11;
  const subColor = document.getElementById('cfg-timer-sub-color')?.value || '#8B969C';

  const barShow = document.getElementById('cfg-timer-bar-show')?.checked !== false;
  const barHeight = parseInt(document.getElementById('cfg-timer-bar-height')?.value, 10) || 6;
  const barColor = document.getElementById('cfg-timer-bar-color')?.value || borderColor;
  const barTrackColor = document.getElementById('cfg-timer-bar-track')?.value || '#2E363B';

  const customCSS = document.getElementById('cfg-timer-custom-css')?.value || '';

  const cfg = {
    mode,
    timeFormat,
    formatLayout,
    customTemplate,
    title,
    unitLabel,
    subtitle,
    styles: {
      shape,
      bgType,
      bgColor,
      bgGradient,
      borderStyle,
      borderWidth,
      borderColor,
      glowIntensity,
      bgOpacity,
      timeDigits: { fontFamily: digitsFont, fontSize: digitsSize, color: digitsColor },
      unit: { fontFamily: unitFont, fontSize: unitSize, color: unitColor },
      prefix: { fontFamily: prefixFont, fontSize: prefixSize, color: prefixColor },
      subtitle: { fontSize: subSize, color: subColor },
      progressBar: { show: barShow, height: barHeight, color: barColor, trackColor: barTrackColor },
      customCSS
    }
  };

  try {
    if (iframe.contentWindow && iframe.contentWindow.applyTimerConfig) {
      iframe.contentWindow.applyTimerConfig(cfg);
    }
  } catch (e) {}
}

async function sendTimerAction(action, extraParams = {}) {
  await API.triggerWidgetAction('timer', action, extraParams);
}

function setTimerPresetSeconds(secs) {
  const el = document.getElementById('cfg-timer-initial-sec');
  if (el) {
    el.value = secs;
    updateTimerPipPreview();
  }
}

function insertTimerToken(token) {
  const input = document.getElementById('cfg-timer-custom-template');
  if (!input) return;
  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  input.value = input.value.substring(0, start) + ' ' + token + ' ' + input.value.substring(end);
  input.focus();
  updateTimerPipPreview();
}

function onTimerLayoutChange(layoutVal) {
  const customBox = document.getElementById('box-timer-custom-template');
  if (customBox) {
    customBox.style.display = (layoutVal === 'custom_template') ? 'block' : 'none';
  }
  updateTimerPipPreview();
}

function testTimerSound(soundName) {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (iframe && iframe.contentWindow && iframe.contentWindow.playAudioTone) {
    iframe.contentWindow.playAudioTone(soundName);
  }
}
