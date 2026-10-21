// ====================================================================
// MÓDULO WIDGET: BARRA DE OBJETIVOS (MULTI-METAS, TWITCH SYNC Y ESTILOS)
// ====================================================================

function renderGoalControls(container) {
  if (!container || !cachedWidgetsConfig) return;
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const g = cachedWidgetsConfig.goal || {};
  const gs = g.styles || {};
  const sameAsChat = g.sameStyleAsChat === true;
  const activeTab = window.activeGoalTab || 'target';

  // Asegurar estructura multi-metas
  if (!g.goals || !Array.isArray(g.goals) || g.goals.length === 0) {
    g.goals = [
      { id: 'goal_followers', active: true, pinnedToCard: true, title: 'OBJETIVO: SEGUIDORES', category: 'twitch', type: 'followers', current: 259, target: 300, prefix: '', suffix: ' follows', subtextFormat: '{pct}% COMPLETADO · ¡FALTAN {remaining}!', color: '#57D6C4', barColorStart: '#57D6C4', barColorEnd: '#38BDF8', icon: '❤️' },
      { id: 'goal_subs', active: true, pinnedToCard: true, title: 'OBJETIVO: SUSCRIPTORES', category: 'twitch', type: 'subscribers', current: 42, target: 50, prefix: '', suffix: ' subs', subtextFormat: '{pct}% COMPLETADO · ¡NUEVOS EMOTES A LOS 50!', color: '#A855F7', barColorStart: '#A855F7', barColorEnd: '#EC4899', icon: '⭐' },
      { id: 'goal_bits', active: false, pinnedToCard: false, title: 'COFRE DE BITS', category: 'twitch', type: 'bits', current: 3200, target: 5000, prefix: '💎 ', suffix: ' bits', subtextFormat: '{pct}% RECAUDADO · ¡GRACIAS POR LOS BITS!', color: '#F59E0B', barColorStart: '#F59E0B', barColorEnd: '#EF4444', icon: '💎' },
      { id: 'goal_maker_filament', active: true, pinnedToCard: true, title: 'META PERSONALIZADA', category: 'custom', type: 'custom', current: 35, target: 60, prefix: '€', suffix: '', subtextFormat: '{current}€ de {target}€ ({pct}%) · ¡Para el próximo proyecto!', color: '#10B981', barColorStart: '#10B981', barColorEnd: '#57D6C4', icon: '🛠️' },
      { id: 'goal_3dprint_pieces', active: false, pinnedToCard: false, title: 'PIEZAS BRAZO ROBÓTICO', category: 'custom', type: 'custom', current: 18, target: 24, prefix: '', suffix: ' pcs', subtextFormat: '{pct}% LISTO · ¡Faltan {remaining} piezas para ensamblar!', color: '#38BDF8', barColorStart: '#38BDF8', barColorEnd: '#6366F1', icon: '🖨️' }
    ];
  }
  if (!g.displayMode) g.displayMode = 'stacked';
  if (!g.rotationInterval) g.rotationInterval = 10;
  if (!g.rotationAnimation) g.rotationAnimation = 'slide_horizontal';
  if (!g.shortcuts) g.shortcuts = [];

  // Meta seleccionada actualmente para edición
  let selId = window.selectedGoalId || g.activeGoalId || (g.goals[0] && g.goals[0].id);
  let selectedGoal = g.goals.find(item => item.id === selId);
  if (!selectedGoal) {
    selectedGoal = g.goals[0];
    selId = selectedGoal ? selectedGoal.id : 'goal_followers';
  }
  window.selectedGoalId = selId;
  const selGoalColor = selectedGoal.color || selectedGoal.barColorStart || '#57D6C4';

  container.innerHTML = `
    <!-- Cabecera de Sub-Pestañas Compactas Goal -->
    <div style="display: flex; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid var(--color-border-dim); padding-bottom: 8px; flex-wrap: wrap;">
      <button type="button" id="goal-subtab-btn-target" class="btn-stage-preset ${activeTab === 'target' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'target' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchGoalSubTab('target')">
        ${tr('widgets.goal_subtab_progress', '🎯 1. Metas & Progreso')} (${g.goals.filter(item => item.active).length}/${g.goals.length} ${tr('widgets.goal_active_word', 'Activas')})
      </button>
      <button type="button" id="goal-subtab-btn-styles" class="btn-stage-preset ${activeTab === 'styles' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'styles' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchGoalSubTab('styles')">
        ${tr('widgets.goal_subtab_styles', '🎨 2. Estilos del Widget')}
      </button>
      <button type="button" id="goal-subtab-btn-presets" class="btn-stage-preset ${activeTab === 'presets' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'presets' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchGoalSubTab('presets')">
        ${tr('widgets.goal_subtab_presets', '⭐ 3. Presets & Atajos')}
      </button>
    </div>

    ${typeof window.buildGoalTargetTabHtml === 'function' ? window.buildGoalTargetTabHtml(g, selectedGoal, selId, selGoalColor, tr, activeTab) : ''}
    ${typeof window.buildGoalStylesTabHtml === 'function' ? window.buildGoalStylesTabHtml(g, gs, sameAsChat, tr, activeTab) : ''}
    ${typeof window.buildGoalPresetsTabHtml === 'function' ? window.buildGoalPresetsTabHtml(g, tr, activeTab) : ''}
  `;

  setTimeout(updateGoalPipPreview, 50);
}

// Variables globales de estado del panel de Goal
window.activeGoalTab = window.activeGoalTab || 'target';
window.selectedGoalId = window.selectedGoalId || 'goal_followers';
