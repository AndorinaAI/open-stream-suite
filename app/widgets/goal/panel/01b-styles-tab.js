// ====================================================================
// GOAL PANEL - SUB-PESTAÑA 2 Y 3: ESTILOS VISUALES Y PRESETS/ATAJOS
// ====================================================================

window.buildGoalStylesTabHtml = function(g, gs, sameAsChat, tr, activeTab) {
  return `
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
  `;
};

window.buildGoalPresetsTabHtml = function(g, tr, activeTab) {
  return `
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
};
