// ====================================================================
// MÓDULO WIDGET: PROMO Y SHOUTOUT (VISUAL STUDIO, QR Y PRESETS)
// ====================================================================

function renderPromoShortcuts() {
  const container = document.getElementById('promo-shortcuts-container');
  if (!container || !cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;

  const tr = (k, fb) => (window.i18n && window.i18n.has && window.i18n.has(k) ? window.i18n.tr(k) : fb) || fb;
  const shortcuts = (cachedWidgetsConfig.promo.shortcuts || []).filter(s => s.pinned !== false);
  container.innerHTML = '';

  shortcuts.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'widget-shortcut-btn';
    const color = s.color || '#FF783F';
    btn.style.borderColor = `${color}60`;
    btn.style.boxShadow = `0 0 10px ${color}15`;
    const label = (window.i18n && window.i18n.has && window.i18n.has('widgets.shortcuts.' + s.id) ? window.i18n.tr('widgets.shortcuts.' + s.id) : null) || s.label || s.title || s.id;
    btn.innerHTML = `
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></span>
      <span>${label}</span>
    `;
    btn.title = `${tr('widgets.launch_promo', 'Lanzar promo')}: ${s.title || label}`;
    btn.onclick = () => triggerPromoShortcut(s.id);
    container.appendChild(btn);
  });
}


async function triggerPromoShortcut(shortcutId) {
  const sc = (cachedWidgetsConfig?.promo?.shortcuts || []).find(s => s.id === shortcutId);
  if (!sc) return;
  await API.triggerWidgetAction('promo', 'promote', {
    type: sc.type,
    streamer: sc.streamer || document.getElementById('shoutout-username')?.value.trim() || 'andorina',
    title: sc.title || sc.label,
    subtitle: sc.subtitle || '',
    price: sc.price || '',
    link: sc.link || '',
    show_qr: sc.showQR !== false,
    color: sc.color || '#57D6C4'
  });
}
