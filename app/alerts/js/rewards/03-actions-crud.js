// ====================================================================
// REWARDS - OPERACIONES CRUD EN LA API DE TWITCH
// ====================================================================

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
