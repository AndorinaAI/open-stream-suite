// ====================================================================
// MÓDULO WIDGET: PROMOCIÓN / SHOUTOUT / CÓDIGOS QR
// Coordinador Principal de Pestañas del Panel de Control
// ====================================================================

function renderPromoControls(container) {
  if (!container || !cachedWidgetsConfig) return;
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
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
    history.forEach((h) => {
      const typeLabels = { shoutout: '📢 STREAMER', product: '🛒 PRODUCTO', custom: '⚡ DESTACADO', social: '💬 REDES' };
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
            <button type="button" class="btn-stage-preset" style="padding: 4px 8px; font-size: 11px;" onclick="loadPromoFromHistory('${h.id}')" title="Cargar datos en el formulario">
              📝 Editar
            </button>
            <button type="button" class="btn-action-primary" style="padding: 4px 10px; font-size: 11px;" onclick="replayPromoFromHistory('${h.id}')" title="Lanzar a OBS inmediatamente">
              🔄 Repetir
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
        ${tr('widgets.promo_subtab_creator', '🚀 Creador & Emisión')}
      </button>
      <button type="button" id="promo-subtab-btn-qr" class="btn-stage-preset ${activeTab === 'qr' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'qr' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchPromoSubTab('qr')">
        ${tr('widgets.promo_subtab_qr', '📱 Generador QR Pro')}
      </button>
      <button type="button" id="promo-subtab-btn-history" class="btn-stage-preset ${activeTab === 'history' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'history' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchPromoSubTab('history')">
        ${tr('widgets.promo_subtab_history', '📜 Historial')} (${(history || []).length})
      </button>
      <button type="button" id="promo-subtab-btn-styles" class="btn-stage-preset ${activeTab === 'styles' ? 'active' : ''}" style="flex: 1; min-width: 140px; font-size: 12px; padding: 8px 12px; font-weight: 700; ${activeTab === 'styles' ? 'border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);' : ''}" onclick="switchPromoSubTab('styles')">
        ${tr('widgets.promo_subtab_styles', '🎨 Estilos & Chat Sync')}
      </button>
    </div>

    ${typeof window.buildPromoCreatorTabHtml === 'function' ? window.buildPromoCreatorTabHtml(activeTab, presetsOptionsHtml, isStreamerMode, activePreset, p, tr) : ''}
    ${typeof window.buildPromoQRTabHtml === 'function' ? window.buildPromoQRTabHtml(activeTab) : ''}
    ${typeof window.buildPromoHistoryTabHtml === 'function' ? window.buildPromoHistoryTabHtml(activeTab, historyHtml) : ''}
    ${typeof window.buildPromoStylesTabHtml === 'function' ? window.buildPromoStylesTabHtml(activeTab, sameAsChat, s) : ''}
  `;

  setTimeout(() => {
    updatePromoPipPreview();
    updateQRGeneratorPreview();
  }, 100);
}
