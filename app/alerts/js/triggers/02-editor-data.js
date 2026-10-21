
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
