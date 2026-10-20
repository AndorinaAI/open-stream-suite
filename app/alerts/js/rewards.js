// ====================================================================
// GESTOR DE RECOMPENSAS DE TWITCH (PUNTOS DE CANAL)
// ====================================================================

let twitchRewardsList = [];

function syncTwitchRewardColor(color) {
  if (!color) color = '#57D6C4';
  if (!color.startsWith('#')) color = '#' + color;
  const picker = document.getElementById('tw-reward-color');
  const hex = document.getElementById('tw-reward-color-hex');
  if (picker) picker.value = color;
  if (hex) hex.value = color.toUpperCase();
  updateTwitchRewardPreview();
}

function updateTwitchRewardPreview() {
  const title = document.getElementById('tw-reward-title')?.value.trim() || '¡Susto con Meme!';
  const cost = document.getElementById('tw-reward-cost')?.value || '250';
  const color = document.getElementById('tw-reward-color')?.value || '#57D6C4';

  const chip = document.getElementById('tw-reward-preview-chip');
  const dot = document.getElementById('tw-reward-preview-dot');
  const text = document.getElementById('tw-reward-preview-text');

  if (chip) {
    chip.style.borderColor = color;
    chip.style.color = color;
    chip.style.background = `${color}25`;
    chip.style.boxShadow = `0 0 10px ${color}35`;
  }
  if (dot) {
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${color}`;
  }
  if (text) {
    text.textContent = `🪙 ${title} (${cost} pts)`;
  }
}

// Sincroniza la visualización bloqueada del color de Twitch en el trigger
function syncLockedRewardColor(explicitColor = null) {
  let color = explicitColor;
  if (!color) {
    const selVal = document.getElementById('twitch-rewards-select')?.value;
    const manVal = document.getElementById('trig-reward-manual')?.value.trim();
    const rwName = manVal || selVal;
    if (rwName && twitchRewardsList.length > 0) {
      const match = twitchRewardsList.find(r => r.title.toLowerCase() === rwName.toLowerCase());
      if (match && match.color) color = match.color;
    }
  }
  if (!color) color = '#57D6C4';
  if (!color.startsWith('#')) color = '#' + color;

  const dot = document.getElementById('trigger-locked-color-dot');
  const text = document.getElementById('trigger-locked-color-text');
  if (dot) {
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${color}`;
  }
  if (text) {
    text.style.color = color;
    text.textContent = `${color.toUpperCase()} (Heredado de Twitch)`;
  }

  // Sincronizar también el acento del formulario
  const picker = document.getElementById('trig-accent-color');
  const hex = document.getElementById('trig-accent-color-hex');
  if (picker) picker.value = color;
  if (hex) hex.value = color.toUpperCase();

  const bannerBorderHex = document.getElementById('trig-banner-border-color-hex');
  if (bannerBorderHex && !bannerBorderHex.dataset.customized && typeof syncBannerBorderColor === 'function') {
    syncBannerBorderColor(color, false);
  }
}

// Disparado al elegir una recompensa del desplegable
function onSelectTwitchReward(val) {
  const manualInput = document.getElementById('trig-reward-manual');
  if (manualInput) manualInput.value = val;

  let color = '#57D6C4';
  if (val && twitchRewardsList.length > 0) {
    const match = twitchRewardsList.find(r => r.title === val);
    if (match && match.color) color = match.color;
  }
  syncLockedRewardColor(color);

  const titleInput = document.getElementById('trig-title');
  if (titleInput && (!titleInput.value || titleInput.value.startsWith('¡'))) {
    titleInput.value = val ? `¡${val}!` : '';
  }

  if (typeof updateLivePreviewCaption === 'function') {
    updateLivePreviewCaption();
  }
}

