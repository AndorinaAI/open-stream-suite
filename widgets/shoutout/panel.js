// ====================================================================
// MÓDULO WIDGET: PROMO Y SHOUTOUT (VISUAL STUDIO, QR Y PRESETS)
// ====================================================================

function renderPromoShortcuts() {
  const container = document.getElementById('promo-shortcuts-container');
  if (!container || !cachedWidgetsConfig.promo) return;

  const shortcuts = (cachedWidgetsConfig.promo.shortcuts || []).filter(s => s.pinned !== false);
  container.innerHTML = '';

  shortcuts.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'widget-shortcut-btn';
    const color = s.color || '#FF783F';
    btn.style.borderColor = `${color}60`;
    btn.style.boxShadow = `0 0 10px ${color}15`;
    btn.innerHTML = `
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></span>
      <span>${s.label}</span>
    `;
    btn.title = `Lanzar promo: ${s.title || s.label}`;
    btn.onclick = () => triggerPromoShortcut(s.id);
    container.appendChild(btn);
  });
}


async function triggerPromoShortcut(shortcutId) {
  const sc = (cachedWidgetsConfig?.promo?.shortcuts || []).find(s => s.id === shortcutId);
  if (!sc) return;
  await API.triggerWidgetAction('promo', 'promote', {
    type: sc.type,
    streamer: sc.streamer || document.getElementById('shoutout-username')?.value.trim() || 'andorina',
    title: sc.title || sc.label,
    subtitle: sc.subtitle || '',
    price: sc.price || '',
    link: sc.link || '',
    show_qr: sc.showQR !== false,
    color: sc.color || '#57D6C4'
  });
}


