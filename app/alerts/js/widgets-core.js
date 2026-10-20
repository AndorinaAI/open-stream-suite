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
  const titles = {
    timer: '⏱️ TEMPORIZADOR',
    promo: '📢 GESTOR DE PROMOCIONES, PRODUCTOS Y QR',
    chat: '💬 CHAT, PARTÍCULAS Y PERSONALIZACIÓN CSS',
    goal: '🎯 BARRA DE METAS Y OBJETIVOS',
    ticker: '📰 MARQUESINA DE EVENTOS Y NOTICIAS'
  };
  document.getElementById('miniapp-title').textContent = titles[widgetId] || 'MINI-APP DE WIDGET';

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
  const shortcutsView = document.getElementById('miniapp-view-shortcuts');
  const codeView = document.getElementById('miniapp-view-code');

  if (controlsView) controlsView.style.display = (tabName === 'controls') ? 'block' : 'none';
  if (shortcutsView) shortcutsView.style.display = (tabName === 'shortcuts') ? 'block' : 'none';
  if (codeView) codeView.style.display = (tabName === 'code') ? 'block' : 'none';

  if (tabName === 'controls') renderMiniAppControls();
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

function openWidgetDevGuideModal(widgetId) {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer) return;

  const guides = {
    goal: {
      title: '🎯 Guía de Programación, Tokens y Stream Deck para la Barra de Metas',
      tokens: [
        { tag: '{pct}', desc: 'Porcentaje actual completado numérico (ej: 75)' },
        { tag: '{current}', desc: 'Valor numérico acumulado actual con prefijo/sufijo (ej: €150)' },
        { tag: '{target}', desc: 'Objetivo final fijado con prefijo/sufijo (ej: €200)' },
        { tag: '{remaining}', desc: 'Cantidad que falta para completar la meta (ej: €50)' },
        { tag: '{prefix}', desc: 'Símbolo de prefijo configurado (ej: €, $, #)' },
        { tag: '{suffix}', desc: 'Texto de sufijo configurado (ej: subs, follows, pcs)' },
        { tag: '{title}', desc: 'Título visible de la meta en pantalla' }
      ],
      apiActions: [
        {
          action: 'quick_adjust',
          desc: 'Aumentar o disminuir el progreso de una meta específica',
          payload: { widget: 'goal', action: 'quick_adjust', params: { goal_id: 'goal_followers', delta: 5 } }
        },
        {
          action: 'set',
          desc: 'Establecer valor absoluto a una meta',
          payload: { widget: 'goal', action: 'set', params: { goal_id: 'goal_maker_filament', current: 40 } }
        },
        {
          action: 'toggle_goal',
          desc: 'Activar u ocultar una meta en el overlay',
          payload: { widget: 'goal', action: 'toggle_goal', params: { goal_id: 'goal_subs' } }
        },
        {
          action: 'reset',
          desc: 'Reiniciar el contador de una meta a 0',
          payload: { widget: 'goal', action: 'reset', params: { goal_id: 'goal_maker_filament' } }
        }
      ],
      wsInfo: 'El widget emite y escucha eventos tipo <code>goal_update</code> y <code>widgets_config_updated</code> con el array completo de metas.'
    },
    timer: {
      title: '⏱️ Guía de Programación, Tokens y Stream Deck para el Temporizador',
      tokens: [
        { tag: '{prefix}', desc: 'Título o prefijo del temporizador (ej: EN BREVE COMENZAMOS)' },
        { tag: '{time}', desc: 'Tiempo formateado según mm:ss o segundos (ej: 04:59)' },
        { tag: '{unit}', desc: 'Etiqueta de unidad configurada (ej: MIN, SEG)' },
        { tag: '{sub}', desc: 'Subtítulo o fase actual (ej: FASE DE SOLDADURA)' }
      ],
      apiActions: [
        {
          action: 'start',
          desc: 'Iniciar o reanudar el temporizador con segundos opcionales',
          payload: { widget: 'timer', action: 'start', params: { seconds: 300, title: 'PAUSA CAFÉ', mode: 'down' } }
        },
        {
          action: 'pause',
          desc: 'Pausar el temporizador en el segundo actual',
          payload: { widget: 'timer', action: 'pause' }
        },
        {
          action: 'reset',
          desc: 'Reiniciar al tiempo inicial por defecto',
          payload: { widget: 'timer', action: 'reset' }
        },
        {
          action: 'add_seconds',
          desc: 'Añadir o restar segundos en caliente (+60s, -30s)',
          payload: { widget: 'timer', action: 'add_seconds', params: { seconds: 60 } }
        }
      ],
      wsInfo: 'Escucha <code>timer_action</code> con actions <code>start, pause, reset, add_seconds</code>.'
    },
    promo: {
      title: '📢 Guía de Programación y Disparos para Promociones y QR',
      tokens: [
        { tag: '{streamer}', desc: 'Nombre de usuario del canal promocionado' },
        { tag: '{title}', desc: 'Título o nombre del producto' },
        { tag: '{price}', desc: 'Precio o descuento especial' }
      ],
      apiActions: [
        {
          action: 'promote',
          desc: 'Lanzar banner de producto o shoutout con código QR en vivo',
          payload: {
            widget: 'promo',
            action: 'promote',
            params: {
              type: 'product',
              title: 'CAMISETA OPEN STREAM SUITE',
              subtitle: 'Edición Limitada',
              price: '19.99€',
              link: 'https://twitch.tv/andorina',
              show_qr: true,
              color: '#57D6C4'
            }
          }
        }
      ],
      wsInfo: 'Emite <code>promo_action</code> que renderiza la tarjeta y genera el QR en pantalla.'
    },
    chat: {
      title: '💬 Guía de Integración y Disparos del Chat y Partículas',
      tokens: [
        { tag: '{user}', desc: 'Nombre de usuario que escribió el mensaje' },
        { tag: '{count}', desc: 'Cantidad de partículas o emotes en explosión' }
      ],
      apiActions: [
        {
          action: 'explode',
          desc: 'Lanzar explosión física de partículas de emoji o emotes en OBS',
          payload: { widget: 'chat', action: 'explode', params: { emoji: '🔥', count: 50 } }
        },
        {
          action: 'spotlight',
          desc: 'Fijar mensaje destacado en la zona spotlight',
          payload: { widget: 'chat', action: 'spotlight', params: { message_id: 'msg_123' } }
        }
      ],
      wsInfo: 'Conexión WebSocket directa con EventSub y Twitch IRC.'
    },
    ticker: {
      title: '📰 Guía de Programación, Tokens y Stream Deck para la Marquesina (Ticker)',
      tokens: [
        { tag: '{channel}', desc: 'Nombre del canal o streamer actual' },
        { tag: '{last_follower}', desc: 'Nombre del usuario que realizó el último follow' },
        { tag: '{last_sub}', desc: 'Nombre del suscriptor más reciente con tier' },
        { tag: '{last_bits}', desc: 'Último donante de bits en el stream' },
        { tag: '{top_bits}', desc: 'Usuario que más bits ha donado en la sesión' },
        { tag: '{last_raid}', desc: 'Último streamer que ha enviado una raid con viewers' },
        { tag: '{last_tip}', desc: 'Última donación recibida (Ko-fi, PayPal, BMC o manual)' },
        { tag: '{last_kofi}', desc: 'Última donación registrada por Ko-fi' },
        { tag: '{last_paypal}', desc: 'Última donación registrada por PayPal' },
        { tag: '{last_bmc}', desc: 'Última donación registrada por Buy Me a Coffee' },
        { tag: '{goal_pct}', desc: 'Porcentaje completado de la meta activa' }
      ],
      apiActions: [
        {
          action: 'set_message',
          desc: 'Actualizar el mensaje fijo de la marquesina en tiempo real',
          payload: { widget: 'ticker', action: 'set_message', params: { message: '🚨 ¡NUEVO HORARIO DE DIRECTOS! 🚨' } }
        },
        {
          action: 'flash',
          desc: 'Destacar o hacer parpadear la marquesina con aviso importante',
          payload: { widget: 'ticker', action: 'flash', params: { duration: 5 } }
        }
      ],
      wsInfo: 'Escucha eventos follow, sub, bits y widgets_config_updated con el objeto ticker.'
    }
  };

  const g = guides[widgetId] || guides.goal;

  modalContainer.innerHTML = `
    <div class="miniapp-modal-overlay" onclick="if(event.target === this) closeMiniAppModal()">
      <div class="miniapp-modal-box" style="max-width: 820px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="miniapp-modal-header" style="flex-shrink: 0;">
          <div style="font-family: var(--font-tech); font-size: 13px; font-weight: 700; color: var(--color-accent-cyan); display: flex; align-items: center; gap: 8px;">
            <span>📖</span>
            <span>${g.title}</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()" style="font-size: 12px; padding: 4px 8px;">✕ Cerrar</button>
        </div>

        <div class="miniapp-modal-body" style="font-size: 13px; color: #E2E8F0; line-height: 1.6; overflow-y: auto; padding-right: 8px;">
          
          <!-- SECCIÓN 1: ETIQUETAS Y TOKENS {} -->
          <div style="margin-bottom: 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 12px;">
              🏷️ 1. Etiquetas Dinámicas {} Disponibles
            </h4>
            <div style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 8px;">
              Puedes insertar estas variables entre llaves en cualquier plantilla de texto para que se reemplacen en tiempo real:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${g.tokens.map(t => `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; padding: 6px 8px;">
                  <code style="color: #57D6C4; font-weight: 700;">${t.tag}</code>
                  <div style="font-size: 11px; color: var(--color-text-dim); margin-top: 2px;">${t.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- SECCIÓN 2: CONTROL DESDE STREAM DECK / OPENDECK (REST API) -->
          <div style="margin-bottom: 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 12px;">
              🕹️ 2. Control desde Stream Deck, Ajazz AKP05, OpenDeck o Macros (REST API)
            </h4>
            <div style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 8px;">
              Cualquier tecla o macro puede enviar una petición <strong>HTTP POST</strong> o usar el endpoint rápido <strong>HTTP GET (1 Clic)</strong>:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              <div style="background: #0B0D0F; border: 1px solid rgba(87,214,196,0.3); border-radius: 4px; padding: 8px; font-family: monospace; font-size: 10px; color: #A78BFA;">
                <b style="color: #57D6C4;">POST (Payload JSON completo):</b><br>
                POST http://localhost:8080/api/widgets/action<br>
                Content-Type: application/json
              </div>
              <div style="background: #0B0D0F; border: 1px solid rgba(87,214,196,0.3); border-radius: 4px; padding: 8px; font-family: monospace; font-size: 10px; color: #38BDF8;">
                <b style="color: #57D6C4;">GET (1 Clic para Decks / Teclas):</b><br>
                GET http://localhost:8080/api/deck/widget?widget=${wKey}&action=...<br>
                <b style="color: #F59E0B;">Knobs / Perillas (Ajazz AKP05):</b><br>
                GET http://localhost:8080/api/deck/knob?knob=1&direction=up
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${g.apiActions.map(act => `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <strong style="color: #57D6C4; font-size: 11px;">Acción: "${act.action}"</strong>
                    <span style="font-size: 10px; color: var(--color-text-dim);">${act.desc}</span>
                  </div>
                  <pre style="margin: 0; background: #070809; padding: 6px; border-radius: 4px; font-size: 10px; color: #CBD5E1; overflow-x: auto;">${JSON.stringify(act.payload, null, 2)}</pre>
                  <div style="margin-top: 4px; font-size: 9px; font-family: monospace; color: #94A3B8;">
                    URL 1-clic: <span style="color: #38BDF8;">http://localhost:8080/api/deck/widget?widget=${wKey}&action=${act.action}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- SECCIÓN 3: WEBSOCKET SPECS -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px;">
            <h4 style="margin: 0 0 6px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 12px;">
              ⚡ 3. Sincronización WebSocket en Tiempo Real
            </h4>
            <div style="font-size: 11px; color: var(--color-text-dim);">
              ${g.wsInfo} Dirección: <code>ws://localhost:8080/ws</code>. Sin latencia ni necesidad de recargar la fuente de navegador en OBS Studio.
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations(modalContainer);
  }
}

function openWidgetCssGuideModal(widgetId) {
  if (widgetId === 'chat' && typeof openChatThemeGuideModal === 'function') {
    openChatThemeGuideModal();
    return;
  }

  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer) return;

  const cssGuides = {
    goal: {
      title: '🎨 Guía de Clases CSS y Selectores para la Barra de Metas (Goal)',
      selectors: [
        { sel: '.goal-widget-container', desc: 'Contenedor exterior y marco de centrado' },
        { sel: '.goal-widget-card', desc: 'Tarjeta principal que agrupa las metas (fondo, bordes, clip-path)' },
        { sel: '.goal-item-row', desc: 'Fila contenedora de cada meta individual' },
        { sel: '.goal-top-row', desc: 'Fila con icono, título y contador numérico' },
        { sel: '.goal-title', desc: 'Texto del título de la meta (font-weight, letter-spacing)' },
        { sel: '.goal-count-label', desc: 'Contador de progreso y meta objetivo (ej: 150 / 200)' },
        { sel: '.goal-pct-chip', desc: 'Píldora del porcentaje completado' },
        { sel: '.goal-track', desc: 'Pista de fondo de la barra de progreso' },
        { sel: '.goal-fill', desc: 'Relleno animado con el degradado o patrón' },
        { sel: '.goal-subtext', desc: 'Texto informativo inferior con formato dinámico' },
        { sel: '.goal-card-completed', desc: 'Clase aplicada cuando alguna meta llega al 100% (celebración)' }
      ],
      vars: [
        { v: '--goal-accent', desc: 'Color de acento principal neón' },
        { v: '--goal-bar-start', desc: 'Color de inicio del gradiente de barra' },
        { v: '--goal-bar-end', desc: 'Color de fin del gradiente de barra' },
        { v: '--goal-glow-color', desc: 'Color del halo de brillo exterior' }
      ],
      snippets: [
        {
          name: '🌟 Borde Neón Pulsante Ultra Brillante',
          code: `.goal-widget-card {\n  box-shadow: 0 0 25px rgba(87,214,196,0.5), inset 0 0 15px rgba(87,214,196,0.2) !important;\n  border-color: #57D6C4 !important;\n}`
        },
        {
          name: '🌈 Barra Rainbow Animada Multi-Gradiente',
          code: `.goal-fill {\n  background: linear-gradient(90deg, #FF783F, #EC4899, #8B5CF6, #38BDF8) !important;\n  background-size: 300% 100% !important;\n  animation: rainbowFlow 6s linear infinite !important;\n}\n@keyframes rainbowFlow {\n  0% { background-position: 0% 50%; }\n  100% { background-position: 300% 50%; }\n}`
        },
        {
          name: '📐 Estilo Terminal / Retro Scanline',
          code: `.goal-widget-card {\n  background: rgba(5, 8, 10, 0.95) !important;\n  border: 2px solid #10B981 !important;\n  border-radius: 0px !important;\n}\n.goal-title, .goal-count-label {\n  font-family: 'Press Start 2P', monospace !important;\n  font-size: 10px !important;\n  color: #10B981 !important;\n}`
        }
      ]
    },
    timer: {
      title: '🎨 Guía de Clases CSS y Selectores para el Temporizador',
      selectors: [
        { sel: '.timer-container', desc: 'Marco exterior del temporizador' },
        { sel: '.timer-card', desc: 'Tarjeta contenedora con fondo y borde' },
        { sel: '.timer-digits', desc: 'Números del reloj (minutos y segundos)' },
        { sel: '.timer-title', desc: 'Título o prefijo de cabecera' },
        { sel: '.timer-unit-pill', desc: 'Pastilla de unidad (MIN, SEG)' },
        { sel: '.timer-phase-pill', desc: 'Indicador de fase actual' }
      ],
      vars: [
        { v: '--timer-accent', desc: 'Color primario de acento y números' },
        { v: '--timer-bg', desc: 'Color de fondo de la tarjeta' }
      ],
      snippets: [
        {
          name: '🛸 Dígitos Gigantes Cyberpunk',
          code: `.timer-digits {\n  font-family: 'Orbitron', sans-serif !important;\n  letter-spacing: 2px !important;\n  text-shadow: 0 0 20px #57D6C4 !important;\n}`
        }
      ]
    },
    promo: {
      title: '🎨 Guía de Clases CSS y Selectores para Promociones y QR',
      selectors: [
        { sel: '.shoutout-card', desc: 'Tarjeta del banner de promoción' },
        { sel: '.shoutout-avatar', desc: 'Imagen o avatar del streamer / producto' },
        { sel: '.shoutout-qr-box', desc: 'Contenedor del código QR permanente' },
        { sel: '.shoutout-title', desc: 'Título principal destacado' },
        { sel: '.shoutout-price', desc: 'Píldora del precio u oferta' }
      ],
      vars: [
        { v: '--promo-color', desc: 'Color del acento y borde del código QR' }
      ],
      snippets: [
        {
          name: '✨ Marco Dorado VIP de Producto',
          code: `.shoutout-card {\n  border: 2px solid #F59E0B !important;\n  box-shadow: 0 0 25px rgba(245,158,11,0.4) !important;\n}`
        }
      ]
    },
    ticker: {
      title: '🎨 Guía de Clases CSS y Selectores para la Marquesina (Ticker)',
      selectors: [
        { sel: '.ticker-bar', desc: 'Barra horizontal completa (fondo, bordes, padding)' },
        { sel: '.ticker-item', desc: 'Cada bloque individual (Follow, Sub, Bits, Mensaje)' },
        { sel: '.ticker-icon', desc: 'Icono representativo (❤️, ⭐, 💎)' },
        { sel: '.ticker-label', desc: 'Etiqueta del evento (Último Seguidor:, Top Bits:)' },
        { sel: '.ticker-value', desc: 'Nombre del usuario o valor destacado' },
        { sel: '.ticker-sep', desc: 'Separador vertical entre bloques (│)' }
      ],
      vars: [
        { v: '--ticker-bg', desc: 'Color de fondo de la barra del ticker' },
        { v: '--ticker-accent', desc: 'Color de acento neón y bordes' },
        { v: '--ticker-font', desc: 'Familia tipográfica de la marquesina' }
      ],
      snippets: [
        {
          name: '🌟 Marquesina Neón Cyberpunk',
          code: `.ticker-bar {\n  background: rgba(11, 13, 15, 0.95) !important;\n  border: 1px solid #57D6C4 !important;\n  box-shadow: 0 0 15px rgba(87, 214, 196, 0.4) !important;\n}`
        },
        {
          name: '🌈 Píldoras Separadas Flotantes',
          code: `.ticker-bar {\n  background: transparent !important;\n  box-shadow: none !important;\n  border: none !important;\n  gap: 10px !important;\n}\n.ticker-item {\n  background: rgba(25, 29, 33, 0.9) !important;\n  padding: 6px 12px !important;\n  border-radius: 20px !important;\n  border: 1px solid rgba(255,255,255,0.1) !important;\n}`
        }
      ]
    }
  };

  const g = cssGuides[widgetId] || cssGuides.goal;

  modalContainer.innerHTML = `
    <div class="miniapp-modal-overlay" onclick="if(event.target === this) closeMiniAppModal()">
      <div class="miniapp-modal-box" style="max-width: 840px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="miniapp-modal-header" style="flex-shrink: 0;">
          <div style="font-family: var(--font-tech); font-size: 13px; font-weight: 700; color: var(--color-accent-cyan); display: flex; align-items: center; gap: 8px;">
            <span>🎨</span>
            <span>${g.title}</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()" style="font-size: 12px; padding: 4px 8px;">✕ Cerrar</button>
        </div>

        <div class="miniapp-modal-body" style="font-size: 13px; color: #E2E8F0; line-height: 1.6; overflow-y: auto; padding-right: 8px;">
          
          <!-- SELECTORES CLAVE -->
          <div style="margin-bottom: 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 12px;">
              📐 1. Selectores de Clases del DOM
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${g.selectors.map(s => `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; padding: 6px 8px;">
                  <code style="color: #57D6C4; font-weight: 700;">${s.sel}</code>
                  <div style="font-size: 11px; color: var(--color-text-dim); margin-top: 2px;">${s.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- SNIPPETS LISTOS PARA COPIAR -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 12px;">
              ⚡ 2. Ejemplos de CSS Listos para Pegar en "CSS Adicional"
            </h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${g.snippets.map(sn => `
                <div style="background: #0B0D0F; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <strong style="color: #38BDF8; font-size: 11px;">${sn.name}</strong>
                    <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px;" onclick="navigator.clipboard.writeText(\`${sn.code.replace(/`/g, '\\`')}\`); alert('✓ ¡Código CSS copiado!');">📋 Copiar</button>
                  </div>
                  <pre style="margin: 0; background: #050607; padding: 6px; border-radius: 4px; font-size: 10px; color: #57D6C4; overflow-x: auto;">${sn.code}</pre>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations(modalContainer);
  }
}

// Exponer en window para retrocompatibilidad total
window.cachedWidgetsConfig = cachedWidgetsConfig;
window.currentMiniAppWidget = currentMiniAppWidget;
window.activeMiniAppTab = activeMiniAppTab;
window.loadWidgetsConfig = loadWidgetsConfig;
window.renderWidgetsGrid = renderWidgetsGrid;
window.openWidgetMiniApp = openWidgetMiniApp;
window.closeWidgetMiniApp = closeWidgetMiniApp;
window.switchMiniAppTab = switchMiniAppTab;
window.renderMiniAppControls = renderMiniAppControls;
window.saveMiniAppControls = saveMiniAppControls;
window.renderMiniAppCodeEditor = renderMiniAppCodeEditor;
window.saveMiniAppCodeEditor = saveMiniAppCodeEditor;
window.closeMiniAppModal = closeMiniAppModal;
window.openWidgetDevGuideModal = openWidgetDevGuideModal;
window.openWidgetCssGuideModal = openWidgetCssGuideModal;

let currentPipZoom = 1.0;
function setPipZoom(zoom) {
  currentPipZoom = zoom;
  ['100', '85', 'fit'].forEach(id => {
    const btn = document.getElementById('btn-pip-zoom-' + id);
    if (btn) btn.classList.toggle('active', (zoom === 1.0 && id === '100') || (zoom === 0.85 && id === '85') || (zoom === 'fit' && id === 'fit'));
  });
  const iframe = document.getElementById('miniapp-live-iframe');
  if (iframe) {
    try {
      const url = new URL(iframe.src, window.location.origin);
      url.searchParams.set('zoom', zoom);
      iframe.src = url.toString();
    } catch (e) {}
  }
}
window.setPipZoom = setPipZoom;

// Modal interactivo: Asistente Fácil de Conexión de Donaciones (Streamlabs, Ko-fi, PayPal, BMC)
var activeDonationWizardTab = 'streamlabs'; // 'streamlabs' | 'webhooks' | 'test'

async function openDonationsModal() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer) return;

  const currentHost = window.location.hostname || 'localhost';
  const currentPort = window.location.port || '8080';
  const localBaseUrl = `http://${currentHost}:${currentPort}`;

  // Cargar configuración guardada del backend
  let savedCfg = { tunnelUrl: '', streamlabsToken: '', streamlabsConnected: false };
  try {
    const res = await fetch('/api/donations/config');
    if (res.ok) {
      const d = await res.json();
      if (d && d.config) savedCfg = Object.assign({}, savedCfg, d.config);
    }
  } catch (e) {}

  window._donationsModalState = {
    localBaseUrl,
    tunnelUrl: savedCfg.tunnelUrl || '',
    streamlabsToken: savedCfg.streamlabsToken || '',
    streamlabsConnected: savedCfg.streamlabsConnected || false,
    activeTab: activeDonationWizardTab || 'streamlabs'
  };

  renderDonationsModalContent();
}