// Disparado al escribir a mano el nombre de la recompensa
function onManualRewardInput(val) {
  let color = null;
  if (val && twitchRewardsList.length > 0) {
    const match = twitchRewardsList.find(r => r.title.toLowerCase() === val.toLowerCase());
    if (match && match.color) color = match.color;
  }
  syncLockedRewardColor(color);

  if (typeof updateLivePreviewCaption === 'function') {
    updateLivePreviewCaption();
  }
}

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

  // Toast feedback
  const toast = document.createElement('div');
  toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #10B981; color: #000; font-family: var(--font-tech); font-weight: 800; font-size: 12px; padding: 10px 18px; border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.5); z-index: 9999;';
  toast.textContent = (window.i18n && typeof window.i18n.tr === 'function'
    ? window.i18n.tr('✓ Seleccionada recompensa')
    : '✓ Seleccionada recompensa') + ': "' + title + '"';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function editTwitchReward(rewardId) {
  const reward = twitchRewardsList.find(r => r.id === rewardId);
  if (!reward) return;

  document.getElementById('tw-reward-id').value = reward.id;
  document.getElementById('tw-reward-title').value = reward.title || '';
  document.getElementById('tw-reward-cost').value = reward.cost || 100;
  const color = reward.color || '#57D6C4';
  syncTwitchRewardColor(color);
  document.getElementById('tw-reward-prompt').value = reward.prompt || '';
  document.getElementById('tw-reward-enabled').checked = reward.is_enabled !== false;

  const titleEl = document.getElementById('tw-reward-form-title');
  if (titleEl) titleEl.textContent = `✏️ EDITAR RECOMPENSA: ${reward.title}`;
  const modeBadge = document.getElementById('tw-reward-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = 'EDITANDO';
    modeBadge.style.color = '#F59E0B';
    modeBadge.style.borderColor = '#F59E0B';
    modeBadge.style.background = 'rgba(245, 158, 11, 0.15)';
  }
  const submitBtn = document.getElementById('btn-submit-tw-reward');
  if (submitBtn) submitBtn.textContent = '💾 Guardar Cambios en Twitch';
  const delBtn = document.getElementById('btn-delete-tw-reward');
  if (delBtn) delBtn.style.display = 'inline-block';

  updateTwitchRewardPreview();
  document.getElementById('tw-reward-title')?.focus();
}

function resetTwitchRewardForm(keepDrawerOpen = false) {
  document.getElementById('tw-reward-id').value = '';
  document.getElementById('tw-reward-title').value = '';
  document.getElementById('tw-reward-cost').value = 250;
  syncTwitchRewardColor('#57D6C4');
  document.getElementById('tw-reward-prompt').value = '';
  document.getElementById('tw-reward-enabled').checked = true;

  const titleEl = document.getElementById('tw-reward-form-title');
  if (titleEl) titleEl.textContent = '➕ CREAR NUEVA RECOMPENSA EN TWITCH';
  const modeBadge = document.getElementById('tw-reward-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = 'NUEVA';
    modeBadge.style.color = '#57D6C4';
    modeBadge.style.borderColor = '#57D6C4';
    modeBadge.style.background = 'rgba(87, 214, 196, 0.15)';
  }
  const submitBtn = document.getElementById('btn-submit-tw-reward');
  if (submitBtn) submitBtn.textContent = '🚀 Crear Recompensa en Twitch';
  const delBtn = document.getElementById('btn-delete-tw-reward');
  if (delBtn) delBtn.style.display = 'none';

  updateTwitchRewardPreview();
  if (!keepDrawerOpen) {
    const drawer = document.getElementById('twitch-reward-creator-drawer');
    if (drawer) drawer.style.display = 'none';
  }
}

