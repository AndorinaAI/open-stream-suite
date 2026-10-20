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

function getEditorTriggerData() {
  const id = document.getElementById('trig-editing-id').value || ('trig_' + Date.now());
  const title = document.getElementById('trig-title').value.trim() || 'Trigger de Prueba';
  const reward_title = document.getElementById('trig-reward-manual').value.trim() || document.getElementById('twitch-rewards-select').value;
  const chat_command = document.getElementById('trig-command').value.trim();
  const command_permissions = document.getElementById('trig-permission').value;
  const cooldown_seconds = parseInt(document.getElementById('trig-cooldown').value, 10) || 15;
  const size = document.getElementById('trig-size').value;

  const visualUrl = document.getElementById('trig-media-custom-url').value.trim() || document.getElementById('trig-media-file').value;
  const video_url = (currentVisualType === 'video') ? visualUrl : '';
  const image_url = (currentVisualType === 'image') ? visualUrl : '';

  const audio_type = document.getElementById('trig-audio-source').value;
  const sound_url = (audio_type === 'custom') ? (document.getElementById('trig-sound-custom-url').value.trim() || document.getElementById('trig-sound-file').value) : '';
  const chime_type = document.getElementById('trig-chime-type').value;
  const sound_volume = (parseInt(document.getElementById('trig-volume').value, 10) || 85) / 100;

  const show_banner_text = document.getElementById('trig-show-banner').checked;
  const banner_text = document.getElementById('trig-banner-text').value.trim();
  const banner_text_color = document.getElementById('trig-banner-text-color')?.value || '#FFFFFF';
  const banner_border_color = document.getElementById('trig-banner-border-color')?.value || '#57D6C4';
  const banner_bg_style = document.getElementById('trig-banner-bg-style')?.value || 'dark_glass';
  const banner_font_size = document.getElementById('trig-banner-font-size')?.value || 'medium';
  const banner_font_family = document.getElementById('trig-banner-font-family')?.value || 'tech';
  const banner_position = document.getElementById('trig-banner-position')?.value || 'below';
  const banner_animation = document.getElementById('trig-banner-animation')?.value || 'pop';

  // Acción Especial (Twitch Chat o OBS Overlay)
  const special_action = document.getElementById('trig-special-action')?.value || 'none';
  let special_action_param = '';
  if (special_action === 'twitch_emote_only' || special_action === 'twitch_slow_mode' || special_action === 'twitch_sub_only') {
    special_action_param = parseInt(document.getElementById('trig-action-duration')?.value, 10) || 60;
  } else if (special_action === 'overlay_explode_emotes') {
    special_action_param = document.getElementById('trig-action-emotes')?.value.trim() || '🎉,🔥,✨,❤️,⭐';
  } else if (special_action === 'overlay_timer_add') {
    special_action_param = parseInt(document.getElementById('trig-action-timer-sec')?.value, 10) || 60;
  }

  // Color de acento: estrictamente heredado de la recompensa de Twitch si no es solo comando
  let accent = document.getElementById('trig-accent-color')?.value || '#57D6C4';
  if (currentActivationMode !== 'command_only' && reward_title && twitchRewardsList.length > 0) {
    const match = twitchRewardsList.find(r => r.title.toLowerCase() === reward_title.toLowerCase());
    if (match && match.color) {
      accent = match.color;
    }
  }

  const duration = (parseInt(document.getElementById('trig-duration').value, 10) || 5) * 1000;
  const position_mode = document.getElementById('trig-pos-mode').value;
  const custom_x = parseInt(document.getElementById('trig-custom-x').value, 10) || 50;
  const custom_y = parseInt(document.getElementById('trig-custom-y').value, 10) || 50;

  return {
    id,
    title,
    activation_mode: currentActivationMode,
    reward_title,
    chat_command,
    command_permissions,
    cooldown_seconds,
    visual_type: currentVisualType,
    video_url,
    image_url,
    size,
    audio_type,
    sound_url,
    chime_type,
    sound_volume,
    show_banner_text,
    banner_text,
    banner_text_color,
    banner_border_color,
    banner_bg_style,
    banner_font_size,
    banner_font_family,
    banner_position,
    banner_animation,
    duration,
    position_mode,
    custom_x,
    custom_y,
    enabled: true,
    accent,
    special_action,
    special_action_param
  };
}

