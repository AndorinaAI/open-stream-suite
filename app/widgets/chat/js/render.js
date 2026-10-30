/**
 * app/widgets/chat/js/render.js — Renderizado de mensajes, mensajes destacados (Spotlight) y efectos de sonido
 */

window.ChatRenderer = (function() {
  const chatBox = document.getElementById('chat-box');
  const KNOWN_BOTS = ['nightbot', 'streamelements', 'streamlabs', 'wizebot', 'fossabot', 'moobot', 'botisimo'];

  function playChatPopSound() {
    const chatConfig = window.ChatStyles?.config || {};
    if (!chatConfig.soundNotify) return;
    if (window.SoundSynth) {
      window.SoundSynth.playTone('pop');
    }
  }

  // Escape de respaldo: si window.ChatParser no estuviera disponible, el
  // nombre de usuario no debe inyectarse sin escapar dentro de innerHTML.
  function escapeFallback(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function renderMessage(username, color, text, emotesTag, badgesStr = '') {
    if (!text || !chatBox) return;
    const S = window.ChatStyles;
    const P = window.ChatParser;
    const chatConfig = S?.config || {};
    const isPreviewMode = S?.isPreviewMode;

    // Filtros de bots
    if (chatConfig.hideBotCommands && text.startsWith('!')) return;
    if (chatConfig.hideBotUsers && KNOWN_BOTS.includes(username.toLowerCase())) return;

    const roleClasses = [];
    if (badgesStr) {
      if (badgesStr.includes('broadcaster')) roleClasses.push('role-broadcaster');
      if (badgesStr.includes('moderator')) roleClasses.push('role-moderator');
      if (badgesStr.includes('vip')) roleClasses.push('role-vip');
      if (badgesStr.includes('subscriber')) roleClasses.push('role-subscriber');
      if (badgesStr.includes('artist')) roleClasses.push('role-artist');
      if (badgesStr.includes('follower')) roleClasses.push('role-follower');
    }
    if (roleClasses.length === 0) {
      roleClasses.push('role-viewer');
    }

    let finalColor = color;
    const roleColors = chatConfig.roleColors || {};
    if (!finalColor || finalColor === '#57D6C4' || finalColor === '#FFFFFF') {
      if (roleClasses.includes('role-broadcaster') && roleColors.broadcaster) finalColor = roleColors.broadcaster;
      else if (roleClasses.includes('role-moderator') && roleColors.moderator) finalColor = roleColors.moderator;
      else if (roleClasses.includes('role-vip') && roleColors.vip) finalColor = roleColors.vip;
      else if (roleClasses.includes('role-subscriber') && roleColors.subscriber) finalColor = roleColors.subscriber;
      else if (roleClasses.includes('role-artist') && roleColors.artist) finalColor = roleColors.artist;
      else if (roleClasses.includes('role-follower') && roleColors.follower) finalColor = roleColors.follower;
      else if (roleClasses.includes('role-viewer') && roleColors.viewer) finalColor = roleColors.viewer;
    }
    if (!finalColor) finalColor = roleColors.viewer || '#94A3B8';

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${roleClasses.join(' ')}`.trim();
    msgEl.style.setProperty('--user-color', finalColor);
    msgEl.setAttribute('data-user', username.toLowerCase());
    if (roleClasses.length) {
      msgEl.setAttribute('data-role', roleClasses[0].replace('role-', ''));
    }

    const badgesHtml = P ? P.parseBadges(badgesStr) : '';

    const header = document.createElement('div');
    header.className = 'msg-header';
    header.innerHTML = `
      ${badgesHtml}
      <span class="username-text" style="color: ${finalColor};">${P ? P.escapeHtml(username) : escapeFallback(username)}</span>
    `;
    msgEl.appendChild(header);

    const body = document.createElement('div');
    body.className = 'msg-body';
    // Si el parser no estuviera disponible se usa textContent (nunca innerHTML)
    // para no inyectar texto de IRC sin escapar como HTML.
    if (P) {
      body.innerHTML = P.formatEmotes(text, emotesTag);
    } else {
      body.textContent = text;
    }
    msgEl.appendChild(body);

    chatBox.appendChild(msgEl);
    playChatPopSound();

    const max = chatConfig.maxMessages || 12;
    while (chatBox.children.length > max) {
      chatBox.firstElementChild.remove();
    }

    const fadeSec = isPreviewMode ? 0 : (chatConfig.fadeSeconds || 18);
    if (fadeSec > 0) {
      setTimeout(() => {
        msgEl.classList.add('fading');
        setTimeout(() => msgEl.remove(), 600);
      }, fadeSec * 1000);
    }

    // Físicas de emoticonos reactivas
    if (chatConfig.autoParticles && window.ParticleEngine) {
      const triggered = P ? P.checkChatParticleTriggers(text) : false;
      if (!triggered) {
        const lower = text.toLowerCase();
        if (lower.includes('🎉') || lower.includes('!fiesta')) window.ParticleEngine.explode('🎉', 35);
        else if (lower.includes('🔥') || lower.includes('!hype')) window.ParticleEngine.explode('🔥', 35);
        else if (lower.includes('🚀') || lower.includes('!despegue')) window.ParticleEngine.explode('🚀', 30);
        else if (lower.includes('❤️') || lower.includes('!amor')) window.ParticleEngine.explode('❤️', 30);
        else if (lower.includes('⭐') || lower.includes('!gg')) window.ParticleEngine.explode('⭐', 35);
      }
    }
  }

  function handleSpotlightMessage(data) {
    const box = document.getElementById('chat-spotlight-box');
    if (!box) return;

    if (!data || !data.active || !data.message) {
      box.style.display = 'none';
      return;
    }

    const authorEl = document.getElementById('spotlight-author');
    const contentEl = document.getElementById('spotlight-content');
    if (authorEl) {
      authorEl.textContent = data.user || 'Espectador';
      authorEl.style.color = data.color || '#57D6C4';
    }
    if (contentEl) {
      contentEl.textContent = data.message;
    }
    box.style.display = 'block';

    if (data.autoDismiss !== false) {
      setTimeout(() => {
        if (box.style.display === 'block') box.style.display = 'none';
      }, 25000);
    }
  }

  function clearChat() {
    if (chatBox) chatBox.innerHTML = '';
  }

  return {
    renderMessage,
    handleSpotlightMessage,
    playChatPopSound,
    clearChat
  };
})();
