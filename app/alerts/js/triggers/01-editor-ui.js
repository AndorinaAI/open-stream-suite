// ====================================================================
// GESTOR DE TRIGGERS, COMANDOS DE CHAT Y ALERTAS VISUALES
// ====================================================================

let cachedTriggers = [];
let currentActivationMode = 'both';
let currentVisualType = 'video';
let currentTriggerEditorTab = 'activation';

function setTriggerEditorTab(tabId) {
  currentTriggerEditorTab = tabId;
  document.querySelectorAll('.trigger-step-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.trigger-step-content').forEach(c => {
    c.classList.toggle('active', c.id === `trig-tabcontent-${tabId}`);
  });

  const stepLabels = {
    activation: '1/4 DISPARADOR',
    media: '2/4 MULTIMEDIA',
    caption: '3/4 RÓTULO',
    actions: '4/4 EXTRAS'
  };
  const stepLbl = document.getElementById('lbl-current-tab-step');
  if (stepLbl && stepLabels[tabId]) {
    stepLbl.textContent = stepLabels[tabId];
  }
}


function syncTriggerAccentColor(color) {
  if (!color) return;
  if (!color.startsWith('#')) color = '#' + color;
  const picker = document.getElementById('trig-accent-color');
  const hex = document.getElementById('trig-accent-color-hex');
  if (picker) picker.value = color;
  if (hex) hex.value = color.toUpperCase();
  const bannerBorderHex = document.getElementById('trig-banner-border-color-hex');
  if (bannerBorderHex && !bannerBorderHex.dataset.customized) {
    syncBannerBorderColor(color, false);
  }
  updateLivePreviewCaption();
}

function syncTriggerTitleWithReward() {
  const rw = document.getElementById('trig-reward-manual')?.value.trim() || document.getElementById('twitch-rewards-select')?.value;
  if (rw) {
    document.getElementById('trig-title').value = rw;
    updateLivePreviewCaption();
  } else {
    alert('Selecciona primero una recompensa de Twitch o escribe su nombre para poder copiarlo.');
  }
}

function syncBannerTextColor(color) {
  if (!color) return;
  if (!color.startsWith('#')) color = '#' + color;
  const picker = document.getElementById('trig-banner-text-color');
  const hex = document.getElementById('trig-banner-text-color-hex');
  if (picker) picker.value = color;
  if (hex) hex.value = color.toUpperCase();
  updateLivePreviewCaption();
}

function syncBannerBorderColor(color, markCustom = true) {
  if (!color) return;
  if (!color.startsWith('#')) color = '#' + color;
  const picker = document.getElementById('trig-banner-border-color');
  const hex = document.getElementById('trig-banner-border-color-hex');
  if (picker) picker.value = color;
  if (hex) {
    hex.value = color.toUpperCase();
    if (markCustom) hex.dataset.customized = 'true';
  }
  updateLivePreviewCaption();
}

function insertBannerVar(varText) {
  const input = document.getElementById('trig-banner-text');
  if (!input) return;
  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  input.value = input.value.substring(0, start) + varText + input.value.substring(end);
  input.focus();
  input.selectionStart = input.selectionEnd = start + varText.length;
  updateLivePreviewCaption();
}

function setActivationMode(mode) {
  currentActivationMode = mode;
  document.querySelectorAll('#seg-activation-mode .segmented-option').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-mode') === mode);
  });

  const lockMsg = document.getElementById('points-only-locked-msg');
  const cmdFields = document.getElementById('command-fields-wrapper');
  const twitchGroup = document.getElementById('twitch-reward-select-group');
  const rewardColorLocked = document.getElementById('trigger-color-reward-locked-group');
  const customColorPicker = document.getElementById('trigger-color-custom-picker-group');

  if (mode === 'points_only') {
    if (lockMsg) lockMsg.style.display = 'block';
    if (cmdFields) { cmdFields.style.opacity = '0.35'; cmdFields.style.pointerEvents = 'none'; }
    if (twitchGroup) twitchGroup.style.display = 'block';
    if (rewardColorLocked) rewardColorLocked.style.display = 'block';
    if (customColorPicker) customColorPicker.style.display = 'none';
    syncLockedRewardColor();
  } else if (mode === 'command_only') {
    if (lockMsg) lockMsg.style.display = 'none';
    if (cmdFields) { cmdFields.style.opacity = '1'; cmdFields.style.pointerEvents = 'auto'; }
    if (twitchGroup) twitchGroup.style.display = 'none';
    if (rewardColorLocked) rewardColorLocked.style.display = 'none';
    if (customColorPicker) customColorPicker.style.display = 'block';
  } else {
    if (lockMsg) lockMsg.style.display = 'none';
    if (cmdFields) { cmdFields.style.opacity = '1'; cmdFields.style.pointerEvents = 'auto'; }
    if (twitchGroup) twitchGroup.style.display = 'block';
    if (rewardColorLocked) rewardColorLocked.style.display = 'block';
    if (customColorPicker) customColorPicker.style.display = 'none';
    syncLockedRewardColor();
  }
}

