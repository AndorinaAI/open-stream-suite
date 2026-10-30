// ====================================================================
// WIDGETS CORE: CONFIGURACIÓN CENTRAL, DRAWER, PESTAÑAS Y REGISTRO
// ====================================================================

var cachedWidgetsConfig = null;
var currentMiniAppWidget = null;
var activeMiniAppTab = 'controls'; // 'controls' | 'shortcuts' | 'code'

// Registro global de módulos de widgets
window.WidgetModules = window.WidgetModules || {};

// Cargar configuración de widgets desde el backend
async function loadWidgetsConfig() {
  try {
    const data = await API.getWidgetsConfig();
    if (data && data.config) {
      cachedWidgetsConfig = data.config;
      renderWidgetsGrid();
    }
  } catch (e) {
    console.error('Error cargando configuración de widgets:', e);
  }
}

// Renderizar la lista de tarjetas y sus accesos directos personalizados
function renderWidgetsGrid() {
  if (!cachedWidgetsConfig) return;

  // 1. Temporizador
  if (typeof renderTimerShortcuts === 'function') renderTimerShortcuts();

  // 2. Promoción (Shoutout)
  if (typeof renderPromoShortcuts === 'function') renderPromoShortcuts();

  // 3. Chat & Partículas
  if (typeof renderChatShortcuts === 'function') renderChatShortcuts();

  // 4. Barra de Objetivo
  if (typeof renderGoalShortcuts === 'function') renderGoalShortcuts();

  // 5. Marquesina (Ticker)
  if (typeof renderTickerShortcuts === 'function') renderTickerShortcuts();

  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations(document.getElementById('sec-widgets') || document);
  }
}

// ====================================================================
// APERTURA Y CONTROL DE MINI-APPS DE WIDGETS
// ====================================================================

async function openWidgetMiniApp(widgetId, initialTab = 'controls') {
  // Si la config aún no está cargada, la cargamos primero
  if (!cachedWidgetsConfig) {
    await loadWidgetsConfig();
  }
  currentMiniAppWidget = widgetId;
  const drawer = document.getElementById('widget-miniapp-drawer');
  if (!drawer) return;

  drawer.style.display = 'block';
  drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Título e icono
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const titles = {
    timer: tr('widgets.timer_drawer_title', '⏱️ TEMPORIZADOR'),
    promo: tr('widgets.promo_drawer_title', '📢 GESTOR DE PROMOCIONES, PRODUCTOS Y QR'),
    chat: tr('widgets.chat_drawer_title', '💬 CHAT, PARTÍCULAS Y PERSONALIZACIÓN CSS'),
    goal: tr('widgets.goal_drawer_title', '🎯 BARRA DE METAS Y OBJETIVOS'),
    ticker: tr('widgets.ticker_drawer_title', '📰 MARQUESINA DE EVENTOS Y NOTICIAS')
  };
  document.getElementById('miniapp-title').textContent = titles[widgetId] || tr('widgets.drawer_title', 'MINI-APP DE WIDGET');

  // Configurar iframe de previsualización (modo preview=true para auto-escalado responsive)
  const iframes = {
    timer: '/widgets/timer/index.html?preview=true&t=' + Date.now(),
    promo: '/widgets/shoutout/index.html?preview=true&t=' + Date.now(),
    chat: '/widgets/chat/index.html?preview=true&t=' + Date.now(),
    goal: '/widgets/goal/index.html?preview=true&t=' + Date.now(),
    ticker: '/widgets/ticker/index.html?t=' + Date.now()
  };
  const pip = document.getElementById('miniapp-live-iframe');
  if (pip) pip.src = iframes[widgetId] || ('/widgets/timer/index.html?t=' + Date.now());

  if (widgetId === 'chat') {
    setTimeout(() => {
      if (typeof simulateChatMessage === 'function') {
        simulateChatMessage('sub');
        simulateChatMessage('normal');
      }
    }, 400);
  } else if (widgetId === 'timer') {
    setTimeout(() => {
      if (typeof updateTimerPipPreview === 'function') updateTimerPipPreview();
    }, 400);
  } else if (widgetId === 'promo') {
    setTimeout(() => {
      if (typeof updatePromoPipPreview === 'function') updatePromoPipPreview();
      if (typeof updateQRGeneratorPreview === 'function') updateQRGeneratorPreview();
    }, 400);
  } else if (widgetId === 'goal') {
    setTimeout(() => {
      if (typeof updateGoalPipPreview === 'function') updateGoalPipPreview();
    }, 400);
  }

  const chatProfilesTabBtn = document.getElementById('tab-btn-chat-profiles');
  if (chatProfilesTabBtn) {
    chatProfilesTabBtn.style.display = (widgetId === 'chat') ? 'inline-flex' : 'none';
  }

  switchMiniAppTab(initialTab);
}

