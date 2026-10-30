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
        <button type="button" class="btn-stage-preset" style="color: #EF4444;" onclick="confirmDeleteMiniAppShortcut('${w}', '${s.id}')" title="Quitar este atajo" aria-label="Quitar este atajo">🗑️</button>
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

  // El widget declara sus propias acciones en `common/shortcut-actions.js`.
  // AQUI NO HAY NINGUNA LISTA DE WIDGETS: uno nuevo solo tiene que llamar a
  // ShortcutActions.register() desde su codigo.
  var spec = (window.ShortcutActions && ShortcutActions.get(w)) || null;
  if (spec) {
    if (!window.UI || typeof UI.formDialog !== 'function') {
      if (window.UI && UI.showToast) UI.showToast('No se pudo abrir el formulario de atajos', 'error');
      return;
    }
    var vals = await UI.formDialog({
      title: 'Nuevo atajo: ' + w,
      detail: 'Se añade a la barra de atajos del widget.',
      fields: spec.fields,
      submitLabel: 'Añadir atajo'
    });
    if (!vals) return;
    if (!cachedWidgetsConfig[w].shortcuts) cachedWidgetsConfig[w].shortcuts = [];
    cachedWidgetsConfig[w].shortcuts.push(spec.build(vals));
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    renderWidgetsGrid();
    renderMiniAppShortcutsManager();
    if (window.UI && UI.showToast) UI.showToast('✓ Atajo añadido', 'success');
    return;
  }

  if (w === 'chat') {
    openParticleEditorModal(null);
    return;
  }

  // Un solo modal con los campos del widget, incluida la ACCION. Antes eran
  // hasta 6 prompt() nativos y no habia forma de elegir "play"/"pause"/"reset".
  var baseFields = [
    { name: 'label', label: 'Nombre del botón', type: 'text', value: '',
      placeholder: '▶️ Iniciar 60s', help: 'Lo que se ve en la barra de atajos.' },
    { name: 'color', label: 'Color del botón', type: 'color', value: '#57D6C4' }
  ];
  var fields = [];
  var toShortcut = null;

  if (w === 'timer') {
    fields = [
      { name: 'action', label: 'Acción', type: 'select', value: 'set', options: [
        { value: 'set', label: '⏱️ Fijar tiempo y arrancar' },
        { value: 'pause', label: '⏸️ Pausar' },
        { value: 'resume', label: '▶️ Reanudar' },
        { value: 'reset', label: '↺ Reiniciar' }
      ], help: 'Qué hace el temporizador al pulsar el atajo.' },
      { name: 'seconds', label: 'Segundos', type: 'number', value: 60, min: 1,
        help: 'Solo se usa con «Fijar tiempo».' },
      { name: 'title', label: 'Título en pantalla', type: 'text', value: '',
        placeholder: 'Curado Sublimación (60s)' }
    ].concat(baseFields);
    toShortcut = function (v) {
      return {
        id: 't_' + Date.now(),
        label: v.label || 'Atajo',
        action: v.action,
        mode: v.action === 'set' ? 'down' : v.action,
        seconds: v.seconds || 60,
        title: v.title || v.label || '',
        color: v.color || '#57D6C4',
        pinned: true
      };
    };
  } else if (w === 'promo' || w === 'shoutout') {
    fields = [
      { name: 'action', label: 'Tipo de promo', type: 'select', value: 'product', options: [
        { value: 'product', label: '🛒 Producto / tienda' },
        { value: 'social', label: '💬 Red social o comunidad' },
        { value: 'shoutout', label: '📢 Shoutout a un creador' }
      ] },
      { name: 'title', label: 'Título destacado', type: 'text', value: '' },
      { name: 'subtitle', label: 'Subtítulo', type: 'text', value: '' },
      { name: 'link', label: 'Enlace (genera QR)', type: 'text', value: '', placeholder: 'https://' },
      { name: 'streamer', label: 'Creador (solo shoutout)', type: 'text', value: '',
        help: 'Canal de Twitch sin @.' }
    ].concat(baseFields);
    toShortcut = function (v) {
      return {
        id: 'p_' + Date.now(),
        label: v.label || 'Atajo',
        type: v.action,
        title: v.title || v.label || '',
        subtitle: v.subtitle || '',
        link: v.link || '',
        streamer: v.streamer || '',
        showQR: !!v.link,
        color: v.color || '#57D6C4',
        pinned: true
      };
    };
  } else if (w === 'goal') {
    fields = [
      { name: 'action', label: 'Acción', type: 'select', value: 'increment', options: [
        { value: 'increment', label: '➕ Sumar / restar progreso' },
        { value: 'set', label: '🎯 Fijar progreso exacto' },
        { value: 'reset', label: '↺ Reiniciar a cero' }
      ] },
      { name: 'amount', label: 'Cantidad', type: 'number', value: 1,
        help: 'Negativo para restar. Solo con «Sumar».' }
    ].concat(baseFields);
    toShortcut = function (v) {
      return {
        id: 'sc_' + Date.now(),
        label: v.label || 'Atajo',
        action: v.action,
        type: v.action === 'increment' ? 'increment' : v.action,
        amount: v.amount == null ? 1 : v.amount,
        color: v.color || '#57D6C4',
        pinned: true
      };
    };
  } else if (w === 'ticker') {
    fields = [
      { name: 'action', label: 'Acción', type: 'select', value: 'message', options: [
        { value: 'message', label: '💬 Publicar mensaje' },
        { value: 'flash', label: '🚨 Flash de última hora' },
        { value: 'pause', label: '⏸️ Pausar el ticker' },
        { value: 'resume', label: '▶️ Reanudar el ticker' }
      ] },
      { name: 'message', label: 'Mensaje', type: 'textarea', value: '',
        help: 'Solo para «Publicar» y «Flash».' }
    ].concat(baseFields);
    toShortcut = function (v) {
      return {
        id: 'sc_' + Date.now(),
        label: v.label || 'Atajo',
        action: v.action,
        params: { message: v.message || '' },
        color: v.color || '#57D6C4',
        pinned: true
      };
    };
  } else {
    return;
  }

  // Sin el modal propio, no se cae a prompt(): se avisa y se sale.
  if (!window.UI || typeof UI.formDialog !== 'function') {
    if (window.UI && UI.showToast) UI.showToast('No se pudo abrir el formulario de atajos', 'error');
    return;
  }

  var values = await UI.formDialog({
    title: 'Nuevo atajo: ' + w,
    detail: 'Se añade a la barra de atajos del widget.',
    fields: fields,
    submitLabel: 'Añadir atajo'
  });
  if (!values) return;

  if (!cachedWidgetsConfig[w].shortcuts) cachedWidgetsConfig[w].shortcuts = [];
  cachedWidgetsConfig[w].shortcuts.push(toShortcut(values));

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();
  if (window.UI && UI.showToast) UI.showToast('✓ Atajo añadido', 'success');
}




window.renderMiniAppShortcutsManager = renderMiniAppShortcutsManager;
window.toggleShortcutPinned = toggleShortcutPinned;
window.testMiniAppShortcut = testMiniAppShortcut;
window.deleteMiniAppShortcut = deleteMiniAppShortcut;
window.addCustomShortcutToWidget = addCustomShortcutToWidget;

/* Confirmacion antes de quitar un atajo (UI.confirmAction nunca abre dos dialogos). */
window.confirmDeleteMiniAppShortcut = function (w, id) {
  if (!window.UI || !window.UI.confirmAction) { return deleteMiniAppShortcut(w, id); }
  window.UI.confirmAction({
    title: 'Quitar atajo',
    detail: 'El atajo dejara de aparecer en la barra del escenario. No borra el widget.',
    confirmLabel: 'Quitar',
    danger: true
  }).then(function (ok) { if (ok) { deleteMiniAppShortcut(w, id); } });
};
