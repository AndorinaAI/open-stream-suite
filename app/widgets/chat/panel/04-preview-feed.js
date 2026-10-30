
function updateChatPipPreview() {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (!iframe || currentMiniAppWidget !== 'chat') return;

  const presetId = document.getElementById('cfg-chat-preset-select')?.value || 'maker_glass';
  const shape = document.getElementById('cfg-chat-shape')?.value || (cachedWidgetsConfig && cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.styles && cachedWidgetsConfig.chat.styles.shape) || 'rounded';
  const bgType = document.getElementById('cfg-chat-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-chat-bgcolor')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-chat-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-chat-borderstyle')?.value || 'left_neon';
  const borderWidth = parseInt(document.getElementById('cfg-chat-borderwidth')?.value, 10) || 3;
  const borderColor = document.getElementById('cfg-chat-border')?.value || '#57D6C4';
  const glowIntensity = parseInt(document.getElementById('cfg-chat-glow')?.value, 10) || 40;
  const fontFamily = document.getElementById('cfg-chat-font')?.value || 'outfit';
  const fontSize = parseInt(document.getElementById('cfg-chat-size')?.value, 10) || 14;
  const bgOpacity = parseInt(document.getElementById('cfg-chat-opacity')?.value, 10) || 88;
  const fadeSeconds = parseInt(document.getElementById('cfg-chat-fade')?.value, 10) || 18;
  const customCSS = document.getElementById('cfg-chat-custom-css')?.value || '';

  const roleColors = {
    broadcaster: document.getElementById('cfg-chat-role-broadcaster')?.value || '#EF4444',
    moderator: document.getElementById('cfg-chat-role-moderator')?.value || '#22C55E',
    vip: document.getElementById('cfg-chat-role-vip')?.value || '#EC4899',
    subscriber: document.getElementById('cfg-chat-role-subscriber')?.value || '#F59E0B',
    artist: document.getElementById('cfg-chat-role-artist')?.value || '#8B5CF6',
    follower: document.getElementById('cfg-chat-role-follower')?.value || '#38BDF8',
    viewer: document.getElementById('cfg-chat-role-viewer')?.value || '#94A3B8'
  };

  const styles = {
    themePreset: presetId,
    activePreset: presetId,
    shape,
    bgType,
    bgColor,
    bgGradient,
    borderStyle,
    borderWidth,
    borderColor,
    accentColor: borderColor,
    glowIntensity,
    fontFamily,
    fontSize,
    bgOpacity,
    fadeSeconds,
    roleColors,
    customCSS
  };

  try {
    if (iframe.contentWindow && iframe.contentWindow.applyChatConfig) {
      iframe.contentWindow.applyChatConfig(styles);
    }
  } catch (e) {}
}

// ----------------------------------------------------------------------
// LIVE FEED & SPOTLIGHT
// ----------------------------------------------------------------------
async function refreshChatLiveFeed() {
  const container = document.getElementById('chat-live-feed-list');
  if (!container) return;

  try {
    const res = await API.triggerWidgetAction('chat', 'get_recent');
    const messages = (res && res.messages) || [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div style="font-size: 12px; color: var(--color-text-dim); text-align: center; padding: 14px;">
          💬 No hay mensajes en el buffer de chat todavía.<br>
          <span style="font-size: 11px;">Escribe algo en Twitch o pulsa un botón en el simulador abajo para probar.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    // Mostrar del más reciente al más antiguo, sin interpolar texto en HTML.
    const reversed = [...messages].reverse();
    reversed.forEach(m => {
      const row = document.createElement('div');
      row.className = 'chat-feed-row';

      const userBox = document.createElement('div');
      userBox.className = 'chat-feed-user';
      userBox.style.color = m.color || '#57D6C4';
      userBox.style.minWidth = '120px';
      const icon = document.createElement('span');
      icon.textContent = '👤';
      const userName = document.createElement('span');
      userName.textContent = m.user || 'Viewer';
      userBox.append(icon, userName);

      const textBox = document.createElement('div');
      textBox.className = 'chat-feed-text';
      textBox.title = m.message || '';
      textBox.textContent = m.message || '';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-action-primary';
      button.style.cssText = 'white-space: nowrap; font-size: 10px; padding: 3px 8px;';
      button.textContent = '📌 Destacar';
      button.addEventListener('click', () => triggerSpotlightFromFeed(m.user || 'Viewer', m.message || '', m.color || '#57D6C4'));

      row.append(userBox, textBox, button);
      container.appendChild(row);
    });

  } catch (err) {
    container.innerHTML = '<div style="font-size: 11px; color: #EF4444; padding: 8px;">Error al cargar mensajes del feed.</div>';
  }
}

async function triggerSpotlightFromFeed(user, message, color) {
  await API.triggerWidgetAction('chat', 'spotlight', { active: true, user, message, color: color || '#57D6C4' });
  if (cachedWidgetsConfig && cachedWidgetsConfig.chat) {
    cachedWidgetsConfig.chat.spotlight = { active: true, user, message, color: color || '#57D6C4' };
  }
  const banner = document.getElementById('spotlight-active-banner');
  if (banner) {
    banner.replaceChildren();
    banner.style.background = 'rgba(87,214,196,0.12)';
    banner.style.borderColor = 'var(--color-accent-cyan)';
    const info = document.createElement('div');
    const label = document.createElement('span');
    label.style.cssText = 'font-size: 11px; font-weight: 700; color: #57D6C4; font-family: var(--font-tech);';
    label.textContent = '🟢 DESTACADO EN OBS AHORA MISMO:';
    const line = document.createElement('div');
    line.style.cssText = 'font-size: 13px; color: #fff; margin-top: 2px;';
    const strong = document.createElement('strong');
    strong.textContent = `${user}:`;
    line.append(strong, document.createTextNode(` "${message}"`));
    info.append(label, line);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn-stage-preset';
    remove.style.cssText = 'color: #EF4444; border-color: #EF4444; font-size: 11px; padding: 4px 10px;';
    remove.textContent = '✕ Quitar de Pantalla';
    remove.addEventListener('click', () => triggerSpotlightAction(false));
    banner.append(info, remove);
  }
}

async function triggerSpotlightAction(active) {
  if (!active) {
    await API.triggerWidgetAction('chat', 'spotlight', { active: false });
    if (cachedWidgetsConfig && cachedWidgetsConfig.chat) {
      cachedWidgetsConfig.chat.spotlight = { active: false, user: '', message: '', color: '#57D6C4' };
    }
    const banner = document.getElementById('spotlight-active-banner');
    if (banner) {
      banner.style.background = 'rgba(0,0,0,0.3)';
      banner.style.borderColor = 'var(--color-border-dim)';
      banner.innerHTML = `
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #94A3B8; font-family: var(--font-tech);">
            ⚪ NINGÚN MENSAJE FIJADO EN OBS
          </span>
        </div>
      `;
    }
    return;
  }
  const user = document.getElementById('cfg-spotlight-user')?.value.trim() || 'ViewerDestacado';
  const message = document.getElementById('cfg-spotlight-msg')?.value.trim() || '¿Podrías enseñar el esquema de conexiones de la placa?';
  await triggerSpotlightFromFeed(user, message, '#57D6C4');
}
