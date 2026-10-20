// ====================================================================
// MONITOR DE PREVISUALIZACIÓN EN VIVO (16:9) Y POSICIONADOR VISUAL
// ====================================================================

let isDraggingStage = false;
let currentCustomX = 50;
let currentCustomY = 50;
let currentPosMode = 'custom'; // 'custom' | 'random'
let previewTimerInterval = null;
let previewTimeout = null;


function initStagePositioner() {
  const box = document.getElementById('panel-preview-stage');
  if (!box) return;

  function updateCoordsFromEvent(clientX, clientY) {
    if (currentPosMode === 'random') return;
    const rect = box.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    x = Math.max(8, Math.min(92, Math.round(x)));
    y = Math.max(8, Math.min(92, Math.round(y)));
    setCustomPosition(x, y);
  }

  box.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.id === 'panel-preview-timer') return;
    isDraggingStage = true;
    updateCoordsFromEvent(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingStage) {
      updateCoordsFromEvent(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    isDraggingStage = false;
  });

  // Soporte táctil
  box.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      isDraggingStage = true;
      updateCoordsFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDraggingStage && e.touches.length > 0) {
      updateCoordsFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDraggingStage = false;
  });
}

function setCustomPosition(x, y) {
  currentCustomX = x;
  currentCustomY = y;
  currentPosMode = 'custom';

  const modeEl = document.getElementById('trig-pos-mode');
  const customXEl = document.getElementById('trig-custom-x');
  const customYEl = document.getElementById('trig-custom-y');
  if (modeEl) modeEl.value = 'custom';
  if (customXEl) customXEl.value = x;
  if (customYEl) customYEl.value = y;

  const marker = document.getElementById('stage-marker');
  const overlay = document.getElementById('stage-random-overlay');
  const lblX = document.getElementById('coord-x-val');
  const lblY = document.getElementById('coord-y-val');
  const lblXForm = document.getElementById('coord-x-val-form');
  const lblYForm = document.getElementById('coord-y-val-form');
  const posSummary = document.getElementById('pos-summary-text');

  if (marker) {
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    marker.style.display = 'flex';
  }
  if (overlay) overlay.style.display = 'none';
  if (lblX) lblX.textContent = `${x}%`;
  if (lblY) lblY.textContent = `${y}%`;
  if (lblXForm) lblXForm.textContent = `${x}%`;
  if (lblYForm) lblYForm.textContent = `${y}%`;

  let labelPos = `Personalizada (X: ${x}%, Y: ${y}%)`;
  if (x === 50 && y === 50) labelPos = `Centro (X: 50%, Y: 50%)`;
  else if (x >= 75 && y >= 75) labelPos = `Abajo Derecha (X: ${x}%, Y: ${y}%)`;
  else if (x <= 25 && y >= 75) labelPos = `Abajo Izquierda (X: ${x}%, Y: ${y}%)`;
  else if (x >= 75 && y <= 25) labelPos = `Arriba Derecha (X: ${x}%, Y: ${y}%)`;
  else if (x <= 25 && y <= 25) labelPos = `Arriba Izquierda (X: ${x}%, Y: ${y}%)`;

  if (posSummary) posSummary.textContent = labelPos;

  updateLivePreviewPosition(x, y, 'custom');
}

function setRandomPosition() {
  currentPosMode = 'random';
  const modeEl = document.getElementById('trig-pos-mode');
  if (modeEl) modeEl.value = 'random';

  const marker = document.getElementById('stage-marker');
  const overlay = document.getElementById('stage-random-overlay');
  const lblX = document.getElementById('coord-x-val');
  const lblY = document.getElementById('coord-y-val');
  const lblXForm = document.getElementById('coord-x-val-form');
  const lblYForm = document.getElementById('coord-y-val-form');
  const posSummary = document.getElementById('pos-summary-text');

  if (overlay) overlay.style.display = 'flex';
  if (marker) marker.style.display = 'none';
  if (lblX) lblX.textContent = '🎲';
  if (lblY) lblY.textContent = '🎲';
  if (lblXForm) lblXForm.textContent = '🎲';
  if (lblYForm) lblYForm.textContent = '🎲';
  if (posSummary) posSummary.textContent = '🎲 Posición Aleatoria (en cada canje)';

  updateLivePreviewPosition(50, 50, 'random');
}