function switchDonationModalTab(tab) {
  activeDonationWizardTab = tab;
  if (window._donationsModalState) {
    window._donationsModalState.activeTab = tab;
  }
  renderDonationsModalContent();
}

function renderDonationsModalContent() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer || !window._donationsModalState) return;

  const st = window._donationsModalState;
  const activeUrl = st.tunnelUrl && st.tunnelUrl.trim().length > 4 ? st.tunnelUrl.trim().replace(/\/+$/, '') : st.localBaseUrl;

  modalContainer.innerHTML = `
    <div class="miniapp-modal-overlay" onclick="if(event.target === this) closeMiniAppModal()">
      <div class="miniapp-modal-box" style="max-width: 880px; max-height: 90vh; display: flex; flex-direction: column;">
        
        <!-- Cabecera -->
        <div class="miniapp-modal-header" style="flex-shrink: 0;">
          <div style="font-family: var(--font-tech); font-size: 14px; font-weight: 700; color: #10B981; display: flex; align-items: center; gap: 8px;">
            <span>💰</span>
            <span>Asistente de Conexión de Donaciones (Ko-fi, PayPal, Buy Me a Coffee)</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()" style="font-size: 12px; padding: 4px 8px;">✕ Cerrar</button>
        </div>

        <!-- Pestañas de Métodos de Conexión -->
        <div style="display: flex; gap: 4px; border-bottom: 2px solid var(--color-border-dim); padding: 8px 16px 0; background: rgba(0,0,0,0.25); flex-shrink: 0;">
          <button type="button" class="btn-stage-preset ${st.activeTab === 'streamlabs' ? 'active' : ''}" style="font-size: 11px; padding: 6px 14px; font-weight: 700; ${st.activeTab === 'streamlabs' ? 'background: #10B981; color: #061A12;' : ''}" onclick="switchDonationModalTab('streamlabs')">
            ⚡ 1. Método Fácil: Streamlabs (Cero Túneles)
          </button>
          <button type="button" class="btn-stage-preset ${st.activeTab === 'webhooks' ? 'active' : ''}" style="font-size: 11px; padding: 6px 14px; font-weight: 700; ${st.activeTab === 'webhooks' ? 'background: #38BDF8; color: #041420;' : ''}" onclick="switchDonationModalTab('webhooks')">
            🌐 2. Webhooks Directos (Ko-fi / PayPal / BMC)
          </button>
          <button type="button" class="btn-stage-preset ${st.activeTab === 'test' ? 'active' : ''}" style="font-size: 11px; padding: 6px 14px; font-weight: 700; ${st.activeTab === 'test' ? 'background: #A78BFA; color: #140924;' : ''}" onclick="switchDonationModalTab('test')">
            🕹️ 3. Simulador y Pruebas en Vivo
          </button>
        </div>

        <div class="miniapp-modal-body" style="font-size: 12px; color: #E2E8F0; line-height: 1.6; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px;">
          
          <!-- ============================================================== -->
          <!-- PESTAÑA 1: MÉTODO STREAMLABS SOCKET (CERO TÚNELES)             -->
          <!-- ============================================================== -->
          <div style="display: ${st.activeTab === 'streamlabs' ? 'flex' : 'none'}; flex-direction: column; gap: 12px;">
            
            <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-size: 13px; font-weight: 700; color: #10B981; display: flex; align-items: center; gap: 6px;">
                  <span>⚡</span>
                  <span>¿Por qué es el método más recomendado?</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                  <span>Estado:</span>
                  <span id="streamlabs-status-badge" style="font-weight: 700; padding: 2px 8px; border-radius: 9999px; font-size: 10px; ${st.streamlabsConnected ? 'background: rgba(16,185,129,0.2); color: #10B981; border: 1px solid #10B981;' : 'background: rgba(239,68,68,0.2); color: #EF4444; border: 1px solid #EF4444;'}">
                    ${st.streamlabsConnected ? '● CONECTADO EN VIVO' : '○ NO CONECTADO'}
                  </span>
                </div>
              </div>
              <p style="margin: 0; font-size: 11px; color: var(--color-text-dim);">
                Si ya tienes tu cuenta de PayPal o Ko-fi vinculada a Streamlabs, tu overlay local puede conectarse como cliente seguro en segundo plano. 
                <strong>No necesitas instalar túneles, ni abrir puertos en el router, ni configurar dominios.</strong>
              </p>
            </div>

            <!-- Paso a Paso Streamlabs -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px;">
              <div style="font-weight: 700; color: #fff; font-size: 12px; margin-bottom: 10px;">
                📋 Pasos para conectar en 30 segundos:
              </div>
              <ol style="margin: 0 0 12px 18px; padding: 0; font-size: 11px; color: var(--color-text-dim); display: flex; flex-direction: column; gap: 6px;">
                <li>Entra en tu panel de Streamlabs en la sección: <a href="https://streamlabs.com/dashboard#/settings/api-settings" target="_blank" style="color: #38BDF8; text-decoration: underline;">Streamlabs API Settings</a></li>
                <li>Haz clic en la pestaña <strong>API Tokens</strong> y copia tu <strong>Socket API Token</strong>.</li>
                <li>Pégalo en el campo de abajo y pulsa <strong>Conectar Streamlabs</strong>. ¡Listo! Cada propina se reflejará sola.</li>
              </ol>

              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="password" id="input-streamlabs-token" class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4;" placeholder="Pega aquí tu Socket API Token (comienza por eyJ...)" value="${st.streamlabsToken || ''}">
                <button type="button" class="btn-stage-preset" onclick="togglePasswordVisibility('input-streamlabs-token')" style="font-size: 11px; padding: 6px 10px;">👁️</button>
                <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 14px; background: #10B981; color: #061A12; font-weight: 700;" onclick="saveStreamlabsToken()">
                  🟢 Conectar Streamlabs
                </button>
              </div>
            </div>

          </div>

          <!-- ============================================================== -->
          <!-- PESTAÑA 2: MÉTODO WEBHOOKS DIRECTOS CON TÚNEL                 -->
          <!-- ============================================================== -->
          <div style="display: ${st.activeTab === 'webhooks' ? 'flex' : 'none'}; flex-direction: column; gap: 12px;">
            
            <div style="background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.3); border-radius: 8px; padding: 14px;">
              <div style="font-size: 13px; font-weight: 700; color: #38BDF8; margin-bottom: 6px;">
                🌐 Tu Dominio Propio o Túnel Público (Ko-fi / PayPal / Buy Me a Coffee)
              </div>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: var(--color-text-dim); line-height: 1.5;">
                Para que Ko-fi, PayPal o BMC puedan notificar donaciones a tu ordenador en tiempo real, introduce aquí tu <strong>Dominio Propio</strong> o tu <strong>URL de túnel</strong>. Las URLs para cada plataforma se generarán listas para copiar:
              </p>
              
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                <input type="text" id="input-tunnel-url" class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #38BDF8;" placeholder="Ej: https://stream.tudominio.com o https://mi-tunnel.trycloudflare.com" value="${st.tunnelUrl || ''}" oninput="updateDonationTunnelUrlFromInput(this.value)">
                <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 14px;" onclick="saveTunnelUrl()">
                  💾 Guardar URL
                </button>
              </div>

              <!-- GUÍA CLARA: DOMINIO PROPIO VS TÚNEL -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
                <div style="background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.25); border-radius: 6px; padding: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <div style="font-size: 11px; font-weight: 700; color: #38BDF8;">🏷️ Si tienes un Dominio Propio:</div>
                    <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 6px;" onclick="toggleCustomDomainHelp()">📘 Ver Pasos</button>
                  </div>
                  <div style="font-size: 10px; color: var(--color-text-dim); line-height: 1.4;">
                    Usa tu subdominio (ej: <code style="color: #57D6C4;">https://stream.tudominio.com</code>). Debe tener <strong>HTTPS</strong> activo para que PayPal y Ko-fi lo acepten.
                  </div>
                </div>
                <div style="background: rgba(167,139,250,0.06); border: 1px solid rgba(167,139,250,0.25); border-radius: 6px; padding: 10px;">
                  <div style="font-size: 11px; font-weight: 700; color: #A78BFA; margin-bottom: 4px;">⚡ Si NO tienes dominio (Túnel Gratis):</div>
                  <div style="font-size: 10px; color: var(--color-text-dim); line-height: 1.4;">
                    Abre un túnel temporal gratuito en 1 segundo ejecutando en tu terminal:<br>
                    <code style="color: #57D6C4;">npx localtunnel --port 8080</code><br>
                    o <code style="color: #38BDF8;">cloudflared tunnel --url ${st.localBaseUrl}</code>
                  </div>
                </div>
              </div>

              <!-- DESPLEGABLE GUÍA PASO A PASO DOMINIO PROPIO -->
              <div id="custom-domain-tutorial" style="display: none; background: #07090B; border: 1px solid #38BDF8; border-radius: 6px; padding: 14px; margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="color: #38BDF8; font-size: 13px;">⚡ Auto-Configuradores: Sin tocar tu Router</strong>
                  <button type="button" style="background: none; border: none; color: var(--color-text-dim); cursor: pointer; font-size: 14px;" onclick="toggleCustomDomainHelp()">✕</button>
                </div>
                
                <p style="font-size: 11px; color: var(--color-text-dim); margin: 0 0 10px 0; line-height: 1.4;">
                  Elige cómo quieres conectar tu dominio permanente. Ambos métodos incluyen scripts automáticos en la carpeta <code>scripts/</code> que hacen todo el trabajo por ti:
                </p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  
                  <!-- OPCION 1: CLOUDFLARE -->
                  <div style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.3); border-radius: 6px; padding: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="font-size: 13px;">🚀</span>
                      <strong style="color: #10B981; font-size: 11px;">OPCIÓN 1: Cloudflare Tunnel Automático</strong>
                    </div>
                    <div style="font-size: 10px; color: var(--color-text-dim); margin-bottom: 8px; line-height: 1.4;">
                      • Solo necesitas tener tu dominio en Cloudflare (gratis).<br>
                      • El script descarga el conector, crea el túnel, enruta el DNS de tu subdominio y lo deja funcionando.
                    </div>
                    <div style="font-size: 10px; color: #57D6C4; margin-bottom: 4px; font-weight: 700;">Ejecuta en tu terminal:</div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <input type="text" id="cmd-auto-cloudflare" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 10px; background: #000; color: #57D6C4; padding: 4px 6px;" value="./scripts/setup_cloudflare.sh ${st.tunnelUrl ? st.tunnelUrl.replace(/^https?:\/\//, '') : 'stream.tudominio.com'}">
                      <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 4px 8px; white-space: nowrap;" onclick="copyText(document.getElementById('cmd-auto-cloudflare').value)">📋 Copiar</button>
                    </div>
                  </div>

                  <!-- OPCION 2: VPS SSH REVERSE -->
                  <div style="background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.3); border-radius: 6px; padding: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="font-size: 13px;">🖥️</span>
                      <strong style="color: #38BDF8; font-size: 11px;">OPCIÓN 2: VPS + Nginx / Traefik Inverso</strong>
                    </div>
                    <div style="font-size: 10px; color: var(--color-text-dim); margin-bottom: 8px; line-height: 1.4;">
                      • Si tienes un servidor VPS (Hetzner, OVH, etc.).<br>
                      • El script genera el bloque Nginx para tu VPS y crea un servicio systemd en tu PC para auto-reconectar siempre.
                    </div>
                    <div style="font-size: 10px; color: #38BDF8; margin-bottom: 4px; font-weight: 700;">Ejecuta en tu terminal:</div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <input type="text" id="cmd-auto-vps" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 10px; background: #000; color: #38BDF8; padding: 4px 6px;" value="./scripts/setup_vps_tunnel.sh root@tu-vps.com ${st.tunnelUrl ? st.tunnelUrl.replace(/^https?:\/\//, '') : 'stream.tudominio.com'}">
                      <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 4px 8px; white-space: nowrap;" onclick="copyText(document.getElementById('cmd-auto-vps').value)">📋 Copiar</button>
                    </div>
                  </div>

                </div>

                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--color-text-dim); border-top: 1px solid var(--color-border-dim); padding-top: 8px;">
                  <span>📖 Guía detallada con explicaciones paso a paso en <strong style="color: #fff;">docs/DOMINIO_PROPIO_Y_WEBHOOKS.md</strong></span>
                  <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 8px;" onclick="toggleCustomDomainHelp()">Ocultar Asistente</button>
                </div>
              </div>
            </div>

            <!-- TARJETAS CON URLs LISTAS PARA COPIAR -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
              
              <!-- KO-FI -->
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(41,171,226,0.3); border-radius: 6px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="color: #29ABE2; font-size: 12px;">☕ 1. Webhook para Ko-fi:</strong>
                  <span style="font-size: 10px; color: var(--color-text-dim);">Ko-fi > Settings > API > Advanced Webhooks</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #07090B; color: #29ABE2;" value="${activeUrl}/api/webhooks/kofi" id="webhook-url-kofi">
                  <button type="button" class="btn-stage-preset" onclick="copyText(document.getElementById('webhook-url-kofi').value)" style="font-size: 11px; white-space: nowrap;">📋 Copiar</button>
                </div>
              </div>

              <!-- PAYPAL -->
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,121,193,0.3); border-radius: 6px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="color: #38BDF8; font-size: 12px;">🅿️ 2. Webhook / IPN para PayPal:</strong>
                  <span style="font-size: 10px; color: var(--color-text-dim);">PayPal > Notificación de Pago IPN o Developer Webhook</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #07090B; color: #38BDF8;" value="${activeUrl}/api/webhooks/paypal" id="webhook-url-paypal">
                  <button type="button" class="btn-stage-preset" onclick="copyText(document.getElementById('webhook-url-paypal').value)" style="font-size: 11px; white-space: nowrap;">📋 Copiar</button>
                </div>
              </div>

              <!-- BUY ME A COFFEE -->
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,221,0,0.3); border-radius: 6px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="color: #FFDD00; font-size: 12px;">🟡☕ 3. Webhook para Buy Me a Coffee:</strong>
                  <span style="font-size: 10px; color: var(--color-text-dim);">BMC > Settings > Integrations & Webhooks > Supporter</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #07090B; color: #FFDD00;" value="${activeUrl}/api/webhooks/buymeacoffee" id="webhook-url-bmc">
                  <button type="button" class="btn-stage-preset" onclick="copyText(document.getElementById('webhook-url-bmc').value)" style="font-size: 11px; white-space: nowrap;">📋 Copiar</button>
                </div>
              </div>

            </div>

            <!-- Comandos de Túnel de 1 línea -->
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
              <div style="font-size: 11px; font-weight: 700; color: #fff; margin-bottom: 6px;">
                💡 ¿Cómo abrir un túnel gratuito en tu terminal en 1 segundo?
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div style="background: #0B0D0F; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
                  <div style="font-size: 10px; color: #57D6C4; font-weight: 700;">Opción A (Usa Node.js ya instalado):</div>
                  <code style="font-size: 10px; color: #A78BFA; display: block; margin-top: 3px;">npx localtunnel --port 8080</code>
                </div>
                <div style="background: #0B0D0F; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
                  <div style="font-size: 10px; color: #38BDF8; font-weight: 700;">Opción B (Cloudflare Oficial):</div>
                  <code style="font-size: 10px; color: #A78BFA; display: block; margin-top: 3px;">cloudflared tunnel --url ${st.localBaseUrl}</code>
                </div>
              </div>
            </div>

          </div>

          <!-- ============================================================== -->
          <!-- PESTAÑA 3: PRUEBAS EN VIVO Y SIMULACIÓN                        -->
          <!-- ============================================================== -->
          <div style="display: ${st.activeTab === 'test' ? 'flex' : 'none'}; flex-direction: column; gap: 12px;">
            
            <div style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.3); border-radius: 8px; padding: 14px;">
              <div style="font-size: 13px; font-weight: 700; color: #A78BFA; margin-bottom: 6px;">
                🕹️ Simular Donaciones en Vivo (Sin Internet)
              </div>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: var(--color-text-dim);">
                Haz clic en cualquiera de estos botones para disparar una donación de prueba y verificar cómo se ve la animación en el Ticker y en OBS:
              </p>
              
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button type="button" class="btn-action-test" style="border-color: #29ABE2; color: #29ABE2; font-size: 11px; padding: 8px 14px;" onclick="simulateTipTest('kofi')">
                  ☕ Simular Ko-fi (5.00 €)
                </button>
                <button type="button" class="btn-action-test" style="border-color: #0079C1; color: #38BDF8; font-size: 11px; padding: 8px 14px;" onclick="simulateTipTest('paypal')">
                  🅿️ Simular PayPal (15.00 EUR)
                </button>
                <button type="button" class="btn-action-test" style="border-color: #FFDD00; color: #FFDD00; font-size: 11px; padding: 8px 14px;" onclick="simulateTipTest('buymeacoffee')">
                  🟡 Simular BuyMeACoffee (3 Cafés - 9 €)
                </button>
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--color-text-dim); text-transform: uppercase; margin-bottom: 6px;">
                🎮 Botón para Stream Deck / OpenDeck (Petición HTTP Local):
              </div>
              <pre style="margin: 0; background: #0B0D0F; color: #57D6C4; padding: 8px; border-radius: 4px; font-size: 10px; overflow-x: auto;">curl -X POST ${st.localBaseUrl}/api/tips/simulate \\
  -H "Content-Type: application/json" \\
  -d '{"platform":"paypal","user":"MakerAmigo","amount":"10.00","currency":"EUR"}'</pre>
            </div>

          </div>

        </div>
      </div>
    </div>
  `;
  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations(modalContainer);
  }
}

