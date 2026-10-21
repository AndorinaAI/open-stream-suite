// ====================================================================
// GOAL PANEL - SUB-PESTAÑA 1: GESTIÓN DE METAS MÚLTIPLES Y PROGRESO
// ====================================================================

window.buildGoalTargetTabHtml = function(g, selectedGoal, selId, selGoalColor, tr, activeTab) {
  const isTwitch = selectedGoal.category === 'twitch';

  return `
    <div id="goal-tab-target" style="display: ${activeTab === 'target' ? 'block' : 'none'};">
      
      <!-- BARRA SUPERIOR: MODO DE VISUALIZACIÓN EN OVERLAY, CARRUSEL Y NUEVA META -->
      <div style="background: rgba(25, 29, 33, 0.7); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 700; color: var(--color-text-dim); text-transform: uppercase;">Modo Overlay OBS:</span>
          <div style="display: flex; gap: 4px;">
            <button type="button" class="btn-stage-preset ${g.displayMode === 'stacked' ? 'active' : ''}" style="font-size: 11px; padding: 4px 10px; ${g.displayMode === 'stacked' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15); font-weight: 700;' : ''}" onclick="setGoalDisplayMode('stacked')">
              ${tr('widgets.goal_btn_stacked', '📚 Apiladas (Todas)')}
            </button>
            <button type="button" class="btn-stage-preset ${g.displayMode === 'rotative' ? 'active' : ''}" style="font-size: 11px; padding: 4px 10px; ${g.displayMode === 'rotative' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15); font-weight: 700;' : ''}" onclick="setGoalDisplayMode('rotative')">
              ${tr('widgets.goal_btn_rotative', '🔄 Carrusel Rotativo')}
            </button>
            <button type="button" class="btn-stage-preset ${g.displayMode === 'single' ? 'active' : ''}" style="font-size: 11px; padding: 4px 10px; ${g.displayMode === 'single' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15); font-weight: 700;' : ''}" onclick="setGoalDisplayMode('single')">
              ${tr('widgets.goal_btn_single', '🎯 Meta Única')}
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
          <span>➕</span> <span>${tr('widgets.goal_btn_new', 'Nueva Meta Libre')}</span>
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
                    <label onclick="event.stopPropagation()" style="cursor: pointer; display: flex; align-items: center;" title="${item.active ? 'Visible en Overlay OBS' : 'Oculta en Overlay OBS'}">
                      <input type="checkbox" ${item.active ? 'checked' : ''} onchange="toggleGoalActive('${item.id}', event)">
                    </label>

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
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border-dim); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">${selectedGoal.icon || '🎯'}</span>
              <strong style="font-size: 13px; color: #fff; letter-spacing: 0.5px;">${selectedGoal.title}</strong>
              ${isTwitch ? '<span style="font-size: 10px; background: rgba(139,92,246,0.2); color: #C4B5FD; border: 1px solid #8B5CF6; border-radius: 4px; padding: 1px 6px;">Twitch Helix Auto-Sync</span>' : ''}
            </div>
            
            <div style="display: flex; gap: 6px;">
              ${!isTwitch ? `
                <button type="button" class="btn-stage-preset" style="color: #F87171; font-size: 11px; padding: 3px 8px;" onclick="deleteSelectedGoal('${selectedGoal.id}')" title="Eliminar esta meta">🗑️ Eliminar</button>
              ` : ''}
            </div>
          </div>

          <!-- FILA 1: TÍTULO, ICONO Y CATEGORÍA -->
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">Título / Encabezado:</label>
              <input type="text" id="cfg-goal-title" class="form-input" value="${selectedGoal.title || ''}" oninput="updateGoalPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">Emoji / Icono:</label>
              <input type="text" id="cfg-goal-icon" class="form-input" value="${selectedGoal.icon || '🎯'}" style="text-align: center;" oninput="updateGoalPipPreview()">
            </div>
          </div>

          <!-- FILA 2: VALORES DE PROGRESO Y OBJETIVO -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">Progreso Actual:</label>
              <input type="number" id="cfg-goal-current" class="form-input" value="${selectedGoal.current || 0}" ${isTwitch ? 'readonly title="Sincronizado automáticamente con Twitch"' : ''} oninput="updateGoalPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">Objetivo (Meta):</label>
              <input type="number" id="cfg-goal-target" class="form-input" value="${selectedGoal.target || 100}" oninput="updateGoalPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">Prefijo (ej: €):</label>
              <input type="text" id="cfg-goal-prefix" class="form-input" value="${selectedGoal.prefix || ''}" oninput="updateGoalPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">Sufijo (ej: subs):</label>
              <input type="text" id="cfg-goal-suffix" class="form-input" value="${selectedGoal.suffix || ''}" oninput="updateGoalPipPreview()">
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
  `;
};
