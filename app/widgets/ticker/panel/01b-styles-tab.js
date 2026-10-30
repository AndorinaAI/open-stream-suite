// ====================================================================
// TICKER PANEL - PESTAÑA 2, 3 Y 4: ESTILOS, PRESETS Y CÓDIGO
// ====================================================================

window.buildTickerStylesTabHtml = function(tk, s, currentTickerTab) {
  return `
    <div id="ticker-tab-styles" style="display: ${currentTickerTab === 'styles' ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
      
      <!-- Sincronización rápida con Chat -->
      <div style="background: rgba(87,214,196,0.08); border: 1px solid rgba(87,214,196,0.3); border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #57D6C4;">🎨 Sincronización Visual con Chat</div>
          <div style="font-size: 10px; color: var(--color-text-dim);">Copia la forma, fondo y color de acento del widget de Chat a esta marquesina.</div>
        </div>
        <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 4px 10px; color: #57D6C4; border-color: #57D6C4;" onclick="importChatStylesToTicker()">
          📥 Importar Estilo del Chat
        </button>
      </div>

      <!-- Estilos Específicos de la Fila Superior (Top Tier - Métricas & Chips) -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>✨</span>
            <span>Estilos de la Fila Superior (Top Tier - Métricas & Chips)</span>
          </div>
          <span style="font-size: 10px; color: var(--color-text-dim);">Personaliza la barra superior de eventos</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Disposición de la Barra Superior:</label>
            <select id="cfg-top-shape" class="form-input" onchange="updateTickerPipPreview()">
              <option value="capsule" ${(s.topTierShape || 'capsule') === 'capsule' ? 'selected' : ''}>💊 Barra Cápsula Unificada</option>
              <option value="separate_chips" ${s.topTierShape === 'separate_chips' ? 'selected' : ''}>🏷️ Chips / Tarjetas Separadas Flotantes</option>
              <option value="tech_pill" ${s.topTierShape === 'tech_pill' ? 'selected' : ''}>⚡ Rectangular Tech (Esquinas Biseladas)</option>
              <option value="glass_strip" ${s.topTierShape === 'glass_strip' ? 'selected' : ''}>🪟 Tira Glassmorphism Completa</option>
              <option value="minimal" ${s.topTierShape === 'minimal' ? 'selected' : ''}>✨ Minimalista Flotante (Sin Fondo)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Estilo Visual de los Chips:</label>
            <select id="cfg-top-chip-style" class="form-input" onchange="updateTickerPipPreview()">
              <option value="badge_filled" ${(s.topTierChipStyle || 'badge_filled') === 'badge_filled' ? 'selected' : ''}>🛡️ Insignia con Fondo y Píldora</option>
              <option value="glow_pill" ${s.topTierChipStyle === 'glow_pill' ? 'selected' : ''}>🌟 Píldora Neón con Glow de Evento</option>
              <option value="outline" ${s.topTierChipStyle === 'outline' ? 'selected' : ''}>🔲 Borde Fino Outline</option>
              <option value="flat" ${s.topTierChipStyle === 'flat' ? 'selected' : ''}>📄 Plano Minimalista</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Fondo Fila Superior:</label>
            <select id="cfg-top-bg-type" class="form-input" onchange="updateTickerPipPreview()">
              <option value="glass" ${(s.topTierBgType || 'glass') === 'glass' ? 'selected' : ''}>Glassmorphism</option>
              <option value="gradient" ${s.topTierBgType === 'gradient' ? 'selected' : ''}>Degradado</option>
              <option value="solid" ${s.topTierBgType === 'solid' ? 'selected' : ''}>Sólido</option>
              <option value="transparent" ${s.topTierBgType === 'transparent' ? 'selected' : ''}>Transparente</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Color Fondo Superior:</label>
            <input type="color" id="cfg-top-bg-color" style="width: 100%; height: 32px;" value="${s.topTierBgColor || '#0B0D0F'}" oninput="updateTickerPipPreview()">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Color Borde Superior:</label>
            <input type="color" id="cfg-top-border-color" style="width: 100%; height: 32px;" value="${s.topTierBorderColor || '#57D6C4'}" oninput="updateTickerPipPreview()">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
              <label>Opacidad Fondo:</label>
              <span id="cfg-top-opacity-val" style="color: #57D6C4; font-weight: 700;">${s.topTierBgOpacity !== undefined ? s.topTierBgOpacity : 85}%</span>
            </div>
            <input type="range" id="cfg-top-opacity" class="form-range" min="0" max="100" value="${s.topTierBgOpacity !== undefined ? s.topTierBgOpacity : 85}" oninput="document.getElementById('cfg-top-opacity-val').textContent = this.value + '%'; updateTickerPipPreview();">
          </div>
        </div>
      </div>

      <!-- Estilos Específicos de la Fila Inferior (Bottom Tier - Prompter de Noticias) -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>📰</span>
            <span>Estilos de la Fila Inferior (Bottom Tier - Prompter de Noticias)</span>
          </div>
          <span style="font-size: 10px; color: var(--color-text-dim);">Personaliza la marquesina de texto</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Forma / Silueta:</label>
            <select id="cfg-ticker-shape" class="form-input" onchange="updateTickerPipPreview()">
              <option value="rounded" ${(s.shape || 'rounded') === 'rounded' ? 'selected' : ''}>🟦 Redondeado Estándar</option>
              <option value="scifi" ${s.shape === 'scifi' ? 'selected' : ''}>📐 Sci-Fi (Biselado)</option>
              <option value="pill" ${s.shape === 'pill' ? 'selected' : ''}>💊 Cápsula / Pill</option>
              <option value="full_strip" ${s.shape === 'full_strip' ? 'selected' : ''}>📏 Tira de Ancho Completo</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Tipo de Fondo:</label>
            <select id="cfg-ticker-bg-type" class="form-input" onchange="updateTickerPipPreview()">
              <option value="glass" ${(s.bgType || 'glass') === 'glass' ? 'selected' : ''}>Glassmorphism</option>
              <option value="solid" ${s.bgType === 'solid' ? 'selected' : ''}>Sólido</option>
              <option value="gradient" ${s.bgType === 'gradient' ? 'selected' : ''}>Degradado</option>
              <option value="transparent" ${s.bgType === 'transparent' ? 'selected' : ''}>Transparente</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Color de Fondo:</label>
            <input type="color" id="cfg-ticker-bg-color" style="width: 100%; height: 32px;" value="${s.bgColor || '#0B0D0F'}" oninput="updateTickerPipPreview()">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Color de Acento / Borde:</label>
            <input type="color" id="cfg-ticker-border-color" style="width: 100%; height: 32px;" value="${s.borderColor || '#57D6C4'}" oninput="updateTickerPipPreview()">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Estilo de Borde:</label>
            <select id="cfg-ticker-border-style" class="form-input" onchange="updateTickerPipPreview()">
              <option value="left_neon" ${(s.borderStyle || 'left_neon') === 'left_neon' ? 'selected' : ''}>Neón Izquierdo</option>
              <option value="all_neon" ${s.borderStyle === 'all_neon' ? 'selected' : ''}>Neón Completo</option>
              <option value="tech_corners" ${s.borderStyle === 'tech_corners' ? 'selected' : ''}>Esquinas Tech</option>
              <option value="none" ${s.borderStyle === 'none' ? 'selected' : ''}>Sin Borde</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
              <label>Opacidad Fondo:</label>
              <span id="cfg-ticker-opacity-val" style="color: #57D6C4; font-weight: 700;">${s.bgOpacity !== undefined ? s.bgOpacity : 85}%</span>
            </div>
            <input type="range" id="cfg-ticker-opacity" class="form-range" min="0" max="100" value="${s.bgOpacity !== undefined ? s.bgOpacity : 85}" oninput="document.getElementById('cfg-ticker-opacity-val').textContent = this.value + '%'; updateTickerPipPreview();">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Icono Fijo Inicial:</label>
            <input type="text" id="cfg-ticker-brand-badge" class="form-input" style="text-align: center;" value="${s.brandBadge || '⚡ DIRECTO'}" placeholder="⚡ DIRECTO" oninput="updateTickerPipPreview()">
          </div>
        </div>

        <!-- Paleta de Colores de Eventos -->
        <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #57D6C4; margin-bottom: 8px;">🎨 Colores de Acento por Tipo de Evento</div>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
            <div>
              <label style="font-size: 10px; color: #57D6C4;">❤️ Follow:</label>
              <input type="color" id="cfg-ticker-col-follow" style="width: 100%; height: 28px;" value="${s.followerColor || '#57D6C4'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #A855F7;">⭐ Sub:</label>
              <input type="color" id="cfg-ticker-col-sub" style="width: 100%; height: 28px;" value="${s.subColor || '#A855F7'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #38BDF8;">💎 Bits:</label>
              <input type="color" id="cfg-ticker-col-bits" style="width: 100%; height: 28px;" value="${s.bitsColor || '#38BDF8'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #10B981;">💰 Donación:</label>
              <input type="color" id="cfg-ticker-col-tip" style="width: 100%; height: 28px;" value="${s.tipColor || '#10B981'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #EC4899;">🚀 Raid:</label>
              <input type="color" id="cfg-ticker-col-raid" style="width: 100%; height: 28px;" value="${s.raidColor || '#EC4899'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #F59E0B;">🎯 Meta:</label>
              <input type="color" id="cfg-ticker-col-goal" style="width: 100%; height: 28px;" value="${s.goalColor || '#F59E0B'}" oninput="updateTickerPipPreview()">
            </div>
          </div>
        </div>

        <!-- Tipografía y Glow -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Tipografía (Google Fonts):</label>
            <select id="cfg-ticker-font" class="form-input" onchange="updateTickerPipPreview()">
              <option value="rajdhani" ${(s.fontFamily || 'rajdhani') === 'rajdhani' ? 'selected' : ''}>Rajdhani (Tech / Cyber)</option>
              <option value="outfit" ${s.fontFamily === 'outfit' ? 'selected' : ''}>Outfit (Moderna & Limpia)</option>
              <option value="orbitron" ${s.fontFamily === 'orbitron' ? 'selected' : ''}>Orbitron (Futurista Sci-Fi)</option>
              <option value="inter" ${s.fontFamily === 'inter' ? 'selected' : ''}>Inter (Minimalista Studio)</option>
              <option value="montserrat" ${s.fontFamily === 'montserrat' ? 'selected' : ''}>Montserrat (Elegante Titular)</option>
              <option value="press_start" ${s.fontFamily === 'press_start' ? 'selected' : ''}>Press Start 2P (Retro 8-Bit)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Tamaño de Fuente (px):</label>
            <input type="number" id="cfg-ticker-font-size" class="form-input" min="9" max="26" value="${s.fontSize || 13}" oninput="updateTickerPipPreview()">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Glow Neón (px):</label>
            <input type="number" id="cfg-ticker-glow" class="form-input" min="0" max="80" value="${s.glowIntensity !== undefined ? s.glowIntensity : 35}" oninput="updateTickerPipPreview()">
          </div>
        </div>
      </div>

      <!-- CSS Personalizado -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>💻</span>
            <span>CSS Personalizado para el Ticker</span>
          </div>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 2px 8px; color: #38BDF8;" onclick="openWidgetCssGuideModal('ticker')">
            🎨 Selectores CSS
          </button>
        </div>
        <textarea id="cfg-ticker-custom-css" placeholder="/* CSS personalizado para .ticker-top-tier, .ticker-bottom-tier, etc. */" style="width: 100%; height: 60px; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 8px; box-sizing: border-box; resize: vertical;" oninput="updateTickerPipPreview()">${s.customCSS || ''}</textarea>
        
        <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
          <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 14px;" onclick="saveTickerControls()">
            💾 Guardar Estilos
          </button>
        </div>
      </div>
    </div>
  `;
};

