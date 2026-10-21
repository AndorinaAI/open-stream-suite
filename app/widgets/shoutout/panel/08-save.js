
async function triggerShoutout() {
  const usernameInput = document.getElementById('shoutout-username');
  const user = (usernameInput?.value || '').trim().replace(/^@/, '');
  if (!user) {
    alert('Introduce un usuario de Twitch para promocionar.');
    return;
  }

  await API.triggerWidgetAction('promo', 'promote', {
    type: 'shoutout',
    streamer: user,
    title: user,
    display_name: user,
    link: `https://twitch.tv/${user.toLowerCase()}`,
    show_qr: true
  });

  alert(`📢 ¡Promocionando a @${user} en pantalla!`);
}



async function savePromoControls() {
  if (!cachedWidgetsConfig) return;
    if (!cachedWidgetsConfig.promo) cachedWidgetsConfig.promo = {};
    const pr = cachedWidgetsConfig.promo;
    pr.duration = (parseInt(document.getElementById('cfg-promo-duration')?.value, 10) || 8) * 1000;
    pr.soundChime = document.getElementById('cfg-promo-sound')?.checked !== false;
    pr.sameStyleAsChat = document.getElementById('cfg-promo-same-as-chat')?.checked === true;

    const activePresetId = document.getElementById('cfg-promo-preset-select')?.value || 'streamer_neon';
    pr.activePreset = activePresetId;

    if (!pr.styles) pr.styles = {};
    const s = pr.styles;
    s.themePreset = activePresetId;
    s.shape = document.getElementById('cfg-promo-shape')?.value || 'rounded';
    s.bgType = document.getElementById('cfg-promo-bgtype')?.value || 'glass';
    s.bgColor = document.getElementById('cfg-promo-bgcolor')?.value || '#191D21';
    s.bgGradient = document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F';
    s.borderStyle = document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon';
    s.borderColor = document.getElementById('cfg-promo-border')?.value || '#57D6C4';
    s.accentColor = s.borderColor;
    s.glowIntensity = parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45;
    s.fontFamily = document.getElementById('cfg-promo-font')?.value || 'outfit';
    s.animation = document.getElementById('cfg-promo-anim')?.value || 'slide_up';
    s.customCSS = document.getElementById('cfg-promo-custom-css')?.value || '';

    // Actualizar preset en la lista de presets
    const curP = (pr.presets || []).find(p => p.id === activePresetId);
    if (curP) {
      curP.shape = s.shape;
      curP.bgType = s.bgType;
      curP.bgColor = s.bgColor;
      curP.bgGradient = s.bgGradient;
      curP.borderStyle = s.borderStyle;
      curP.borderColor = s.borderColor;
      curP.glowIntensity = s.glowIntensity;
      curP.fontFamily = s.fontFamily;
      curP.animation = s.animation;
      curP.customCSS = s.customCSS;
    }

    if (pr.sameStyleAsChat) {
      await copyStylesFromChatToPromo(false);
    }

}



// Registro del módulo Promo
window.renderPromoShortcuts = renderPromoShortcuts;
window.triggerPromoShortcut = triggerPromoShortcut;
window.renderPromoControls = renderPromoControls;
window.savePromoControls = savePromoControls;

window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['promo'] = {
  renderControls: renderPromoControls,
  saveControls: savePromoControls,
  renderShortcuts: renderPromoShortcuts,
  updatePreview: typeof updatePromoPipPreview === 'function' ? updatePromoPipPreview : () => {}
};

