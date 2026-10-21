// ====================================================================
// GESTOR UNIVERSAL DE ACCIONES RÁPIDAS Y STREAM DECK (SHORTCUTS)
// ====================================================================

// 2. Pestaña de Gestión de Accesos Directos
function renderMiniAppShortcutsManager() {
  const container = document.getElementById('miniapp-shortcuts-list');
  if (!container || !cachedWidgetsConfig || !currentMiniAppWidget) return;

  const w = currentMiniAppWidget;
  const shortcuts = (cachedWidgetsConfig[w] && cachedWidgetsConfig[w].shortcuts) || [];

  container.innerHTML = '';
  shortcuts.forEach((s) => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px 16px; margin-bottom: 10px;';
    const color = s.color || '#57D6C4';
    const isPinned = s.pinned !== false;

    let details = '';
    if (w === 'timer') details = `⏱️ ${s.seconds}s · "${s.title}"`;
    else if (w === 'promo') details = `📢 ${s.type.toUpperCase()} · ${s.title || s.streamer || ''} ${s.price ? '(' + s.price + ')' : ''}`;
    else if (w === 'chat') {
      const kwPreview = s.keywords ? ` · 🎯 Triggers: ${s.keywords}` : ' · ⚠️ Manual (sin triggers)';
      details = `💥 Partículas: ${s.emoji} (${s.count || 45} uds)${s.autoTrigger !== false ? kwPreview : ' · ⚪ Auto-activación pausada'}`;
    }
    else details = `⚡ Atajo ID: ${s.id}`;

    const itemLabel = (window.i18n && window.i18n.has && window.i18n.has('widgets.shortcuts.' + s.id) ? window.i18n.tr('widgets.shortcuts.' + s.id) : null) || s.label || s.title || s.id;

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};box-shadow:0 0 10px ${color};"></span>
        <div>
          <strong style="font-size: 13px; color: #fff;">${itemLabel}</strong>
          <div style="font-size: 11px; color: var(--color-text-dim); font-family: var(--font-tech);">${details}</div>
        </div>
      </div>
      <div style="display: flex; gap: 6px; align-items: center;">
        <button type="button" class="btn-stage-preset" style="${isPinned ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.1);' : 'color: var(--color-text-dim);'}" onclick="toggleShortcutPinned('${w}', '${s.id}')" title="${isPinned ? 'Visible en la tarjeta exterior' : 'Oculto de la tarjeta exterior'}">
          ${isPinned ? '👁️ En Tarjeta' : '👁️‍🗨️ Oculto'}
        </button>
        <button type="button" class="btn-stage-preset" onclick="testMiniAppShortcut('${w}', '${s.id}')">▶️ Probar</button>
        ${w === 'chat' ? `<button type="button" class="btn-stage-preset" onclick="openParticleEditorModal('${s.id}')">✏️ Editar</button>` : ''}
        <button type="button" class="btn-stage-preset" style="color: #EF4444;" onclick="deleteMiniAppShortcut('${w}', '${s.id}')">🗑️</button>
      </div>
    `;
    container.appendChild(row);
  });
}

async function toggleShortcutPinned(widgetId, shortcutId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig[widgetId]) return;
  const sc = (cachedWidgetsConfig[widgetId].shortcuts || []).find(s => s.id === shortcutId);
  if (!sc) return;
  sc.pinned = (sc.pinned === false) ? true : false;
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();
}

function testMiniAppShortcut(widgetId, shortcutId) {
  if (widgetId === 'timer') triggerTimerShortcut(shortcutId);
  else if (widgetId === 'promo') triggerPromoShortcut(shortcutId);
  else if (widgetId === 'chat') triggerChatShortcut(shortcutId);
}

async function deleteMiniAppShortcut(widgetId, shortcutId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig[widgetId]) return;
  cachedWidgetsConfig[widgetId].shortcuts = (cachedWidgetsConfig[widgetId].shortcuts || []).filter(s => s.id !== shortcutId);
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();
}

async function addCustomShortcutToWidget(targetWidgetId) {
  const w = targetWidgetId || currentMiniAppWidget;
  if (!cachedWidgetsConfig || !w) return;
  currentMiniAppWidget = w;

  if (w === 'chat') {
    openParticleEditorModal(null);
    return;
  }

  if (w === 'timer') {
    const label = prompt('Nombre del acceso rápido (ej. "🔥 Curado Vinilo"):');
    if (!label) return;
    const seconds = parseInt(prompt('Duración en segundos (ej. 45):', '45'), 10) || 60;
    const color = prompt('Color de botón en HEX (ej. #FF783F):', '#FF783F') || '#57D6C4';

    const newSc = {
      id: 't_' + Date.now(),
      label,
      seconds,
      title: label,
      color,
      pinned: true
    };
    if (!cachedWidgetsConfig.timer.shortcuts) cachedWidgetsConfig.timer.shortcuts = [];
    cachedWidgetsConfig.timer.shortcuts.push(newSc);

  } else if (w === 'promo') {
    const label = prompt('Nombre del botón de promo (ej. "🛒 Tienda Pegatinas"):');
    if (!label) return;
    const type = prompt('Tipo de promo: "product", "social" o "shoutout":', 'product') || 'product';
    const title = prompt('Título destacado:', label) || label;
    const subtitle = prompt('Subtítulo o descripción breve:', 'Disponible en directo') || '';
    const link = prompt('Enlace URL (para generar QR):', 'https://twitch.tv/andorina') || '';
    const color = prompt('Color de acento en HEX:', '#FF783F') || '#FF783F';

    const newSc = {
      id: 'p_' + Date.now(),
      label,
      type,
      title,
      subtitle,
      link,
      showQR: true,
      color,
      pinned: true
    };
    if (!cachedWidgetsConfig.promo.shortcuts) cachedWidgetsConfig.promo.shortcuts = [];
    cachedWidgetsConfig.promo.shortcuts.push(newSc);
  }

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();
}




window.renderMiniAppShortcutsManager = renderMiniAppShortcutsManager;
window.toggleShortcutPinned = toggleShortcutPinned;
window.testMiniAppShortcut = testMiniAppShortcut;
window.deleteMiniAppShortcut = deleteMiniAppShortcut;
window.addCustomShortcutToWidget = addCustomShortcutToWidget;

