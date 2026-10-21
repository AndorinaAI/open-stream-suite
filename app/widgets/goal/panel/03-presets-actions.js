
function setCustomGoalPreset(kind) {
  const titleInput = document.getElementById('cfg-goal-title');
  const currentInput = document.getElementById('cfg-goal-current');
  const targetInput = document.getElementById('cfg-goal-target');
  const prefixInput = document.getElementById('cfg-goal-prefix');
  const suffixInput = document.getElementById('cfg-goal-suffix');
  const subtextInput = document.getElementById('cfg-goal-subtext-format');
  const iconInput = document.getElementById('cfg-goal-icon');

  if (kind === 'coffee') {
    if (titleInput) titleInput.value = '☕ META: DONACIONES & CAFÉS';
    if (prefixInput) prefixInput.value = '€';
    if (suffixInput) suffixInput.value = '';
    if (currentInput) currentInput.value = '15';
    if (targetInput) targetInput.value = '50';
    if (iconInput) iconInput.value = '☕';
    if (subtextInput) subtextInput.value = '{current} de {target} recaudados ({pct}%) · ¡Gracias por el apoyo!';
  } else if (kind === '3dprint') {
    if (titleInput) titleInput.value = 'PROYECTO 3D: PIEZAS IMPRESAS';
    if (prefixInput) prefixInput.value = '';
    if (suffixInput) suffixInput.value = ' pcs';
    if (currentInput) currentInput.value = '18';
    if (targetInput) targetInput.value = '24';
    if (iconInput) iconInput.value = '🖨️';
    if (subtextInput) subtextInput.value = '{pct}% LISTO · ¡Faltan {remaining} piezas para ensamblar!';
  } else if (kind === 'wins') {
    if (titleInput) titleInput.value = 'CHALLENGE: VICTORIAS EN DIRECTO';
    if (prefixInput) prefixInput.value = '🏆 ';
    if (suffixInput) suffixInput.value = ' Wins';
    if (currentInput) currentInput.value = '3';
    if (targetInput) targetInput.value = '5';
    if (iconInput) iconInput.value = '🏆';
    if (subtextInput) subtextInput.value = '{current}/{target} Victorias conseguidas · ¡Quedan {remaining}!';
  } else if (kind === 'community') {
    if (titleInput) titleInput.value = '🍕 META COMUNIDAD: PIZZAS';
    if (prefixInput) prefixInput.value = '';
    if (suffixInput) suffixInput.value = ' pizzas';
    if (currentInput) currentInput.value = '4';
    if (targetInput) targetInput.value = '10';
    if (iconInput) iconInput.value = '🍕';
    if (subtextInput) subtextInput.value = '{pct}% COMPLETADO · ¡Comunidad Open Stream Suite!';
  }

  // Sincronizar en el objeto en memoria
  const g = cachedWidgetsConfig?.goal;
  const selGoal = (g?.goals || []).find(item => item.id === window.selectedGoalId);
  if (selGoal) {
    if (titleInput) selGoal.title = titleInput.value;
    if (prefixInput) selGoal.prefix = prefixInput.value;
    if (suffixInput) selGoal.suffix = suffixInput.value;
    if (currentInput) selGoal.current = parseInt(currentInput.value, 10) || 0;
    if (targetInput) selGoal.target = parseInt(targetInput.value, 10) || 100;
    if (iconInput) selGoal.icon = iconInput.value;
    if (subtextInput) selGoal.subtextFormat = subtextInput.value;
  }

  updateGoalPipPreview();
}

async function quickAdjustGoalCurrent(delta, goalId = null) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const targetId = goalId || window.selectedGoalId || g.activeGoalId;
  const goal = (g.goals || []).find(item => item.id === targetId) || g;

  if (goal.category === 'twitch') {
    alert('🔒 Las metas oficiales de Twitch se sincronizan en vivo y no se pueden falsear manualmente.');
    return;
  }

  const curVal = Math.max(0, (goal.current || 0) + delta);
  goal.current = curVal;

  if (goal.id === window.selectedGoalId) {
    const currentInput = document.getElementById('cfg-goal-current');
    if (currentInput) currentInput.value = curVal;
  }

  updateGoalPipPreview();
  renderGoalShortcuts();

  await API.triggerWidgetAction('goal', 'quick_adjust', {
    goal_id: goal.id,
    delta: delta
  });
}