async function loadTriggers() {
  try {
    const data = await API.getTriggers();
    cachedTriggers = data.triggers || [];
    renderTriggers();
  } catch (e) {
    console.error('Error al cargar triggers:', e);
  }
}

function renderTriggers() {
  const box = document.getElementById('triggers-list-box');
  const badge = document.getElementById('trigger-count-badge');
  if (!box) return;
  if (badge) badge.textContent = `${cachedTriggers.length} ACTIVOS`;

  if (cachedTriggers.length === 0) {
    box.innerHTML = '<div style="color: var(--color-text-dim); font-size: 13px;">No hay triggers configurados aún. Rellena el formulario de la derecha para crear uno.</div>';
    return;
  }

  box.innerHTML = '';
  cachedTriggers.forEach((trig, idx) => {
    const item = document.createElement('div');
    item.className = 'trigger-card-item';

    // Color real de la recompensa de Twitch o color de acento del trigger
    let triggerColor = trig.accent || '#57D6C4';
    if (trig.reward_title && twitchRewardsList.length > 0) {
      const match = twitchRewardsList.find(r => r.title.toLowerCase() === trig.reward_title.toLowerCase());
      if (match && match.color) {
        triggerColor = match.color;
      }
    }
    item.style.borderLeft = `3px solid ${triggerColor}`;

    // Badges con color real
    const actMode = trig.activation_mode || (trig.reward_title && trig.chat_command ? 'both' : (trig.chat_command ? 'command_only' : 'points_only'));
    let actBadge = '';
    const dotHtml = `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${triggerColor}; box-shadow:0 0 6px ${triggerColor}; margin-right:4px;"></span>`;
    const pointsBadgeStyle = `background: ${triggerColor}20; border: 1px solid ${triggerColor}80; color: ${triggerColor}; font-weight: 700; box-shadow: 0 0 8px ${triggerColor}25;`;

    if (actMode === 'points_only') {
      actBadge = `<span class="badge-pill" style="${pointsBadgeStyle}">${dotHtml}🪙 Solo Puntos: ${trig.reward_title || 'Twitch'}</span>`;
    } else if (actMode === 'command_only') {
      actBadge = `<span class="badge-pill badge-command">💬 ${trig.chat_command} [${trig.command_permissions || 'Todos'}]</span>`;
    } else {
      actBadge = `<span class="badge-pill" style="${pointsBadgeStyle}">${dotHtml}🪙 ${trig.reward_title || 'Puntos'}</span> <span class="badge-pill badge-command">💬 ${trig.chat_command || '!cmd'}</span>`;
    }

    // Badge de Acción Especial
    let specialActionBadge = '';
    if (trig.special_action && trig.special_action !== 'none') {
      if (trig.special_action === 'twitch_emote_only') {
        specialActionBadge = `<span class="badge-pill" style="background: rgba(139, 92, 246, 0.2); border: 1px solid #8B5CF6; color: #C4B5FD;">💬 Modo Emotes (${trig.special_action_param || 60}s)</span>`;
      } else if (trig.special_action === 'twitch_slow_mode') {
        specialActionBadge = `<span class="badge-pill" style="background: rgba(245, 158, 11, 0.2); border: 1px solid #F59E0B; color: #FBBF24;">🐢 Modo Lento</span>`;
      } else if (trig.special_action === 'twitch_sub_only') {
        specialActionBadge = `<span class="badge-pill" style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #6EE7B7;">⭐ Modo Subs</span>`;
      } else if (trig.special_action === 'twitch_clear_chat') {
        specialActionBadge = `<span class="badge-pill" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; color: #FCA5A5;">🧹 Limpiar Chat</span>`;
      } else if (trig.special_action === 'overlay_explode_emotes') {
        specialActionBadge = `<span class="badge-pill" style="background: rgba(236, 72, 153, 0.2); border: 1px solid #EC4899; color: #F472B6;">🎆 Explosión Emojis</span>`;
      } else if (trig.special_action === 'overlay_timer_add') {
        specialActionBadge = `<span class="badge-pill" style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3B82F6; color: #93C5FD;">⏱️ +${trig.special_action_param || 60}s Timer</span>`;
      }
    }

    const mediaType = trig.video_url ? '🎬 Vídeo' : (trig.image_url ? '🖼️ GIF' : '🎵 Solo Audio');
    const posText = trig.position_mode === 'random' ? '🎲 Aleatorio' : `📍 X:${trig.custom_x || 50}% Y:${trig.custom_y || 50}%`;

    item.innerHTML = `
      <div class="trigger-item-info">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${triggerColor}; box-shadow: 0 0 8px ${triggerColor};"></span>
          <span class="trigger-name-title">${trig.title || 'Trigger'}</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px;">
          ${actBadge}
          ${specialActionBadge}
          <span class="badge-pill badge-media">${mediaType}</span>
          <span class="badge-pill badge-pos">${posText}</span>
          <span style="font-family: var(--font-tech); font-size: 10px; color: var(--color-text-dim); align-self: center;">
            ⏱️ ${Math.round((trig.duration || 5000) / 1000)}s
          </span>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-action-test" onclick="fireTrigger(${idx})" title="Probar en monitor y OBS">▶️ Probar</button>
        <button class="btn-action-test" onclick="editTrigger(${idx})" title="Editar configuración">✏️ Editar</button>
        <button class="btn-action-danger" onclick="deleteTrigger(${idx})" title="Eliminar">🗑️</button>
      </div>
    `;
    box.appendChild(item);
  });
}

