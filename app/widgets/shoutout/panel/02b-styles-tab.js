// ====================================================================
// PROMO / SHOUTOUT PANEL - PESTAÑA 3 Y 4: HISTORIAL Y ESTILOS
// ====================================================================

window.buildPromoHistoryTabHtml = function(activeTab, historyHtml) {
  return `
    <div id="promo-tab-history" style="display: ${activeTab === 'history' ? 'block' : 'none'};">
      <div class="miniapp-section-card" style="margin-bottom: 0;">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>📜</span>
            <span>Historial de Promociones Emitidas</span>
          </div>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; color: #EF4444;" onclick="clearPromoHistory()">
            🗑️ Limpiar Historial
          </button>
        </div>
        <p style="font-size: 11px; color: var(--color-text-dim); margin-top: -6px; margin-bottom: 12px;">
          Si algún espectador llega tarde o pide volver a ver el código QR de un producto o streamer, pulsa <strong>🔄 Repetir Promo</strong> para volver a lanzarlo a OBS Studio al instante.
        </p>
        <div id="promo-history-list-container">
          ${historyHtml}
        </div>
      </div>
    </div>
  `;
};

window.buildPromoStylesTabHtml = function(activeTab, sameAsChat, s) {
  return `
    <div id="promo-tab-styles" style="display: ${activeTab === 'styles' ? 'block' : 'none'};">
      <div class="miniapp-section-card" style="margin-bottom: 0;">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>🎨</span>
            <span>Apariencia y Personalización Visual</span>
          </div>
        </div>

        <!-- CASILLA: MISMO ESTILO QUE EL CHAT -->
        <div style="background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(87,214,196,0.12)); border: 1px solid rgba(139,92,246,0.4); border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 12px; font-weight: 700; color: #fff;">
            <input type="checkbox" id="cfg-promo-same-as-chat" ${sameAsChat ? 'checked' : ''} onchange="togglePromoSameStyleAsChat(this.checked)">
            <span>🔗 Mismo estilo que el Chat (Heredar silueta, colores, fuentes y fondo automáticamente)</span>
          </label>
          <span id="badge-promo-chat-synced" style="font-size: 10px; font-family: var(--font-tech); padding: 3px 8px; border-radius: 4px; background: rgba(87,214,196,0.2); color: #57D6C4; font-weight: 700; display: ${sameAsChat ? 'inline-block' : 'none'};">
            🟢 ENLAZADO AL CHAT
          </span>
        </div>

        <!-- CONTROLES VISUALES INDEPENDIENTES -->
        <div id="promo-style-controls-wrapper" style="opacity: ${sameAsChat ? '0.45' : '1'}; pointer-events: ${sameAsChat ? 'none' : 'auto'}; transition: opacity 0.2s ease;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Silueta / Forma:</label>
              <select id="cfg-promo-shape" class="form-select" onchange="updatePromoPipPreview()">
                <option value="rounded" ${(s.shape || 'rounded') === 'rounded' ? 'selected' : ''}>⏹️ Redondeado Moderno</option>
                <option value="scifi" ${s.shape === 'scifi' ? 'selected' : ''}>⚡ Sci-Fi Cyber (Corte Biselado)</option>
                <option value="arcade" ${s.shape === 'arcade' ? 'selected' : ''}>🕹️ Arcade Retro (Píxel Clásico)</option>
                <option value="pill" ${s.shape === 'pill' ? 'selected' : ''}>💊 Cápsula Suave (Píldora)</option>
                <option value="slant" ${s.shape === 'slant' ? 'selected' : ''}>📐 Slant Inclinado Dinámico</option>
                <option value="soft_card" ${s.shape === 'soft_card' ? 'selected' : ''}>🃏 Tarjeta Minimalista</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Tipo de Fondo:</label>
              <select id="cfg-promo-bgtype" class="form-select" onchange="updatePromoPipPreview()">
                <option value="glass" ${(s.bgType || 'glass') === 'glass' ? 'selected' : ''}>💎 Cristal Esmerilado (Glass Blur)</option>
                <option value="gradient" ${s.bgType === 'gradient' ? 'selected' : ''}>🌈 Degradado de Color</option>
                <option value="solid" ${s.bgType === 'solid' ? 'selected' : ''}>⬛ Sólido Mate</option>
                <option value="transparent" ${s.bgType === 'transparent' ? 'selected' : ''}>🚫 Transparente</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Tipografía:</label>
              <select id="cfg-promo-font" class="form-select" onchange="updatePromoPipPreview()">
                <option value="outfit" ${(s.fontFamily || 'outfit') === 'outfit' ? 'selected' : ''}>Outfit (Moderna & Redonda)</option>
                <option value="inter" ${s.fontFamily === 'inter' ? 'selected' : ''}>Inter (Limpia & Minimalista)</option>
                <option value="rajdhani" ${s.fontFamily === 'rajdhani' ? 'selected' : ''}>Rajdhani (Técnica & Cyber)</option>
                <option value="orbitron" ${s.fontFamily === 'orbitron' ? 'selected' : ''}>Orbitron (Futurista Sci-Fi)</option>
                <option value="press_start" ${s.fontFamily === 'press_start' ? 'selected' : ''}>Press Start 2P (Retro Gaming)</option>
                <option value="jetbrains_mono" ${s.fontFamily === 'jetbrains_mono' ? 'selected' : ''}>JetBrains Mono (Terminal)</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Color de Fondo:</label>
              <div style="display: flex; gap: 4px;">
                <input type="color" id="cfg-promo-bgcolor" value="${s.bgColor || '#191D21'}" style="height: 32px; width: 40px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updatePromoPipPreview()">
                <input type="text" id="cfg-promo-bgcolor-hex" class="form-input" value="${s.bgColor || '#191D21'}" style="flex: 1; font-family: monospace; font-size: 11px;" oninput="document.getElementById('cfg-promo-bgcolor').value=this.value; updatePromoPipPreview()">
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Degradado Secundario:</label>
              <div style="display: flex; gap: 4px;">
                <input type="color" id="cfg-promo-bggrad" value="${s.bgGradient || '#0B0D0F'}" style="height: 32px; width: 40px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updatePromoPipPreview()">
                <input type="text" id="cfg-promo-bggrad-hex" class="form-input" value="${s.bgGradient || '#0B0D0F'}" style="flex: 1; font-family: monospace; font-size: 11px;" oninput="document.getElementById('cfg-promo-bggrad').value=this.value; updatePromoPipPreview()">
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Estilo de Borde:</label>
              <select id="cfg-promo-borderstyle" class="form-select" onchange="updatePromoPipPreview()">
                <option value="left_neon" ${(s.borderStyle || 'left_neon') === 'left_neon' ? 'selected' : ''}>▎ Línea Lateral Neón</option>
                <option value="full_neon" ${s.borderStyle === 'full_neon' ? 'selected' : ''}>🔲 Marco Completo Neón</option>
                <option value="subtle" ${s.borderStyle === 'subtle' ? 'selected' : ''}>◽ Borde Sutil Minimalista</option>
                <option value="none" ${s.borderStyle === 'none' ? 'selected' : ''}>🚫 Sin Borde</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Color de Borde / Acento:</label>
              <div style="display: flex; gap: 4px;">
                <input type="color" id="cfg-promo-border" value="${s.borderColor || '#57D6C4'}" style="height: 32px; width: 40px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updatePromoPipPreview()">
                <input type="text" id="cfg-promo-border-hex" class="form-input" value="${s.borderColor || '#57D6C4'}" style="flex: 1; font-family: monospace; font-size: 11px;" oninput="document.getElementById('cfg-promo-border').value=this.value; updatePromoPipPreview()">
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: #fff;">Brillo Neón:</label>
                <span id="lbl-promo-glow" style="font-size: 11px; font-family: var(--font-tech); font-weight: 700; color: #57D6C4;">${s.glowIntensity !== undefined ? s.glowIntensity : 45}%</span>
              </div>
              <input type="range" id="cfg-promo-glow" min="0" max="100" value="${s.glowIntensity !== undefined ? s.glowIntensity : 45}" oninput="document.getElementById('lbl-promo-glow').textContent = this.value + '%'; updatePromoPipPreview();" style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Animación Entrada:</label>
              <select id="cfg-promo-anim" class="form-select" onchange="updatePromoPipPreview()">
                <option value="slide_up" ${(s.animation || 'slide_up') === 'slide_up' ? 'selected' : ''}>⬆️ Slide Up</option>
                <option value="pop_scale" ${s.animation === 'pop_scale' ? 'selected' : ''}>🎯 Pop Scale</option>
                <option value="neon_flash" ${s.animation === 'neon_flash' ? 'selected' : ''}>⚡ Flash Neón</option>
                <option value="flip_in" ${s.animation === 'flip_in' ? 'selected' : ''}>🔄 Flip In 3D</option>
              </select>
            </div>
          </div>

          <!-- CSS Personalizado Adicional -->
          <div class="form-group" style="margin-top: 8px; margin-bottom: 0;">
            <label style="font-size: 10px; font-weight: 600; color: var(--color-text-dim); display: block; margin-bottom: 2px;">CSS Personalizado Adicional:</label>
            <textarea id="cfg-promo-custom-css" placeholder="/* CSS adicional para la tarjeta de promo */" style="width: 100%; height: 50px; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 6px; box-sizing: border-box; resize: vertical;" oninput="updatePromoPipPreview()">${s.customCSS || ''}</textarea>
          </div>
        </div>

        <div style="margin-top: 14px; border-top: 1px solid var(--color-border-dim); padding-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn-action-primary" style="font-size: 12px; padding: 8px 16px;" onclick="saveMiniAppControls('promo')">
            💾 Guardar Ajustes de Estilo
          </button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 12px; color: #57D6C4; border-color: rgba(87,214,196,0.4);" onclick="openWidgetDevGuideModal('promo')">
            📖 Guía de Tokens & Stream Deck
          </button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 12px; color: #38BDF8; border-color: rgba(56,189,248,0.4);" onclick="openWidgetCssGuideModal('promo')">
            🎨 Guía CSS & Clases
          </button>
        </div>
      </div>
    </div>
  `;
};
