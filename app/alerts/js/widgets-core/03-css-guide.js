
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
