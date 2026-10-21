
function switchGoalSubTab(tab) {
  window.activeGoalTab = tab;
  const tabs = ['target', 'styles', 'presets'];
  tabs.forEach(t => {
    const pane = document.getElementById(`goal-tab-${t}`);
    const btn = document.getElementById(`goal-subtab-btn-${t}`);
    if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      if (t === tab) {
        btn.classList.add('active');
        btn.style.borderColor = '#57D6C4';
        btn.style.color = '#57D6C4';
        btn.style.background = 'rgba(87,214,196,0.15)';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = 'var(--color-border-dim)';
        btn.style.color = '#fff';
        btn.style.background = 'transparent';
      }
    }
  });

  updateGoalPipPreview();
}

function selectGoalItem(goalId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  
  // Guardar datos actuales del formulario en la meta previa antes de cambiar
  const curSelected = (g.goals || []).find(item => item.id === window.selectedGoalId);
  if (curSelected) {
    const titleVal = document.getElementById('cfg-goal-title')?.value;
    if (titleVal !== undefined) curSelected.title = titleVal;
    const iconVal = document.getElementById('cfg-goal-icon')?.value;
    if (iconVal !== undefined) curSelected.icon = iconVal;
    if (curSelected.category !== 'twitch') {
      const curVal = parseInt(document.getElementById('cfg-goal-current')?.value, 10);
      if (!isNaN(curVal)) curSelected.current = curVal;
    }
    const targVal = parseInt(document.getElementById('cfg-goal-target')?.value, 10);
    if (!isNaN(targVal)) curSelected.target = targVal;
    const pfx = document.getElementById('cfg-goal-prefix')?.value;
    if (pfx !== undefined) curSelected.prefix = pfx;
    const sfx = document.getElementById('cfg-goal-suffix')?.value;
    if (sfx !== undefined) curSelected.suffix = sfx;
    const sub = document.getElementById('cfg-goal-subtext-format')?.value;
    if (sub !== undefined) curSelected.subtextFormat = sub;
    const col = document.getElementById('cfg-goal-item-color')?.value;
    if (col) curSelected.color = col;
    const bs = document.getElementById('cfg-goal-item-bar-start')?.value;
    if (bs) curSelected.barColorStart = bs;
    const be = document.getElementById('cfg-goal-item-bar-end')?.value;
    if (be) curSelected.barColorEnd = be;
  }

  window.selectedGoalId = goalId;
  g.activeGoalId = goalId;
  renderMiniAppControls();
  updateGoalPipPreview();
}

async function toggleGoalActive(goalId, event) {
  if (event) event.stopPropagation();
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const item = (g.goals || []).find(it => it.id === goalId);
  if (!item) return;

  item.active = !item.active;
  renderMiniAppControls();
  updateGoalPipPreview();
  renderGoalShortcuts();

  await API.triggerWidgetAction('goal', 'toggle_goal', { goal_id: goalId });
}

function toggleGoalPinToCard(goalId, event) {
  if (event) event.stopPropagation();
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const item = (g.goals || []).find(it => it.id === goalId);
  if (!item) return;

  item.pinnedToCard = !(item.pinnedToCard !== false);
  renderMiniAppControls();
  renderGoalShortcuts();
}

function setGoalDisplayMode(mode) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  cachedWidgetsConfig.goal.displayMode = mode;
  renderMiniAppControls();
  updateGoalPipPreview();
}

function onGoalRotationIntervalChange(val) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  cachedWidgetsConfig.goal.rotationInterval = Math.max(3, parseInt(val, 10) || 10);
  updateGoalPipPreview();
}

function onGoalRotationAnimationChange(val) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  cachedWidgetsConfig.goal.rotationAnimation = val;
  updateGoalPipPreview();
}

function insertGoalToken(token) {
  const input = document.getElementById('cfg-goal-subtext-format');
  if (!input) return;
  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  const text = input.value;
  input.value = text.substring(0, start) + token + text.substring(end);
  input.focus();
  input.setSelectionRange(start + token.length, start + token.length);
  updateGoalPipPreview();
}

async function customizeGoalFromChat(goalId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const goal = (g.goals || []).find(it => it.id === goalId);
  if (!goal) return;

  const chatStyles = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.styles) || {};
  const accent = chatStyles.borderColor || '#57D6C4';
  const grad = chatStyles.bgGradient || '#38BDF8';

  // Copia editable del estilo del chat
  goal.syncStyleWithChat = false;
  goal.color = accent;
  goal.barColorStart = accent;
  goal.barColorEnd = grad;

  renderMiniAppControls();
  updateGoalPipPreview();
  renderGoalShortcuts();
  alert(`✓ Estilo del Chat copiado a "${goal.title}". Ahora puedes modificar individualmente cualquier color.`);
}

async function copyStylesFromChatToOneGoal(goalId) {
  if (!cachedWidgetsConfig) return;
  const g = cachedWidgetsConfig.goal;
  const goal = (g.goals || []).find(it => it.id === goalId);
  if (!goal) return;

  const chatStyles = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.styles) || {};
  const accent = chatStyles.borderColor || '#57D6C4';
  const grad = chatStyles.bgGradient || '#38BDF8';

  goal.syncStyleWithChat = false;
  goal.color = accent;
  goal.barColorStart = accent;
  goal.barColorEnd = grad;

  renderMiniAppControls();
  updateGoalPipPreview();
  renderGoalShortcuts();
  alert(`✓ Estilo del Chat importado a "${goal.title}". Ahora puedes editar sus colores libremente.`);
}

function toggleGoalItemChatSync(goalId, checked) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const goal = (g.goals || []).find(it => it.id === goalId);
  if (!goal) return;

  goal.syncStyleWithChat = checked;
  renderMiniAppControls();
  updateGoalPipPreview();
  renderGoalShortcuts();
}

async function addNewGoal() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  if (!Array.isArray(g.goals)) g.goals = [];

  const newId = 'goal_custom_' + Date.now();
  const newGoal = {
    id: newId,
    active: true,
    pinnedToCard: true,
    title: 'NUEVA META PERSONALIZADA',
    category: 'custom',
    type: 'custom',
    current: 0,
    target: 50,
    prefix: '',
    suffix: '',
    subtextFormat: '{pct}% COMPLETADO · ¡FALTAN {remaining}!',
    color: '#57D6C4',
    barColorStart: '#57D6C4',
    barColorEnd: '#38BDF8',
    icon: '🎯',
    syncStyleWithChat: false
  };

  g.goals.push(newGoal);
  window.selectedGoalId = newId;
  g.activeGoalId = newId;

  renderMiniAppControls();
  updateGoalPipPreview();
  renderGoalShortcuts();

  await API.triggerWidgetAction('goal', 'add_goal', { goal: newGoal });
}

async function deleteGoalItem(goalId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const target = (g.goals || []).find(it => it.id === goalId);
  if (!target) return;

  if (target.category === 'twitch') {
    alert('Las metas oficiales de Twitch no pueden eliminarse.');
    return;
  }

  if (!confirm(`¿Eliminar la meta personalizada "${target.title}"?`)) return;

  g.goals = (g.goals || []).filter(it => it.id !== goalId);
  g.shortcuts = (g.shortcuts || []).filter(sc => sc.goal_id !== goalId);
  window.selectedGoalId = g.goals[0] ? g.goals[0].id : '';
  g.activeGoalId = window.selectedGoalId;

  renderMiniAppControls();
  updateGoalPipPreview();
  renderGoalShortcuts();

  await API.triggerWidgetAction('goal', 'delete_goal', { goal_id: goalId });
}
