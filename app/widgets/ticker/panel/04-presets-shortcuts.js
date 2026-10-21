
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
  tk.activePreset = 'cyber_stream';
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

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const tk = cachedWidgetsConfig.ticker;
  const shortcuts = tk.shortcuts || [
    { id: 'sc_tk_1', label: '📢 Anuncio Stream', action: 'message', params: { message: '🔥 ¡Directo en marcha!' }, color: '#57D6C4' },
    { id: 'sc_tk_2', label: '⭐ Gracias', action: 'message', params: { message: '🎉 ¡Gracias a todos por apoyar el canal!' }, color: '#A78BFA' },
    { id: 'sc_tk_3', label: '🚨 Flash', action: 'flash_news', params: { message: '🚨 ¡ALERTA EN DIRECTO: Proyecto completado con éxito!' }, color: '#EF4444' },
    { id: 'sc_tk_4', label: '❤️ +Follow', action: 'simulate', params: { event: 'follow', user: 'Comunidad' }, color: '#F43F5E' }
  ];

  container.innerHTML = `
    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
      ${shortcuts.map(sc => {
        const label = tr('widgets.shortcuts.' + sc.id, sc.label);
        return `
        <button type="button" class="btn-action-test" style="border-color: ${sc.color || '#57D6C4'}80; color: ${sc.color || '#57D6C4'};" onclick="API.triggerWidgetAction('ticker', '${sc.action}', ${JSON.stringify(sc.params || {}).replace(/"/g, '&quot;')})">
          ${label}
        </button>
      `}).join('')}
      <button type="button" class="btn-stage-preset" onclick="API.triggerWidgetAction('ticker', 'toggle_pause')" title="${tr('widgets.ticker_pause_title', 'Pausar o reanudar marquesina')}">
        ${tr('widgets.ticker_pause', '⏯️ Pausa')}
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