function renderPromoControls(container) {
  if (!container || !cachedWidgetsConfig) return;
    const p = cachedWidgetsConfig.promo || {};
    const presets = p.presets || [];
    const activePresetId = p.activePreset || 'streamer_neon';
    const s = p.styles || {};
    const sameAsChat = p.sameStyleAsChat === true;
    const history = p.history || (window.cachedPromoHistory || []);

    let presetsOptionsHtml = '';
    presets.forEach(pr => {
      const isSel = (pr.id === activePresetId) ? 'selected' : '';
      const tag = pr.isBuiltin ? '' : ' ⭐ [Personalizado]';
      presetsOptionsHtml += `<option value="${pr.id}" ${isSel}>${pr.name}${tag}</option>`;
    });

    const activePreset = presets.find(pr => pr.id === activePresetId) || presets[0] || {};
    const isStreamerMode = activePreset.type !== 'product' && activePreset.type !== 'custom' && activePreset.type !== 'social';

    // Construcción del HTML del Historial de Promos Recientes
    let historyHtml = '';
    if (!history || history.length === 0) {
      historyHtml = `
        <div style="text-align: center; padding: 22px 16px; background: rgba(0,0,0,0.25); border: 1px dashed var(--color-border-dim); border-radius: 8px; color: var(--color-text-dim); font-size: 12px;">
          <span style="font-size: 26px; display: block; margin-bottom: 6px;">📜</span>
          No se han emitido promociones en esta sesión todavía.<br>
          Cuando lances una promo desde aquí o desde el chat de Twitch con <code>!promo</code>, aparecerá aquí con botón para repetirla al instante.
        </div>
      `;
    } else {
      historyHtml = '<div style="display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; padding-right: 4px;">';
      history.forEach((h, idx) => {
        const typeLabels = {
          shoutout: '📢 STREAMER',
          product: '🛒 PRODUCTO',
          custom: '⚡ DESTACADO',
          social: '💬 REDES'
        };
        const typeBadge = typeLabels[h.promo_type || h.type] || '📢 PROMO';
        const titleText = h.title || h.display_name || h.streamer || 'Promoción';
        const subText = h.subtitle || h.game || h.message || '';
        const thumb = h.image_url || h.avatar || 'https://static-cdn.jtvnw.net/jtv_user_pictures/e33e6764-4631-48b0-9f1d-4cc6e5afc6fd-profile_image-300x300.png';
        const timeStr = h.timestamp || '';

        historyHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.35); border: 1px solid var(--color-border-dim); border-left: 3px solid ${h.color || '#57D6C4'}; border-radius: 6px; padding: 10px 14px; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
              <img src="${thumb}" alt="thumb" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid var(--color-border-dim); flex-shrink: 0; background: #191D21;">
              <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 9px; font-family: var(--font-tech); font-weight: 800; background: rgba(87,214,196,0.15); color: ${h.color || '#57D6C4'}; padding: 1px 6px; border-radius: 3px;">${typeBadge}</span>
                  <strong style="font-size: 13px; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${titleText}</strong>
                  ${h.price ? `<span style="font-size: 10px; background: rgba(245,158,11,0.2); color: #FBBF24; padding: 1px 6px; border-radius: 10px; font-weight: 800;">${h.price}</span>` : ''}
                  ${timeStr ? `<span style="font-size: 10px; color: var(--color-text-dim); margin-left: auto;">⏱️ ${timeStr}</span>` : ''}
                </div>
                <div style="font-size: 11px; color: #94A3B8; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-top: 2px;">
                  ${subText} ${h.link ? `· <span style="color: #64748B;">${h.link}</span>` : ''}
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 6px; flex-shrink: 0;">
              <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 12px; white-space: nowrap; font-weight: 700;" onclick="repeatPromoFromHistory(${idx})" title="Volver a emitir en directo para quien no le dio tiempo a escanear">
                🔄 Repetir Promo
              </button>
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 10px;" onclick="loadPromoIntoCreator(${idx})" title="Cargar valores en el creador">
                ✏️ Cargar
              </button>
            </div>
          </div>
        `;
      });
      historyHtml += '</div>';
    }

    const activeTab = window.activePromoTab || 'creator';

    container.innerHTML = `
      <!-- SUBTABS DE NAVEGACIÓN PROMO: ACCESO DIRECTO SIN SCROLLING -->
      <div style="display: flex; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid var(--color-border-dim); padding-bottom: 10px; flex-wrap: wrap;">
        <button type="button" id="promo-subtab-btn-creator" class="btn-stage-preset ${activeTab === 'creator' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'creator' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchPromoSubTab('creator')">
          🚀 Creador & Emisión
        </button>
        <button type="button" id="promo-subtab-btn-qr" class="btn-stage-preset ${activeTab === 'qr' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'qr' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchPromoSubTab('qr')">
          📱 Generador QR Pro
        </button>
        <button type="button" id="promo-subtab-btn-history" class="btn-stage-preset ${activeTab === 'history' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'history' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchPromoSubTab('history')">
          📜 Historial (${(history || []).length})
        </button>
        <button type="button" id="promo-subtab-btn-styles" class="btn-stage-preset ${activeTab === 'styles' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'styles' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchPromoSubTab('styles')">
          🎨 Estilos & Chat Sync
        </button>
      </div>

      <!-- ================================================================= -->
      <!-- PESTAÑA 1: CREADOR Y EMISIÓN DIRECTA (LAYOUT 2 COLUMNAS COMPACTO) -->
      <!-- ================================================================= -->
      <div id="promo-tab-creator" style="display: ${activeTab === 'creator' ? 'block' : 'none'};">
        <!-- BARRA DE PRESETS COMPACTA -->
        <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 240px;">
            <label style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
              ⭐ Preset:
            </label>
            <select id="cfg-promo-preset-select" class="form-select" style="flex: 1; font-weight: 600; font-size: 12px; padding: 4px 8px;" onchange="onPromoPresetChange(this.value)">
              ${presetsOptionsHtml}
            </select>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 10px;" onclick="onPromoPresetChange(document.getElementById('cfg-promo-preset-select').value)" title="Cargar este preset">
              📥 Cargar
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 10px;" onclick="saveCurrentPromoPreset()" title="Guardar cambios">
              💾 Guardar
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="renameCurrentPromoPreset()" title="Renombrar">
              ✏️
            </button>
            <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 4px 10px;" onclick="saveCurrentPromoAsPreset()" title="Guardar como nuevo preset">
              ➕ Nuevo...
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px; color: #EF4444;" onclick="deleteCurrentPromoPreset()" title="Eliminar preset">
              🗑️
            </button>
          </div>
        </div>

        <!-- GRID 2 COLUMNAS: FORMULARIO A LA IZQUIERDA, PREVIEW Y LANZADOR A LA DERECHA -->
        <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: start;">
          <!-- COLUMNA IZQUIERDA: CAMPOS DE LA PROMOCIÓN -->
          <div style="background: rgba(25,29,33,0.7); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px;">
            <!-- Selector de Modo: Streamer vs Personalizada -->
            <div style="display: flex; gap: 6px; margin-bottom: 12px;">
              <button type="button" id="btn-promo-mode-streamer" class="btn-stage-preset ${isStreamerMode ? 'active' : ''}" style="flex: 1; font-size: 11px; padding: 6px 10px; font-weight: 700; border-color: ${isStreamerMode ? '#57D6C4' : 'var(--color-border-dim)'};" onclick="setPromoMode('shoutout')">
                👤 Streamer / Usuario
              </button>
              <button type="button" id="btn-promo-mode-custom" class="btn-stage-preset ${!isStreamerMode ? 'active' : ''}" style="flex: 1; font-size: 11px; padding: 6px 10px; font-weight: 700; border-color: ${!isStreamerMode ? '#FF783F' : 'var(--color-border-dim)'};" onclick="setPromoMode('custom')">
                📦 Promo Personalizada (Maker / Merch / Redes)
              </button>
            </div>

            <input type="hidden" id="cfg-promo-current-mode" value="${isStreamerMode ? 'shoutout' : 'custom'}">

            <!-- MODO A: STREAMER / SHOUTOUT -->
            <div id="box-promo-streamer" style="display: ${isStreamerMode ? 'block' : 'none'};">
              <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 10px; margin-bottom: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Usuario Twitch:</label>
                  <div style="display: flex; gap: 4px;">
                    <input type="text" id="cfg-promo-streamer" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. midudev" value="${activePreset.streamer || 'andorina'}" oninput="updatePromoPipPreview()">
                    <button type="button" class="btn-stage-preset" style="white-space: nowrap; font-size: 11px; padding: 0 8px;" onclick="searchTwitchUserForPromo()" title="Consultar en Twitch">
                      🔍
                    </button>
                  </div>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Nombre a Mostrar:</label>
                  <input type="text" id="cfg-promo-display-name" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. Midudev" value="${activePreset.display_name || activePreset.title || 'Andorina'}" oninput="updatePromoPipPreview()">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Juego / Categoría:</label>
                  <input type="text" id="cfg-promo-game" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. Software Development" value="${activePreset.game || activePreset.subtitle || 'Cacharreo & Directos'}" oninput="updatePromoPipPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Avatar URL (opcional):</label>
                  <input type="text" id="cfg-promo-avatar" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="Dejar vacío para usar Twitch" value="${activePreset.avatar || ''}" oninput="updatePromoPipPreview()">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 0;">Mensaje o Recomendación (opcional):</label>
                  <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 6px; color: #57D6C4;" onclick="openWidgetDevGuideModal('promo')">📖 Tokens & Stream Deck</button>
                </div>
                <input type="text" id="cfg-promo-message" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. ¡Pasaos a saludar a {streamer} jugando a {game}!" value="${activePreset.message || ''}" oninput="updatePromoPipPreview()">
                
                <!-- CHIPS DE TOKENS PROMO -->
                <div style="margin-top: 4px; display: flex; gap: 4px; flex-wrap: wrap;">
                  <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 1px 5px; color: #57D6C4;" onclick="insertPromoToken('{streamer}')" title="Nombre de usuario del canal">{streamer}</button>
                  <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 1px 5px; color: #38BDF8;" onclick="insertPromoToken('{game}')" title="Juego o categoría de Twitch">{game}</button>
                  <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 1px 5px; color: #A78BFA;" onclick="insertPromoToken('{title}')" title="Nombre o título visible">{title}</button>
                </div>
              </div>

              <!-- OPCIÓN CLIP DE TWITCH -->
              <div style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; font-weight: 700; color: #fff;">
                  <input type="checkbox" id="cfg-promo-play-clip" ${activePreset.playClip ? 'checked' : ''} onchange="document.getElementById('box-promo-clip-details').style.display = this.checked ? 'block' : 'none'; updatePromoPipPreview();">
                  <span>🎬 Reproducir Clip destacado de su canal en OBS</span>
                </label>
                <div id="box-promo-clip-details" style="display: ${activePreset.playClip ? 'block' : 'none'}; margin-top: 6px;">
                  <input type="text" id="cfg-promo-clip-url" class="form-input" style="font-size: 11px; padding: 4px 8px;" placeholder="URL/ID Clip específico (o vacío para el más visto de Twitch)" value="${activePreset.clip_url || ''}" oninput="updatePromoPipPreview()">
                </div>
              </div>

              <!-- OPCIÓN MOSTRAR QR -->
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; color: #fff;">
                  <input type="checkbox" id="cfg-promo-show-qr" ${activePreset.showQR !== false ? 'checked' : ''} onchange="updatePromoPipPreview()">
                  <span>📱 Mostrar Código QR escaneable con enlace al canal</span>
                </label>
              </div>
            </div>

            <!-- MODO B: PROMO PERSONALIZADA (MAKER / MERCH / REDES) -->
            <div id="box-promo-custom" style="display: ${!isStreamerMode ? 'block' : 'none'};">
              <div style="display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 10px; margin-bottom: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Título / Asunto:</label>
                  <input type="text" id="cfg-promo-title" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. Pegatinas Holográficas Maker" value="${activePreset.title || 'Pegatinas Holográficas Maker'}" oninput="updatePromoPipPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Distintivo Superior:</label>
                  <input type="text" id="cfg-promo-eyebrow" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. 🛒 TIENDA" value="${activePreset.eyebrow || '🛒 CREACIÓN DEL TALLER'}" oninput="updatePromoPipPreview()">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 10px; margin-bottom: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Descripción o Subtítulo:</label>
                  <input type="text" id="cfg-promo-subtitle" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. Vinilo impermeable" value="${activePreset.subtitle || 'Vinilo troquelado impermeable'}" oninput="updatePromoPipPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Precio / Distintivo:</label>
                  <input type="text" id="cfg-promo-price" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. 3.50€ o ¡GRATIS!" value="${activePreset.price || '3.50€'}" oninput="updatePromoPipPreview()">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Enlace de Destino (Texto / QR):</label>
                  <input type="text" id="cfg-promo-link" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. https://tienda.com" value="${activePreset.link || 'https://twitch.tv/andorina'}" oninput="updatePromoPipPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Imagen / GIF Animado (URL):</label>
                  <input type="text" id="cfg-promo-image-url" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. /media/pegatina.png" value="${activePreset.image_url || activePreset.media_url || ''}" oninput="updatePromoPipPreview()">
                </div>
              </div>

              <!-- OPCIÓN MOSTRAR QR -->
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; color: #fff;">
                  <input type="checkbox" id="cfg-promo-custom-show-qr" ${activePreset.showQR !== false ? 'checked' : ''} onchange="updatePromoPipPreview()">
                  <span>📱 Mostrar Código QR escaneable con este enlace o datos</span>
                </label>
              </div>
            </div>

            <!-- BANNER DE ESTADO DEL QR INTEGRADO -->
            <div style="margin-top: 12px; background: rgba(0,0,0,0.3); border: 1px dashed var(--color-border-dim); border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between;">
              <span id="lbl-promo-current-qr-status" style="font-size: 11px; color: #94A3B8;">
                📱 QR configurado: <strong>Enlace Web</strong> | Logo: <strong>Ninguno</strong>
              </span>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; color: #57D6C4;" onclick="switchPromoSubTab('qr')">
                ⚙️ Cambiar a Contacto / Wi-Fi / Logo ➔
              </button>
            </div>
          </div>

          <!-- COLUMNA DERECHA: VISTA PREVIA Y BOTÓN DE LANZAMIENTO (STICKY) -->
          <div style="display: flex; flex-direction: column; gap: 10px; position: sticky; top: 10px;">
            <!-- VISTA PREVIA EN VIVO -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; font-family: var(--font-tech); font-weight: 700; color: #57D6C4; text-transform: uppercase;">
                  👁️ Vista Previa en Vivo (OBS)
                </span>
                <span style="font-size: 9px; color: var(--color-text-dim);">Actualizado en tiempo real</span>
              </div>
              <div id="promo-live-preview-container" style="background: #0B0D0F; border: 1px dashed var(--color-border-dim); border-radius: 6px; padding: 12px; min-height: 100px; display: flex; justify-content: center; align-items: center; overflow: hidden;">
                <!-- Generado por updatePromoPipPreview() -->
              </div>
            </div>

            <!-- CONTROLES COMPACTOS DE DURACIÓN Y SONIDO -->
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 8px 12px; display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                  <span style="font-size: 11px; font-weight: 600; color: #fff;">Duración:</span>
                  <span id="lbl-promo-duration" style="font-size: 11px; font-family: var(--font-tech); font-weight: 700; color: #57D6C4;">
                    ${Math.round((p.duration || 8000) / 1000)}s
                  </span>
                </div>
                <input type="range" id="cfg-promo-duration" min="4" max="30" value="${Math.round((p.duration || 8000) / 1000)}" oninput="document.getElementById('lbl-promo-duration').textContent = this.value + 's';" style="width: 100%;">
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff;">
                  <input type="checkbox" id="cfg-promo-sound" ${p.soundChime !== false ? 'checked' : ''}>
                  <span>🔔 Sonido</span>
                </label>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 10px; color: var(--color-text-dim);">Acento:</span>
                  <input type="color" id="cfg-promo-color" value="${activePreset.color || '#57D6C4'}" style="height: 22px; width: 34px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 3px;" onchange="updatePromoPipPreview()">
                </div>
              </div>
            </div>

            <!-- BOTÓN PRINCIPAL DE LANZAMIENTO -->
            <button type="button" class="btn-action-primary" style="width: 100%; font-size: 13px; padding: 12px 14px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(87,214,196,0.3); text-align: center;" onclick="launchCurrentPromoToOBS()">
              🚀 ¡LANZAR A PANTALLA (OBS)!
            </button>

            <!-- ACCIONES SECUNDARIAS COMPACTAS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 7px;" onclick="saveCurrentPromoAsPreset()">
                💾 Guardar Preset
              </button>
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 7px; color: #57D6C4; border-color: #57D6C4;" onclick="saveCurrentPromoAsShortcut()">
                ➕ Acción Rápida
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- PESTAÑA 2: GENERADOR QR PRO (CONTACTO, WI-FI, LOGOS, IMAGEN...)  -->
      <!-- ================================================================= -->
      <div id="promo-tab-qr" style="display: ${activeTab === 'qr' ? 'block' : 'none'};">
        <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: start;">
          <!-- COLUMNA IZQUIERDA: CONFIGURACIÓN MULTI-FORMATO Y LOGOTIPO -->
          <div style="background: rgba(25,29,33,0.7); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px;">
            <!-- 1. TIPO DE INFORMACIÓN -->
            <div style="margin-bottom: 12px;">
              <label style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase; margin-bottom: 6px; display: block;">
                1. ¿Qué información llevará el Código QR?
              </label>
              <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button type="button" id="btn-qr-type-url" class="btn-stage-preset active" style="font-size: 11px; padding: 5px 9px; border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);" onclick="setQRDataType('url')">
                  🌐 Enlace Web
                </button>
                <button type="button" id="btn-qr-type-vcard" class="btn-stage-preset" style="font-size: 11px; padding: 5px 9px;" onclick="setQRDataType('vcard')">
                  📇 Contacto (vCard)
                </button>
                <button type="button" id="btn-qr-type-wifi" class="btn-stage-preset" style="font-size: 11px; padding: 5px 9px;" onclick="setQRDataType('wifi')">
                  📶 Conexión Wi-Fi
                </button>
                <button type="button" id="btn-qr-type-email" class="btn-stage-preset" style="font-size: 11px; padding: 5px 9px;" onclick="setQRDataType('email')">
                  ✉️ Correo Email
                </button>
                <button type="button" id="btn-qr-type-text" class="btn-stage-preset" style="font-size: 11px; padding: 5px 9px;" onclick="setQRDataType('text')">
                  💬 Texto / Cupón
                </button>
              </div>
            </div>

            <!-- CONTENEDOR TIPO A: ENLACE WEB -->
            <div id="box-qr-type-url" style="margin-bottom: 12px;">
              <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Enlace Web / Red Social:</label>
              <input type="text" id="cfg-qr-input-url" class="form-input" style="font-size: 12px; padding: 6px 8px; margin-bottom: 6px;" placeholder="https://..." value="https://twitch.tv/andorina" oninput="updateQRGeneratorPreview()">
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 6px;" onclick="setQRPresetUrl('twitch')">🟣 Twitch</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 6px;" onclick="setQRPresetUrl('discord')">💬 Discord</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 6px;" onclick="setQRPresetUrl('shop')">🛒 Tienda</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 6px;" onclick="setQRPresetUrl('youtube')">📺 YouTube</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 6px;" onclick="setQRPresetUrl('instagram')">📸 Instagram</button>
              </div>
            </div>

            <!-- CONTENEDOR TIPO B: CONTACTO VCARD 3.0 -->
            <div id="box-qr-type-vcard" style="display: none; margin-bottom: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
              <div style="font-size: 10px; color: #57D6C4; font-weight: 700; margin-bottom: 8px;">
                📇 TARJETA DE CONTACTO (Abre "Guardar en Contactos" en móviles al escanear):
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Nombre Completo:</label>
                  <input type="text" id="cfg-qr-vcard-name" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="ej. Andorina Maker" value="Andorina" oninput="updateQRGeneratorPreview()">
                </div>
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Teléfono:</label>
                  <input type="text" id="cfg-qr-vcard-phone" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="ej. +34 600 000 000" oninput="updateQRGeneratorPreview()">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Correo Electrónico:</label>
                  <input type="email" id="cfg-qr-vcard-email" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="contacto@taller.com" oninput="updateQRGeneratorPreview()">
                </div>
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Organización / Taller:</label>
                  <input type="text" id="cfg-qr-vcard-org" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Taller Maker" value="Taller de Andorina" oninput="updateQRGeneratorPreview()">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Página Web:</label>
                  <input type="text" id="cfg-qr-vcard-url" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="https://twitch.tv/andorina" value="https://twitch.tv/andorina" oninput="updateQRGeneratorPreview()">
                </div>
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Nota / Bio:</label>
                  <input type="text" id="cfg-qr-vcard-note" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Contacto directo" value="Contacto desde directo Twitch" oninput="updateQRGeneratorPreview()">
                </div>
              </div>
            </div>

            <!-- CONTENEDOR TIPO C: RED WI-FI -->
            <div id="box-qr-type-wifi" style="display: none; margin-bottom: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
              <div style="font-size: 10px; color: #57D6C4; font-weight: 700; margin-bottom: 8px;">
                📶 CONEXIÓN WI-FI RÁPIDA (Conecta el móvil automáticamente a la red):
              </div>
              <div style="display: grid; grid-template-columns: 1.2fr 1fr 0.8fr; gap: 8px; align-items: end;">
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Nombre de Red (SSID):</label>
                  <input type="text" id="cfg-qr-wifi-ssid" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="ej. Taller_Maker_Invitados" value="Taller_Maker" oninput="updateQRGeneratorPreview()">
                </div>
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Contraseña:</label>
                  <input type="text" id="cfg-qr-wifi-pass" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Clave Wi-Fi" oninput="updateQRGeneratorPreview()">
                </div>
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Seguridad:</label>
                  <select id="cfg-qr-wifi-auth" class="form-select" style="font-size: 11px; padding: 4px 6px;" onchange="updateQRGeneratorPreview()">
                    <option value="WPA" selected>WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Sin clave (Abierta)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- CONTENEDOR TIPO D: EMAIL -->
            <div id="box-qr-type-email" style="display: none; margin-bottom: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Enviar a (Email):</label>
                  <input type="email" id="cfg-qr-email-to" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="hola@taller.com" oninput="updateQRGeneratorPreview()">
                </div>
                <div>
                  <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Asunto:</label>
                  <input type="text" id="cfg-qr-email-sub" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Consulta desde el stream" oninput="updateQRGeneratorPreview()">
                </div>
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Mensaje Predefinido:</label>
                <input type="text" id="cfg-qr-email-body" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Hola Andorina, me gustaría preguntar sobre..." oninput="updateQRGeneratorPreview()">
              </div>
            </div>

            <!-- CONTENEDOR TIPO E: TEXTO LIBRE O CUPÓN -->
            <div id="box-qr-type-text" style="display: none; margin-bottom: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
              <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Texto libre / Código de Descuento:</label>
              <textarea id="cfg-qr-text-val" class="form-input" style="font-size: 11px; height: 50px; font-family: monospace;" placeholder="ej. CODIGO-DESCUENTO-15" oninput="updateQRGeneratorPreview()">MAKER-DESCUENTO-2026</textarea>
            </div>

            <!-- 2. LOGOTIPO / IMAGEN CENTRAL (ERROR CORRECTION ECC HIGH 30%) -->
            <div style="border-top: 1px solid var(--color-border-dim); padding-top: 10px; margin-bottom: 12px;">
              <label style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase; margin-bottom: 6px; display: block;">
                2. Logotipo Central (Incrustado con corrección de error ECC-H 30%):
              </label>
              <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px;">
                <button type="button" id="btn-qr-logo-none" class="btn-stage-preset active" style="font-size: 11px; padding: 4px 8px; border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);" onclick="setQRLogo('none')">
                  🚫 Ninguno
                </button>
                <button type="button" id="btn-qr-logo-twitch" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('twitch')">
                  🟣 Twitch
                </button>
                <button type="button" id="btn-qr-logo-discord" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('discord')">
                  💬 Discord
                </button>
                <button type="button" id="btn-qr-logo-instagram" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('instagram')">
                  📸 Instagram
                </button>
                <button type="button" id="btn-qr-logo-youtube" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('youtube')">
                  📺 YouTube
                </button>
                <button type="button" id="btn-qr-logo-maker" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('maker')">
                  ⚡ Maker
                </button>
                <button type="button" id="btn-qr-logo-shop" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('shop')">
                  🛒 Tienda
                </button>
                <button type="button" id="btn-qr-logo-custom" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('custom')">
                  🖼️ Subir Propia...
                </button>
              </div>

              <div id="box-qr-custom-logo" style="display: none; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 8px; margin-top: 6px;">
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">URL de Imagen o Subir archivo:</label>
                <input type="text" id="cfg-qr-custom-logo-url" class="form-input" style="font-size: 11px; padding: 4px 6px; margin-bottom: 4px;" placeholder="https://... o /media/logo.png" oninput="updateQRGeneratorPreview()">
                <input type="file" id="cfg-qr-custom-logo-file" accept="image/*" style="font-size: 10px; color: #94A3B8;" onchange="handleQRLogoUpload(event)">
              </div>
            </div>

            <!-- 3. COLORES Y RESOLUCIÓN -->
            <div style="border-top: 1px solid var(--color-border-dim); padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Color Puntos:</label>
                <input type="color" id="cfg-qr-fg-color" value="#000000" style="width: 100%; height: 28px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateQRGeneratorPreview()">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Color Fondo:</label>
                <input type="color" id="cfg-qr-bg-color" value="#FFFFFF" style="width: 100%; height: 28px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateQRGeneratorPreview()">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Resolución:</label>
                <select id="cfg-qr-size" class="form-select" style="font-size: 11px; padding: 4px 6px;" onchange="updateQRGeneratorPreview()">
                  <option value="250">250px (Pantalla)</option>
                  <option value="500" selected>500px (OBS Alta)</option>
                  <option value="1000">1000px (Impresión)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA: PREVIEW EN CANVAS CON LOGO & BOTONES DE ACCIÓN -->
          <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">
              VISTA PREVIA DEL CÓDIGO QR
            </div>
            <div style="background: #fff; padding: 8px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.6); display: inline-block;">
              <canvas id="qr-gen-canvas" width="220" height="220" style="display: block; width: 170px; height: 170px;"></canvas>
            </div>
            <div id="lbl-qr-result-summary" style="font-size: 10px; color: #94A3B8; max-width: 240px; word-break: break-word;">
              Listo para escanear con la cámara del móvil
            </div>

            <!-- BOTONES DE ACCIÓN DEL QR -->
            <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; margin-top: 4px;">
              <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 8px 12px;" onclick="downloadGeneratedQR()">
                📥 Descargar PNG (Con Logotipo)
              </button>
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 7px 10px;" onclick="copyGeneratedQRLink()">
                📋 Copiar Texto / Contenido
              </button>
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 7px 10px; color: #57D6C4; border-color: #57D6C4;" onclick="applyGeneratedQRToPromo()">
                🚀 Usar en Creador de Promo
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- PESTAÑA 3: HISTORIAL DE EMISIONES Y REPETICIÓN                   -->
      <!-- ================================================================= -->
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

      <!-- ================================================================= -->
      <!-- PESTAÑA 4: ESTILOS VISUALES & SINCRONIZACIÓN CON EL CHAT         -->
      <!-- ================================================================= -->
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

    setTimeout(() => {
      updatePromoPipPreview();
      updateQRGeneratorPreview();
    }, 100);
}

function insertPromoToken(token) {
  const input = document.getElementById('cfg-promo-message') || document.getElementById('cfg-promo-title');
  if (!input) return;
  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  const oldVal = input.value;
  input.value = oldVal.substring(0, start) + ' ' + token + ' ' + oldVal.substring(end);
  input.focus();
  input.setSelectionRange(start + token.length + 2, start + token.length + 2);
  updatePromoPipPreview();
}
window.insertPromoToken = insertPromoToken;

// ====================================================================
// PROMO & SHOUTOUT: VISUAL STUDIO, PRESETS, HISTORIAL & QR PERMANENTE
// ====================================================================

function setPromoMode(mode) {
  const currentModeInput = document.getElementById('cfg-promo-current-mode');
  if (currentModeInput) currentModeInput.value = mode;

  const btnStreamer = document.getElementById('btn-promo-mode-streamer');
  const btnCustom = document.getElementById('btn-promo-mode-custom');
  const boxStreamer = document.getElementById('box-promo-streamer');
  const boxCustom = document.getElementById('box-promo-custom');

  if (mode === 'shoutout') {
    if (btnStreamer) {
      btnStreamer.classList.add('active');
      btnStreamer.style.borderColor = '#57D6C4';
    }
    if (btnCustom) {
      btnCustom.classList.remove('active');
      btnCustom.style.borderColor = 'var(--color-border-dim)';
    }
    if (boxStreamer) boxStreamer.style.display = 'block';
    if (boxCustom) boxCustom.style.display = 'none';
  } else {
    if (btnStreamer) {
      btnStreamer.classList.remove('active');
      btnStreamer.style.borderColor = 'var(--color-border-dim)';
    }
    if (btnCustom) {
      btnCustom.classList.add('active');
      btnCustom.style.borderColor = '#FF783F';
    }
    if (boxStreamer) boxStreamer.style.display = 'none';
    if (boxCustom) boxCustom.style.display = 'block';
  }

  updatePromoPipPreview();
}

async function searchTwitchUserForPromo() {
  const input = document.getElementById('cfg-promo-streamer');
  const streamer = (input?.value || '').trim().toLowerCase().replace(/^@/, '');
  if (!streamer) {
    alert('Introduce un nombre de usuario de Twitch para buscar.');
    return;
  }

  const nameInput = document.getElementById('cfg-promo-display-name');
  if (nameInput) {
    nameInput.value = streamer.charAt(0).toUpperCase() + streamer.slice(1);
  }
  updatePromoPipPreview();
  alert(`✓ Preparado para @${streamer}. Al emitir la promo se obtendrán su avatar oficial y categoría de Twitch.`);
}

function updatePromoPipPreview() {
  const container = document.getElementById('promo-live-preview-container');
  if (!container) return;

  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  const color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';
  const shape = document.getElementById('cfg-promo-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-promo-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-promo-bgcolor')?.value || '#191D21';
  const bgGrad = document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon';
  const glow = parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45;
  const font = document.getElementById('cfg-promo-font')?.value || 'outfit';

  const fontFamilies = {
    outfit: "'Outfit', sans-serif",
    inter: "'Inter', sans-serif",
    rajdhani: "'Rajdhani', sans-serif",
    orbitron: "'Orbitron', sans-serif",
    press_start: "'Press Start 2P', monospace",
    jetbrains_mono: "'JetBrains Mono', monospace"
  };

  let title = '';
  let subtitle = '';
  let eyebrow = '';
  let price = '';
  let link = '';
  let showQr = true;
  let avatarUrl = '';
  let imageUrl = '';
  let message = '';
  let playClip = false;

  if (mode === 'shoutout') {
    const streamer = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    title = document.getElementById('cfg-promo-display-name')?.value.trim() || streamer;
    subtitle = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    eyebrow = '📢 CANAL RECOMENDADO';
    link = `twitch.tv/${streamer.toLowerCase().replace(/^@/, '')}`;
    showQr = document.getElementById('cfg-promo-show-qr')?.checked !== false;
    avatarUrl = document.getElementById('cfg-promo-avatar')?.value.trim() || 'https://static-cdn.jtvnw.net/jtv_user_pictures/e33e6764-4631-48b0-9f1d-4cc6e5afc6fd-profile_image-300x300.png';
    message = document.getElementById('cfg-promo-message')?.value.trim() || '';
    playClip = document.getElementById('cfg-promo-play-clip')?.checked === true;
  } else {
    title = document.getElementById('cfg-promo-title')?.value.trim() || 'Pegatinas Holográficas Maker';
    eyebrow = document.getElementById('cfg-promo-eyebrow')?.value.trim() || '🛒 CREACIÓN DEL TALLER';
    subtitle = document.getElementById('cfg-promo-subtitle')?.value.trim() || 'Vinilo troquelado impermeable';
    price = document.getElementById('cfg-promo-price')?.value.trim() || '';
    link = document.getElementById('cfg-promo-link')?.value.trim() || 'https://twitch.tv/andorina';
    showQr = document.getElementById('cfg-promo-custom-show-qr')?.checked !== false;
    imageUrl = document.getElementById('cfg-promo-image-url')?.value.trim() || '';
  }

  // Style properties
  let bgCss = 'background: rgba(25, 29, 33, 0.94);';
  if (bgType === 'solid') bgCss = `background: ${bgColor};`;
  else if (bgType === 'gradient') bgCss = `background: linear-gradient(135deg, ${bgColor}, ${bgGrad});`;
  else if (bgType === 'transparent') bgCss = 'background: transparent;';

  let borderCss = `border-left: 4px solid ${color}; border: 1px solid rgba(255,255,255,0.1);`;
  if (borderStyle === 'full_neon') borderCss = `border: 2px solid ${color}; box-shadow: 0 0 ${glow}px ${color}66;`;
  else if (borderStyle === 'left_neon') borderCss = `border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid ${color}; box-shadow: -4px 0 ${glow}px ${color}55;`;
  else if (borderStyle === 'subtle') borderCss = `border: 1px solid rgba(255,255,255,0.15);`;
  else if (borderStyle === 'none') borderCss = 'border: none;';

  let shapeCss = 'border-radius: 12px;';
  if (shape === 'scifi') shapeCss = 'clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px); border-radius: 0;';
  else if (shape === 'arcade') shapeCss = 'border: 3px solid #FFFFFF !important; box-shadow: 4px 4px 0px rgba(0,0,0,0.85); border-radius: 0;';
  else if (shape === 'pill') shapeCss = 'border-radius: 9999px;';
  else if (shape === 'slant') shapeCss = 'transform: skewX(-4deg);';
  else if (shape === 'soft_card') shapeCss = 'border-radius: 20px;';

  const activeQrPayload = window.promoActiveQRPayload || (mode === 'shoutout' ? `https://twitch.tv/${(document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina').toLowerCase().replace(/^@/, '')}` : (link || 'https://twitch.tv/andorina'));
  const activeQrType = window.promoActiveQRType || 'url';
  const activeQrLogo = window.promoActiveQRLogo || 'none';
  let qrLabelText = '📱 ESCANEAR';
  if (activeQrType === 'vcard') qrLabelText = '📇 CONTACTO';
  else if (activeQrType === 'wifi') qrLabelText = '📶 WI-FI';
  else if (activeQrType === 'email') qrLabelText = '✉️ CORREO';

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&ecc=H&margin=0&data=${encodeURIComponent(activeQrPayload || 'https://twitch.tv/andorina')}`;

  const qrCenterBadgeHtml = (activeQrLogo && activeQrLogo !== 'none' && window.QR_LOGO_SVGS && window.QR_LOGO_SVGS[activeQrLogo]) ? `
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 18px; height: 18px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 3px rgba(0,0,0,0.5); overflow: hidden; z-index: 2;">
      <img src="${window.QR_LOGO_SVGS[activeQrLogo]}" alt="Logo" style="width: 14px; height: 14px; object-fit: contain; display: block;">
    </div>
  ` : '';

  // Actualizar banner de estado QR en la pestaña Creador
  const qrStatusLbl = document.getElementById('lbl-promo-current-qr-status');
  if (qrStatusLbl) {
    const typeNames = { url: 'Enlace Web', vcard: 'Contacto vCard', wifi: 'Red Wi-Fi', email: 'Email', text: 'Texto/Cupón' };
    qrStatusLbl.innerHTML = `📱 QR configurado: <strong>${typeNames[activeQrType] || 'Enlace Web'}</strong> | Logo: <strong>${activeQrLogo.toUpperCase()}</strong>`;
  }

  container.innerHTML = `
    <div style="width: 100%; max-width: 600px; ${bgCss} ${borderCss} ${shapeCss} font-family: ${fontFamilies[font] || fontFamilies['outfit']}; padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; backdrop-filter: blur(12px);">
      <div style="display: flex; align-items: center; gap: 14px; width: 100%;">
        <!-- Thumbnail -->
        ${imageUrl ? `
          <div style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 2px solid ${color}; flex-shrink: 0; background: #000;">
            <img src="${imageUrl}" alt="Media" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='https://static-cdn.jtvnw.net/jtv_user_pictures/e33e6764-4631-48b0-9f1d-4cc6e5afc6fd-profile_image-300x300.png'">
          </div>
        ` : `
          <div style="position: relative; width: 64px; height: 64px; flex-shrink: 0;">
            <div style="position: absolute; inset: -3px; border: 1.5px dashed ${color}; border-radius: 50%;"></div>
            <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid ${color}; box-shadow: 0 0 12px ${color}66; background: #191D21; display: block;">
          </div>
        `}

        <!-- Info -->
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; color: ${color}; letter-spacing: 1px; text-transform: uppercase;">
            <span>${eyebrow}</span>
            ${price ? `<span style="background: rgba(245,158,11,0.2); border: 1px solid #F59E0B; color: #FBBF24; padding: 1px 6px; border-radius: 10px; font-size: 9px;">${price}</span>` : ''}
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #fff; line-height: 1.2; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${title}
          </div>
          <div style="font-size: 11px; color: #FF783F; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${subtitle}
          </div>
          ${message ? `<div style="font-size: 10px; color: #CBD5E1; font-style: italic; background: rgba(255,255,255,0.06); border-left: 2px solid ${color}; padding: 2px 6px; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">"${message}"</div>` : ''}
          <div style="font-size: 10px; color: #94A3B8; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${link}
          </div>
        </div>

        <!-- QR Box -->
        ${showQr ? `
          <div style="width: 64px; height: 64px; background: #fff; border-radius: 6px; padding: 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; flex-shrink: 0; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
            <img src="${qrSrc}" alt="QR" style="width: 100%; height: 100%; object-fit: contain; display: block;">
            ${qrCenterBadgeHtml}
            <span style="position: absolute; bottom: -14px; font-size: 8px; font-weight: 800; color: ${color}; letter-spacing: 0.5px; white-space: nowrap;">${qrLabelText}</span>
          </div>
        ` : ''}
      </div>

      ${playClip ? `
        <div style="border-top: 1px dashed ${color}66; padding-top: 6px; font-size: 10px; font-weight: 800; color: ${color}; display: flex; align-items: center; justify-content: space-between;">
          <span>🎬 REPRODUCIRÁ CLIP DESTACADO EN DIRECTO</span>
          <span style="font-size: 9px; opacity: 0.8;">TWITCH EMBED</span>
        </div>
      ` : ''}
    </div>
  `;

  // También actualizar iframe live PiP si está abierto
  const iframe = document.getElementById('miniapp-live-iframe');
  if (iframe && iframe.contentWindow && iframe.contentWindow.showShoutout) {
    iframe.contentWindow.showShoutout({
      promo_type: mode,
      title,
      display_name: title,
      streamer: title,
      subtitle,
      game: subtitle,
      message,
      eyebrow,
      price,
      link,
      qr_data: activeQrPayload,
      qr_type: activeQrType,
      qr_logo: activeQrLogo,
      qr_label: qrLabelText,
      show_qr: showQr,
      avatar: avatarUrl,
      image_url: imageUrl,
      play_clip: playClip,
      color,
      styles: {
        shape,
        bgType,
        bgColor,
        bgGradient: bgGrad,
        borderStyle,
        borderColor: color,
        glowIntensity: glow,
        fontFamily: font
      },
      duration: 10000,
      soundChime: false
    });
  }
}

async function launchCurrentPromoToOBS() {
  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  const durationSec = parseInt(document.getElementById('cfg-promo-duration')?.value, 10) || 8;
  const soundChime = document.getElementById('cfg-promo-sound')?.checked !== false;
  const color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';
  const sameAsChat = document.getElementById('cfg-promo-same-as-chat')?.checked === true;

  const shape = document.getElementById('cfg-promo-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-promo-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-promo-bgcolor')?.value || '#191D21';
  const bgGrad = document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon';
  const glow = parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45;
  const font = document.getElementById('cfg-promo-font')?.value || 'outfit';
  const anim = document.getElementById('cfg-promo-anim')?.value || 'slide_up';
  const customCss = document.getElementById('cfg-promo-custom-css')?.value || '';

  let payload = {
    type: mode,
    color,
    duration: durationSec * 1000,
    soundChime,
    animation: anim,
    inherit_chat_styles: sameAsChat,
    styles: {
      shape,
      bgType,
      bgColor,
      bgGradient: bgGrad,
      borderStyle,
      borderColor: color,
      glowIntensity: glow,
      fontFamily: font,
      animation: anim,
      customCSS: customCss
    }
  };

  if (mode === 'shoutout') {
    const streamer = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    const displayName = document.getElementById('cfg-promo-display-name')?.value.trim() || streamer;
    const game = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    const avatar = document.getElementById('cfg-promo-avatar')?.value.trim() || '';
    const message = document.getElementById('cfg-promo-message')?.value.trim() || '';
    const playClip = document.getElementById('cfg-promo-play-clip')?.checked === true;
    const clipUrl = document.getElementById('cfg-promo-clip-url')?.value.trim() || '';
    const showQr = document.getElementById('cfg-promo-show-qr')?.checked !== false;

    payload.streamer = streamer;
    payload.display_name = displayName;
    payload.title = displayName;
    payload.game = game;
    payload.subtitle = game;
    payload.avatar = avatar;
    payload.message = message;
    payload.play_clip = playClip;
    payload.clip_url = clipUrl;
    payload.link = `https://twitch.tv/${streamer.toLowerCase().replace(/^@/, '')}`;
    payload.show_qr = showQr;
  } else {
    const title = document.getElementById('cfg-promo-title')?.value.trim() || 'Pegatinas Holográficas Maker';
    const eyebrow = document.getElementById('cfg-promo-eyebrow')?.value.trim() || '🛒 CREACIÓN DEL TALLER';
    const subtitle = document.getElementById('cfg-promo-subtitle')?.value.trim() || 'Vinilo troquelado impermeable';
    const price = document.getElementById('cfg-promo-price')?.value.trim() || '';
    const link = document.getElementById('cfg-promo-link')?.value.trim() || 'https://twitch.tv/andorina';
    const imageUrl = document.getElementById('cfg-promo-image-url')?.value.trim() || '';
    const showQr = document.getElementById('cfg-promo-custom-show-qr')?.checked !== false;

    payload.title = title;
    payload.display_name = title;
    payload.eyebrow = eyebrow;
    payload.subtitle = subtitle;
    payload.price = price;
    payload.link = link;
    payload.image_url = imageUrl;
    payload.show_qr = showQr;
  }

  // Integrar datos avanzados de QR
  payload.qr_data = window.promoActiveQRPayload || payload.link;
  payload.qr_type = window.promoActiveQRType || 'url';
  payload.qr_logo = window.promoActiveQRLogo || 'none';
  if (payload.qr_type === 'vcard') payload.qr_label = '📇 GUARDAR CONTACTO';
  else if (payload.qr_type === 'wifi') payload.qr_label = '📶 CONECTAR WI-FI';
  else if (payload.qr_type === 'email') payload.qr_label = '✉️ ENVIAR CORREO';
  else payload.qr_label = '📱 ESCANEAR';

  // Registrar en historial local
  if (!cachedWidgetsConfig.promo) cachedWidgetsConfig.promo = {};
  if (!cachedWidgetsConfig.promo.history) cachedWidgetsConfig.promo.history = [];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  const histEntry = Object.assign({ timestamp: timeStr }, payload);
  cachedWidgetsConfig.promo.history.unshift(histEntry);
  if (cachedWidgetsConfig.promo.history.length > 25) cachedWidgetsConfig.promo.history.pop();
  window.cachedPromoHistory = cachedWidgetsConfig.promo.history;

  // Emitir por API y WebSocket
  await API.triggerWidgetAction('promo', 'promote', payload);

  // Refrescar panel de historial
  renderMiniAppControls();

  alert(`🚀 ¡Promoción "${payload.title || payload.streamer}" lanzada a OBS Studio durante ${durationSec}s!`);
}

async function repeatPromoFromHistory(idx) {
  const history = cachedWidgetsConfig?.promo?.history || window.cachedPromoHistory || [];
  const item = history[idx];
  if (!item) return;

  await API.triggerWidgetAction('promo', 'promote', Object.assign({}, item, {
    duration: (parseInt(document.getElementById('cfg-promo-duration')?.value, 10) || 8) * 1000
  }));

  alert(`🔄 ¡Promoción "${item.title || item.display_name || item.streamer}" reemitida a OBS Studio!`);
}

function loadPromoIntoCreator(idx) {
  const history = cachedWidgetsConfig?.promo?.history || window.cachedPromoHistory || [];
  const item = history[idx];
  if (!item) return;

  const mode = (item.type === 'product' || item.promo_type === 'product' || item.type === 'custom' || item.promo_type === 'custom') ? 'custom' : 'shoutout';
  setPromoMode(mode);

  if (mode === 'shoutout') {
    const sInput = document.getElementById('cfg-promo-streamer');
    const dInput = document.getElementById('cfg-promo-display-name');
    const gInput = document.getElementById('cfg-promo-game');
    const aInput = document.getElementById('cfg-promo-avatar');
    const mInput = document.getElementById('cfg-promo-message');
    const qrInput = document.getElementById('cfg-promo-show-qr');

    if (sInput) sInput.value = item.streamer || item.title || '';
    if (dInput) dInput.value = item.display_name || item.title || '';
    if (gInput) gInput.value = item.game || item.subtitle || '';
    if (aInput) aInput.value = item.avatar || '';
    if (mInput) mInput.value = item.message || '';
    if (qrInput) qrInput.checked = item.show_qr !== false;
  } else {
    const tInput = document.getElementById('cfg-promo-title');
    const eInput = document.getElementById('cfg-promo-eyebrow');
    const sInput = document.getElementById('cfg-promo-subtitle');
    const pInput = document.getElementById('cfg-promo-price');
    const lInput = document.getElementById('cfg-promo-link');
    const iInput = document.getElementById('cfg-promo-image-url');
    const qrInput = document.getElementById('cfg-promo-custom-show-qr');

    if (tInput) tInput.value = item.title || item.display_name || '';
    if (eInput) eInput.value = item.eyebrow || '🛒 CREACIÓN DEL TALLER';
    if (sInput) sInput.value = item.subtitle || '';
    if (pInput) pInput.value = item.price || '';
    if (lInput) lInput.value = item.link || '';
    if (iInput) iInput.value = item.image_url || '';
    if (qrInput) qrInput.checked = item.show_qr !== false;
  }

  if (item.color) {
    const cInput = document.getElementById('cfg-promo-color');
    if (cInput) cInput.value = item.color;
  }

  // Restaurar datos de QR avanzado si existen
  window.promoActiveQRPayload = item.qr_data || item.link || '';
  window.promoActiveQRType = item.qr_type || 'url';
  window.promoActiveQRLogo = item.qr_logo || 'none';

  switchPromoSubTab('creator');
  updatePromoPipPreview();
  const drawer = document.getElementById('widget-miniapp-drawer');
  if (drawer) drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function clearPromoHistory() {
  if (!confirm('¿Deseas vaciar el historial de promociones de esta sesión?')) return;
  if (cachedWidgetsConfig?.promo) {
    cachedWidgetsConfig.promo.history = [];
  }
  window.cachedPromoHistory = [];
  try {
    await API.triggerWidgetAction('promo', 'clear_history', {});
  } catch (e) {}
  renderMiniAppControls();
}

function onPromoPresetChange(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  const presets = cachedWidgetsConfig.promo.presets || [];
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;

  cachedWidgetsConfig.promo.activePreset = presetId;
  const mode = (preset.type === 'product' || preset.type === 'custom' || preset.type === 'social') ? 'custom' : 'shoutout';
  setPromoMode(mode);

  if (mode === 'shoutout') {
    const sInput = document.getElementById('cfg-promo-streamer');
    const dInput = document.getElementById('cfg-promo-display-name');
    const gInput = document.getElementById('cfg-promo-game');
    const aInput = document.getElementById('cfg-promo-avatar');
    const mInput = document.getElementById('cfg-promo-message');
    const clipChk = document.getElementById('cfg-promo-play-clip');
    const clipUrl = document.getElementById('cfg-promo-clip-url');
    const qrChk = document.getElementById('cfg-promo-show-qr');

    if (sInput) sInput.value = preset.streamer || 'andorina';
    if (dInput) dInput.value = preset.display_name || preset.title || 'Andorina';
    if (gInput) gInput.value = preset.game || preset.subtitle || 'Cacharreo & Directos';
    if (aInput) aInput.value = preset.avatar || '';
    if (mInput) mInput.value = preset.message || '';
    if (clipChk) clipChk.checked = preset.playClip === true;
    if (clipUrl) clipUrl.value = preset.clip_url || '';
    if (qrChk) qrChk.checked = preset.showQR !== false;
    const clipBox = document.getElementById('box-promo-clip-details');
    if (clipBox) clipBox.style.display = preset.playClip ? 'block' : 'none';
  } else {
    const tInput = document.getElementById('cfg-promo-title');
    const eInput = document.getElementById('cfg-promo-eyebrow');
    const sInput = document.getElementById('cfg-promo-subtitle');
    const pInput = document.getElementById('cfg-promo-price');
    const lInput = document.getElementById('cfg-promo-link');
    const iInput = document.getElementById('cfg-promo-image-url');
    const qrChk = document.getElementById('cfg-promo-custom-show-qr');

    if (tInput) tInput.value = preset.title || '';
    if (eInput) eInput.value = preset.eyebrow || '🛒 CREACIÓN DEL TALLER';
    if (sInput) sInput.value = preset.subtitle || '';
    if (pInput) pInput.value = preset.price || '';
    if (lInput) lInput.value = preset.link || '';
    if (iInput) iInput.value = preset.image_url || preset.media_url || '';
    if (qrChk) qrChk.checked = preset.showQR !== false;
  }

  // Estilos
  if (!cachedWidgetsConfig.promo.styles) cachedWidgetsConfig.promo.styles = {};
  const s = cachedWidgetsConfig.promo.styles;
  s.shape = preset.shape || 'rounded';
  s.bgType = preset.bgType || 'glass';
  s.bgColor = preset.bgColor || '#191D21';
  s.bgGradient = preset.bgGradient || '#0B0D0F';
  s.borderStyle = preset.borderStyle || 'left_neon';
  s.borderColor = preset.borderColor || preset.color || '#57D6C4';
  s.glowIntensity = preset.glowIntensity !== undefined ? preset.glowIntensity : 45;
  s.fontFamily = preset.fontFamily || 'outfit';
  s.animation = preset.animation || 'slide_up';
  s.customCSS = preset.customCSS || '';

  const shapeSel = document.getElementById('cfg-promo-shape');
  const bgtypeSel = document.getElementById('cfg-promo-bgtype');
  const bgcolorInput = document.getElementById('cfg-promo-bgcolor');
  const bggradInput = document.getElementById('cfg-promo-bggrad');
  const borderSel = document.getElementById('cfg-promo-borderstyle');
  const colorInput = document.getElementById('cfg-promo-color');
  const borderInput = document.getElementById('cfg-promo-border');
  const glowInput = document.getElementById('cfg-promo-glow');
  const fontSel = document.getElementById('cfg-promo-font');
  const animSel = document.getElementById('cfg-promo-anim');
  const cssInput = document.getElementById('cfg-promo-custom-css');

  if (shapeSel) shapeSel.value = s.shape;
  if (bgtypeSel) bgtypeSel.value = s.bgType;
  if (bgcolorInput) bgcolorInput.value = s.bgColor;
  if (bggradInput) bggradInput.value = s.bgGradient;
  if (borderSel) borderSel.value = s.borderStyle;
  if (colorInput) colorInput.value = s.borderColor;
  if (borderInput) borderInput.value = s.borderColor;
  if (glowInput) {
    glowInput.value = s.glowIntensity;
    const lbl = document.getElementById('lbl-promo-glow');
    if (lbl) lbl.textContent = s.glowIntensity + '%';
  }
  if (fontSel) fontSel.value = s.fontFamily;
  if (animSel) animSel.value = s.animation;
  if (cssInput) cssInput.value = s.customCSS;

  updatePromoPipPreview();
}

async function saveCurrentPromoPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  const activePresetId = cachedWidgetsConfig.promo.activePreset || 'streamer_neon';
  const presets = cachedWidgetsConfig.promo.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  preset.type = mode;

  if (mode === 'shoutout') {
    preset.streamer = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    preset.display_name = document.getElementById('cfg-promo-display-name')?.value.trim() || preset.streamer;
    preset.game = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    preset.avatar = document.getElementById('cfg-promo-avatar')?.value.trim() || '';
    preset.message = document.getElementById('cfg-promo-message')?.value.trim() || '';
    preset.playClip = document.getElementById('cfg-promo-play-clip')?.checked === true;
    preset.clip_url = document.getElementById('cfg-promo-clip-url')?.value.trim() || '';
    preset.showQR = document.getElementById('cfg-promo-show-qr')?.checked !== false;
  } else {
    preset.title = document.getElementById('cfg-promo-title')?.value.trim() || '';
    preset.eyebrow = document.getElementById('cfg-promo-eyebrow')?.value.trim() || '🛒 CREACIÓN DEL TALLER';
    preset.subtitle = document.getElementById('cfg-promo-subtitle')?.value.trim() || '';
    preset.price = document.getElementById('cfg-promo-price')?.value.trim() || '';
    preset.link = document.getElementById('cfg-promo-link')?.value.trim() || '';
    preset.image_url = document.getElementById('cfg-promo-image-url')?.value.trim() || '';
    preset.showQR = document.getElementById('cfg-promo-custom-show-qr')?.checked !== false;
  }

  preset.color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';
  preset.shape = document.getElementById('cfg-promo-shape')?.value || 'rounded';
  preset.bgType = document.getElementById('cfg-promo-bgtype')?.value || 'glass';
  preset.bgColor = document.getElementById('cfg-promo-bgcolor')?.value || '#191D21';
  preset.bgGradient = document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F';
  preset.borderStyle = document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon';
  preset.borderColor = document.getElementById('cfg-promo-border')?.value || preset.color;
  preset.glowIntensity = parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45;
  preset.fontFamily = document.getElementById('cfg-promo-font')?.value || 'outfit';
  preset.animation = document.getElementById('cfg-promo-anim')?.value || 'slide_up';
  preset.customCSS = document.getElementById('cfg-promo-custom-css')?.value || '';

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updatePromoPipPreview();
  alert(`✓ ¡Cambios guardados en el preset "${preset.name}"!`);
}

async function renameCurrentPromoPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  const activePresetId = cachedWidgetsConfig.promo.activePreset || 'streamer_neon';
  const presets = cachedWidgetsConfig.promo.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  const newName = prompt('Nuevo nombre para el preset:', preset.name);
  if (!newName || !newName.trim()) return;

  preset.name = newName.trim();
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert(`✓ Preset renombrado a "${preset.name}".`);
}

