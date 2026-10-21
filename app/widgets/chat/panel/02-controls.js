// widgets/chat/panel/02-controls.js - Coordinador del formulario del panel del Chat

function renderChatControls(container) {
  if (!container || !cachedWidgetsConfig) return;
  const c = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.styles) || {};
  const sp = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.spotlight) || {};
  const presets = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.presets) || [];
  const botTimers = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.botTimers) || [];
  const activePresetId = cachedWidgetsConfig.chat.activePreset || c.themePreset || 'maker_glass';

  const partA = buildChatStylesPresetsHtml(c, presets, activePresetId);
  const partB = buildChatSpotlightTimersHtml(sp, botTimers, c.customCSS);

  container.innerHTML = partA + partB;

  // Cargar feed de chat inicial
  setTimeout(refreshChatLiveFeed, 100);
}
