
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
                POST ${window.location.origin}/api/widgets/action<br>
                Content-Type: application/json
              </div>
              <div style="background: #0B0D0F; border: 1px solid rgba(87,214,196,0.3); border-radius: 4px; padding: 8px; font-family: monospace; font-size: 10px; color: #38BDF8;">
                <b style="color: #57D6C4;">GET (1 Clic para Decks / Teclas):</b><br>
                GET ${window.location.origin}/api/deck/widget?widget=${wKey}&action=...<br>
                <b style="color: #F59E0B;">Knobs / Perillas (Ajazz AKP05):</b><br>
                GET ${window.location.origin}/api/deck/knob?knob=1&direction=up
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
                    URL 1-clic: <span style="color: #38BDF8;">${window.location.origin}/api/deck/widget?widget=${wKey}&action=${act.action}</span>
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
              ${g.wsInfo} Dirección: <code>${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws</code>. Sin latencia ni necesidad de recargar la fuente de navegador en OBS Studio.
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