function updateDonationTunnelUrlFromInput(val) {
  if (window._donationsModalState) {
    window._donationsModalState.tunnelUrl = val;
    const base = val && val.trim().length > 4 ? val.trim().replace(/\/+$/, '') : window._donationsModalState.localBaseUrl;
    const elKofi = document.getElementById('webhook-url-kofi');
    const elPaypal = document.getElementById('webhook-url-paypal');
    const elBmc = document.getElementById('webhook-url-bmc');
    if (elKofi) elKofi.value = `${base}/api/webhooks/kofi`;
    if (elPaypal) elPaypal.value = `${base}/api/webhooks/paypal`;
    if (elBmc) elBmc.value = `${base}/api/webhooks/buymeacoffee`;

    const cleanDomain = (val || '').replace(/^https?:\/\//, '').replace(/\/+$/, '') || 'stream.tudominio.com';
    const elCmdCf = document.getElementById('cmd-auto-cloudflare');
    const elCmdVps = document.getElementById('cmd-auto-vps');
    if (elCmdCf) elCmdCf.value = `./scripts/setup_cloudflare.sh ${cleanDomain}`;
    if (elCmdVps) elCmdVps.value = `./scripts/setup_vps_tunnel.sh root@tu-vps.com ${cleanDomain}`;
  }
}

async function saveStreamlabsToken() {
  const input = document.getElementById('input-streamlabs-token');
  if (!input) return;
  const token = input.value.trim();
  try {
    const res = await fetch('/api/donations/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Local-Token': window.__LOCAL_AUTH_TOKEN__ || ''
      },
      body: JSON.stringify({ streamlabsToken: token })
    });
    if (res.ok) {
      if (window._donationsModalState) {
        window._donationsModalState.streamlabsToken = token;
        window._donationsModalState.streamlabsConnected = token.length > 0;
      }
      const badge = document.getElementById('streamlabs-status-badge');
      if (badge) {
        badge.textContent = token.length > 0 ? '● CONECTADO EN VIVO' : '○ NO CONECTADO';
        badge.style.color = token.length > 0 ? '#10B981' : '#EF4444';
        badge.style.borderColor = token.length > 0 ? '#10B981' : '#EF4444';
      }
      alert('✓ Token de Streamlabs guardado. El servidor está escuchando alertas de donaciones.');
    }
  } catch (e) {
    alert('Error guardando token: ' + e);
  }
}