function stopPreview() {
  if (previewTimeout) clearTimeout(previewTimeout);
  if (previewTimerInterval) clearInterval(previewTimerInterval);

  const video = document.getElementById('panel-preview-video');
  const img = document.getElementById('panel-preview-image');
  const caption = document.getElementById('panel-preview-caption');
  const idle = document.getElementById('panel-preview-idle');
  const timer = document.getElementById('panel-preview-timer');

  if (video) { video.pause(); video.style.display = 'none'; }
  if (img) img.style.display = 'none';
  if (caption) caption.style.display = 'none';
  if (idle) idle.style.display = 'flex';
  if (timer) timer.style.display = 'none';
}

function applyPreviewCaptionStyles(caption, trig, posX, posY) {
  if (!caption) return;
  const show = trig.show_banner_text !== false;
  const rawText = trig.banner_text || trig.title || '';
  if (!show || !rawText) {
    caption.style.display = 'none';
    return;
  }

  const user = 'Andorina';
  const reward = trig.reward_title || 'Recompensa';
  const cost = '250 pts';
  const text = rawText
    .replace(/\{user\}/gi, user)
    .replace(/\{reward\}/gi, reward)
    .replace(/\{cost\}/gi, cost);

  caption.textContent = text;

  const textColor = trig.banner_text_color || '#FFFFFF';
  const borderColor = trig.banner_border_color || trig.accent || '#57D6C4';
  const bgStyle = trig.banner_bg_style || 'dark_glass';
  const fontSize = trig.banner_font_size || 'medium';
  const fontFamily = trig.banner_font_family || 'tech';
  const anim = trig.banner_animation || 'pop';
  const pos = trig.banner_position || 'below';

  caption.style.fontFamily = fontFamily === 'pixel' ? 'monospace' : (fontFamily === 'impact' ? 'Impact, sans-serif' : (fontFamily === 'sans' ? 'var(--font-primary)' : 'var(--font-tech)'));
  caption.style.fontSize = fontSize === 'small' ? '11px' : (fontSize === 'large' ? '15px' : (fontSize === 'xlarge' ? '18px' : '13px'));
  caption.style.color = textColor;
  caption.style.borderColor = borderColor;

  if (bgStyle === 'solid_black') {
    caption.style.background = '#0E1012';
    caption.style.border = `2px solid ${borderColor}`;
    caption.style.boxShadow = `0 0 16px ${borderColor}66`;
    caption.style.textShadow = 'none';
  } else if (bgStyle === 'accent') {
    caption.style.background = `${borderColor}33`;
    caption.style.border = `2px solid ${borderColor}`;
    caption.style.boxShadow = `0 0 20px ${borderColor}88`;
    caption.style.textShadow = 'none';
  } else if (bgStyle === 'none') {
    caption.style.background = 'transparent';
    caption.style.border = 'none';
    caption.style.boxShadow = 'none';
    caption.style.textShadow = `0 2px 8px #000, 0 0 12px ${borderColor}`;
  } else {
    caption.style.background = 'rgba(18, 22, 26, 0.94)';
    caption.style.border = `2px solid ${borderColor}`;
    caption.style.boxShadow = `0 0 16px ${borderColor}44`;
    caption.style.textShadow = 'none';
  }

  if (pos === 'bottom_screen') {
    caption.style.top = 'auto';
    caption.style.bottom = '12px';
    caption.style.left = '50%';
    caption.style.transform = 'translateX(-50%)';
  } else if (pos === 'above') {
    caption.style.top = 'auto';
    caption.style.bottom = `calc((100% - ${posY}%) + 28px)`;
    caption.style.left = `${posX}%`;
    caption.style.transform = 'translateX(-50%)';
  } else if (pos === 'inside') {
    caption.style.top = `${posY}%`;
    caption.style.bottom = 'auto';
    caption.style.left = `${posX}%`;
    caption.style.transform = 'translate(-50%, -50%)';
  } else {
    caption.style.top = `calc(${posY}% + 28px)`;
    caption.style.bottom = 'auto';
    caption.style.left = `${posX}%`;
    caption.style.transform = 'translateX(-50%)';
  }

  caption.className = `preview-caption-banner anim-${anim} pos-${pos}`;
  caption.style.display = 'block';
}

