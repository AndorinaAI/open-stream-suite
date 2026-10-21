
// ----------------------------------------------------------------------
// RENDERIZADO DE LA TARJETA PRINCIPAL DEL DASHBOARD (SHORTCUTS & METAS)
// ----------------------------------------------------------------------
function renderGoalShortcuts() {
  const container = document.getElementById('goal-shortcuts-container');
  if (!container || !cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const g = cachedWidgetsConfig.goal;
  const goals = g.goals || [];
  // Metas ancladas a la tarjeta
  const pinnedGoals = goals.filter(it => it.pinnedToCard !== false && it.active !== false);
  const displayGoals = pinnedGoals.length > 0 ? pinnedGoals : goals.filter(it => it.active !== false);

  const modeLabels = {
    stacked: tr('widgets.goal_mode_stacked', '📚 Apiladas'),
    rotative: `${tr('widgets.goal_mode_rotative', '🔄 Carrusel')} (${g.rotationInterval || 10}s)`,
    single: tr('widgets.goal_mode_single', '🎯 Única')
  };

  container.innerHTML = '';

  // 1. Cabecera con selector de modo actual
  const header = document.createElement('div');
  header.style.cssText = 'width: 100%; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 10px; color: var(--color-text-dim);';
  header.innerHTML = `
    <span>${tr('widgets.goal_overlay_mode', 'Overlay')}: <strong>${modeLabels[g.displayMode] || modeLabels.stacked}</strong></span>
    <span>${tr('widgets.goal_pinned_count', 'Metas fijadas')}: <strong>${displayGoals.length}</strong></span>
  `;
  container.appendChild(header);

  // 2. Renderizar cada meta fijada con su barra de progreso y botones coloreados
  displayGoals.forEach(goal => {
    const isTwitch = goal.category === 'twitch';
    const curr = goal.current || 0;
    const targ = Math.max(1, goal.target || 100);
    const pct = Math.min(100, Math.round((curr / targ) * 100));
    const pfx = goal.prefix || '';
    const sfx = goal.suffix || '';
    const goalColor = goal.color || goal.barColorStart || '#57D6C4';

    const cardRow = document.createElement('div');
    cardRow.style.cssText = `background: rgba(0,0,0,0.3); border: 1px solid ${goalColor}40; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px;`;

    const locTitle = tr('widgets.goal_' + goal.id, goal.title || 'OBJETIVO');

    // Barra de progreso y datos
    cardRow.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
          <span style="font-size: 12px; flex-shrink: 0;">${goal.icon || '🎯'}</span>
          <span style="font-size: 11px; font-weight: 800; color: ${goalColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${locTitle}
          </span>
          ${isTwitch ? '<span style="font-size: 9px; padding: 1px 4px; border-radius: 3px; background: rgba(139,92,246,0.2); color: #A78BFA;">Twitch 🔒</span>' : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
          <span style="font-size: 10px; font-weight: 700; color: #fff;">${pfx}${curr}${sfx} / ${pfx}${targ}${sfx}</span>
          <span style="font-size: 10px; font-weight: 800; color: ${goalColor}; background: ${goalColor}20; padding: 1px 5px; border-radius: 4px;">${pct}%</span>
        </div>
      </div>

      <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; margin-bottom: 6px;">
        <div style="width: ${pct}%; height: 100%; background: ${goalColor}; border-radius: 2px;"></div>
      </div>

      <!-- Botones de Acción Rápida COLOREADOS con el color de la barra de ESTA meta -->
      <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
        ${!isTwitch ? `
          <button type="button" class="widget-shortcut-btn" style="font-size: 10px; padding: 2px 8px; border-color: ${goalColor}80; color: ${goalColor}; box-shadow: 0 0 8px ${goalColor}20;" onclick="quickAdjustGoalCurrent(1, '${goal.id}')">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${goalColor};box-shadow:0 0 5px ${goalColor};"></span>
            <span>+1</span>
          </button>
          <button type="button" class="widget-shortcut-btn" style="font-size: 10px; padding: 2px 8px; border-color: ${goalColor}80; color: ${goalColor}; box-shadow: 0 0 8px ${goalColor}20;" onclick="quickAdjustGoalCurrent(5, '${goal.id}')">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${goalColor};box-shadow:0 0 5px ${goalColor};"></span>
            <span>+5</span>
          </button>
          <button type="button" class="widget-shortcut-btn" style="font-size: 10px; padding: 2px 8px; border-color: ${goalColor}60; color: var(--color-text-dim);" onclick="quickAdjustGoalCurrent(-1, '${goal.id}')">
            <span>-1</span>
          </button>
          <button type="button" class="widget-shortcut-btn" style="font-size: 10px; padding: 2px 6px; border-color: rgba(248,113,113,0.3); color: #F87171;" onclick="resetGoalCurrent('${goal.id}')">
            <span>🔄</span>
          </button>
        ` : `
          <span style="font-size: 10px; color: #A78BFA; display: flex; align-items: center; gap: 4px;">
            <span>🔒</span> <span>Sincronizada en vivo con Twitch</span>
          </span>
        `}
      </div>
    `;

    container.appendChild(cardRow);
  });

  // 3. Renderizar botones de atajos personalizados adicionales
  const extraShortcuts = (g.shortcuts || []).filter(s => s.pinned !== false);
  if (extraShortcuts.length > 0) {
    const scDiv = document.createElement('div');
    scDiv.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px;';
    extraShortcuts.forEach(sc => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'widget-shortcut-btn';
      const col = sc.color || '#57D6C4';
      btn.style.borderColor = `${col}80`;
      btn.style.color = col;
      btn.style.boxShadow = `0 0 8px ${col}20`;
      btn.innerHTML = `
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${col};box-shadow:0 0 5px ${col};"></span>
        <span>${sc.label}</span>
      `;
      btn.onclick = () => triggerGoalCustomShortcut(sc.id);
      scDiv.appendChild(btn);
    });
    container.appendChild(scDiv);
  }
}

async function triggerGoalShortcut(goalId) {
  const g = cachedWidgetsConfig?.goal;
  if (!g) return;
  const goal = (g.goals || []).find(item => item.id === goalId) || g;
  await API.triggerWidgetAction('goal', 'increment', {
    goal_id: goal.id,
    amount: 1
  });
}

async function saveGoalControls() {
  if (!cachedWidgetsConfig) return;
  if (!cachedWidgetsConfig.goal) cachedWidgetsConfig.goal = {};
  const g = cachedWidgetsConfig.goal;
  
  // Sincronizar la meta seleccionada en memoria
  const selId = window.selectedGoalId || g.activeGoalId || (g.goals && g.goals[0] && g.goals[0].id);
  const selGoal = (g.goals || []).find(it => it.id === selId);
  if (selGoal) {
    const titleVal = document.getElementById('cfg-goal-title')?.value;
    if (titleVal !== undefined) selGoal.title = titleVal;
    const iconVal = document.getElementById('cfg-goal-icon')?.value;
    if (iconVal !== undefined) selGoal.icon = iconVal;
    if (selGoal.category !== 'twitch') {
      const curVal = parseInt(document.getElementById('cfg-goal-current')?.value, 10);
      if (!isNaN(curVal)) selGoal.current = curVal;
    }
    const targVal = parseInt(document.getElementById('cfg-goal-target')?.value, 10);
    if (!isNaN(targVal)) selGoal.target = targVal;
    const pfx = document.getElementById('cfg-goal-prefix')?.value;
    if (pfx !== undefined) selGoal.prefix = pfx;
    const sfx = document.getElementById('cfg-goal-suffix')?.value;
    if (sfx !== undefined) selGoal.suffix = sfx;
    const sub = document.getElementById('cfg-goal-subtext-format')?.value;
    if (sub !== undefined) selGoal.subtextFormat = sub;
    const col = document.getElementById('cfg-goal-item-color')?.value;
    if (col) selGoal.color = col;
    const bs = document.getElementById('cfg-goal-item-bar-start')?.value;
    if (bs) selGoal.barColorStart = bs;
    const be = document.getElementById('cfg-goal-item-bar-end')?.value;
    if (be) selGoal.barColorEnd = be;
  }

  g.activeGoalId = selId;
  g.celebrateOnFinish = document.getElementById('cfg-goal-celebrate-finish')?.checked !== false;
  g.celebrateSound = document.getElementById('cfg-goal-celebrate-sound')?.checked !== false;
  g.sameStyleAsChat = document.getElementById('cfg-goal-same-as-chat')?.checked === true;
  const rotAnim = document.getElementById('cfg-goal-rotation-anim')?.value;
  if (rotAnim) g.rotationAnimation = rotAnim;

  // Actualizar propiedades legacy para compatibilidad
  if (selGoal) {
    g.title = selGoal.title;
    g.current = selGoal.current;
    g.target = selGoal.target;
    g.prefix = selGoal.prefix;
    g.suffix = selGoal.suffix;
    g.subtextFormat = selGoal.subtextFormat;
    g.category = selGoal.category;
    g.type = selGoal.type;
  }

  if (!g.styles) g.styles = {};
  const gs = g.styles;
  gs.shape = document.getElementById('cfg-goal-shape')?.value || gs.shape || 'rounded';
  gs.bgType = document.getElementById('cfg-goal-bg-type')?.value || gs.bgType || 'glass';
  gs.bgColor = document.getElementById('cfg-goal-bg-color')?.value || gs.bgColor || '#191D21';
  gs.borderStyle = document.getElementById('cfg-goal-border-style')?.value || gs.borderStyle || 'left_neon';
  gs.borderColor = document.getElementById('cfg-goal-border-color')?.value || gs.borderColor || '#57D6C4';
  gs.accentColor = gs.borderColor;
  gs.glowIntensity = parseInt(document.getElementById('cfg-goal-glow-intensity')?.value, 10) || 40;
  gs.barHeight = document.getElementById('cfg-goal-bar-height')?.value || gs.barHeight || 'medium';
  gs.barPattern = document.getElementById('cfg-goal-bar-pattern')?.value || gs.barPattern || 'striped';
  gs.barColorStart = document.getElementById('cfg-goal-bar-start')?.value || gs.barColorStart || '#57D6C4';
  gs.barColorEnd = document.getElementById('cfg-goal-bar-end')?.value || gs.barColorEnd || '#38BDF8';
  gs.fontFamily = document.getElementById('cfg-goal-font-family')?.value || gs.fontFamily || 'outfit';
  gs.customCSS = document.getElementById('cfg-goal-custom-css')?.value || '';

  if (g.sameStyleAsChat) {
    await copyStylesFromChatToGoal(false);
  }

  // Notificar al backend para broadcast WebSocket inmediato
  await API.triggerWidgetAction('goal', 'update', {
    displayMode: g.displayMode,
    rotationInterval: g.rotationInterval,
    rotationAnimation: g.rotationAnimation,
    activeGoalId: g.activeGoalId,
    goals: g.goals,
    title: g.title,
    current: g.current,
    target: g.target,
    prefix: g.prefix,
    suffix: g.suffix,
    subtextFormat: g.subtextFormat,
    category: g.category,
    type: g.type,
    color: gs.borderColor,
    sameStyleAsChat: g.sameStyleAsChat,
    celebrateOnFinish: g.celebrateOnFinish,
    celebrateSound: g.celebrateSound,
    styles: gs
  });
}

// Exponer funciones en window para compatibilidad
window.renderGoalShortcuts = renderGoalShortcuts;
window.triggerGoalShortcut = triggerGoalShortcut;
window.renderGoalControls = renderGoalControls;
window.saveGoalControls = saveGoalControls;
window.switchGoalSubTab = switchGoalSubTab;
window.selectGoalItem = selectGoalItem;
window.toggleGoalActive = toggleGoalActive;
window.toggleGoalPinToCard = toggleGoalPinToCard;
window.setGoalDisplayMode = setGoalDisplayMode;
window.onGoalRotationIntervalChange = onGoalRotationIntervalChange;
window.onGoalRotationAnimationChange = onGoalRotationAnimationChange;
window.insertGoalToken = insertGoalToken;
window.customizeGoalFromChat = customizeGoalFromChat;
window.copyStylesFromChatToOneGoal = copyStylesFromChatToOneGoal;
window.toggleGoalItemChatSync = toggleGoalItemChatSync;
window.addNewGoal = addNewGoal;
window.deleteGoalItem = deleteGoalItem;
window.setCustomGoalPreset = setCustomGoalPreset;
window.quickAdjustGoalCurrent = quickAdjustGoalCurrent;
window.resetGoalCurrent = resetGoalCurrent;
window.pinGoalQuickAction = pinGoalQuickAction;
window.addGoalQuickActionFromForm = addGoalQuickActionFromForm;
window.deleteGoalQuickAction = deleteGoalQuickAction;
window.triggerGoalCustomShortcut = triggerGoalCustomShortcut;
window.testGoalCelebration = testGoalCelebration;
window.updateGoalPipPreview = updateGoalPipPreview;
window.toggleGoalSameStyleAsChat = toggleGoalSameStyleAsChat;
window.copyStylesFromChatToGoal = copyStylesFromChatToGoal;
window.onGoalPresetChange = onGoalPresetChange;
window.saveCurrentGoalPreset = saveCurrentGoalPreset;
window.exportGoalPresetJson = exportGoalPresetJson;
window.deleteGoalPreset = deleteGoalPreset;

window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['goal'] = {
  renderControls: renderGoalControls,
  saveControls: saveGoalControls,
  renderShortcuts: renderGoalShortcuts,
  updatePreview: typeof updateGoalPipPreview === 'function' ? updateGoalPipPreview : () => {}
};
