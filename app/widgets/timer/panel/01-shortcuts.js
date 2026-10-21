// ====================================================================
// MÓDULO WIDGET: TEMPORIZADOR (CONTROLES, PRESETS, ACCIONES Y PIP)
// ====================================================================

function renderTimerShortcuts() {
  const container = document.getElementById('timer-shortcuts-container');
  if (!container || !cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const shortcuts = (cachedWidgetsConfig.timer.shortcuts || []).filter(s => s.pinned !== false);
  container.innerHTML = '';

  shortcuts.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'widget-shortcut-btn';
    const color = s.color || '#57D6C4';
    btn.style.borderColor = `${color}60`;
    btn.style.boxShadow = `0 0 10px ${color}15`;
    const label = tr('widgets.shortcuts.' + s.id, s.label);
    const title = tr('widgets.shortcuts.' + s.id + '.title', s.title || s.label);
    btn.innerHTML = `
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></span>
      <span>${label}</span>
    `;
    btn.title = `${tr('widgets.shortcuts_launch', 'Lanzar')}: ${title} (${s.seconds}s)`;
    btn.onclick = () => triggerTimerShortcut(s.id);
    container.appendChild(btn);
  });

  // Botón Pausar
  const pauseBtn = document.createElement('button');
  pauseBtn.type = 'button';
  pauseBtn.className = 'widget-shortcut-btn';
  pauseBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  pauseBtn.style.color = '#F87171';
  pauseBtn.innerHTML = `<span>${tr('widgets.timer_pause', '⏸️ Pausar')}</span>`;
  pauseBtn.onclick = () => API.triggerWidgetAction('timer', 'pause');
  container.appendChild(pauseBtn);
}


async function triggerTimerShortcut(shortcutId) {
  const sc = (cachedWidgetsConfig?.timer?.shortcuts || []).find(s => s.id === shortcutId);
  if (!sc) return;
  await API.triggerWidgetAction('timer', 'start', {
    seconds: sc.seconds,
    title: sc.title || sc.label,
    mode: sc.mode || 'down',
    unit: sc.unit || 'MIN',
    subtitle: sc.subtitle || ''
  });
}
