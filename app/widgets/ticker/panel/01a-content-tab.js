// ====================================================================
// TICKER PANEL - PESTAÑA 1: CONTENIDO, FRASES Y RSS
// ====================================================================

window.buildTickerContentTabHtml = function(tk, s, chips, phrases, rss, currentTickerTab) {
  return `
    <div id="ticker-tab-content" style="display: ${currentTickerTab === 'content' ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
      
      <!-- Modo de Estructura / Layout -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>📐</span>
            <span>Estructura del Ticker (Disposición en Pantalla)</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 3px 8px; color: #57D6C4;" onclick="openWidgetDevGuideModal('ticker')">
              📖 Guía de Tokens
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">
          <label style="border: 1px solid ${(tk.layoutMode || 'two_tier') === 'two_tier' ? '#57D6C4' : 'var(--color-border-dim)'}; background: ${(tk.layoutMode || 'two_tier') === 'two_tier' ? 'rgba(87,214,196,0.1)' : 'rgba(0,0,0,0.2)'}; border-radius: 6px; padding: 10px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #fff;">📊 Barra Dual (Recomendado)</span>
              <input type="radio" name="tk-layout-mode" value="two_tier" ${(tk.layoutMode || 'two_tier') === 'two_tier' ? 'checked' : ''} onchange="updateTickerPipPreview()">
            </div>
            <span style="font-size: 10px; color: var(--color-text-dim);">Fila superior con eventos (Follows, Subs, Bits) y fila inferior dedicada al prompter de noticias y RSS.</span>
          </label>

          <label style="border: 1px solid ${tk.layoutMode === 'single_stream' ? '#57D6C4' : 'var(--color-border-dim)'}; background: ${tk.layoutMode === 'single_stream' ? 'rgba(87,214,196,0.1)' : 'rgba(0,0,0,0.2)'}; border-radius: 6px; padding: 10px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #fff;">📏 Barra Única Continua</span>
              <input type="radio" name="tk-layout-mode" value="single_stream" ${tk.layoutMode === 'single_stream' ? 'checked' : ''} onchange="updateTickerPipPreview()">
            </div>
            <span style="font-size: 10px; color: var(--color-text-dim);">Todos los elementos (noticias + chips de eventos) circulan mezclados en una sola fila compacta.</span>
          </label>

          <label style="border: 1px solid ${tk.layoutMode === 'floating_chips' ? '#57D6C4' : 'var(--color-border-dim)'}; background: ${tk.layoutMode === 'floating_chips' ? 'rgba(87,214,196,0.1)' : 'rgba(0,0,0,0.2)'}; border-radius: 6px; padding: 10px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #fff;">🏷️ Chips Flotantes Desacoplados</span>
              <input type="radio" name="tk-layout-mode" value="floating_chips" ${tk.layoutMode === 'floating_chips' ? 'checked' : ''} onchange="updateTickerPipPreview()">
            </div>
            <span style="font-size: 10px; color: var(--color-text-dim);">Tarjetas independientes con bordes neón y esquinas biseladas de estilo cyberpunk.</span>
          </label>
        </div>

        <!-- Opciones de Comportamiento Global -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding-top: 8px; border-top: 1px solid var(--color-border-dim);">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Dirección del Scroll:</label>
            <select id="cfg-ticker-direction" class="form-input" onchange="updateTickerPipPreview()">
              <option value="left" ${(tk.scrollDirection || 'left') === 'left' ? 'selected' : ''}>⬅️ Hacia la Izquierda</option>
              <option value="right" ${tk.scrollDirection === 'right' ? 'selected' : ''}>➡️ Hacia la Derecha</option>
              <option value="fade_rotate" ${tk.scrollDirection === 'fade_rotate' ? 'selected' : ''}>✨ Rotación Suave (Fade)</option>
              <option value="flip" ${tk.scrollDirection === 'flip' ? 'selected' : ''}>🔄 Volteo 3D (Flip)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
              <label>Velocidad de Avance:</label>
              <span id="cfg-ticker-speed-val" style="color: #57D6C4; font-weight: 700;">${tk.scrollSpeed || 45} px/s</span>
            </div>
            <input type="range" id="cfg-ticker-speed" class="form-range" min="15" max="150" value="${tk.scrollSpeed || 45}" oninput="document.getElementById('cfg-ticker-speed-val').textContent = this.value + ' px/s'; updateTickerPipPreview();">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Pausar al Pasar el Ratón:</label>
            <div style="display: flex; align-items: center; height: 32px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer;">
                <input type="checkbox" id="cfg-ticker-pause-hover" ${tk.pauseOnHover !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>Activar Hover Pause</span>
              </label>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Separador Entre Frases:</label>
            <input type="text" id="cfg-ticker-separator" class="form-input" value="${tk.itemSeparator !== undefined ? tk.itemSeparator : '✦'}" placeholder="✦" oninput="updateTickerPipPreview()">
          </div>
        </div>
      </div>

      <!-- Fila Superior: Chips de Eventos en Tiempo Real (Twitch / Donaciones / Metas) -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>✨</span>
            <span>Fila Superior: Eventos en Tiempo Real (Chips de Directo)</span>
          </div>
          <span style="font-size: 10px; color: var(--color-text-dim);">Conmutadores individuales con prefijos y badges editables</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <!-- Follower -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #57D6C4; cursor: pointer;">
                <input type="checkbox" id="chip-show-follower" ${chips.showFollower !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>❤️ Último Seguidor</span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <input type="text" id="chip-lbl-follower" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.labelFollower || 'FOLLOW'}" placeholder="Etiqueta" oninput="updateTickerPipPreview()">
              <input type="text" id="chip-def-follower" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.defaultFollower || 'Sin seguidores aún'}" placeholder="Texto por defecto" oninput="updateTickerPipPreview()">
            </div>
          </div>

          <!-- Suscriptor -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #A855F7; cursor: pointer;">
                <input type="checkbox" id="chip-show-sub" ${chips.showSubscriber !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>⭐ Último Suscriptor</span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <input type="text" id="chip-lbl-sub" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.labelSubscriber || 'SUB'}" placeholder="Etiqueta" oninput="updateTickerPipPreview()">
              <input type="text" id="chip-def-sub" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.defaultSubscriber || 'Sin suscripciones aún'}" placeholder="Texto por defecto" oninput="updateTickerPipPreview()">
            </div>
          </div>

          <!-- Cheer / Bits -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #38BDF8; cursor: pointer;">
                <input type="checkbox" id="chip-show-cheer" ${chips.showCheer !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>💎 Mayor Cheer / Bits</span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <input type="text" id="chip-lbl-cheer" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.labelCheer || 'TOP BITS'}" placeholder="Etiqueta" oninput="updateTickerPipPreview()">
              <input type="text" id="chip-def-cheer" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.defaultCheer || '¡Sé el primero!'}" placeholder="Texto por defecto" oninput="updateTickerPipPreview()">
            </div>
          </div>

          <!-- Donación / Propina -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #10B981; cursor: pointer;">
                <input type="checkbox" id="chip-show-tip" ${chips.showTip !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>💰 Última Donación / Tip</span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <input type="text" id="chip-lbl-tip" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.labelTip || 'DONACIÓN'}" placeholder="Etiqueta" oninput="updateTickerPipPreview()">
              <input type="text" id="chip-def-tip" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.defaultTip || 'Ko-fi / Tipeee / Streamlabs'}" placeholder="Texto por defecto" oninput="updateTickerPipPreview()">
            </div>
          </div>

          <!-- Raid / Host -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #EC4899; cursor: pointer;">
                <input type="checkbox" id="chip-show-raid" ${chips.showRaid !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>🚀 Última Raid / Host</span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <input type="text" id="chip-lbl-raid" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.labelRaid || 'RAID'}" placeholder="Etiqueta" oninput="updateTickerPipPreview()">
              <input type="text" id="chip-def-raid" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.defaultRaid || '¡Bienvenidos!'}" placeholder="Texto por defecto" oninput="updateTickerPipPreview()">
            </div>
          </div>

          <!-- Meta Activa / Goal Summary -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #F59E0B; cursor: pointer;">
                <input type="checkbox" id="chip-show-goal" ${chips.showGoal !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>🎯 Resumen de Meta (Goal)</span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <input type="text" id="chip-lbl-goal" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.labelGoal || 'OBJETIVO'}" placeholder="Etiqueta" oninput="updateTickerPipPreview()">
              <input type="text" id="chip-def-goal" class="form-input" style="font-size: 10px; height: 26px;" value="${chips.defaultGoal || '{current}/{target} ({pct}%)'}" placeholder="Formato" oninput="updateTickerPipPreview()">
            </div>
          </div>
        </div>
      </div>

      <!-- Fila Inferior: Gestor de Frases Personalizadas con Tokens Dinámicos -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>💬</span>
            <span>Fila Inferior: Lista de Frases, Avisos y Noticias Personalizadas</span>
          </div>
          <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 4px 10px;" onclick="addTickerPhrase()">
            ➕ Nueva Frase
          </button>
        </div>

        <div style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 8px;">
          Inserta tokens dinámicos en cualquier frase: <code style="color: #57D6C4;">{followers}</code>, <code style="color: #57D6C4;">{subs}</code>, <code style="color: #57D6C4;">{streamer}</code>, <code style="color: #57D6C4;">{game}</code>, <code style="color: #57D6C4;">{uptime}</code>, <code style="color: #57D6C4;">{time}</code>
        </div>

        <div id="ticker-phrases-container" style="display: flex; flex-direction: column; gap: 8px;">
          ${phrases.map((p, idx) => `
            <div class="ticker-phrase-row" data-idx="${idx}" style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 6px 10px;">
              <span style="font-size: 11px; color: var(--color-text-dim); width: 20px;">#${idx + 1}</span>
              <input type="text" class="form-input tk-phrase-icon" style="width: 50px; text-align: center; height: 28px;" value="${p.icon || '📢'}" placeholder="Emoji" oninput="updateTickerPipPreview()">
              <input type="text" class="form-input tk-phrase-text" style="flex: 1; height: 28px;" value="${(p.text || '').replace(/"/g, '&quot;')}" placeholder="Escribe tu mensaje..." oninput="updateTickerPipPreview()">
              <input type="color" class="tk-phrase-color" style="width: 32px; height: 28px; border: none; background: transparent; cursor: pointer;" value="${p.color || '#57D6C4'}" title="Color del mensaje" oninput="updateTickerPipPreview()">
              <label style="display: flex; align-items: center; gap: 4px; font-size: 10px; cursor: pointer;" title="Mostrar en la marquesina">
                <input type="checkbox" class="tk-phrase-enabled" ${p.enabled !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>Activa</span>
              </label>
              <button type="button" class="btn-stage-preset" style="padding: 2px 6px; font-size: 10px; color: #EF4444;" onclick="removeTickerPhrase(${idx})" title="Eliminar frase">✕</button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Feed RSS / Noticias Externas -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>📡</span>
            <span>Feed RSS de Noticias en Vivo</span>
          </div>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer;">
            <input type="checkbox" id="cfg-rss-enabled" ${rss.enabled === true ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>Habilitar Noticias RSS en la Marquesina</span>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">URL del Feed RSS / Atom:</label>
            <input type="url" id="cfg-rss-url" class="form-input" placeholder="https://elpais.com/rss/elpais/portada.xml" value="${rss.url || ''}" oninput="updateTickerPipPreview()">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Prefijo RSS:</label>
            <input type="text" id="cfg-rss-prefix" class="form-input" placeholder="📰 NOTICIAS:" value="${rss.prefix || '📰 NOTICIAS:'}" oninput="updateTickerPipPreview()">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Límite de Titulares:</label>
            <input type="number" id="cfg-rss-max-items" class="form-input" min="1" max="25" value="${rss.maxItems || 5}" oninput="updateTickerPipPreview()">
          </div>
        </div>
      </div>

    </div>
  `;
};
