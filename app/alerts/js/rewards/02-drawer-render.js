// ====================================================================
// REWARDS - CARGA Y RENDERIZADO DEL CAJÓN LATERAL
// ====================================================================

async function loadTwitchRewards() {
  try {
    const data = await API.getRewards();
    const sel = document.getElementById('twitch-rewards-select');
    if (!sel) return;

    sel.innerHTML = '<option value="">-- Elige una recompensa de tu canal de Twitch --</option>';

    if (data.rewards && data.rewards.length > 0) {
      twitchRewardsList = data.rewards;
      data.rewards.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.title;
        opt.textContent = `🪙 ${r.title} (${r.cost} pts)`;
        sel.appendChild(opt);
      });
    } else {
      sel.innerHTML = '<option value="">(No hay recompensas creadas en Twitch o escribe manual)</option>';
    }
    renderTwitchRewardsInDrawer();
    if (typeof renderTriggers === 'function') renderTriggers();
  } catch (e) {
    console.error('Error al cargar recompensas de Twitch:', e);
  }
}

function toggleTwitchRewardCreator() {
  const drawer = document.getElementById('twitch-reward-creator-drawer');
  if (!drawer) return;
  const rolesDrawer = document.getElementById('roles-manager-drawer');
  const isOpen = drawer.style.display !== 'none';
  drawer.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    if (rolesDrawer) rolesDrawer.style.display = 'none';
    drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderTwitchRewardsInDrawer();
    document.getElementById('tw-reward-title')?.focus();
  }
}

function renderTwitchRewardsInDrawer() {
  const container = document.getElementById('tw-rewards-list-container');
  const badge = document.getElementById('tw-rewards-count-badge');
  const filterInput = document.getElementById('tw-rewards-filter-input');
  const filterText = (filterInput?.value || '').toLowerCase().trim();

  if (!container) return;
  if (badge) badge.textContent = twitchRewardsList.length;

  let list = twitchRewardsList;
  if (filterText) {
    list = list.filter(r => (r.title || '').toLowerCase().includes(filterText) || (r.prompt || '').toLowerCase().includes(filterText));
  }

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="color: var(--color-text-dim); font-size: 12px; padding: 14px; text-align: center; border: 1px dashed var(--color-border-dim); border-radius: 6px;">
        ${filterText ? 'No hay recompensas que coincidan con la búsqueda.' : 'No hay recompensas creadas en Twitch todavía.'}
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  list.forEach(r => {
    const item = document.createElement('div');
    const color = r.color || '#57D6C4';
    const isEnabled = r.is_enabled !== false;
    item.style.cssText = `
      background: rgba(0,0,0,0.3);
      border: 1px solid ${color}40;
      border-left: 4px solid ${color};
      border-radius: 6px;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      transition: background 0.15s;
    `;
    item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.04)';
    item.onmouseleave = () => item.style.background = 'rgba(0,0,0,0.3)';

    const safeTitle = (r.title || '').replace(/'/g, "\\'");
    const safePrompt = (r.prompt || '').replace(/'/g, "\\'");

    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0; overflow: hidden;">
        <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${color}; box-shadow: 0 0 8px ${color}; flex-shrink: 0;"></span>
        <div style="min-width: 0;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="font-family: var(--font-tech); font-weight: 800; font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${r.title}
            </span>
            <span class="badge-pill" style="font-size: 10px; padding: 1px 6px; background: rgba(87, 214, 196, 0.15); color: #57D6C4; border: 1px solid rgba(87, 214, 196, 0.3);">
              ${r.cost} pts
            </span>
            ${isEnabled ? '<span style="font-size: 10px; color: #10B981;">✓ Activa</span>' : '<span style="font-size: 10px; color: #EF4444;">⏸️ Pausada</span>'}
          </div>
          ${r.prompt ? `<div style="font-size: 10px; color: var(--color-text-dim); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${safePrompt}">📝 ${r.prompt}</div>` : ''}
        </div>
      </div>
      <div style="display: flex; gap: 5px; flex-shrink: 0;">
        <button type="button" class="btn-stage-preset" style="padding: 2px 7px; font-size: 11px;" onclick="useTwitchRewardInTrigger('${safeTitle}', '${color}')" title="Usar esta recompensa en el Trigger actual">🔗</button>
        <button type="button" class="btn-stage-preset" style="padding: 2px 7px; font-size: 11px; color: var(--color-accent-cyan); border-color: rgba(87, 214, 196, 0.4);" onclick="editTwitchReward('${r.id}')" title="Editar en Twitch">✏️</button>
        <button type="button" class="btn-stage-preset" style="padding: 2px 7px; font-size: 11px; color: #EF4444; border-color: rgba(239, 68, 68, 0.4);" onclick="deleteTwitchReward('${r.id}', '${safeTitle}')" title="Eliminar de Twitch">🗑️</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function useTwitchRewardInTrigger(title, color) {
  document.getElementById('twitch-rewards-select').value = title;
  document.getElementById('trig-reward-manual').value = title;
  syncLockedRewardColor(color);
  if (!document.getElementById('trig-title').value) {
    document.getElementById('trig-title').value = title;
  }
  if (typeof updateLivePreviewCaption === 'function') updateLivePreviewCaption();

  const toast = document.createElement('div');
  toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #10B981; color: #000; font-family: var(--font-tech); font-weight: 800; font-size: 12px; padding: 10px 18px; border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.5); z-index: 9999;';
  toast.textContent = (window.i18n && typeof window.i18n.tr === 'function'
    ? window.i18n.tr('✓ Seleccionada recompensa')
    : '✓ Seleccionada recompensa') + ': "' + title + '"';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