async function resetGoalCurrent(goalId = null) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const targetId = goalId || window.selectedGoalId || g.activeGoalId;
  const goal = (g.goals || []).find(item => item.id === targetId) || g;

  if (goal.category === 'twitch') {
    alert('🔒 Las metas oficiales de Twitch no se pueden resetear manualmente.');
    return;
  }

  goal.current = 0;
  if (goal.id === window.selectedGoalId) {
    const currentInput = document.getElementById('cfg-goal-current');
    if (currentInput) currentInput.value = 0;
  }

  updateGoalPipPreview();
  renderGoalShortcuts();

  await API.triggerWidgetAction('goal', 'reset', { goal_id: goal.id });
}

function pinGoalQuickAction(goalId, amount) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const goal = (g.goals || []).find(it => it.id === goalId);
  if (!goal) return;

  if (!Array.isArray(g.shortcuts)) g.shortcuts = [];
  const label = `${amount > 0 ? '+' : ''}${amount} ${goal.title.replace(/OBJETIVO:\s*/i, '').substring(0, 10)}`;
  const scColor = goal.color || goal.barColorStart || '#57D6C4';

  g.shortcuts.push({
    id: 'sc_goal_' + Date.now(),
    goal_id: goal.id,
    amount: amount,
    label: label,
    color: scColor,
    pinned: true
  });

  renderGoalShortcuts();
  renderMiniAppControls();
  alert(`✓ Acción rápida "${label}" añadida a la tarjeta principal.`);
}

function addGoalQuickActionFromForm() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const targetSelect = document.getElementById('new-goal-sc-target');
  const amountSelect = document.getElementById('new-goal-sc-amount');
  const labelInput = document.getElementById('new-goal-sc-label');

  if (!targetSelect || !amountSelect) return;
  const goalId = targetSelect.value;
  const amountVal = amountSelect.value;
  const amount = amountVal === 'reset' ? 'reset' : parseInt(amountVal, 10);
  const goal = (g.goals || []).find(it => it.id === goalId) || g.goals[0];

  let label = labelInput?.value?.trim();
  if (!label) {
    if (amount === 'reset') label = `🔄 Reset ${goal.title.replace(/OBJETIVO:\s*/i, '').substring(0, 8)}`;
    else label = `${amount > 0 ? '+' : ''}${amount} ${goal.title.replace(/OBJETIVO:\s*/i, '').substring(0, 8)}`;
  }

  if (!Array.isArray(g.shortcuts)) g.shortcuts = [];
  const scColor = goal.color || goal.barColorStart || '#57D6C4';

  g.shortcuts.push({
    id: 'sc_goal_' + Date.now(),
    goal_id: goal.id,
    amount: amount,
    label: label,
    color: scColor,
    pinned: true
  });

  renderGoalShortcuts();
  renderMiniAppControls();
  alert(`✓ Acción rápida "${label}" creada.`);
}

function deleteGoalQuickAction(scId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  g.shortcuts = (g.shortcuts || []).filter(s => s.id !== scId);
  renderGoalShortcuts();
  renderMiniAppControls();
}

async function triggerGoalCustomShortcut(scId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const sc = (g.shortcuts || []).find(s => s.id === scId);
  if (!sc) return;

  if (sc.amount === 'reset') {
    await resetGoalCurrent(sc.goal_id);
  } else {
    await quickAdjustGoalCurrent(parseInt(sc.amount, 10) || 1, sc.goal_id);
  }
}

function testGoalCelebration() {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'trigger_goal_celebration' }, '*');
    if (typeof iframe.contentWindow.triggerConfettiBurst === 'function') {
      iframe.contentWindow.triggerConfettiBurst();
    }
  }
}