function fireTrigger(idx) {
  const trig = cachedTriggers[idx];
  if (!trig) return;
  playPreviewOnPanel(trig);

  // Disparar a OBS Studio
  API.testAlert({
    type: trig.video_url ? 'video' : (trig.image_url ? 'image' : 'trigger'),
    user: 'Andorina',
    reward_title: trig.reward_title,
    title: trig.title,
    message: trig.banner_text || trig.message || 'Canjeado con puntos de canal',
    video_url: trig.video_url || '',
    image_url: trig.image_url || '',
    sound_url: trig.sound_url || '',
    sound_volume: typeof trig.sound_volume === 'number' ? trig.sound_volume : 0.85,
    audio_type: trig.audio_type || 'custom',
    banner_text: trig.banner_text,
    show_banner_text: trig.show_banner_text,
    banner_text_color: trig.banner_text_color,
    banner_border_color: trig.banner_border_color,
    banner_bg_style: trig.banner_bg_style,
    banner_font_size: trig.banner_font_size,
    banner_font_family: trig.banner_font_family,
    banner_position: trig.banner_position,
    banner_animation: trig.banner_animation,
    position_mode: trig.position_mode || trig.position || 'center',
    custom_x: trig.custom_x,
    custom_y: trig.custom_y,
    size: trig.size || 'medium',
    duration: trig.duration || 5000,
    volume: trig.sound_volume || 0.85,
    accent: trig.accent || '#57D6C4',
    special_action: trig.special_action || 'none',
    special_action_param: trig.special_action_param || ''
  }).catch(() => {});
}