async function saveTunnelUrl() {
  const input = document.getElementById('input-tunnel-url');
  if (!input) return;
  let url = input.value.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
    input.value = url;
  }
  url = url.replace(/\/+$/, '');
  try {
    const res = await fetch('/api/donations/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Local-Token': window.__LOCAL_AUTH_TOKEN__ || ''
      },
      body: JSON.stringify({ tunnelUrl: url })
    });
    if (res.ok) {
      if (window._donationsModalState) window._donationsModalState.tunnelUrl = url;
      alert('✓ Dominio / URL de túnel guardada correctamente.');
    }
  } catch (e) {
    alert('Error guardando URL: ' + e);
  }
}

function togglePasswordVisibility(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

async function simulateTipTest(platform) {
  try {
    const payloads = {
      kofi: { platform: 'kofi', user: 'KofiMaker', amount: '5.00', currency: 'EUR', message: '¡Gran stream!' },
      paypal: { platform: 'paypal', user: 'PayPalFan', amount: '15.00', currency: 'EUR', message: 'Para estaño y placas.' },
      buymeacoffee: { platform: 'buymeacoffee', user: 'CafeSupporter', amount: '9.00', currency: 'EUR', message: '3 cafés para el stream.' }
    };
    const body = payloads[platform] || payloads.kofi;
    const resp = await fetch('/api/tips/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Local-Token': window.__LOCAL_AUTH_TOKEN__ || ''
      },
      body: JSON.stringify(body)
    });
    if (resp.ok) {
      const simToast = `✓ Donación simulada de ${body.user} (${body.amount}€)`;
      if (window.OverlayTexts && typeof OverlayTexts.showToast === 'function') {
        OverlayTexts.showToast(simToast);
      } else if (window.showToast) {
        window.showToast(simToast);
      }
      else alert(`✓ Donación simulada de ${body.user} (${body.amount}€)`);
    }
  } catch (e) {
    console.error('Error simulando propina:', e);
  }
}

function toggleCustomDomainHelp() {
  const el = document.getElementById('custom-domain-tutorial');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

window.openDonationsModal = openDonationsModal;
window.simulateTipTest = simulateTipTest;
window.switchDonationModalTab = switchDonationModalTab;
window.updateDonationTunnelUrlFromInput = updateDonationTunnelUrlFromInput;
window.saveStreamlabsToken = saveStreamlabsToken;
window.saveTunnelUrl = saveTunnelUrl;
window.toggleCustomDomainHelp = toggleCustomDomainHelp;
window.togglePasswordVisibility = togglePasswordVisibility;