function playPreviewOnPanel(trig) {
  stopPreview();

  const video = document.getElementById('panel-preview-video');
  const img = document.getElementById('panel-preview-image');
  const caption = document.getElementById('panel-preview-caption');
  const idle = document.getElementById('panel-preview-idle');
  const timer = document.getElementById('panel-preview-timer');

  if (idle) idle.style.display = 'none';

  // Posición
  let posX = trig.custom_x || 50;
  let posY = trig.custom_y || 50;
  if (trig.position_mode === 'random') {
    posX = Math.floor(Math.random() * 60 + 20);
    posY = Math.floor(Math.random() * 50 + 25);
  }

  // Tamaño
  let maxW = '55%';
  let maxH = '55%';
  if (trig.size === 'small') { maxW = '35%'; maxH = '35%'; }
  if (trig.size === 'large') { maxW = '80%'; maxH = '80%'; }
  if (trig.size === 'fullscreen') { maxW = '98%'; maxH = '98%'; }

  const targetEl = trig.video_url ? video : (trig.image_url ? img : null);

  if (targetEl) {
    targetEl.style.left = `${posX}%`;
    targetEl.style.top = `${posY}%`;
    targetEl.style.maxWidth = maxW;
    targetEl.style.maxHeight = maxH;
    targetEl.style.display = 'block';

    if (trig.video_url) {
      video.src = trig.video_url;
      video.muted = trig.audio_type !== 'video';
      video.volume = typeof trig.sound_volume === 'number' ? trig.sound_volume : 0.85;
      video.play().catch(() => {});
    } else if (trig.image_url) {
      img.src = trig.image_url;
    }
  }

  // Audio
  if (trig.sound_url && (trig.audio_type === 'custom' || !trig.video_url)) {
    const snd = new Audio(trig.sound_url);
    snd.volume = typeof trig.sound_volume === 'number' ? trig.sound_volume : 0.85;
    snd.play().catch(() => {});
  } else if (trig.audio_type === 'chime') {
    AudioEngine.playChime(trig.chime_type || 'susto');
  }

  // Rótulo de texto con estilos completos
  applyPreviewCaptionStyles(caption, trig, posX, posY);

  // Temporizador en pantalla
  const durSec = Math.round((trig.duration || 5000) / 1000);
  let remSec = durSec;
  if (timer) {
    timer.textContent = `${remSec}s`;
    timer.style.display = 'block';

    previewTimerInterval = setInterval(() => {
      remSec--;
      if (remSec >= 0) timer.textContent = `${remSec}s`;
    }, 1000);
  }

  previewTimeout = setTimeout(() => {
    stopPreview();
  }, trig.duration || 5000);
}

function updateLivePreviewPosition(x, y, mode) {
  const video = document.getElementById('panel-preview-video');
  const img = document.getElementById('panel-preview-image');
  const caption = document.getElementById('panel-preview-caption');
  if (video) { video.style.left = `${x}%`; video.style.top = `${y}%`; }
  if (img) { img.style.left = `${x}%`; img.style.top = `${y}%`; }
  if (caption && caption.style.display !== 'none' && typeof getEditorTriggerData === 'function') {
    const trig = getEditorTriggerData();
    applyPreviewCaptionStyles(caption, trig, x, y);
  }
}

function updateLivePreviewSize(size) {
  const video = document.getElementById('panel-preview-video');
  const img = document.getElementById('panel-preview-image');
  let maxW = '55%', maxH = '55%';
  if (size === 'small') { maxW = '35%'; maxH = '35%'; }
  if (size === 'large') { maxW = '80%'; maxH = '80%'; }
  if (size === 'fullscreen') { maxW = '98%'; maxH = '98%'; }
  if (video) { video.style.maxWidth = maxW; video.style.maxHeight = maxH; }
  if (img) { img.style.maxWidth = maxW; img.style.maxHeight = maxH; }
}

function updateLivePreviewCaption() {
  if (typeof getEditorTriggerData !== 'function') return;
  const trig = getEditorTriggerData();
  const caption = document.getElementById('panel-preview-caption');
  if (!caption) return;
  const posX = trig.custom_x || 50;
  const posY = trig.custom_y || 50;
  applyPreviewCaptionStyles(caption, trig, posX, posY);
}

function updateLivePreviewVisual() {
  // Disparado al cambiar tipo visual (vídeo/imagen/none)
}

function updateLivePreviewDuration() {}
function onVisualFileChange(val) {}


