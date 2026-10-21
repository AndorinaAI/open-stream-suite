
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