async function saveCurrentPromoAsPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;

  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  const defaultName = mode === 'shoutout' ? `📢 Promo ${document.getElementById('cfg-promo-display-name')?.value || 'Canal'}` : `📦 ${document.getElementById('cfg-promo-title')?.value || 'Producto'}`;
  const name = prompt('Nombre para este nuevo preset de promoción:', defaultName);
  if (!name || !name.trim()) return;

  const newId = 'preset_promo_' + Date.now();
  const color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';

  const newPreset = {
    id: newId,
    name: name.trim(),
    isBuiltin: false,
    type: mode,
    color,
    shape: document.getElementById('cfg-promo-shape')?.value || 'rounded',
    bgType: document.getElementById('cfg-promo-bgtype')?.value || 'glass',
    bgColor: document.getElementById('cfg-promo-bgcolor')?.value || '#191D21',
    bgGradient: document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F',
    borderStyle: document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon',
    borderColor: document.getElementById('cfg-promo-border')?.value || color,
    glowIntensity: parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45,
    fontFamily: document.getElementById('cfg-promo-font')?.value || 'outfit',
    animation: document.getElementById('cfg-promo-anim')?.value || 'slide_up',
    customCSS: document.getElementById('cfg-promo-custom-css')?.value || '',
    showQR: mode === 'shoutout' ? document.getElementById('cfg-promo-show-qr')?.checked !== false : document.getElementById('cfg-promo-custom-show-qr')?.checked !== false
  };

  if (mode === 'shoutout') {
    newPreset.streamer = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    newPreset.display_name = document.getElementById('cfg-promo-display-name')?.value.trim() || newPreset.streamer;
    newPreset.game = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    newPreset.avatar = document.getElementById('cfg-promo-avatar')?.value.trim() || '';
    newPreset.message = document.getElementById('cfg-promo-message')?.value.trim() || '';
    newPreset.playClip = document.getElementById('cfg-promo-play-clip')?.checked === true;
    newPreset.clip_url = document.getElementById('cfg-promo-clip-url')?.value.trim() || '';
  } else {
    newPreset.title = document.getElementById('cfg-promo-title')?.value.trim() || '';
    newPreset.eyebrow = document.getElementById('cfg-promo-eyebrow')?.value.trim() || '🛒 CREACIÓN DEL TALLER';
    newPreset.subtitle = document.getElementById('cfg-promo-subtitle')?.value.trim() || '';
    newPreset.price = document.getElementById('cfg-promo-price')?.value.trim() || '';
    newPreset.link = document.getElementById('cfg-promo-link')?.value.trim() || '';
    newPreset.image_url = document.getElementById('cfg-promo-image-url')?.value.trim() || '';
  }

  if (!cachedWidgetsConfig.promo.presets) cachedWidgetsConfig.promo.presets = [];
  cachedWidgetsConfig.promo.presets.push(newPreset);
  cachedWidgetsConfig.promo.activePreset = newId;

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert(`✓ ¡Nuevo preset de promo "${name.trim()}" guardado con éxito!`);
}

