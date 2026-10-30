
function simulateChatMessage(type) {
  if (type === 'normal') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'LurkerCurioso', message: '¡Buenas a todos, primer día que paso por el directo!', color: '#94A3B8', badges: '' });
  } else if (type === 'follower') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'MakerFan', message: '¡Acabo de dejar mi follow! Me encanta el proyecto y el setup. 💜', color: '#38BDF8', badges: 'follower/1' });
  } else if (type === 'sub') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'AlexSub', message: '¡Renuevo la sub de nivel 1! 🛠️ A tope con el canal.', color: '#F59E0B', badges: 'subscriber/6' });
  } else if (type === 'mod') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'SuperMod', message: 'Recordad que tenéis los enlaces del stream en la descripción.', color: '#22C55E', badges: 'moderator/1' });
  } else if (type === 'vip') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'ColaboradorVIP', message: '¿A qué temperatura pusiste la plancha térmica?', color: '#EC4899', badges: 'vip/1' });
  } else if (type === 'broadcaster') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'AndorinaStreamer', message: '¡Gracias por acompañarme en este directo! 👑', color: '#EF4444', badges: 'broadcaster/1' });
  } else if (type === 'emotes') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'HypeMachine', message: '¡Vamoooos que funciona a la primera! 🎉🔥🚀', color: '#8B5CF6', badges: 'subscriber/12,artist-badge/1' });
  }
  setTimeout(refreshChatLiveFeed, 300);
}



async function saveChatControls() {
  if (!cachedWidgetsConfig) return;
    if (!cachedWidgetsConfig.chat.styles) cachedWidgetsConfig.chat.styles = {};
    const s = cachedWidgetsConfig.chat.styles;
    const presetId = document.getElementById('cfg-chat-preset-select')?.value || 'maker_glass';
    cachedWidgetsConfig.chat.activePreset = presetId;
    s.themePreset = presetId;
    s.activePreset = presetId;
    s.shape = document.getElementById('cfg-chat-shape')?.value || (cachedWidgetsConfig && cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.styles && cachedWidgetsConfig.chat.styles.shape) || 'rounded';
    s.bgType = document.getElementById('cfg-chat-bgtype')?.value || 'glass';
    s.bgColor = document.getElementById('cfg-chat-bgcolor')?.value || '#191D21';
    s.bgGradient = document.getElementById('cfg-chat-bggrad')?.value || '#0B0D0F';
    s.borderStyle = document.getElementById('cfg-chat-borderstyle')?.value || 'left_neon';
    s.borderWidth = parseInt(document.getElementById('cfg-chat-borderwidth')?.value, 10) || 3;
    s.borderColor = document.getElementById('cfg-chat-border')?.value || '#57D6C4';
    s.accentColor = s.borderColor;
    s.glowIntensity = parseInt(document.getElementById('cfg-chat-glow')?.value, 10) || 40;
    s.fontFamily = document.getElementById('cfg-chat-font')?.value || 'outfit';
    s.fontSize = parseInt(document.getElementById('cfg-chat-size')?.value, 10) || 14;
    s.bgOpacity = parseInt(document.getElementById('cfg-chat-opacity')?.value, 10) || 88;
    s.fadeSeconds = parseInt(document.getElementById('cfg-chat-fade')?.value, 10) || 18;
    s.showBadges = document.getElementById('cfg-chat-badges')?.checked !== false;
    s.hideBotCommands = document.getElementById('cfg-chat-hide-cmd')?.checked !== false;
    s.hideBotUsers = document.getElementById('cfg-chat-hide-bots')?.checked !== false;
    s.soundNotify = document.getElementById('cfg-chat-sound')?.checked === true;
    s.autoParticles = document.getElementById('cfg-chat-particles')?.checked !== false;
    s.customCSS = document.getElementById('cfg-chat-custom-css')?.value || '';

    s.roleColors = {
      broadcaster: document.getElementById('cfg-chat-role-broadcaster')?.value || '#EF4444',
      moderator: document.getElementById('cfg-chat-role-moderator')?.value || '#22C55E',
      vip: document.getElementById('cfg-chat-role-vip')?.value || '#EC4899',
      subscriber: document.getElementById('cfg-chat-role-subscriber')?.value || '#F59E0B',
      artist: document.getElementById('cfg-chat-role-artist')?.value || '#8B5CF6',
      follower: document.getElementById('cfg-chat-role-follower')?.value || '#38BDF8',
      viewer: document.getElementById('cfg-chat-role-viewer')?.value || '#94A3B8'
    };

    // Actualizar también en el array de presets si existe
    const curP = (cachedWidgetsConfig.chat.presets || []).find(p => p.id === presetId);
    if (curP) {
      curP.shape = s.shape;
      curP.bgType = s.bgType;
      curP.bgColor = s.bgColor;
      curP.bgGradient = s.bgGradient;
      curP.borderStyle = s.borderStyle;
      curP.borderWidth = s.borderWidth;
      curP.borderColor = s.borderColor;
      curP.accentColor = s.borderColor;
      curP.glowIntensity = s.glowIntensity;
      curP.fontFamily = s.fontFamily;
      curP.fontSize = s.fontSize;
      curP.bgOpacity = s.bgOpacity;
      curP.fadeSeconds = s.fadeSeconds;
      curP.roleColors = s.roleColors;
      curP.customCSS = s.customCSS;
    }
    if (cachedWidgetsConfig.timer && cachedWidgetsConfig.timer.sameStyleAsChat) {
      await copyStylesFromChatToTimer(false);
    }

}



// Registro del módulo Chat
window.renderChatShortcuts = renderChatShortcuts;
window.triggerChatShortcut = triggerChatShortcut;
window.renderChatControls = renderChatControls;
window.saveChatControls = saveChatControls;

window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['chat'] = {
  renderControls: renderChatControls,
  saveControls: saveChatControls,
  renderShortcuts: renderChatShortcuts,
  updatePreview: typeof updateChatPipPreview === 'function' ? updateChatPipPreview : () => {}
};