function closeWidgetMiniApp() {
  const drawer = document.getElementById('widget-miniapp-drawer');
  if (drawer) drawer.style.display = 'none';
  currentMiniAppWidget = null;
}

function switchMiniAppTab(tabName) {
  activeMiniAppTab = tabName;
  document.querySelectorAll('.miniapp-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  const controlsView = document.getElementById('miniapp-view-controls');
  const chatProfilesView = document.getElementById('miniapp-view-chat-profiles');
  const shortcutsView = document.getElementById('miniapp-view-shortcuts');
  const codeView = document.getElementById('miniapp-view-code');
  const themeView = document.getElementById('miniapp-view-theme');

  if (controlsView) controlsView.style.display = (tabName === 'controls') ? 'block' : 'none';
  if (chatProfilesView) chatProfilesView.style.display = (tabName === 'chat-profiles') ? 'block' : 'none';
  if (shortcutsView) shortcutsView.style.display = (tabName === 'shortcuts') ? 'block' : 'none';
  if (codeView) codeView.style.display = (tabName === 'code') ? 'block' : 'none';
  if (themeView) themeView.style.display = (tabName === 'theme') ? 'block' : 'none';

  if (tabName === 'controls') renderMiniAppControls();
  if (tabName === 'theme') renderMiniAppTheme();
  if (tabName === 'chat-profiles') {
    if (typeof renderChatProfilesManager === 'function') renderChatProfilesManager();
  }
  if (tabName === 'shortcuts') {
    if (typeof renderMiniAppShortcutsManager === 'function') renderMiniAppShortcutsManager();
  }
  if (tabName === 'code') renderMiniAppCodeEditor();

  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    const drawer = document.getElementById('widget-miniapp-drawer');
    if (drawer) setTimeout(() => window.i18n.applyTranslations(drawer), 40);
  }
}

// 1. Pestaña de Controles Sencillos (Delegación al módulo del widget activo)
function renderMiniAppTheme() {
  const container = document.getElementById('miniapp-theme-content');
  if (!container || !currentMiniAppWidget) return;
  const w = currentMiniAppWidget;
  const state = (window.ComponentThemes && ComponentThemes.themeStateFor)
    ? ComponentThemes.themeStateFor('widget:' + w)
    : {};
  container.innerHTML = (window.ThemePicker && ThemePicker.render)
    ? ThemePicker.render(w, state.theme || '')
    : '<div style="font-size:11px;color:var(--color-text-dim);">No se pudo cargar el selector de temas.</div>';
}

function renderMiniAppControls() {
  const container = document.getElementById('miniapp-controls-content');
  if (!container || !cachedWidgetsConfig || !currentMiniAppWidget) return;

  const mod = window.WidgetModules && window.WidgetModules[currentMiniAppWidget];
  if (mod && typeof mod.renderControls === 'function') {
    mod.renderControls(container);
  } else {
    container.innerHTML = `<div style="padding:20px; color:var(--color-text-dim);">Cargando módulo de ${currentMiniAppWidget}...</div>`;
  }
}

// Guardar controles del widget activo
async function saveMiniAppControls(widgetId) {
  if (!cachedWidgetsConfig) return;

  const targetWidget = widgetId || currentMiniAppWidget;
  const mod = window.WidgetModules && window.WidgetModules[targetWidget];
  if (mod && typeof mod.saveControls === 'function') {
    await mod.saveControls();
  }

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  if (typeof updateChatPipPreview === 'function') updateChatPipPreview();
  if (typeof updateTimerPipPreview === 'function') updateTimerPipPreview();
  if (typeof updatePromoPipPreview === 'function') updatePromoPipPreview();
  if (typeof updateGoalPipPreview === 'function') updateGoalPipPreview();
  alert('✓ ¡Ajustes guardados con éxito!');
}

// 3. Pestaña de Edición por Código / JSON
function renderMiniAppCodeEditor() {
  const textarea = document.getElementById('miniapp-code-textarea');
  if (!textarea || !cachedWidgetsConfig || !currentMiniAppWidget) return;

  const wConfig = cachedWidgetsConfig[currentMiniAppWidget] || {};
  textarea.value = JSON.stringify(wConfig, null, 2);
}

async function saveMiniAppCodeEditor() {
  const textarea = document.getElementById('miniapp-code-textarea');
  if (!textarea || !cachedWidgetsConfig || !currentMiniAppWidget) return;

  try {
    const parsed = JSON.parse(textarea.value);
    cachedWidgetsConfig[currentMiniAppWidget] = parsed;
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    renderWidgetsGrid();
    alert('✓ ¡Código JSON guardado y sincronizado con OBS Studio!');
  } catch (err) {
    alert('❌ Error de sintaxis JSON: ' + err.message);
  }
}

// ====================================================================
// MODALES UNIVERSALES DE GUÍAS TÉCNICAS (PROGRAMACIÓN API & CSS)
// ====================================================================

function closeMiniAppModal() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (modalContainer) modalContainer.innerHTML = '';
}