async function deleteCurrentPromoPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  const activePresetId = cachedWidgetsConfig.promo.activePreset || 'streamer_neon';
  const presets = cachedWidgetsConfig.promo.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  if (preset.isBuiltin) {
    alert('Los presets predefinidos del sistema no se pueden eliminar.');
    return;
  }

  if (!confirm(`¿Eliminar definitivamente el preset "${preset.name}"?`)) return;

  cachedWidgetsConfig.promo.presets = presets.filter(p => p.id !== activePresetId);
  cachedWidgetsConfig.promo.activePreset = cachedWidgetsConfig.promo.presets[0]?.id || 'streamer_neon';

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert('✓ Preset eliminado.');
}

async function saveCurrentPromoAsShortcut() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;

  const mode = document.getElementById('cfg-promo-current-mode')?.value || 'shoutout';
  const color = document.getElementById('cfg-promo-color')?.value || '#57D6C4';

  let labelVal = '';
  let titleVal = '';
  let subtitleVal = '';
  let priceVal = '';
  let linkVal = '';
  let streamerVal = '';

  if (mode === 'shoutout') {
    streamerVal = document.getElementById('cfg-promo-streamer')?.value.trim() || 'andorina';
    labelVal = `📢 SO @${streamerVal}`;
    titleVal = document.getElementById('cfg-promo-display-name')?.value.trim() || streamerVal;
    subtitleVal = document.getElementById('cfg-promo-game')?.value.trim() || 'Cacharreo & Directos';
    linkVal = `https://twitch.tv/${streamerVal.toLowerCase()}`;
  } else {
    titleVal = document.getElementById('cfg-promo-title')?.value.trim() || 'Producto';
    labelVal = `🛒 ${titleVal}`;
    subtitleVal = document.getElementById('cfg-promo-subtitle')?.value.trim() || '';
    priceVal = document.getElementById('cfg-promo-price')?.value.trim() || '';
    linkVal = document.getElementById('cfg-promo-link')?.value.trim() || '';
  }

  const promptLabel = prompt('Nombre para este botón de acceso rápido:', labelVal);
  if (!promptLabel || !promptLabel.trim()) return;

  const newSc = {
    id: 'sc_promo_' + Date.now(),
    label: promptLabel.trim(),
    type: mode,
    title: titleVal,
    subtitle: subtitleVal,
    streamer: streamerVal,
    price: priceVal,
    link: linkVal,
    showQR: true,
    color,
    pinned: true
  };

  if (!cachedWidgetsConfig.promo.shortcuts) cachedWidgetsConfig.promo.shortcuts = [];
  cachedWidgetsConfig.promo.shortcuts.push(newSc);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();

  alert(`✓ ¡Acción Rápida "${promptLabel.trim()}" creada con éxito! Visible en el panel exterior.`);
}