function openTwitchRewardEditorForCurrentSelect() {
  const selVal = document.getElementById('twitch-rewards-select')?.value;
  const manualVal = document.getElementById('trig-reward-manual')?.value.trim();
  const rwName = manualVal || selVal;

  const drawer = document.getElementById('twitch-reward-creator-drawer');
  if (drawer) {
    drawer.style.display = 'block';
    drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (rwName && twitchRewardsList.length > 0) {
    const match = twitchRewardsList.find(r => r.title.toLowerCase() === rwName.toLowerCase());
    if (match) {
      editTwitchReward(match.id);
      return;
    }
  }
  resetTwitchRewardForm(true);
  if (rwName) {
    document.getElementById('tw-reward-title').value = rwName;
    updateTwitchRewardPreview();
  }
}

async function saveTwitchRewardDirect(e) {
  e.preventDefault();
  const id = document.getElementById('tw-reward-id').value.trim();
  const title = document.getElementById('tw-reward-title').value.trim();
  const cost = parseInt(document.getElementById('tw-reward-cost').value, 10) || 100;
  const prompt = document.getElementById('tw-reward-prompt').value.trim();
  const color = document.getElementById('tw-reward-color').value || '#57D6C4';
  const is_enabled = document.getElementById('tw-reward-enabled').checked;
  const btn = document.getElementById('btn-submit-tw-reward');

  if (!title) {
    alert('Por favor introduce un título para la recompensa.');
    return;
  }

  btn.disabled = true;
  const isEditing = Boolean(id);
  btn.textContent = isEditing ? '⏳ Guardando en Twitch...' : '⏳ Creando en Twitch...';

  try {
    const payload = isEditing ? { id, title, cost, prompt, background_color: color, is_enabled } : { title, cost, prompt, background_color: color, is_enabled };
    const { ok, data } = isEditing ? await API.updateReward(payload) : await API.createReward(payload);

    if (ok && data.status === 'ok') {
      alert(`✓ ¡Recompensa "${title}" ${isEditing ? 'actualizada' : 'creada'} con éxito en tu canal de Twitch!`);
      await loadTwitchRewards();
      document.getElementById('twitch-rewards-select').value = title;
      document.getElementById('trig-reward-manual').value = title;
      syncLockedRewardColor(color);
      if (!document.getElementById('trig-title').value) {
        document.getElementById('trig-title').value = `¡${title}!`;
      }
      resetTwitchRewardForm(true);
    } else if (data.status === 'need_auth') {
      if (confirm('Twitch requiere que autorices el permiso "channel:manage:redemptions" para gestionar recompensas. ¿Deseas autorizarlo ahora?')) {
        window.location.href = data.auth_url || '/auth';
      }
    } else {
      alert('Aviso al gestionar en Twitch: ' + (data.error || 'No se pudo completar la operación. Verifica tus permisos de Twitch y que seas Afiliado o Partner.'));
    }
  } catch (err) {
    alert('Error de conexión con el servidor: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = isEditing ? '💾 Guardar Cambios en Twitch' : '🚀 Crear Recompensa en Twitch';
  }
}

async function deleteTwitchReward(id, title) {
  if (!confirm(`¿Seguro que deseas ELIMINAR permanentemente la recompensa "${title}" de tu canal de Twitch?\n\nEsta acción eliminará la recompensa en los Puntos de Canal de tus espectadores.`)) return;
  try {
    const { ok, data } = await API.deleteReward(id);
    if (ok && data.status === 'ok') {
      alert(`✓ Recompensa "${title}" eliminada de Twitch.`);
      await loadTwitchRewards();
      resetTwitchRewardForm(true);
    } else if (data.status === 'need_auth') {
      if (confirm('Twitch requiere autorización para eliminar recompensas. ¿Deseas autorizarlo ahora?')) {
        window.location.href = data.auth_url || '/auth';
      }
    } else {
      alert('Error al eliminar en Twitch: ' + (data.error || 'No se pudo eliminar.'));
    }
  } catch (err) {
    alert('Error de conexión con el servidor: ' + err.message);
  }
}

function deleteTwitchRewardCurrent() {
  const id = document.getElementById('tw-reward-id').value.trim();
  const title = document.getElementById('tw-reward-title').value.trim() || 'esta recompensa';
  if (id) deleteTwitchReward(id, title);
}