window.buildTickerPresetsCodeTabHtml = function(tk, presets, activePresetId, currentTickerTab) {
  return `
    <!-- ============================================================== -->
    <!-- PESTAÑA 3: PRESETS DE FÁBRICA                                  -->
    <!-- ============================================================== -->
    <div id="ticker-tab-presets" style="display: ${currentTickerTab === 'presets' ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>🎛️</span>
            <span>Aspecto del ticker</span>
          </div>
          <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 4px 10px; display: none;" onclick="saveTickerAsNewPreset()">
            ➕ Guardar Actual como Nuevo Preset
          </button>
        </div>

        <div style="background: rgba(87,214,196,0.08); border: 1px solid rgba(87,214,196,0.35); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #57D6C4;">🎨 El aspecto lo define el tema del pack</div>
          <div style="font-size: 11px; color: var(--color-text-dim); line-height: 1.5; margin-top: 4px;">
            Los presets visuales del ticker (<em>cyber_stream, twitch_streamer, arcade_retro…</em>)
            ya no se ofrecen: no correspondían a ningún tema de los packs. Elige el tema en la
            pestaña <strong>🎨 Tema</strong>. El contenido (frases, RSS, chips y separadores)
            sigue configurándose en su pestaña.
          </div>
        </div>

        <div style="display: none;">
          ${presets.map(p => `
            <div class="miniapp-preset-card ${p.id === activePresetId ? 'active' : ''}" onclick="applyTickerPreset('${p.id}')" style="cursor: pointer; background: rgba(0,0,0,0.3); border: 2px solid ${p.id === activePresetId ? '#57D6C4' : 'var(--color-border-dim)'}; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 6px; transition: border-color 0.15s;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: 700; font-size: 12px; color: ${p.id === activePresetId ? '#57D6C4' : '#fff'};">${p.name}</span>
                ${p.id === activePresetId ? '<span style="font-size: 10px; color: #57D6C4;">✓ ACTIVO</span>' : ''}
              </div>
              <span style="font-size: 10px; color: var(--color-text-dim); line-height: 1.3;">${p.description || ''}</span>
              <div style="display: flex; gap: 4px; margin-top: 4px;">
                <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${p.styles?.borderColor || '#57D6C4'};"></span>
                <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${p.styles?.followerColor || '#38BDF8'};"></span>
                <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${p.styles?.subColor || '#A855F7'};"></span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- PESTAÑA 4: CÓDIGO / JSON & ATAJOS                               -->
    <!-- ============================================================== -->
    <div id="ticker-tab-code" style="display: ${currentTickerTab === 'code' ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>⚡</span>
            <span>Atajos Rápidos de Stream Deck & HTTP API</span>
          </div>
          <span style="font-size: 10px; color: var(--color-text-dim);">Lanza noticias al vuelo desde tu Macro Pad o teclado</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: #57D6C4; margin-bottom: 4px;">📢 Emitir Noticia Urgente / Breaking News</div>
            <div style="font-size: 10px; color: var(--color-text-dim); margin-bottom: 6px;">URL para Stream Deck (GET request):</div>
            <code style="display: block; font-size: 10px; background: #0B0D0F; padding: 6px; border-radius: 4px; color: #57D6C4; word-break: break-all;">http://localhost:8080/api/deck/widget?widget=ticker&action=message&text=TU_MENSAJE</code>
          </div>

          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: #A855F7; margin-bottom: 4px;">🔄 Forzar Recarga de Feed RSS</div>
            <div style="font-size: 10px; color: var(--color-text-dim); margin-bottom: 6px;">URL para Stream Deck (GET request):</div>
            <code style="display: block; font-size: 10px; background: #0B0D0F; padding: 6px; border-radius: 4px; color: #A855F7; word-break: break-all;">http://localhost:8080/api/deck/widget?widget=ticker&action=refresh_rss</code>
          </div>
        </div>
      </div>

      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>💾</span>
            <span>Configuración en Formato JSON Directo</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="copyTickerConfigJson()">📋 Copiar JSON</button>
            <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px; color: #57D6C4;" onclick="applyTickerConfigJson()">📥 Importar JSON</button>
          </div>
        </div>
        <textarea id="cfg-ticker-json-dump" style="width: 100%; height: 160px; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 8px; box-sizing: border-box; resize: vertical;">${JSON.stringify(tk, null, 2)}</textarea>
      </div>
    </div>
  `;
};
