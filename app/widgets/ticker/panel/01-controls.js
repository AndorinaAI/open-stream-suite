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
  const activePresetId = tk.activePreset || (presets[0] && presets[0].id) || 'cyber_stream';

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

    ${typeof window.buildTickerContentTabHtml === 'function' ? window.buildTickerContentTabHtml(tk, s, chips, phrases, rss, currentTickerTab) : ''}
    ${typeof window.buildTickerStylesTabHtml === 'function' ? window.buildTickerStylesTabHtml(tk, s, currentTickerTab) : ''}
    ${typeof window.buildTickerPresetsCodeTabHtml === 'function' ? window.buildTickerPresetsCodeTabHtml(tk, presets, activePresetId, currentTickerTab) : ''}
  `;

  setTimeout(updateTickerPipPreview, 50);
}
