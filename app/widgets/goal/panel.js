// ====================================================================
// MÓDULO WIDGET: BARRA DE OBJETIVOS (MULTI-METAS, TWITCH SYNC Y ESTILOS)
// ====================================================================

function renderGoalControls(container) {
  if (!container || !cachedWidgetsConfig) return;
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
  const isTwitch = selectedGoal.category === 'twitch';
  const selGoalColor = selectedGoal.color || selectedGoal.barColorStart || '#57D6C4';

  container.innerHTML = `
    <!-- Cabecera de Sub-Pestañas Compactas Goal -->
    <div style="display: flex; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid var(--color-border-dim); padding-bottom: 8px; flex-wrap: wrap;">
      <button type="button" id="goal-subtab-btn-target" class="btn-stage-preset ${activeTab === 'target' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'target' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchGoalSubTab('target')">
        🎯 1. Metas & Progreso (${g.goals.filter(item => item.active).length}/${g.goals.length} Activas)
      </button>
      <button type="button" id="goal-subtab-btn-styles" class="btn-stage-preset ${activeTab === 'styles' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'styles' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchGoalSubTab('styles')">
        🎨 2. Estilos del Widget
      </button>
      <button type="button" id="goal-subtab-btn-presets" class="btn-stage-preset ${activeTab === 'presets' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'presets' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchGoalSubTab('presets')">
        ⭐ 3. Presets & Atajos
      </button>
    </div>

    <!-- ============================================================== -->
    <!-- SUB-PESTAÑA 1: GESTIÓN DE METAS MÚLTIPLES Y PROGRESO           -->
    <!-- ============================================================== -->
    <div id="goal-tab-target" style="display: ${activeTab === 'target' ? 'block' : 'none'};">
      
      <!-- BARRA SUPERIOR: MODO DE VISUALIZACIÓN EN OVERLAY, CARRUSEL Y NUEVA META -->
      <div style="background: rgba(25, 29, 33, 0.7); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 700; color: var(--color-text-dim); text-transform: uppercase;">Modo Overlay OBS:</span>
          <div style="display: flex; gap: 4px;">
            <button type="button" class="btn-stage-preset ${g.displayMode === 'stacked' ? 'active' : ''}" style="font-size: 11px; padding: 4px 10px; ${g.displayMode === 'stacked' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15); font-weight: 700;' : ''}" onclick="setGoalDisplayMode('stacked')">
              📚 Apiladas (Todas)
            </button>
            <button type="button" class="btn-stage-preset ${g.displayMode === 'rotative' ? 'active' : ''}" style="font-size: 11px; padding: 4px 10px; ${g.displayMode === 'rotative' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15); font-weight: 700;' : ''}" onclick="setGoalDisplayMode('rotative')">
              🔄 Carrusel Rotativo
            </button>
            <button type="button" class="btn-stage-preset ${g.displayMode === 'single' ? 'active' : ''}" style="font-size: 11px; padding: 4px 10px; ${g.displayMode === 'single' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15); font-weight: 700;' : ''}" onclick="setGoalDisplayMode('single')">
              🎯 Meta Única
            </button>
          </div>

          ${g.displayMode === 'rotative' ? `
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #57D6C4; background: rgba(87,214,196,0.08); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(87,214,196,0.2);">
              <span>⏱️ Ciclo:</span>
              <input type="number" id="cfg-goal-rotation-interval" min="3" max="120" value="${g.rotationInterval || 10}" style="width: 48px; padding: 2px 4px; font-size: 11px; background: #0B0D0F; border: 1px solid var(--color-border-dim); border-radius: 4px; color: #fff;" onchange="onGoalRotationIntervalChange(this.value)" oninput="updateGoalPipPreview()">
              <span>s</span>
              <span style="opacity: 0.4;">|</span>
              <span>✨ Animación:</span>
              <select id="cfg-goal-rotation-anim" class="form-select" style="padding: 2px 6px; font-size: 11px; width: auto; height: 26px;" onchange="onGoalRotationAnimationChange(this.value)">
                <option value="slide_horizontal" ${g.rotationAnimation === 'slide_horizontal' ? 'selected' : ''}>↔️ Desplazamiento Horizontal (Slide)</option>
                <option value="fade_scale" ${g.rotationAnimation === 'fade_scale' ? 'selected' : ''}>🔍 Zoom Suave & Fade (Scale)</option>
                <option value="flip_vertical" ${g.rotationAnimation === 'flip_vertical' ? 'selected' : ''}>🔄 Giro 3D Vertical (Flip)</option>
                <option value="neon_glitch" ${g.rotationAnimation === 'neon_glitch' ? 'selected' : ''}>⚡ Glitch Holográfico Neón</option>
                <option value="slot_bounce" ${g.rotationAnimation === 'slot_bounce' ? 'selected' : ''}>🎰 Ruleta / Slot Machine (Bounce)</option>
                <option value="blur_flow" ${g.rotationAnimation === 'blur_flow' ? 'selected' : ''}>💧 Desenfoque Líquido (Blur Flow)</option>
              </select>
            </div>
          ` : ''}
        </div>

        <button type="button" class="btn-action-test" style="font-size: 11px; padding: 5px 12px; display: flex; align-items: center; gap: 6px;" onclick="addNewGoal()">
          <span>➕</span> <span>Nueva Meta Libre</span>
        </button>
      </div>

      <!-- 2 COLUMNAS: IZQUIERDA = LISTA DE METAS, DERECHA = EDITOR DE LA META SELECCIONADA -->
      <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 14px; align-items: start;">
        
        <!-- COLUMNA IZQUIERDA: LISTA DE METAS CON ANCLAJE A TARJETA -->
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 580px; overflow-y: auto; padding-right: 4px;">
          <div style="font-size: 10px; font-weight: 700; color: var(--color-text-dim); text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
            <span>Metas Configuradas (${g.goals.length}):</span>
            <span style="font-size: 9px; color: #8B969C;">👁️ Overlay | 📌 Tarjeta</span>
          </div>
          
          ${g.goals.map(item => {
            const isSelected = item.id === selId;
            const isTwitchGoal = item.category === 'twitch';
            const pct = Math.min(100, Math.round(((item.current || 0) / Math.max(1, item.target || 100)) * 100));
            const badgeBg = isTwitchGoal ? 'rgba(139,92,246,0.18)' : 'rgba(87,214,196,0.18)';
            const badgeColor = isTwitchGoal ? '#A78BFA' : '#57D6C4';
            const badgeBorder = isTwitchGoal ? 'rgba(139,92,246,0.4)' : 'rgba(87,214,196,0.4)';
            const badgeText = isTwitchGoal ? '🟣 Twitch Oficial 🔒' : '🛠️ Personalizado';
            const itemColor = item.color || item.barColorStart || '#57D6C4';
            const isPinned = item.pinnedToCard !== false;

            return `
              <div onclick="selectGoalItem('${item.id}')" style="cursor: pointer; border-radius: 6px; padding: 10px 12px; background: ${isSelected ? 'rgba(87,214,196,0.08)' : 'rgba(25,29,33,0.6)'}; border: 1px solid ${isSelected ? itemColor : 'var(--color-border-dim)'}; ${isSelected ? `box-shadow: 0 0 10px ${itemColor}30;` : ''} transition: all 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
                    <!-- Toggle Visibilidad Overlay -->
                    <label onclick="event.stopPropagation()" style="cursor: pointer; display: flex; align-items: center;" title="${item.active ? 'Visible en Overlay OBS' : 'Oculta en Overlay OBS'}">
                      <input type="checkbox" ${item.active ? 'checked' : ''} onchange="toggleGoalActive('${item.id}', event)">
                    </label>

                    <!-- Toggle Anclaje Tarjeta Dashboard -->
                    <button type="button" onclick="toggleGoalPinToCard('${item.id}', event)" style="background: none; border: none; cursor: pointer; padding: 0 2px; font-size: 13px; opacity: ${isPinned ? '1' : '0.35'};" title="${isPinned ? 'Anclada a la tarjeta del panel principal' : 'No anclada a la tarjeta del panel'}">
                      📌
                    </button>

                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${itemColor};box-shadow:0 0 6px ${itemColor};flex-shrink:0;"></span>

                    <span style="font-size: 12px; font-weight: 800; color: ${isSelected ? itemColor : '#fff'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
                      ${item.icon || (isTwitchGoal ? '❤️' : '🎯')} ${item.title || 'Meta'}
                    </span>
                  </div>
                  <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-weight: 700; white-space: nowrap;">
                    ${badgeText}
                  </span>
                </div>

                <!-- Barra de progreso miniatura -->
                <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
                  <div style="width: ${pct}%; height: 100%; background: ${itemColor}; border-radius: 3px;"></div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--color-text-dim);">
                  <span>${item.prefix || ''}${item.current || 0}${item.suffix || ''} / ${item.prefix || ''}${item.target || 100}${item.suffix || ''}</span>
                  <span style="font-weight: 700; color: ${isSelected ? itemColor : '#fff'};">${pct}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- COLUMNA DERECHA: EDITOR COMPLETO DE LA META SELECCIONADA -->
        <div style="background: rgba(25, 29, 33, 0.7); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          
          <!-- Encabezado de la meta seleccionada -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border-dim); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${selGoalColor};box-shadow:0 0 8px ${selGoalColor};"></span>
              <span style="font-size: 13px; font-weight: 800; color: ${selGoalColor};">
                ${isTwitch ? '🟣 Meta Oficial Twitch' : '🎯 Meta Personalizada'}
              </span>
              ${isTwitch ? `
                <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(139,92,246,0.2); color: #A78BFA; border: 1px solid rgba(139,92,246,0.4); font-weight: 700;">
                  🔒 Auto-Sync Helix
                </span>
              ` : ''}
            </div>

            <div style="display: flex; gap: 6px; align-items: center;">
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; ${selectedGoal.pinnedToCard !== false ? 'border-color: #57D6C4; color: #57D6C4;' : ''}" onclick="toggleGoalPinToCard('${selectedGoal.id}')" title="Mostrar u ocultar en la tarjeta exterior">
                ${selectedGoal.pinnedToCard !== false ? '📌 Anclada a Tarjeta' : '📌 Anclar a Tarjeta'}
              </button>

              ${!isTwitch ? `
                <button type="button" class="btn-stage-preset" style="color: #F87171; border-color: rgba(248,113,113,0.3); font-size: 10px; padding: 3px 8px;" onclick="deleteGoalItem('${selectedGoal.id}')" title="Eliminar esta meta personalizada">
                  🗑️ Eliminar
                </button>
              ` : `
                <span style="font-size: 10px; color: var(--color-text-dim);">Oficial (No eliminable)</span>
              `}
            </div>
          </div>

          <!-- Título e Icono de la Meta -->
          <div style="display: grid; grid-template-columns: 70px 1fr; gap: 8px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 700;">Icono:</label>
              <input type="text" id="cfg-goal-icon" class="form-input" style="text-align: center; font-size: 14px;" value="${selectedGoal.icon || '🎯'}" oninput="updateGoalPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 700; text-transform: uppercase;">Título Visible en Pantalla:</label>
              <input type="text" id="cfg-goal-title" class="form-input" value="${selectedGoal.title || ''}" oninput="updateGoalPipPreview()">
            </div>
          </div>

          ${isTwitch ? `
            <!-- AVISO DE SINCRONIZACIÓN AUTOMÁTICA DE TWITCH (NO FALSEABLE) -->
            <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #D8B4FE; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">🔒</span>
              <div>
                <strong>Sincronización Oficial Automática:</strong> El progreso actual refleja en tiempo real tus métricas de Twitch (${selectedGoal.type}). No es modificable manualmente para garantizar transparencia total.
              </div>
            </div>
          ` : `
            <!-- PRESETS RÁPIDOS PARA META PERSONALIZADA -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px;" onclick="setCustomGoalPreset('coffee')">☕ Cafés / Donación</button>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px;" onclick="setCustomGoalPreset('3dprint')">🖨️ Piezas 3D / Maker</button>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px;" onclick="setCustomGoalPreset('wins')">🏆 Reto Gamer / Wins</button>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px;" onclick="setCustomGoalPreset('community')">🍕 Reto Comunidad</button>
            </div>
          `}

          <!-- CONTADORES: PROGRESO ACTUAL, OBJETIVO, PREFIJO Y SUFIJO -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 0.7fr 0.7fr; gap: 8px;">
            <div class="form-group" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: 11px; margin-bottom: 0;">Progreso Actual:</label>
                ${isTwitch ? '<span style="font-size: 10px; color: #A78BFA;">🔒 Twitch</span>' : ''}
              </div>
              <input type="number" id="cfg-goal-current" class="form-input" value="${selectedGoal.current || 0}" ${isTwitch ? 'disabled style="background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.4); color: #D8B4FE; cursor: not-allowed;"' : 'oninput="updateGoalPipPreview()"'}>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; margin-bottom: 4px;">Objetivo Final:</label>
              <input type="number" id="cfg-goal-target" class="form-input" value="${selectedGoal.target || 100}" oninput="updateGoalPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; margin-bottom: 4px;">Prefijo:</label>
              <input type="text" id="cfg-goal-prefix" class="form-input" placeholder="ej: €" value="${selectedGoal.prefix || ''}" oninput="updateGoalPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; margin-bottom: 4px;">Sufijo:</label>
              <input type="text" id="cfg-goal-suffix" class="form-input" placeholder="ej: follows" value="${selectedGoal.suffix || ''}" oninput="updateGoalPipPreview()">
            </div>
          </div>

          <!-- BOTONES DE AJUSTE RÁPIDO ASIGNADOS A ESTA META CON SU COLOR DE BARRA -->
          ${!isTwitch ? `
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 8px 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 10px; font-weight: 700; color: ${selGoalColor}; text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${selGoalColor};box-shadow:0 0 6px ${selGoalColor};"></span>
                  Acciones Rápidas para "${selectedGoal.title}":
                </span>
                <span style="font-size: 9px; color: var(--color-text-dim);">Color de barra: ${selGoalColor}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 3px 8px; border-color: ${selGoalColor}60; color: ${selGoalColor};" onclick="quickAdjustGoalCurrent(-10)">-10</button>
                <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 3px 8px; border-color: ${selGoalColor}60; color: ${selGoalColor};" onclick="quickAdjustGoalCurrent(-5)">-5</button>
                <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 3px 8px; border-color: ${selGoalColor}60; color: ${selGoalColor};" onclick="quickAdjustGoalCurrent(-1)">-1</button>
                <button type="button" class="btn-action-test" style="font-size: 11px; padding: 3px 10px; border-color: ${selGoalColor}; background: ${selGoalColor}20; color: ${selGoalColor}; box-shadow: 0 0 8px ${selGoalColor}25;" onclick="quickAdjustGoalCurrent(1)">+1</button>
                <button type="button" class="btn-action-test" style="font-size: 11px; padding: 3px 10px; border-color: ${selGoalColor}; background: ${selGoalColor}20; color: ${selGoalColor}; box-shadow: 0 0 8px ${selGoalColor}25;" onclick="quickAdjustGoalCurrent(5)">+5</button>
                <button type="button" class="btn-action-test" style="font-size: 11px; padding: 3px 10px; border-color: ${selGoalColor}; background: ${selGoalColor}20; color: ${selGoalColor}; box-shadow: 0 0 8px ${selGoalColor}25;" onclick="quickAdjustGoalCurrent(10)">+10</button>
                <button type="button" class="btn-stage-preset" style="color: #F87171; font-size: 11px; padding: 3px 8px;" onclick="resetGoalCurrent()">🔄 Reset</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; color: ${selGoalColor}; border-color: ${selGoalColor}80; margin-left: auto;" onclick="pinGoalQuickAction('${selectedGoal.id}', 5)">
                  ➕ Fijar "+5" en Tarjeta
                </button>
              </div>
            </div>
          ` : `
            <div style="font-size: 10px; color: var(--color-text-dim); display: flex; align-items: center; gap: 6px;">
              <span>💡</span>
              <span>Cada nuevo follow, sub o bits recibido en directo incrementará esta meta automáticamente en Twitch Helix.</span>
            </div>
          `}

          <!-- SUBTEXTO DINÁMICO CON GUÍA DE TOKENS {} Y CHIPS DE INSERCIÓN -->
          <div class="form-group" style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="font-size: 11px; margin-bottom: 0; font-weight: 700;">Formato del Subtexto Inferior:</label>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px;" onclick="openWidgetDevGuideModal('goal')">📖 Guía de Tokens</button>
            </div>
            <input type="text" id="cfg-goal-subtext-format" class="form-input" value="${selectedGoal.subtextFormat || '{pct}% COMPLETADO · ¡FALTAN {remaining}!'}" oninput="updateGoalPipPreview()">
            
            <!-- GUÍA INTERACTIVA DE TOKENS CON INSERCIÓN EN 1-CLIC -->
            <div style="margin-top: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 6px 8px;">
              <div style="font-size: 10px; font-weight: 700; color: var(--color-accent-cyan); margin-bottom: 4px;">
                💡 Pulsa cualquier etiqueta para insertarla en el texto:
              </div>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #57D6C4;" onclick="insertGoalToken('{pct}')" title="Porcentaje completado (0-100)">{pct} = % Completado</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #38BDF8;" onclick="insertGoalToken('{current}')" title="Progreso actual acumulado">{current} = Progreso Actual</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #A78BFA;" onclick="insertGoalToken('{target}')" title="Objetivo final fijado">{target} = Meta Final</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #F59E0B;" onclick="insertGoalToken('{remaining}')" title="Cantidad restante para completar">{remaining} = Falta para Meta</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #10B981;" onclick="insertGoalToken('{prefix}')" title="Prefijo configurado (€, $, #)">{prefix} = Prefijo</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #EC4899;" onclick="insertGoalToken('{suffix}')" title="Sufijo configurado (subs, follows)">{suffix} = Sufijo</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #E2E8F0;" onclick="insertGoalToken('{title}')" title="Nombre de la meta">{title} = Título</button>
              </div>
            </div>
          </div>

          <!-- ESTILIZACIÓN ESPECÍFICA DE ESTA META & CHAT SYNC INDIVIDUAL -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <span style="font-size: 11px; font-weight: 700; color: ${selGoalColor}; text-transform: uppercase;">
                🎨 Estilo Visual de "${selectedGoal.title}"
              </span>
              <span style="font-size: 9px; padding: 2px 7px; border-radius: 4px; font-weight: 700; ${selectedGoal.syncStyleWithChat ? 'background: rgba(87,214,196,0.2); color: #57D6C4; border: 1px solid rgba(87,214,196,0.4);' : 'background: rgba(255,255,255,0.06); color: var(--color-text-dim); border: 1px solid var(--color-border-dim);'}">
                ${selectedGoal.syncStyleWithChat ? '🟢 ANCLADO AL CHAT' : '🎨 PERSONALIZADO'}
              </span>
            </div>

            <!-- Panel de Estado: Anclado vs Personalizado con acción directa -->
            ${selectedGoal.syncStyleWithChat ? `
              <div style="background: rgba(87,214,196,0.08); border: 1px solid rgba(87,214,196,0.3); border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div style="font-size: 11px; color: #CBD5E1; line-height: 1.4;">
                  🔗 <strong>Estilo Anclado al Chat en Directo</strong><br>
                  <span style="font-size: 10px; color: var(--color-text-dim);">Esta meta hereda automáticamente el color de acento y gradiente del Chat en vivo.</span>
                </div>
                <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 12px; display: flex; align-items: center; gap: 6px;" onclick="customizeGoalFromChat('${selectedGoal.id}')" title="Copia el estilo del chat a esta meta y desbloquea sus colores para editarlos">
                  <span>🎨</span>
                  <span>Personalizar (Desvincular y Editar)</span>
                </button>
              </div>
            ` : `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div style="font-size: 11px; color: var(--color-text-dim);">
                  🎨 <strong>Colores Propios Editables</strong> (No se modifican si cambias el Chat).
                </div>
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 4px 10px; color: #57D6C4; border-color: rgba(87,214,196,0.4);" onclick="copyStylesFromChatToOneGoal('${selectedGoal.id}')" title="Copia los colores actuales del chat manteniendo la edición libre">
                    📥 Re-importar del Chat
                  </button>
                  <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 4px 10px; color: #A78BFA; border-color: rgba(167,139,250,0.4);" onclick="toggleGoalItemChatSync('${selectedGoal.id}', true)" title="Vuelve a anclar esta meta al Chat en vivo">
                    🔗 Volver a Anclar al Chat
                  </button>
                </div>
              </div>
            `}

            <!-- Selectores de color de esta meta individual -->
            <div id="box-goal-item-colors" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; opacity: ${selectedGoal.syncStyleWithChat ? '0.45' : '1'}; pointer-events: ${selectedGoal.syncStyleWithChat ? 'none' : 'auto'};">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Color Acento / Texto:</label>
                <input type="color" id="cfg-goal-item-color" value="${selectedGoal.color || '#57D6C4'}" style="height: 30px; width: 100%; border: 1px solid var(--color-border-dim); border-radius: 4px; background: transparent; cursor: pointer;" oninput="updateGoalPipPreview()">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Barra Inicio:</label>
                <input type="color" id="cfg-goal-item-bar-start" value="${selectedGoal.barColorStart || '#57D6C4'}" style="height: 30px; width: 100%; border: 1px solid var(--color-border-dim); border-radius: 4px; background: transparent; cursor: pointer;" oninput="updateGoalPipPreview()">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 10px;">Barra Fin:</label>
                <input type="color" id="cfg-goal-item-bar-end" value="${selectedGoal.barColorEnd || '#38BDF8'}" style="height: 30px; width: 100%; border: 1px solid var(--color-border-dim); border-radius: 4px; background: transparent; cursor: pointer;" oninput="updateGoalPipPreview()">
              </div>
            </div>
          </div>

          <!-- CELEBRACIÓN -->
          <div style="display: flex; gap: 16px; background: rgba(255, 255, 255, 0.03); border: 1px dashed var(--color-border-dim); border-radius: 6px; padding: 8px 12px; flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer;">
              <input type="checkbox" id="cfg-goal-celebrate-finish" ${g.celebrateOnFinish !== false ? 'checked' : ''} onchange="updateGoalPipPreview()">
              <span>🎉 Confeti al alcanzar el 100%</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer;">
              <input type="checkbox" id="cfg-goal-celebrate-sound" ${g.celebrateSound !== false ? 'checked' : ''}>
              <span>🔔 Fanfarria de victoria</span>
            </label>
          </div>

          <!-- BOTÓN DESTACADO GUARDAR / ACTUALIZAR OBS -->
          <button type="button" class="btn-action-primary" style="font-size: 12px; font-weight: 800; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; box-shadow: 0 0 14px rgba(87,214,196,0.25);" onclick="saveMiniAppControls('goal')">
            🚀 GUARDAR Y ACTUALIZAR EN PANTALLA (OBS)
          </button>

        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- SUB-PESTAÑA 2: ESTILOS VISUALES DEL CONTENEDOR (MARCO Y FORMA) -->
    <!-- ============================================================== -->
    <div id="goal-tab-styles" style="display: ${activeTab === 'styles' ? 'block' : 'none'};">
      
      <!-- BARRA DE ACCIÓN: IMPORTAR SILUETA Y FONDO DEL CHAT -->
      <div style="background: rgba(25, 29, 33, 0.5); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="font-size: 12px; color: #CBD5E1; display: flex; align-items: center; gap: 8px;">
          <span>🎨</span>
          <span><strong>Estilos del Contenedor de Metas</strong> (Silueta, Bordes, Fondo y Tipografía)</span>
        </div>
        <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 5px 12px; color: #57D6C4; border-color: rgba(87,214,196,0.5); background: rgba(87,214,196,0.08);" onclick="copyStylesFromChatToGoal(true)" title="Copia la silueta, fondo y tipografía del Chat como base sin bloquear la edición">
          📥 Importar forma y fondo del Chat
        </button>
      </div>

      <!-- CONTROLES VISUALES 100% DISPONIBLES Y EDITABLES -->
      <div id="goal-style-controls-wrapper">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          
          <!-- Columna 1: Forma, Fondo y Bordes -->
          <div style="display: flex; flex-direction: column; gap: 10px; background: rgba(25, 29, 33, 0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 12px;">
            <span style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">1. Estructura & Contenedor</span>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">Silueta / Forma del Widget:</label>
              <select id="cfg-goal-shape" class="form-select" onchange="updateGoalPipPreview()">
                <option value="rounded" ${gs.shape === 'rounded' ? 'selected' : ''}>🟦 Redondeado Estándar (Glassmorphism)</option>
                <option value="scifi" ${gs.shape === 'scifi' ? 'selected' : ''}>📐 Sci-Fi (Esquinas Biseladas)</option>
                <option value="arcade" ${gs.shape === 'arcade' ? 'selected' : ''}>👾 Arcade Retro Pixel</option>
                <option value="pill" ${gs.shape === 'pill' ? 'selected' : ''}>💊 Pill / Cápsula</option>
                <option value="slant" ${gs.shape === 'slant' ? 'selected' : ''}>⚡ Slant (Inclinado Dinámico)</option>
                <option value="soft_card" ${gs.shape === 'soft_card' ? 'selected' : ''}>☁️ Soft Card (Flotante Moderno)</option>
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Fondo:</label>
                <select id="cfg-goal-bg-type" class="form-select" onchange="updateGoalPipPreview()">
                  <option value="glass" ${gs.bgType === 'glass' ? 'selected' : ''}>Glassmorphism</option>
                  <option value="gradient" ${gs.bgType === 'gradient' ? 'selected' : ''}>Degradado</option>
                  <option value="solid" ${gs.bgType === 'solid' ? 'selected' : ''}>Sólido</option>
                  <option value="transparent" ${gs.bgType === 'transparent' ? 'selected' : ''}>Transparente</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Color Fondo:</label>
                <input type="color" id="cfg-goal-bg-color" value="${gs.bgColor || '#191D21'}" style="height: 34px; width: 100%; border: 1px solid var(--color-border-dim); border-radius: 4px; background: transparent; cursor: pointer;" oninput="updateGoalPipPreview()">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Estilo de Borde:</label>
                <select id="cfg-goal-border-style" class="form-select" onchange="updateGoalPipPreview()">
                  <option value="left_neon" ${gs.borderStyle === 'left_neon' ? 'selected' : ''}>Neón Izquierdo</option>
                  <option value="all_neon" ${gs.borderStyle === 'all_neon' ? 'selected' : ''}>Neón Completo</option>
                  <option value="tech_corners" ${gs.borderStyle === 'tech_corners' ? 'selected' : ''}>Esquinas Tech</option>
                  <option value="none" ${gs.borderStyle === 'none' ? 'selected' : ''}>Sin Borde</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Color Borde / Acento:</label>
                <input type="color" id="cfg-goal-border-color" value="${gs.borderColor || '#57D6C4'}" style="height: 34px; width: 100%; border: 1px solid var(--color-border-dim); border-radius: 4px; background: transparent; cursor: pointer;" oninput="updateGoalPipPreview()">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <label>Brillo Neón (Glow):</label>
                <span id="cfg-goal-glow-val">${gs.glowIntensity !== undefined ? gs.glowIntensity : 40}%</span>
              </div>
              <input type="range" id="cfg-goal-glow-intensity" min="0" max="100" value="${gs.glowIntensity !== undefined ? gs.glowIntensity : 40}" class="form-range" oninput="document.getElementById('cfg-goal-glow-val').textContent = this.value + '%'; updateGoalPipPreview();">
            </div>
          </div>

          <!-- Columna 2: Barra, Patrones y Tipografía -->
          <div style="display: flex; flex-direction: column; gap: 10px; background: rgba(25, 29, 33, 0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 12px;">
            <span style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">2. Barra de Progreso & Tipografía</span>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Altura de Barra:</label>
                <select id="cfg-goal-bar-height" class="form-select" onchange="updateGoalPipPreview()">
                  <option value="slim" ${gs.barHeight === 'slim' ? 'selected' : ''}>Slim (8px)</option>
                  <option value="medium" ${gs.barHeight === 'medium' ? 'selected' : ''}>Medium (14px)</option>
                  <option value="thick" ${gs.barHeight === 'thick' ? 'selected' : ''}>Thick (22px)</option>
                  <option value="massive" ${gs.barHeight === 'massive' ? 'selected' : ''}>Massive (32px)</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Patrón de Relleno:</label>
                <select id="cfg-goal-bar-pattern" class="form-select" onchange="updateGoalPipPreview()">
                  <option value="striped" ${gs.barPattern === 'striped' ? 'selected' : ''}>Rayas Animadas (Striped)</option>
                  <option value="smooth" ${gs.barPattern === 'smooth' ? 'selected' : ''}>Degradado Suave (Smooth)</option>
                  <option value="tech_segments" ${gs.barPattern === 'tech_segments' ? 'selected' : ''}>Segmentos LED (Tech)</option>
                  <option value="cyber_grid" ${gs.barPattern === 'cyber_grid' ? 'selected' : ''}>Rejilla Cyberpunk</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Color Barra Inicio:</label>
                <input type="color" id="cfg-goal-bar-start" value="${gs.barColorStart || '#57D6C4'}" style="height: 34px; width: 100%; border: 1px solid var(--color-border-dim); border-radius: 4px; background: transparent; cursor: pointer;" oninput="updateGoalPipPreview()">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Color Barra Fin:</label>
                <input type="color" id="cfg-goal-bar-end" value="${gs.barColorEnd || '#38BDF8'}" style="height: 34px; width: 100%; border: 1px solid var(--color-border-dim); border-radius: 4px; background: transparent; cursor: pointer;" oninput="updateGoalPipPreview()">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">Tipografía:</label>
              <select id="cfg-goal-font-family" class="form-select" onchange="updateGoalPipPreview()">
                <option value="outfit" ${gs.fontFamily === 'outfit' ? 'selected' : ''}>Outfit (Moderna & Limpia)</option>
                <option value="inter" ${gs.fontFamily === 'inter' ? 'selected' : ''}>Inter (UI Profesional)</option>
                <option value="rajdhani" ${gs.fontFamily === 'rajdhani' ? 'selected' : ''}>Rajdhani (Técnica & Bold)</option>
                <option value="orbitron" ${gs.fontFamily === 'orbitron' ? 'selected' : ''}>Orbitron (Futurista Sci-Fi)</option>
                <option value="space_grotesk" ${gs.fontFamily === 'space_grotesk' ? 'selected' : ''}>Space Grotesk (Tech Editorial)</option>
                <option value="arcade" ${gs.fontFamily === 'arcade' ? 'selected' : ''}>Press Start 2P (Pixel 8-Bit)</option>
                <option value="fredoka" ${gs.fontFamily === 'fredoka' ? 'selected' : ''}>Fredoka (Amigable & Redonda)</option>
                <option value="montserrat" ${gs.fontFamily === 'montserrat' ? 'selected' : ''}>Montserrat (Elegante & Sólida)</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: 11px; margin-bottom: 0;">CSS Adicional (Opcional):</label>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: var(--color-accent-cyan);" onclick="openWidgetCssGuideModal('goal')">🎨 Guía CSS & Clases</button>
              </div>
              <textarea id="cfg-goal-custom-css" class="form-textarea" rows="2" placeholder="ej: .goal-widget-card { transform: scale(1.05); }" oninput="updateGoalPipPreview()">${gs.customCSS || ''}</textarea>
            </div>

          </div>

        </div>

        <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 12px;" onclick="openWidgetCssGuideModal('goal')">
            🎨 Ver Ejemplos de CSS Personalizado
          </button>
          <button type="button" class="btn-action-primary" style="font-size: 12px; padding: 8px 16px;" onclick="saveMiniAppControls('goal')">💾 Guardar Estilos</button>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- SUB-PESTAÑA 3: PRESETS, ATAJOS & STREAM DECK                  -->
    <!-- ============================================================== -->
    <div id="goal-tab-presets" style="display: ${activeTab === 'presets' ? 'block' : 'none'};">
      
      <!-- 0. ANCLAJE DE METAS ACTIVAS A LA TARJETA PRINCIPAL (DASHBOARD) -->
      <div style="background: rgba(25, 29, 33, 0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">
            📌 1. Metas Visibles en la Tarjeta del Panel (Dashboard Principal)
          </span>
          <span style="font-size: 10px; color: var(--color-text-dim);">
            ${g.goals.filter(it => it.pinnedToCard !== false).length} de ${g.goals.length} Ancladas
          </span>
        </div>
        <div style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 10px; line-height: 1.4;">
          Elige qué metas mostrar en la tarjeta exterior de la suite para ver su progreso y pulsar sus botones directos:
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;">
          ${g.goals.map(it => {
            const isPinned = it.pinnedToCard !== false;
            const itemColor = it.color || it.barColorStart || '#57D6C4';
            const isTwitch = it.category === 'twitch';
            return `
              <label style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.25); border: 1px solid ${isPinned ? itemColor : 'var(--color-border-dim)'}; border-radius: 6px; padding: 8px 10px; cursor: pointer; transition: all 0.2s ease;">
                <input type="checkbox" ${isPinned ? 'checked' : ''} onchange="toggleGoalPinToCard('${it.id}', event)">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${itemColor};box-shadow:0 0 6px ${itemColor};flex-shrink:0;"></span>
                <div style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
                  <strong style="font-size: 11px; color: ${isPinned ? '#fff' : 'var(--color-text-dim)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${it.icon || '🎯'} ${it.title}
                  </strong>
                  <span style="font-size: 9px; color: var(--color-text-dim);">
                    ${it.prefix || ''}${it.current || 0}${it.suffix || ''} / ${it.prefix || ''}${it.target || 100}${it.suffix || ''} ${isTwitch ? '· 🔒 Twitch' : ''}
                  </span>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 1. GESTIÓN DE PRESETS COMPLETOS -->
      <div style="background: rgba(25, 29, 33, 0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
        <span style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">2. Catálogo y Presets de Metas</span>
        
        <div style="display: grid; grid-template-columns: 1fr auto auto auto auto auto; gap: 8px; margin-top: 10px; align-items: center;">
          <select id="cfg-goal-preset-select" class="form-select" onchange="onGoalPresetChange(this.value)">
            ${(g.presets || []).map(p => `<option value="${p.id}" ${p.id === (g.activePreset || 'twitch_followers') ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
          <button type="button" class="btn-action-test" style="font-size: 11px; padding: 6px 12px;" onclick="saveCurrentGoalPreset(false)">✏️ Guardar</button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 12px;" onclick="saveCurrentGoalPreset(true)">➕ Como Nuevo</button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 10px;" onclick="exportGoalPresetJson()" title="Exportar Preset en JSON">📋 Exportar</button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 10px; color: #57D6C4; border-color: rgba(87,214,196,0.4);" onclick="importGoalPresetJson()" title="Importar Preset desde JSON">📥 Importar</button>
          <button type="button" class="btn-stage-preset" style="color: #F87171; font-size: 11px; padding: 6px 10px;" onclick="deleteGoalPreset()">🗑️ Eliminar</button>
        </div>
      </div>

      <!-- DECK DE ACCIONES RÁPIDAS EN LA TARJETA PRINCIPAL (COLOREADAS POR META) -->
      <div style="background: rgba(25, 29, 33, 0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">
            2. Acciones Rápidas en la Tarjeta Principal (Dashboard & Stream Deck)
          </span>
          <span style="font-size: 10px; color: var(--color-text-dim);">Distinguidas por el color de barra de cada meta</span>
        </div>
        <div style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 12px; line-height: 1.5;">
          Los botones fijados aparecerán directamente en la tarjeta de la suite en el panel principal y pueden ejecutarse con 1 clic o desde Stream Deck:
        </div>

        <!-- GENERADOR DE NUEVAS ACCIONES RÁPIDAS ASIGNADAS -->
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--color-accent-cyan); margin-bottom: 8px;">
            ➕ Crear y Anclar Acción Rápida para una Meta:
          </div>
          <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr auto; gap: 8px; align-items: center;">
            <select id="new-goal-sc-target" class="form-select" style="font-size: 11px;">
              ${g.goals.map(it => `<option value="${it.id}">${it.icon || '🎯'} ${it.title} (${it.category === 'twitch' ? 'Twitch 🔒' : 'Libre'})</option>`).join('')}
            </select>
            <select id="new-goal-sc-amount" class="form-select" style="font-size: 11px;">
              <option value="1">+1 Unidad</option>
              <option value="5" selected>+5 Unidades</option>
              <option value="10">+10 Unidades</option>
              <option value="50">+50 Unidades</option>
              <option value="-1">-1 Unidad</option>
              <option value="-5">-5 Unidades</option>
              <option value="reset">🔄 Reset a 0</option>
            </select>
            <input type="text" id="new-goal-sc-label" class="form-input" placeholder="Etiqueta (ej: +5 Subs)" style="font-size: 11px;">
            <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 14px;" onclick="addGoalQuickActionFromForm()">
              ➕ Añadir
            </button>
          </div>
        </div>

        <!-- LISTA DE ACCIONES RÁPIDAS CONFIGURADAS -->
        <div id="goal-shortcuts-management-list" style="display: flex; flex-direction: column; gap: 6px;">
          ${(g.shortcuts || []).map(sc => {
            const tgt = g.goals.find(it => it.id === sc.goal_id) || g.goals[0] || {};
            const scColor = sc.color || tgt.color || tgt.barColorStart || '#57D6C4';
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); border: 1px solid ${scColor}60; border-radius: 4px; padding: 8px 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${scColor};box-shadow:0 0 6px ${scColor};"></span>
                  <strong style="color: ${scColor}; font-size: 12px;">${sc.label}</strong>
                  <span style="font-size: 11px; color: var(--color-text-dim);">→ Meta: ${tgt.title || 'Meta'} (${sc.amount > 0 ? '+' : ''}${sc.amount})</span>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button type="button" class="btn-action-test" style="font-size: 10px; padding: 2px 8px; border-color: ${scColor}; color: ${scColor};" onclick="triggerGoalCustomShortcut('${sc.id}')">⚡ Probar</button>
                  <button type="button" class="btn-stage-preset" style="color: #F87171; font-size: 10px; padding: 2px 6px;" onclick="deleteGoalQuickAction('${sc.id}')">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- GUÍAS TÉCNICAS Y ENLACE OBS -->
      <div style="background: rgba(25, 29, 33, 0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">3. Documentación & Herramientas</span>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 10px;" onclick="copyText('http://localhost:8080/widgets/goal/index.html')">📋 Copiar URL para OBS</button>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn-stage-preset" style="color: #57D6C4; border-color: #57D6C4;" onclick="openWidgetDevGuideModal('goal')">📖 Guía de Programación & Stream Deck</button>
          <button type="button" class="btn-stage-preset" style="color: #38BDF8; border-color: #38BDF8;" onclick="openWidgetCssGuideModal('goal')">🎨 Guía de Clases CSS y Snippets</button>
          <button type="button" class="btn-stage-preset" style="color: #F59E0B;" onclick="testGoalCelebration()">🎉 Probar Confeti de Victoria</button>
          <button type="button" class="btn-action-test" onclick="updateGoalPipPreview()">🔄 Forzar Refresco Preview</button>
        </div>
      </div>
    </div>
  `;

  setTimeout(updateGoalPipPreview, 50);
}

// ----------------------------------------------------------------------
// BARRA DE OBJETIVO (GOAL): MULTI-METAS, SUB-PESTAÑAS, PREVIEW Y SYNC
// ----------------------------------------------------------------------
window.activeGoalTab = window.activeGoalTab || 'target';
window.selectedGoalId = window.selectedGoalId || 'goal_followers';

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

function updateGoalPipPreview() {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (!iframe || !iframe.contentWindow || !cachedWidgetsConfig) return;

  const g = cachedWidgetsConfig.goal || {};
  const s = g.styles || {};
  const selGoal = (g.goals || []).find(it => it.id === window.selectedGoalId);

  // Recoger valores del DOM
  const titleVal = document.getElementById('cfg-goal-title')?.value;
  const iconVal = document.getElementById('cfg-goal-icon')?.value;
  const currentVal = parseInt(document.getElementById('cfg-goal-current')?.value, 10);
  const targetVal = parseInt(document.getElementById('cfg-goal-target')?.value, 10);
  const pfxVal = document.getElementById('cfg-goal-prefix')?.value;
  const sfxVal = document.getElementById('cfg-goal-suffix')?.value;
  const subtextVal = document.getElementById('cfg-goal-subtext-format')?.value;
  const itemColorVal = document.getElementById('cfg-goal-item-color')?.value;
  const itemBarStartVal = document.getElementById('cfg-goal-item-bar-start')?.value;
  const itemBarEndVal = document.getElementById('cfg-goal-item-bar-end')?.value;

  if (selGoal) {
    if (titleVal !== undefined) selGoal.title = titleVal;
    if (iconVal !== undefined) selGoal.icon = iconVal;
    if (!isNaN(currentVal) && selGoal.category !== 'twitch') selGoal.current = currentVal;
    if (!isNaN(targetVal)) selGoal.target = targetVal;
    if (pfxVal !== undefined) selGoal.prefix = pfxVal;
    if (sfxVal !== undefined) selGoal.suffix = sfxVal;
    if (subtextVal !== undefined) selGoal.subtextFormat = subtextVal;
    if (itemColorVal) selGoal.color = itemColorVal;
    if (itemBarStartVal) selGoal.barColorStart = itemBarStartVal;
    if (itemBarEndVal) selGoal.barColorEnd = itemBarEndVal;
  }

  const shapeVal = document.getElementById('cfg-goal-shape')?.value;
  const bgTypeVal = document.getElementById('cfg-goal-bg-type')?.value;
  const bgColorVal = document.getElementById('cfg-goal-bg-color')?.value;
  const borderStyleVal = document.getElementById('cfg-goal-border-style')?.value;
  const borderColorVal = document.getElementById('cfg-goal-border-color')?.value;
  const glowVal = parseInt(document.getElementById('cfg-goal-glow-intensity')?.value, 10);
  const barHeightVal = document.getElementById('cfg-goal-bar-height')?.value;
  const barPatternVal = document.getElementById('cfg-goal-bar-pattern')?.value;
  const barStartVal = document.getElementById('cfg-goal-bar-start')?.value;
  const barEndVal = document.getElementById('cfg-goal-bar-end')?.value;
  const fontVal = document.getElementById('cfg-goal-font-family')?.value;
  const customCSSVal = document.getElementById('cfg-goal-custom-css')?.value;
  const rotAnimVal = document.getElementById('cfg-goal-rotation-anim')?.value;

  if (shapeVal) s.shape = shapeVal;
  if (bgTypeVal) s.bgType = bgTypeVal;
  if (bgColorVal) s.bgColor = bgColorVal;
  if (borderStyleVal) s.borderStyle = borderStyleVal;
  if (borderColorVal) s.borderColor = borderColorVal;
  if (!isNaN(glowVal)) s.glowIntensity = glowVal;
  if (barHeightVal) s.barHeight = barHeightVal;
  if (barPatternVal) s.barPattern = barPatternVal;
  if (barStartVal) s.barColorStart = barStartVal;
  if (barEndVal) s.barColorEnd = barEndVal;
  if (fontVal) s.fontFamily = fontVal;
  if (customCSSVal !== undefined) s.customCSS = customCSSVal;
  if (rotAnimVal) g.rotationAnimation = rotAnimVal;

  const sameAsChat = document.getElementById('cfg-goal-same-as-chat')?.checked === true;
  g.sameStyleAsChat = sameAsChat;

  const liveConfig = {
    displayMode: g.displayMode || 'stacked',
    rotationInterval: g.rotationInterval || 10,
    rotationAnimation: g.rotationAnimation || 'slide_horizontal',
    activeGoalId: window.selectedGoalId || g.activeGoalId,
    goals: g.goals,
    celebrateOnFinish: document.getElementById('cfg-goal-celebrate-finish')?.checked !== false,
    celebrateSound: document.getElementById('cfg-goal-celebrate-sound')?.checked !== false,
    sameStyleAsChat: sameAsChat,
    styles: s,
    chat: cachedWidgetsConfig.chat || {}
  };

  try {
    if (typeof iframe.contentWindow.applyGoalConfig === 'function') {
      iframe.contentWindow.applyGoalConfig(liveConfig);
    } else {
      iframe.contentWindow.postMessage({
        type: 'apply_goal_config',
        config: liveConfig
      }, '*');
    }
  } catch (err) {
    console.warn('PiP preview iframe error:', err);
  }
}

async function toggleGoalSameStyleAsChat(checked) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  cachedWidgetsConfig.goal.sameStyleAsChat = checked;

  const badge = document.getElementById('badge-goal-chat-synced');
  const controlsWrapper = document.getElementById('goal-style-controls-wrapper');

  if (badge) badge.style.display = checked ? 'inline-block' : 'none';
  if (controlsWrapper) {
    controlsWrapper.style.opacity = checked ? '0.45' : '1';
    controlsWrapper.style.pointerEvents = checked ? 'none' : 'auto';
  }

  if (checked) {
    await copyStylesFromChatToGoal(false);
  }

  updateGoalPipPreview();
}

async function copyStylesFromChatToGoal(showAlert = true) {
  if (!cachedWidgetsConfig) return;
  const chat = cachedWidgetsConfig.chat;
  if (!chat || !chat.styles) {
    if (showAlert) alert('No hay estilos de Chat configurados.');
    return;
  }

  if (!cachedWidgetsConfig.goal) cachedWidgetsConfig.goal = {};
  if (!cachedWidgetsConfig.goal.styles) cachedWidgetsConfig.goal.styles = {};

  const cs = chat.styles;
  const gs = cachedWidgetsConfig.goal.styles;

  if (cs.shape) gs.shape = cs.shape;
  if (cs.bgType) gs.bgType = cs.bgType;
  if (cs.bgColor) gs.bgColor = cs.bgColor;
  if (cs.bgGradient) gs.bgGradient = cs.bgGradient;
  if (cs.borderStyle) gs.borderStyle = cs.borderStyle;
  if (cs.borderColor) {
    gs.borderColor = cs.borderColor;
    gs.accentColor = cs.borderColor;
    gs.barColorStart = cs.borderColor;
  }
  if (cs.glowIntensity !== undefined) gs.glowIntensity = cs.glowIntensity;
  if (cs.fontFamily) gs.fontFamily = cs.fontFamily;

  // Si fue importación manual (no anclaje), desbloqueamos los controles
  if (showAlert) {
    cachedWidgetsConfig.goal.sameStyleAsChat = false;
    const sameBox = document.getElementById('cfg-goal-same-as-chat');
    if (sameBox) sameBox.checked = false;
    const badge = document.getElementById('badge-goal-chat-synced');
    if (badge) badge.style.display = 'none';
    const controlsWrapper = document.getElementById('goal-style-controls-wrapper');
    if (controlsWrapper) {
      controlsWrapper.style.opacity = '1';
      controlsWrapper.style.pointerEvents = 'auto';
    }
  }

  // Reflejar en DOM
  const shapeInput = document.getElementById('cfg-goal-shape');
  if (shapeInput) shapeInput.value = gs.shape;
  const bgTypeInput = document.getElementById('cfg-goal-bg-type');
  if (bgTypeInput) bgTypeInput.value = gs.bgType;
  const bgColorInput = document.getElementById('cfg-goal-bg-color');
  if (bgColorInput) bgColorInput.value = gs.bgColor;
  const borderStyleInput = document.getElementById('cfg-goal-border-style');
  if (borderStyleInput) borderStyleInput.value = gs.borderStyle;
  const borderColorInput = document.getElementById('cfg-goal-border-color');
  if (borderColorInput) borderColorInput.value = gs.borderColor;
  const glowInput = document.getElementById('cfg-goal-glow-intensity');
  if (glowInput) glowInput.value = gs.glowIntensity;
  const fontInput = document.getElementById('cfg-goal-font-family');
  if (fontInput) fontInput.value = gs.fontFamily;

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateGoalPipPreview();
  if (showAlert) alert('✓ ¡Estilos del Chat importados con éxito! Ahora puedes editar cualquier color o propiedad individualmente.');
}

function onGoalPresetChange(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const presets = cachedWidgetsConfig.goal.presets || [];
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;

  cachedWidgetsConfig.goal.activePreset = presetId;
  if (!cachedWidgetsConfig.goal.styles) cachedWidgetsConfig.goal.styles = {};
  const s = cachedWidgetsConfig.goal.styles;
  s.shape = preset.shape || 'rounded';
  s.bgType = preset.bgType || 'glass';
  s.borderStyle = preset.borderStyle || 'left_neon';
  s.borderColor = preset.borderColor || preset.color || '#57D6C4';
  s.barColorStart = preset.barColorStart || preset.color || '#57D6C4';
  s.barColorEnd = preset.barColorEnd || '#38BDF8';
  s.barPattern = preset.barPattern || 'striped';
  s.barHeight = preset.barHeight || 'medium';
  s.glowIntensity = preset.glowIntensity !== undefined ? preset.glowIntensity : 40;
  s.fontFamily = preset.fontFamily || 'outfit';

  renderMiniAppControls();
  updateGoalPipPreview();
}

async function saveCurrentGoalPreset(asNew = false) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const presets = g.presets || [];

  if (asNew) {
    const name = prompt('Nombre para el nuevo Preset de Objetivo:', 'Mi Preset de Metas');
    if (!name || !name.trim()) return;

    const newId = 'preset_goal_' + Date.now();
    const newPreset = {
      id: newId,
      name: name.trim(),
      isBuiltin: false,
      shape: document.getElementById('cfg-goal-shape')?.value || 'rounded',
      bgType: document.getElementById('cfg-goal-bg-type')?.value || 'glass',
      borderColor: document.getElementById('cfg-goal-border-color')?.value || '#57D6C4',
      barColorStart: document.getElementById('cfg-goal-bar-start')?.value || '#57D6C4',
      barColorEnd: document.getElementById('cfg-goal-bar-end')?.value || '#38BDF8',
      barHeight: document.getElementById('cfg-goal-bar-height')?.value || 'medium',
      barPattern: document.getElementById('cfg-goal-bar-pattern')?.value || 'striped',
      glowIntensity: parseInt(document.getElementById('cfg-goal-glow-intensity')?.value, 10) || 40,
      fontFamily: document.getElementById('cfg-goal-font-family')?.value || 'outfit'
    };

    presets.push(newPreset);
    g.activePreset = newId;
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    renderMiniAppControls();
    alert(`✓ ¡Nuevo preset "${name.trim()}" guardado con éxito!`);
  } else {
    const activeId = g.activePreset || 'twitch_followers';
    const idx = presets.findIndex(p => p.id === activeId);
    if (idx !== -1) {
      presets[idx].shape = document.getElementById('cfg-goal-shape')?.value || presets[idx].shape;
      presets[idx].borderColor = document.getElementById('cfg-goal-border-color')?.value || presets[idx].borderColor;
      presets[idx].barColorStart = document.getElementById('cfg-goal-bar-start')?.value || presets[idx].barColorStart;
      presets[idx].barColorEnd = document.getElementById('cfg-goal-bar-end')?.value || presets[idx].barColorEnd;
      presets[idx].barHeight = document.getElementById('cfg-goal-bar-height')?.value || presets[idx].barHeight;
      presets[idx].barPattern = document.getElementById('cfg-goal-bar-pattern')?.value || presets[idx].barPattern;
      presets[idx].glowIntensity = parseInt(document.getElementById('cfg-goal-glow-intensity')?.value, 10) || presets[idx].glowIntensity;
      presets[idx].fontFamily = document.getElementById('cfg-goal-font-family')?.value || presets[idx].fontFamily;

      await API.saveWidgetsConfig(cachedWidgetsConfig);
      alert(`✓ Preset "${presets[idx].name}" actualizado con éxito.`);
    }
  }
}

function exportGoalPresetJson() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const activeId = g.activePreset || 'twitch_followers';
  const preset = (g.presets || []).find(p => p.id === activeId);
  if (!preset) return;

  const jsonStr = JSON.stringify(preset, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    alert(`📋 ¡Preset "${preset.name}" copiado al portapapeles en formato JSON!`);
  }).catch(() => {
    prompt('Copia el JSON de este Preset:', jsonStr);
  });
}

async function importGoalPresetJson() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const jsonStr = prompt('Pega aquí el JSON del Preset de Metas a importar:');
  if (!jsonStr || !jsonStr.trim()) return;

  try {
    const data = JSON.parse(jsonStr.trim());
    if (!data.name) {
      alert('El formato JSON no es válido. Debe contener al menos el campo "name".');
      return;
    }
    const newId = 'preset_goal_' + Date.now();
    data.id = newId;
    data.name = `${data.name} [Importado]`;
    data.isBuiltin = false;

    if (!Array.isArray(cachedWidgetsConfig.goal.presets)) {
      cachedWidgetsConfig.goal.presets = [];
    }
    cachedWidgetsConfig.goal.presets.push(data);
    cachedWidgetsConfig.goal.activePreset = newId;

    if (data.goals && Array.isArray(data.goals)) cachedWidgetsConfig.goal.goals = data.goals;
    if (data.styles) cachedWidgetsConfig.goal.styles = data.styles;
    if (data.displayMode) cachedWidgetsConfig.goal.displayMode = data.displayMode;

    await API.saveWidgetsConfig(cachedWidgetsConfig);
    renderMiniAppControls();
    updateGoalPipPreview();
    renderGoalShortcuts();
    alert(`✓ Preset "${data.name}" importado y activado correctamente.`);
  } catch (err) {
    alert('Error al leer el JSON: ' + err.message);
  }
}
window.importGoalPresetJson = importGoalPresetJson;

async function deleteGoalPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;
  const g = cachedWidgetsConfig.goal;
  const presets = g.presets || [];
  const activeId = g.activePreset;

  const p = presets.find(item => item.id === activeId);
  if (!p) return;

  if (p.isBuiltin) {
    alert('No se pueden eliminar los presets predefinidos de fábrica.');
    return;
  }

  if (!confirm(`¿Eliminar definitivamente el preset "${p.name}"?`)) return;

  g.presets = presets.filter(item => item.id !== activeId);
  g.activePreset = 'twitch_followers';
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert('✓ Preset eliminado.');
}

// ----------------------------------------------------------------------
// RENDERIZADO DE LA TARJETA PRINCIPAL DEL DASHBOARD (SHORTCUTS & METAS)
// ----------------------------------------------------------------------
function renderGoalShortcuts() {
  const container = document.getElementById('goal-shortcuts-container');
  if (!container || !cachedWidgetsConfig || !cachedWidgetsConfig.goal) return;

  const g = cachedWidgetsConfig.goal;
  const goals = g.goals || [];
  // Metas ancladas a la tarjeta
  const pinnedGoals = goals.filter(it => it.pinnedToCard !== false && it.active !== false);
  const displayGoals = pinnedGoals.length > 0 ? pinnedGoals : goals.filter(it => it.active !== false);

  const modeLabels = {
    stacked: '📚 Apiladas',
    rotative: `🔄 Carrusel (${g.rotationInterval || 10}s)`,
    single: '🎯 Única'
  };

  container.innerHTML = '';

  // 1. Cabecera con selector de modo actual
  const header = document.createElement('div');
  header.style.cssText = 'width: 100%; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 10px; color: var(--color-text-dim);';
  header.innerHTML = `
    <span>Overlay: <strong>${modeLabels[g.displayMode] || '📚 Apiladas'}</strong></span>
    <span>Metas fijadas: <strong>${displayGoals.length}</strong></span>
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

    // Barra de progreso y datos
    cardRow.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
          <span style="font-size: 12px; flex-shrink: 0;">${goal.icon || '🎯'}</span>
          <span style="font-size: 11px; font-weight: 800; color: ${goalColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${goal.title || 'OBJETIVO'}
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
