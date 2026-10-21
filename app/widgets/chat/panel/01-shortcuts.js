// ====================================================================
// MÓDULO WIDGET: CHAT, PARTÍCULAS Y PERSONALIZACIÓN VISUAL/CSS
// ====================================================================

function renderChatShortcuts() {
  const container = document.getElementById('chat-shortcuts-container');
  if (!container || !cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;

  const tr = (k, fb) => (window.i18n && window.i18n.has && window.i18n.has(k) ? window.i18n.tr(k) : fb) || fb;
  const shortcuts = (cachedWidgetsConfig.chat.shortcuts || []).filter(s => s.pinned !== false);
  container.innerHTML = '';

  shortcuts.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'widget-shortcut-btn';
    const color = s.color || '#EC4899';
    btn.style.borderColor = `${color}60`;
    btn.style.boxShadow = `0 0 10px ${color}15`;
    const label = (window.i18n && window.i18n.has && window.i18n.has('widgets.shortcuts.' + s.id) ? window.i18n.tr('widgets.shortcuts.' + s.id) : null) || s.label || s.id;
    btn.innerHTML = `
      <span>${label}</span>
    `;
    btn.title = `${tr('widgets.particle_rain', 'Lluvia de')}: ${s.emoji} (${s.count || 40} ${tr('widgets.particles_word', 'partículas')})`;
    btn.onclick = () => triggerChatShortcut(s.id);
    container.appendChild(btn);
  });
}



async function triggerChatShortcut(shortcutId) {
  const sc = (cachedWidgetsConfig?.chat?.shortcuts || []).find(s => s.id === shortcutId);
  if (!sc) return;
  await API.triggerWidgetAction('chat', 'explode', {
    emoji: sc.emoji,
    count: sc.count || 40
  });
}