function editTrigger(idx) {
  const trig = cachedTriggers[idx];
  if (!trig) return;

  document.getElementById('trig-editing-id').value = trig.id;
  document.getElementById('trig-title').value = trig.title || '';
  document.getElementById('form-heading-title').textContent = `✏️ EDITANDO: ${trig.title || 'Trigger'}`;
  const modeBadge = document.getElementById('trigger-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = 'EDITANDO';
    modeBadge.style.color = '#F59E0B';
    modeBadge.style.borderColor = '#F59E0B';
    modeBadge.style.background = 'rgba(245, 158, 11, 0.15)';
  }
  document.getElementById('btn-cancel-edit').style.display = 'inline-flex';
  document.getElementById('btn-save-trigger').textContent = '💾 Actualizar Trigger';
  setTriggerEditorTab('activation');

  // Modo de activación
  setActivationMode(trig.activation_mode || (trig.reward_title && trig.chat_command ? 'both' : (trig.chat_command ? 'command_only' : 'points_only')));
  document.getElementById('twitch-rewards-select').value = trig.reward_title || '';
  document.getElementById('trig-reward-manual').value = trig.reward_title || '';
  document.getElementById('trig-command').value = trig.chat_command || '';
  document.getElementById('trig-permission').value = trig.command_permissions || 'everyone';
  document.getElementById('trig-cooldown').value = trig.cooldown_seconds || 15;
  document.getElementById('cooldown-val-badge').textContent = (trig.cooldown_seconds || 15) + 's';

  // Acción Especial
  const specAct = trig.special_action || 'none';
  const specActSelect = document.getElementById('trig-special-action');
  if (specActSelect) specActSelect.value = specAct;
  onSpecialActionChange(specAct);
  if (trig.special_action_param) {
    if (specAct === 'twitch_emote_only' || specAct === 'twitch_slow_mode' || specAct === 'twitch_sub_only') {
      const durInput = document.getElementById('trig-action-duration');
      if (durInput) durInput.value = trig.special_action_param;
    } else if (specAct === 'overlay_explode_emotes') {
      const emInput = document.getElementById('trig-action-emotes');
      if (emInput) emInput.value = trig.special_action_param;
    } else if (specAct === 'overlay_timer_add') {
      const tmInput = document.getElementById('trig-action-timer-sec');
      if (tmInput) tmInput.value = trig.special_action_param;
    }
  }

  // Visual
  const vtype = trig.visual_type || (trig.video_url ? 'video' : (trig.image_url ? 'image' : 'none'));
  setVisualType(vtype);
  document.getElementById('trig-media-file').value = trig.video_url || trig.image_url || '';
  document.getElementById('trig-media-custom-url').value = trig.video_url || trig.image_url || '';
  document.getElementById('trig-size').value = trig.size || 'medium';

  // Audio
  document.getElementById('trig-audio-source').value = trig.audio_type || 'custom';
  onAudioSourceChange(trig.audio_type || 'custom');
  document.getElementById('trig-sound-file').value = trig.sound_url || '';
  document.getElementById('trig-sound-custom-url').value = trig.sound_url || '';
  if (trig.chime_type) document.getElementById('trig-chime-type').value = trig.chime_type;
  const volPct = Math.round((typeof trig.sound_volume === 'number' ? trig.sound_volume : 0.85) * 100);
  document.getElementById('trig-volume').value = volPct;
  document.getElementById('volume-val-badge').textContent = volPct + '%';

  // Banner y duración
  document.getElementById('trig-show-banner').checked = trig.show_banner_text !== false;
  toggleBannerField(trig.show_banner_text !== false);
  document.getElementById('trig-banner-text').value = trig.banner_text || '';
  syncBannerTextColor(trig.banner_text_color || '#FFFFFF');
  syncBannerBorderColor(trig.banner_border_color || trig.accent || '#57D6C4');
  document.getElementById('trig-banner-bg-style').value = trig.banner_bg_style || 'dark_glass';
  document.getElementById('trig-banner-font-size').value = trig.banner_font_size || 'medium';
  document.getElementById('trig-banner-font-family').value = trig.banner_font_family || 'tech';
  document.getElementById('trig-banner-position').value = trig.banner_position || 'below';
  document.getElementById('trig-banner-animation').value = trig.banner_animation || 'pop';
  syncTriggerAccentColor(trig.accent || '#57D6C4');
  syncLockedRewardColor(trig.accent || '#57D6C4');
  document.getElementById('trig-duration').value = Math.round((trig.duration || 5000) / 1000);

  // Posición
  if (trig.position_mode === 'random') {
    setRandomPosition();
  } else {
    setCustomPosition(trig.custom_x || 50, trig.custom_y || 50);
  }

  document.getElementById('trigger-editor-form').scrollIntoView({ behavior: 'smooth' });
}

