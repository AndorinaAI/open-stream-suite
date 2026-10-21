// ====================================================================
// REWARDS - ESTADO, COLORES Y SINCRONIZACIÓN DE PREVIEW
// ====================================================================

let twitchRewardsList = [];

function syncTwitchRewardColor(color) {
  if (!color) color = '#57D6C4';
  if (!color.startsWith('#')) color = '#' + color;
  const picker = document.getElementById('tw-reward-color');
  const hex = document.getElementById('tw-reward-color-hex');
  if (picker) picker.value = color;
  if (hex) hex.value = color.toUpperCase();
  updateTwitchRewardPreview();
}

function updateTwitchRewardPreview() {
  const title = document.getElementById('tw-reward-title')?.value.trim() || '¡Susto con Meme!';
  const cost = document.getElementById('tw-reward-cost')?.value || '250';
  const color = document.getElementById('tw-reward-color')?.value || '#57D6C4';

  const chip = document.getElementById('tw-reward-preview-chip');
  const dot = document.getElementById('tw-reward-preview-dot');
  const text = document.getElementById('tw-reward-preview-text');

  if (chip) {
    chip.style.borderColor = color;
    chip.style.color = color;
    chip.style.background = `${color}25`;
    chip.style.boxShadow = `0 0 10px ${color}35`;
  }
  if (dot) {
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${color}`;
  }
  if (text) {
    text.textContent = `🪙 ${title} (${cost} pts)`;
  }
}

// Sincroniza la visualización bloqueada del color de Twitch en el trigger
function syncLockedRewardColor(explicitColor = null) {
  let color = explicitColor;
  if (!color) {
    const selVal = document.getElementById('twitch-rewards-select')?.value;
    const manVal = document.getElementById('trig-reward-manual')?.value.trim();
    const rwName = manVal || selVal;
    if (rwName && twitchRewardsList.length > 0) {
      const match = twitchRewardsList.find(r => r.title.toLowerCase() === rwName.toLowerCase());
      if (match && match.color) color = match.color;
    }
  }
  if (!color) color = '#57D6C4';
  if (!color.startsWith('#')) color = '#' + color;

  const dot = document.getElementById('trigger-locked-color-dot');
  const text = document.getElementById('trigger-locked-color-text');
  if (dot) {
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${color}`;
  }
  if (text) {
    text.style.color = color;
    text.textContent = `${color.toUpperCase()} (Heredado de Twitch)`;
  }

  // Sincronizar también el acento del formulario
  const picker = document.getElementById('trig-accent-color');
  const hex = document.getElementById('trig-accent-color-hex');
  if (picker) picker.value = color;
  if (hex) hex.value = color.toUpperCase();

  const bannerBorderHex = document.getElementById('trig-banner-border-color-hex');
  if (bannerBorderHex && !bannerBorderHex.dataset.customized && typeof syncBannerBorderColor === 'function') {
    syncBannerBorderColor(color, false);
  }
}

// Disparado al elegir una recompensa del desplegable
function onSelectTwitchReward(val) {
  const manualInput = document.getElementById('trig-reward-manual');
  if (manualInput) manualInput.value = val;

  let color = '#57D6C4';
  if (val && twitchRewardsList.length > 0) {
    const match = twitchRewardsList.find(r => r.title === val);
    if (match && match.color) color = match.color;
  }
  syncLockedRewardColor(color);

  const titleInput = document.getElementById('trig-title');
  if (titleInput && (!titleInput.value || titleInput.value.startsWith('¡'))) {
    titleInput.value = val ? `¡${val}!` : '';
  }

  if (typeof updateLivePreviewCaption === 'function') {
    updateLivePreviewCaption();
  }
}

// Disparado al escribir a mano el nombre de la recompensa
function onManualRewardInput(val) {
  let color = null;
  if (val && twitchRewardsList.length > 0) {
    const match = twitchRewardsList.find(r => r.title.toLowerCase() === val.toLowerCase());
    if (match && match.color) color = match.color;
  }
  syncLockedRewardColor(color);

  if (typeof updateLivePreviewCaption === 'function') {
    updateLivePreviewCaption();
  }
}