async function togglePromoSameStyleAsChat(checked) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.promo) return;
  cachedWidgetsConfig.promo.sameStyleAsChat = checked;

  const controlsWrapper = document.getElementById('promo-style-controls-wrapper');
  const badge = document.getElementById('badge-promo-chat-synced');

  if (controlsWrapper) {
    controlsWrapper.style.opacity = checked ? '0.45' : '1';
    controlsWrapper.style.pointerEvents = checked ? 'none' : 'auto';
  }
  if (badge) {
    badge.style.display = checked ? 'inline-block' : 'none';
  }

  if (checked) {
    await copyStylesFromChatToPromo(true);
  } else {
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    updatePromoPipPreview();
  }
}

async function copyStylesFromChatToPromo(showAlert = true) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat || !cachedWidgetsConfig.promo) return;
  const chatStyles = cachedWidgetsConfig.chat.styles || {};

  if (!cachedWidgetsConfig.promo.styles) cachedWidgetsConfig.promo.styles = {};
  const ps = cachedWidgetsConfig.promo.styles;

  ps.shape = chatStyles.shape || 'rounded';
  ps.bgType = chatStyles.bgType || 'glass';
  ps.bgColor = chatStyles.bgColor || '#191D21';
  ps.bgGradient = chatStyles.bgGradient || '#0B0D0F';
  ps.borderStyle = chatStyles.borderStyle || 'left_neon';
  ps.borderWidth = chatStyles.borderWidth !== undefined ? chatStyles.borderWidth : 4;
  ps.borderColor = chatStyles.borderColor || '#57D6C4';
  ps.accentColor = ps.borderColor;
  ps.glowIntensity = chatStyles.glowIntensity !== undefined ? chatStyles.glowIntensity : 45;
  ps.fontFamily = chatStyles.fontFamily || 'outfit';
  ps.customCSS = chatStyles.customCSS || '';

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  updatePromoPipPreview();

  if (showAlert) {
    alert(`✓ ¡Estilos de Chat sincronizados con la Promoción!\nSilueta: ${ps.shape} | Fondo: ${ps.bgType} | Color: ${ps.borderColor}`);
  }
}