function onSpecialActionChange(val) {
  const container = document.getElementById('action-param-container');
  const twitchDur = document.getElementById('param-group-twitch-duration');
  const emotes = document.getElementById('param-group-emotes');
  const timer = document.getElementById('param-group-timer');

  if (!val || val === 'none' || val === 'twitch_clear_chat') {
    if (container) container.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'block';
  if (twitchDur) twitchDur.style.display = (val === 'twitch_emote_only' || val === 'twitch_slow_mode' || val === 'twitch_sub_only') ? 'block' : 'none';
  if (emotes) emotes.style.display = (val === 'overlay_explode_emotes') ? 'block' : 'none';
  if (timer) timer.style.display = (val === 'overlay_timer_add') ? 'block' : 'none';
}

function setVisualType(type) {
  currentVisualType = type;
  document.querySelectorAll('#seg-visual-type .segmented-option').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-vtype') === type);
  });

  const fileGroup = document.getElementById('visual-file-group');
  const sizeGroup = document.getElementById('visual-size-group');
  const optVideoAudio = document.getElementById('opt-audio-video');
  const audioSelect = document.getElementById('trig-audio-source');

  if (type === 'none') {
    fileGroup.style.display = 'none';
    sizeGroup.style.display = 'none';
    if (optVideoAudio) optVideoAudio.disabled = true;
    if (audioSelect.value === 'video') audioSelect.value = 'custom';
    onAudioSourceChange(audioSelect.value);
  } else {
    fileGroup.style.display = 'block';
    sizeGroup.style.display = 'block';
    if (optVideoAudio) optVideoAudio.disabled = (type !== 'video');
    if (type !== 'video' && audioSelect.value === 'video') {
      audioSelect.value = 'custom';
      onAudioSourceChange('custom');
    }
  }
  if (typeof populateMediaSelect === 'function') populateMediaSelect();
  if (typeof updateLivePreviewVisual === 'function') updateLivePreviewVisual();
}

function onAudioSourceChange(src) {
  const customGroup = document.getElementById('audio-custom-file-group');
  const chimeGroup = document.getElementById('audio-chime-group');

  if (src === 'custom') {
    customGroup.style.display = 'block';
    chimeGroup.style.display = 'none';
  } else if (src === 'chime') {
    customGroup.style.display = 'none';
    chimeGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
    chimeGroup.style.display = 'none';
  }
}

function toggleBannerField(checked) {
  document.getElementById('banner-text-group').style.display = checked ? 'block' : 'none';
  updateLivePreviewCaption();
}

function setDurationQuick(sec) {
  document.getElementById('trig-duration').value = sec;
  updateLivePreviewDuration();
}

// Probar la configuración actual del formulario tanto en el monitor local como en OBS
function testCurrentEditorTrigger() {
  const trig = getEditorTriggerData();
  playPreviewOnPanel(trig);

  // Despachar a OBS Studio mediante API
  API.testAlert({
    type: trig.video_url ? 'video' : (trig.image_url ? 'image' : 'trigger'),
    user: 'Andorina',
    reward_title: trig.reward_title,
    title: trig.title,
    message: trig.banner_text || 'Prueba de Meme en OBS',
    video_url: trig.video_url || '',
    image_url: trig.image_url || '',
    sound_url: trig.sound_url || '',
    sound_volume: trig.sound_volume,
    audio_type: trig.audio_type,
    banner_text: trig.banner_text,
    show_banner_text: trig.show_banner_text,
    banner_text_color: trig.banner_text_color,
    banner_border_color: trig.banner_border_color,
    banner_bg_style: trig.banner_bg_style,
    banner_font_size: trig.banner_font_size,
    banner_font_family: trig.banner_font_family,
    banner_position: trig.banner_position,
    banner_animation: trig.banner_animation,
    position_mode: trig.position_mode,
    custom_x: trig.custom_x,
    custom_y: trig.custom_y,
    size: trig.size,
    duration: trig.duration,
    accent: trig.accent || '#57D6C4',
    special_action: trig.special_action || 'none',
    special_action_param: trig.special_action_param || ''
  }).catch(() => {});
}
