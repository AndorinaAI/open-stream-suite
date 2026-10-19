// ====================================================================
// MÓDULO WIDGET: MARQUESINA (TICKER) DE NOTICIAS, FRASES Y RSS
// Panel de Control Avanzado con 4 Pestañas, Gestor de Frases y RSS
// ====================================================================

var currentTickerTab = 'content'; // 'content' | 'styles' | 'presets' | 'code'

function renderTickerControls(container) {
  if (!container || !cachedWidgetsConfig) return;
  const tk = cachedWidgetsConfig.ticker || {};
  const s = tk.styles || {};
  const chips = tk.eventChips || {};
  const phrases = Array.isArray(tk.phrases) ? tk.phrases : [];
  const rss = tk.rss || {};
  const presets = tk.presets || [];
  const activePresetId = tk.activePreset || (presets[0] && presets[0].id) || 'cyber_taller';

  container.innerHTML = `
    <!-- Barra Superior de Navegación de Pestañas del Ticker -->
    <div class="miniapp-tabs-bar" style="display: flex; gap: 4px; border-bottom: 2px solid var(--color-border-dim); padding-bottom: 8px; margin-bottom: 14px;">
      <button type="button" class="btn-stage-preset ${currentTickerTab === 'content' ? 'active' : ''}" style="font-size: 11px; padding: 6px 12px; font-weight: 700; ${currentTickerTab === 'content' ? 'background: var(--color-accent-cyan); color: #0B0D0F;' : ''}" onclick="switchTickerSubTab('content')">
        📰 1. Contenido, Frases & RSS
      </button>
      <button type="button" class="btn-stage-preset ${currentTickerTab === 'styles' ? 'active' : ''}" style="font-size: 11px; padding: 6px 12px; font-weight: 700; ${currentTickerTab === 'styles' ? 'background: var(--color-accent-cyan); color: #0B0D0F;' : ''}" onclick="switchTickerSubTab('styles')">
        🎨 2. Estilos del Ticker
      </button>
      <button type="button" class="btn-stage-preset ${currentTickerTab === 'presets' ? 'active' : ''}" style="font-size: 11px; padding: 6px 12px; font-weight: 700; ${currentTickerTab === 'presets' ? 'background: var(--color-accent-cyan); color: #0B0D0F;' : ''}" onclick="switchTickerSubTab('presets')">
        🎛️ 3. Presets de Fábrica
      </button>
      <button type="button" class="btn-stage-preset ${currentTickerTab === 'code' ? 'active' : ''}" style="font-size: 11px; padding: 6px 12px; font-weight: 700; ${currentTickerTab === 'code' ? 'background: var(--color-accent-cyan); color: #0B0D0F;' : ''}" onclick="switchTickerSubTab('code')">
        💻 4. Código / JSON & Atajos
      </button>
    </div>

    <!-- ============================================================== -->
    <!-- PESTAÑA 1: CONTENIDO, FRASES Y RSS                             -->
    <!-- ============================================================== -->
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

          <label style="border: 1px solid ${tk.layoutMode === 'single_bar' ? '#57D6C4' : 'var(--color-border-dim)'}; background: ${tk.layoutMode === 'single_bar' ? 'rgba(87,214,196,0.1)' : 'rgba(0,0,0,0.2)'}; border-radius: 6px; padding: 10px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #fff;">📌 Línea Única Compacta</span>
              <input type="radio" name="tk-layout-mode" value="single_bar" ${tk.layoutMode === 'single_bar' ? 'checked' : ''} onchange="updateTickerPipPreview()">
            </div>
            <span style="font-size: 10px; color: var(--color-text-dim);">Todo en una sola marquesina horizontal continua (eventos + mensajes juntos).</span>
          </label>

          <label style="border: 1px solid ${tk.layoutMode === 'rotator' ? '#57D6C4' : 'var(--color-border-dim)'}; background: ${tk.layoutMode === 'rotator' ? 'rgba(87,214,196,0.1)' : 'rgba(0,0,0,0.2)'}; border-radius: 6px; padding: 10px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 12px; color: #fff;">🃏 Rotador de Tarjetas</span>
              <input type="radio" name="tk-layout-mode" value="rotator" ${tk.layoutMode === 'rotator' ? 'checked' : ''} onchange="updateTickerPipPreview()">
            </div>
            <span style="font-size: 10px; color: var(--color-text-dim);">Alterna las noticias y frases una a una en el centro con transiciones animadas.</span>
          </label>
        </div>

        <!-- Ajustes de Velocidad, Transición y Separadores -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px; margin-bottom: 3px;">Velocidad Marquesina (s):</label>
            <input type="number" id="cfg-ticker-speed" class="form-input" min="10" max="180" value="${tk.speed || 45}" oninput="updateTickerPipPreview()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px; margin-bottom: 3px;">Separador de Temas:</label>
            <input type="text" id="cfg-ticker-topic-sep" class="form-input" style="text-align: center;" value="${tk.topicSeparator || '///'}" oninput="updateTickerPipPreview()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px; margin-bottom: 3px;">Separador de Eventos:</label>
            <input type="text" id="cfg-ticker-event-sep" class="form-input" style="text-align: center;" value="${tk.eventSeparator || '│'}" oninput="updateTickerPipPreview()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px; margin-bottom: 3px;">Transición Rotador:</label>
            <select id="cfg-ticker-rot-anim" class="form-input" onchange="updateTickerPipPreview()">
              <option value="slide" ${(tk.rotatorAnimation || 'slide') === 'slide' ? 'selected' : ''}>Slide</option>
              <option value="fade" ${tk.rotatorAnimation === 'fade' ? 'selected' : ''}>Fade</option>
              <option value="flip" ${tk.rotatorAnimation === 'flip' ? 'selected' : ''}>Flip 3D</option>
              <option value="zoom" ${tk.rotatorAnimation === 'zoom' ? 'selected' : ''}>Zoom</option>
              <option value="blur" ${tk.rotatorAnimation === 'blur' ? 'selected' : ''}>Blur</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Fila Superior: Catálogo Completo de Eventos Stream ("Mostrar Último...") -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>✨</span>
            <span>Fila Superior: Métricas de Stream en Vivo ("Mostrar Último...")</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 3px 8px; color: #10B981; border-color: rgba(16,185,129,0.4);" onclick="openDonationsModal()">
              🔗 Conectar Ko-fi / PayPal / BMC
            </button>
            <span style="font-size: 10px; color: var(--color-text-dim);">Aparecen como chips en la barra superior</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-follows" ${chips.showFollows !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>❤️ Último Follower</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-subs" ${chips.showSubs !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>⭐ Último Sub</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-resubs" ${chips.showResubs ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>🔄 Último Resub</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-last-bits" ${chips.showLastBits !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>💎 Últimos Bits</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-top-bits" ${chips.showTopBits ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>👑 Top Bits</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-raids" ${chips.showRaids !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>🚀 Último Raid</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-tips" ${chips.showTips ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>💰 Última Donación</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(41,171,226,0.1); padding: 6px 8px; border-radius: 4px; border: 1px solid rgba(41,171,226,0.4);">
            <input type="checkbox" id="cfg-chip-kofi" ${chips.showKofi !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span style="color: #29ABE2;">☕ Ko-fi</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,121,193,0.1); padding: 6px 8px; border-radius: 4px; border: 1px solid rgba(0,121,193,0.4);">
            <input type="checkbox" id="cfg-chip-paypal" ${chips.showPaypal !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span style="color: #38BDF8;">🅿️ PayPal</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(255,221,0,0.1); padding: 6px 8px; border-radius: 4px; border: 1px solid rgba(255,221,0,0.4);">
            <input type="checkbox" id="cfg-chip-bmc" ${chips.showBmc !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span style="color: #FFDD00;">🟡 BuyMeACoffee</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-goal" ${chips.showGoal !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>🎯 Meta Activa</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-viewers" ${chips.showViewers ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>👀 Viewers en Vivo</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
            <input type="checkbox" id="cfg-chip-last-chat" ${chips.showLastChat ? 'checked' : ''} onchange="updateTickerPipPreview()">
            <span>💬 Chat Spotlight</span>
          </label>
        </div>
      </div>

      <!-- Fila Inferior: Prompter de Frases y Noticias RSS -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>📢</span>
            <span>Fila Inferior: Prompter de Frases y Noticias</span>
          </div>
          <!-- Selector de Fuente de Contenido -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 11px; font-weight: 700; color: #57D6C4;">Mostrar en Prompter:</label>
            <select id="cfg-ticker-content-source" class="form-input" style="width: 170px; padding: 3px 8px; font-size: 11px;" onchange="updateTickerPipPreview()">
              <option value="both" ${(tk.contentSource || 'both') === 'both' ? 'selected' : ''}>💬 Frases + 📰 RSS</option>
              <option value="phrases" ${tk.contentSource === 'phrases' ? 'selected' : ''}>💬 Solo Frases Propias</option>
              <option value="rss" ${tk.contentSource === 'rss' ? 'selected' : ''}>📰 Solo Titulares RSS</option>
            </select>
          </div>
        </div>

        <!-- 1. Gestor Dinámico de Frases / Temas -->
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">
              💬 Frases y Mensajes Rotativos por Tema:
            </span>
            <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; color: #57D6C4; border-color: #57D6C4;" onclick="addTickerPhrase()">
              ➕ Añadir Frase
            </button>
          </div>

          <div id="ticker-phrases-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${phrases.map((p, idx) => `
              <div style="display: grid; grid-template-columns: 50px 130px 1fr 34px; gap: 6px; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 6px;">
                <input type="text" class="form-input phrase-icon" data-idx="${idx}" value="${p.icon || '📌'}" style="text-align: center; font-size: 13px;" oninput="updateTickerPipPreview()">
                <input type="text" class="form-input phrase-badge" data-idx="${idx}" value="${p.badge || 'TALLER'}" placeholder="Insignia" style="font-size: 11px; font-weight: 700;" oninput="updateTickerPipPreview()">
                <input type="text" class="form-input phrase-text" data-idx="${idx}" value="${p.text || ''}" placeholder="Texto del mensaje..." style="font-size: 11px;" oninput="updateTickerPipPreview()">
                <button type="button" class="btn-stage-preset" style="color: #F87171; border-color: rgba(248,113,113,0.4); padding: 4px;" onclick="deleteTickerPhrase(${idx})" title="Eliminar frase">
                  🗑️
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. Configuración de Feed RSS en Vivo -->
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-weight: 700; color: #FBBF24; text-transform: uppercase;">
                📰 Feed RSS de Noticias en Vivo:
              </span>
              <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 10px; color: var(--color-text-dim);">
                <input type="checkbox" id="cfg-rss-enable" ${rss.enabled !== false ? 'checked' : ''} onchange="updateTickerPipPreview()">
                <span>Activar RSS</span>
              </label>
            </div>
            <!-- Presets Rápidos de Feeds RSS -->
            <div style="display: flex; gap: 4px;">
              <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 6px;" onclick="setRssFeedPreset('bbc')">BBC Mundo</button>
              <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 6px;" onclick="setRssFeedPreset('hackaday')">Hackaday</button>
              <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 6px;" onclick="setRssFeedPreset('techcrunch')">TechCrunch</button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 130px 100px; gap: 8px; margin-bottom: 8px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 10px; margin-bottom: 3px;">URL del Feed RSS / Atom:</label>
              <input type="url" id="cfg-rss-url" class="form-input" value="${rss.url || 'https://feeds.bbci.co.uk/news/world/rss.xml'}" placeholder="https://ejemplo.com/rss.xml" oninput="updateTickerPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 10px; margin-bottom: 3px;">Insignia RSS:</label>
              <input type="text" id="cfg-rss-prefix" class="form-input" value="${rss.prefix || 'NOTICIAS MUNDO'}" oninput="updateTickerPipPreview()">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 10px; margin-bottom: 3px;">Máx Titulares:</label>
              <input type="number" id="cfg-rss-max" class="form-input" min="2" max="20" value="${rss.maxItems || 6}" oninput="updateTickerPipPreview()">
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; color: #FBBF24;" onclick="testRssFeedFetch()">
              🔄 Probar y Actualizar Titulares Ahora
            </button>
            <span id="rss-test-status" style="font-size: 10px; color: var(--color-text-dim);">Actualizado en vivo</span>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
          <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 16px;" onclick="saveTickerControls()">
            💾 Guardar Contenido y Frases
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- PESTAÑA 2: ESTILOS VISUALES DEL TICKER                         -->
    <!-- ============================================================== -->
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

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Color Fondo Fila Sup:</label>
            <div style="display: flex; gap: 4px; align-items: center;">
              <input type="color" id="cfg-top-bg" value="${s.topTierBgColor || '#121518'}" oninput="updateTickerPipPreview()">
              <input type="text" id="cfg-top-bg-txt" class="form-input" style="font-size: 11px;" value="${s.topTierBgColor || '#121518'}" oninput="syncColorInput('cfg-top-bg-txt', 'cfg-top-bg'); updateTickerPipPreview();">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Opacidad Fila Sup (%):</label>
            <input type="number" id="cfg-top-opacity" class="form-input" min="0" max="100" value="${s.topTierBgOpacity !== undefined ? s.topTierBgOpacity : 88}" oninput="updateTickerPipPreview()">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Borde Fila Sup:</label>
            <input type="color" id="cfg-top-border" style="width: 100%; height: 28px;" value="${s.topTierBorderColor && s.topTierBorderColor.startsWith('#') ? s.topTierBorderColor : '#57D6C4'}" oninput="updateTickerPipPreview()">
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Alineación Superior:</label>
            <select id="cfg-top-align" class="form-input" onchange="updateTickerPipPreview()">
              <option value="center" ${(s.topTierAlign || 'center') === 'center' ? 'selected' : ''}>Centrado</option>
              <option value="flex-start" ${s.topTierAlign === 'flex-start' ? 'selected' : ''}>Izquierda</option>
              <option value="space-between" ${s.topTierAlign === 'space-between' ? 'selected' : ''}>Distribuido</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Tamaño Fuente Superior (px):</label>
            <input type="number" id="cfg-top-font-size" class="form-input" min="9" max="22" value="${s.topTierFontSize || 12}" oninput="updateTickerPipPreview()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Espaciado entre Chips (px):</label>
            <input type="number" id="cfg-top-spacing" class="form-input" min="2" max="24" value="${s.topTierSpacing || 8}" oninput="updateTickerPipPreview()">
          </div>
        </div>
      </div>

      <!-- Formas, Fondos y Bordes -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>📐</span>
            <span>Forma, Fondo y Bordes del Prompter / Marquesina</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Forma de la Barra:</label>
            <select id="cfg-ticker-shape" class="form-input" onchange="updateTickerPipPreview()">
              <option value="rounded" ${(s.shape || 'rounded') === 'rounded' ? 'selected' : ''}>Cápsula Redonda</option>
              <option value="tech" ${s.shape === 'tech' ? 'selected' : ''}>Rectangular Tech</option>
              <option value="tech_corners" ${s.shape === 'tech_corners' ? 'selected' : ''}>Bisel Esquinas Cortadas</option>
              <option value="minimal" ${s.shape === 'minimal' ? 'selected' : ''}>Minimalista Plano</option>
              <option value="edge_to_edge" ${s.shape === 'edge_to_edge' ? 'selected' : ''}>Completa Borde a Borde</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Tipo de Fondo:</label>
            <select id="cfg-ticker-bg-type" class="form-input" onchange="updateTickerPipPreview()">
              <option value="glass" ${(s.bgType || 'glass') === 'glass' ? 'selected' : ''}>Vidrio Glassmorphism</option>
              <option value="gradient" ${s.bgType === 'gradient' ? 'selected' : ''}>Degradado Neón</option>
              <option value="solid" ${s.bgType === 'solid' ? 'selected' : ''}>Color Sólido</option>
              <option value="transparent" ${s.bgType === 'transparent' ? 'selected' : ''}>100% Transparente</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Estilo de Bordes:</label>
            <select id="cfg-ticker-border-style" class="form-input" onchange="updateTickerPipPreview()">
              <option value="left_neon" ${(s.borderStyle || 'left_neon') === 'left_neon' ? 'selected' : ''}>Acento Izquierdo Neón</option>
              <option value="all_neon" ${s.borderStyle === 'all_neon' ? 'selected' : ''}>Borde Completo Neón</option>
              <option value="top_bottom" ${s.borderStyle === 'top_bottom' ? 'selected' : ''}>Líneas Arriba & Abajo</option>
              <option value="tech_corners" ${s.borderStyle === 'tech_corners' ? 'selected' : ''}>Esquinas Tech</option>
              <option value="none" ${s.borderStyle === 'none' ? 'selected' : ''}>Sin Borde</option>
            </select>
          </div>
        </div>

        <!-- Paleta de Colores y Sliders -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Color de Acento:</label>
            <div style="display: flex; gap: 4px; align-items: center;">
              <input type="color" id="cfg-ticker-accent" value="${s.accentColor || s.borderColor || '#57D6C4'}" oninput="updateTickerPipPreview()">
              <input type="text" id="cfg-ticker-accent-txt" class="form-input" style="font-size: 11px;" value="${s.accentColor || s.borderColor || '#57D6C4'}" oninput="syncColorInput('cfg-ticker-accent-txt', 'cfg-ticker-accent'); updateTickerPipPreview();">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Color de Fondo:</label>
            <div style="display: flex; gap: 4px; align-items: center;">
              <input type="color" id="cfg-ticker-bg" value="${s.bgColor || '#191D21'}" oninput="updateTickerPipPreview()">
              <input type="text" id="cfg-ticker-bg-txt" class="form-input" style="font-size: 11px;" value="${s.bgColor || '#191D21'}" oninput="syncColorInput('cfg-ticker-bg-txt', 'cfg-ticker-bg'); updateTickerPipPreview();">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Gradiente Fin:</label>
            <div style="display: flex; gap: 4px; align-items: center;">
              <input type="color" id="cfg-ticker-bg-grad" value="${s.bgGradient || '#0B0D0F'}" oninput="updateTickerPipPreview()">
              <input type="text" id="cfg-ticker-bg-grad-txt" class="form-input" style="font-size: 11px;" value="${s.bgGradient || '#0B0D0F'}" oninput="syncColorInput('cfg-ticker-bg-grad-txt', 'cfg-ticker-bg-grad'); updateTickerPipPreview();">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 10px;">Opacidad Fondo (%):</label>
            <input type="number" id="cfg-ticker-opacity" class="form-input" min="0" max="100" value="${s.bgOpacity !== undefined ? s.bgOpacity : 92}" oninput="updateTickerPipPreview()">
          </div>
        </div>

        <!-- Colores Específicos de Eventos y Donaciones -->
        <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
          <div style="font-size: 10px; font-weight: 700; color: var(--color-text-dim); text-transform: uppercase; margin-bottom: 8px;">
            🎨 Colores por Tipo de Evento y Donación:
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            <div>
              <label style="font-size: 10px; color: #F43F5E;">❤️ Follows:</label>
              <input type="color" id="cfg-ticker-col-follow" style="width: 100%; height: 28px;" value="${s.followColor || '#F43F5E'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #A78BFA;">⭐ Subs:</label>
              <input type="color" id="cfg-ticker-col-sub" style="width: 100%; height: 28px;" value="${s.subColor || '#A78BFA'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #818CF8;">🔄 Resubs:</label>
              <input type="color" id="cfg-ticker-col-resub" style="width: 100%; height: 28px;" value="${s.resubColor || '#818CF8'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #FBBF24;">💎 Bits:</label>
              <input type="color" id="cfg-ticker-col-bits" style="width: 100%; height: 28px;" value="${s.bitsColor || '#FBBF24'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #F59E0B;">👑 Top Bits:</label>
              <input type="color" id="cfg-ticker-col-top-bits" style="width: 100%; height: 28px;" value="${s.topBitsColor || '#F59E0B'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #38BDF8;">🚀 Raids:</label>
              <input type="color" id="cfg-ticker-col-raid" style="width: 100%; height: 28px;" value="${s.raidColor || '#38BDF8'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #10B981;">💰 Donación:</label>
              <input type="color" id="cfg-ticker-col-tip" style="width: 100%; height: 28px;" value="${s.tipColor || '#10B981'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #29ABE2;">☕ Ko-fi:</label>
              <input type="color" id="cfg-ticker-col-kofi" style="width: 100%; height: 28px;" value="${s.kofiColor || '#29ABE2'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #0079C1;">🅿️ PayPal:</label>
              <input type="color" id="cfg-ticker-col-paypal" style="width: 100%; height: 28px;" value="${s.paypalColor || '#0079C1'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #FFDD00;">🟡 BMC:</label>
              <input type="color" id="cfg-ticker-col-bmc" style="width: 100%; height: 28px;" value="${s.bmcColor || '#FFDD00'}" oninput="updateTickerPipPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: #57D6C4;">🎯 Metas:</label>
              <input type="color" id="cfg-ticker-col-goal" style="width: 100%; height: 28px;" value="${s.goalColor || '#57D6C4'}" oninput="updateTickerPipPreview()">
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

    <!-- ============================================================== -->
    <!-- PESTAÑA 3: PRESETS DE FÁBRICA Y USUARIO                        -->
    <!-- ============================================================== -->
    <div id="ticker-tab-presets" style="display: ${currentTickerTab === 'presets' ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
      
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>🎛️</span>
            <span>Banco de Presets Visuales del Ticker</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          ${presets.map(p => `
            <div style="background: rgba(0,0,0,0.3); border: 1px solid ${p.id === activePresetId ? '#57D6C4' : 'var(--color-border-dim)'}; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; font-size: 12px; color: #fff;">${p.name}</span>
                ${p.id === activePresetId ? '<span style="font-size: 9px; padding: 1px 6px; background: rgba(87,214,196,0.2); color: #57D6C4; border: 1px solid #57D6C4; border-radius: 4px;">ACTIVO</span>' : ''}
              </div>
              <div style="font-size: 10px; color: var(--color-text-dim); display: flex; gap: 8px;">
                <span>Modo: ${p.layoutMode || 'two_tier'}</span>
                <span>Fuente: ${(p.styles && p.styles.fontFamily) || 'rajdhani'}</span>
              </div>
              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; color: #57D6C4;" onclick="applyTickerPreset('${p.id}')">
                  🚀 Cargar
                </button>
                ${!p.isBuiltin ? `
                  <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; color: #F87171;" onclick="deleteTickerPreset('${p.id}')">
                    🗑️ Borrar
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: space-between; border-top: 1px dashed var(--color-border-dim); padding-top: 10px;">
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn-stage-preset" onclick="saveNewTickerPreset()">
              💾 Guardar Ajustes Actuales como Preset
            </button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn-stage-preset" onclick="exportTickerPresetJson()">
              📤 Exportar JSON
            </button>
            <button type="button" class="btn-stage-preset" onclick="importTickerPresetJson()">
              📥 Importar JSON
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- PESTAÑA 4: CÓDIGO / JSON & ACCIONES RÁPIDAS                    -->
    <!-- ============================================================== -->
    <div id="ticker-tab-code" style="display: ${currentTickerTab === 'code' ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
      
      <!-- Acciones Rápidas y Pruebas en Vivo -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>🕹️</span>
            <span>Acciones Rápidas para Controlar el Ticker</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn-action-test" onclick="API.triggerWidgetAction('ticker', 'flash_news', { message: '🚨 ¡ALERTA EN DIRECTO: Noticia de última hora emitida!' })">
            🚨 Emitir Noticia Flash
          </button>
          <button type="button" class="btn-action-test" style="border-color: #F43F5E; color: #F43F5E;" onclick="API.triggerWidgetAction('ticker', 'simulate', { event: 'follow', user: 'ViewerNuevo' })">
            ❤️ Simular Follower
          </button>
          <button type="button" class="btn-action-test" style="border-color: #A78BFA; color: #A78BFA;" onclick="API.triggerWidgetAction('ticker', 'simulate', { event: 'sub', user: 'SubPrime', tier: 'Tier 3', months: 6 })">
            ⭐ Simular Sub
          </button>
          <button type="button" class="btn-action-test" style="border-color: #FBBF24; color: #FBBF24;" onclick="API.triggerWidgetAction('ticker', 'simulate', { event: 'bits', user: 'BitDonator', amount: 500 })">
            💎 Simular 500 Bits
          </button>
          <button type="button" class="btn-action-test" style="border-color: #38BDF8; color: #38BDF8;" onclick="API.triggerWidgetAction('ticker', 'simulate', { event: 'raid', user: 'AmigoStreamer', amount: 45 })">
            🚀 Simular Raid (45)
          </button>
          <button type="button" class="btn-action-test" style="border-color: #29ABE2; color: #29ABE2;" onclick="API.triggerWidgetAction('ticker', 'simulate', { event: 'tip', platform: 'kofi', user: 'KofiMaker', amount: '5.00 €', message: '¡Ánimo con el proyecto!' })">
            ☕ Simular Ko-fi (€5)
          </button>
          <button type="button" class="btn-action-test" style="border-color: #0079C1; color: #38BDF8;" onclick="API.triggerWidgetAction('ticker', 'simulate', { event: 'tip', platform: 'paypal', user: 'PayPalFan', amount: '10.00 EUR', message: 'Para los componentes.' })">
            🅿️ Simular PayPal (€10)
          </button>
          <button type="button" class="btn-action-test" style="border-color: #FFDD00; color: #FFDD00;" onclick="API.triggerWidgetAction('ticker', 'simulate', { event: 'tip', platform: 'buymeacoffee', user: 'CafeSupporter', amount: '9.00 €', message: '¡3 cafés para el taller!' })">
            🟡 Simular BMC (3 Cafés)
          </button>
          <button type="button" class="btn-stage-preset" onclick="API.triggerWidgetAction('ticker', 'toggle_pause')">
            ⏯️ Pausar / Reanudar
          </button>
        </div>
      </div>

      <!-- Editor Reactivo de JSON -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>💻</span>
            <span>Configuración Raw JSON del Ticker</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="copyText(document.getElementById('cfg-ticker-raw-json')?.value || '')">
            📋 Copiar JSON
          </button>
        </div>
        <textarea id="cfg-ticker-raw-json" style="width: 100%; height: 180px; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 8px; box-sizing: border-box; resize: vertical;">${JSON.stringify(tk, null, 2)}</textarea>
        <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
          <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 14px;" onclick="applyTickerRawJson()">
            💾 Aplicar Cambios JSON
          </button>
        </div>
      </div>
    </div>
  `;

  setTimeout(updateTickerPipPreview, 50);
}

// Navegación de Pestañas
function switchTickerSubTab(tabName) {
  currentTickerTab = tabName;
  const container = document.getElementById('miniapp-controls-content');
  if (container) {
    renderTickerControls(container);
  }
}

// Gestión de Frases
function addTickerPhrase() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;
  if (!Array.isArray(cachedWidgetsConfig.ticker.phrases)) {
    cachedWidgetsConfig.ticker.phrases = [];
  }
  cachedWidgetsConfig.ticker.phrases.push({
    id: 'p_' + Date.now(),
    icon: '⚡',
    badge: 'NUEVO TEMA',
    text: 'Escribe aquí el texto que se desplazará en la marquesina...'
  });
  renderTickerControls(document.getElementById('miniapp-controls-content'));
  updateTickerPipPreview();
}

function deleteTickerPhrase(index) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;
  if (!Array.isArray(cachedWidgetsConfig.ticker.phrases)) return;
  cachedWidgetsConfig.ticker.phrases.splice(index, 1);
  renderTickerControls(document.getElementById('miniapp-controls-content'));
  updateTickerPipPreview();
}

// Presets de RSS
function setRssFeedPreset(type) {
  const urlInput = document.getElementById('cfg-rss-url');
  const prefixInput = document.getElementById('cfg-rss-prefix');
  if (!urlInput || !prefixInput) return;

  if (type === 'bbc') {
    urlInput.value = 'https://feeds.bbci.co.uk/news/world/rss.xml';
    prefixInput.value = 'BBC MUNDO';
  } else if (type === 'hackaday') {
    urlInput.value = 'https://hackaday.com/feed/';
    prefixInput.value = 'HACKADAY MAKER';
  } else if (type === 'techcrunch') {
    urlInput.value = 'https://techcrunch.com/feed/';
    prefixInput.value = 'TECHCRUNCH';
  }
  updateTickerPipPreview();
  testRssFeedFetch();
}

async function testRssFeedFetch() {
  const url = document.getElementById('cfg-rss-url')?.value;
  const statusEl = document.getElementById('rss-test-status');
  if (!url) return;

  if (statusEl) statusEl.textContent = '⏳ Comprobando feed RSS...';
  try {
    const resp = await fetch(`/api/rss/feed?url=${encodeURIComponent(url)}`);
    const data = await resp.json();
    if (data.status === 'ok') {
      if (statusEl) statusEl.textContent = `✓ ${data.count} noticias de "${data.feed_title}"`;
      updateTickerPipPreview(true);
    } else {
      if (statusEl) statusEl.textContent = `⚠️ Error: ${data.error}`;
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = `⚠️ Error conectando: ${err.message}`;
  }
}

function syncColorInput(textId, colorId) {
  const txt = document.getElementById(textId);
  const col = document.getElementById(colorId);
  if (txt && col && /^#[0-9A-Fa-f]{6}$/.test(txt.value)) {
    col.value = txt.value;
  }
}

// Recoger frases actuales de los inputs
function collectPhrasesFromDOM() {
  const phrases = [];
  const items = document.querySelectorAll('#ticker-phrases-list > div');
  items.forEach(el => {
    const icon = el.querySelector('.phrase-icon')?.value || '📌';
    const badge = el.querySelector('.phrase-badge')?.value || 'TEMA';
    const text = el.querySelector('.phrase-text')?.value || '';
    if (text.trim()) {
      phrases.push({ id: 'p_' + Math.random(), icon, badge, text });
    }
  });
  return phrases;
}

// Actualización en tiempo real del Iframe PiP (postMessage)
function updateTickerPipPreview(forceRss = false) {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (!iframe || !iframe.contentWindow) return;

  const layoutMode = document.querySelector('input[name="tk-layout-mode"]:checked')?.value || 'two_tier';
  const speed = parseInt(document.getElementById('cfg-ticker-speed')?.value, 10) || 45;
  const rotAnim = document.getElementById('cfg-ticker-rot-anim')?.value || 'slide';
  const topicSeparator = document.getElementById('cfg-ticker-topic-sep')?.value || '///';
  const eventSeparator = document.getElementById('cfg-ticker-event-sep')?.value || '│';

  const contentSource = document.getElementById('cfg-ticker-content-source')?.value || 'both';
  const phrases = collectPhrasesFromDOM();

  const rssEnable = document.getElementById('cfg-rss-enable')?.checked;
  const rssUrl = document.getElementById('cfg-rss-url')?.value || '';
  const rssPrefix = document.getElementById('cfg-rss-prefix')?.value || 'NOTICIAS MUNDO';
  const rssMax = parseInt(document.getElementById('cfg-rss-max')?.value, 10) || 6;

  const showFollows = document.getElementById('cfg-chip-follows')?.checked;
  const showSubs = document.getElementById('cfg-chip-subs')?.checked;
  const showResubs = document.getElementById('cfg-chip-resubs')?.checked;
  const showLastBits = document.getElementById('cfg-chip-last-bits')?.checked;
  const showTopBits = document.getElementById('cfg-chip-top-bits')?.checked;
  const showRaids = document.getElementById('cfg-chip-raids')?.checked;
  const showTips = document.getElementById('cfg-chip-tips')?.checked;
  const showKofi = document.getElementById('cfg-chip-kofi')?.checked;
  const showPaypal = document.getElementById('cfg-chip-paypal')?.checked;
  const showBmc = document.getElementById('cfg-chip-bmc')?.checked;
  const showGoal = document.getElementById('cfg-chip-goal')?.checked;
  const showViewers = document.getElementById('cfg-chip-viewers')?.checked;
  const showLastChat = document.getElementById('cfg-chip-last-chat')?.checked;

  const shape = document.getElementById('cfg-ticker-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-ticker-bg-type')?.value || 'glass';
  const borderStyle = document.getElementById('cfg-ticker-border-style')?.value || 'left_neon';
  const accentColor = document.getElementById('cfg-ticker-accent')?.value || '#57D6C4';
  const bgColor = document.getElementById('cfg-ticker-bg')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-ticker-bg-grad')?.value || '#0B0D0F';
  const bgOpacity = parseInt(document.getElementById('cfg-ticker-opacity')?.value, 10) || 92;

  const followColor = document.getElementById('cfg-ticker-col-follow')?.value || '#F43F5E';
  const subColor = document.getElementById('cfg-ticker-col-sub')?.value || '#A78BFA';
  const bitsColor = document.getElementById('cfg-ticker-col-bits')?.value || '#FBBF24';
  const raidColor = document.getElementById('cfg-ticker-col-raid')?.value || '#38BDF8';

  const fontFamily = document.getElementById('cfg-ticker-font')?.value || 'rajdhani';
  const fontSize = parseInt(document.getElementById('cfg-ticker-font-size')?.value, 10) || 13;
  const glowIntensity = parseInt(document.getElementById('cfg-ticker-glow')?.value, 10) || 35;
  const customCSS = document.getElementById('cfg-ticker-custom-css')?.value || '';

  const cfg = {
    layoutMode,
    speed,
    rotatorAnimation: rotAnim,
    topicSeparator,
    eventSeparator,
    contentSource,
    phrases: phrases.length > 0 ? phrases : undefined,
    rss: {
      enabled: rssEnable !== false,
      url: rssUrl,
      prefix: rssPrefix,
      maxItems: rssMax
    },
    eventChips: {
      showFollows: showFollows !== false,
      showSubs: showSubs !== false,
      showResubs: showResubs === true,
      showLastBits: showLastBits !== false,
      showTopBits: showTopBits === true,
      showRaids: showRaids !== false,
      showTips: showTips === true,
      showKofi: showKofi !== false,
      showPaypal: showPaypal !== false,
      showBmc: showBmc !== false,
      showGoal: showGoal !== false,
      showViewers: showViewers === true,
      showLastChat: showLastChat === true
    },
    styles: {
      shape,
      bgType,
      borderStyle,
      borderColor: accentColor,
      accentColor,
      bgColor,
      bgGradient,
      bgOpacity,
      topTierShape: document.getElementById('cfg-top-shape')?.value || 'capsule',
      topTierChipStyle: document.getElementById('cfg-top-chip-style')?.value || 'badge_filled',
      topTierBgColor: document.getElementById('cfg-top-bg')?.value || '#121518',
      topTierBgOpacity: parseInt(document.getElementById('cfg-top-opacity')?.value, 10) || 88,
      topTierBorderColor: document.getElementById('cfg-top-border')?.value || '#57D6C4',
      topTierFontSize: parseInt(document.getElementById('cfg-top-font-size')?.value, 10) || 12,
      topTierSpacing: parseInt(document.getElementById('cfg-top-spacing')?.value, 10) || 8,
      topTierAlign: document.getElementById('cfg-top-align')?.value || 'center',
      followColor,
      subColor,
      resubColor: document.getElementById('cfg-ticker-col-resub')?.value || '#818CF8',
      bitsColor,
      topBitsColor: document.getElementById('cfg-ticker-col-top-bits')?.value || '#F59E0B',
      raidColor,
      tipColor: document.getElementById('cfg-ticker-col-tip')?.value || '#10B981',
      kofiColor: document.getElementById('cfg-ticker-col-kofi')?.value || '#29ABE2',
      paypalColor: document.getElementById('cfg-ticker-col-paypal')?.value || '#0079C1',
      bmcColor: document.getElementById('cfg-ticker-col-bmc')?.value || '#FFDD00',
      goalColor: document.getElementById('cfg-ticker-col-goal')?.value || '#57D6C4',
      fontFamily,
      fontSize,
      glowIntensity,
      customCSS
    }
  };

  try {
    iframe.contentWindow.postMessage({
      type: 'apply_ticker_config',
      config: cfg,
      forceRss: forceRss
    }, '*');
  } catch (e) {}
}

// Guardado de Controles
async function saveTickerControls() {
  if (!cachedWidgetsConfig) return;
  if (!cachedWidgetsConfig.ticker) cachedWidgetsConfig.ticker = {};
  const tk = cachedWidgetsConfig.ticker;

  tk.layoutMode = document.querySelector('input[name="tk-layout-mode"]:checked')?.value || tk.layoutMode || 'two_tier';
  tk.speed = parseInt(document.getElementById('cfg-ticker-speed')?.value, 10) || tk.speed || 45;
  tk.rotatorAnimation = document.getElementById('cfg-ticker-rot-anim')?.value || tk.rotatorAnimation || 'slide';
  tk.topicSeparator = document.getElementById('cfg-ticker-topic-sep')?.value || tk.topicSeparator || '///';
  tk.eventSeparator = document.getElementById('cfg-ticker-event-sep')?.value || tk.eventSeparator || '│';

  tk.contentSource = document.getElementById('cfg-ticker-content-source')?.value || tk.contentSource || 'both';

  const collectedPhrases = collectPhrasesFromDOM();
  if (collectedPhrases.length > 0) {
    tk.phrases = collectedPhrases;
  }

  if (!tk.rss) tk.rss = {};
  tk.rss.enabled = document.getElementById('cfg-rss-enable')?.checked !== false;
  tk.rss.url = document.getElementById('cfg-rss-url')?.value || tk.rss.url;
  tk.rss.prefix = document.getElementById('cfg-rss-prefix')?.value || tk.rss.prefix;
  tk.rss.maxItems = parseInt(document.getElementById('cfg-rss-max')?.value, 10) || tk.rss.maxItems || 6;

  if (!tk.eventChips) tk.eventChips = {};
  tk.eventChips.showFollows = document.getElementById('cfg-chip-follows')?.checked !== false;
  tk.eventChips.showSubs = document.getElementById('cfg-chip-subs')?.checked !== false;
  tk.eventChips.showResubs = document.getElementById('cfg-chip-resubs')?.checked === true;
  tk.eventChips.showLastBits = document.getElementById('cfg-chip-last-bits')?.checked !== false;
  tk.eventChips.showTopBits = document.getElementById('cfg-chip-top-bits')?.checked === true;
  tk.eventChips.showRaids = document.getElementById('cfg-chip-raids')?.checked !== false;
  tk.eventChips.showTips = document.getElementById('cfg-chip-tips')?.checked === true;
  tk.eventChips.showKofi = document.getElementById('cfg-chip-kofi')?.checked !== false;
  tk.eventChips.showPaypal = document.getElementById('cfg-chip-paypal')?.checked !== false;
  tk.eventChips.showBmc = document.getElementById('cfg-chip-bmc')?.checked !== false;
  tk.eventChips.showGoal = document.getElementById('cfg-chip-goal')?.checked !== false;
  tk.eventChips.showViewers = document.getElementById('cfg-chip-viewers')?.checked === true;
  tk.eventChips.showLastChat = document.getElementById('cfg-chip-last-chat')?.checked === true;

  if (!tk.styles) tk.styles = {};
  tk.styles.shape = document.getElementById('cfg-ticker-shape')?.value || tk.styles.shape || 'rounded';
  tk.styles.bgType = document.getElementById('cfg-ticker-bg-type')?.value || tk.styles.bgType || 'glass';
  tk.styles.borderStyle = document.getElementById('cfg-ticker-border-style')?.value || tk.styles.borderStyle || 'left_neon';
  
  const accent = document.getElementById('cfg-ticker-accent')?.value || tk.styles.accentColor || '#57D6C4';
  tk.styles.accentColor = accent;
  tk.styles.borderColor = accent;
  tk.styles.bgColor = document.getElementById('cfg-ticker-bg')?.value || tk.styles.bgColor || '#191D21';
  tk.styles.bgGradient = document.getElementById('cfg-ticker-bg-grad')?.value || tk.styles.bgGradient || '#0B0D0F';
  tk.styles.bgOpacity = parseInt(document.getElementById('cfg-ticker-opacity')?.value, 10) || tk.styles.bgOpacity || 92;

  tk.styles.topTierShape = document.getElementById('cfg-top-shape')?.value || tk.styles.topTierShape || 'capsule';
  tk.styles.topTierChipStyle = document.getElementById('cfg-top-chip-style')?.value || tk.styles.topTierChipStyle || 'badge_filled';
  tk.styles.topTierBgColor = document.getElementById('cfg-top-bg')?.value || tk.styles.topTierBgColor || '#121518';
  tk.styles.topTierBgOpacity = parseInt(document.getElementById('cfg-top-opacity')?.value, 10) || tk.styles.topTierBgOpacity || 88;
  tk.styles.topTierBorderColor = document.getElementById('cfg-top-border')?.value || tk.styles.topTierBorderColor || '#57D6C4';
  tk.styles.topTierFontSize = parseInt(document.getElementById('cfg-top-font-size')?.value, 10) || tk.styles.topTierFontSize || 12;
  tk.styles.topTierSpacing = parseInt(document.getElementById('cfg-top-spacing')?.value, 10) || tk.styles.topTierSpacing || 8;
  tk.styles.topTierAlign = document.getElementById('cfg-top-align')?.value || tk.styles.topTierAlign || 'center';

  tk.styles.followColor = document.getElementById('cfg-ticker-col-follow')?.value || tk.styles.followColor || '#F43F5E';
  tk.styles.subColor = document.getElementById('cfg-ticker-col-sub')?.value || tk.styles.subColor || '#A78BFA';
  tk.styles.resubColor = document.getElementById('cfg-ticker-col-resub')?.value || tk.styles.resubColor || '#818CF8';
  tk.styles.bitsColor = document.getElementById('cfg-ticker-col-bits')?.value || tk.styles.bitsColor || '#FBBF24';
  tk.styles.topBitsColor = document.getElementById('cfg-ticker-col-top-bits')?.value || tk.styles.topBitsColor || '#F59E0B';
  tk.styles.raidColor = document.getElementById('cfg-ticker-col-raid')?.value || tk.styles.raidColor || '#38BDF8';
  tk.styles.tipColor = document.getElementById('cfg-ticker-col-tip')?.value || tk.styles.tipColor || '#10B981';
  tk.styles.kofiColor = document.getElementById('cfg-ticker-col-kofi')?.value || tk.styles.kofiColor || '#29ABE2';
  tk.styles.paypalColor = document.getElementById('cfg-ticker-col-paypal')?.value || tk.styles.paypalColor || '#0079C1';
  tk.styles.bmcColor = document.getElementById('cfg-ticker-col-bmc')?.value || tk.styles.bmcColor || '#FFDD00';
  tk.styles.goalColor = document.getElementById('cfg-ticker-col-goal')?.value || tk.styles.goalColor || '#57D6C4';

  tk.styles.fontFamily = document.getElementById('cfg-ticker-font')?.value || tk.styles.fontFamily || 'rajdhani';
  tk.styles.fontSize = parseInt(document.getElementById('cfg-ticker-font-size')?.value, 10) || tk.styles.fontSize || 13;
  tk.styles.glowIntensity = parseInt(document.getElementById('cfg-ticker-glow')?.value, 10) || tk.styles.glowIntensity || 35;
  tk.styles.customCSS = document.getElementById('cfg-ticker-custom-css')?.value || tk.styles.customCSS || '';

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateTickerPipPreview(true);
  renderTickerShortcuts();
  alert('✓ Configuración del Ticker guardada correctamente.');
}

// Sincronizar estilo desde el Chat
function importChatStylesToTicker() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const chatStyles = cachedWidgetsConfig.chat.styles || {};
  if (!cachedWidgetsConfig.ticker) cachedWidgetsConfig.ticker = {};
  if (!cachedWidgetsConfig.ticker.styles) cachedWidgetsConfig.ticker.styles = {};

  const ts = cachedWidgetsConfig.ticker.styles;
  if (chatStyles.borderColor) {
    ts.borderColor = chatStyles.borderColor;
    ts.accentColor = chatStyles.borderColor;
  }
  if (chatStyles.bgColor) ts.bgColor = chatStyles.bgColor;
  if (chatStyles.bgGradient) ts.bgGradient = chatStyles.bgGradient;
  if (chatStyles.shape) ts.shape = chatStyles.shape;
  if (chatStyles.borderStyle) ts.borderStyle = chatStyles.borderStyle;

  renderTickerControls(document.getElementById('miniapp-controls-content'));
  updateTickerPipPreview();
  alert('✓ Estilos de forma, fondo y colores copiados del Chat a la Marquesina.');
}

// Gestión de Presets
async function applyTickerPreset(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;
  const tk = cachedWidgetsConfig.ticker;
  const p = (tk.presets || []).find(it => it.id === presetId);
  if (!p) return;

  tk.activePreset = presetId;
  if (p.layoutMode) tk.layoutMode = p.layoutMode;
  if (p.contentSource) tk.contentSource = p.contentSource;
  if (p.speed) tk.speed = p.speed;
  if (p.topicSeparator) tk.topicSeparator = p.topicSeparator;
  if (p.eventSeparator) tk.eventSeparator = p.eventSeparator;
  if (p.styles) tk.styles = Object.assign({}, tk.styles, p.styles);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderTickerControls(document.getElementById('miniapp-controls-content'));
  updateTickerPipPreview(true);
  renderTickerShortcuts();
  alert(`✓ Preset "${p.name}" aplicado correctamente.`);
}

async function saveNewTickerPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;
  const name = prompt('Nombre para tu nuevo Preset de Marquesina (ej. "Cyber Dual Pro"):');
  if (!name) return;

  const tk = cachedWidgetsConfig.ticker;
  if (!Array.isArray(tk.presets)) tk.presets = [];

  const newId = 'preset_tk_' + Date.now();
  const preset = {
    id: newId,
    name: name,
    isBuiltin: false,
    layoutMode: tk.layoutMode,
    contentSource: tk.contentSource,
    speed: tk.speed,
    topicSeparator: tk.topicSeparator,
    eventSeparator: tk.eventSeparator,
    styles: JSON.parse(JSON.stringify(tk.styles || {}))
  };

  tk.presets.push(preset);
  tk.activePreset = newId;

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderTickerControls(document.getElementById('miniapp-controls-content'));
  alert(`✓ Preset "${name}" guardado.`);
}

async function deleteTickerPreset(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;
  const tk = cachedWidgetsConfig.ticker;
  const p = (tk.presets || []).find(it => it.id === presetId);
  if (!p || p.isBuiltin) {
    alert('No se pueden borrar los presets predefinidos de fábrica.');
    return;
  }
  if (!confirm(`¿Eliminar preset "${p.name}"?`)) return;

  tk.presets = tk.presets.filter(it => it.id !== presetId);
  tk.activePreset = 'cyber_taller';
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderTickerControls(document.getElementById('miniapp-controls-content'));
  alert('✓ Preset eliminado.');
}

function exportTickerPresetJson() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;
  const tk = cachedWidgetsConfig.ticker;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tk, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', `ticker_config_${Date.now()}.json`);
  dlAnchor.click();
}

async function importTickerPresetJson() {
  const jsonStr = prompt('Pega aquí el JSON completo del Ticker:');
  if (!jsonStr) return;
  try {
    const data = JSON.parse(jsonStr);
    if (!cachedWidgetsConfig) cachedWidgetsConfig = {};
    cachedWidgetsConfig.ticker = Object.assign({}, cachedWidgetsConfig.ticker, data);
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    renderTickerControls(document.getElementById('miniapp-controls-content'));
    updateTickerPipPreview(true);
    alert('✓ Configuración del Ticker importada correctamente.');
  } catch (err) {
    alert('Error al leer el JSON: ' + err.message);
  }
}

async function applyTickerRawJson() {
  const textarea = document.getElementById('cfg-ticker-raw-json');
  if (!textarea) return;
  try {
    const parsed = JSON.parse(textarea.value);
    cachedWidgetsConfig.ticker = parsed;
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    renderTickerControls(document.getElementById('miniapp-controls-content'));
    updateTickerPipPreview(true);
    alert('✓ JSON del Ticker aplicado y guardado correctamente.');
  } catch (err) {
    alert('Error de sintaxis JSON: ' + err.message);
  }
}

// Renderizado de Atajos en la Tarjeta del Dashboard
function renderTickerShortcuts() {
  const container = document.getElementById('ticker-shortcuts-container');
  if (!container || !cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;

  const tk = cachedWidgetsConfig.ticker;
  const shortcuts = tk.shortcuts || [
    { id: 'sc_tk_1', label: '📢 Anuncio Taller', action: 'message', params: { message: '🔥 ¡Directo de Taller y Electrónica en marcha!' }, color: '#57D6C4' },
    { id: 'sc_tk_2', label: '⭐ Gracias', action: 'message', params: { message: '🎉 ¡Gracias a todos por apoyar el canal!' }, color: '#A78BFA' },
    { id: 'sc_tk_3', label: '🚨 Flash', action: 'flash_news', params: { message: '🚨 ¡ALERTA EN DIRECTO: Proyecto completado con éxito!' }, color: '#EF4444' },
    { id: 'sc_tk_4', label: '❤️ +Follow', action: 'simulate', params: { event: 'follow', user: 'Comunidad' }, color: '#F43F5E' }
  ];

  container.innerHTML = `
    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
      ${shortcuts.map(sc => `
        <button type="button" class="btn-action-test" style="border-color: ${sc.color || '#57D6C4'}80; color: ${sc.color || '#57D6C4'};" onclick="API.triggerWidgetAction('ticker', '${sc.action}', ${JSON.stringify(sc.params || {}).replace(/"/g, '&quot;')})">
          ${sc.label}
        </button>
      `).join('')}
      <button type="button" class="btn-stage-preset" onclick="API.triggerWidgetAction('ticker', 'toggle_pause')" title="Pausar o reanudar marquesina">
        ⏯️ Pausa
      </button>
    </div>
  `;
}

// Registro Global de Funciones para el Window
window.renderTickerControls = renderTickerControls;
window.saveTickerControls = saveTickerControls;
window.switchTickerSubTab = switchTickerSubTab;
window.addTickerPhrase = addTickerPhrase;
window.deleteTickerPhrase = deleteTickerPhrase;
window.setRssFeedPreset = setRssFeedPreset;
window.testRssFeedFetch = testRssFeedFetch;
window.syncColorInput = syncColorInput;
window.updateTickerPipPreview = updateTickerPipPreview;
window.importChatStylesToTicker = importChatStylesToTicker;
window.applyTickerPreset = applyTickerPreset;
window.saveNewTickerPreset = saveNewTickerPreset;
window.deleteTickerPreset = deleteTickerPreset;
window.exportTickerPresetJson = exportTickerPresetJson;
window.importTickerPresetJson = importTickerPresetJson;
window.applyTickerRawJson = applyTickerRawJson;
window.renderTickerShortcuts = renderTickerShortcuts;

// Registro en el Gestor de Widgets Central
window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['ticker'] = {
  renderControls: renderTickerControls,
  saveControls: saveTickerControls
};

// Auto-renderizar atajos en la carga
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(renderTickerShortcuts, 300);
});