// ----------------------------------------------------------------------
// GESTIÓN DE SUBPESTAÑAS DE PROMO (LAYOUT SIN SCROLLING)
// ----------------------------------------------------------------------
window.activePromoTab = window.activePromoTab || 'creator';

function switchPromoSubTab(tab) {
  window.activePromoTab = tab;
  const tabs = ['creator', 'qr', 'history', 'styles'];
  tabs.forEach(t => {
    const pane = document.getElementById(`promo-tab-${t}`);
    const btn = document.getElementById(`promo-subtab-btn-${t}`);
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

  if (tab === 'creator') {
    updatePromoPipPreview();
  } else if (tab === 'qr') {
    updateQRGeneratorPreview();
  }
}

// ----------------------------------------------------------------------
// GENERADOR DE CÓDIGOS QR PRO (MULTI-FORMATO Y LOGOTIPOS)
// ----------------------------------------------------------------------
window.qrSelectedType = window.qrSelectedType || 'url';
window.qrSelectedLogo = window.qrSelectedLogo || 'none';
window.qrCustomLogoData = window.qrCustomLogoData || '';

window.QR_LOGO_SVGS = {
  twitch: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%239146FF"/><path fill="%23FFFFFF" d="M6.5 4L5 7.5v11h3.5v2h2.5l2-2h2.5L19 15V4H6.5zm11 10l-2 2h-3l-2 2v-2H8.5V5.5h9V14zM11 8h1.5v4H11V8zm4 0h1.5v4H15V8z"/></svg>',
  discord: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%235865F2"/><path fill="%23FFFFFF" d="M17.5 7.2a12.8 12.8 0 0 0-3.2-1 .1.1 0 0 0-.1 0c-.1.3-.3.6-.4.9a11.8 11.8 0 0 0-3.6 0c-.1-.3-.3-.6-.4-.9 0 0-.1 0-.1 0A12.8 12.8 0 0 0 6.5 7.2a.1.1 0 0 0 0 0C4.4 10.3 3.8 13.3 4.1 16.3a.1.1 0 0 0 0 0 13 13 0 0 0 3.9 2 .1.1 0 0 0 .1 0c.3-.4.6-.9.8-1.3 0 0 0-.1-.1-.1a8.5 8.5 0 0 1-1.2-.6.1.1 0 0 1 0-.1c.1-.1.2-.2.3-.2a.1.1 0 0 1 .1 0 9.2 9.2 0 0 0 7.9 0 .1.1 0 0 1 .1 0c.1.1.2.2.3.2 0 0 0 .1 0 .1a8.5 8.5 0 0 1-1.2.6.1.1 0 0 0-.1.1c.2.4.5.9.8 1.3 0 0 .1 0 .1 0a13 13 0 0 0 4-2 .1.1 0 0 0 0 0c.4-3.5-.6-6.5-2.5-9.1 0 0 0 0 0 0zm-8.1 7.2c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6c.8 0 1.4.7 1.4 1.6 0 .9-.6 1.6-1.4 1.6zm5.2 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6c.8 0 1.4.7 1.4 1.6 0 .9-.6 1.6-1.4 1.6z"/></svg>',
  instagram: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><defs><linearGradient id="g" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23f09433"/><stop offset="25%" stop-color="%23e6683c"/><stop offset="50%" stop-color="%23dc2743"/><stop offset="75%" stop-color="%23cc2366"/><stop offset="100%" stop-color="%23bc1888"/></linearGradient></defs><rect width="24" height="24" rx="12" fill="url(%23g)"/><path fill="%23FFFFFF" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>',
  youtube: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%23FF0000"/><path fill="%23FFFFFF" d="M10 8.5l5.5 3.5-5.5 3.5V8.5z"/></svg>',
  maker: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%23191D21"/><path fill="%2357D6C4" d="M13 2.5L4 14h8l-1.5 7.5 9-11.5h-8l1.5-7.5z"/></svg>',
  shop: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect width="24" height="24" rx="12" fill="%23F59E0B"/><path fill="%23FFFFFF" d="M8 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM4 4h2l2.5 8.5h8.5L19 7H7V5h13a1 1 0 0 1 .9 1.4l-2.5 6.5A1.5 1.5 0 0 1 17 14H8a1.5 1.5 0 0 1-1.4-1L4.3 5H3V4h1z"/></svg>'
};

function setQRDataType(type) {
  window.qrSelectedType = type;
  const types = ['url', 'vcard', 'wifi', 'email', 'text'];
  types.forEach(t => {
    const box = document.getElementById(`box-qr-type-${t}`);
    const btn = document.getElementById(`btn-qr-type-${t}`);
    if (box) box.style.display = (t === type) ? 'block' : 'none';
    if (btn) {
      if (t === type) {
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
  updateQRGeneratorPreview();
}

function setQRLogo(logo) {
  window.qrSelectedLogo = logo;
  const logos = ['none', 'twitch', 'discord', 'instagram', 'youtube', 'maker', 'shop', 'custom'];
  logos.forEach(l => {
    const btn = document.getElementById(`btn-qr-logo-${l}`);
    if (btn) {
      if (l === logo) {
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
  const customBox = document.getElementById('box-qr-custom-logo');
  if (customBox) customBox.style.display = (logo === 'custom') ? 'block' : 'none';
  updateQRGeneratorPreview();
}

function handleQRLogoUpload(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    window.qrCustomLogoData = e.target.result;
    const urlInput = document.getElementById('cfg-qr-custom-logo-url');
    if (urlInput) urlInput.value = 'Imagen local subida';
    updateQRGeneratorPreview();
  };
  reader.readAsDataURL(file);
}

function buildQRDataPayload() {
  const type = window.qrSelectedType || 'url';
  if (type === 'vcard') {
    const fn = document.getElementById('cfg-qr-vcard-name')?.value.trim() || 'Andorina Maker';
    const phone = document.getElementById('cfg-qr-vcard-phone')?.value.trim() || '';
    const email = document.getElementById('cfg-qr-vcard-email')?.value.trim() || '';
    const org = document.getElementById('cfg-qr-vcard-org')?.value.trim() || 'Taller Maker';
    const web = document.getElementById('cfg-qr-vcard-url')?.value.trim() || 'https://twitch.tv/andorina';
    const note = document.getElementById('cfg-qr-vcard-note')?.value.trim() || 'Contacto desde Twitch';
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${fn}\nORG:${org}\nTEL;TYPE=CELL:${phone}\nEMAIL:${email}\nURL:${web}\nNOTE:${note}\nEND:VCARD`;
  } else if (type === 'wifi') {
    const ssid = document.getElementById('cfg-qr-wifi-ssid')?.value.trim() || 'Taller_Maker';
    const pass = document.getElementById('cfg-qr-wifi-pass')?.value.trim() || '';
    const auth = document.getElementById('cfg-qr-wifi-auth')?.value || 'WPA';
    return `WIFI:T:${auth};S:${ssid};P:${pass};;`;
  } else if (type === 'email') {
    const to = document.getElementById('cfg-qr-email-to')?.value.trim() || 'contacto@taller.com';
    const sub = document.getElementById('cfg-qr-email-sub')?.value.trim() || '';
    const body = document.getElementById('cfg-qr-email-body')?.value.trim() || '';
    return `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
  } else if (type === 'text') {
    return document.getElementById('cfg-qr-text-val')?.value.trim() || 'MAKER-DESCUENTO-2026';
  } else {
    return document.getElementById('cfg-qr-input-url')?.value.trim() || 'https://twitch.tv/andorina';
  }
}

function setQRPresetUrl(type) {
  const input = document.getElementById('cfg-qr-input-url');
  if (!input) return;

  const streamer = cachedWidgetsConfig?.promo?.shortcuts?.find(s => s.streamer)?.streamer || 'andorina';
  const urls = {
    twitch: `https://twitch.tv/${streamer}`,
    discord: 'https://discord.gg/andorina',
    shop: `https://twitch.tv/${streamer}`,
    youtube: `https://youtube.com/@${streamer}`,
    instagram: `https://instagram.com/${streamer}`
  };

  input.value = urls[type] || urls.twitch;
  updateQRGeneratorPreview();
}

function updateQRGeneratorPreview() {
  const canvas = document.getElementById('qr-gen-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const payload = buildQRDataPayload();
  const fgColor = (document.getElementById('cfg-qr-fg-color')?.value || '#000000').replace('#', '');
  const bgColor = (document.getElementById('cfg-qr-bg-color')?.value || '#FFFFFF').replace('#', '');
  const size = parseInt(document.getElementById('cfg-qr-size')?.value, 10) || 500;
  const logo = window.qrSelectedLogo || 'none';

  // Resumen del tipo generado
  const summaryLbl = document.getElementById('lbl-qr-result-summary');
  if (summaryLbl) {
    const typeNames = {
      url: '🌐 Enlace Web',
      vcard: '📇 Tarjeta de Contacto (Guarda en agenda)',
      wifi: '📶 Conexión Wi-Fi Automática',
      email: '✉️ Redacción de Email',
      text: '💬 Texto / Cupón Promocional'
    };
    summaryLbl.textContent = `${typeNames[window.qrSelectedType || 'url']} (${payload.length} caracteres)`;
  }

  // Cargar QR con corrección de error ecc=H (30% de tolerancia para superponer el logo central)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&color=${fgColor}&bgcolor=${bgColor}&margin=1&data=${encodeURIComponent(payload)}`;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);

    // Dibujar logotipo central si está seleccionado
    let logoSrc = null;
    if (logo === 'custom') {
      logoSrc = window.qrCustomLogoData || document.getElementById('cfg-qr-custom-logo-url')?.value.trim();
    } else if (logo !== 'none' && window.QR_LOGO_SVGS && window.QR_LOGO_SVGS[logo]) {
      logoSrc = window.QR_LOGO_SVGS[logo];
    }

    if (logoSrc) {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const cx = size / 2;
        const cy = size / 2;
        const radius = size * 0.12; // 24% del ancho (seguro dentro del 30% de tolerancia)

        // Escudo circular de fondo
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + (size * 0.02), 0, Math.PI * 2);
        ctx.fillStyle = '#' + bgColor;
        ctx.fill();
        ctx.lineWidth = size * 0.015;
        ctx.strokeStyle = '#' + fgColor;
        ctx.stroke();

        // Máscara y dibujo del logo
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.restore();
      };
      logoImg.src = logoSrc;
    }
  };
  img.src = qrUrl;
}

function downloadGeneratedQR() {
  const canvas = document.getElementById('qr-gen-canvas');
  if (!canvas) return;
  const type = window.qrSelectedType || 'qr';

  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Error al generar la imagen del código QR.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `codigo-qr-${type}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert('✓ ¡Código QR descargado con éxito en PNG de alta resolución con su logotipo central!');
  }, 'image/png');
}

function copyGeneratedQRLink() {
  const payload = buildQRDataPayload();
  if (payload) {
    copyText(payload);
    alert('✓ Contenido del código QR copiado al portapapeles.');
  }
}

function applyGeneratedQRToPromo() {
  const payload = buildQRDataPayload();
  const type = window.qrSelectedType || 'url';
  const logo = window.qrSelectedLogo || 'none';

  window.promoActiveQRPayload = payload;
  window.promoActiveQRType = type;
  window.promoActiveQRLogo = logo;

  if (type === 'url') {
    const lInput = document.getElementById('cfg-promo-link');
    if (lInput) lInput.value = payload;
  }

  const qrChk1 = document.getElementById('cfg-promo-show-qr');
  const qrChk2 = document.getElementById('cfg-promo-custom-show-qr');
  if (qrChk1) qrChk1.checked = true;
  if (qrChk2) qrChk2.checked = true;

  switchPromoSubTab('creator');
  updatePromoPipPreview();

  const typeLabels = { url: 'Enlace Web', vcard: 'Contacto vCard', wifi: 'Red Wi-Fi', email: 'Email', text: 'Cupón/Texto' };
  alert(`✓ ¡QR configurado y aplicado a la Promoción!\nTipo: ${typeLabels[type] || type} | Logotipo: ${logo.toUpperCase()}`);
}

async function triggerShoutout() {
  const usernameInput = document.getElementById('shoutout-username');
  const user = (usernameInput?.value || '').trim().replace(/^@/, '');
  if (!user) {
    alert('Introduce un usuario de Twitch para promocionar.');
    return;
  }

  await API.triggerWidgetAction('promo', 'promote', {
    type: 'shoutout',
    streamer: user,
    title: user,
    display_name: user,
    link: `https://twitch.tv/${user.toLowerCase()}`,
    show_qr: true
  });

  alert(`📢 ¡Promocionando a @${user} en pantalla!`);
}



async function savePromoControls() {
  if (!cachedWidgetsConfig) return;
    if (!cachedWidgetsConfig.promo) cachedWidgetsConfig.promo = {};
    const pr = cachedWidgetsConfig.promo;
    pr.duration = (parseInt(document.getElementById('cfg-promo-duration')?.value, 10) || 8) * 1000;
    pr.soundChime = document.getElementById('cfg-promo-sound')?.checked !== false;
    pr.sameStyleAsChat = document.getElementById('cfg-promo-same-as-chat')?.checked === true;

    const activePresetId = document.getElementById('cfg-promo-preset-select')?.value || 'streamer_neon';
    pr.activePreset = activePresetId;

    if (!pr.styles) pr.styles = {};
    const s = pr.styles;
    s.themePreset = activePresetId;
    s.shape = document.getElementById('cfg-promo-shape')?.value || 'rounded';
    s.bgType = document.getElementById('cfg-promo-bgtype')?.value || 'glass';
    s.bgColor = document.getElementById('cfg-promo-bgcolor')?.value || '#191D21';
    s.bgGradient = document.getElementById('cfg-promo-bggrad')?.value || '#0B0D0F';
    s.borderStyle = document.getElementById('cfg-promo-borderstyle')?.value || 'left_neon';
    s.borderColor = document.getElementById('cfg-promo-border')?.value || '#57D6C4';
    s.accentColor = s.borderColor;
    s.glowIntensity = parseInt(document.getElementById('cfg-promo-glow')?.value, 10) || 45;
    s.fontFamily = document.getElementById('cfg-promo-font')?.value || 'outfit';
    s.animation = document.getElementById('cfg-promo-anim')?.value || 'slide_up';
    s.customCSS = document.getElementById('cfg-promo-custom-css')?.value || '';

    // Actualizar preset en la lista de presets
    const curP = (pr.presets || []).find(p => p.id === activePresetId);
    if (curP) {
      curP.shape = s.shape;
      curP.bgType = s.bgType;
      curP.bgColor = s.bgColor;
      curP.bgGradient = s.bgGradient;
      curP.borderStyle = s.borderStyle;
      curP.borderColor = s.borderColor;
      curP.glowIntensity = s.glowIntensity;
      curP.fontFamily = s.fontFamily;
      curP.animation = s.animation;
      curP.customCSS = s.customCSS;
    }

    if (pr.sameStyleAsChat) {
      await copyStylesFromChatToPromo(false);
    }

}



// Registro del módulo Promo
window.renderPromoShortcuts = renderPromoShortcuts;
window.triggerPromoShortcut = triggerPromoShortcut;
window.renderPromoControls = renderPromoControls;
window.savePromoControls = savePromoControls;

window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['promo'] = {
  renderControls: renderPromoControls,
  saveControls: savePromoControls,
  renderShortcuts: renderPromoShortcuts,
  updatePreview: typeof updatePromoPipPreview === 'function' ? updatePromoPipPreview : () => {}
};