function resetEditorForm() {
  document.getElementById('trigger-editor-form').reset();
  document.getElementById('trig-editing-id').value = '';
  document.getElementById('form-heading-title').textContent = '🛠️ CONFIGURADOR DE TRIGGER & MEME';
  const modeBadge = document.getElementById('trigger-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = 'NUEVO';
    modeBadge.style.color = '#57D6C4';
    modeBadge.style.borderColor = '#57D6C4';
    modeBadge.style.background = 'rgba(87, 214, 196, 0.15)';
  }
  document.getElementById('btn-cancel-edit').style.display = 'none';
  document.getElementById('btn-save-trigger').textContent = '💾 Guardar Trigger';
  setTriggerEditorTab('activation');
  setActivationMode('both');
  setVisualType('video');
  onAudioSourceChange('custom');
  setCustomPosition(50, 50);
  document.getElementById('trig-volume').value = 85;
  document.getElementById('volume-val-badge').textContent = '85%';
  document.getElementById('trig-cooldown').value = 15;
  document.getElementById('cooldown-val-badge').textContent = '15s';
  document.getElementById('trig-duration').value = 5;

  const specActSelect = document.getElementById('trig-special-action');
  if (specActSelect) specActSelect.value = 'none';
  onSpecialActionChange('none');
  if (document.getElementById('trig-action-duration')) document.getElementById('trig-action-duration').value = 60;
  if (document.getElementById('trig-action-emotes')) document.getElementById('trig-action-emotes').value = '🎉,🔥,✨,❤️,⭐,🚀,💥';
  if (document.getElementById('trig-action-timer-sec')) document.getElementById('trig-action-timer-sec').value = 60;

  syncTriggerAccentColor('#57D6C4');
  syncLockedRewardColor('#57D6C4');
  syncBannerTextColor('#FFFFFF');
  syncBannerBorderColor('#57D6C4');
  document.getElementById('trig-banner-bg-style').value = 'dark_glass';
  document.getElementById('trig-banner-font-size').value = 'medium';
  document.getElementById('trig-banner-font-family').value = 'tech';
  document.getElementById('trig-banner-position').value = 'below';
  document.getElementById('trig-banner-animation').value = 'pop';
  const borderHex = document.getElementById('trig-banner-border-color-hex');
  if (borderHex) delete borderHex.dataset.customized;
}

async function deleteTrigger(idx) {
  if (!confirm(`¿Eliminar el trigger "${cachedTriggers[idx].title}"?`)) return;
  cachedTriggers.splice(idx, 1);
  await API.saveTriggers(cachedTriggers);
  renderTriggers();
}

async function saveTrigger(e) {
  e.preventDefault();
  const trigData = getEditorTriggerData();

  if (trigData.activation_mode === 'points_only' && !trigData.reward_title) {
    alert('Por favor selecciona o escribe la Recompensa de Twitch asociada para el modo Solo Puntos.');
    return;
  }
  if (trigData.activation_mode === 'command_only' && !trigData.chat_command) {
    alert('Por favor escribe el comando de chat para el modo Solo Comando (ej. !susto).');
    return;
  }
  if (!trigData.reward_title && !trigData.chat_command) {
    alert('Por favor indica una recompensa de Twitch o un comando de chat.');
    return;
  }

  const editingId = document.getElementById('trig-editing-id').value;
  if (editingId) {
    const idx = cachedTriggers.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      cachedTriggers[idx] = trigData;
    } else {
      cachedTriggers.push(trigData);
    }
  } else {
    cachedTriggers.push(trigData);
  }

  await API.saveTriggers(cachedTriggers);
  renderTriggers();
  resetEditorForm();
  alert('✓ ¡Trigger guardado con éxito! Se ha sincronizado para tu stream.');
  playPreviewOnPanel(trigData);
}
